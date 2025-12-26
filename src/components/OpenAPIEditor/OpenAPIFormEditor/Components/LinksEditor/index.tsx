import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/Input";
import { ConfirmPopover } from "../../../../ui/ConfirmPopover";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../ui/Popover";
import { cn } from "../../../../../lib/utils";
import type { ComponentsObject, LinkObject } from "openapi3-ts/oas31";
import { LinkDesigner } from "./LinkDesigner";

interface LinksEditorProps {
  initialData: ComponentsObject["links"];
  onChange: (data: ComponentsObject["links"]) => void;
}

export const LinksEditor = ({ initialData, onChange }: LinksEditorProps) => {
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [newLinkName, setNewLinkName] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [renamingLink, setRenamingLink] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const links = initialData || {};

  const handleAddLink = () => {
    if (!newLinkName) return;
    const newLinks = {
      ...links,
      [newLinkName]: {
        description: newLinkName,
        operationId: "",
        parameters: {},
      } as LinkObject,
    };
    onChange(newLinks);
    setSelectedLink(newLinkName);
    setNewLinkName("");
    setIsPopoverOpen(false);
  };

  const handleDeleteLink = (name: string) => {
    const newLinks = { ...links };
    delete newLinks[name];
    onChange(newLinks);
    if (selectedLink === name) {
      setSelectedLink(null);
    }
  };

  const handleRenameLink = () => {
    if (!renamingLink || !renameValue || renamingLink === renameValue) {
      setRenamingLink(null);
      return;
    }

    if (links[renameValue]) {
      return;
    }

    const keys = Object.keys(links);
    const newLinks: ComponentsObject["links"] = {};
    keys.forEach((key) => {
      if (key === renamingLink) {
        newLinks[renameValue] = links[key];
      } else {
        newLinks[key] = links[key];
      }
    });

    onChange(newLinks);
    if (selectedLink === renamingLink) {
      setSelectedLink(renameValue);
    }
    setRenamingLink(null);
    setRenameValue("");
  };

  const handleUpdateLink = (name: string, newLink: LinkObject) => {
    const newLinks = {
      ...links,
      [name]: newLink,
    };
    onChange(newLinks);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar List */}
      <div className="w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col">
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <span className="font-medium text-sm text-gray-300">Links</span>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-white">New Link</h4>
                <div className="flex gap-2">
                  <Input
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="Name"
                    className="h-8"
                  />
                  <Button onClick={handleAddLink} size="sm" className="h-8">
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex-1 overflow-auto">
          {Object.keys(links).map((name) => (
            <div
              key={name}
              className={cn(
                "group flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-[#2a2d2e] transition-colors",
                selectedLink === name
                  ? "bg-[#37373d] text-white border-l-2 border-blue-500"
                  : "text-gray-400 border-l-2 border-transparent"
              )}
              onClick={() => setSelectedLink(name)}
            >
              {renamingLink === name ? (
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameLink();
                      if (e.key === "Escape") setRenamingLink(null);
                    }}
                    autoFocus
                    className="h-6 text-xs"
                  />
                </div>
              ) : (
                <span className="truncate flex-1">{name}</span>
              )}

              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                {renamingLink !== name && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-blue-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingLink(name);
                      setRenameValue(name);
                    }}
                  >
                    <Pencil size={12} />
                  </Button>
                )}
                <ConfirmPopover
                  title="Delete Link"
                  description={`Are you sure you want to delete link "${name}"?`}
                  onConfirm={() => handleDeleteLink(name)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-red-400"
                      onClick={(e) => e.stopPropagation()}
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
        {selectedLink && links[selectedLink] ? (
          <LinkDesigner
            link={links[selectedLink] as LinkObject}
            onChange={(newLink) => handleUpdateLink(selectedLink, newLink)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a link to edit
          </div>
        )}
      </div>
    </div>
  );
};
