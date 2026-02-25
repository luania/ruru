import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { ContentObject, SchemaObject } from "openapi3-ts/oas31";
import { cn } from "../../../../lib/utils";
import { Button } from "../../../ui/Button";
import { ConfirmPopover } from "../../../ui/ConfirmPopover";
import { SchemaDesigner } from "../Components/SchemasEditor/SchemaDesigner";
import { AddMediaTypePopover } from "./AddMediaTypePopover";
import type { MediaTypeContext } from "./AddMediaTypePopover";

interface MediaTypeSchemaEditorProps {
  content: ContentObject;
  onChange: (content: ContentObject) => void;
  /** Whether this editor is for request body or response. Defaults to "request". */
  mediaTypeContext?: MediaTypeContext;
}

export const MediaTypeSchemaEditor = ({
  content,
  onChange,
  mediaTypeContext = "request",
}: MediaTypeSchemaEditorProps) => {
  const [activeType, setActiveType] = useState<string | null>(
    Object.keys(content)[0] || null,
  );

  const contentTypes = Object.keys(content);
  const currentType =
    activeType && contentTypes.includes(activeType)
      ? activeType
      : contentTypes[0] || null;

  const handleAdd = (type: string) => {
    onChange({
      ...content,
      [type]: { schema: { type: "object", properties: {} } },
    });
    setActiveType(type);
  };

  const handleDelete = (type: string) => {
    const newContent = { ...content };
    delete newContent[type];
    onChange(newContent);
    if (type === activeType) {
      setActiveType(null);
    }
  };

  const handleSchemaChange = (type: string, newSchema: SchemaObject) => {
    onChange({
      ...content,
      [type]: { ...content[type], schema: newSchema },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <AddMediaTypePopover
          existingTypes={contentTypes}
          onAdd={handleAdd}
          mediaTypeContext={mediaTypeContext}
        />
      </div>
      {contentTypes.length > 0 ? (
        <div className="flex gap-4">
          <div className="w-48 flex flex-col gap-1">
            {contentTypes.map((type) => (
              <div
                key={type}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded cursor-pointer group",
                  currentType === type
                    ? "bg-[#37373d] text-white"
                    : "hover:bg-[#2a2d2e] text-gray-400",
                )}
                onClick={() => setActiveType(type)}
              >
                <span className="truncate text-sm" title={type}>
                  {type}
                </span>
                <ConfirmPopover
                  title="Delete Media Type"
                  description={`Are you sure you want to delete media type "${type}"?`}
                  onConfirm={() => handleDelete(type)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 size={12} />
                    </Button>
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex-1">
            {currentType && content[currentType] && (
              <SchemaDesigner
                schema={
                  (content[currentType].schema as SchemaObject) || {
                    type: "object",
                  }
                }
                onChange={(s) => handleSchemaChange(currentType, s)}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">
          No media types defined.
        </div>
      )}
    </div>
  );
};
