import { ChevronDown, ChevronRight } from "lucide-react";
import type {
  ComponentsObject,
  InfoObject,
  OperationObject,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  SecurityRequirementObject,
  ServerObject,
  TagObject,
  OpenAPIObject,
} from "openapi3-ts/oas31";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { cn, getMethodColor } from "../../../lib/utils";
import { AddPathPopover } from "./AddPathPopover";
import { ComponentsEditor, type ComponentSection } from "./Components";
import { InfoEditor } from "./InfoEditor";
import { PathEditor } from "./PathEditor";
import { SecurityEditor } from "./SecurityEditor";
import { ServersEditor } from "./ServersEditor";
import { TagsEditor } from "./TagsEditor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../../store/useStore";
import YAML, { type Document } from "yaml";
import { updateYamlDocument } from "../../../lib/updateYamlDocument";
import { ContextMenu, type ContextMenuItem } from "../../ui/ContextMenu";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";

type EditorSection =
  | "info"
  | "servers"
  | "security"
  | "tags"
  | "components"
  | "paths";

export default function OpenAPIFormEditor() {
  const [isLoading, setIsLoading] = useState(false);
  const [doc, setDoc] = useState<Document | null>(null);
  const docRef = useRef<Document | null>(null);

  const activeFilePath = useStore((state) => state.activeFilePath);

  // 从 doc 派生 openapi
  const openapi = useMemo<OpenAPIObject>(() => {
    if (!doc) {
      return {
        openapi: "3.1.0",
        info: { title: "New API", version: "1.0.0" },
        paths: {},
      };
    }

    try {
      return doc.toJS() as OpenAPIObject;
    } catch (error) {
      console.error("Failed to parse OpenAPI:", error);
      return {
        openapi: "3.1.0",
        info: { title: "New API", version: "1.0.0" },
        paths: {},
      };
    }
  }, [doc]);

  // 加载文件
  useEffect(() => {
    if (!activeFilePath) return;

    const loadFile = async () => {
      setIsLoading(true);
      try {
        const content = await window.ipcRenderer.readFile(activeFilePath);
        const parsedDoc = YAML.parseDocument(content);
        // @ts-expect-error - defaultStringType is not in the type definition
        parsedDoc.options.defaultStringType = "QUOTE_SINGLE";
        docRef.current = parsedDoc;
        setDoc(parsedDoc);
      } catch (error) {
        console.error("Failed to load OpenAPI file:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [activeFilePath]);

  const [activeSection, setActiveSection] = useState<EditorSection>("info");
  const [activeComponentSection, setActiveComponentSection] =
    useState<ComponentSection>("schemas");
  const [isComponentsExpanded, setIsComponentsExpanded] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
  } | null>(null);

  // Edit path popover state
  const [editPathPopover, setEditPathPopover] = useState<{
    open: boolean;
    path: string;
    x: number;
    y: number;
  }>({ open: false, path: "", x: 0, y: 0 });
  const [editPathValue, setEditPathValue] = useState("");

  const saveFile = useCallback(() => {
    if (!activeFilePath || !docRef.current) return;

    window.ipcRenderer
      .writeFile(
        activeFilePath,
        docRef.current.toString({
          lineWidth: 0,
        }),
      )
      .catch((error) => {
        console.error("Failed to save OpenAPI file:", error);
      });
  }, [activeFilePath]);

  const handleInfoChange = useCallback(
    (infoData: InfoObject) => {
      if (!docRef.current || !activeFilePath) return;

      const oldData = docRef.current.toJS() as OpenAPIObject;
      const newData = { ...oldData, info: infoData };

      updateYamlDocument(docRef.current, [], oldData, newData);

      // 触发重新渲染
      const cloned = docRef.current.clone();
      docRef.current = cloned;
      setDoc(cloned);

      saveFile();
    },
    [activeFilePath, saveFile],
  );

  const handleServersChange = useCallback(
    (serversData: ServerObject[]) => {
      if (!docRef.current || !activeFilePath) return;

      const oldData = docRef.current.toJS() as OpenAPIObject;
      const newData = { ...oldData, servers: serversData };

      updateYamlDocument(docRef.current, [], oldData, newData);

      // 触发重新渲染
      const cloned = docRef.current.clone();
      docRef.current = cloned;
      setDoc(cloned);

      saveFile();
    },
    [activeFilePath, saveFile],
  );

  const handleSecurityChange = useCallback(
    (securityData: SecurityRequirementObject[]) => {
      if (!docRef.current || !activeFilePath) return;

      const oldData = docRef.current.toJS() as OpenAPIObject;
      const newData = { ...oldData, security: securityData };

      updateYamlDocument(docRef.current, [], oldData, newData);

      // 触发重新渲染
      const cloned = docRef.current.clone();
      docRef.current = cloned;
      setDoc(cloned);

      saveFile();
    },
    [activeFilePath, saveFile],
  );

  const handleComponentsChange = useCallback(
    (componentsData: ComponentsObject) => {
      if (!docRef.current || !activeFilePath) return;

      const oldData = docRef.current.toJS() as OpenAPIObject;
      const newData = { ...oldData, components: componentsData };

      updateYamlDocument(docRef.current, [], oldData, newData);

      // 触发重新渲染
      const cloned = docRef.current.clone();
      docRef.current = cloned;
      setDoc(cloned);

      saveFile();
    },
    [activeFilePath, saveFile],
  );

  const handleTagsChange = useCallback(
    (tagsData: TagObject[]) => {
      if (!docRef.current || !activeFilePath) return;

      const oldData = docRef.current.toJS() as OpenAPIObject;
      const newData = { ...oldData, tags: tagsData };

      updateYamlDocument(docRef.current, [], oldData, newData);

      // 触发重新渲染
      const cloned = docRef.current.clone();
      docRef.current = cloned;
      setDoc(cloned);

      saveFile();
    },
    [activeFilePath, saveFile],
  );

  const handleAddPath = useCallback(
    (path: string, methods: string[]) => {
      if (!docRef.current || !activeFilePath) return;

      const oldData = docRef.current.toJS() as OpenAPIObject;
      const newPathItem: PathItemObject = {};
      methods.forEach((method) => {
        newPathItem[method as keyof PathItemObject] = {
          summary: `${method.toUpperCase()} ${path}`,
          responses: {
            "200": {
              description: "OK",
            },
          },
        } as OperationObject;
      });

      const newData = {
        ...oldData,
        paths: {
          ...oldData.paths,
          [path]: newPathItem,
        },
      };

      updateYamlDocument(docRef.current, [], oldData, newData);

      // 触发重新渲染
      const cloned = docRef.current.clone();
      docRef.current = cloned;
      setDoc(cloned);

      saveFile();

      setActiveSection("paths");
      setSelectedPath(path);
    },
    [activeFilePath, saveFile],
  );

  const handlePathChange = useCallback(
    (pathKey: string, newPathItem: PathItemObject) => {
      if (!docRef.current || !activeFilePath) return;

      const oldData = docRef.current.toJS() as OpenAPIObject;
      const newData = {
        ...oldData,
        paths: {
          ...oldData.paths,
          [pathKey]: newPathItem,
        },
      };

      updateYamlDocument(docRef.current, [], oldData, newData);

      // 触发重新渲染
      const cloned = docRef.current.clone();
      docRef.current = cloned;
      setDoc(cloned);

      saveFile();
    },
    [activeFilePath, saveFile],
  );

  const handlePathRename = useCallback(
    (oldPath: string, newPath: string) => {
      if (!docRef.current || !activeFilePath || oldPath === newPath) return;

      // Directly rename the key in the YAML AST to preserve position
      const pathsNode = docRef.current.getIn(["paths"]);
      if (pathsNode instanceof YAML.YAMLMap) {
        const pairIndex = pathsNode.items.findIndex(
          (pair) =>
            (pair.key instanceof YAML.Scalar ? pair.key.value : pair.key) ===
            oldPath,
        );
        if (pairIndex >= 0) {
          const pair = pathsNode.items[pairIndex];
          if (pair.key instanceof YAML.Scalar) {
            pair.key.value = newPath;
          } else {
            pair.key = new YAML.Scalar(newPath);
          }
        }
      }

      const cloned = docRef.current.clone();
      docRef.current = cloned;
      setDoc(cloned);
      setSelectedPath(newPath);

      saveFile();
    },
    [activeFilePath, saveFile],
  );

  const handleDeletePath = useCallback(
    (pathKey: string) => {
      if (!docRef.current || !activeFilePath) return;

      const oldData = docRef.current.toJS() as OpenAPIObject;
      const newPaths = { ...oldData.paths };
      delete newPaths[pathKey];
      const newData = { ...oldData, paths: newPaths };

      updateYamlDocument(docRef.current, [], oldData, newData);

      const cloned = docRef.current.clone();
      docRef.current = cloned;
      setDoc(cloned);

      if (selectedPath === pathKey) {
        setSelectedPath(null);
        setActiveSection("info");
      }

      saveFile();
    },
    [activeFilePath, saveFile, selectedPath],
  );

  const handleEditPath = useCallback(
    (oldPath: string, newPath: string) => {
      if (!docRef.current || !activeFilePath || oldPath === newPath) return;
      if (!newPath.trim()) return;

      // Extract param names from old and new paths
      const extractParams = (p: string) =>
        (p.match(/\{([^}]+)\}/g) || []).map((s) => s.slice(1, -1));
      const oldParams = extractParams(oldPath);
      const newParams = extractParams(newPath);

      // Rename the path key in YAML AST
      const pathsNode = docRef.current.getIn(["paths"]);
      if (pathsNode instanceof YAML.YAMLMap) {
        const pairIndex = pathsNode.items.findIndex(
          (pair) =>
            (pair.key instanceof YAML.Scalar ? pair.key.value : pair.key) ===
            oldPath,
        );
        if (pairIndex >= 0) {
          const pair = pathsNode.items[pairIndex];
          if (pair.key instanceof YAML.Scalar) {
            pair.key.value = newPath;
          } else {
            pair.key = new YAML.Scalar(newPath);
          }
        }
      }

      // Update path parameter names by position
      const oldOpenapi = docRef.current.toJS() as OpenAPIObject;
      const currentData = oldOpenapi.paths?.[newPath] as
        | PathItemObject
        | undefined;
      if (currentData) {
        const params = (currentData.parameters || []) as (
          | ParameterObject
          | ReferenceObject
        )[];

        let updated = false;
        const newParamsArr = params.map((p) => {
          if ("$ref" in p) return p;
          const param = p as ParameterObject;
          if (param.in !== "path") return p;

          const oldIdx = oldParams.indexOf(param.name);
          if (
            oldIdx >= 0 &&
            oldIdx < newParams.length &&
            newParams[oldIdx] !== param.name
          ) {
            updated = true;
            return { ...param, name: newParams[oldIdx] };
          }
          return p;
        });

        if (updated) {
          const oldPathItem = currentData;
          const newPathItem = { ...oldPathItem, parameters: newParamsArr };
          updateYamlDocument(
            docRef.current,
            ["paths", newPath],
            oldPathItem,
            newPathItem,
          );
        }
      }

      const cloned = docRef.current.clone();
      docRef.current = cloned;
      setDoc(cloned);
      setSelectedPath(newPath);

      saveFile();
    },
    [activeFilePath, saveFile],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <>
      <PanelGroup direction="horizontal" className="h-full">
        {/* Sidebar TOC */}
        <Panel
          defaultSize={20}
          minSize={15}
          maxSize={85}
          className="border-r border-[#3e3e42] bg-[#252526] flex flex-col"
        >
          <PanelGroup direction="vertical">
            <Panel
              defaultSize={40}
              minSize={15}
              maxSize={85}
              className="border-b border-[#3e3e42]"
            >
              <div className="h-full overflow-y-auto flex flex-col">
                <button
                  onClick={() => {
                    setActiveSection("info");
                    setSelectedPath(null);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-sm text-left hover:bg-[#2a2d2e] transition-colors flex-none",
                    activeSection === "info"
                      ? "bg-[#37373d] text-white font-medium border-l-2 border-blue-500"
                      : "text-gray-400 border-l-2 border-transparent",
                  )}
                >
                  Info
                </button>
                <button
                  onClick={() => {
                    setActiveSection("servers");
                    setSelectedPath(null);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-sm text-left hover:bg-[#2a2d2e] transition-colors flex-none",
                    activeSection === "servers"
                      ? "bg-[#37373d] text-white font-medium border-l-2 border-blue-500"
                      : "text-gray-400 border-l-2 border-transparent",
                  )}
                >
                  Servers
                </button>
                <button
                  onClick={() => {
                    setActiveSection("security");
                    setSelectedPath(null);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-sm text-left hover:bg-[#2a2d2e] transition-colors flex-none",
                    activeSection === "security"
                      ? "bg-[#37373d] text-white font-medium border-l-2 border-blue-500"
                      : "text-gray-400 border-l-2 border-transparent",
                  )}
                >
                  Security
                </button>
                <button
                  onClick={() => {
                    setActiveSection("tags");
                    setSelectedPath(null);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-sm text-left hover:bg-[#2a2d2e] transition-colors flex-none",
                    activeSection === "tags"
                      ? "bg-[#37373d] text-white font-medium border-l-2 border-blue-500"
                      : "text-gray-400 border-l-2 border-transparent",
                  )}
                >
                  Tags
                </button>

                {/* Components Section */}
                <div className="flex-none">
                  <button
                    onClick={() =>
                      setIsComponentsExpanded(!isComponentsExpanded)
                    }
                    className="w-full px-4 py-3 text-sm text-left hover:bg-[#2a2d2e] transition-colors text-gray-400 border-l-2 border-transparent flex items-center justify-between"
                  >
                    Components
                    {isComponentsExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>

                  {isComponentsExpanded && (
                    <div className="bg-[#1e1e1e]">
                      {[
                        "schemas",
                        "responses",
                        "parameters",
                        "examples",
                        "requestBodies",
                        "headers",
                        "securitySchemes",
                        "links",
                        "callbacks",
                      ].map((section) => (
                        <button
                          key={section}
                          onClick={() => {
                            setActiveSection("components");
                            setActiveComponentSection(
                              section as ComponentSection,
                            );
                            setSelectedPath(null);
                          }}
                          className={cn(
                            "w-full px-4 py-2 pl-10 text-xs text-left hover:bg-[#2a2d2e] transition-colors",
                            activeSection === "components" &&
                              activeComponentSection === section
                              ? "text-blue-400 font-medium bg-[#2a2d2e]"
                              : "text-gray-500",
                          )}
                        >
                          {section.charAt(0).toUpperCase() + section.slice(1)}
                          {(() => {
                            const count = Object.keys(
                              openapi.components?.[
                                section as keyof ComponentsObject
                              ] || {},
                            ).length;
                            return count > 0 ? (
                              <span className="ml-1 text-gray-600">
                                ({count})
                              </span>
                            ) : null;
                          })()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="h-[1px] bg-[#3e3e42] hover:bg-blue-500 transition-colors" />
            <Panel className="flex-1">
              <div className="h-full overflow-y-auto flex flex-col">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#252526] sticky top-0 flex items-center justify-between z-10">
                  <span>Paths</span>
                  <AddPathPopover onAdd={handleAddPath} />
                </div>
                {openapi?.paths &&
                  Object.entries(openapi.paths).map(([path, pathItem]) => (
                    <button
                      key={path}
                      onClick={() => {
                        setActiveSection("paths");
                        setSelectedPath(path);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, path });
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-sm text-left hover:bg-[#2a2d2e] transition-colors flex flex-col gap-1 border-b border-[#3e3e42]/50 flex-none",
                        activeSection === "paths" && selectedPath === path
                          ? "bg-[#37373d] text-white border-l-2 border-blue-500 border-b-transparent"
                          : "text-gray-400 border-l-2 border-transparent",
                      )}
                    >
                      <span className="truncate font-medium w-full">
                        {path}
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {[
                          "get",
                          "put",
                          "post",
                          "delete",
                          "options",
                          "head",
                          "patch",
                          "trace",
                        ]
                          .filter(
                            (method) =>
                              (pathItem as PathItemObject)[
                                method as keyof PathItemObject
                              ],
                          )
                          .map((method) => (
                            <span
                              key={method}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSection("paths");
                                setSelectedPath(path);
                                setSelectedMethod(method);
                              }}
                              className={cn(
                                "text-[10px] px-1 rounded uppercase cursor-pointer hover:brightness-110",
                                getMethodColor(method),
                              )}
                            >
                              {method}
                            </span>
                          ))}
                      </div>
                    </button>
                  ))}
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="w-[1px] bg-[#3e3e42] hover:bg-blue-500 transition-colors" />

        {/* Content Area */}
        <Panel className="flex-1 overflow-auto bg-[#1e1e1e]">
          {openapi && (
            <div className="h-full">
              {activeSection === "info" && (
                <InfoEditor
                  initialData={openapi.info}
                  onChange={handleInfoChange}
                />
              )}
              {activeSection === "servers" && (
                <ServersEditor
                  initialData={openapi.servers || []}
                  onChange={handleServersChange}
                />
              )}
              {activeSection === "security" && (
                <SecurityEditor
                  initialData={openapi.security || []}
                  onChange={handleSecurityChange}
                />
              )}
              {activeSection === "tags" && (
                <TagsEditor
                  initialData={openapi.tags || []}
                  onChange={handleTagsChange}
                />
              )}
              {activeSection === "components" && (
                <ComponentsEditor
                  initialData={openapi.components || {}}
                  activeSection={activeComponentSection}
                  onChange={handleComponentsChange}
                />
              )}
              {activeSection === "paths" && selectedPath && (
                <PathEditor
                  path={selectedPath}
                  data={(openapi.paths?.[selectedPath] as PathItemObject) || {}}
                  servers={openapi.servers}
                  openapi={openapi}
                  initialMethod={selectedMethod}
                  onChange={(newPathItem) =>
                    handlePathChange(selectedPath, newPathItem)
                  }
                  onPathRename={(newPath) =>
                    handlePathRename(selectedPath, newPath)
                  }
                />
              )}
            </div>
          )}
        </Panel>
      </PanelGroup>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={
            [
              {
                label: "Edit Path",
                onClick: () => {
                  setEditPathValue(contextMenu.path);
                  setEditPathPopover({
                    open: true,
                    path: contextMenu.path,
                    x: contextMenu.x,
                    y: contextMenu.y,
                  });
                },
              },
              {
                label: "Delete Path",
                variant: "destructive",
                onClick: () => handleDeletePath(contextMenu.path),
              },
            ] as ContextMenuItem[]
          }
        />
      )}

      {/* Edit Path Popover — positioned at context menu location */}
      {editPathPopover.open && (
        <div
          className="fixed z-50"
          style={{ left: editPathPopover.x, top: editPathPopover.y }}
        >
          <div className="w-80 p-3 rounded-md border border-[#3e3e42] bg-[#1e1e1e] shadow-md animate-in fade-in-0 zoom-in-95">
            <div className="space-y-2">
              <h4 className="font-medium leading-none text-white text-xs">
                Edit Path
              </h4>
              <Input
                value={editPathValue}
                onChange={(e) => setEditPathValue(e.target.value)}
                placeholder="/pets/{petId}"
                className="font-mono h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEditPath(editPathPopover.path, editPathValue.trim());
                    setEditPathPopover({ open: false, path: "", x: 0, y: 0 });
                  }
                  if (e.key === "Escape") {
                    setEditPathPopover({ open: false, path: "", x: 0, y: 0 });
                  }
                }}
              />
              <p className="text-[11px] text-gray-500">
                Path parameters will be updated automatically.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    setEditPathPopover({ open: false, path: "", x: 0, y: 0 })
                  }
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    handleEditPath(editPathPopover.path, editPathValue.trim());
                    setEditPathPopover({ open: false, path: "", x: 0, y: 0 });
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
