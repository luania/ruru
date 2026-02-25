import type { RequestBodyObject } from "openapi3-ts/oas31";
import { Label } from "../../../../ui/Label";
import { Textarea } from "../../../../ui/Textarea";
import { MediaTypeSchemaEditor } from "../../MediaTypeSchemaEditor";

interface RequestBodyDesignerProps {
  requestBody: RequestBodyObject;
  onChange: (requestBody: RequestBodyObject) => void;
}

export const RequestBodyDesigner = ({
  requestBody,
  onChange,
}: RequestBodyDesignerProps) => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={requestBody.description || ""}
          onChange={(e) =>
            onChange({ ...requestBody, description: e.target.value })
          }
          placeholder="Request body description"
          className="min-h-[100px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={requestBody.required || false}
          onChange={(e) =>
            onChange({ ...requestBody, required: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300 bg-[#1e1e1e] text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor="required" className="cursor-pointer">
          Required
        </Label>
      </div>

      <div className="space-y-4">
        <Label>Content (Media Types)</Label>
        <MediaTypeSchemaEditor
          content={requestBody.content || {}}
          onChange={(content) => onChange({ ...requestBody, content })}
        />
      </div>
    </div>
  );
};
