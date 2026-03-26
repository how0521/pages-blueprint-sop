/**
 * Migration engine — runs in the browser using JSZip.
 * Replaces the Flask /migrate API call.
 */
import JSZip from 'jszip';
import { autoMigrations, versionDict } from './index.js';

export async function migrateBlueprint(zipFile, targetVersion) {
  const logs = [];
  const log = (msg) => { logs.push(msg); };

  try {
    log(`開始處理 ZIP 檔案: ${zipFile.name}`);

    const zip = await JSZip.loadAsync(zipFile);

    // Find blueprint.json inside the ZIP
    let blueprintEntry = null;
    let blueprintPath = null;
    zip.forEach((relativePath, entry) => {
      if (!entry.dir && relativePath.toLowerCase().endsWith('blueprint.json')) {
        blueprintEntry = entry;
        blueprintPath = relativePath;
      }
    });

    if (!blueprintEntry) {
      throw new Error('在 ZIP 檔案中找不到 blueprint.json');
    }
    log(`找到 blueprint.json: ${blueprintPath}`);

    // Parse blueprint.json
    const content = await blueprintEntry.async('string');
    let blueprint;
    try {
      blueprint = JSON.parse(content);
    } catch {
      throw new Error('blueprint.json 格式無效，無法解析 JSON');
    }
    log('成功讀取並解析 JSON 檔案。');

    // Detect current version
    const rawVersion = blueprint.version || '1.0.0';
    log(`偵測到目前版本: ${rawVersion}`);

    const versionMatch = rawVersion.match(/^(\d+\.\d+)/);
    const versionName = versionMatch
      ? versionMatch[1]
      : rawVersion.split('.').slice(0, 2).join('.');

    const fromNum = versionDict[versionName];
    const toNum = versionDict[targetVersion];

    if (fromNum === undefined) {
      throw new Error(`不支援的來源版本: ${versionName}。目前只支援 v2.7 以上的 Blueprint。`);
    }
    if (toNum === undefined) {
      throw new Error(`不支援的目標版本: ${targetVersion}`);
    }
    if (fromNum > toNum) {
      throw new Error(`目標版本不能低於目前版本（${versionName} > ${targetVersion}）`);
    }

    log(`對應版本號: ${fromNum}`);
    log(`目標版本號: ${toNum}`);
    log(`準備從 ${versionName} 遷移至 ${targetVersion}...`);

    // Run migration chain (same loop as Python: range(fromNum-1, toNum+1))
    let data = blueprint;
    for (let i = fromNum - 1; i <= toNum; i++) {
      if (i >= 0 && i < autoMigrations.length) {
        data = autoMigrations[i](data);
      }
    }

    // Update version string
    data.version = `${targetVersion}.0`;
    log(`版本號已更新為 ${targetVersion}.0`);

    // Repackage ZIP (flatten: strip folder prefix, files at root)
    const newZip = new JSZip();
    const fileEntries = [];
    zip.forEach((relativePath, entry) => {
      fileEntries.push({ relativePath, entry });
    });

    for (const { relativePath, entry } of fileEntries) {
      if (entry.dir) continue;
      const filename = relativePath.split('/').pop();
      if (relativePath === blueprintPath) {
        newZip.file(filename, JSON.stringify(data, null, 4));
      } else {
        const fileData = await entry.async('arraybuffer');
        newZip.file(filename, fileData);
      }
    }

    const outputBlob = await newZip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    log('遷移成功！');
    return { success: true, blob: outputBlob, log: logs.join('\n') };

  } catch (e) {
    log(`錯誤: ${e.message}`);
    return { success: false, log: logs.join('\n'), error: e.message };
  }
}
