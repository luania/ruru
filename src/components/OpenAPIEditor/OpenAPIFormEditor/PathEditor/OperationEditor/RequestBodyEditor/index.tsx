import { Plus, Trash2 } from "lucide-react";
import type { RequestBodyObject } from "openapi3-ts/oas31";
import { Button } from "../../../../../ui/Button";
import { ConfirmPopover } from "../../../../../ui/ConfirmPopover";
import { MediaTypeSchemaEditor } from "../../../MediaTypeSchemaEditor";

interface RequestBodyEditorProps {
  requestBody?: RequestBodyObject;
  onChange: (body?: RequestBodyObject) => void;
}

export const RequestBodyEditor = ({
  requestBody,
  onChange,
}: RequestBodyEditorProps) => {
  if (!requestBody) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                content: {
                  "application/json": {
                    schema: { type: "object", properties: {} },
                  },
                },
              })
            }
          >
            <Plus size={14} className="mr-2" /> Add Body
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-400">
              Request Body
            </div>
            <ConfirmPopover
              title="Delete Request Body"
              description="Are you sure you want to delete the request body?"
              onConfirm={() => onChange(undefined)}
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

          <MediaTypeSchemaEditor
            content={requestBody.content || {}}
            onChange={(content) => onChange({ ...requestBody, content })}
          />
        </div>
      </div>
    </div>
  );
};
