import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Button } from "../../ui/Button";
import { Trash2, Plus } from "lucide-react";
import type { TagObject } from "openapi3-ts/oas31";
import { ConfirmPopover } from "../../ui/ConfirmPopover";
import { Input } from "../../ui/Input";

const tagSchema = z.object({
  tags: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      externalDocs: z
        .object({
          description: z.string().optional(),
          url: z.string().url("Invalid URL").optional().or(z.literal("")),
        })
        .optional(),
    })
  ),
});

type TagsFormData = z.infer<typeof tagSchema>;

interface TagsEditorProps {
  initialData: TagObject[];
  onChange: (data: TagObject[]) => void;
}

export const TagsEditor = ({ initialData, onChange }: TagsEditorProps) => {
  const hf = useForm<TagsFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      tags: initialData || [],
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: hf.control,
    name: "tags",
  });

  useEffect(() => {
    if (initialData) {
      const currentTags = hf.getValues().tags;
      if (JSON.stringify(initialData) !== JSON.stringify(currentTags)) {
        hf.reset({ tags: initialData });
      }
    }
  }, [initialData, hf]);

  // Watch for changes and trigger onChange
  useEffect(() => {
    const subscription = hf.watch((value) => {
      if (value.tags) {
        // Filter out empty externalDocs if url is empty
        const cleanedTags = value.tags.map((tag) => {
          const newTag = { ...tag };
          if (
            newTag.externalDocs &&
            !newTag.externalDocs.url &&
            !newTag.externalDocs.description
          ) {
            delete newTag.externalDocs;
          }
          return newTag;
        });
        onChange(cleanedTags as TagObject[]);
      }
    });
    return () => subscription.unsubscribe();
  }, [hf, onChange]);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-white">Tags</h2>
          <p className="text-sm text-gray-500">
            Define global tags for grouping operations.
          </p>
        </div>
        <Button
          onClick={() =>
            append({ name: "", description: "", externalDocs: { url: "" } })
          }
          className="gap-2"
        >
          <Plus size={14} /> Add Tag
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-[#252526] border border-[#3e3e42] rounded-md p-4 space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase">
                      Name
                    </label>
                    <Controller
                      control={hf.control}
                      name={`tags.${index}.name`}
                      render={({ field: { onChange, value, onBlur } }) => (
                        <Input
                          value={value}
                          onChange={onChange}
                          onBlur={onBlur}
                          placeholder="Tag Name"
                          className="bg-[#1e1e1e]"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase">
                      Description
                    </label>
                    <Controller
                      control={hf.control}
                      name={`tags.${index}.description`}
                      render={({ field: { onChange, value, onBlur } }) => (
                        <Input
                          value={value || ""}
                          onChange={onChange}
                          onBlur={onBlur}
                          placeholder="Description"
                          className="bg-[#1e1e1e]"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500 uppercase">
                    External Docs URL
                  </label>
                  <Controller
                    control={hf.control}
                    name={`tags.${index}.externalDocs.url`}
                    render={({ field: { onChange, value, onBlur } }) => (
                      <Input
                        value={value || ""}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="https://example.com/docs"
                        className="bg-[#1e1e1e]"
                      />
                    )}
                  />
                </div>
              </div>

              <ConfirmPopover
                title="Delete Tag"
                description="Are you sure you want to delete this tag?"
                onConfirm={() => remove(index)}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-red-400 mt-6"
                  >
                    <Trash2 size={14} />
                  </Button>
                }
              />
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-12 border border-dashed border-[#3e3e42] rounded-md text-gray-500">
            No tags defined. Click "Add Tag" to create one.
          </div>
        )}
      </div>
    </div>
  );
};
