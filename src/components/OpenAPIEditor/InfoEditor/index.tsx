import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Input } from "../../ui/Input";
import { Label } from "../../ui/Label";
import { Textarea } from "../../ui/Textarea";

const infoSchema = z.object({
  title: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  termsOfService: z.string().optional(),
  contact: z
    .object({
      name: z.string().optional(),
      url: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  license: z
    .object({
      name: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
});

type InfoFormData = z.infer<typeof infoSchema>;

import type { InfoObject } from "openapi3-ts/oas31";

interface InfoEditorProps {
  initialData: InfoObject;
  onChange: (data: InfoObject) => void;
}

export const InfoEditor = ({ initialData, onChange }: InfoEditorProps) => {
  const hf = useForm<InfoFormData>({
    resolver: zodResolver(infoSchema),
    mode: "onChange",
    defaultValues: (initialData as InfoFormData) || {
      title: "",
      version: "",
      description: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      const currentValues = hf.getValues();
      const data = { ...currentValues } as InfoFormData;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isEmpty = (obj: any) => {
        if (!obj) return true;
        return Object.values(obj).every(
          (x) => x === "" || x === undefined || x === null
        );
      };

      if (isEmpty(data.contact)) {
        delete data.contact;
      }
      if (isEmpty(data.license)) {
        delete data.license;
      }

      if (JSON.stringify(initialData) !== JSON.stringify(data)) {
        hf.reset(initialData);
      }
    }
  }, [initialData, hf]);

  useEffect(() => {
    const subscription = hf.watch((value) => {
      const data = { ...value } as InfoFormData;

      // Helper to check if object is empty
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isEmpty = (obj: any) => {
        if (!obj) return true;
        return Object.values(obj).every(
          (x) => x === "" || x === undefined || x === null
        );
      };

      if (isEmpty(data.contact)) {
        delete data.contact;
      }
      if (isEmpty(data.license)) {
        delete data.license;
      }

      onChange(data as InfoObject);
    });
    return () => subscription.unsubscribe();
  }, [hf, onChange]);

  return (
    <form className="space-y-6 max-w-2xl p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">General Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Controller
              control={hf.control}
              name="title"
              render={({ field }) => (
                <Input
                  id="title"
                  {...field}
                  error={hf.formState.errors.title?.message}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Controller
              control={hf.control}
              name="version"
              render={({ field }) => (
                <Input
                  id="version"
                  {...field}
                  error={hf.formState.errors.version?.message}
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Controller
            control={hf.control}
            name="description"
            render={({ field }) => <Textarea id="description" {...field} />}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="termsOfService">Terms of Service URL</Label>
          <Controller
            control={hf.control}
            name="termsOfService"
            render={({ field }) => <Input id="termsOfService" {...field} />}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Name</Label>
            <Controller
              control={hf.control}
              name="contact.name"
              render={({ field }) => <Input id="contactName" {...field} />}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Controller
              control={hf.control}
              name="contact.email"
              render={({ field }) => (
                <Input
                  id="contactEmail"
                  {...field}
                  error={hf.formState.errors.contact?.email?.message}
                />
              )}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="contactUrl">URL</Label>
            <Controller
              control={hf.control}
              name="contact.url"
              render={({ field }) => <Input id="contactUrl" {...field} />}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">License</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licenseName">Name</Label>
            <Controller
              control={hf.control}
              name="license.name"
              render={({ field }) => (
                <Input
                  id="licenseName"
                  {...field}
                  error={hf.formState.errors.license?.name?.message}
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseUrl">URL</Label>
            <Controller
              control={hf.control}
              name="license.url"
              render={({ field }) => <Input id="licenseUrl" {...field} />}
            />
          </div>
        </div>
      </div>
    </form>
  );
};
