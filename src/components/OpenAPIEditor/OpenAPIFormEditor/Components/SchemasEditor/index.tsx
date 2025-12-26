import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../ui/Popover";
import { cn } from "../../../../../lib/utils";
import type { ComponentsObject, SchemaObject } from "openapi3-ts/oas31";
import { SchemaDesigner } from "./SchemaDesigner";

import { ConfirmPopover } from "../../../../ui/ConfirmPopover";

interface SchemasEditorProps {
  initialData: ComponentsObject["schemas"];
  onChange: (data: ComponentsObject["schemas"]) => void;
}

export const SchemasEditor = ({
  initialData,
  onChange,
}: SchemasEditorProps) => {
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [newSchemaName, setNewSchemaName] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [renamingSchema, setRenamingSchema] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const schemas = initialData || {};

  const handleAddSchema = () => {
    if (!newSchemaName) return;
    const newSchemas = {
      ...schemas,
      [newSchemaName]: {
        type: "object",
        properties: {},
      } as SchemaObject,
    };
    onChange(newSchemas);
    setSelectedSchema(newSchemaName);
    setNewSchemaName("");
    setIsPopoverOpen(false);
  };

  const handleDeleteSchema = (name: string) => {
    const newSchemas = { ...schemas };
    delete newSchemas[name];
    onChange(newSchemas);
    if (selectedSchema === name) {
      setSelectedSchema(null);
    }
  };

  const handleRenameSchema = () => {
    if (!renamingSchema || !renameValue || renamingSchema === renameValue) {
      setRenamingSchema(null);
      return;
    }

    if (schemas[renameValue]) {
      return;
    }

    const keys = Object.keys(schemas);
    const newSchemas: ComponentsObject["schemas"] = {};
    keys.forEach((key) => {
      if (key === renamingSchema) {
        newSchemas[renameValue] = schemas[key];
      } else {
        newSchemas[key] = schemas[key];
      }
    });

    onChange(newSchemas);
    if (selectedSchema === renamingSchema) {
      setSelectedSchema(renameValue);
    }
    setRenamingSchema(null);
    setRenameValue("");
  };

  const handleUpdateSchema = (name: string, newSchema: SchemaObject) => {
    const newSchemas = {
      ...schemas,
      [name]: newSchema,
    };
    onChange(newSchemas);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar List */}
      <div className="w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col">
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Schemas</span>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Plus size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <h4 className="font-medium leading-none text-white">
                  New Schema
                </h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Schema Name"
                    value={newSchemaName}
                    onChange={(e) => setNewSchemaName(e.target.value)}
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddSchema();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddSchema}
                    disabled={!newSchemaName}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex-1 overflow-auto">
          {Object.keys(schemas).map((name) => (
            <div
              key={name}
              className={cn(
                "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[#2a2d2e] group",
                selectedSchema === name
                  ? "bg-[#37373d] text-white"
                  : "text-gray-400"
              )}
              onClick={() => setSelectedSchema(name)}
            >
              <span className="truncate flex-1">{name}</span>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Popover
                  open={renamingSchema === name}
                  onOpenChange={(open) => {
                    if (open) {
                      setRenamingSchema(name);
                      setRenameValue(name);
                    } else {
                      setRenamingSchema(null);
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
                        Rename Schema
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Schema Name"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-8"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleRenameSchema();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleRenameSchema}
                          disabled={!renameValue}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <ConfirmPopover
                  title="Delete Schema"
                  description={`Are you sure you want to delete schema "${name}"?`}
                  onConfirm={() => handleDeleteSchema(name)}
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
        {selectedSchema && schemas[selectedSchema] ? (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                {selectedSchema}
              </h2>
            </div>
            <SchemaDesigner
              schema={schemas[selectedSchema] as SchemaObject}
              onChange={(newSchema) =>
                handleUpdateSchema(selectedSchema, newSchema)
              }
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select a schema to edit
          </div>
        )}
      </div>
    </div>
  );
};
