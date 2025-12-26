import YAML from "yaml";

// 递归更新 YAML 文档的纯函数
export function updateYamlDocument(
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
