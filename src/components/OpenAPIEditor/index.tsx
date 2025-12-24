import { useEffect, useState } from "react";
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
import { useStore } from "../../store/useStore";
import { parseOpenAPI } from "../../lib/openapi";
import YAML from "yaml";
import { cn, getMethodColor } from "../../lib/utils";
import type {
  OpenAPIObject,
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

const updateYamlDocument = (
  doc: YAML.Document,
  path: (string | number)[],
  oldVal: unknown,
  newVal: unknown
) => {
  if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;

  // Handle Arrays specifically to preserve structure
  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    const oldLen = oldVal.length;
    const newLen = newVal.length;
    const minLen = Math.min(oldLen, newLen);

    // Update existing items
    for (let i = 0; i < minLen; i++) {
      updateYamlDocument(doc, [...path, i], oldVal[i], newVal[i]);
    }

    // Add new items
    for (let i = oldLen; i < newLen; i++) {
      doc.setIn([...path, i], newVal[i]);
    }

    // Delete extra items (reverse order)
    for (let i = oldLen - 1; i >= newLen; i--) {
      doc.deleteIn([...path, i]);
    }

    // Force block style for tags
    if (path[path.length - 1] === "tags") {
      const node = doc.getIn(path, true) as { flow?: boolean };
      if (node && "flow" in node) {
        node.flow = false;
      }
    }
    return;
  }

  // Handle Objects
  if (
    typeof oldVal === "object" &&
    typeof newVal === "object" &&
    oldVal !== null &&
    newVal !== null &&
    !Array.isArray(oldVal) &&
    !Array.isArray(newVal)
  ) {
    const oldObj = oldVal as Record<string, unknown>;
    const newObj = newVal as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const currentPath = [...path, key];

      if (!(key in newObj)) {
        doc.deleteIn(currentPath);
      } else if (!(key in oldObj)) {
        doc.setIn(currentPath, newObj[key]);
      } else {
        updateYamlDocument(doc, currentPath, oldObj[key], newObj[key]);
      }
    }
    return;
  }

  // Primitives or Type Mismatch
  doc.setIn(path, newVal);

  // Force block style for tags
  if (path[path.length - 1] === "tags" && Array.isArray(newVal)) {
    const node = doc.getIn(path, true) as { flow?: boolean };
    if (node && "flow" in node) {
      node.flow = false;
    }
  }
};

export const OpenAPIEditor = () => {
  const [view, setView] = useState<"form" | "code">("form");
  const [activeSection, setActiveSection] = useState<EditorSection>("info");
  const [activeComponentSection, setActiveComponentSection] =
    useState<ComponentSection>("schemas");
  const [isComponentsExpanded, setIsComponentsExpanded] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const { activeFilePath, setOpenapi } = useStore();
  const [parsedData, setParsedData] = useState<OpenAPIObject | null>(null);
  const [rawContent, setRawContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = () => {
      if (!activeFilePath) return;
      setIsLoading(true);
      window.ipcRenderer
        .readFile(activeFilePath)
        .then((content) => {
          setRawContent(content);
          const parsed = parseOpenAPI(content) as OpenAPIObject;
          setParsedData(parsed);
          setOpenapi(parsed);
        })
        .catch((error) => {
          console.error("Failed to parse OpenAPI file:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };
    if (view === "form") {
      loadData();
    }
  }, [activeFilePath, view, setOpenapi]);

  const saveChanges = (
    updateFn: (doc: YAML.Document) => void,
    newData: OpenAPIObject
  ) => {
    if (!activeFilePath) return Promise.resolve();

    try {
      const doc = YAML.parseDocument(rawContent);
      // @ts-expect-error - defaultStringType is not in the type definition but it works
      doc.options.defaultStringType = "QUOTE_SINGLE";

      updateFn(doc);

      const newYamlContent = doc.toString();

      return window.ipcRenderer
        .writeFile(activeFilePath, newYamlContent)
        .then(() => {
          setRawContent(newYamlContent);
          setParsedData(newData);
          setOpenapi(newData);
        })
        .catch((error) => {
          console.error("Failed to save OpenAPI file:", error);
        });
    } catch (error) {
      console.error("Failed to save OpenAPI file:", error);
      return Promise.resolve();
    }
  };

  const handleInfoChange = (infoData: InfoObject) => {
    if (!parsedData) return;
    const newData = { ...parsedData, info: infoData };
    saveChanges(
      (doc) =>
        updateYamlDocument(doc, ["info"], parsedData.info || {}, infoData),
      newData
    );
  };

  const handleServersChange = (serversData: ServerObject[]) => {
    if (!parsedData) return;
    const newData = { ...parsedData, servers: serversData };
    saveChanges(
      (doc) =>
        updateYamlDocument(
          doc,
          ["servers"],
          parsedData.servers || [],
          serversData
        ),
      newData
    );
  };

  const handleSecurityChange = (securityData: SecurityRequirementObject[]) => {
    if (!parsedData) return;
    const newData = { ...parsedData, security: securityData };
    saveChanges(
      (doc) =>
        updateYamlDocument(
          doc,
          ["security"],
          parsedData.security || [],
          securityData
        ),
      newData
    );
  };

  const handleComponentsChange = (componentsData: ComponentsObject) => {
    if (!parsedData) return;
    const newData = { ...parsedData, components: componentsData };

    saveChanges(
      (doc) =>
        updateYamlDocument(
          doc,
          ["components"],
          parsedData.components || {},
          componentsData
        ),
      newData
    );
  };

  const handleTagsChange = (tagsData: TagObject[]) => {
    if (!parsedData) return;
    const newData = { ...parsedData, tags: tagsData };
    saveChanges(
      (doc) =>
        updateYamlDocument(doc, ["tags"], parsedData.tags || [], tagsData),
      newData
    );
  };

  const handleAddPath = (path: string, methods: string[]) => {
    if (!parsedData) return;

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

    const newPaths = {
      ...parsedData.paths,
      [path]: newPathItem,
    };

    const newData = { ...parsedData, paths: newPaths };
    saveChanges(
      (doc) => updateYamlDocument(doc, ["paths", path], undefined, newPathItem),
      newData
    ).then(() => {
      setActiveSection("paths");
      setSelectedPath(path);
    });
  };

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
                    {parsedData?.paths &&
                      Object.entries(parsedData.paths).map(
                        ([path, pathItem]) => (
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
                        )
                      )}
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="w-[1px] bg-[#3e3e42] hover:bg-blue-500 transition-colors" />

            {/* Content Area */}
            <Panel className="flex-1 overflow-auto bg-[#1e1e1e]">
              {parsedData && (
                <div className="h-full">
                  {activeSection === "info" && (
                    <InfoEditor
                      initialData={parsedData.info}
                      onChange={handleInfoChange}
                    />
                  )}
                  {activeSection === "servers" && (
                    <ServersEditor
                      initialData={parsedData.servers || []}
                      onChange={handleServersChange}
                    />
                  )}
                  {activeSection === "security" && (
                    <SecurityEditor
                      initialData={parsedData.security || []}
                      onChange={handleSecurityChange}
                    />
                  )}
                  {activeSection === "tags" && (
                    <TagsEditor
                      initialData={parsedData.tags || []}
                      onChange={handleTagsChange}
                    />
                  )}
                  {activeSection === "components" && (
                    <ComponentsEditor
                      initialData={parsedData.components || {}}
                      activeSection={activeComponentSection}
                      onChange={handleComponentsChange}
                    />
                  )}
                  {activeSection === "paths" && selectedPath && (
                    <PathEditor
                      path={selectedPath}
                      data={
                        (parsedData.paths?.[selectedPath] as PathItemObject) ||
                        {}
                      }
                      servers={parsedData.servers}
                      initialMethod={selectedMethod}
                      onChange={(newPathItem) => {
                        if (!parsedData) return;
                        const newPaths = {
                          ...parsedData.paths,
                          [selectedPath]: newPathItem,
                        };
                        const newData = { ...parsedData, paths: newPaths };
                        saveChanges(
                          (doc) =>
                            updateYamlDocument(
                              doc,
                              ["paths", selectedPath],
                              parsedData.paths?.[selectedPath],
                              newPathItem
                            ),
                          newData
                        );
                      }}
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
