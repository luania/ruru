import { SecuritySchemesEditor } from "./SecuritySchemesEditor";
import { SchemasEditor } from "./SchemasEditor";
import { ResponsesEditor } from "./ResponsesEditor";
import { ParametersEditor } from "./ParametersEditor";
import { RequestBodiesEditor } from "./RequestBodiesEditor";
import { HeadersEditor } from "./HeadersEditor";
import { LinksEditor } from "./LinksEditor";
import { CallbacksEditor } from "./CallbacksEditor";
import type { ComponentsObject } from "openapi3-ts/oas31";

interface ComponentsEditorProps {
  initialData: ComponentsObject;
  activeSection: ComponentSection;
  onChange: (data: ComponentsObject) => void;
}

export type ComponentSection =
  | "schemas"
  | "responses"
  | "parameters"
  | "examples"
  | "requestBodies"
  | "headers"
  | "securitySchemes"
  | "links"
  | "callbacks"
  | "pathItems";

export const ComponentsEditor = ({
  initialData,
  activeSection,
  onChange,
}: ComponentsEditorProps) => {
  const handleSecuritySchemesChange = (
    data: ComponentsObject["securitySchemes"]
  ) => {
    onChange({ ...initialData, securitySchemes: data });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        {activeSection === "securitySchemes" && (
          <SecuritySchemesEditor
            initialData={initialData?.securitySchemes || {}}
            onChange={handleSecuritySchemesChange}
          />
        )}
        {activeSection === "schemas" && (
          <SchemasEditor
            initialData={initialData?.schemas || {}}
            onChange={(data) => onChange({ ...initialData, schemas: data })}
          />
        )}
        {activeSection === "responses" && (
          <ResponsesEditor
            initialData={initialData?.responses || {}}
            onChange={(data) => onChange({ ...initialData, responses: data })}
          />
        )}
        {activeSection === "parameters" && (
          <ParametersEditor
            initialData={initialData?.parameters || {}}
            onChange={(data) => onChange({ ...initialData, parameters: data })}
          />
        )}
        {activeSection === "requestBodies" && (
          <RequestBodiesEditor
            initialData={initialData?.requestBodies || {}}
            onChange={(data) =>
              onChange({ ...initialData, requestBodies: data })
            }
          />
        )}
        {activeSection === "headers" && (
          <HeadersEditor
            initialData={initialData?.headers || {}}
            onChange={(data) => onChange({ ...initialData, headers: data })}
          />
        )}
        {activeSection === "links" && (
          <LinksEditor
            initialData={initialData?.links || {}}
            onChange={(data) => onChange({ ...initialData, links: data })}
          />
        )}
        {activeSection === "callbacks" && (
          <CallbacksEditor
            initialData={initialData?.callbacks || {}}
            onChange={(data) => onChange({ ...initialData, callbacks: data })}
          />
        )}
        {activeSection !== "securitySchemes" &&
          activeSection !== "schemas" &&
          activeSection !== "responses" &&
          activeSection !== "parameters" &&
          activeSection !== "requestBodies" &&
          activeSection !== "headers" &&
          activeSection !== "links" &&
          activeSection !== "callbacks" && (
            <div className="text-center py-10 text-gray-500">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}{" "}
              editor coming soon...
            </div>
          )}
      </div>
    </div>
  );
};
