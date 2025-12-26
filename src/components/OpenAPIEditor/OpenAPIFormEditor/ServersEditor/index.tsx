import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Button } from "../../../ui/Button";
import { Trash2, Plus } from "lucide-react";
import type { ServerObject } from "openapi3-ts/oas31";

const serverSchema = z.object({
  servers: z.array(
    z.object({
      url: z.string().optional(),
      description: z.string().optional(),
    })
  ),
});

type ServersFormData = z.infer<typeof serverSchema>;

interface ServersEditorProps {
  initialData: ServerObject[];
  onChange: (data: ServerObject[]) => void;
}

export const ServersEditor = ({
  initialData,
  onChange,
}: ServersEditorProps) => {
  const hf = useForm<ServersFormData>({
    resolver: zodResolver(serverSchema),
    mode: "onChange",
    defaultValues: {
      servers: initialData || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: hf.control,
    name: "servers",
  });

  useEffect(() => {
    const subscription = hf.watch((value) => {
      onChange(value.servers as ServerObject[]);
    });
    return () => subscription.unsubscribe();
  }, [hf, onChange]);

  useEffect(() => {
    if (initialData) {
      const currentServers = hf.getValues().servers;
      if (JSON.stringify(initialData) !== JSON.stringify(currentServers)) {
        hf.reset({ servers: initialData });
      }
    }
  }, [initialData, hf]);

  return (
    <form className="space-y-6 max-w-2xl p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ url: "", description: "" })}
            className="gap-2"
          >
            <Plus size={14} />
            Add Server
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex gap-4 items-start p-4 bg-[#252526] rounded-md border border-[#3e3e42]"
            >
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Controller
                    control={hf.control}
                    name={`servers.${index}.url`}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="https://api.example.com/v1"
                        error={
                          hf.formState.errors.servers?.[index]?.url?.message
                        }
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Controller
                    control={hf.control}
                    name={`servers.${index}.description`}
                    render={({ field }) => (
                      <Input {...field} placeholder="Production server" />
                    )}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="text-gray-400 hover:text-red-400"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-[#3e3e42] rounded-md">
              No servers defined
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
