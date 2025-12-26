import { Input } from "../../../../ui/Input";
import { Label } from "../../../../ui/Label";
import { Textarea } from "../../../../ui/Textarea";
import type { OperationObject } from "openapi3-ts/oas31";

interface OperationDesignerProps {
  method: string;
  operation: OperationObject;
  onChange: (operation: OperationObject) => void;
}

export const OperationDesigner = ({
  method,
  operation,
  onChange,
}: OperationDesignerProps) => {
  return (
    <div className="space-y-4 border border-[#3e3e42] rounded p-4 bg-[#252526]">
      <div className="flex items-center gap-2 mb-4">
        <span className="uppercase font-bold text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
          {method}
        </span>
        <span className="text-sm font-medium text-gray-300">
          Operation Details
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Operation ID</Label>
          <Input
            value={operation.operationId || ""}
            onChange={(e) =>
              onChange({ ...operation, operationId: e.target.value })
            }
            placeholder="uniqueOperationId"
          />
        </div>
        <div className="space-y-2">
          <Label>Summary</Label>
          <Input
            value={operation.summary || ""}
            onChange={(e) =>
              onChange({ ...operation, summary: e.target.value })
            }
            placeholder="Short summary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={operation.description || ""}
          onChange={(e) =>
            onChange({ ...operation, description: e.target.value })
          }
          placeholder="Detailed description"
          className="min-h-[80px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`deprecated-${method}`}
          checked={operation.deprecated || false}
          onChange={(e) =>
            onChange({ ...operation, deprecated: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300 bg-[#1e1e1e] text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor={`deprecated-${method}`} className="cursor-pointer">
          Deprecated
        </Label>
      </div>
    </div>
  );
};
