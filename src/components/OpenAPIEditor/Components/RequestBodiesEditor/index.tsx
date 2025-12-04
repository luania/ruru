import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/Popover";
import { cn } from "../../../../lib/utils";
import type { ComponentsObject, RequestBodyObject } from "openapi3-ts/oas31";
import { RequestBodyDesigner } from "./RequestBodyDesigner";

import { ConfirmPopover } from "../../../ui/ConfirmPopover";

interface RequestBodiesEditorProps {
  initialData: ComponentsObject["requestBodies"];
  onChange: (data: ComponentsObject["requestBodies"]) => void;
}

export const RequestBodiesEditor = ({
  initialData,
  onChange,
}: RequestBodiesEditorProps) => {
  const [selectedRequestBody, setSelectedRequestBody] = useState<string | null>(
    null
  );
  const [newRequestBodyName, setNewRequestBodyName] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [renamingRequestBody, setRenamingRequestBody] = useState<string | null>(
    null
  );
  const [renameValue, setRenameValue] = useState("");

  const requestBodies = initialData || {};

  const handleAddRequestBody = () => {
    if (!newRequestBodyName) return;
    const newRequestBodies = {
      ...requestBodies,
      [newRequestBodyName]: {
        description: newRequestBodyName,
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      } as RequestBodyObject,
    };
    onChange(newRequestBodies);
    setSelectedRequestBody(newRequestBodyName);
    setNewRequestBodyName("");
    setIsPopoverOpen(false);
  };

  const handleDeleteRequestBody = (name: string) => {
    const newRequestBodies = { ...requestBodies };
    delete newRequestBodies[name];
    onChange(newRequestBodies);
    if (selectedRequestBody === name) {
      setSelectedRequestBody(null);
    }
  };

  const handleRenameRequestBody = () => {
    if (
      !renamingRequestBody ||
      !renameValue ||
      renamingRequestBody === renameValue
    ) {
      setRenamingRequestBody(null);
      return;
    }

    if (requestBodies[renameValue]) {
      return;
    }

    const keys = Object.keys(requestBodies);
    const newRequestBodies: ComponentsObject["requestBodies"] = {};
    keys.forEach((key) => {
      if (key === renamingRequestBody) {
        newRequestBodies[renameValue] = requestBodies[key];
      } else {
        newRequestBodies[key] = requestBodies[key];
      }
    });

    onChange(newRequestBodies);
    if (selectedRequestBody === renamingRequestBody) {
      setSelectedRequestBody(renameValue);
    }
    setRenamingRequestBody(null);
    setRenameValue("");
  };

  const handleUpdateRequestBody = (
    name: string,
    newRequestBody: RequestBodyObject
  ) => {
    const newRequestBodies = {
      ...requestBodies,
      [name]: newRequestBody,
    };
    onChange(newRequestBodies);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar List */}
      <div className="w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col">
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <span className="font-medium text-sm text-gray-300">
            Request Bodies
          </span>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-white">
                  New Request Body
                </h4>
                <div className="flex gap-2">
                  <Input
                    value={newRequestBodyName}
                    onChange={(e) => setNewRequestBodyName(e.target.value)}
                    placeholder="Name"
                    className="h-8"
                  />
                  <Button
                    onClick={handleAddRequestBody}
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
        <div className="flex-1 overflow-auto">
          {Object.keys(requestBodies).map((name) => (
            <div
              key={name}
              className={cn(
                "group flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-[#2a2d2e] transition-colors",
                selectedRequestBody === name
                  ? "bg-[#37373d] text-white border-l-2 border-blue-500"
                  : "text-gray-400 border-l-2 border-transparent"
              )}
              onClick={() => setSelectedRequestBody(name)}
            >
              {renamingRequestBody === name ? (
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameRequestBody();
                      if (e.key === "Escape") setRenamingRequestBody(null);
                    }}
                    autoFocus
                    className="h-6 text-xs"
                  />
                </div>
              ) : (
                <span className="truncate flex-1">{name}</span>
              )}

              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                {renamingRequestBody !== name && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-blue-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingRequestBody(name);
                      setRenameValue(name);
                    }}
                  >
                    <Pencil size={12} />
                  </Button>
                )}
                <ConfirmPopover
                  title="Delete Request Body"
                  description={`Are you sure you want to delete request body "${name}"?`}
                  onConfirm={() => handleDeleteRequestBody(name)}
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
        {selectedRequestBody && requestBodies[selectedRequestBody] ? (
          <RequestBodyDesigner
            requestBody={
              requestBodies[selectedRequestBody] as RequestBodyObject
            }
            onChange={(newRequestBody) =>
              handleUpdateRequestBody(selectedRequestBody, newRequestBody)
            }
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a request body to edit
          </div>
        )}
      </div>
    </div>
  );
};
