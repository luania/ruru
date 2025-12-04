import { useState, useEffect } from "react";
import { cn, getMethodColor } from "../../../lib/utils";
import { OperationEditor } from "./OperationEditor";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/Popover";
import { Button } from "../../ui/Button";
import type {
  PathItemObject,
  OperationObject,
  ServerObject,
} from "openapi3-ts/oas31";

interface PathEditorProps {
  path: string;
  data: PathItemObject;
  servers?: ServerObject[];
  initialMethod?: string | null;
  onChange: (data: PathItemObject) => void;
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

export const PathEditor = ({
  path,
  data,
  servers,
  initialMethod,
  onChange,
}: PathEditorProps) => {
  // Default to the first method that exists, or null
  const [activeMethod, setActiveMethod] = useState<string | null>(() => {
    if (initialMethod && data[initialMethod as keyof PathItemObject]) {
      return initialMethod;
    }
    const existingMethod = METHODS.find((m) => data[m]);
    return existingMethod || null;
  });
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  const [newlyAddedMethod, setNewlyAddedMethod] = useState<string | null>(null);
  const [prevInitialMethod, setPrevInitialMethod] = useState(initialMethod);

  if (initialMethod !== prevInitialMethod) {
    setPrevInitialMethod(initialMethod);
    if (initialMethod && data[initialMethod as keyof PathItemObject]) {
      setActiveMethod(initialMethod);
    }
  }

  // Update active method if it becomes invalid (e.g. deleted externally)
  useEffect(() => {
    if (activeMethod && !data[activeMethod as keyof PathItemObject]) {
      const firstExisting = METHODS.find((m) => data[m]);
      setTimeout(() => setActiveMethod(firstExisting || null), 0);
    } else if (!activeMethod) {
      const firstExisting = METHODS.find((m) => data[m]);
      if (firstExisting) setTimeout(() => setActiveMethod(firstExisting), 0);
    }
  }, [data, activeMethod]);

  // Switch to newly added method when it appears in data
  useEffect(() => {
    if (newlyAddedMethod && data[newlyAddedMethod as keyof PathItemObject]) {
      setTimeout(() => {
        setActiveMethod(newlyAddedMethod);
        setNewlyAddedMethod(null);
      }, 0);
    }
  }, [data, newlyAddedMethod]);

  const handleOperationChange = (
    method: string,
    operation: OperationObject | undefined
  ) => {
    const newData = { ...data };
    if (operation) {
      newData[method as keyof PathItemObject] = operation;
    } else {
      delete newData[method as keyof PathItemObject];
    }
    onChange(newData);
  };

  const handleAddMethod = (method: string) => {
    handleOperationChange(method, {});
    setNewlyAddedMethod(method);
    setIsAddPopoverOpen(false);
  };

  const availableMethods = METHODS.filter(
    (method) => !data[method as keyof PathItemObject]
  );

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex-none bg-[#252526] border-b border-[#3e3e42]">
        <div className="flex items-center px-4 gap-2">
          {METHODS.filter((method) => data[method as keyof PathItemObject]).map(
            (method) => {
              const isActive = activeMethod === method;

              return (
                <button
                  key={method}
                  onClick={() => setActiveMethod(method)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium uppercase border-b-2 transition-colors relative",
                    isActive
                      ? cn("border-current", getMethodColor(method))
                      : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#2a2d2e]"
                  )}
                >
                  {method}
                </button>
              );
            }
          )}

          <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-[#3e3e42] text-gray-400 hover:text-white"
              >
                <Plus size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1 bg-[#252526] border-[#3e3e42]">
              <div className="grid gap-1">
                {availableMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => handleAddMethod(method)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded uppercase transition-colors",
                      getMethodColor(method),
                      "hover:brightness-110"
                    )}
                  >
                    {method}
                  </button>
                ))}
                {availableMethods.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    No more methods
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeMethod && data[activeMethod as keyof PathItemObject] ? (
          <OperationEditor
            key={activeMethod} // Re-mount on method change to reset internal state if needed
            method={activeMethod}
            path={path}
            data={
              (data[activeMethod as keyof PathItemObject] as OperationObject) ||
              {}
            }
            servers={servers}
            onChange={(op) => handleOperationChange(activeMethod, op)}
            onDelete={() => handleOperationChange(activeMethod, undefined)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <p>Select or add a method to edit</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Add Method</Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1 bg-[#252526] border-[#3e3e42]">
                <div className="grid gap-1">
                  {availableMethods.map((method) => (
                    <button
                      key={method}
                      onClick={() => handleAddMethod(method)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-sm rounded uppercase transition-colors",
                        getMethodColor(method),
                        "hover:brightness-110"
                      )}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
};
