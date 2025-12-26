import { useEffect, useState, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { CodeEditor } from "../CodeEditor";
import { InfoEditor } from "./InfoEditor";
import { ServersEditor } from "./ServersEditor";
import { SecurityEditor } from "./SecurityEditor";
import { TagsEditor } from "./TagsEditor";
import { ComponentsEditor, type ComponentSection } from "./Components";
import { PathEditor } from "./PathEditor";
import { AddPathPopover } from "./AddPathPopover";
import { Button } from "../ui/Button";
import { Code, LayoutTemplate, ChevronRight, ChevronDown } from "lucide-react";
import { useStore, selectOpenapi } from "../../store/useStore";
import { cn, getMethodColor } from "../../lib/utils";
import type {
  InfoObject,
  ServerObject,
  SecurityRequirementObject,
  ComponentsObject,
  PathItemObject,
  OperationObject,
  TagObject,
} from "openapi3-ts/oas31";

type EditorSection =
  | "info"
  | "servers"
  | "security"
  | "tags"
  | "components"
  | "paths";

export const OpenAPIEditor = () => {
  const [view, setView] = useState<"form" | "code">("form");
  const [activeSection, setActiveSection] = useState<EditorSection>("info");
  const [activeComponentSection, setActiveComponentSection] =
    useState<ComponentSection>("schemas");
  const [isComponentsExpanded, setIsComponentsExpanded] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeFilePath = useStore((state) => state.activeFilePath);
  const openapi = useStore(selectOpenapi);
  const setRawContent = useStore((state) => state.setRawContent);
  const updateDocument = useStore((state) => state.updateDocument);

  // 加载文件
  useEffect(() => {
    if (!activeFilePath || view !== "form") return;

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
  }, [activeFilePath, view, setRawContent]);

  const handleInfoChange = useCallback(
    (infoData: InfoObject) => {
      updateDocument((data) => ({ ...data, info: infoData }), activeFilePath);
    },
    [updateDocument, activeFilePath]
  );

  const handleServersChange = useCallback(
    (serversData: ServerObject[]) => {
      updateDocument((data) => {
        console.log(data, serversData);
        return { ...data, servers: serversData };
      }, activeFilePath);
    },
    [updateDocument, activeFilePath]
  );

  const handleSecurityChange = useCallback(
    (securityData: SecurityRequirementObject[]) => {
      updateDocument(
        (data) => ({ ...data, security: securityData }),
        activeFilePath
      );
    },
    [updateDocument, activeFilePath]
  );

  const handleComponentsChange = useCallback(
    (componentsData: ComponentsObject) => {
      updateDocument(
        (data) => ({ ...data, components: componentsData }),
        activeFilePath
      );
    },
    [updateDocument, activeFilePath]
  );

  const handleTagsChange = useCallback(
    (tagsData: TagObject[]) => {
      updateDocument((data) => ({ ...data, tags: tagsData }), activeFilePath);
    },
    [updateDocument, activeFilePath]
  );

  const handleAddPath = useCallback(
    (path: string, methods: string[]) => {
      updateDocument((data) => {
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
      }, activeFilePath);

      setActiveSection("paths");
      setSelectedPath(path);
    },
    [updateDocument, activeFilePath]
  );

  const handlePathChange = useCallback(
    (pathKey: string, newPathItem: PathItemObject) => {
      updateDocument(
        (data) => ({
          ...data,
          paths: {
            ...data.paths,
            [pathKey]: newPathItem,
          },
        }),
        activeFilePath
      );
    },
    [updateDocument, activeFilePath]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <Button
            variant={view === "form" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("form")}
            className="gap-2"
          >
            <LayoutTemplate size={14} />
            Form
          </Button>
          <Button
            variant={view === "code" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("code")}
            className="gap-2"
          >
            <Code size={14} />
            Code
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === "form" ? (
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
                              {section.charAt(0).toUpperCase() +
                                section.slice(1)}
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
                      data={
                        (openapi.paths?.[selectedPath] as PathItemObject) || {}
                      }
                      servers={openapi.servers}
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
        ) : (
          <CodeEditor />
        )}
      </div>
    </div>
  );
};
