import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/Input";
import { Label } from "../../../../ui/Label";
import { Textarea } from "../../../../ui/Textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../ui/Popover";
import { ConfirmPopover } from "../../../../ui/ConfirmPopover";
import type {
  RequestBodyObject,
  MediaTypeObject,
  SchemaObject,
} from "openapi3-ts/oas31";
import { SchemaDesigner } from "../SchemasEditor/SchemaDesigner";

const COMMON_MEDIA_TYPES = [
  "application/json",
  "application/xml",
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain",
];

interface RequestBodyDesignerProps {
  requestBody: RequestBodyObject;
  onChange: (requestBody: RequestBodyObject) => void;
}

export const RequestBodyDesigner = ({
  requestBody,
  onChange,
}: RequestBodyDesignerProps) => {
  const [activeMediaType, setActiveMediaType] = useState<string>(
    Object.keys(requestBody.content || {})[0] || ""
  );
  const [newMediaType, setNewMediaType] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleAddMediaType = (type?: string) => {
    const typeToAdd = type || newMediaType;
    if (!typeToAdd) return;

    if (requestBody.content && requestBody.content[typeToAdd]) {
      setActiveMediaType(typeToAdd);
      setNewMediaType("");
      setIsPopoverOpen(false);
      return;
    }

    const newContent = {
      ...requestBody.content,
      [typeToAdd]: {
        schema: { type: "object" },
      } as MediaTypeObject,
    };
    onChange({ ...requestBody, content: newContent });
    setActiveMediaType(typeToAdd);
    setNewMediaType("");
    setIsPopoverOpen(false);
  };

  const handleDeleteMediaType = (mediaType: string) => {
    const newContent = { ...requestBody.content };
    delete newContent[mediaType];
    onChange({ ...requestBody, content: newContent });
    if (activeMediaType === mediaType) {
      setActiveMediaType(Object.keys(newContent)[0] || "");
    }
  };

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
        <div className="flex items-center justify-between">
          <Label>Content (Media Types)</Label>
        </div>

        <div className="flex gap-2">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="secondary">
                <Plus size={14} className="mr-2" />
                Add Media Type
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-2">
                <div className="font-medium text-xs text-gray-400 px-2">
                  Common Types
                </div>
                <div className="flex flex-col gap-1">
                  {COMMON_MEDIA_TYPES.map((type) => (
                    <button
                      key={type}
                      className="text-left px-2 py-1.5 text-sm text-gray-200 hover:bg-[#37373d] rounded transition-colors"
                      onClick={() => handleAddMediaType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#3e3e42] my-2" />
                <div className="font-medium text-xs text-gray-400 px-2">
                  Custom Type
                </div>
                <div className="flex gap-2 px-2">
                  <Input
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value)}
                    placeholder="e.g. image/png"
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddMediaType();
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => handleAddMediaType()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-4">
          {Object.keys(requestBody.content || {}).length > 0 ? (
            <div className="flex gap-4">
              <div className="w-48 flex flex-col gap-1">
                {Object.keys(requestBody.content || {}).map((mediaType) => (
                  <div
                    key={mediaType}
                    className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer ${
                      activeMediaType === mediaType
                        ? "bg-[#37373d] text-white"
                        : "hover:bg-[#2a2d2e] text-gray-400"
                    }`}
                    onClick={() => setActiveMediaType(mediaType)}
                  >
                    <span className="truncate text-sm" title={mediaType}>
                      {mediaType}
                    </span>
                    <ConfirmPopover
                      title="Delete Media Type"
                      description={`Are you sure you want to delete media type "${mediaType}"?`}
                      onConfirm={() => handleDeleteMediaType(mediaType)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-red-500/20 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex-1 border-l border-[#3e3e42] pl-4">
                {activeMediaType && requestBody.content[activeMediaType] && (
                  <div className="space-y-4">
                    <Label className="text-sm text-gray-400">
                      Schema for {activeMediaType}
                    </Label>
                    <SchemaDesigner
                      schema={
                        (requestBody.content[activeMediaType]
                          .schema as SchemaObject) || { type: "object" }
                      }
                      onChange={(newSchema) => {
                        const newContent = {
                          ...requestBody.content,
                          [activeMediaType]: {
                            ...requestBody.content[activeMediaType],
                            schema: newSchema,
                          },
                        };
                        onChange({ ...requestBody, content: newContent });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No media types defined.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
