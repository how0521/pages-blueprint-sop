#!/usr/bin/env node
/**
 * sync-migrations.cjs
 *
 * 從 core/migrate/ 同步新版本的 migrate 資訊到 src/migrations/
 *
 * 執行方式：npm run sync-migrations
 *
 * 支援三種類型：
 *   passthrough  — migration.py 無 config 且無自訂邏輯
 *   config-only  — 只需 addToBlueprint(config)，自動完成
 *   custom       — 有自訂邏輯，插入 TODO 並輸出提示
 */

const fs = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const CORE_MIGRATE = path.join(ROOT, 'core', 'migrate');
const CONFIGS_DIR  = path.join(ROOT, 'src', 'migrations', 'configs');
const INDEX_JS     = path.join(ROOT, 'src', 'migrations', 'index.js');

// ─── 版本字串工具 ─────────────────────────────────────────────────────────────

// 'v329' → '3.29', 'v310' → '3.10', 'v27' → '2.7', 'v30' → '3.0'
function parseVersion(vStr) {
  const digits = vStr.slice(1);
  return digits[0] + '.' + digits.slice(1);
}

// 'v328_v329' → { from: '3.28', to: '3.29' }
function parseFolderName(name) {
  const parts = name.split('_');
  if (parts.length !== 2) return null;
  const from = parseVersion(parts[0]);
  const to   = parseVersion(parts[1]);
  if (!from || !to) return null;
  return { from, to };
}

// '3.29' → 3029  (用於數值排序)
function versionToNum(ver) {
  const [major, minor] = ver.split('.').map(Number);
  return major * 1000 + minor;
}

// '3.29' → 'V3_29'
function versionToId(ver) {
  return 'V' + ver.replace('.', '_');
}

function configImportName(ver) { return 'config' + versionToId(ver); }
function funcName(ver)         { return 'migrateTo' + versionToId(ver); }
function configFileName(ver)   { return 'v' + ver.replace('.', '_') + '.json'; }

// ─── 類型偵測 ─────────────────────────────────────────────────────────────────

function detectType(migrationPy, configJson) {
  const hasConfig = configJson && Object.keys(configJson).length > 0;
  // 判斷 find_component_and_update 是否被實際呼叫（非註解）
  const hasCustomCall = /^\s*result\["pages"\]\s*=\s*self\.find_component_and_update/m.test(migrationPy);
  if (hasCustomCall) return 'custom';
  if (hasConfig)     return 'config-only';
  return 'passthrough';
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

function main() {
  console.log('🔍 掃描 core/migrate/ 尋找新版本...\n');

  let indexContent = fs.readFileSync(INDEX_JS, 'utf-8');

  // 從 index.js 讀出現有 versionDict
  const vdMatch = indexContent.match(/export const versionDict\s*=\s*\{([\s\S]*?)\};/);
  if (!vdMatch) {
    console.error('❌ 無法在 index.js 中找到 versionDict');
    process.exit(1);
  }

  const existingVersions = new Map();
  for (const m of vdMatch[1].matchAll(/'([\d.]+)':\s*(\d+)/g)) {
    existingVersions.set(m[1], parseInt(m[2], 10));
  }
  const maxIndex = Math.max(...existingVersions.values());

  // 掃描所有資料夾
  const folders = fs.readdirSync(CORE_MIGRATE)
    .filter(f => fs.statSync(path.join(CORE_MIGRATE, f)).isDirectory());

  const allFolders = folders
    .map(folder => {
      const parsed = parseFolderName(folder);
      if (!parsed) return null;

      const folderPath = path.join(CORE_MIGRATE, folder);
      const configPath = path.join(folderPath, 'config.json');
      const pyPath     = path.join(folderPath, 'migration.py');

      let configJson = {};
      if (fs.existsSync(configPath)) {
        try { configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch {}
      }

      const pyContent = fs.existsSync(pyPath) ? fs.readFileSync(pyPath, 'utf-8') : '';
      const type = detectType(pyContent, configJson);
      const isNew = !existingVersions.has(parsed.to);

      return { ...parsed, folder, type, configJson, isNew };
    })
    .filter(Boolean)
    .sort((a, b) => versionToNum(a.to) - versionToNum(b.to));

  // ─── 同步既有版本的 config.json ───────────────────────────────────────────
  let configSyncCount = 0;
  for (const { to, folder, configJson, isNew } of allFolders) {
    if (isNew) continue;
    const hasConfig = Object.keys(configJson).length > 0;
    if (!hasConfig) continue;
    const src = path.join(CORE_MIGRATE, folder, 'config.json');
    const dst = path.join(CONFIGS_DIR, configFileName(to));
    if (!fs.existsSync(dst)) continue; // 若 configs/ 裡沒有該檔，不自動建立（屬於新版本流程）
    const current = fs.readFileSync(dst, 'utf-8');
    const incoming = fs.readFileSync(src, 'utf-8');
    if (current !== incoming) {
      fs.copyFileSync(src, dst);
      console.log(`🔄 config 已更新：src/migrations/configs/${configFileName(to)}`);
      configSyncCount++;
    }
  }
  if (configSyncCount === 0) console.log('✅ 所有既有版本的 config.json 皆為最新。');
  console.log('');

  // ─── 處理新版本 ───────────────────────────────────────────────────────────
  const toAdd = allFolders.filter(f => f.isNew);

  if (toAdd.length === 0) {
    console.log('✅ 沒有新版本需要同步。');
    return;
  }

  console.log(`📦 找到 ${toAdd.length} 個新版本：\n`);

  let nextIndex = maxIndex;
  const newImports          = [];
  const newFunctions        = [];
  const newVersionDictLines = [];
  const newAutoMigLines     = [];
  const todos               = [];

  for (const { from, to, folder, type, configJson } of toAdd) {
    nextIndex++;
    const fn      = funcName(to);
    const cfgName = configImportName(to);
    const cfgFile = configFileName(to);
    const hasConfig = Object.keys(configJson).length > 0;

    const typeLabel = type === 'passthrough' ? '⏭  pass-through'
                    : type === 'config-only' ? '⚙️  config-only'
                    : '⚠️  custom logic (TODO)';
    console.log(`  v${from} → v${to}  [${typeLabel}]  index ${nextIndex}`);

    // config.json 複製
    if (hasConfig) {
      const src = path.join(CORE_MIGRATE, folder, 'config.json');
      const dst = path.join(CONFIGS_DIR, cfgFile);
      fs.copyFileSync(src, dst);
      console.log(`     ✓ Copied → src/migrations/configs/${cfgFile}`);
      newImports.push(`import ${cfgName} from './configs/${cfgFile}';`);
    }

    // 產生函式
    const bar = '─'.repeat(Math.max(2, 66 - from.length - to.length));
    if (type === 'passthrough') {
      newFunctions.push(
        `// ─── v${from} → v${to} (pass-through) ${bar}\nconst ${fn} = passThrough;`
      );
    } else if (type === 'config-only') {
      newFunctions.push(
        `// ─── v${from} → v${to} (config only) ${bar}\nfunction ${fn}(blueprint) {\n  return addToBlueprint(blueprint, ${cfgName});\n}`
      );
    } else {
      // custom — 插入 TODO
      const cfgArg = hasConfig ? cfgName : '{}';
      newFunctions.push(
        `// ─── v${from} → v${to} ${bar}\n` +
        `// TODO: Port custom logic from core/migrate/${folder}/migration.py\n` +
        `function ${fn}(blueprint) {\n` +
        (hasConfig ? `  addToBlueprint(blueprint, ${cfgArg});\n` : '') +
        `  // TODO: add custom findAndUpdate logic here\n` +
        `  return blueprint;\n}`
      );
      todos.push({ from, to, folder });
    }

    newVersionDictLines.push(`  '${to}': ${nextIndex},`);
    newAutoMigLines.push(`  ${fn},  // ${nextIndex} (v${from} → v${to})`);
  }

  // ─── 更新 index.js ───────────────────────────────────────────────────────

  // 1. 新增 config imports（插在最後一個 import configV... 行之後）
  if (newImports.length > 0) {
    indexContent = indexContent.replace(
      /(import config\w+ from '[^']+';)(?=\s*\n(?!import config))/,
      (match) => match + '\n' + newImports.join('\n')
    );
  }

  // 2. 新增函式（插在 versionDict 區塊之前）
  const vdMarker = '// ─── Version dictionary';
  indexContent = indexContent.replace(
    vdMarker,
    newFunctions.join('\n\n') + '\n\n' + vdMarker
  );

  // 3. 更新 versionDict（在 }; 之前插入新行）
  indexContent = indexContent.replace(
    /(export const versionDict\s*=\s*\{)([\s\S]*?)(\n};)/,
    (_, open, body, close) => open + body.trimEnd() + '\n' + newVersionDictLines.join('\n') + close
  );

  // 4. 更新 autoMigrations（在 ]; 之前插入新行）
  indexContent = indexContent.replace(
    /(export const autoMigrations\s*=\s*\[)([\s\S]*?)(\n\];)/,
    (_, open, body, close) => open + body.trimEnd() + '\n' + newAutoMigLines.join('\n') + close
  );

  fs.writeFileSync(INDEX_JS, indexContent, 'utf-8');

  console.log('\n✅ src/migrations/index.js 已更新。');

  if (todos.length > 0) {
    console.log('\n⚠️  以下版本有自訂邏輯，需要手動 port：');
    for (const { from, to, folder } of todos) {
      console.log(`   v${from} → v${to}  →  core/migrate/${folder}/migration.py`);
    }
    console.log('\n   已插入 TODO 佔位函式，請告知我來完成 port。');
  }
}

main();
