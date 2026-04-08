import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import Graph from 'graphology';
import Sigma from 'sigma';
import { createNodeBorderProgram } from '@sigma/node-border';
import { EdgeArrowProgram } from 'sigma/rendering';

interface D3ForceNode extends SimulationNodeDatum {
  id: string;
  isCenter: boolean;
}

interface D3ForceLink extends SimulationLinkDatum<D3ForceNode> {
  source: string | D3ForceNode;
  target: string | D3ForceNode;
}

export interface OntologyGraphCanvasNode {
  id: string;
  label: string;
  subtitle?: string;
  color: string;
  isCenter?: boolean;
  typeKey?: string;
}

export interface OntologyGraphCanvasEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  color?: string;
}

export interface OntologyGraphCanvasLegendItem {
  key: string;
  label: string;
  color: string;
  shape?: 'dot' | 'line';
}

/** Blend a hex color towards white by a given ratio (0 = original, 1 = white) */
const blendCache = new Map<string, string>();
function blendWithWhite(hex: string, ratio: number): string {
  const key = `${hex}:${ratio}`;
  const cached = blendCache.get(key);
  if (cached) {
    return cached;
  }
  const r = Math.round(
    parseInt(hex.slice(1, 3), 16) +
      (255 - parseInt(hex.slice(1, 3), 16)) * ratio,
  );
  const g = Math.round(
    parseInt(hex.slice(3, 5), 16) +
      (255 - parseInt(hex.slice(3, 5), 16)) * ratio,
  );
  const b = Math.round(
    parseInt(hex.slice(5, 7), 16) +
      (255 - parseInt(hex.slice(5, 7), 16)) * ratio,
  );
  const result = `rgb(${r},${g},${b})`;
  blendCache.set(key, result);
  return result;
}

/** Escape HTML special characters to prevent XSS in tooltip content */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function OntologyGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  nodeLegendTitle,
  edgeLegendTitle,
  nodeLegendItems,
  edgeLegendItems,
  loading,
  error,
  emptyText,
  onNodeClick,
  onDeselectNode,
  paused = false,
  height = 680,
}: {
  nodes: OntologyGraphCanvasNode[];
  edges: OntologyGraphCanvasEdge[];
  selectedNodeId?: string;
  nodeLegendTitle: string;
  edgeLegendTitle: string;
  nodeLegendItems: OntologyGraphCanvasLegendItem[];
  edgeLegendItems: OntologyGraphCanvasLegendItem[];
  loading?: boolean;
  error?: string;
  emptyText: string;
  onNodeClick?: (nodeId: string) => void;
  onDeselectNode?: () => void;
  paused?: boolean;
  height?: number | string;
}) {
  const safeNodes = React.useMemo(() => {
    const uniqueNodeMap = new Map<string, OntologyGraphCanvasNode>();
    nodes.forEach((item) => {
      uniqueNodeMap.set(item.id, item);
    });
    return Array.from(uniqueNodeMap.values());
  }, [nodes]);

  const nodeMap = React.useMemo(() => {
    return new Map(safeNodes.map((item) => [item.id, item]));
  }, [safeNodes]);

  const safeEdges = React.useMemo(() => {
    return edges.filter(
      (item) => nodeMap.has(item.source) && nodeMap.has(item.target),
    );
  }, [edges, nodeMap]);

  const [highlightedLegendKey, setHighlightedLegendKey] = React.useState<
    string | null
  >(null);

  const relatedNodeIds = React.useMemo(() => {
    if (!selectedNodeId || !nodeMap.has(selectedNodeId)) {
      return new Set<string>();
    }

    const related = new Set<string>([selectedNodeId]);
    safeEdges.forEach((edge) => {
      if (edge.source === selectedNodeId) {
        related.add(edge.target);
      }
      if (edge.target === selectedNodeId) {
        related.add(edge.source);
      }
    });
    return related;
  }, [selectedNodeId, nodeMap, safeEdges]);

  // --- Sigma renderer management ---
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const sigmaRef = React.useRef<Sigma | null>(null);
  const graphRef = React.useRef<Graph | null>(null);

  // Tooltip state
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);

  // Dragging state (kept in ref to avoid re-renders during drag)
  const dragStateRef = React.useRef<{
    dragging: boolean;
    draggedNode: string | null;
  }>({ dragging: false, draggedNode: null });

  // Refs for dynamic state accessed inside reducers (avoid stale closures)
  const onNodeClickRef = React.useRef(onNodeClick);
  const selectedNodeIdRef = React.useRef(selectedNodeId);
  const relatedNodeIdsRef = React.useRef(relatedNodeIds);
  const highlightedLegendKeyRef = React.useRef(highlightedLegendKey);
  const nodeMapRef = React.useRef(nodeMap);

  // Keep refs in sync before any effects fire (layout effect runs synchronously)
  React.useLayoutEffect(() => {
    onNodeClickRef.current = onNodeClick;
    selectedNodeIdRef.current = selectedNodeId;
    relatedNodeIdsRef.current = relatedNodeIds;
    highlightedLegendKeyRef.current = highlightedLegendKey;
    nodeMapRef.current = nodeMap;
  }, [onNodeClick, selectedNodeId, relatedNodeIds, highlightedLegendKey, nodeMap]);
  const simulationRef = React.useRef<Simulation<
    D3ForceNode,
    D3ForceLink
  > | null>(null);
  const idleAlphaTargetRef = React.useRef(0.025);

  // Build graph + sigma (single effect)
  React.useEffect(() => {
    if (safeNodes.length === 0 || !containerRef.current) {
      return;
    }

    const graph = new Graph({ multi: true });
    graphRef.current = graph;

    const totalNodes = safeNodes.length;
    const baseRadius = Math.max(80, Math.sqrt(totalNodes) * 22);
    const simulationNodes: D3ForceNode[] = safeNodes.map((node, index) => {
      const angle = (index / Math.max(totalNodes, 1)) * Math.PI * 2;
      const radiusJitter = 1 + (Math.random() - 0.5) * 0.08;
      return {
        id: node.id,
        isCenter: !!node.isCenter,
        x: Math.cos(angle) * baseRadius * radiusJitter,
        y: Math.sin(angle) * baseRadius * radiusJitter,
      };
    });
    const simulationNodeMap = new Map(
      simulationNodes.map((node) => [node.id, node]),
    );

    safeNodes.forEach((node) => {
      const simulationNode = simulationNodeMap.get(node.id);
      graph.addNode(node.id, {
        x: simulationNode?.x ?? 0,
        y: simulationNode?.y ?? 0,
        size: node.isCenter ? 13 : 9,
        color: node.color,
        label: node.label,
        typeKey: node.typeKey ?? '',
        borderColor: '#ffffff',
      });
    });

    safeEdges.forEach((edge) => {
      graph.addEdgeWithKey(edge.id, edge.source, edge.target, {
        label: edge.label,
        color: edge.color || '#94a3b8',
        size: 0.9,
      });
    });

    const simulationLinks: D3ForceLink[] = safeEdges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    // Create sigma renderer with reducers set from the start
    const NodeBorderProgram = createNodeBorderProgram({
      borders: [
        {
          size: { value: 0.15, mode: 'relative' },
          color: { attribute: 'borderColor' },
        },
        { size: { fill: true }, color: { attribute: 'color' } },
      ],
    });

    let refreshFrame = 0;
    const scheduleRefresh = () => {
      if (refreshFrame !== 0) {
        return;
      }

      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = 0;
        sigmaRef.current?.scheduleRender();
      });
    };

    const sigma = new Sigma(graph, containerRef.current!, {
      allowInvalidContainer: true,
      zIndex: true,
      hideLabelsOnMove: true,
      defaultNodeType: 'bordered',
      nodeProgramClasses: {
        bordered: NodeBorderProgram,
      },
      defaultEdgeType: 'arrow',
      edgeProgramClasses: {
        arrow: EdgeArrowProgram,
      },
      renderLabels: true,
      renderEdgeLabels: true,
      edgeLabelSize: 11,
      edgeLabelColor: { color: '#64748b' },
      labelSize: 13,
      labelWeight: '600',
      labelColor: { color: '#334155' },
      labelRenderedSizeThreshold: 4,
      labelDensity: 0.5,
      // Reducers read from refs so they always use latest state
      nodeReducer: (node, data) => {
        const curNodeMap = nodeMapRef.current;
        const curSelectedNodeId = selectedNodeIdRef.current;
        const curRelatedNodeIds = relatedNodeIdsRef.current;
        const curHighlightedLegendKey = highlightedLegendKeyRef.current;

        const nodeData = curNodeMap.get(node);
        const isSelected = node === curSelectedNodeId;
        const isRelated = curRelatedNodeIds.has(node);
        const isLegendHighlighted = curHighlightedLegendKey
          ? nodeData?.typeKey === curHighlightedLegendKey
          : false;
        const dimmed =
          (!!curSelectedNodeId && !isRelated) ||
          (!!curHighlightedLegendKey && !isLegendHighlighted);

        return {
          ...data,
          size: nodeData?.isCenter
            ? 13
            : isSelected || isLegendHighlighted
              ? 11
              : 9,
          color: dimmed ? blendWithWhite(data.color as string, 0.75) : data.color,
          borderColor:
            isSelected || isLegendHighlighted ? '#111827' : '#ffffff',
          label: dimmed ? null : data.label,
          zIndex: isSelected ? 2 : isRelated || isLegendHighlighted ? 1 : 0,
          highlighted: isSelected,
        };
      },
      edgeReducer: (edge, data) => {
        const curSelectedNodeId = selectedNodeIdRef.current;
        const curHighlightedLegendKey = highlightedLegendKeyRef.current;

        const source = graph.source(edge);
        const target = graph.target(edge);
        const isRelated =
          !curSelectedNodeId ||
          source === curSelectedNodeId ||
          target === curSelectedNodeId;

        return {
          ...data,
          color: isRelated
            ? data.color
            : blendWithWhite(data.color as string, 0.85),
          size: isRelated ? 1.2 : 0.45,
          hidden: !!curHighlightedLegendKey && !isRelated ? true : data.hidden,
          forceLabel: !!curSelectedNodeId && isRelated,
          label: !!curSelectedNodeId && isRelated ? data.label : null,
          zIndex: !!curSelectedNodeId && isRelated ? 1 : 0,
        };
      },
    });

    sigmaRef.current = sigma;

    const linkDistance = safeEdges.length > 500 ? 55 : 78;
    const chargeStrength = safeEdges.length > 800 ? -260 : -340;
    const idleAlphaTarget = 0.025;
    idleAlphaTargetRef.current = idleAlphaTarget;
    const simulation = forceSimulation<D3ForceNode>(simulationNodes)
      .force('center', forceCenter(0, 0))
      .force(
        'charge',
        forceManyBody<D3ForceNode>()
          .theta(1.1)
          .strength((node) =>
            node.isCenter ? chargeStrength * 1.5 : chargeStrength,
          )
          .distanceMax(280),
      )
      .force(
        'link',
        forceLink<D3ForceNode, D3ForceLink>(simulationLinks)
          .id((node) => node.id)
          .distance((link) => {
            const sourceIsCenter =
              typeof link.source !== 'string' && link.source.isCenter;
            const targetIsCenter =
              typeof link.target !== 'string' && link.target.isCenter;
            return sourceIsCenter || targetIsCenter
              ? linkDistance * 1.15
              : linkDistance;
          })
          .strength(safeEdges.length > 700 ? 0.08 : 0.14),
      )
      .force(
        'collide',
        forceCollide<D3ForceNode>()
          .radius((node) => (node.isCenter ? 24 : 15))
          .strength(0.9),
      )
      .alpha(1)
      .alphaMin(0.02)
      .alphaTarget(idleAlphaTarget)
      .alphaDecay(0.046)
      .velocityDecay(0.35);
    simulationRef.current = simulation;

    // Build a position lookup for batch updates
    const posMap = new Map<string, { x: number; y: number }>();
    simulation.on('tick', () => {
      posMap.clear();
      for (const node of simulationNodes) {
        if (node.x !== undefined && node.y !== undefined) {
          posMap.set(node.id, { x: node.x, y: node.y });
        }
      }
      // Single batch update — fires one graphology event instead of 2*N
      graph.updateEachNodeAttributes((id, attr) => {
        const pos = posMap.get(id);
        if (pos) {
          attr.x = pos.x;
          attr.y = pos.y;
        }
        return attr;
      });

      scheduleRefresh();
    });

    simulation.on('end', () => {
      scheduleRefresh();
    });

    // --- Event handlers ---
    sigma.on('clickNode', ({ node }) => {
      setHighlightedLegendKey(null);
      onNodeClickRef.current?.(node);
    });

    sigma.on('clickStage', () => {
      // clicking empty space does nothing
      // (deselect is handled by parent via onDeselectNode, not auto)
    });

    // Tooltip on hover
    sigma.on('enterNode', ({ node }) => {
      const nodeData = nodeMapRef.current.get(node);
      if (!nodeData) {
        return;
      }
      const pos = sigma.getNodeDisplayData(node);
      if (!pos) {
        return;
      }
      const viewportPos = sigma.framedGraphToViewport(pos);
      setTooltip({
        x: viewportPos.x,
        y: viewportPos.y - 12,
        content: `<b>${escapeHtml(nodeData.label)}</b>${
          nodeData.subtitle ? `<br>${escapeHtml(nodeData.subtitle)}` : ''
        }`,
      });
      containerRef.current!.style.cursor = 'pointer';
    });

    sigma.on('leaveNode', () => {
      setTooltip(null);
      if (!dragStateRef.current.dragging) {
        containerRef.current!.style.cursor = 'default';
      }
    });

    // Drag support
    sigma.on('downNode', (e) => {
      dragStateRef.current = { dragging: true, draggedNode: e.node };
      const draggedNode = simulationNodeMap.get(e.node);
      if (draggedNode) {
        draggedNode.fx = draggedNode.x ?? 0;
        draggedNode.fy = draggedNode.y ?? 0;
      }
      sigma.getCamera().disable();
      simulation.alphaTarget(0.18).restart();
    });

    sigma.getMouseCaptor().on('mousemovebody', (e) => {
      if (!dragStateRef.current.dragging || !dragStateRef.current.draggedNode) {
        return;
      }

      const draggedNodeId = dragStateRef.current.draggedNode;
      const pos = sigma.viewportToGraph(e);
      graph.setNodeAttribute(draggedNodeId, 'x', pos.x);
      graph.setNodeAttribute(draggedNodeId, 'y', pos.y);

      const draggedNode = simulationNodeMap.get(draggedNodeId);
      if (draggedNode) {
        draggedNode.x = pos.x;
        draggedNode.y = pos.y;
        draggedNode.fx = pos.x;
        draggedNode.fy = pos.y;
      }

      scheduleRefresh();
      e.preventSigmaDefault();
      e.original.preventDefault();
      e.original.stopPropagation();
    });

    const handleMouseUp = () => {
      if (dragStateRef.current.dragging) {
        const draggedNodeId = dragStateRef.current.draggedNode;
        if (draggedNodeId) {
          const draggedNode = simulationNodeMap.get(draggedNodeId);
          if (draggedNode) {
            draggedNode.fx = null;
            draggedNode.fy = null;
          }
        }

        dragStateRef.current = { dragging: false, draggedNode: null };
        sigma.getCamera().enable();
        simulation.alphaTarget(idleAlphaTarget).alpha(0.22).restart();
      }
    };
    sigma.getMouseCaptor().on('mouseup', handleMouseUp);

    return () => {
      if (refreshFrame !== 0) {
        window.cancelAnimationFrame(refreshFrame);
      }
      simulationRef.current = null;
      simulation.stop();
      sigma.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    };
  }, [safeNodes, safeEdges]);

  // When highlight/selection state changes, just refresh sigma
  React.useEffect(() => {
    sigmaRef.current?.refresh();
  }, [selectedNodeId, relatedNodeIds, highlightedLegendKey]);

  React.useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) {
      return;
    }

    if (paused) {
      simulation.stop();
      return;
    }

    simulation.alphaTarget(idleAlphaTargetRef.current).restart();
  }, [paused]);

  const hasData = safeNodes.length > 0;

  return (
    <Box
      sx={{
        overflow: 'hidden',
        height,
        position: 'relative',
      }}
    >
      <Box
        component="div"
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at top, rgba(22, 119, 255, 0.08), transparent 35%), linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
        }}
      />

      {hasData ? (
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            left: 16,
            top: 16,
            zIndex: 3,
            px: 2.25,
            py: 1.75,
            minWidth: 240,
            maxWidth: 360,
            borderRadius: 2,
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.14)',
          }}
        >
          <Stack spacing={1.5}>
            <Stack spacing={0.5}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.6,
                  color: '#e11d8a',
                  mb: 1,
                }}
              >
                {nodeLegendTitle}
              </Typography>
              <Stack spacing={0.5}>
                {nodeLegendItems.map((item) => (
                  <Stack
                    key={item.key}
                    spacing={1}
                    onClick={() => {
                      setHighlightedLegendKey((prev) =>
                        prev === item.key ? null : item.key,
                      );
                      onDeselectNode?.();
                    }}
                    sx={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      borderRadius: 1,
                      px: 0.5,
                      mx: -0.5,
                      opacity:
                        highlightedLegendKey &&
                        highlightedLegendKey !== item.key
                          ? 0.4
                          : 1,
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.18)',
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 700, color: '#334155' }}
                    >
                      {item.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            <Stack spacing={0.5}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.6,
                  color: '#f97316',
                  mb: 1,
                }}
              >
                {edgeLegendTitle}
              </Typography>
              <Stack spacing={0.5}>
                {edgeLegendItems.map((item) => (
                  <Stack
                    key={item.key}
                    spacing={1}
                    sx={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: item.shape === 'line' ? 2 : 8,
                        borderRadius: item.shape === 'line' ? 999 : 8,
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 700, color: '#334155' }}
                    >
                      {item.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {/* Tooltip overlay */}
      {tooltip ? (
        <Box
          sx={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 10,
            pointerEvents: 'none',
            px: 1.5,
            py: 1,
            backgroundColor: 'rgba(0,0,0,0.82)',
            color: '#fff',
            borderRadius: 1,
            fontSize: 13,
            lineHeight: 1.6,
            minWidth: 170,
            whiteSpace: 'nowrap',
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      ) : null}

      {loading ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.72)',
            zIndex: 2,
          }}
        >
          <CircularProgress />
        </Box>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      ) : null}

      {!loading && !error && !hasData ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            textAlign: 'center',
            color: 'text.secondary',
            zIndex: 1,
          }}
        >
          <Typography>{emptyText}</Typography>
        </Box>
      ) : null}

      <Box
        ref={containerRef}
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          visibility: hasData && !error ? 'visible' : 'hidden',
        }}
      />
    </Box>
  );
}
