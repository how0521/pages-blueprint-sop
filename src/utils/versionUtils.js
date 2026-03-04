/**
 * 將版本字串解析為數字陣列 [major, minor, ...]
 * 例："3.10" → [3, 10]，確保不使用字串排序
 */
export function parseVersion(versionStr) {
  return String(versionStr)
    .split('.')
    .map(v => parseInt(v, 10));
}

/**
 * 語意化版本比較（回傳負數/0/正數）
 * 正確處理 3.9 < 3.10 的情況
 */
export function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  const len = Math.max(va.length, vb.length);
  for (let i = 0; i < len; i++) {
    const diff = (va[i] ?? 0) - (vb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * 對版本陣列進行語意化排序（升序）
 */
export function sortVersions(versions) {
  return [...versions].sort(compareVersions);
}

/**
 * 從所有規則中取出不重複的版本號，並排序
 */
export function getUniqueVersions(rules) {
  const set = new Set();
  rules.forEach(rule => {
    set.add(rule.fromVersion);
    set.add(rule.toVersion);
  });
  return sortVersions([...set]);
}

/**
 * 取得所有規則的「起始版本」（可作為升版起點的版本）
 * 只包含至少有一條規則從該版本出發的版本
 */
export function getFromVersions(rules) {
  const set = new Set(rules.map(r => r.fromVersion));
  return sortVersions([...set]);
}

/**
 * 取得所有規則的「目標版本」中，大於 afterVersion 的部分
 * 只包含至少有一條規則以該版本為終點的版本
 */
export function getToVersions(rules, afterVersion) {
  const set = new Set(rules.map(r => r.toVersion));
  const all = sortVersions([...set]);
  if (!afterVersion) return all;
  return all.filter(v => compareVersions(v, afterVersion) > 0);
}

/**
 * 根據來源/目標版本，以 BFS 在規則圖中尋找最少跳轉次數的路徑。
 * 直接使用規則邊（edge）建圖，不再依賴中間版本節點，
 * 因此若存在從 3.15 直達 3.20 的規則，就只會產生一個步驟。
 */
export function buildSOPSteps(rules, fromVersion, toVersion) {
  if (!fromVersion || !toVersion) return [];
  if (compareVersions(fromVersion, toVersion) >= 0) return [];

  // 建立有向圖：fromVersion → 該版本出發的所有規則
  const graph = {};
  rules.forEach(rule => {
    if (!graph[rule.fromVersion]) graph[rule.fromVersion] = [];
    graph[rule.fromVersion].push(rule);
  });

  // BFS：找出跳轉次數最少的路徑
  const queue = [[fromVersion, []]]; // [目前版本, 已走路徑]
  const visited = new Set([fromVersion]);

  while (queue.length > 0) {
    const [current, path] = queue.shift();
    const outgoing = (graph[current] || []).filter(
      r => compareVersions(r.toVersion, toVersion) <= 0
    );

    for (const rule of outgoing) {
      const step = { fromVersion: rule.fromVersion, toVersion: rule.toVersion, rule };
      if (rule.toVersion === toVersion) {
        return [...path, step];
      }
      if (!visited.has(rule.toVersion)) {
        visited.add(rule.toVersion);
        queue.push([rule.toVersion, [...path, step]]);
      }
    }
  }

  return []; // 找不到路徑
}

/**
 * 產生唯一 ID
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
