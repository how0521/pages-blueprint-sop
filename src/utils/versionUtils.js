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
 * 根據來源/目標版本，從規則庫中建立完整的 SOP 步驟路徑
 * 返回每個版本跳轉的步驟，含對應規則（若無規則則為 null）
 */
export function buildSOPSteps(rules, fromVersion, toVersion) {
  if (!fromVersion || !toVersion) return [];
  if (compareVersions(fromVersion, toVersion) >= 0) return [];

  const allVersions = getUniqueVersions(rules);

  // 篩選出在 [fromVersion, toVersion] 範圍內的版本
  const versionsInRange = allVersions.filter(
    v =>
      compareVersions(v, fromVersion) >= 0 &&
      compareVersions(v, toVersion) <= 0
  );

  if (versionsInRange.length < 2) return [];

  const steps = [];
  for (let i = 0; i < versionsInRange.length - 1; i++) {
    const from = versionsInRange[i];
    const to = versionsInRange[i + 1];
    const rule =
      rules.find(r => r.fromVersion === from && r.toVersion === to) || null;
    steps.push({ fromVersion: from, toVersion: to, rule });
  }
  return steps;
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
