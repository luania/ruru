import { useMemo } from "react";
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
} from "openapi3-ts/oas31";
import { cn, getSchemaTypeColor } from "../../../../../lib/utils";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/Input";
import { ConfirmPopover } from "../../../../ui/ConfirmPopover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../ui/Select";
import { Switch } from "../../../../ui/Switch";
import { Textarea } from "../../../../ui/Textarea";
import { SchemaAdvancedSettings } from "../../Components/SchemaAdvancedSettings";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../ui/Popover";
import { ReferenceSelector } from "../../../ReferenceSelector";
import type { OpenAPIObject } from "openapi3-ts/oas31";
import { RequestBodyEditor } from "./RequestBodyEditor";
import { ResponsesEditor } from "./ResponsesEditor";

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
  openapi: OpenAPIObject;
  onChange: (data: OperationObject) => void;
  onDelete?: () => void;
}

export const OperationEditor = ({
  path,
  data,
  openapi,
  onChange,
  onDelete,
}: OperationEditorProps) => {
  const components = openapi.components;
  const globalTags = openapi.tags;

  const pathParamNames = useMemo(() => {
    return (path.match(/\{([^}]+)\}/g) || []).map((s) => s.slice(1, -1));
  }, [path]);

  const handleParamChange = (
    index: number,
    field: keyof ParameterObject,
    value: ParameterObject[keyof ParameterObject],
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

    const availableSchemes = Object.keys(components?.securitySchemes || {});

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
    inType: ParameterObject["in"],
  ) => {
    const params = (data.parameters || [])
      .map((p, i) => ({ ...p, _index: i }))
      .filter((p) => {
        if ("$ref" in p) {
          const refName = p.$ref.split("/").pop();
          const resolved = components?.parameters?.[refName || ""];

          // 1. Try to resolve locally
          if (resolved && "in" in resolved) {
            return (resolved as ParameterObject).in === inType;
          }

          // 2. Check if this $ref matches a path param name — exclude from non-path sections
          if (
            pathParamNames.some(
              (n) => n.toLowerCase() === refName?.toLowerCase(),
            )
          ) {
            return inType === "path";
          }

          // 3. Heuristic for external/unresolved refs
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

          // 4. Check for common parameter names that are usually query params
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

          // 5. Default fallback to 'query' if we can't determine
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
                        (components?.parameters?.[refName!] as ParameterObject)
                          ?.description
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
                          e.target.value,
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
                          : "text-gray-500",
                      )}
                      onClick={() =>
                        handleParamChange(
                          param._index,
                          "required",
                          !(param as ParameterObject).required,
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
                    parameterIn={inType}
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
                            const resolved = components?.parameters?.[refName!];
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
                          "h-7 max-w-[320px] hover:text-white",
                          isRef ? "text-blue-400" : "text-gray-500",
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
                                newSchema,
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
                  {!globalTags?.length ? (
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
                              : "hover:bg-[#2a2d2e] text-gray-300 hover:text-white",
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
      <RequestBodyEditor
        requestBody={data.requestBody as RequestBodyObject | undefined}
        onChange={(body) => {
          if (body === undefined) {
            const newData = { ...data };
            delete newData.requestBody;
            onChange(newData);
          } else {
            onChange({ ...data, requestBody: body });
          }
        }}
      />

      {/* Responses */}
      <ResponsesEditor
        responses={data.responses as Record<string, ResponseObject> | undefined}
        onChange={(responses) => onChange({ ...data, responses })}
      />
    </div>
  );
};
