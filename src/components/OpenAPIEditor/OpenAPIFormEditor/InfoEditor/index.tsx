import { useState, useEffect } from "react";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Textarea } from "../../../ui/Textarea";
import type { InfoObject } from "openapi3-ts/oas31";

interface InfoEditorProps {
  initialData: InfoObject;
  onChange: (data: InfoObject) => void;
}

export const InfoEditor = ({ initialData, onChange }: InfoEditorProps) => {
  const [data, setData] = useState<InfoObject>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleChange = (updates: Partial<InfoObject>) => {
    const newData = { ...data, ...updates };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isEmpty = (obj: any) => {
      if (!obj) return true;
      return Object.values(obj).every(
        (x) => x === "" || x === undefined || x === null
      );
    };

    if (isEmpty(newData.contact)) {
      delete newData.contact;
    }
    if (isEmpty(newData.license)) {
      delete newData.license;
    }

    setData(newData);
    onChange(newData);
  };

  return (
    <form className="space-y-6 max-w-2xl p-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={data.title || ""}
              onChange={(e) => handleChange({ title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={data.version || ""}
              onChange={(e) => handleChange({ version: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={data.description || ""}
            onChange={(e) => handleChange({ description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="termsOfService">Terms of Service URL</Label>
          <Input
            id="termsOfService"
            value={data.termsOfService || ""}
            onChange={(e) => handleChange({ termsOfService: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Name</Label>
            <Input
              id="contactName"
              value={data.contact?.name || ""}
              onChange={(e) =>
                handleChange({
                  contact: {
                    name: e.target.value,
                    email: data.contact?.email || "",
                    url: data.contact?.url || "",
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              value={data.contact?.email || ""}
              onChange={(e) =>
                handleChange({
                  contact: {
                    name: data.contact?.name || "",
                    email: e.target.value,
                    url: data.contact?.url || "",
                  },
                })
              }
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="contactUrl">URL</Label>
            <Input
              id="contactUrl"
              value={data.contact?.url || ""}
              onChange={(e) =>
                handleChange({
                  contact: {
                    name: data.contact?.name || "",
                    email: data.contact?.email || "",
                    url: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">License</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licenseName">Name</Label>
            <Input
              id="licenseName"
              value={data.license?.name || ""}
              onChange={(e) =>
                handleChange({
                  license: {
                    name: e.target.value,
                    url: data.license?.url || "",
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseUrl">URL</Label>
            <Input
              id="licenseUrl"
              value={data.license?.url || ""}
              onChange={(e) =>
                handleChange({
                  license: {
                    name: data.license?.name || "",
                    url: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      </div>
    </form>
  );
};
