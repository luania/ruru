import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/Popover";
import { cn } from "../../../../lib/utils";
import type { ComponentsObject, CallbackObject } from "openapi3-ts/oas31";
import { CallbackDesigner } from "./CallbackDesigner";

import { ConfirmPopover } from "../../../ui/ConfirmPopover";

interface CallbacksEditorProps {
  initialData: ComponentsObject["callbacks"];
  onChange: (data: ComponentsObject["callbacks"]) => void;
}

export const CallbacksEditor = ({
  initialData,
  onChange,
}: CallbacksEditorProps) => {
  const [selectedCallback, setSelectedCallback] = useState<string | null>(null);
  const [newCallbackName, setNewCallbackName] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [renamingCallback, setRenamingCallback] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const callbacks = initialData || {};

  const handleAddCallback = () => {
    if (!newCallbackName) return;
    const newCallbacks = {
      ...callbacks,
      [newCallbackName]: {
        "{$request.query.callbackUrl}": {
          post: {
            requestBody: {
              description: "Callback payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Callback successfully processed",
              },
            },
          },
        },
      } as CallbackObject,
    };
    onChange(newCallbacks);
    setSelectedCallback(newCallbackName);
    setNewCallbackName("");
    setIsPopoverOpen(false);
  };

  const handleDeleteCallback = (name: string) => {
    const newCallbacks = { ...callbacks };
    delete newCallbacks[name];
    onChange(newCallbacks);
    if (selectedCallback === name) {
      setSelectedCallback(null);
    }
  };

  const handleRenameCallback = () => {
    if (!renamingCallback || !renameValue || renamingCallback === renameValue) {
      setRenamingCallback(null);
      return;
    }

    if (callbacks[renameValue]) {
      return;
    }

    const keys = Object.keys(callbacks);
    const newCallbacks: ComponentsObject["callbacks"] = {};
    keys.forEach((key) => {
      if (key === renamingCallback) {
        newCallbacks[renameValue] = callbacks[key];
      } else {
        newCallbacks[key] = callbacks[key];
      }
    });

    onChange(newCallbacks);
    if (selectedCallback === renamingCallback) {
      setSelectedCallback(renameValue);
    }
    setRenamingCallback(null);
    setRenameValue("");
  };

  const handleUpdateCallback = (name: string, newCallback: CallbackObject) => {
    const newCallbacks = {
      ...callbacks,
      [name]: newCallback,
    };
    onChange(newCallbacks);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar List */}
      <div className="w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col">
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <span className="font-medium text-sm text-gray-300">Callbacks</span>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-white">New Callback</h4>
                <div className="flex gap-2">
                  <Input
                    value={newCallbackName}
                    onChange={(e) => setNewCallbackName(e.target.value)}
                    placeholder="Name"
                    className="h-8"
                  />
                  <Button onClick={handleAddCallback} size="sm" className="h-8">
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex-1 overflow-auto">
          {Object.keys(callbacks).map((name) => (
            <div
              key={name}
              className={cn(
                "group flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-[#2a2d2e] transition-colors",
                selectedCallback === name
                  ? "bg-[#37373d] text-white border-l-2 border-blue-500"
                  : "text-gray-400 border-l-2 border-transparent"
              )}
              onClick={() => setSelectedCallback(name)}
            >
              {renamingCallback === name ? (
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameCallback();
                      if (e.key === "Escape") setRenamingCallback(null);
                    }}
                    autoFocus
                    className="h-6 text-xs"
                  />
                </div>
              ) : (
                <span className="truncate flex-1">{name}</span>
              )}

              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                {renamingCallback !== name && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-blue-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingCallback(name);
                      setRenameValue(name);
                    }}
                  >
                    <Pencil size={12} />
                  </Button>
                )}
                <ConfirmPopover
                  title="Delete Callback"
                  description={`Are you sure you want to delete callback "${name}"?`}
                  onConfirm={() => handleDeleteCallback(name)}
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
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6">
        {selectedCallback && callbacks[selectedCallback] ? (
          <CallbackDesigner
            callback={callbacks[selectedCallback] as CallbackObject}
            onChange={(newCallback) =>
              handleUpdateCallback(selectedCallback, newCallback)
            }
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a callback to edit
          </div>
        )}
      </div>
    </div>
  );
};
