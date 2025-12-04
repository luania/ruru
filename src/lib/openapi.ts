import yaml from "js-yaml";
import type { OpenAPIObject } from "openapi3-ts/oas31";

export const isOpenAPI = (content: string): boolean => {
  try {
    const parsed = yaml.load(content);
    if (typeof parsed === "object" && parsed !== null) {
      const p = parsed as Record<string, unknown>;
      return !!(p.openapi || p.swagger);
    }
    return false;
  } catch {
    return false;
  }
};

export const parseOpenAPI = (content: string): OpenAPIObject | null => {
  try {
    return yaml.load(content) as OpenAPIObject;
  } catch {
    return null;
  }
};
