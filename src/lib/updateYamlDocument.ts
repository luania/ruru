import YAML from "yaml";
import { YAMLMap, YAMLSeq, Scalar } from "yaml";

// 递归更新 YAML 文档 - 使用 AST API 而非 setIn
export function updateYamlDocument(
  doc: YAML.Document,
  path: (string | number)[],
  oldVal: unknown,
  newVal: unknown,
): void {
  if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;

  // 根路径：增量更新而非整体替换，以保留原始格式
  if (path.length === 0) {
    if (
      typeof oldVal === "object" &&
      typeof newVal === "object" &&
      oldVal !== null &&
      newVal !== null &&
      !Array.isArray(oldVal) &&
      !Array.isArray(newVal)
    ) {
      const map = doc.contents as YAMLMap;
      if (map instanceof YAMLMap) {
        updateObject(
          map,
          oldVal as Record<string, unknown>,
          newVal as Record<string, unknown>,
        );
        return;
      }
    }
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      const seq = doc.contents as YAMLSeq;
      if (seq instanceof YAMLSeq) {
        updateArray(seq, oldVal, newVal, "root");
        return;
      }
    }
    doc.contents = createNode(newVal);
    return;
  }

  const parentPath = path.slice(0, -1);
  const key = path[path.length - 1];

  // 确保父路径存在
  ensurePath(doc, parentPath);
  const parent = getNode(doc, parentPath);

  if (!parent) return;

  setNodeValue(parent, key, oldVal, newVal);
}

// 获取指定路径的节点
function getNode(
  doc: YAML.Document,
  path: (string | number)[],
): YAMLMap | YAMLSeq | null {
  let current: YAMLMap | YAMLSeq | Scalar | null = doc.contents as
    | YAMLMap
    | YAMLSeq
    | Scalar
    | null;

  for (const key of path) {
    if (!current) return null;

    if (current instanceof YAMLMap) {
      const next = current.get(key);
      current =
        next instanceof YAMLMap ||
        next instanceof YAMLSeq ||
        next instanceof Scalar
          ? next
          : null;
    } else if (current instanceof YAMLSeq) {
      const next = current.items[key as number];
      current =
        next instanceof YAMLMap ||
        next instanceof YAMLSeq ||
        next instanceof Scalar
          ? next
          : null;
    } else {
      return null;
    }
  }

  return current instanceof YAMLMap || current instanceof YAMLSeq
    ? current
    : null;
}

// 确保路径存在，创建中间节点
function ensurePath(doc: YAML.Document, path: (string | number)[]): void {
  if (path.length === 0) {
    if (!doc.contents) {
      doc.contents = new YAMLMap();
    }
    return;
  }

  let current: YAMLMap | YAMLSeq | Scalar | null = doc.contents as
    | YAMLMap
    | YAMLSeq
    | Scalar
    | null;
  if (!current) {
    doc.contents = new YAMLMap();
    current = doc.contents;
  }

  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const nextKey = i + 1 < path.length ? path[i + 1] : undefined;

    if (current instanceof YAMLMap) {
      let next: YAMLMap | YAMLSeq | Scalar | unknown = current.get(key);
      if (!next || (!(next instanceof YAMLMap) && !(next instanceof YAMLSeq))) {
        // 根据下一个键的类型决定创建 Map 还是 Seq
        next = typeof nextKey === "number" ? new YAMLSeq() : new YAMLMap();
        current.set(key, next);
      }
      current = next as YAMLMap | YAMLSeq;
    } else if (current instanceof YAMLSeq) {
      const index = key as number;
      // 确保数组足够长
      while (current.items.length <= index) {
        current.items.push(null);
      }
      let next: YAMLMap | YAMLSeq | Scalar | unknown = current.items[index];
      if (!next || (!(next instanceof YAMLMap) && !(next instanceof YAMLSeq))) {
        next = typeof nextKey === "number" ? new YAMLSeq() : new YAMLMap();
        current.items[index] = next;
      }
      current = next as YAMLMap | YAMLSeq;
    }
  }
}

// 在父节点上设置值
function setNodeValue(
  parent: YAMLMap | YAMLSeq,
  key: string | number,
  oldVal: unknown,
  newVal: unknown,
): void {
  if (parent instanceof YAMLMap) {
    const mapKey = key as string;

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      let seq = parent.get(mapKey) as YAMLSeq | undefined;
      if (!seq || !(seq instanceof YAMLSeq)) {
        seq = new YAMLSeq();
        parent.set(mapKey, seq);
      }
      updateArray(seq, oldVal, newVal, mapKey);
    } else if (
      typeof oldVal === "object" &&
      typeof newVal === "object" &&
      oldVal !== null &&
      newVal !== null &&
      !Array.isArray(oldVal) &&
      !Array.isArray(newVal)
    ) {
      let map = parent.get(mapKey) as YAMLMap | undefined;
      if (!map || !(map instanceof YAMLMap)) {
        map = new YAMLMap();
        parent.set(mapKey, map);
      }
      updateObject(
        map,
        oldVal as Record<string, unknown>,
        newVal as Record<string, unknown>,
      );
    } else {
      parent.set(mapKey, createNode(newVal));
    }
  } else if (parent instanceof YAMLSeq) {
    const index = key as number;

    // 确保数组足够长
    while (parent.items.length <= index) {
      parent.items.push(null);
    }

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      let seq = parent.items[index] as YAMLSeq | undefined;
      if (!seq || !(seq instanceof YAMLSeq)) {
        seq = new YAMLSeq();
        parent.items[index] = seq;
      }
      updateArray(seq, oldVal, newVal, index);
    } else if (
      typeof oldVal === "object" &&
      typeof newVal === "object" &&
      oldVal !== null &&
      newVal !== null &&
      !Array.isArray(oldVal) &&
      !Array.isArray(newVal)
    ) {
      let map = parent.items[index] as YAMLMap | undefined;
      if (!map || !(map instanceof YAMLMap)) {
        map = new YAMLMap();
        parent.items[index] = map;
      }
      updateObject(
        map,
        oldVal as Record<string, unknown>,
        newVal as Record<string, unknown>,
      );
    } else {
      parent.items[index] = createNode(newVal);
    }
  }
}

// 更新数组
function updateArray(
  seq: YAMLSeq,
  oldArr: unknown[],
  newArr: unknown[],
  key: string | number,
): void {
  const oldLen = oldArr.length;
  const newLen = newArr.length;
  const minLen = Math.min(oldLen, newLen);

  // 更新现有元素
  for (let i = 0; i < minLen; i++) {
    updateArrayItem(seq, i, oldArr[i], newArr[i]);
  }

  // 添加新元素
  for (let i = oldLen; i < newLen; i++) {
    seq.add(createNode(newArr[i]));
  }

  // 删除多余元素（从后往前删）
  for (let i = oldLen - 1; i >= newLen; i--) {
    seq.items.splice(i, 1);
  }

  // 特殊处理 tags，确保不使用 flow 样式
  if (key === "tags") {
    seq.flow = false;
  }
}

// 更新数组中的单个元素
function updateArrayItem(
  seq: YAMLSeq,
  index: number,
  oldVal: unknown,
  newVal: unknown,
): void {
  if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;

  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    let childSeq = seq.items[index] as YAMLSeq | undefined;
    if (!childSeq || !(childSeq instanceof YAMLSeq)) {
      childSeq = new YAMLSeq();
      seq.items[index] = childSeq;
    }
    updateArray(childSeq, oldVal, newVal, index);
  } else if (
    typeof oldVal === "object" &&
    typeof newVal === "object" &&
    oldVal !== null &&
    newVal !== null &&
    !Array.isArray(oldVal) &&
    !Array.isArray(newVal)
  ) {
    let map = seq.items[index] as YAMLMap | undefined;
    if (!map || !(map instanceof YAMLMap)) {
      map = new YAMLMap();
      seq.items[index] = map;
    }
    updateObject(
      map,
      oldVal as Record<string, unknown>,
      newVal as Record<string, unknown>,
    );
  } else {
    seq.items[index] = createNode(newVal);
  }
}

// 更新对象
function updateObject(
  map: YAMLMap,
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
): void {
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    if (!(key in newObj)) {
      // 删除键
      map.delete(key);
    } else if (!(key in oldObj)) {
      // 添加新键
      map.set(key, createNode(newObj[key]));
    } else {
      // 更新现有键
      updateObjectValue(map, key, oldObj[key], newObj[key]);
    }
  }
}

// 更新对象中的单个值
function updateObjectValue(
  map: YAMLMap,
  key: string,
  oldVal: unknown,
  newVal: unknown,
): void {
  if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;

  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    let seq = map.get(key) as YAMLSeq | undefined;
    if (!seq || !(seq instanceof YAMLSeq)) {
      seq = new YAMLSeq();
      map.set(key, seq);
    }
    updateArray(seq, oldVal, newVal, key);
  } else if (
    typeof oldVal === "object" &&
    typeof newVal === "object" &&
    oldVal !== null &&
    newVal !== null &&
    !Array.isArray(oldVal) &&
    !Array.isArray(newVal)
  ) {
    let childMap = map.get(key) as YAMLMap | undefined;
    if (!childMap || !(childMap instanceof YAMLMap)) {
      childMap = new YAMLMap();
      map.set(key, childMap);
    }
    updateObject(
      childMap,
      oldVal as Record<string, unknown>,
      newVal as Record<string, unknown>,
    );
  } else {
    map.set(key, createNode(newVal));
  }
}

// 创建 YAML 节点
function createNode(value: unknown): YAMLMap | YAMLSeq | Scalar {
  if (value === null || value === undefined) {
    return new Scalar(null);
  }

  if (Array.isArray(value)) {
    const seq = new YAMLSeq();
    for (const item of value) {
      seq.add(createNode(item));
    }
    return seq;
  }

  if (typeof value === "object") {
    const map = new YAMLMap();
    for (const [k, v] of Object.entries(value)) {
      map.set(k, createNode(v));
    }
    return map;
  }

  return new Scalar(value);
}
