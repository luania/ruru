import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { ConfirmPopover } from "../../../ui/ConfirmPopover";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/Popover";
import { cn } from "../../../../lib/utils";
import type { ComponentsObject, ParameterObject } from "openapi3-ts/oas31";
import { ParameterDesigner } from "./ParameterDesigner";

interface ParametersEditorProps {
  initialData: ComponentsObject["parameters"];
  onChange: (data: ComponentsObject["parameters"]) => void;
}

export const ParametersEditor = ({
  initialData,
  onChange,
}: ParametersEditorProps) => {
  const [selectedParameter, setSelectedParameter] = useState<string | null>(
    null
  );
  const [newParameterName, setNewParameterName] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [renamingParameter, setRenamingParameter] = useState<string | null>(
    null
  );
  const [renameValue, setRenameValue] = useState("");

  const parameters = initialData || {};

  const handleAddParameter = () => {
    if (!newParameterName) return;
    const newParameters = {
      ...parameters,
      [newParameterName]: {
        name: newParameterName,
        in: "query",
        schema: { type: "string" },
      } as ParameterObject,
    };
    onChange(newParameters);
    setSelectedParameter(newParameterName);
    setNewParameterName("");
    setIsPopoverOpen(false);
  };

  const handleDeleteParameter = (name: string) => {
    const newParameters = { ...parameters };
    delete newParameters[name];
    onChange(newParameters);
    if (selectedParameter === name) {
      setSelectedParameter(null);
    }
  };

  const handleRenameParameter = () => {
    if (
      !renamingParameter ||
      !renameValue ||
      renamingParameter === renameValue
    ) {
      setRenamingParameter(null);
      return;
    }

    if (parameters[renameValue]) {
      return;
    }

    const keys = Object.keys(parameters);
    const newParameters: ComponentsObject["parameters"] = {};
    keys.forEach((key) => {
      if (key === renamingParameter) {
        newParameters[renameValue] = parameters[key];
      } else {
        newParameters[key] = parameters[key];
      }
    });

    onChange(newParameters);
    if (selectedParameter === renamingParameter) {
      setSelectedParameter(renameValue);
    }
    setRenamingParameter(null);
    setRenameValue("");
  };

  const handleUpdateParameter = (
    name: string,
    newParameter: ParameterObject
  ) => {
    const newParameters = {
      ...parameters,
      [name]: newParameter,
    };
    onChange(newParameters);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar List */}
      <div className="w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col">
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Parameters</span>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Plus size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <h4 className="font-medium leading-none text-white">
                  New Parameter
                </h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Parameter Name"
                    value={newParameterName}
                    onChange={(e) => setNewParameterName(e.target.value)}
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddParameter();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddParameter}
                    disabled={!newParameterName}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex-1 overflow-auto">
          {Object.keys(parameters).map((name) => (
            <div
              key={name}
              className={cn(
                "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[#2a2d2e] group",
                selectedParameter === name
                  ? "bg-[#37373d] text-white"
                  : "text-gray-400"
              )}
              onClick={() => setSelectedParameter(name)}
            >
              <span className="truncate flex-1">{name}</span>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Popover
                  open={renamingParameter === name}
                  onOpenChange={(open) => {
                    if (open) {
                      setRenamingParameter(name);
                      setRenameValue(name);
                    } else {
                      setRenamingParameter(null);
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
                        Rename Parameter
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Parameter Name"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-8"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleRenameParameter();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleRenameParameter}
                          disabled={!renameValue}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <ConfirmPopover
                  title="Delete Parameter"
                  description={`Are you sure you want to delete parameter "${name}"?`}
                  onConfirm={() => handleDeleteParameter(name)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                      onClick={(e) => e.stopPropagation()}
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
        {selectedParameter && parameters[selectedParameter] ? (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                {selectedParameter}
              </h2>
            </div>
            <ParameterDesigner
              parameter={parameters[selectedParameter] as ParameterObject}
              onChange={(newParameter) =>
                handleUpdateParameter(selectedParameter, newParameter)
              }
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select a parameter to edit
          </div>
        )}
      </div>
    </div>
  );
};
