import { useState } from "react";
import { Input } from "../../../../ui/Input";
import { Label } from "../../../../ui/Label";
import { Textarea } from "../../../../ui/Textarea";
import { Button } from "../../../../ui/Button";
import { Plus, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../ui/Popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../ui/Select";
import type { ResponseObject, SchemaObject } from "openapi3-ts/oas31";
import { SchemaDesigner } from "../SchemasEditor/SchemaDesigner";
import { cn } from "../../../../../lib/utils";

interface ResponseDesignerProps {
  response: ResponseObject;
  onChange: (response: ResponseObject) => void;
}

const COMMON_MEDIA_TYPES = [
  "application/json",
  "application/xml",
  "text/plain",
  "multipart/form-data",
  "application/x-www-form-urlencoded",
];

export const ResponseDesigner = ({
  response,
  onChange,
}: ResponseDesignerProps) => {
  const [selectedMediaType, setSelectedMediaType] = useState<string | null>(
    null
  );
  const [newMediaType, setNewMediaType] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const content = response.content || {};

  const handleAddMediaType = (type?: string) => {
    const typeToAdd = type || newMediaType;
    if (!typeToAdd) return;

    const newContent = {
      ...content,
      [typeToAdd]: {
        schema: {
          type: "object",
          properties: {},
        } as SchemaObject,
      },
    };
    onChange({ ...response, content: newContent });
    setSelectedMediaType(typeToAdd);
    setNewMediaType("");
    setIsPopoverOpen(false);
  };

  const handleDeleteMediaType = (mediaType: string) => {
    const newContent = { ...content };
    delete newContent[mediaType];
    onChange({ ...response, content: newContent });
    if (selectedMediaType === mediaType) {
      setSelectedMediaType(null);
    }
  };

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
        <div className="flex h-[500px] border border-[#3e3e42] rounded-md overflow-hidden">
          {/* Media Types List */}
          <div className="w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col">
            <div className="p-3 border-b border-[#3e3e42] flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">
                Media Types
              </span>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Plus size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <div className="space-y-3">
                    <h4 className="font-medium leading-none text-white">
                      Add Media Type
                    </h4>
                    <div className="space-y-2">
                      <Select onValueChange={(val) => handleAddMediaType(val)}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select Common Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_MEDIA_TYPES.map((type) => (
                            <SelectItem
                              key={type}
                              value={type}
                              disabled={!!content[type]}
                            >
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-[#3e3e42]" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-[#1e1e1e] px-2 text-gray-500">
                            Or custom
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. application/pdf"
                          value={newMediaType}
                          onChange={(e) => setNewMediaType(e.target.value)}
                          className="h-8 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddMediaType();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddMediaType()}
                          disabled={!newMediaType || !!content[newMediaType]}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 overflow-auto">
              {Object.keys(content).map((mediaType) => (
                <div
                  key={mediaType}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[#2a2d2e] group text-sm",
                    selectedMediaType === mediaType
                      ? "bg-[#37373d] text-white"
                      : "text-gray-400"
                  )}
                  onClick={() => setSelectedMediaType(mediaType)}
                >
                  <span className="truncate" title={mediaType}>
                    {mediaType}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMediaType(mediaType);
                    }}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Schema Editor for Media Type */}
          <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4">
            {selectedMediaType && content[selectedMediaType] ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300">
                    Schema for {selectedMediaType}
                  </h3>
                </div>
                <SchemaDesigner
                  schema={
                    (content[selectedMediaType].schema as SchemaObject) || {}
                  }
                  onChange={(newSchema) => {
                    const newContent = {
                      ...content,
                      [selectedMediaType]: {
                        ...content[selectedMediaType],
                        schema: newSchema,
                      },
                    };
                    onChange({ ...response, content: newContent });
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Select a media type to edit its schema
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
