import { useState, useMemo } from "react";
import {
  Info,
  Link as LinkIcon,
  List,
  Plus,
  Trash2,
  AlertCircle,
  X,
} from "lucide-react";
import type {
  OperationObject,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
  ServerObject,
} from "openapi3-ts/oas31";
import { cn, getSchemaTypeColor } from "../../../lib/utils";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { ConfirmPopover } from "../../ui/ConfirmPopover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/Select";
import { Switch } from "../../ui/Switch";
import { Textarea } from "../../ui/Textarea";
import { SchemaDesigner } from "../Components/SchemasEditor/SchemaDesigner";
import { SchemaAdvancedSettings } from "../Components/SchemaAdvancedSettings";
import { useStore } from "../../../store/useStore";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/Popover";
import { ReferenceSelector } from "../ReferenceSelector";

interface ParamTypeSelectorProps {
  schema: SchemaObject;
  onChange: (newSchema: SchemaObject) => void;
}

const ParamTypeSelector = ({ schema, onChange }: ParamTypeSelectorProps) => {
  const type = (schema.type as string) || "string";
  const itemsType =
    type === "array"
      ? ((schema.items as SchemaObject)?.type as string) || "string"
      : "";

  return (
    <div className="flex items-center gap-1">
      <Select
        value={type}
        onValueChange={(val) => {
          const newSchema = { ...schema, type: val as SchemaObject["type"] };
          if (val === "array" && !newSchema.items) {
            newSchema.items = { type: "string" };
          }
          if (val !== "array") {
            delete newSchema.items;
          }
          onChange(newSchema);
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
              onChange({
                ...schema,
                items: {
                  ...(schema.items as SchemaObject),
                  type: val as SchemaObject["type"],
                },
              });
            }}
          >
            <SelectTrigger className="h-8 bg-transparent border-transparent hover:border-[#3e3e42] w-auto min-w-[80px] px-2">
              <span className={getSchemaTypeColor(itemsType)}>{itemsType}</span>
            </SelectTrigger>
            <SelectContent>
              {["string", "integer", "number", "boolean"].map((t) => (
                <SelectItem key={t} value={t} className={getSchemaTypeColor(t)}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
};

interface OperationEditorProps {
  method: string;
  path: string;
  data: OperationObject;
  servers?: ServerObject[];
  onChange: (data: OperationObject) => void;
  onDelete?: () => void;
}

export const OperationEditor = ({
  path,
  data,
  servers,
  onChange,
  onDelete,
}: OperationEditorProps) => {
  const { openapi } = useStore();
  const globalTags = useStore((state) => state.openapi.tags);
  const [isPathParamsOpen, setIsPathParamsOpen] = useState(false);
  const [activeResponseCode, setActiveResponseCode] = useState<string | null>(
    null
  );
  const [customStatusCode, setCustomStatusCode] = useState("");
  const [customContentType, setCustomContentType] = useState("");
  const [activeContentType, setActiveContentType] = useState<string | null>(
    null
  );

  const pathParamNames = useMemo(() => {
    return (path.match(/\{([^}]+)\}/g) || []).map((s) => s.slice(1, -1));
  }, [path]);

  const handleParamChange = (
    index: number,
    field: keyof ParameterObject,
    value: ParameterObject[keyof ParameterObject]
  ) => {
    const newParams = [...(data.parameters || [])];
    newParams[index] = { ...newParams[index], [field]: value };
    onChange({ ...data, parameters: newParams });
  };

  const handleAddParam = (inType: ParameterObject["in"]) => {
    const newParams = [
      ...(data.parameters || []),
      {
        name: "",
        in: inType,
        schema: { type: "string" },
        description: "",
      } as ParameterObject,
    ];
    onChange({ ...data, parameters: newParams });
  };

  const handleDeleteParam = (index: number) => {
    const newParams = [...(data.parameters || [])];
    newParams.splice(index, 1);
    onChange({ ...data, parameters: newParams });
  };

  const handleCreatePathParam = (name: string) => {
    const newParams = [
      ...(data.parameters || []),
      {
        name,
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "",
      } as ParameterObject,
    ];
    onChange({ ...data, parameters: newParams });
  };

  const handleAddSecurity = () => {
    const newSecurity = [...(data.security || [])];
    newSecurity.push({});
    onChange({ ...data, security: newSecurity });
  };

  const handleSecurityChange = (index: number, newScheme: string) => {
    const newSecurity = [...(data.security || [])];
    newSecurity[index] = { [newScheme]: [] };
    onChange({ ...data, security: newSecurity });
  };

  const handleDeleteSecurity = (index: number) => {
    const newSecurity = [...(data.security || [])];
    newSecurity.splice(index, 1);
    onChange({ ...data, security: newSecurity });
  };

  const renderSecuritySection = () => {
    const security = data.security || [];
    if (security.length === 0) return null;

    const availableSchemes = Object.keys(
      openapi?.components?.securitySchemes || {}
    );

    return (
      <div className="space-y-2 mb-6">
        <div className="text-sm font-medium text-gray-400">Security</div>
        <div className="border border-[#3e3e42] rounded-md overflow-hidden">
          {security.map((req, index) => {
            const currentScheme = Object.keys(req)[0] || "";

            return (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-[#1e1e1e] border-b border-[#3e3e42] last:border-0"
              >
                <div className="w-64">
                  <Select
                    value={currentScheme}
                    onValueChange={(val) => handleSecurityChange(index, val)}
                  >
                    <SelectTrigger className="h-8 bg-transparent border-transparent hover:border-[#3e3e42]">
                      <SelectValue placeholder="Select Security Scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSchemes.map((scheme) => (
                        <SelectItem key={scheme} value={scheme}>
                          {scheme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1"></div>

                <ConfirmPopover
                  title="Delete Security Requirement"
                  description="Are you sure you want to delete this security requirement?"
                  onConfirm={() => handleDeleteSecurity(index)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </Button>
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderParamsSection = (
    title: string,
    inType: ParameterObject["in"]
  ) => {
    const params = (data.parameters || [])
      .map((p, i) => ({ ...p, _index: i }))
      .filter((p) => {
        if ("$ref" in p) {
          const refName = p.$ref.split("/").pop();
          const resolved = openapi?.components?.parameters?.[refName || ""];

          // 1. Try to resolve locally
          if (resolved && "in" in resolved) {
            return (resolved as ParameterObject).in === inType;
          }

          // 2. Heuristic for external/unresolved refs
          const refLower = p.$ref.toLowerCase();
          // Check for explicit type in path
          if (refLower.includes("/header/") || refLower.includes("/headers/"))
            return inType === "header";
          if (refLower.includes("/path/") || refLower.includes("/paths/"))
            return inType === "path";
          if (refLower.includes("/cookie/") || refLower.includes("/cookies/"))
            return inType === "cookie";
          if (refLower.includes("/query/") || refLower.includes("/queries/"))
            return inType === "query";

          // 3. Check for common parameter names that are usually query params
          if (
            [
              "pagenum",
              "pagesize",
              "page",
              "limit",
              "offset",
              "sort",
              "order",
              "q",
              "search",
            ].includes(refName?.toLowerCase() || "")
          ) {
            return inType === "query";
          }

          // 4. Default fallback to 'query' if we can't determine
          // This ensures they show up SOMEWHERE rather than nowhere.
          if (inType === "query") return true;

          return false;
        }
        return (p as ParameterObject).in === inType;
      });

    if (params.length === 0) return null;

    return (
      <div className="space-y-2 mb-6">
        <div className="text-sm font-medium text-gray-400">{title}</div>
        <div className="border border-[#3e3e42] rounded-md overflow-hidden">
          {params.map((param) => {
            const isRef = "$ref" in param;
            const refName = isRef ? param.$ref.split("/").pop() : null;

            return (
              <div
                key={param._index}
                className="flex items-center gap-2 p-2 bg-[#1e1e1e] border-b border-[#3e3e42] last:border-0 group"
              >
                {isRef ? (
                  <div className="flex-1 flex items-center gap-2">
                    <div className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20 flex items-center gap-2">
                      <span className="font-mono">$ref</span>
                      <span className="font-medium">{refName}</span>
                    </div>
                    <span className="text-gray-500 text-sm truncate">
                      {
                        (
                          openapi?.components?.parameters?.[
                            refName!
                          ] as ParameterObject
                        )?.description
                      }
                    </span>
                  </div>
                ) : (
                  <>
                    <Input
                      value={(param as ParameterObject).name}
                      onChange={(e) =>
                        handleParamChange(param._index, "name", e.target.value)
                      }
                      placeholder="Name"
                      className="w-48 h-8 bg-transparent border-transparent hover:border-[#3e3e42] focus:border-blue-500"
                    />
                    <div className="w-auto min-w-[100px]">
                      <ParamTypeSelector
                        schema={
                          ((param as ParameterObject)
                            .schema as SchemaObject) || {
                            type: "string",
                          }
                        }
                        onChange={(newSchema) =>
                          handleParamChange(param._index, "schema", newSchema)
                        }
                      />
                    </div>
                    <Input
                      value={(param as ParameterObject).description || ""}
                      onChange={(e) =>
                        handleParamChange(
                          param._index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Description"
                      className="flex-1 h-8 bg-transparent border-transparent hover:border-[#3e3e42] focus:border-blue-500"
                    />
                  </>
                )}

                <div className="flex items-center gap-1">
                  {!isRef && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        (param as ParameterObject).required
                          ? "text-red-400"
                          : "text-gray-500"
                      )}
                      onClick={() =>
                        handleParamChange(
                          param._index,
                          "required",
                          !(param as ParameterObject).required
                        )
                      }
                      title="Required"
                    >
                      <AlertCircle size={14} />
                    </Button>
                  )}

                  <ReferenceSelector
                    value={isRef ? param.$ref : ""}
                    type="parameters"
                    onChange={(ref) => {
                      const newParams = [...(data.parameters || [])];
                      newParams[param._index] = {
                        $ref: ref,
                      };
                      onChange({ ...data, parameters: newParams });
                    }}
                    onDetach={
                      isRef
                        ? () => {
                            const refName = param.$ref.split("/").pop();
                            const resolved =
                              openapi?.components?.parameters?.[refName!];
                            if (resolved) {
                              const newParams = [...(data.parameters || [])];
                              newParams[param._index] = {
                                ...resolved,
                              } as ParameterObject;
                              onChange({
                                ...data,
                                parameters: newParams,
                              });
                            }
                          }
                        : undefined
                    }
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7 hover:text-white",
                          isRef ? "text-blue-400" : "text-gray-500"
                        )}
                        title={isRef ? "Change Reference" : "Link to Component"}
                      >
                        <LinkIcon size={14} />
                      </Button>
                    }
                  />

                  {!isRef && (
                    <>
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
                            schema={
                              ((param as ParameterObject)
                                .schema as SchemaObject) || {}
                            }
                            onChange={(newSchema) =>
                              handleParamChange(
                                param._index,
                                "schema",
                                newSchema
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </>
                  )}

                  <ConfirmPopover
                    title="Delete Parameter"
                    description="Are you sure you want to delete this parameter?"
                    onConfirm={() => handleDeleteParam(param._index)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header Section */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between gap-4">
          <Input
            value={data.summary || ""}
            onChange={(e) => onChange({ ...data, summary: e.target.value })}
            placeholder="Operation Summary"
            className="text-xl font-semibold bg-transparent border-transparent hover:border-[#3e3e42] focus:border-blue-500 px-0 h-auto flex-1"
          />
          <div className="flex items-center gap-4 flex-none">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase">Internal</span>
              <Switch />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase">
                Deprecated
              </span>
              <Switch
                checked={!!data.deprecated}
                onCheckedChange={(checked: boolean) =>
                  onChange({ ...data, deprecated: checked })
                }
              />
            </div>
            {onDelete && (
              <ConfirmPopover
                title="Delete Operation"
                description="Are you sure you want to delete this operation?"
                onConfirm={onDelete}
                trigger={
                  <Button variant="destructive" size="sm" className="h-8">
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </Button>
                }
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center border border-[#3e3e42] rounded-md bg-[#252526] px-3 py-1.5">
            <span className="text-gray-500 text-sm mr-2">
              {servers?.[0]?.url || "No server URL defined..."}
            </span>
            <span className="text-gray-300 text-sm font-medium">{path}</span>
          </div>
          <Button
            variant={isPathParamsOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsPathParamsOpen(!isPathParamsOpen)}
            disabled={pathParamNames.length === 0}
            className="relative"
          >
            Path Params
            {pathParamNames.length > 0 && (
              <span className="ml-2 bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full">
                {pathParamNames.length}
              </span>
            )}
          </Button>
        </div>

        {isPathParamsOpen && (
          <div className="border border-[#3e3e42] rounded-md p-4 bg-[#252526] space-y-4">
            <div className="text-sm font-medium text-gray-400">
              Path Parameters
            </div>
            <div className="space-y-2">
              {pathParamNames.map((name) => {
                const paramIndex = (data.parameters || []).findIndex(
                  (p) =>
                    !("$ref" in p) &&
                    (p as ParameterObject).in === "path" &&
                    (p as ParameterObject).name === name
                );
                const param =
                  paramIndex >= 0
                    ? (data.parameters![paramIndex] as ParameterObject)
                    : null;

                return (
                  <div
                    key={name}
                    className="flex items-center gap-2 p-2 bg-[#1e1e1e] border border-[#3e3e42] rounded-md"
                  >
                    <div className="w-48 px-3 py-1.5 text-sm font-mono text-blue-400 bg-[#252526] rounded border border-[#3e3e42]">
                      {name}
                    </div>
                    {param ? (
                      <>
                        <div className="w-auto min-w-[100px]">
                          <ParamTypeSelector
                            schema={
                              (param.schema as SchemaObject) || {
                                type: "string",
                              }
                            }
                            onChange={(newSchema) =>
                              handleParamChange(paramIndex, "schema", newSchema)
                            }
                          />
                        </div>
                        <Input
                          value={param.description || ""}
                          onChange={(e) =>
                            handleParamChange(
                              paramIndex,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Description"
                          className="flex-1 h-8 bg-transparent border-transparent hover:border-[#3e3e42] focus:border-blue-500"
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 cursor-not-allowed opacity-50"
                            title="Path parameters are always required"
                          >
                            <LinkIcon size={14} />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCreatePathParam(name)}
                          className="h-8"
                        >
                          Define Parameter
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase">
            Operation ID
          </label>
          <Input
            value={data.operationId || ""}
            onChange={(e) => onChange({ ...data, operationId: e.target.value })}
            placeholder="unique-operation-id"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase">Tags</label>
          <div className="flex flex-wrap gap-2 min-h-[32px] items-center">
            {(data.tags || []).map((tag) => (
              <div
                key={tag}
                className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20 flex items-center gap-2"
              >
                <span>{tag}</span>
                <button
                  onClick={() =>
                    onChange({
                      ...data,
                      tags: (data.tags || []).filter((t) => t !== tag),
                    })
                  }
                  className="hover:text-blue-300"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs gap-1"
                >
                  <Plus size={12} /> Add Tag
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start">
                <div className="max-h-48 overflow-y-auto">
                  {globalTags?.length === 0 ? (
                    <div className="text-xs text-gray-500 p-2 text-center">
                      No global tags defined.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {globalTags?.map((tag) => (
                        <div
                          key={tag.name}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm",
                            data.tags?.includes(tag.name)
                              ? "opacity-50 cursor-not-allowed text-gray-500"
                              : "hover:bg-[#2a2d2e] text-gray-300 hover:text-white"
                          )}
                          onClick={() => {
                            if (!data.tags?.includes(tag.name)) {
                              onChange({
                                ...data,
                                tags: [...(data.tags || []), tag.name],
                              });
                            }
                          }}
                        >
                          {tag.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase">Description</label>
          <Textarea
            value={data.description || ""}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            placeholder="Endpoint description..."
            className="min-h-[80px]"
          />
        </div>
      </div>

      {/* Parameters Toolbar */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddSecurity}
          className="gap-2"
        >
          <Plus size={14} /> Security
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddParam("header")}
          className="gap-2"
        >
          <Plus size={14} /> Header
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddParam("query")}
          className="gap-2"
        >
          <Plus size={14} /> Query Param
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddParam("cookie")}
          className="gap-2"
        >
          <Plus size={14} /> Cookie
        </Button>
      </div>

      {/* Parameters Sections */}
      {renderSecuritySection()}
      {renderParamsSection("Query Params", "query")}
      {renderParamsSection("Headers", "header")}
      {renderParamsSection("Cookies", "cookie")}

      {/* Request Body */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {!data.requestBody ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  ...data,
                  requestBody: {
                    content: {
                      "application/json": {
                        schema: { type: "object", properties: {} },
                      },
                    },
                  },
                })
              }
            >
              <Plus size={14} className="mr-2" /> Add Body
            </Button>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">
                  Request Body
                </div>
                <ConfirmPopover
                  title="Delete Request Body"
                  description="Are you sure you want to delete the request body?"
                  onConfirm={() => {
                    const newData = { ...data };
                    delete newData.requestBody;
                    onChange(newData);
                  }}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </Button>
                  }
                />
              </div>

              {/* Content Type Selector - Simplified for now */}
              <div className="flex items-center gap-2">
                <Select value="application/json">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application/json">
                      application/json
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Schema Editor */}
              {(data.requestBody as RequestBodyObject).content?.[
                "application/json"
              ]?.schema && (
                <SchemaDesigner
                  schema={
                    (data.requestBody as RequestBodyObject).content[
                      "application/json"
                    ].schema as SchemaObject
                  }
                  onChange={(newSchema) => {
                    const newBody = {
                      ...(data.requestBody as RequestBodyObject),
                    };
                    if (newBody.content?.["application/json"]) {
                      newBody.content["application/json"].schema = newSchema;
                    }
                    onChange({ ...data, requestBody: newBody });
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Responses */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-400">Responses</div>
        <div className="flex items-center gap-2 pb-2 overflow-x-auto">
          {Object.keys(data.responses || {}).map((code) => (
            <button
              key={code}
              onClick={() => setActiveResponseCode(code)}
              className={cn(
                "px-3 py-1.5 text-sm font-mono rounded-md transition-colors border border-transparent",
                (activeResponseCode || Object.keys(data.responses || {})[0]) ===
                  code
                  ? code.startsWith("2")
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : code.startsWith("3")
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : code.startsWith("4")
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#2a2d2e]"
              )}
            >
              {code}
            </button>
          ))}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-400 px-2">
                  Add Response
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    "200",
                    "201",
                    "204",
                    "400",
                    "401",
                    "403",
                    "404",
                    "500",
                    "default",
                  ].map((code) => (
                    <Button
                      key={code}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-xs text-gray-300 hover:text-white hover:bg-[#3e3e42]",
                        data.responses?.[code] &&
                          "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => {
                        const newResponses = { ...(data.responses || {}) };
                        if (newResponses[code]) return;
                        newResponses[code] = { description: "" };
                        onChange({ ...data, responses: newResponses });
                        setActiveResponseCode(code);
                      }}
                      disabled={!!data.responses?.[code]}
                    >
                      {code}
                    </Button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#3e3e42] mt-2">
                  <div className="text-xs font-medium text-gray-400 px-2 mb-2">
                    Custom Status Code
                  </div>
                  <div className="flex gap-2 px-2">
                    <Input
                      value={customStatusCode}
                      onChange={(e) => setCustomStatusCode(e.target.value)}
                      placeholder="e.g. 422"
                      className="h-7 text-xs bg-[#1e1e1e] border-[#3e3e42]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (
                            !customStatusCode ||
                            !!data.responses?.[customStatusCode]
                          )
                            return;
                          const newResponses = { ...(data.responses || {}) };
                          newResponses[customStatusCode] = { description: "" };
                          onChange({ ...data, responses: newResponses });
                          setActiveResponseCode(customStatusCode);
                          setCustomStatusCode("");
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      disabled={
                        !customStatusCode ||
                        !!data.responses?.[customStatusCode]
                      }
                      onClick={() => {
                        const newResponses = { ...(data.responses || {}) };
                        if (newResponses[customStatusCode]) return;
                        newResponses[customStatusCode] = { description: "" };
                        onChange({ ...data, responses: newResponses });
                        setActiveResponseCode(customStatusCode);
                        setCustomStatusCode("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {(() => {
          const codes = Object.keys(data.responses || {});
          const currentCode =
            activeResponseCode && codes.includes(activeResponseCode)
              ? activeResponseCode
              : codes[0];

          if (!currentCode) return null;

          const response = data.responses![currentCode] as ResponseObject;

          return (
            <div className="border border-[#3e3e42] rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={response.description || ""}
                    onChange={(e) => {
                      const newResponses = { ...(data.responses || {}) };
                      newResponses[currentCode] = {
                        ...response,
                        description: e.target.value,
                      };
                      onChange({ ...data, responses: newResponses });
                    }}
                    placeholder="Description"
                    className="flex-1 bg-transparent border-transparent hover:border-[#3e3e42] focus:border-blue-500"
                  />
                </div>
                <ConfirmPopover
                  title="Delete Response"
                  description="Are you sure you want to delete this response?"
                  onConfirm={() => {
                    const newResponses = { ...(data.responses || {}) };
                    delete newResponses[currentCode];
                    onChange({ ...data, responses: newResponses });
                    setActiveResponseCode(null);
                  }}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </Button>
                  }
                />
              </div>

              {/* Response Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    Response Body
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.keys(response.content || {}).length > 0 && (
                      <Select
                        value={(() => {
                          const contentTypes = Object.keys(
                            response.content || {}
                          );
                          return activeContentType &&
                            contentTypes.includes(activeContentType)
                            ? activeContentType
                            : contentTypes[0] || "";
                        })()}
                        onValueChange={setActiveContentType}
                      >
                        <SelectTrigger className="w-[200px] h-7 text-xs">
                          <SelectValue placeholder="Select Content Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(response.content || {}).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Add Content Type"
                        >
                          <Plus size={14} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3" align="end">
                        <div className="space-y-3">
                          <div className="text-xs font-medium text-gray-400">
                            Add Content Type
                          </div>
                          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                            {[
                              "application/json",
                              "application/xml",
                              "application/x-www-form-urlencoded",
                              "multipart/form-data",
                              "text/plain",
                              "text/html",
                              "application/pdf",
                              "application/octet-stream",
                              "application/zip",
                              "application/gzip",
                              "application/javascript",
                              "application/soap+xml",
                              "application/xhtml+xml",
                              "application/xml-dtd",
                              "application/xop+xml",
                              "application/atom+xml",
                              "application/EDI-X12",
                              "application/EDIFACT",
                              "application/font-woff",
                              "application/ogg",
                              "application/postscript",
                              "application/x-bittorrent",
                              "application/x-tex",
                            ].map((type) => (
                              <Button
                                key={type}
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={() => setCustomContentType(type)}
                              >
                                {type}
                              </Button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={customContentType}
                              onChange={(e) =>
                                setCustomContentType(e.target.value)
                              }
                              placeholder="e.g. application/pdf"
                              className="h-8 text-xs bg-[#1e1e1e] border-[#3e3e42]"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (
                                    !customContentType ||
                                    !!response.content?.[customContentType]
                                  )
                                    return;
                                  const newResponses = {
                                    ...(data.responses || {}),
                                  };
                                  newResponses[currentCode] = {
                                    ...response,
                                    content: {
                                      ...(response.content || {}),
                                      [customContentType]: {
                                        schema: {
                                          type: "object",
                                          properties: {},
                                        },
                                      },
                                    },
                                  };
                                  onChange({
                                    ...data,
                                    responses: newResponses,
                                  });
                                  setActiveContentType(customContentType);
                                  setCustomContentType("");
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 text-xs"
                              disabled={
                                !customContentType ||
                                !!response.content?.[customContentType]
                              }
                              onClick={() => {
                                const newResponses = {
                                  ...(data.responses || {}),
                                };
                                newResponses[currentCode] = {
                                  ...response,
                                  content: {
                                    ...(response.content || {}),
                                    [customContentType]: {
                                      schema: {
                                        type: "object",
                                        properties: {},
                                      },
                                    },
                                  },
                                };
                                onChange({ ...data, responses: newResponses });
                                setActiveContentType(customContentType);
                                setCustomContentType("");
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {(() => {
                  const contentTypes = Object.keys(response.content || {});
                  const currentContentType =
                    activeContentType &&
                    contentTypes.includes(activeContentType)
                      ? activeContentType
                      : contentTypes[0];

                  if (!currentContentType) {
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newResponses = { ...(data.responses || {}) };
                          newResponses[currentCode] = {
                            ...response,
                            content: {
                              "application/json": {
                                schema: { type: "object", properties: {} },
                              },
                            },
                          };
                          onChange({ ...data, responses: newResponses });
                          setActiveContentType("application/json");
                        }}
                      >
                        <Plus size={14} className="mr-2" /> Add Default Body
                        (JSON)
                      </Button>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {contentTypes.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {contentTypes.map((type) => (
                            <div
                              key={type}
                              className={cn(
                                "px-2 py-1 rounded text-xs border flex items-center gap-2 cursor-pointer",
                                type === currentContentType
                                  ? "bg-[#252526] border-[#3e3e42] text-white"
                                  : "border-transparent text-gray-500 hover:text-gray-300"
                              )}
                              onClick={() => setActiveContentType(type)}
                            >
                              <span>{type}</span>
                              <ConfirmPopover
                                title="Delete Content Type"
                                description={`Are you sure you want to delete the content type "${type}"?`}
                                onConfirm={() => {
                                  const newResponses = {
                                    ...(data.responses || {}),
                                  };
                                  const newContent = { ...response.content };
                                  delete newContent[type];
                                  newResponses[currentCode] = {
                                    ...response,
                                    content: newContent,
                                  };
                                  onChange({
                                    ...data,
                                    responses: newResponses,
                                  });
                                  if (type === activeContentType) {
                                    setActiveContentType(null);
                                  }
                                }}
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 hover:text-red-400"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 size={10} />
                                  </Button>
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {response.content?.[currentContentType]?.schema && (
                        <SchemaDesigner
                          schema={
                            response.content[currentContentType]
                              .schema as SchemaObject
                          }
                          onChange={(newSchema) => {
                            const newResponses = { ...(data.responses || {}) };
                            const currentRes = newResponses[
                              currentCode
                            ] as ResponseObject;
                            if (currentRes.content?.[currentContentType]) {
                              currentRes.content[currentContentType].schema =
                                newSchema;
                            }
                            onChange({ ...data, responses: newResponses });
                          }}
                        />
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
