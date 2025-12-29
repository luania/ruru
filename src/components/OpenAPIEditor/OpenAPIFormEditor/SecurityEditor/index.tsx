import { useState, useEffect } from "react";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Button } from "../../../ui/Button";
import { ConfirmPopover } from "../../../ui/ConfirmPopover";
import { Popover, PopoverTrigger, PopoverContent } from "../../../ui/Popover";
import { Badge } from "../../../ui/Badge";
import { Trash2, Plus, X } from "lucide-react";
import type { SecurityRequirementObject } from "openapi3-ts/oas31";

interface SecurityEditorProps {
  initialData: SecurityRequirementObject[];
  onChange: (data: SecurityRequirementObject[]) => void;
}

export const SecurityEditor = ({
  initialData,
  onChange,
}: SecurityEditorProps) => {
  const [requirements, setRequirements] =
    useState<SecurityRequirementObject[]>(initialData);

  useEffect(() => {
    setRequirements(initialData);
  }, [initialData]);

  const handleAdd = () => {
    const newRequirements = [...requirements, {}];
    setRequirements(newRequirements);
    onChange(newRequirements);
  };

  const handleRemove = (index: number) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    setRequirements(newRequirements);
    onChange(newRequirements);
  };

  const handleAddScheme = (index: number, name: string, scopes: string) => {
    const scopesArray = scopes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const newRequirements = requirements.map((req, i) =>
      i === index ? { ...req, [name]: scopesArray } : req
    );
    setRequirements(newRequirements);
    onChange(newRequirements);
  };

  const handleUpdateScopes = (
    reqIndex: number,
    schemeName: string,
    scopes: string
  ) => {
    const scopesArray = scopes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const newRequirements = requirements.map((req, i) =>
      i === reqIndex ? { ...req, [schemeName]: scopesArray } : req
    );
    setRequirements(newRequirements);
    onChange(newRequirements);
  };

  const handleDeleteScheme = (reqIndex: number, schemeName: string) => {
    const newRequirements = requirements.map((req, i) => {
      if (i !== reqIndex) return req;
      const updated = { ...req };
      delete updated[schemeName];
      return updated;
    });
    setRequirements(newRequirements);
    onChange(newRequirements);
  };

  return (
    <div className="space-y-4 max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Security Requirements</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          <Plus size={12} className="mr-1" /> Add Requirement
        </Button>
      </div>
      <div className="space-y-3">
        {requirements.map((requirement, reqIndex) => (
          <RequirementItem
            key={reqIndex}
            requirement={requirement}
            index={reqIndex}
            onRemove={handleRemove}
            onAddScheme={handleAddScheme}
            onUpdateScopes={handleUpdateScopes}
            onDeleteScheme={handleDeleteScheme}
          />
        ))}
        {requirements.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">
            No security requirements defined
          </div>
        )}
      </div>
    </div>
  );
};

const RequirementItem = ({
  requirement,
  index,
  onRemove,
  onAddScheme,
  onUpdateScopes,
  onDeleteScheme,
}: {
  requirement: SecurityRequirementObject;
  index: number;
  onRemove: (index: number) => void;
  onAddScheme: (index: number, name: string, scopes: string) => void;
  onUpdateScopes: (index: number, schemeName: string, scopes: string) => void;
  onDeleteScheme: (index: number, schemeName: string) => void;
}) => {
  const [newSchemeName, setNewSchemeName] = useState("");
  const [isAddSchemeOpen, setIsAddSchemeOpen] = useState(false);

  const requirementKeys = Object.keys(requirement || {});

  const handleConfirmAddScheme = () => {
    if (newSchemeName.trim()) {
      onAddScheme(index, newSchemeName.trim(), "");
      setNewSchemeName("");
      setIsAddSchemeOpen(false);
    }
  };

  return (
    <div className="p-4 bg-[#252526] rounded-md border border-[#3e3e42] space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">
          Requirement {index + 1}
        </span>
        <ConfirmPopover
          title="Delete Requirement"
          description="Are you sure you want to delete this security requirement?"
          onConfirm={() => onRemove(index)}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-400 h-6 w-6"
            >
              <Trash2 size={14} />
            </Button>
          }
        />
      </div>

      <div className="space-y-3">
        {requirementKeys.map((schemeName) => (
          <SchemeItem
            key={schemeName}
            schemeName={schemeName}
            scopes={requirement[schemeName] || []}
            onUpdateScopes={(scopes) =>
              onUpdateScopes(index, schemeName, scopes.join(", "))
            }
            onDeleteScheme={() => onDeleteScheme(index, schemeName)}
          />
        ))}
        <Popover open={isAddSchemeOpen} onOpenChange={setIsAddSchemeOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-blue-400 hover:text-blue-300 h-8 w-full"
            >
              <Plus size={12} className="mr-1" /> Add Scheme
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div>
                <Label className="text-sm mb-2">Scheme Name</Label>
                <Input
                  value={newSchemeName}
                  onChange={(e) => setNewSchemeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmAddScheme();
                    }
                  }}
                  placeholder="e.g. oauth2, api_key"
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewSchemeName("");
                    setIsAddSchemeOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmAddScheme}
                  disabled={!newSchemeName.trim()}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

const SchemeItem = ({
  schemeName,
  scopes,
  onUpdateScopes,
  onDeleteScheme,
}: {
  schemeName: string;
  scopes: string[];
  onUpdateScopes: (scopes: string[]) => void;
  onDeleteScheme: () => void;
}) => {
  const [newScope, setNewScope] = useState("");
  const [isAddScopeOpen, setIsAddScopeOpen] = useState(false);

  const handleConfirmAddScope = () => {
    if (newScope.trim()) {
      onUpdateScopes([...scopes, newScope.trim()]);
      setNewScope("");
      setIsAddScopeOpen(false);
    }
  };

  const handleRemoveScope = (scopeIndex: number) => {
    onUpdateScopes(scopes.filter((_, i) => i !== scopeIndex));
  };

  return (
    <div className="p-3 bg-[#1e1e1e] rounded border border-[#3e3e42] space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label className="text-xs text-gray-400">Scheme Name</Label>
          <div className="text-sm text-gray-300 font-medium">{schemeName}</div>
        </div>
        <ConfirmPopover
          title="Delete Scheme"
          description="Are you sure you want to delete this scheme?"
          onConfirm={onDeleteScheme}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-400 h-6 w-6"
            >
              <X size={14} />
            </Button>
          }
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Scopes</Label>
        <div className="flex flex-wrap gap-2">
          {scopes.map((scope, scopeIndex) => (
            <Badge
              key={scopeIndex}
              variant="secondary"
              className="bg-[#2d2d30] text-gray-300 border-[#3e3e42] flex items-center gap-1 pr-1"
            >
              {scope}
              <button
                type="button"
                onClick={() => handleRemoveScope(scopeIndex)}
                className="ml-1 hover:text-red-400 transition-colors"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          <Popover open={isAddScopeOpen} onOpenChange={setIsAddScopeOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-400 hover:text-blue-300 h-6"
              >
                <Plus size={12} className="mr-1" /> Add Scope
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm mb-2">Scope</Label>
                  <Input
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleConfirmAddScope();
                      }
                    }}
                    placeholder="e.g. read:pets"
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewScope("");
                      setIsAddScopeOpen(false);
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirmAddScope}
                    disabled={!newScope.trim()}
                  >
                    确定
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {scopes.length === 0 && (
          <div className="text-xs text-gray-500 italic">No scopes defined</div>
        )}
      </div>
    </div>
  );
};
