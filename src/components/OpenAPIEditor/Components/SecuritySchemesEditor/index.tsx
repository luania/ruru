import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Button } from "../../../ui/Button";
import { Trash2, Plus } from "lucide-react";
import type { SecuritySchemeObject, ComponentsObject } from "openapi3-ts/oas31";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/Select";

const securitySchemeSchema = z.object({
  schemes: z.array(
    z.object({
      key: z.string().min(1, "Key is required"),
      type: z.enum(["apiKey", "http", "oauth2", "openIdConnect"]),
      description: z.string().optional(),
      name: z.string().optional(), // for apiKey
      in: z.enum(["query", "header", "cookie"]).optional(), // for apiKey
      scheme: z.string().optional(), // for http
      bearerFormat: z.string().optional(), // for http bearer
      openIdConnectUrl: z.string().optional(), // for openIdConnect
      // TODO: Add OAuth2 flows support
    })
  ),
});

type SecuritySchemesFormData = z.infer<typeof securitySchemeSchema>;

interface SecuritySchemesEditorProps {
  initialData: ComponentsObject["securitySchemes"];
  onChange: (data: ComponentsObject["securitySchemes"]) => void;
}

const transformToFormData = (
  data: ComponentsObject["securitySchemes"]
): SecuritySchemesFormData => {
  if (!data) return { schemes: [] };
  return {
    schemes: Object.entries(data).map(([key, value]) => {
      // We assume it's not a ReferenceObject for now
      const scheme = value as SecuritySchemeObject;
      return {
        key,
        type: scheme.type as "apiKey" | "http" | "oauth2" | "openIdConnect",
        description: scheme.description,
        name: scheme.name,
        in: scheme.in as "header" | "query" | "cookie" | undefined,
        scheme: scheme.scheme,
        bearerFormat: scheme.bearerFormat,
        openIdConnectUrl: scheme.openIdConnectUrl,
      };
    }),
  };
};

const transformToApiData = (
  data: SecuritySchemesFormData
): ComponentsObject["securitySchemes"] => {
  const result: Record<string, SecuritySchemeObject> = {};
  data.schemes.forEach((item) => {
    if (item.key) {
      let scheme: SecuritySchemeObject;

      switch (item.type) {
        case "apiKey":
          scheme = {
            type: "apiKey",
            description: item.description,
            name: item.name || "",
            in: item.in || "header",
          };
          break;
        case "http":
          scheme = {
            type: "http",
            description: item.description,
            scheme: item.scheme || "bearer",
            bearerFormat: item.bearerFormat,
          };
          break;
        case "oauth2":
          scheme = {
            type: "oauth2",
            description: item.description,
            flows: {}, // TODO: Add OAuth2 flows support
          };
          break;
        case "openIdConnect":
          scheme = {
            type: "openIdConnect",
            description: item.description,
            openIdConnectUrl: item.openIdConnectUrl || "",
          };
          break;
        default:
          // Fallback for unknown types, though zod schema prevents this
          scheme = {
            type: "apiKey",
            name: "",
            in: "header",
          };
      }

      result[item.key] = scheme;
    }
  });
  return result;
};

export const SecuritySchemesEditor = ({
  initialData,
  onChange,
}: SecuritySchemesEditorProps) => {
  const hf = useForm<SecuritySchemesFormData>({
    resolver: zodResolver(securitySchemeSchema),
    defaultValues: transformToFormData(initialData),
  });

  const { fields, append, remove } = useFieldArray({
    control: hf.control,
    name: "schemes",
  });

  useEffect(() => {
    if (initialData) {
      const currentValues = transformToApiData(hf.getValues());
      if (JSON.stringify(initialData) !== JSON.stringify(currentValues)) {
        hf.reset(transformToFormData(initialData));
      }
    }
  }, [initialData, hf]);

  const onSubmit = (data: SecuritySchemesFormData) => {
    onChange(transformToApiData(data));
  };

  return (
    <form
      onChange={hf.handleSubmit(onSubmit)}
      className="space-y-6 max-w-3xl p-6"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              append({
                key: "",
                type: "apiKey",
                name: "",
                in: "header",
              })
            }
            className="gap-2"
          >
            <Plus size={14} />
            Add Security Scheme
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => {
            const type = hf.watch(`schemes.${index}.type`);
            const scheme = hf.watch(`schemes.${index}.scheme`);

            return (
              <div
                key={field.id}
                className="p-4 bg-[#252526] rounded-md border border-[#3e3e42] space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Key (Reference Name)</Label>
                      <Controller
                        control={hf.control}
                        name={`schemes.${index}.key`}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="e.g. ApiKeyAuth"
                            error={
                              hf.formState.errors.schemes?.[index]?.key?.message
                            }
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Controller
                        control={hf.control}
                        name={`schemes.${index}.type`}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="apiKey">API Key</SelectItem>
                              <SelectItem value="http">HTTP</SelectItem>
                              <SelectItem value="oauth2">OAuth2</SelectItem>
                              <SelectItem value="openIdConnect">
                                OpenID Connect
                              </SelectItem>
                            </SelectContent>
                          </Select>
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

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Controller
                    control={hf.control}
                    name={`schemes.${index}.description`}
                    render={({ field }) => (
                      <Input {...field} placeholder="Description" />
                    )}
                  />
                </div>

                {type === "apiKey" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Parameter Name</Label>
                      <Controller
                        control={hf.control}
                        name={`schemes.${index}.name`}
                        render={({ field }) => (
                          <Input {...field} placeholder="e.g. X-API-Key" />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>In</Label>
                      <Controller
                        control={hf.control}
                        name={`schemes.${index}.in`}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="header">Header</SelectItem>
                              <SelectItem value="query">Query</SelectItem>
                              <SelectItem value="cookie">Cookie</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                )}

                {type === "http" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scheme</Label>
                      <Controller
                        control={hf.control}
                        name={`schemes.${index}.scheme`}
                        render={({ field }) => (
                          <Input {...field} placeholder="e.g. bearer, basic" />
                        )}
                      />
                    </div>
                    {scheme === "bearer" && (
                      <div className="space-y-2">
                        <Label>Bearer Format</Label>
                        <Controller
                          control={hf.control}
                          name={`schemes.${index}.bearerFormat`}
                          render={({ field }) => (
                            <Input {...field} placeholder="e.g. JWT" />
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}

                {type === "openIdConnect" && (
                  <div className="space-y-2">
                    <Label>Connect URL</Label>
                    <Controller
                      control={hf.control}
                      name={`schemes.${index}.openIdConnectUrl`}
                      render={({ field }) => (
                        <Input {...field} placeholder="https://..." />
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-[#3e3e42] rounded-md">
              No security schemes defined
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
