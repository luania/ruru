import { useState } from "react";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Switch } from "../../../ui/Switch";
import { Button } from "../../../ui/Button";
import { Plus, X } from "lucide-react";
import type { SchemaObject } from "openapi3-ts/oas31";

interface SchemaAdvancedSettingsProps {
  schema: SchemaObject;
  onChange: (schema: SchemaObject) => void;
}

export const SchemaAdvancedSettings = ({
  schema,
  onChange,
}: SchemaAdvancedSettingsProps) => {
  const type = schema.type as string;
  const [newEnumValue, setNewEnumValue] = useState("");

  const handleChange = (field: keyof SchemaObject, value: unknown) => {
    const newSchema = { ...schema, [field]: value };
    if (value === "" || value === undefined || value === null) {
      delete (newSchema as Record<string, unknown>)[field];
    }
    onChange(newSchema);
  };

  const handleAddEnum = () => {
    if (!newEnumValue) return;
    let value: string | number | boolean = newEnumValue;
    if (type === "integer" || type === "number") {
      value = Number(newEnumValue);
      if (isNaN(value)) return;
    } else if (type === "boolean") {
      value = newEnumValue === "true";
    }

    const currentEnums = schema.enum || [];
    if (!currentEnums.includes(value)) {
      handleChange("enum", [...currentEnums, value]);
    }
    setNewEnumValue("");
  };

  const handleRemoveEnum = (index: number) => {
    const currentEnums = schema.enum || [];
    const newEnums = [...currentEnums];
    newEnums.splice(index, 1);
    handleChange("enum", newEnums.length ? newEnums : undefined);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Default Value</Label>
        <Input
          value={schema.default || ""}
          onChange={(e) => handleChange("default", e.target.value)}
          className="h-7 text-xs"
          placeholder="Default value"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Example</Label>
        <Input
          value={schema.example || ""}
          onChange={(e) => handleChange("example", e.target.value)}
          className="h-7 text-xs"
          placeholder="Example value"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Enum Values</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(schema.enum || []).map(
            (val: string | number | boolean, i: number) => (
              <div
                key={i}
                className="flex items-center gap-1 bg-[#252526] border border-[#3e3e42] rounded px-2 py-1 text-xs group text-gray-300"
              >
                <span className="max-w-[150px] truncate" title={String(val)}>
                  {String(val)}
                </span>
                <button
                  onClick={() => handleRemoveEnum(i)}
                  className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            )
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={newEnumValue}
            onChange={(e) => setNewEnumValue(e.target.value)}
            className="h-7 text-xs flex-1"
            placeholder={
              type === "integer" || type === "number"
                ? "Add number..."
                : "Add value..."
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddEnum();
              }
            }}
          />
          <Button size="sm" className="h-7 px-2" onClick={handleAddEnum}>
            <Plus size={14} />
          </Button>
        </div>
      </div>

      <div className="h-px bg-[#3e3e42] my-2" />

      {/* String */}
      {(type === "string" || !type) && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Min Length</Label>
              <Input
                type="number"
                value={schema.minLength || ""}
                onChange={(e) =>
                  handleChange(
                    "minLength",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Max Length</Label>
              <Input
                type="number"
                value={schema.maxLength || ""}
                onChange={(e) =>
                  handleChange(
                    "maxLength",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Pattern (Regex)</Label>
            <Input
              value={schema.pattern || ""}
              onChange={(e) => handleChange("pattern", e.target.value)}
              className="h-7 text-xs"
              placeholder="^[a-z]+$"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Format</Label>
            <Input
              value={schema.format || ""}
              onChange={(e) => handleChange("format", e.target.value)}
              className="h-7 text-xs"
              placeholder="email, uuid, date-time..."
            />
          </div>
        </div>
      )}

      {/* Number/Integer */}
      {(type === "number" || type === "integer") && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Minimum</Label>
              <Input
                type="number"
                value={schema.minimum || ""}
                onChange={(e) =>
                  handleChange(
                    "minimum",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Maximum</Label>
              <Input
                type="number"
                value={schema.maximum || ""}
                onChange={(e) =>
                  handleChange(
                    "maximum",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between pt-4">
              <Label className="text-xs text-gray-400">Exclusive Min</Label>
              <Switch
                checked={!!schema.exclusiveMinimum}
                onCheckedChange={(checked) =>
                  handleChange("exclusiveMinimum", checked)
                }
                className="scale-75"
              />
            </div>
            <div className="flex items-center justify-between pt-4">
              <Label className="text-xs text-gray-400">Exclusive Max</Label>
              <Switch
                checked={!!schema.exclusiveMaximum}
                onCheckedChange={(checked) =>
                  handleChange("exclusiveMaximum", checked)
                }
                className="scale-75"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Multiple Of</Label>
            <Input
              type="number"
              value={schema.multipleOf || ""}
              onChange={(e) =>
                handleChange(
                  "multipleOf",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}

      {/* Array */}
      {type === "array" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Min Items</Label>
              <Input
                type="number"
                value={schema.minItems || ""}
                onChange={(e) =>
                  handleChange(
                    "minItems",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Max Items</Label>
              <Input
                type="number"
                value={schema.maxItems || ""}
                onChange={(e) =>
                  handleChange(
                    "maxItems",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-400">Unique Items</Label>
            <Switch
              checked={!!schema.uniqueItems}
              onCheckedChange={(checked) =>
                handleChange("uniqueItems", checked)
              }
              className="scale-75"
            />
          </div>
        </div>
      )}

      <div className="h-px bg-[#3e3e42] my-2" />

      <div className="flex items-center justify-between">
        <Label className="text-xs text-gray-400">Deprecated</Label>
        <Switch
          checked={!!schema.deprecated}
          onCheckedChange={(checked) => handleChange("deprecated", checked)}
          className="scale-75"
        />
      </div>
    </div>
  );
};
