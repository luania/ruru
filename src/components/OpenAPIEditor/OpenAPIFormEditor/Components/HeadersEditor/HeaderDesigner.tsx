import { Label } from "../../../../ui/Label";
import { Textarea } from "../../../../ui/Textarea";
import type { HeaderObject, SchemaObject } from "openapi3-ts/oas31";
import { SchemaDesigner } from "../SchemasEditor/SchemaDesigner";

interface HeaderDesignerProps {
  header: HeaderObject;
  onChange: (header: HeaderObject) => void;
}

export const HeaderDesigner = ({ header, onChange }: HeaderDesignerProps) => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={header.description || ""}
          onChange={(e) => onChange({ ...header, description: e.target.value })}
          placeholder="Header description"
          className="min-h-[100px]"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="required"
            checked={header.required || false}
            onChange={(e) =>
              onChange({ ...header, required: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 bg-[#1e1e1e] text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="required" className="cursor-pointer">
            Required
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="deprecated"
            checked={header.deprecated || false}
            onChange={(e) =>
              onChange({ ...header, deprecated: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 bg-[#1e1e1e] text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="deprecated" className="cursor-pointer">
            Deprecated
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Schema</Label>
        <SchemaDesigner
          schema={(header.schema as SchemaObject) || { type: "string" }}
          onChange={(newSchema) => onChange({ ...header, schema: newSchema })}
        />
      </div>
    </div>
  );
};
