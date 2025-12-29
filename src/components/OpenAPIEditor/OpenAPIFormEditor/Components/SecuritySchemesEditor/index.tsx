import { useState, useEffect } from "react";
import { Input } from "../../../../ui/Input";
import { Label } from "../../../../ui/Label";
import { Button } from "../../../../ui/Button";
import { Trash2, Plus } from "lucide-react";
import type { SecuritySchemeObject, ComponentsObject } from "openapi3-ts/oas31";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../ui/Select";

interface SecuritySchemesEditorProps {
  initialData: ComponentsObject["securitySchemes"];
  onChange: (data: ComponentsObject["securitySchemes"]) => void;
}

type SchemeEntry = {
  key: string;
  scheme: SecuritySchemeObject;
};

export const SecuritySchemesEditor = ({
  initialData,
  onChange,
}: SecuritySchemesEditorProps) => {
  const [schemes, setSchemes] = useState<SchemeEntry[]>(() => {
    if (!initialData) return [];
    return Object.entries(initialData).map(([key, scheme]) => ({
      key,
      scheme: scheme as SecuritySchemeObject,
    }));
  });

  // 使用 key 来强制重新初始化，避免 useEffect 中的 setState
  const initialDataKey = initialData
    ? JSON.stringify(Object.keys(initialData).sort())
    : "";

  useEffect(() => {
    const newSchemes = !initialData
      ? []
      : Object.entries(initialData).map(([key, scheme]) => ({
          key,
          scheme: scheme as SecuritySchemeObject,
        }));

    // 只在数据真正变化时更新
    if (JSON.stringify(schemes) !== JSON.stringify(newSchemes)) {
      setSchemes(newSchemes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDataKey]);

  const handleAdd = () => {
    const newSchemes = [
      ...schemes,
      {
        key: "",
        scheme: {
          type: "apiKey",
          name: "",
          in: "header",
        } as SecuritySchemeObject,
      },
    ];
    setSchemes(newSchemes);
    updateParent(newSchemes);
  };

  const handleRemove = (index: number) => {
    const newSchemes = schemes.filter((_, i) => i !== index);
    setSchemes(newSchemes);
    updateParent(newSchemes);
  };

  const handleKeyChange = (index: number, newKey: string) => {
    const newSchemes = schemes.map((item, i) =>
      i === index ? { ...item, key: newKey } : item
    );
    setSchemes(newSchemes);
    updateParent(newSchemes);
  };

  const handleSchemeChange = (
    index: number,
    updates: Partial<SecuritySchemeObject>
  ) => {
    const newSchemes = schemes.map((item, i) =>
      i === index ? { ...item, scheme: { ...item.scheme, ...updates } } : item
    );
    setSchemes(newSchemes);
    updateParent(newSchemes);
  };

  const handleTypeChange = (
    index: number,
    type: SecuritySchemeObject["type"]
  ) => {
    let newScheme: SecuritySchemeObject;

    switch (type) {
      case "apiKey":
        newScheme = {
          type: "apiKey",
          name: "",
          in: "header",
          description: schemes[index].scheme.description,
        };
        break;
      case "http":
        newScheme = {
          type: "http",
          scheme: "bearer",
          description: schemes[index].scheme.description,
        };
        break;
      case "oauth2":
        newScheme = {
          type: "oauth2",
          flows: {},
          description: schemes[index].scheme.description,
        };
        break;
      case "openIdConnect":
        newScheme = {
          type: "openIdConnect",
          openIdConnectUrl: "",
          description: schemes[index].scheme.description,
        };
        break;
      default:
        newScheme = schemes[index].scheme;
    }

    const newSchemes = schemes.map((item, i) =>
      i === index ? { ...item, scheme: newScheme } : item
    );
    setSchemes(newSchemes);
    updateParent(newSchemes);
  };

  const updateParent = (newSchemes: SchemeEntry[]) => {
    const result: Record<string, SecuritySchemeObject> = {};
    newSchemes.forEach((item) => {
      if (item.key) {
        result[item.key] = item.scheme;
      }
    });
    onChange(result);
  };

  return (
    <form className="space-y-6 max-w-3xl p-6">
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
            Add Security Scheme
          </Button>
        </div>

        <div className="space-y-4">
          {schemes.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-[#252526] rounded-md border border-[#3e3e42] space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Key (Reference Name)</Label>
                    <Input
                      value={item.key}
                      onChange={(e) => handleKeyChange(index, e.target.value)}
                      placeholder="e.g. ApiKeyAuth"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={item.scheme.type}
                      onValueChange={(value) =>
                        handleTypeChange(
                          index,
                          value as SecuritySchemeObject["type"]
                        )
                      }
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

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={item.scheme.description || ""}
                  onChange={(e) =>
                    handleSchemeChange(index, { description: e.target.value })
                  }
                  placeholder="Description"
                />
              </div>

              {item.scheme.type === "apiKey" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parameter Name</Label>
                    <Input
                      value={item.scheme.name || ""}
                      onChange={(e) =>
                        handleSchemeChange(index, { name: e.target.value })
                      }
                      placeholder="e.g. X-API-Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>In</Label>
                    <Select
                      value={item.scheme.in || "header"}
                      onValueChange={(value) =>
                        handleSchemeChange(index, {
                          in: value as "header" | "query" | "cookie",
                        })
                      }
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
                  </div>
                </div>
              )}

              {item.scheme.type === "http" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Scheme</Label>
                    <Input
                      value={item.scheme.scheme || ""}
                      onChange={(e) =>
                        handleSchemeChange(index, { scheme: e.target.value })
                      }
                      placeholder="e.g. bearer, basic"
                    />
                  </div>
                  {item.scheme.scheme === "bearer" && (
                    <div className="space-y-2">
                      <Label>Bearer Format</Label>
                      <Input
                        value={item.scheme.bearerFormat || ""}
                        onChange={(e) =>
                          handleSchemeChange(index, {
                            bearerFormat: e.target.value,
                          })
                        }
                        placeholder="e.g. JWT"
                      />
                    </div>
                  )}
                </div>
              )}

              {item.scheme.type === "openIdConnect" && (
                <div className="space-y-2">
                  <Label>Connect URL</Label>
                  <Input
                    value={item.scheme.openIdConnectUrl || ""}
                    onChange={(e) =>
                      handleSchemeChange(index, {
                        openIdConnectUrl: e.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>
          ))}

          {schemes.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-[#3e3e42] rounded-md">
              No security schemes defined
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
