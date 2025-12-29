import { useState, useEffect } from "react";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Button } from "../../../ui/Button";
import { Trash2, Plus } from "lucide-react";
import type { ServerObject } from "openapi3-ts/oas31";

interface ServersEditorProps {
  initialData: ServerObject[];
  onChange: (data: ServerObject[]) => void;
}

export const ServersEditor = ({
  initialData,
  onChange,
}: ServersEditorProps) => {
  const [servers, setServers] = useState<ServerObject[]>(initialData);

  useEffect(() => {
    setServers(initialData);
  }, [initialData]);

  const handleAdd = () => {
    const newServers = [...servers, { url: "", description: "" }];
    setServers(newServers);
    onChange(newServers);
  };

  const handleRemove = (index: number) => {
    const newServers = servers.filter((_, i) => i !== index);
    setServers(newServers);
    onChange(newServers);
  };

  const handleChange = (index: number, updates: Partial<ServerObject>) => {
    const newServers = servers.map((server, i) =>
      i === index ? { ...server, ...updates } : server
    );
    setServers(newServers);
    onChange(newServers);
  };

  return (
    <form className="space-y-6 max-w-2xl p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAdd}
            className="gap-2"
          >
            <Plus size={14} />
            Add Server
          </Button>
        </div>

        <div className="space-y-4">
          {servers.map((server, index) => (
            <div
              key={index}
              className="flex gap-4 items-start p-4 bg-[#252526] rounded-md border border-[#3e3e42]"
            >
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={server.url || ""}
                    onChange={(e) =>
                      handleChange(index, { url: e.target.value })
                    }
                    placeholder="https://api.example.com/v1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={server.description || ""}
                    onChange={(e) =>
                      handleChange(index, { description: e.target.value })
                    }
                    placeholder="Production server"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="text-gray-400 hover:text-red-400"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}

          {servers.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-[#3e3e42] rounded-md">
              No servers defined. Click "Add Server" to get started.
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
