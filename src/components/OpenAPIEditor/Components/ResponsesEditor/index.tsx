import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/Popover";
import { cn } from "../../../../lib/utils";
import type { ComponentsObject, ResponseObject } from "openapi3-ts/oas31";
import { ResponseDesigner } from "./ResponseDesigner";

import { ConfirmPopover } from "../../../ui/ConfirmPopover";

interface ResponsesEditorProps {
  initialData: ComponentsObject["responses"];
  onChange: (data: ComponentsObject["responses"]) => void;
}

export const ResponsesEditor = ({
  initialData,
  onChange,
}: ResponsesEditorProps) => {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [newResponseName, setNewResponseName] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [renamingResponse, setRenamingResponse] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const responses = initialData || {};

  const handleAddResponse = () => {
    if (!newResponseName) return;
    const newResponses = {
      ...responses,
      [newResponseName]: {
        description: "New Response",
      } as ResponseObject,
    };
    onChange(newResponses);
    setSelectedResponse(newResponseName);
    setNewResponseName("");
    setIsPopoverOpen(false);
  };

  const handleDeleteResponse = (name: string) => {
    const newResponses = { ...responses };
    delete newResponses[name];
    onChange(newResponses);
    if (selectedResponse === name) {
      setSelectedResponse(null);
    }
  };

  const handleRenameResponse = () => {
    if (!renamingResponse || !renameValue || renamingResponse === renameValue) {
      setRenamingResponse(null);
      return;
    }

    if (responses[renameValue]) {
      return;
    }

    const keys = Object.keys(responses);
    const newResponses: ComponentsObject["responses"] = {};
    keys.forEach((key) => {
      if (key === renamingResponse) {
        newResponses[renameValue] = responses[key];
      } else {
        newResponses[key] = responses[key];
      }
    });

    onChange(newResponses);
    if (selectedResponse === renamingResponse) {
      setSelectedResponse(renameValue);
    }
    setRenamingResponse(null);
    setRenameValue("");
  };

  const handleUpdateResponse = (name: string, newResponse: ResponseObject) => {
    const newResponses = {
      ...responses,
      [name]: newResponse,
    };
    onChange(newResponses);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar List */}
      <div className="w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col">
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Responses</span>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Plus size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <h4 className="font-medium leading-none text-white">
                  New Response
                </h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Response Name"
                    value={newResponseName}
                    onChange={(e) => setNewResponseName(e.target.value)}
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddResponse();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddResponse}
                    disabled={!newResponseName}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex-1 overflow-auto">
          {Object.keys(responses).map((name) => (
            <div
              key={name}
              className={cn(
                "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[#2a2d2e] group",
                selectedResponse === name
                  ? "bg-[#37373d] text-white"
                  : "text-gray-400"
              )}
              onClick={() => setSelectedResponse(name)}
            >
              <span className="truncate flex-1">{name}</span>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Popover
                  open={renamingResponse === name}
                  onOpenChange={(open) => {
                    if (open) {
                      setRenamingResponse(name);
                      setRenameValue(name);
                    } else {
                      setRenamingResponse(null);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-3">
                      <h4 className="font-medium leading-none text-white">
                        Rename Response
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Response Name"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-8"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleRenameResponse();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleRenameResponse}
                          disabled={!renameValue}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <ConfirmPopover
                  title="Delete Response"
                  description={`Are you sure you want to delete response "${name}"?`}
                  onConfirm={() => handleDeleteResponse(name)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#1e1e1e]">
        {selectedResponse && responses[selectedResponse] ? (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                {selectedResponse}
              </h2>
            </div>
            <ResponseDesigner
              response={responses[selectedResponse] as ResponseObject}
              onChange={(newResponse: ResponseObject) =>
                handleUpdateResponse(selectedResponse, newResponse)
              }
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select a response to edit
          </div>
        )}
      </div>
    </div>
  );
};
