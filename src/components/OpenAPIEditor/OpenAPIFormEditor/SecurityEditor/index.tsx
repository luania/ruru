import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Button } from "../../../ui/Button";
import { ConfirmPopover } from "../../../ui/ConfirmPopover";
import { Trash2, Plus, X } from "lucide-react";
import type { SecurityRequirementObject } from "openapi3-ts/oas31";

const securitySchema = z.object({
  requirements: z.array(
    z.object({
      schemes: z.array(
        z.object({
          name: z.string().optional(),
          scopes: z.string().optional(),
        })
      ),
    })
  ),
});

type SecurityFormData = z.infer<typeof securitySchema>;

interface SecurityEditorProps {
  initialData: SecurityRequirementObject[];
  onChange: (data: SecurityRequirementObject[]) => void;
}

const transformToFormData = (
  data: SecurityRequirementObject[]
): SecurityFormData => {
  if (!data) return { requirements: [] };
  return {
    requirements: data.map((req) => ({
      schemes: Object.entries(req).map(([name, scopes]) => ({
        name,
        scopes: scopes.join(", "),
      })),
    })),
  };
};

const transformToApiData = (
  data: SecurityFormData
): SecurityRequirementObject[] => {
  return data.requirements.map((req) => {
    const obj: SecurityRequirementObject = {};
    req.schemes.forEach((scheme) => {
      if (scheme.name) {
        obj[scheme.name] = scheme.scopes
          ? scheme.scopes
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      }
    });
    return obj;
  });
};

const RequirementItem = ({
  control,
  index,
  remove,
  errors,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  index: number;
  remove: (index: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
}) => {
  const {
    fields,
    append,
    remove: removeScheme,
  } = useFieldArray({
    control,
    name: `requirements.${index}.schemes`,
  });

  return (
    <div className="p-4 bg-[#252526] rounded-md border border-[#3e3e42] space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">
          Requirement {index + 1}
        </span>
        <ConfirmPopover
          title="Delete Requirement"
          description="Are you sure you want to delete this security requirement?"
          onConfirm={() => remove(index)}
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
        {fields.map((field, schemeIndex) => (
          <div key={field.id} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Scheme Name</Label>
                <Controller
                  control={control}
                  name={`requirements.${index}.schemes.${schemeIndex}.name`}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g. api_key"
                      className="h-8 text-sm"
                      error={
                        errors?.requirements?.[index]?.schemes?.[schemeIndex]
                          ?.name?.message
                      }
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">
                  Scopes (comma separated)
                </Label>
                <Controller
                  control={control}
                  name={`requirements.${index}.schemes.${schemeIndex}.scopes`}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="read:pets, write:pets"
                      className="h-8 text-sm"
                    />
                  )}
                />
              </div>
            </div>
            <ConfirmPopover
              title="Delete Scheme"
              description="Are you sure you want to delete this scheme?"
              onConfirm={() => removeScheme(schemeIndex)}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 text-gray-400 hover:text-red-400 h-8 w-8"
                >
                  <X size={14} />
                </Button>
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ name: "", scopes: "" })}
          className="text-xs text-blue-400 hover:text-blue-300 px-0"
        >
          <Plus size={12} className="mr-1" /> Add Scheme
        </Button>
      </div>
    </div>
  );
};

export const SecurityEditor = ({
  initialData,
  onChange,
}: SecurityEditorProps) => {
  const hf = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    mode: "onChange",
    defaultValues: transformToFormData(initialData || []),
  });

  const { fields, append, remove } = useFieldArray({
    control: hf.control,
    name: "requirements",
  });

  useEffect(() => {
    const subscription = hf.watch((value) => {
      onChange(transformToApiData(value as SecurityFormData));
    });
    return () => subscription.unsubscribe();
  }, [hf, onChange]);

  useEffect(() => {
    if (initialData) {
      const currentValues = transformToApiData(hf.getValues());
      if (JSON.stringify(initialData) !== JSON.stringify(currentValues)) {
        hf.reset(transformToFormData(initialData));
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
            onClick={() => append({ schemes: [{ name: "", scopes: "" }] })}
            className="gap-2"
          >
            <Plus size={14} />
            Add Requirement
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <RequirementItem
              key={field.id}
              control={hf.control}
              index={index}
              remove={remove}
              errors={hf.formState.errors}
            />
          ))}

          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-[#3e3e42] rounded-md">
              No security requirements defined
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
