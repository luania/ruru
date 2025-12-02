import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../ui/Button";
import { ConfirmPopover } from "../../../ui/ConfirmPopover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/Select";
import type { PathItemObject, OperationObject } from "openapi3-ts/oas31";
import { OperationDesigner } from "./OperationDesigner";

interface PathItemDesignerProps {
  pathItem: PathItemObject;
  onChange: (pathItem: PathItemObject) => void;
}

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

export const PathItemDesigner = ({
  pathItem,
  onChange,
}: PathItemDesignerProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [newMethod, setNewMethod] = useState<string>("");

  const handleAddMethod = () => {
    if (!newMethod) return;
    const method = newMethod.toLowerCase();
    if (pathItem[method as keyof PathItemObject]) return;

    const newPathItem = {
      ...pathItem,
      [method]: {
        summary: "New Operation",
        responses: {},
      } as OperationObject,
    };
    onChange(newPathItem);
    setSelectedMethod(method);
    setNewMethod("");
  };

  const handleDeleteMethod = (method: string) => {
    const newPathItem = { ...pathItem };
    delete newPathItem[method as keyof PathItemObject];
    onChange(newPathItem);
    if (selectedMethod === method) {
      setSelectedMethod(null);
    }
  };

  const availableMethods = HTTP_METHODS.filter(
    (method) => !pathItem[method as keyof PathItemObject]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={newMethod} onValueChange={setNewMethod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Add Method" />
          </SelectTrigger>
          <SelectContent>
            {availableMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddMethod}
          disabled={!newMethod}
        >
          <Plus size={14} className="mr-2" />
          Add
        </Button>
      </div>

      <div className="space-y-4">
        {HTTP_METHODS.map((method) => {
          const operation = pathItem[method as keyof PathItemObject] as
            | OperationObject
            | undefined;
          if (!operation) return null;

          return (
            <div
              key={method}
              className="border border-[#3e3e42] rounded overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-4 py-2 bg-[#2a2d2e] cursor-pointer hover:bg-[#37373d] transition-colors"
                onClick={() =>
                  setSelectedMethod(selectedMethod === method ? null : method)
                }
              >
                <div className="flex items-center gap-3">
                  <span className="uppercase font-bold text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 w-16 text-center">
                    {method}
                  </span>
                  <span className="text-sm text-gray-300 truncate">
                    {operation.summary || "No summary"}
                  </span>
                </div>
                <ConfirmPopover
                  title="Delete Method"
                  description={`Are you sure you want to delete method "${method.toUpperCase()}"?`}
                  onConfirm={() => handleDeleteMethod(method)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  }
                />
              </div>

              {selectedMethod === method && (
                <div className="p-4 bg-[#1e1e1e] border-t border-[#3e3e42]">
                  <OperationDesigner
                    method={method}
                    operation={operation}
                    onChange={(newOperation) =>
                      onChange({
                        ...pathItem,
                        [method]: newOperation,
                      })
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
