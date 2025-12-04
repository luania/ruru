import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/Popover";
import { ConfirmPopover } from "../../../ui/ConfirmPopover";
import type { CallbackObject, PathItemObject } from "openapi3-ts/oas31";
import { PathItemDesigner } from "./PathItemDesigner";

interface CallbackDesignerProps {
  callback: CallbackObject;
  onChange: (callback: CallbackObject) => void;
}

export const CallbackDesigner = ({
  callback,
  onChange,
}: CallbackDesignerProps) => {
  const [selectedExpression, setSelectedExpression] = useState<string | null>(
    Object.keys(callback)[0] || null
  );
  const [newExpression, setNewExpression] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleAddExpression = () => {
    if (!newExpression) return;
    if (callback[newExpression]) return;

    const newCallback = {
      ...callback,
      [newExpression]: {
        description: "New Path Item",
      } as PathItemObject,
    };
    onChange(newCallback);
    setSelectedExpression(newExpression);
    setNewExpression("");
    setIsPopoverOpen(false);
  };

  const handleDeleteExpression = (expression: string) => {
    const newCallback = { ...callback };
    delete newCallback[expression];
    onChange(newCallback);
    if (selectedExpression === expression) {
      setSelectedExpression(Object.keys(newCallback)[0] || null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Callback Expressions (Runtime URLs)</Label>
        </div>

        <div className="flex gap-2">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="secondary">
                <Plus size={14} className="mr-2" />
                Add Expression
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-3" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-white">
                  New Expression
                </h4>
                <div className="flex gap-2">
                  <Input
                    value={newExpression}
                    onChange={(e) => setNewExpression(e.target.value)}
                    placeholder="e.g. {$request.query.callbackUrl}"
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddExpression();
                    }}
                  />
                  <Button
                    onClick={handleAddExpression}
                    size="sm"
                    className="h-8"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-4">
          {Object.keys(callback).length > 0 ? (
            <div className="flex gap-4">
              <div className="w-64 flex flex-col gap-1">
                {Object.keys(callback).map((expression) => (
                  <div
                    key={expression}
                    className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer ${
                      selectedExpression === expression
                        ? "bg-[#37373d] text-white"
                        : "hover:bg-[#2a2d2e] text-gray-400"
                    }`}
                    onClick={() => setSelectedExpression(expression)}
                  >
                    <span className="truncate text-sm" title={expression}>
                      {expression}
                    </span>
                    <ConfirmPopover
                      title="Delete Expression"
                      description={`Are you sure you want to delete expression "${expression}"?`}
                      onConfirm={() => handleDeleteExpression(expression)}
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
                {selectedExpression && callback[selectedExpression] && (
                  <div className="space-y-4">
                    <Label className="text-sm text-gray-400">
                      Path Item for {selectedExpression}
                    </Label>
                    <PathItemDesigner
                      pathItem={callback[selectedExpression] as PathItemObject}
                      onChange={(newPathItem) => {
                        const newCallback = {
                          ...callback,
                          [selectedExpression]: newPathItem,
                        };
                        onChange(newCallback);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No expressions defined.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
