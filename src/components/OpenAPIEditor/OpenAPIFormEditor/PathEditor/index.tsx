import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { cn, getMethodColor, getSchemaTypeColor } from "../../../../lib/utils";
import { OperationEditor } from "./OperationEditor";
import {
  Plus,
  LinkIcon,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
  List,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/Popover";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../../ui/Select";
import { ReferenceSelector } from "../../ReferenceSelector";
import { SchemaAdvancedSettings } from "../Components/SchemaAdvancedSettings";
import type {
  PathItemObject,
  OperationObject,
  ParameterObject,
  ReferenceObject,
  SchemaObject,
  ServerObject,
  OpenAPIObject,
} from "openapi3-ts/oas31";

interface PathEditorProps {
  path: string;
  data: PathItemObject;
  servers?: ServerObject[];
  openapi: OpenAPIObject;
  initialMethod?: string | null;
  onChange: (data: PathItemObject) => void;
  onPathRename?: (newPath: string) => void;
}

const METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
] as const;

interface PathParamRowProps {
  name: string;
  param: ParameterObject;
  paramIndex: number;
  pathLevelParams: (ParameterObject | ReferenceObject)[];
  path: string;
  components?: OpenAPIObject["components"];
  onPathRename?: (newPath: string) => void;
  onFieldChange: (
    index: number,
    field: keyof ParameterObject,
    value: ParameterObject[keyof ParameterObject],
  ) => void;
  onParamChange: (newParams: (ParameterObject | ReferenceObject)[]) => void;
}

const PathParamRow = ({
  name,
  param,
  paramIndex,
  pathLevelParams,
  path,
  components,
  onPathRename,
  onFieldChange,
  onParamChange,
}: PathParamRowProps) => {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(name);

  const schema = (param.schema as SchemaObject) || { type: "string" };
  const type = (schema.type as string) || "string";
  const itemsType =
    type === "array"
      ? ((schema.items as SchemaObject)?.type as string) || "string"
      : "";

  const handleRename = () => {
    const newName = renameValue.trim();
    if (!newName || newName === param.name) {
      setIsRenameOpen(false);
      return;
    }
    onFieldChange(paramIndex, "name", newName);
    if (onPathRename) {
      const newPath = path.replace(`{${param.name}}`, `{${newName}}`);
      onPathRename(newPath);
    }
    setIsRenameOpen(false);
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-[#1e1e1e] border-b border-[#3e3e42] last:border-0 group">
      <Popover
        open={isRenameOpen}
        onOpenChange={(open) => {
          setIsRenameOpen(open);
          if (open) setRenameValue(param.name);
        }}
      >
        <PopoverTrigger asChild>
          <span className="text-sm text-gray-300 font-mono cursor-pointer hover:text-white hover:underline decoration-dashed underline-offset-4 w-48 truncate">
            {param.name}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3">
          <div className="space-y-2">
            <h4 className="font-medium leading-none text-white text-xs">
              Rename Parameter
            </h4>
            <div className="flex gap-2">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
              <Button size="sm" className="h-7 text-xs" onClick={handleRename}>
                Save
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-auto min-w-[100px]">
        <div className="flex items-center gap-1">
          <Select
            value={type}
            onValueChange={(val) => {
              const newSchema = {
                ...schema,
                type: val as SchemaObject["type"],
              };
              if (val === "array" && !newSchema.items) {
                newSchema.items = { type: "string" };
              }
              if (val !== "array") {
                delete newSchema.items;
              }
              onFieldChange(paramIndex, "schema", newSchema);
            }}
          >
            <SelectTrigger className="h-8 bg-transparent border-transparent hover:border-[#3e3e42] w-auto min-w-[80px] px-2">
              <span className={getSchemaTypeColor(type)}>{type}</span>
            </SelectTrigger>
            <SelectContent>
              {["string", "integer", "number", "boolean", "array"].map((t) => (
                <SelectItem key={t} value={t} className={getSchemaTypeColor(t)}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {type === "array" && (
            <>
              <span className="text-gray-500 text-xs">of</span>
              <Select
                value={itemsType}
                onValueChange={(val) => {
                  onFieldChange(paramIndex, "schema", {
                    ...schema,
                    items: {
                      ...(schema.items as SchemaObject),
                      type: val as SchemaObject["type"],
                    },
                  });
                }}
              >
                <SelectTrigger className="h-8 bg-transparent border-transparent hover:border-[#3e3e42] w-auto min-w-[80px] px-2">
                  <span className={getSchemaTypeColor(itemsType)}>
                    {itemsType}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {["string", "integer", "number", "boolean"].map((t) => (
                    <SelectItem
                      key={t}
                      value={t}
                      className={getSchemaTypeColor(t)}
                    >
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      <Input
        value={param.description || ""}
        onChange={(e) =>
          onFieldChange(paramIndex, "description", e.target.value)
        }
        placeholder="Description"
        className="flex-1 h-8 bg-transparent border-transparent hover:border-[#3e3e42] focus:border-blue-500"
      />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            param.required ? "text-red-400" : "text-gray-500",
          )}
          onClick={() => onFieldChange(paramIndex, "required", !param.required)}
          title="Required"
        >
          <AlertCircle size={14} />
        </Button>
        <ReferenceSelector
          value=""
          type="parameters"
          parameterIn="path"
          onChange={(ref) => {
            const newParams = [...pathLevelParams];
            newParams[paramIndex] = { $ref: ref };
            onParamChange(newParams);
            if (onPathRename) {
              const resolvedName = ref.split("/").pop();
              const resolved = components?.parameters?.[resolvedName || ""];
              const paramName =
                resolved && "in" in resolved
                  ? (resolved as ParameterObject).name
                  : resolvedName;
              if (paramName && paramName !== name) {
                onPathRename(path.replace(`{${name}}`, `{${paramName}}`));
              }
            }
          }}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-white"
              title="Link to Component"
            >
              <LinkIcon size={14} />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-500 hover:text-white"
        >
          <Info size={14} />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-white"
              title="Advanced Settings"
            >
              <List size={14} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-4 max-h-[400px] overflow-y-auto"
            align="end"
          >
            <h4 className="font-medium leading-none text-white text-sm mb-4">
              Advanced Settings
            </h4>
            <SchemaAdvancedSettings
              schema={schema}
              onChange={(newSchema) =>
                onFieldChange(paramIndex, "schema", newSchema)
              }
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export const PathEditor = ({
  path,
  data,
  servers,
  openapi,
  initialMethod,
  onChange,
  onPathRename,
}: PathEditorProps) => {
  // Default to the first method that exists, or null
  const [activeMethod, setActiveMethod] = useState<string | null>(() => {
    if (initialMethod && data[initialMethod as keyof PathItemObject]) {
      return initialMethod;
    }
    const existingMethod = METHODS.find((m) => data[m]);
    return existingMethod || null;
  });
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  const [pathParamsOpen, setPathParamsOpen] = useState(false);
  const [newlyAddedMethod, setNewlyAddedMethod] = useState<string | null>(null);
  const [prevInitialMethod, setPrevInitialMethod] = useState(initialMethod);

  // Refs for stable callbacks
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  if (initialMethod !== prevInitialMethod) {
    setPrevInitialMethod(initialMethod);
    if (initialMethod && data[initialMethod as keyof PathItemObject]) {
      setActiveMethod(initialMethod);
    }
  }

  // Update active method if it becomes invalid (e.g. deleted externally)
  useEffect(() => {
    if (activeMethod && !data[activeMethod as keyof PathItemObject]) {
      const firstExisting = METHODS.find((m) => data[m]);
      setTimeout(() => setActiveMethod(firstExisting || null), 0);
    } else if (!activeMethod) {
      const firstExisting = METHODS.find((m) => data[m]);
      if (firstExisting) setTimeout(() => setActiveMethod(firstExisting), 0);
    }
  }, [data, activeMethod]);

  // Switch to newly added method when it appears in data
  useEffect(() => {
    if (newlyAddedMethod && data[newlyAddedMethod as keyof PathItemObject]) {
      setTimeout(() => {
        setActiveMethod(newlyAddedMethod);
        setNewlyAddedMethod(null);
      }, 0);
    }
  }, [data, newlyAddedMethod]);

  const handleOperationChange = useCallback(
    (method: string, operation: OperationObject | undefined) => {
      const currentData = dataRef.current;
      const newData = { ...currentData };
      if (operation) {
        newData[method as keyof PathItemObject] = operation;
      } else {
        delete newData[method as keyof PathItemObject];
      }
      onChange(newData);
    },
    [onChange],
  );

  const handleAddMethod = (method: string) => {
    handleOperationChange(method, {});
    setNewlyAddedMethod(method);
    setIsAddPopoverOpen(false);
  };

  const availableMethods = METHODS.filter(
    (method) => !data[method as keyof PathItemObject],
  );

  const components = openapi.components;

  const pathParamNames = useMemo(() => {
    return (path.match(/\{([^}]+)\}/g) || []).map((s) => s.slice(1, -1));
  }, [path]);

  const pathLevelParams = (data.parameters || []) as (
    | ParameterObject
    | ReferenceObject
  )[];

  const handlePathParamChange = useCallback(
    (newParams: (ParameterObject | ReferenceObject)[]) => {
      const currentData = dataRef.current;
      onChange({ ...currentData, parameters: newParams });
    },
    [onChange],
  );

  const handlePathParamFieldChange = useCallback(
    (
      index: number,
      field: keyof ParameterObject,
      value: ParameterObject[keyof ParameterObject],
    ) => {
      const currentData = dataRef.current;
      const newParams = [...(currentData.parameters || [])];
      newParams[index] = { ...newParams[index], [field]: value };
      onChange({ ...currentData, parameters: newParams });
    },
    [onChange],
  );

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Path URL & Path Parameters */}
      <div className="flex-none bg-[#252526] border-b border-[#3e3e42] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center border border-[#3e3e42] rounded-md bg-[#1e1e1e] px-3 py-1.5">
            <span className="text-gray-500 text-sm mr-2">
              {servers?.[0]?.url || "No server URL defined..."}
            </span>
            <span className="text-gray-300 text-sm font-medium">{path}</span>
          </div>
          {pathParamNames.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-400 hover:text-white gap-1"
              onClick={() => setPathParamsOpen(!pathParamsOpen)}
            >
              {pathParamsOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              <span className="text-xs">Params</span>
            </Button>
          )}
        </div>

        {pathParamsOpen && pathParamNames.length > 0 && (
          <div className="mt-3">
            <div className="border border-[#3e3e42] rounded-md overflow-hidden">
              {pathParamNames.map((name) => {
                const refIndex = pathLevelParams.findIndex((p) => {
                  if (!("$ref" in p)) return false;
                  const ref = (p as ReferenceObject).$ref;
                  const refName = ref.split("/").pop();
                  const resolved = components?.parameters?.[refName || ""];
                  if (resolved && "in" in resolved) {
                    return (
                      (resolved as ParameterObject).in === "path" &&
                      (resolved as ParameterObject).name === name
                    );
                  }
                  return refName?.toLowerCase() === name.toLowerCase();
                });

                const inlineIndex = pathLevelParams.findIndex(
                  (p) =>
                    !("$ref" in p) &&
                    (p as ParameterObject).in === "path" &&
                    (p as ParameterObject).name === name,
                );

                const isRef = refIndex >= 0;
                const isInline = inlineIndex >= 0;
                const paramIndex = isRef ? refIndex : inlineIndex;

                // Not yet defined: show link button to select $ref
                if (!isRef && !isInline) {
                  return (
                    <div
                      key={name}
                      className="flex items-center gap-2 p-2 bg-[#1e1e1e] border-b border-[#3e3e42] last:border-0"
                    >
                      <span className="text-sm font-mono text-gray-400 w-48 px-2">
                        {name}
                      </span>
                      <span className="flex-1 text-xs text-gray-500 italic">
                        Not defined
                      </span>
                      <ReferenceSelector
                        value=""
                        type="parameters"
                        parameterIn="path"
                        onChange={(ref) => {
                          handlePathParamChange([
                            ...pathLevelParams,
                            { $ref: ref },
                          ]);
                          // Auto-update path based on resolved ref name
                          if (onPathRename) {
                            const resolvedName = ref.split("/").pop();
                            const resolved =
                              components?.parameters?.[resolvedName || ""];
                            const paramName =
                              resolved && "in" in resolved
                                ? (resolved as ParameterObject).name
                                : resolvedName;
                            if (paramName && paramName !== name) {
                              onPathRename(
                                path.replace(`{${name}}`, `{${paramName}}`),
                              );
                            }
                          }
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-white"
                            title="Link to Component"
                          >
                            <LinkIcon size={14} />
                          </Button>
                        }
                      />
                    </div>
                  );
                }

                if (isRef) {
                  const refValue = (
                    pathLevelParams[refIndex] as ReferenceObject
                  ).$ref;
                  const refName = refValue.split("/").pop();
                  return (
                    <div
                      key={name}
                      className="flex items-center gap-2 p-2 bg-[#1e1e1e] border-b border-[#3e3e42] last:border-0 group"
                    >
                      <div className="flex-1 flex items-center gap-2">
                        <div className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20 flex items-center gap-2">
                          <span className="font-mono">$ref</span>
                          <span className="font-medium">{refName}</span>
                        </div>
                        <span className="text-gray-500 text-sm truncate">
                          {
                            (
                              components?.parameters?.[
                                refName!
                              ] as ParameterObject
                            )?.description
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ReferenceSelector
                          value={refValue}
                          type="parameters"
                          parameterIn="path"
                          onChange={(ref) => {
                            const newParams = [...pathLevelParams];
                            newParams[refIndex] = { $ref: ref };
                            handlePathParamChange(newParams);
                            // Auto-update path based on resolved ref name
                            if (onPathRename) {
                              const resolvedName = ref.split("/").pop();
                              const resolved =
                                components?.parameters?.[resolvedName || ""];
                              const paramName =
                                resolved && "in" in resolved
                                  ? (resolved as ParameterObject).name
                                  : resolvedName;
                              if (paramName && paramName !== name) {
                                onPathRename(
                                  path.replace(`{${name}}`, `{${paramName}}`),
                                );
                              }
                            }
                          }}
                          onDetach={() => {
                            const resolved = components?.parameters?.[refName!];
                            if (resolved) {
                              const newParams = [...pathLevelParams];
                              newParams[refIndex] = {
                                ...resolved,
                              } as ParameterObject;
                              handlePathParamChange(newParams);
                            }
                          }}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-400 hover:text-white"
                              title="Change Reference"
                            >
                              <LinkIcon size={14} />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  );
                }

                // Inline param
                const param = pathLevelParams[inlineIndex] as ParameterObject;

                return (
                  <PathParamRow
                    key={name}
                    name={name}
                    param={param}
                    paramIndex={paramIndex}
                    pathLevelParams={pathLevelParams}
                    path={path}
                    components={components}
                    onPathRename={onPathRename}
                    onFieldChange={handlePathParamFieldChange}
                    onParamChange={handlePathParamChange}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex-none bg-[#252526] border-b border-[#3e3e42]">
        <div className="flex items-center px-4 gap-2">
          {METHODS.filter((method) => data[method as keyof PathItemObject]).map(
            (method) => {
              const isActive = activeMethod === method;

              return (
                <button
                  key={method}
                  onClick={() => setActiveMethod(method)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium uppercase border-b-2 transition-colors relative",
                    isActive
                      ? cn("border-current", getMethodColor(method))
                      : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#2a2d2e]",
                  )}
                >
                  {method}
                </button>
              );
            },
          )}

          <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-[#3e3e42] text-gray-400 hover:text-white"
              >
                <Plus size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1 bg-[#252526] border-[#3e3e42]">
              <div className="grid gap-1">
                {availableMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => handleAddMethod(method)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded uppercase transition-colors",
                      getMethodColor(method),
                      "hover:brightness-110",
                    )}
                  >
                    {method}
                  </button>
                ))}
                {availableMethods.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    No more methods
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeMethod && data[activeMethod as keyof PathItemObject] ? (
          <OperationEditor
            key={activeMethod} // Re-mount on method change to reset internal state if needed
            method={activeMethod}
            path={path}
            data={
              (data[activeMethod as keyof PathItemObject] as OperationObject) ||
              {}
            }
            openapi={openapi}
            onChange={(op) => handleOperationChange(activeMethod, op)}
            onDelete={() => handleOperationChange(activeMethod, undefined)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <p>Select or add a method to edit</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Add Method</Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1 bg-[#252526] border-[#3e3e42]">
                <div className="grid gap-1">
                  {availableMethods.map((method) => (
                    <button
                      key={method}
                      onClick={() => handleAddMethod(method)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-sm rounded uppercase transition-colors",
                        getMethodColor(method),
                        "hover:brightness-110",
                      )}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
};
