import { ChevronDown, ChevronRight } from "lucide-react";
import type {
  ComponentsObject,
  InfoObject,
  OperationObject,
  PathItemObject,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "../../../store/useStore";
import YAML from "yaml";
import { saveOpenapiYamlDocument } from "../../../lib/saveOpenapiYamlDocument";

type EditorSection =
  | "info"
  | "servers"
  | "security"
  | "tags"
  | "components"
  | "paths";

export default function OpenAPIFormEditor() {
  const [isLoading, setIsLoading] = useState(false);
  const [rawContent, setRawContent] = useState("");

  const activeFilePath = useStore((state) => state.activeFilePath);

  // 从 rawContent 派生 openapi
  const openapi = useMemo<OpenAPIObject>(() => {
    if (!rawContent) {
      return {
        openapi: "3.1.0",
        info: { title: "New API", version: "1.0.0" },
        paths: {},
      };
    }

    try {
      return YAML.parse(rawContent) as OpenAPIObject;
    } catch (error) {
      console.error("Failed to parse OpenAPI:", error);
      return {
        openapi: "3.1.0",
        info: { title: "New API", version: "1.0.0" },
        paths: {},
      };
    }
  }, [rawContent]);

  // 加载文件
  useEffect(() => {
    if (!activeFilePath) return;

    const loadFile = async () => {
      setIsLoading(true);
      try {
        const content = await window.ipcRenderer.readFile(activeFilePath);
        setRawContent(content);
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

  const handleInfoChange = useCallback(
    (infoData: InfoObject) => {
      const newContent = saveOpenapiYamlDocument(
        rawContent,
        (data) => ({ ...data, info: infoData }),
        activeFilePath
      );
      if (newContent) setRawContent(newContent);
    },
    [activeFilePath, rawContent]
  );

  const handleServersChange = useCallback(
    (serversData: ServerObject[]) => {
      const newContent = saveOpenapiYamlDocument(
        rawContent,
        (data) => {
          console.log(data, serversData);
          return { ...data, servers: serversData };
        },
        activeFilePath
      );
      if (newContent) setRawContent(newContent);
    },
    [activeFilePath, rawContent]
  );

  const handleSecurityChange = useCallback(
    (securityData: SecurityRequirementObject[]) => {
      const newContent = saveOpenapiYamlDocument(
        rawContent,
        (data) => ({ ...data, security: securityData }),
        activeFilePath
      );
      if (newContent) setRawContent(newContent);
    },
    [activeFilePath, rawContent]
  );

  const handleComponentsChange = useCallback(
    (componentsData: ComponentsObject) => {
      const newContent = saveOpenapiYamlDocument(
        rawContent,
        (data) => ({ ...data, components: componentsData }),
        activeFilePath
      );
      if (newContent) setRawContent(newContent);
    },
    [activeFilePath, rawContent]
  );

  const handleTagsChange = useCallback(
    (tagsData: TagObject[]) => {
      const newContent = saveOpenapiYamlDocument(
        rawContent,
        (data) => ({ ...data, tags: tagsData }),
        activeFilePath
      );
      if (newContent) setRawContent(newContent);
    },
    [activeFilePath, rawContent]
  );

  const handleAddPath = useCallback(
    (path: string, methods: string[]) => {
      const newContent = saveOpenapiYamlDocument(
        rawContent,
        (data) => {
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

          return {
            ...data,
            paths: {
              ...data.paths,
              [path]: newPathItem,
            },
          };
        },
        activeFilePath
      );

      if (newContent) setRawContent(newContent);
      setActiveSection("paths");
      setSelectedPath(path);
    },
    [activeFilePath, rawContent]
  );

  const handlePathChange = useCallback(
    (pathKey: string, newPathItem: PathItemObject) => {
      const newContent = saveOpenapiYamlDocument(
        rawContent,
        (data) => ({
          ...data,
          paths: {
            ...data.paths,
            [pathKey]: newPathItem,
          },
        }),
        activeFilePath
      );
      if (newContent) setRawContent(newContent);
    },
    [activeFilePath, rawContent]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* Sidebar TOC */}
      <Panel
        defaultSize={20}
        minSize={15}
        maxSize={40}
        className="border-r border-[#3e3e42] bg-[#252526] flex flex-col"
      >
        <PanelGroup direction="vertical">
          <Panel
            defaultSize={40}
            maxSize={50}
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
                    : "text-gray-400 border-l-2 border-transparent"
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
                    : "text-gray-400 border-l-2 border-transparent"
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
                    : "text-gray-400 border-l-2 border-transparent"
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
                    : "text-gray-400 border-l-2 border-transparent"
                )}
              >
                Tags
              </button>

              {/* Components Section */}
              <div className="flex-none">
                <button
                  onClick={() => setIsComponentsExpanded(!isComponentsExpanded)}
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
                            section as ComponentSection
                          );
                          setSelectedPath(null);
                        }}
                        className={cn(
                          "w-full px-4 py-2 pl-10 text-xs text-left hover:bg-[#2a2d2e] transition-colors",
                          activeSection === "components" &&
                            activeComponentSection === section
                            ? "text-blue-400 font-medium bg-[#2a2d2e]"
                            : "text-gray-500"
                        )}
                      >
                        {section.charAt(0).toUpperCase() + section.slice(1)}
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
                    className={cn(
                      "w-full px-4 py-2 text-sm text-left hover:bg-[#2a2d2e] transition-colors flex flex-col gap-1 border-b border-[#3e3e42]/50 flex-none",
                      activeSection === "paths" && selectedPath === path
                        ? "bg-[#37373d] text-white border-l-2 border-blue-500 border-b-transparent"
                        : "text-gray-400 border-l-2 border-transparent"
                    )}
                  >
                    <span className="truncate font-medium w-full">{path}</span>
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
                            ]
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
                              getMethodColor(method)
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
              />
            )}
          </div>
        )}
      </Panel>
    </PanelGroup>
  );
}
