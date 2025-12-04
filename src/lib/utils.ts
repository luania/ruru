import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSchemaTypeColor(type: string): string {
  switch (type) {
    case "string":
      return "text-green-400";
    case "integer":
    case "number":
      return "text-orange-400";
    case "boolean":
      return "text-blue-400";
    case "allOf":
    case "oneOf":
    case "anyOf":
      return "text-yellow-400";
    default:
      return "text-purple-400";
  }
}

export function getMethodColor(method: string): string {
  switch (method.toLowerCase()) {
    case "get":
      return "bg-green-500/20 text-green-400";
    case "post":
      return "bg-blue-500/20 text-blue-400";
    case "put":
      return "bg-orange-500/20 text-orange-400";
    case "delete":
      return "bg-red-500/20 text-red-400";
    case "patch":
      return "bg-yellow-500/20 text-yellow-400";
    case "head":
      return "bg-purple-500/20 text-purple-400";
    case "options":
      return "bg-pink-500/20 text-pink-400";
    case "trace":
      return "bg-cyan-500/20 text-cyan-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}
