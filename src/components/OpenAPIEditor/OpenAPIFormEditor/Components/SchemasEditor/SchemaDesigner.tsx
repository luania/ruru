import { useState, Fragment } from "react";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Book,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/Input";
import { Textarea } from "../../../../ui/Textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../ui/Popover";
import { cn, getSchemaTypeColor } from "../../../../../lib/utils";
import { ConfirmPopover } from "../../../../ui/ConfirmPopover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectSeparator,
} from "../../../../ui/Select";
import type { SchemaObject, ReferenceObject } from "openapi3-ts/oas31";
import { SchemaAdvancedSettings } from "../SchemaAdvancedSettings";
import { ReferenceSelector } from "../../../ReferenceSelector";

interface SchemaRowProps {
  name?: string;
  schema: SchemaObject | ReferenceObject;
  depth?: number;
  isLast?: boolean;
  onUpdate: (newSchema: SchemaObject | ReferenceObject) => void;
  onDelete?: () => void;
  onRename?: (newName: string) => void;
  required?: boolean;
  onToggleRequired?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const DATA_TYPES = [
  "string",
  "number",
  "integer",
  "boolean",
  "array",
  "object",
  "allOf",
  "oneOf",
  "anyOf",
  "$ref",
];

const SchemaRow = ({
  name,
  schema,
  depth = 0,
  onUpdate,
  onDelete,
  onRename,
  required,
  onToggleRequired,
  onMoveUp,
  onMoveDown,
}: SchemaRowProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenamePopoverOpen, setIsRenamePopoverOpen] = useState(false);
  const [isDescriptionPopoverOpen, setIsDescriptionPopoverOpen] =
    useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(name || "");
  const [description, setDescription] = useState(
    (schema as SchemaObject).description || "",
  );

  const isRef = "$ref" in schema;
  let type = isRef ? "$ref" : (schema as SchemaObject).type;

  if (!type && !isRef) {
    const s = schema as SchemaObject;
    if (s.allOf) type = "allOf";
    else if (s.oneOf) type = "oneOf";
    else if (s.anyOf) type = "anyOf";
    else type = "object";
  }

  // Helper to update current schema
  const updateSchema = (updates: Partial<SchemaObject> | ReferenceObject) => {
    onUpdate({ ...schema, ...updates } as SchemaObject | ReferenceObject);
  };

  const renderChildren = () => {
    if (isRef) return null;
    const s = schema as SchemaObject;
    let children = null;

    if (type === "object" && s.properties) {
      const entries = Object.entries(s.properties);
      children = entries.map(([propName, propSchema], index) => (
        <SchemaRow
          key={propName}
          name={propName}
          schema={propSchema}
          depth={depth + 1}
          required={s.required?.includes(propName)}
          onUpdate={(newPropSchema) => {
            const newProperties = {
              ...s.properties,
              [propName]: newPropSchema,
            };
            updateSchema({ properties: newProperties });
          }}
          onRename={(newName) => {
            if (!newName || newName === propName) return;
            if (s.properties && newName in s.properties) return; // Prevent duplicates

            const entries = Object.entries(s.properties || {});
            const newEntries = entries.map(([k, v]) => [
              k === propName ? newName : k,
              v,
            ]);
            const newProperties = Object.fromEntries(newEntries);

            let newRequired = s.required;
            if (s.required?.includes(propName)) {
              newRequired = s.required.map((r) =>
                r === propName ? newName : r,
              );
            }

            updateSchema({ properties: newProperties, required: newRequired });
          }}
          onDelete={() => {
            const newProperties = { ...s.properties };
            delete newProperties[propName];
            const newRequired = s.required?.filter((r) => r !== propName);
            updateSchema({ properties: newProperties, required: newRequired });
          }}
          onToggleRequired={() => {
            let newRequired = s.required || [];
            if (newRequired.includes(propName)) {
              newRequired = newRequired.filter((r) => r !== propName);
            } else {
              newRequired = [...newRequired, propName];
            }
            updateSchema({ required: newRequired });
          }}
          onMoveUp={
            index > 0
              ? () => {
                  const newEntries = [...entries];
                  [newEntries[index - 1], newEntries[index]] = [
                    newEntries[index],
                    newEntries[index - 1],
                  ];
                  const newProperties = Object.fromEntries(newEntries);
                  updateSchema({ properties: newProperties });
                }
              : undefined
          }
          onMoveDown={
            index < entries.length - 1
              ? () => {
                  const newEntries = [...entries];
                  [newEntries[index + 1], newEntries[index]] = [
                    newEntries[index],
                    newEntries[index + 1],
                  ];
                  const newProperties = Object.fromEntries(newEntries);
                  updateSchema({ properties: newProperties });
                }
              : undefined
          }
        />
      ));
    } else if (type === "array" && s.items) {
      children = (
        <SchemaRow
          name="items"
          schema={s.items}
          depth={depth + 1}
          onUpdate={(newItemsSchema) => {
            updateSchema({ items: newItemsSchema });
          }}
        />
      );
    } else if (["allOf", "oneOf", "anyOf"].includes(type as string)) {
      const combinator = type as "allOf" | "oneOf" | "anyOf";
      const items = (s[combinator] || []) as (SchemaObject | ReferenceObject)[];
      children = items.map((itemSchema, index) => (
        <SchemaRow
          key={index}
          name="-"
          schema={itemSchema}
          depth={depth + 1}
          onUpdate={(newItemSchema) => {
            const newItems = [...items];
            newItems[index] = newItemSchema;
            updateSchema({ [combinator]: newItems });
          }}
          onDelete={() => {
            const newItems = [...items];
            newItems.splice(index, 1);
            updateSchema({ [combinator]: newItems });
          }}
          onMoveUp={
            index > 0
              ? () => {
                  const newItems = [...items];
                  [newItems[index - 1], newItems[index]] = [
                    newItems[index],
                    newItems[index - 1],
                  ];
                  updateSchema({ [combinator]: newItems });
                }
              : undefined
          }
          onMoveDown={
            index < items.length - 1
              ? () => {
                  const newItems = [...items];
                  [newItems[index + 1], newItems[index]] = [
                    newItems[index],
                    newItems[index + 1],
                  ];
                  updateSchema({ [combinator]: newItems });
                }
              : undefined
          }
        />
      ));
    }

    if (!children) return null;

    return (
      <div className="relative">
        <div
          className="absolute w-px bg-[#3e3e42]"
          style={{
            left: `${depth * 20 + 13}px`,
            top: "0",
            bottom: "0",
          }}
        />
        {children}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center gap-2 py-1 hover:bg-[#2a2d2e] group"
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
      >
        <div className="flex items-center gap-1 min-w-[200px]">
          {/* Expand/Collapse Icon */}
          {(type === "object" ||
            type === "array" ||
            ["allOf", "oneOf", "anyOf"].includes(type as string)) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 hover:bg-[#3e3e42] rounded"
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-gray-400" />
              ) : (
                <ChevronRight size={14} className="text-gray-400" />
              )}
            </button>
          )}
          {/* Indentation spacer if no icon */}
          {type !== "object" &&
            type !== "array" &&
            !["allOf", "oneOf", "anyOf"].includes(type as string) && (
              <div className="w-4" />
            )}

          {/* Property Name */}
          {name &&
            (onRename ? (
              <Popover
                open={isRenamePopoverOpen}
                onOpenChange={(open) => {
                  setIsRenamePopoverOpen(open);
                  if (open) setRenameValue(name);
                }}
              >
                <PopoverTrigger asChild>
                  <span className="text-sm text-gray-300 font-mono cursor-pointer hover:text-white hover:underline decoration-dashed underline-offset-4">
                    {name}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-3">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none text-white text-xs">
                      Rename Property
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-7 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onRename(renameValue);
                            setIsRenamePopoverOpen(false);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          onRename(renameValue);
                          setIsRenamePopoverOpen(false);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <span
                className={cn(
                  "text-sm text-gray-300 font-mono",
                  name === "items" && "opacity-50",
                )}
              >
                {name}
              </span>
            ))}
          {name && name !== "-" && <span className="text-gray-500">:</span>}

          {/* Type Selector */}
          <div className="w-auto flex items-center gap-2">
            <Select
              value={type as string}
              onValueChange={(newType) => {
                if (newType === "$ref") {
                  onUpdate({
                    $ref: "",
                  });
                  return;
                }

                const updates: Partial<SchemaObject> = {};

                if (["allOf", "oneOf", "anyOf"].includes(newType)) {
                  updates.type = undefined;
                  updates[newType as "allOf" | "oneOf" | "anyOf"] = [
                    { type: "string" },
                  ];
                } else {
                  updates.type = newType as SchemaObject["type"];
                }

                // Initialize fields for new type
                if (newType === "array" && !(schema as SchemaObject).items) {
                  updates.items = { type: "string" };
                }

                const newSchema = { ...schema, ...updates } as Record<
                  string,
                  unknown
                >;

                // Remove incompatible fields
                if (newType !== "object") {
                  delete newSchema.properties;
                  delete newSchema.required;
                  delete newSchema.additionalProperties;
                }
                if (newType !== "array") {
                  delete newSchema.items;
                }
                if (!["allOf", "oneOf", "anyOf"].includes(newType)) {
                  delete newSchema.allOf;
                  delete newSchema.oneOf;
                  delete newSchema.anyOf;
                }
                delete newSchema.$ref;

                onUpdate(newSchema as SchemaObject);
              }}
            >
              <SelectTrigger
                showIcon={false}
                className="h-6 border-none bg-transparent p-0 hover:bg-[#3e3e42] w-auto px-1 gap-1 focus:ring-0"
              >
                <span
                  className={cn("text-sm", getSchemaTypeColor(type as string))}
                >
                  {type}
                </span>
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPES.map((t) => (
                  <Fragment key={t}>
                    {(t === "allOf" || t === "$ref") && (
                      <SelectSeparator className="bg-[#3e3e42]" />
                    )}
                    <SelectItem value={t} className={cn(getSchemaTypeColor(t))}>
                      {t}
                    </SelectItem>
                  </Fragment>
                ))}
              </SelectContent>
            </Select>

            {type === "$ref" && (
              <ReferenceSelector
                value={(schema as ReferenceObject).$ref}
                onChange={(val) => onUpdate({ $ref: val })}
                type="schemas"
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 max-w-[320px] bg-[#252526] border-[#3e3e42] text-xs justify-start px-2"
                    title={
                      (schema as ReferenceObject).$ref
                        ? (schema as ReferenceObject).$ref
                        : "Select schema..."
                    }
                  >
                    <span className="truncate">
                      {(schema as ReferenceObject).$ref
                        ? (schema as ReferenceObject).$ref
                        : "Select schema..."}
                    </span>
                  </Button>
                }
              />
            )}
          </div>

          {/* Add Property/Item Button */}
          {(type === "object" ||
            ["allOf", "oneOf", "anyOf"].includes(type as string)) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={() => {
                if (type === "object") {
                  const s = schema as SchemaObject;
                  const newPropName = `newProp${
                    Object.keys(s.properties || {}).length + 1
                  }`;
                  const newProperties = {
                    ...s.properties,
                    [newPropName]: { type: "string" } as SchemaObject,
                  };
                  updateSchema({ properties: newProperties });
                } else {
                  const combinator = type as "allOf" | "oneOf" | "anyOf";
                  const s = schema as SchemaObject;
                  const newItems = [
                    ...(s[combinator] || []),
                    { type: "string" } as SchemaObject,
                  ];
                  updateSchema({ [combinator]: newItems });
                }
              }}
            >
              <Plus size={14} />
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto pr-4">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMoveUp && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white"
                onClick={onMoveUp}
              >
                <ArrowUp size={14} />
              </Button>
            )}
            {onMoveDown && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white"
                onClick={onMoveDown}
              >
                <ArrowDown size={14} />
              </Button>
            )}
          </div>

          {onToggleRequired && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                required
                  ? "text-red-500 hover:text-red-400"
                  : "text-gray-500 hover:text-gray-300",
              )}
              onClick={onToggleRequired}
              title="Toggle Required"
            >
              <AlertCircle size={14} />
            </Button>
          )}

          {!isRef && (
            <Popover
              open={isAdvancedSettingsOpen}
              onOpenChange={setIsAdvancedSettingsOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-gray-300"
                  title="Advanced Settings"
                >
                  <Settings size={14} />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-3 max-h-[400px] overflow-y-auto"
                align="end"
              >
                <SchemaAdvancedSettings
                  schema={schema as SchemaObject}
                  onChange={(newSchema) => onUpdate(newSchema)}
                />
              </PopoverContent>
            </Popover>
          )}

          <Popover
            open={isDescriptionPopoverOpen}
            onOpenChange={setIsDescriptionPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6",
                  (schema as SchemaObject).description
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-gray-500 hover:text-gray-300",
                )}
                title="Edit Description"
              >
                <Book size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3">
              <div className="space-y-2">
                <h4 className="font-medium leading-none text-white text-xs">
                  Description
                </h4>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] text-xs"
                  placeholder="Enter description..."
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      updateSchema({ description });
                      setIsDescriptionPopoverOpen(false);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity min-w-[24px]">
            {onDelete && (
              <ConfirmPopover
                title="Delete Property"
                description={`Are you sure you want to delete property "${name}"?`}
                onConfirm={onDelete}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      {isExpanded && renderChildren()}
    </div>
  );
};

export const SchemaDesigner = ({
  schema,
  onChange,
}: {
  schema: SchemaObject;
  onChange: (schema: SchemaObject) => void;
}) => {
  return (
    <div className="border border-[#3e3e42] rounded-md bg-[#1e1e1e] overflow-hidden">
      <div className="bg-[#252526] px-4 py-2 border-b border-[#3e3e42] flex justify-between items-center">
        <span className="text-sm font-medium text-gray-300">Schema Design</span>
      </div>
      <div className="p-2">
        <SchemaRow
          schema={schema}
          onUpdate={(newSchema) => onChange(newSchema as SchemaObject)}
        />
      </div>
    </div>
  );
};
