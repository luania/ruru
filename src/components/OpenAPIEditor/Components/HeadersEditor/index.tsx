import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/Popover";
import { cn } from "../../../../lib/utils";
import type { ComponentsObject, HeaderObject } from "openapi3-ts/oas31";
import { HeaderDesigner } from "./HeaderDesigner";

import { ConfirmPopover } from "../../../ui/ConfirmPopover";

interface HeadersEditorProps {
  initialData: ComponentsObject["headers"];
  onChange: (data: ComponentsObject["headers"]) => void;
}

export const HeadersEditor = ({
  initialData,
  onChange,
}: HeadersEditorProps) => {
  const [selectedHeader, setSelectedHeader] = useState<string | null>(null);
  const [newHeaderName, setNewHeaderName] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [renamingHeader, setRenamingHeader] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const headers = initialData || {};

  const handleAddHeader = () => {
    if (!newHeaderName) return;
    const newHeaders = {
      ...headers,
      [newHeaderName]: {
        description: newHeaderName,
        schema: { type: "string" },
      } as HeaderObject,
    };
    onChange(newHeaders);
    setSelectedHeader(newHeaderName);
    setNewHeaderName("");
    setIsPopoverOpen(false);
  };

  const handleDeleteHeader = (name: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[name];
    onChange(newHeaders);
    if (selectedHeader === name) {
      setSelectedHeader(null);
    }
  };

  const handleRenameHeader = () => {
    if (!renamingHeader || !renameValue || renamingHeader === renameValue) {
      setRenamingHeader(null);
      return;
    }

    if (headers[renameValue]) {
      return;
    }

    const keys = Object.keys(headers);
    const newHeaders: ComponentsObject["headers"] = {};
    keys.forEach((key) => {
      if (key === renamingHeader) {
        newHeaders[renameValue] = headers[key];
      } else {
        newHeaders[key] = headers[key];
      }
    });

    onChange(newHeaders);
    if (selectedHeader === renamingHeader) {
      setSelectedHeader(renameValue);
    }
    setRenamingHeader(null);
    setRenameValue("");
  };

  const handleUpdateHeader = (name: string, newHeader: HeaderObject) => {
    const newHeaders = {
      ...headers,
      [name]: newHeader,
    };
    onChange(newHeaders);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar List */}
      <div className="w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col">
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <span className="font-medium text-sm text-gray-300">Headers</span>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-white">New Header</h4>
                <div className="flex gap-2">
                  <Input
                    value={newHeaderName}
                    onChange={(e) => setNewHeaderName(e.target.value)}
                    placeholder="Name"
                    className="h-8"
                  />
                  <Button onClick={handleAddHeader} size="sm" className="h-8">
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex-1 overflow-auto">
          {Object.keys(headers).map((name) => (
            <div
              key={name}
              className={cn(
                "group flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-[#2a2d2e] transition-colors",
                selectedHeader === name
                  ? "bg-[#37373d] text-white border-l-2 border-blue-500"
                  : "text-gray-400 border-l-2 border-transparent"
              )}
              onClick={() => setSelectedHeader(name)}
            >
              {renamingHeader === name ? (
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameHeader();
                      if (e.key === "Escape") setRenamingHeader(null);
                    }}
                    autoFocus
                    className="h-6 text-xs"
                  />
                </div>
              ) : (
                <span className="truncate flex-1">{name}</span>
              )}

              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                {renamingHeader !== name && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-blue-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingHeader(name);
                      setRenameValue(name);
                    }}
                  >
                    <Pencil size={12} />
                  </Button>
                )}
                <ConfirmPopover
                  title="Delete Header"
                  description={`Are you sure you want to delete header "${name}"?`}
                  onConfirm={() => handleDeleteHeader(name)}
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
        {selectedHeader && headers[selectedHeader] ? (
          <HeaderDesigner
            header={headers[selectedHeader] as HeaderObject}
            onChange={(newHeader) =>
              handleUpdateHeader(selectedHeader, newHeader)
            }
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a header to edit
          </div>
        )}
      </div>
    </div>
  );
};
