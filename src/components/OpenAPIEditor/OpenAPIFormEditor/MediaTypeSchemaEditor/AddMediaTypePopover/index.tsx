import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../ui/Popover";

const REQUEST_MEDIA_TYPES = [
  "application/json",
  "application/xml",
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain",
  "application/octet-stream",
];

const RESPONSE_MEDIA_TYPES = [
  "application/json",
  "application/xml",
  "text/plain",
  "text/html",
  "application/pdf",
  "application/octet-stream",
];

export type MediaTypeContext = "request" | "response";

interface AddMediaTypePopoverProps {
  existingTypes: string[];
  onAdd: (type: string) => void;
  mediaTypeContext: MediaTypeContext;
}

export const AddMediaTypePopover = ({
  existingTypes,
  onAdd,
  mediaTypeContext,
}: AddMediaTypePopoverProps) => {
  const [open, setOpen] = useState(false);
  const [customType, setCustomType] = useState("");

  const commonTypes =
    mediaTypeContext === "request" ? REQUEST_MEDIA_TYPES : RESPONSE_MEDIA_TYPES;

  const handleAdd = (type: string) => {
    if (!type) return;
    if (existingTypes.includes(type)) return;
    onAdd(type);
    setCustomType("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          title="Add Content Type"
        >
          <Plus size={14} />
          Add Media Type
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-400">
            Add Content Type
          </div>
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
            {commonTypes.map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => setCustomType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="e.g. application/pdf"
              className="h-8 text-xs bg-[#1e1e1e] border-[#3e3e42]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd(customType);
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-8 text-xs"
              disabled={!customType || existingTypes.includes(customType)}
              onClick={() => handleAdd(customType)}
            >
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
