#!/usr/bin/env node
/**
 * publish.cjs
 *
 * 自動 commit + push 遷移相關變更。
 * 執行方式：npm run publish-changes
 */

const { execSync } = require('child_process');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

// 取得所有已修改或未追蹤的檔案
const staged   = run('git diff --cached --name-only');
const unstaged = run('git diff --name-only');
const untracked = run('git ls-files --others --exclude-standard');
const allChanged = [staged, unstaged, untracked].filter(Boolean).join('\n');

if (!allChanged) {
  console.log('✅ 沒有任何變更，無需 commit。');
  process.exit(0);
}

const lines = allChanged.split('\n').filter(Boolean);

// 偵測涉及哪些遷移版本
const versionSet = new Set();
for (const f of lines) {
  // core/migrate/v330_v331/... → v3.30 → v3.31
  const m = f.match(/core\/migrate\/v(\d+)_v(\d+)\//);
  if (m) {
    const from = m[1][0] + '.' + m[1].slice(1);
    const to   = m[2][0] + '.' + m[2].slice(1);
    versionSet.add(`v${from} → v${to}`);
  }
  // src/migrations/configs/v3_31.json → v3.31
  const m2 = f.match(/configs\/v(\d+)_(\d+)\.json/);
  if (m2) {
    const ver = m2[1] + '.' + m2[2];
    versionSet.add(`v${ver}`);
  }
}

// 產生 commit message
let msg;
if (versionSet.size > 0) {
  msg = `feat: 更新遷移設定 ${[...versionSet].join(', ')}`;
} else {
  msg = `chore: 更新專案設定`;
}

console.log('📋 即將 commit 以下檔案：');
lines.forEach(f => console.log(`   ${f}`));
console.log(`\n💬 Commit message：${msg}\n`);

try {
  run('git add -A');
  run(`git commit -m "${msg}\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`);
  run('git push');
  console.log('🚀 已推上 GitHub，CI 將自動部署。');
} catch (e) {
  console.error('❌ 發生錯誤：', e.message);
  process.exit(1);
}
