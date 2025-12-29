import { useState, useEffect } from "react";
import { Button } from "../../../ui/Button";
import { Trash2, Plus } from "lucide-react";
import type { TagObject } from "openapi3-ts/oas31";
import { ConfirmPopover } from "../../../ui/ConfirmPopover";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Textarea } from "../../../ui/Textarea";

interface TagsEditorProps {
  initialData: TagObject[];
  onChange: (data: TagObject[]) => void;
}

export const TagsEditor = ({ initialData, onChange }: TagsEditorProps) => {
  const [tags, setTags] = useState<TagObject[]>(initialData);

  useEffect(() => {
    setTags(initialData);
  }, [initialData]);

  const handleAdd = () => {
    const newTags = [
      ...tags,
      { name: "", description: "", externalDocs: { url: "" } },
    ];
    setTags(newTags);
    onChange(newTags);
  };

  const handleRemove = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    onChange(newTags);
  };

  const handleChange = (index: number, updates: Partial<TagObject>) => {
    const newTags = tags.map((tag, i) => {
      if (i !== index) return tag;
      const updated = { ...tag, ...updates };
      // 清理空的 externalDocs
      if (
        updated.externalDocs &&
        !updated.externalDocs.url &&
        !updated.externalDocs.description
      ) {
        delete updated.externalDocs;
      }
      return updated;
    });
    setTags(newTags);
    onChange(newTags);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-white">Tags</h2>
          <p className="text-sm text-gray-500">
            Define global tags for grouping operations.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2" size="sm">
          <Plus size={14} />
          Add Tag
        </Button>
      </div>

      <div className="space-y-4">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="p-6 bg-[#252526] rounded-lg border border-[#3e3e42]"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-sm font-medium text-gray-300">
                Tag {index + 1}
              </h3>
              <ConfirmPopover
                title="Delete Tag"
                description="Are you sure you want to delete this tag? This action cannot be undone."
                onConfirm={() => handleRemove(index)}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-400 h-8 w-8"
                  >
                    <Trash2 size={14} />
                  </Button>
                }
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Name *</Label>
                <Input
                  value={tag.name || ""}
                  onChange={(e) =>
                    handleChange(index, { name: e.target.value })
                  }
                  placeholder="e.g. pets, users"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Description</Label>
                <Textarea
                  value={tag.description || ""}
                  onChange={(e) =>
                    handleChange(index, { description: e.target.value })
                  }
                  placeholder="A brief description of this tag"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm">External Documentation</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">URL</Label>
                    <Input
                      value={tag.externalDocs?.url || ""}
                      onChange={(e) =>
                        handleChange(index, {
                          externalDocs: {
                            url: e.target.value || "",
                            description: tag.externalDocs?.description,
                          },
                        })
                      }
                      placeholder="https://example.com/docs"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Description</Label>
                    <Input
                      value={tag.externalDocs?.description || ""}
                      onChange={(e) =>
                        handleChange(index, {
                          externalDocs: {
                            url: tag.externalDocs?.url || "",
                            description: e.target.value,
                          },
                        })
                      }
                      placeholder="Documentation description"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {tags.length === 0 && (
          <div className="text-center py-12 text-gray-500 border border-dashed border-[#3e3e42] rounded-lg">
            No tags defined. Click "Add Tag" to get started.
          </div>
        )}
      </div>
    </div>
  );
};
