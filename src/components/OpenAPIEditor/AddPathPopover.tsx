import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { cn, getMethodColor } from "../../lib/utils";

interface AddPathPopoverProps {
  onAdd: (path: string, methods: string[]) => void;
}

const METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
] as const;

export const AddPathPopover = ({ onAdd }: AddPathPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("/");
  const [selectedMethods, setSelectedMethods] = useState<string[]>(["get"]);

  const handleMethodToggle = (method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  const handleAdd = () => {
    if (!path) return;
    onAdd(path, selectedMethods);
    setOpen(false);
    setPath("/");
    setSelectedMethods(["get"]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:bg-[#3e3e42]"
        >
          <Plus size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-[#1e1e1e] border-[#3e3e42]">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">Path</label>
            <Input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/users"
              className="h-8 bg-[#252526] border-[#3e3e42]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">Methods</label>
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => handleMethodToggle(method)}
                  className={cn(
                    "px-2 py-1 text-[10px] uppercase rounded border transition-colors",
                    selectedMethods.includes(method)
                      ? cn(getMethodColor(method), "border-transparent")
                      : "border-[#3e3e42] text-gray-400 hover:border-gray-500 bg-[#252526]"
                  )}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleAdd}
            className="w-full"
            disabled={!path || selectedMethods.length === 0}
          >
            Add Path
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
