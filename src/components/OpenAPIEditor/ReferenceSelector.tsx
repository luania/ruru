import {
  ArrowLeft,
  Check,
  FileCode,
  FileJson,
  Folder,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { isOpenAPI, parseOpenAPI } from "../../lib/openapi";
import { cn } from "../../lib/utils";
import type { ParameterObject } from "openapi3-ts/oas31";
import { useStore } from "../../store/useStore";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";

interface ReferenceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onDetach?: () => void;
  type:
    | "schemas"
    | "parameters"
    | "responses"
    | "requestBodies"
    | "headers"
    | "securitySchemes";
  /** Filter parameters by 'in' type (only used when type="parameters") */
  parameterIn?: string;
  trigger?: React.ReactNode;
}

// Simple relative path calculator for macOS/Linux
const getRelativePath = (from: string, to: string) => {
  const fromParts = from.split("/").filter(Boolean);
  const toParts = to.split("/").filter(Boolean);

  // Remove filename from 'from' path
  fromParts.pop();

  let i = 0;
  while (
    i < fromParts.length &&
    i < toParts.length &&
    fromParts[i] === toParts[i]
  ) {
    i++;
  }

  const upMoves = fromParts.length - i;
  const downMoves = toParts.slice(i);

  let result = "";
  if (upMoves === 0 && downMoves.length > 0) {
    // Same directory or subdirectory
    // If same directory, we don't need ./ prefix usually but it's safe
    // If subdirectory, just join
    result = downMoves.join("/");
  } else {
    for (let j = 0; j < upMoves; j++) {
      result += "../";
    }
    result += downMoves.join("/");
  }

  return result;
};

export const ReferenceSelector = ({
  value,
  onChange,
  onDetach,
  type,
  parameterIn,
  trigger,
}: ReferenceSelectorProps) => {
  const activeFilePath = useStore((state) => state.activeFilePath);
  const workingDirectory = useStore((state) => state.workingDirectory);
  const [localComponents, setLocalComponents] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load local components from current file
  useEffect(() => {
    const loadLocalComponents = async () => {
      if (!activeFilePath) {
        setLocalComponents([]);
        return;
      }

      try {
        const content: string =
          await window.ipcRenderer.readFile(activeFilePath);
        const openapi = parseOpenAPI(content);
        if (openapi?.components?.[type]) {
          let names = Object.keys(openapi.components[type]);
          if (type === "parameters" && parameterIn) {
            names = names.filter((name) => {
              const param = openapi.components![type]![name] as ParameterObject;
              return param?.in === parameterIn;
            });
          }
          setLocalComponents(names);
        } else {
          setLocalComponents([]);
        }
      } catch {
        setLocalComponents([]);
      }
    };

    loadLocalComponents();
  }, [activeFilePath, type, parameterIn, isOpen]);

  const [mode, setMode] = useState<"local" | "external">("local");
  const getInitialPath = () => {
    if (activeFilePath) {
      return activeFilePath.substring(0, activeFilePath.lastIndexOf("/"));
    }
    return workingDirectory || null;
  };

  const [currentPath, setCurrentPath] = useState<string | null>(getInitialPath);
  const [files, setFiles] = useState<
    Array<{ name: string; isDirectory: boolean; path: string }>
  >([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [externalComponents, setExternalComponents] = useState<string[]>([]);
  const [isPlainSchema, setIsPlainSchema] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Reset path when popover opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !currentPath) {
      setCurrentPath(getInitialPath());
    }
  };

  // Load files when currentPath changes
  useEffect(() => {
    const loadFiles = () => {
      if (!currentPath) return;
      setIsLoading(true);
      window.ipcRenderer
        .readDirectory(currentPath)
        .then(
          (
            result: Array<{ name: string; isDirectory: boolean; path: string }>,
          ) => {
            // Filter for directories and yaml/json files
            const filtered = result.filter(
              (f: { name: string; isDirectory: boolean; path: string }) =>
                f.isDirectory ||
                f.name.endsWith(".yaml") ||
                f.name.endsWith(".yml") ||
                f.name.endsWith(".json"),
            );
            // Sort directories first
            filtered.sort(
              (
                a: { name: string; isDirectory: boolean },
                b: { name: string; isDirectory: boolean },
              ) => {
                if (a.isDirectory === b.isDirectory)
                  return a.name.localeCompare(b.name);
                return a.isDirectory ? -1 : 1;
              },
            );
            setFiles(filtered);
          },
        )
        .catch((e: unknown) => {
          console.error("Failed to read directory", e);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };
    loadFiles();
  }, [currentPath]);

  // Load external components when a file is selected
  useEffect(() => {
    const loadExternalComponents = () => {
      if (!selectedFile) return;
      setIsLoading(true);
      setIsPlainSchema(false);
      window.ipcRenderer
        .readFile(selectedFile)
        .then((content: string) => {
          if (isOpenAPI(content)) {
            const parsed = parseOpenAPI(content);
            if (parsed?.components?.[type]) {
              let names = Object.keys(parsed.components[type] || {});
              if (type === "parameters" && parameterIn) {
                names = names.filter((name) => {
                  const param = parsed.components![type]![
                    name
                  ] as ParameterObject;
                  return param?.in === parameterIn;
                });
              }
              setExternalComponents(names);
            } else {
              setExternalComponents([]);
            }
          } else {
            // Plain schema YAML file — allow referencing the entire file
            setIsPlainSchema(true);
            setExternalComponents([]);
          }
        })
        .catch((e: unknown) => {
          console.error("Failed to parse external file", e);
          setExternalComponents([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };
    loadExternalComponents();
  }, [selectedFile, type, parameterIn]);

  const filteredLocalComponents = localComponents.filter((c: string) =>
    c.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredExternalComponents = externalComponents.filter((c: string) =>
    c.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleFileClick = (file: {
    name: string;
    isDirectory: boolean;
    path: string;
  }) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
      setSearch("");
    } else {
      setSelectedFile(file.path);
      setSearch("");
    }
  };

  const handleSelect = (ref: string) => {
    onChange(ref);
    setIsOpen(false);
  };

  const handleModeChange = (newMode: "local" | "external") => {
    setMode(newMode);
    setSearch("");
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 max-w-[320px] text-xs text-blue-400"
          >
            {value || "Select Reference"}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex items-center border-b border-[#3e3e42]">
          <button
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              mode === "local"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300",
            )}
            onClick={() => handleModeChange("local")}
          >
            Local
          </button>
          <button
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              mode === "external"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300",
            )}
            onClick={() => handleModeChange("external")}
          >
            External File
          </button>
        </div>

        <div className="p-2 border-b border-[#3e3e42]">
          <div className="relative">
            <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                mode === "external" && !selectedFile
                  ? "Search files..."
                  : "Search components..."
              }
              className="pl-8 h-8 bg-[#1e1e1e]"
            />
          </div>
        </div>

        <div className="h-[300px] overflow-y-auto p-2">
          {mode === "local" ? (
            <div className="space-y-1">
              {filteredLocalComponents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No local {type} found.
                </div>
              ) : (
                filteredLocalComponents.map((name) => (
                  <button
                    key={name}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between group hover:bg-[#2a2d2e]",
                      value === `#/components/${type}/${name}`
                        ? "bg-[#2a2d2e] text-blue-400"
                        : "text-gray-300",
                    )}
                    onClick={() => handleSelect(`#/components/${type}/${name}`)}
                  >
                    <span>{name}</span>
                    {value === `#/components/${type}/${name}` && (
                      <Check size={14} />
                    )}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#3e3e42]">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-gray-300"
                      onClick={() => setSelectedFile(null)}
                    >
                      <ArrowLeft size={14} />
                    </Button>
                    <span
                      className="text-xs text-gray-400 truncate flex-1"
                      title={selectedFile}
                    >
                      {selectedFile.split("/").pop()}
                    </span>
                  </div>
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Parsing file...
                    </div>
                  ) : isPlainSchema ? (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 px-3 py-1">
                        This file is a plain schema definition.
                      </div>
                      <button
                        className="w-full text-left px-3 py-2 rounded text-sm text-gray-300 hover:bg-[#2a2d2e] hover:text-white flex items-center gap-2"
                        onClick={() => {
                          if (activeFilePath) {
                            const relPath = getRelativePath(
                              activeFilePath,
                              selectedFile,
                            );
                            handleSelect(relPath);
                          }
                        }}
                      >
                        <FileCode size={14} className="text-green-400" />
                        Use entire file as reference
                      </button>
                    </div>
                  ) : filteredExternalComponents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No {type} found in this file.
                    </div>
                  ) : (
                    filteredExternalComponents.map((name) => (
                      <button
                        key={name}
                        className="w-full text-left px-3 py-2 rounded text-sm text-gray-300 hover:bg-[#2a2d2e] hover:text-white"
                        onClick={() => {
                          if (activeFilePath) {
                            const relPath = getRelativePath(
                              activeFilePath,
                              selectedFile,
                            );
                            handleSelect(
                              `${relPath}#/components/${type}/${name}`,
                            );
                          }
                        }}
                      >
                        {name}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#3e3e42] mb-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-gray-300"
                      onClick={() => {
                        if (currentPath) {
                          const parent = currentPath.substring(
                            0,
                            currentPath.lastIndexOf("/"),
                          );
                          setCurrentPath(parent || "/");
                        }
                      }}
                      disabled={!currentPath || currentPath === "/"}
                    >
                      <ArrowLeft size={14} />
                    </Button>
                    <span
                      className="text-xs text-gray-400 truncate flex-1"
                      title={currentPath || ""}
                    >
                      {currentPath}
                    </span>
                  </div>
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Loading files...
                    </div>
                  ) : (
                    filteredFiles.map((file) => (
                      <button
                        key={file.path}
                        className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 text-gray-300 hover:bg-[#2a2d2e] hover:text-white"
                        onClick={() => handleFileClick(file)}
                      >
                        {file.isDirectory ? (
                          <Folder size={14} className="text-blue-400" />
                        ) : file.name.endsWith(".json") ? (
                          <FileJson size={14} className="text-yellow-400" />
                        ) : (
                          <FileCode size={14} className="text-green-400" />
                        )}
                        <span className="truncate">{file.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {onDetach && value && (
          <div className="p-2 border-t border-[#3e3e42]">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-7 text-red-400 hover:text-red-300"
              onClick={() => {
                onDetach();
                setIsOpen(false);
              }}
            >
              Detach (Convert to Inline)
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
