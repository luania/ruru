import { useCallback, useRef, useEffect } from "react";
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
  const initialDataRef = useRef(initialData);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  const handleSecuritySchemesChange = useCallback(
    (data: ComponentsObject["securitySchemes"]) => {
      onChange({ ...initialDataRef.current, securitySchemes: data });
    },
    [onChange]
  );

  const handleSchemasChange = useCallback(
    (data: ComponentsObject["schemas"]) => {
      onChange({ ...initialDataRef.current, schemas: data });
    },
    [onChange]
  );

  const handleResponsesChange = useCallback(
    (data: ComponentsObject["responses"]) => {
      onChange({ ...initialDataRef.current, responses: data });
    },
    [onChange]
  );

  const handleParametersChange = useCallback(
    (data: ComponentsObject["parameters"]) => {
      onChange({ ...initialDataRef.current, parameters: data });
    },
    [onChange]
  );

  const handleRequestBodiesChange = useCallback(
    (data: ComponentsObject["requestBodies"]) => {
      onChange({ ...initialDataRef.current, requestBodies: data });
    },
    [onChange]
  );

  const handleHeadersChange = useCallback(
    (data: ComponentsObject["headers"]) => {
      onChange({ ...initialDataRef.current, headers: data });
    },
    [onChange]
  );

  const handleLinksChange = useCallback(
    (data: ComponentsObject["links"]) => {
      onChange({ ...initialDataRef.current, links: data });
    },
    [onChange]
  );

  const handleCallbacksChange = useCallback(
    (data: ComponentsObject["callbacks"]) => {
      onChange({ ...initialDataRef.current, callbacks: data });
    },
    [onChange]
  );

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
            onChange={handleSchemasChange}
          />
        )}
        {activeSection === "responses" && (
          <ResponsesEditor
            initialData={initialData?.responses || {}}
            onChange={handleResponsesChange}
          />
        )}
        {activeSection === "parameters" && (
          <ParametersEditor
            initialData={initialData?.parameters || {}}
            onChange={handleParametersChange}
          />
        )}
        {activeSection === "requestBodies" && (
          <RequestBodiesEditor
            initialData={initialData?.requestBodies || {}}
            onChange={handleRequestBodiesChange}
          />
        )}
        {activeSection === "headers" && (
          <HeadersEditor
            initialData={initialData?.headers || {}}
            onChange={handleHeadersChange}
          />
        )}
        {activeSection === "links" && (
          <LinksEditor
            initialData={initialData?.links || {}}
            onChange={handleLinksChange}
          />
        )}
        {activeSection === "callbacks" && (
          <CallbacksEditor
            initialData={initialData?.callbacks || {}}
            onChange={handleCallbacksChange}
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
