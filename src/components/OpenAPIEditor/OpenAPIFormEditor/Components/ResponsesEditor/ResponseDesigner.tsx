import type { ResponseObject } from "openapi3-ts/oas31";
import { Label } from "../../../../ui/Label";
import { Textarea } from "../../../../ui/Textarea";
import { MediaTypeSchemaEditor } from "../../MediaTypeSchemaEditor";

interface ResponseDesignerProps {
  response: ResponseObject;
  onChange: (response: ResponseObject) => void;
}

export const ResponseDesigner = ({
  response,
  onChange,
}: ResponseDesignerProps) => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={response.description}
          onChange={(e) =>
            onChange({ ...response, description: e.target.value })
          }
          placeholder="Response description"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-4">
        <Label>Content</Label>
        <MediaTypeSchemaEditor
          content={response.content || {}}
          onChange={(content) => onChange({ ...response, content })}
          mediaTypeContext="response"
        />
      </div>
    </div>
  );
};
