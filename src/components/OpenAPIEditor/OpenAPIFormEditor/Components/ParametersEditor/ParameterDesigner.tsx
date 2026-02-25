import { Input } from "../../../../ui/Input";
import { Label } from "../../../../ui/Label";
import { Textarea } from "../../../../ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../ui/Select";
import type { ParameterObject, SchemaObject } from "openapi3-ts/oas31";
import { SchemaDesigner } from "../SchemasEditor/SchemaDesigner";

interface ParameterDesignerProps {
  parameter: ParameterObject;
  onChange: (parameter: ParameterObject) => void;
}

export const ParameterDesigner = ({
  parameter,
  onChange,
}: ParameterDesignerProps) => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={parameter.name}
            onChange={(e) => onChange({ ...parameter, name: e.target.value })}
            placeholder="Parameter Name"
          />
        </div>
        <div className="space-y-2">
          <Label>In</Label>
          <Select
            value={parameter.in}
            onValueChange={(value) =>
              onChange({
                ...parameter,
                in: value as ParameterObject["in"],
                ...(value === "path" ? { required: true } : {}),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="query">Query</SelectItem>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="path">Path</SelectItem>
              <SelectItem value="cookie">Cookie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={parameter.description || ""}
          onChange={(e) =>
            onChange({ ...parameter, description: e.target.value })
          }
          placeholder="Parameter description"
          className="min-h-[100px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={parameter.required || false}
          disabled={parameter.in === "path"}
          onChange={(e) =>
            onChange({ ...parameter, required: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300 bg-[#1e1e1e] text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Label htmlFor="required" className="cursor-pointer">
          Required
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Schema</Label>
        <SchemaDesigner
          schema={(parameter.schema as SchemaObject) || { type: "string" }}
          onChange={(newSchema) =>
            onChange({ ...parameter, schema: newSchema })
          }
        />
      </div>
    </div>
  );
};
