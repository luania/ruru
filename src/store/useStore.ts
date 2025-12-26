import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OpenAPIObject } from "openapi3-ts/oas31";
import YAML from "yaml";

// 递归更新 YAML 文档的纯函数
function updateYamlDocument(
  doc: YAML.Document,
  path: (string | number)[],
  oldVal: unknown,
  newVal: unknown
): void {
  if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;

  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    const oldLen = oldVal.length;
    const newLen = newVal.length;
    const minLen = Math.min(oldLen, newLen);

    for (let i = 0; i < minLen; i++) {
      updateYamlDocument(doc, [...path, i], oldVal[i], newVal[i]);
    }

    for (let i = oldLen; i < newLen; i++) {
      doc.setIn([...path, i], newVal[i]);
    }

    for (let i = oldLen - 1; i >= newLen; i--) {
      doc.deleteIn([...path, i]);
    }

    if (path[path.length - 1] === "tags") {
      const node = doc.getIn(path, true) as { flow?: boolean };
      if (node && "flow" in node) {
        node.flow = false;
      }
    }
    return;
  }

  if (
    typeof oldVal === "object" &&
    typeof newVal === "object" &&
    oldVal !== null &&
    newVal !== null &&
    !Array.isArray(oldVal) &&
    !Array.isArray(newVal)
  ) {
    const oldObj = oldVal as Record<string, unknown>;
    const newObj = newVal as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const currentPath = [...path, key];

      if (!(key in newObj)) {
        doc.deleteIn(currentPath);
      } else if (!(key in oldObj)) {
        doc.setIn(currentPath, newObj[key]);
      } else {
        updateYamlDocument(doc, currentPath, oldObj[key], newObj[key]);
      }
    }
    return;
  }

  doc.setIn(path, newVal);

  if (path[path.length - 1] === "tags" && Array.isArray(newVal)) {
    const node = doc.getIn(path, true) as { flow?: boolean };
    if (node && "flow" in node) {
      node.flow = false;
    }
  }
}

// 生成新的 YAML 内容的纯函数
function generateYamlContent(
  rawContent: string,
  oldData: OpenAPIObject,
  newData: OpenAPIObject
): string {
  const doc = YAML.parseDocument(rawContent);
  // @ts-expect-error - defaultStringType is not in the type definition
  doc.options.defaultStringType = "QUOTE_SINGLE";

  console.log({ oldData, newData });
  updateYamlDocument(doc, [], oldData, newData);

  return doc.toString();
}

interface AppState {
  rawContent: string;
  setRawContent: (content: string) => void;
  updateDocument: (
    updater: (data: OpenAPIObject) => OpenAPIObject,
    activeFilePath: string | null
  ) => void;
  workingDirectory: string | null;
  setWorkingDirectory: (path: string | null) => void;
  activeFilePath: string | null;
  setActiveFilePath: (path: string | null) => void;
  recentPaths: string[];
  addRecentPath: (path: string) => void;
  removeRecentPath: (path: string) => void;
}

// 用于缓存解析结果，避免重复解析
let cachedContent = "";
let cachedOpenapi: OpenAPIObject | null = null;

// 从 rawContent 解析 OpenAPI 的 selector
export const selectOpenapi = (state: AppState): OpenAPIObject => {
  const { rawContent } = state;

  // 如果内容相同，返回缓存的对象（保持引用稳定）
  if (rawContent === cachedContent && cachedOpenapi) {
    return cachedOpenapi;
  }

  try {
    const parsed = YAML.parse(rawContent || "{}") as OpenAPIObject;
    cachedContent = rawContent;
    cachedOpenapi = parsed;
    return parsed;
  } catch (error) {
    console.error("Failed to parse OpenAPI:", error);
    const fallback = {
      openapi: "3.0.0",
      info: { title: "New API", version: "1.0.0" },
      paths: {},
    };
    cachedContent = rawContent;
    cachedOpenapi = fallback;
    return fallback;
  }
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      rawContent: "",
      setRawContent: (content) => {
        set({ rawContent: content });
      },
      updateDocument: (updater, activeFilePath) => {
        const state = get();
        const { rawContent } = state;
        if (!activeFilePath) return;

        const currentData = selectOpenapi(state);

        // 深拷贝 currentData，避免 updater 修改原对象
        const currentDataCopy = JSON.parse(JSON.stringify(currentData));
        const newData = updater(currentDataCopy);

        // 生成新的 YAML 内容
        try {
          const newYamlContent = generateYamlContent(
            rawContent,
            currentData,
            newData
          );

          // 只更新 rawContent
          set({ rawContent: newYamlContent });

          // 异步保存到文件
          window.ipcRenderer
            .writeFile(activeFilePath, newYamlContent)
            .catch((error) => {
              console.error("Failed to save OpenAPI file:", error);
            });
        } catch (error) {
          console.error("Failed to update YAML document:", error);
        }
      },
      workingDirectory: null,
      setWorkingDirectory: (path) => set({ workingDirectory: path }),
      activeFilePath: null,
      setActiveFilePath: (path) => set({ activeFilePath: path }),
      recentPaths: [],
      addRecentPath: (path) =>
        set((state) => {
          const newPaths = [
            path,
            ...state.recentPaths.filter((p) => p !== path),
          ].slice(0, 10);
          return { recentPaths: newPaths };
        }),
      removeRecentPath: (path) =>
        set((state) => ({
          recentPaths: state.recentPaths.filter((p) => p !== path),
        })),
    }),
    {
      name: "ruru-storage",
      partialize: (state) => ({ recentPaths: state.recentPaths }),
    }
  )
);
