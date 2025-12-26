import type { OpenAPIObject } from "openapi3-ts/oas31";
import { updateYamlDocument } from "../lib/updateYamlDocument";
import YAML from "yaml";

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

export function saveOpenapiYamlDocument(
  rawContent: string,
  updater: (data: OpenAPIObject) => OpenAPIObject,
  activeFilePath: string | null
): string | null {
  if (!activeFilePath || !rawContent) return null;

  try {
    const currentData = YAML.parse(rawContent || "{}") as OpenAPIObject;

    // 深拷贝 currentData，避免 updater 修改原对象
    const currentDataCopy = JSON.parse(JSON.stringify(currentData));
    const newData = updater(currentDataCopy);

    // 生成新的 YAML 内容
    const newYamlContent = generateYamlContent(
      rawContent,
      currentData,
      newData
    );

    // 异步保存到文件
    window.ipcRenderer
      .writeFile(activeFilePath, newYamlContent)
      .catch((error) => {
        console.error("Failed to save OpenAPI file:", error);
      });

    return newYamlContent;
  } catch (error) {
    console.error("Failed to update YAML document:", error);
    return null;
  }
}
