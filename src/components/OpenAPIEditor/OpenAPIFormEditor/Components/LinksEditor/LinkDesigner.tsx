import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/Input";
import { ConfirmPopover } from "../../../../ui/ConfirmPopover";
import { Label } from "../../../../ui/Label";
import { Textarea } from "../../../../ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../ui/Select";
import type { LinkObject } from "openapi3-ts/oas31";

interface LinkDesignerProps {
  link: LinkObject;
  onChange: (link: LinkObject) => void;
}

export const LinkDesigner = ({ link, onChange }: LinkDesignerProps) => {
  const [targetType, setTargetType] = useState<"operationId" | "operationRef">(
    link.operationRef ? "operationRef" : "operationId"
  );

  const [newParameterKey, setNewParameterKey] = useState("");
  const [newParameterValue, setNewParameterValue] = useState("");

  const handleAddParameter = () => {
    if (!newParameterKey) return;
    const newParameters = {
      ...link.parameters,
      [newParameterKey]: newParameterValue,
    };
    onChange({ ...link, parameters: newParameters });
    setNewParameterKey("");
    setNewParameterValue("");
  };

  const handleDeleteParameter = (key: string) => {
    const newParameters = { ...link.parameters };
    delete newParameters[key];
    onChange({ ...link, parameters: newParameters });
  };

  const handleParameterChange = (key: string, value: string) => {
    const newParameters = {
      ...link.parameters,
      [key]: value,
    };
    onChange({ ...link, parameters: newParameters });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={link.description || ""}
          onChange={(e) => onChange({ ...link, description: e.target.value })}
          placeholder="Link description"
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Target Type</Label>
          <Select
            value={targetType}
            onValueChange={(value) => {
              setTargetType(value as "operationId" | "operationRef");
              if (value === "operationId") {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { operationRef, ...rest } = link;
                onChange({ ...rest, operationId: "" });
              } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { operationId, ...rest } = link;
                onChange({ ...rest, operationRef: "" });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operationId">Operation ID</SelectItem>
              <SelectItem value="operationRef">Operation Ref</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>
            {targetType === "operationId" ? "Operation ID" : "Operation Ref"}
          </Label>
          <Input
            value={
              targetType === "operationId"
                ? link.operationId || ""
                : link.operationRef || ""
            }
            onChange={(e) =>
              onChange({
                ...link,
                [targetType]: e.target.value,
              })
            }
            placeholder={
              targetType === "operationId"
                ? "e.g. getUserById"
                : "e.g. #/paths/~1users~1{userId}/get"
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Request Body (Expression)</Label>
        <Input
          value={(link.requestBody as string) || ""}
          onChange={(e) => onChange({ ...link, requestBody: e.target.value })}
          placeholder="e.g. $request.body#/id"
        />
      </div>

      <div className="space-y-4">
        <Label>Parameters</Label>
        <div className="space-y-2">
          {Object.entries(link.parameters || {}).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <Input
                value={key}
                disabled
                className="w-1/3 bg-[#2a2d2e] text-gray-400"
              />
              <Input
                value={value as string}
                onChange={(e) => handleParameterChange(key, e.target.value)}
                placeholder="Value or Expression"
                className="flex-1"
              />
              <ConfirmPopover
                title="Delete Parameter"
                description={`Are you sure you want to delete parameter "${key}"?`}
                onConfirm={() => handleDeleteParameter(key)}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </Button>
                }
              />
            </div>
          ))}

          <div className="flex gap-2 items-center">
            <Input
              value={newParameterKey}
              onChange={(e) => setNewParameterKey(e.target.value)}
              placeholder="Parameter Name"
              className="w-1/3"
            />
            <Input
              value={newParameterValue}
              onChange={(e) => setNewParameterValue(e.target.value)}
              placeholder="Value or Expression"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddParameter();
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddParameter}
              disabled={!newParameterKey}
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
