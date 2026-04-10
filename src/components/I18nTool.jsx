import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  FileArchive,
  Languages,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import JSZip from 'jszip';
import zhHantDict from '../i18n/string-resource_zh-Hant.json';
import enDict from '../i18n/string-resource_en.json';

const DICTIONARIES = {
  'zh-Hant': zhHantDict,
  'en': enDict,
};

function extractI18nKeys(obj, keys = new Set()) {
  if (typeof obj === 'string') {
    const m = obj.match(/^\{\{(.+)\}\}$/);
    if (m) keys.add(m[1]);
  } else if (Array.isArray(obj)) {
    obj.forEach(item => extractI18nKeys(item, keys));
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach(v => extractI18nKeys(v, keys));
  }
  return keys;
}

export default function I18nTool() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [edits, setEdits] = useState({});
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');
  const blobUrlRef = useRef(null);
  const zipRef = useRef(null);

  useEffect(() => {
    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setStatus('idle');
    setResult(null);
    setEdits({});
    setDownloadUrl('');
    zipRef.current = null;
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus('loading');
    setDownloadUrl('');

    try {
      const zip = await JSZip.loadAsync(file);
      zipRef.current = zip;

      // Find blueprint.json
      const blueprintEntry = Object.values(zip.files).find(
        f => !f.dir && f.name.toLowerCase().endsWith('blueprint.json')
      );
      if (!blueprintEntry) throw new Error('找不到 blueprint.json');
      const blueprint = JSON.parse(await blueprintEntry.async('string'));

      const blueprintKeys = extractI18nKeys(blueprint);

      // Find all string-resource_*.json
      const langPacks = {};
      for (const [, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        const filename = entry.name.split('/').pop();
        const m = filename.match(/^string-resource_(.+)\.json$/i);
        if (!m) continue;
        const langCode = m[1];
        const content = JSON.parse(await entry.async('string'));

        const missing = [];
        for (const key of blueprintKeys) {
          if (!(key in content)) {
            const dict = DICTIONARIES[langCode];
            missing.push({ key, autoValue: dict?.[key] ?? '' });
          }
        }
        langPacks[langCode] = { existing: content, missing, filename };
      }

      if (Object.keys(langPacks).length === 0) {
        throw new Error('ZIP 內找不到任何 string-resource_*.json 語言包');
      }

      setResult({ blueprintKeyCount: blueprintKeys.size, langPacks });

      const initialEdits = {};
      for (const [langCode, { missing }] of Object.entries(langPacks)) {
        initialEdits[langCode] = {};
        for (const { key, autoValue } of missing) {
          initialEdits[langCode][key] = autoValue;
        }
      }
      setEdits(initialEdits);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleGenerate = async () => {
    if (!zipRef.current || !result) return;

    const newZip = new JSZip();
    for (const [, entry] of Object.entries(zipRef.current.files)) {
      if (entry.dir) continue;
      const filename = entry.name.split('/').pop();
      const m = filename.match(/^string-resource_(.+)\.json$/i);

      if (m && result.langPacks[m[1]]) {
        const langCode = m[1];
        const merged = { ...result.langPacks[langCode].existing };
        for (const { key } of result.langPacks[langCode].missing) {
          const val = edits[langCode]?.[key] ?? '';
          if (val) merged[key] = val;
        }
        newZip.file(filename, JSON.stringify(merged, null, 2));
      } else {
        newZip.file(filename, await entry.async('arraybuffer'));
      }
    }

    const blob = await newZip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = URL.createObjectURL(blob);
    const baseName = file.name.replace(/\.zip$/i, '');
    setDownloadFilename(`${baseName}_i18n.zip`);
    setDownloadUrl(blobUrlRef.current);
  };

  const totalMissing = result
    ? Object.values(result.langPacks).reduce((s, lp) => s + lp.missing.length, 0)
    : 0;
  const autoFilled = result
    ? Object.entries(result.langPacks).reduce((s, [lc, lp]) =>
        s + lp.missing.filter(({ key }) => edits[lc]?.[key]).length, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">語言包補全工具</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          上傳 Blueprint ZIP，自動偵測語言包中缺少的 key 並補全。
        </p>
      </div>

      {/* Upload card */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Blueprint ZIP 檔案</label>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
              <Upload size={15} />
              選擇 .zip 檔案
              <input type="file" accept=".zip" className="hidden" onChange={handleFileChange} />
            </label>
            {file ? (
              <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400">
                <FileArchive size={14} className="text-blue-500" />
                <span className="truncate max-w-[260px]">{file.name}</span>
              </span>
            ) : (
              <span className="text-sm text-gray-400 dark:text-slate-500">尚未選擇檔案</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap pt-1">
          <button
            onClick={handleAnalyze}
            disabled={!file || status === 'loading'}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20"
          >
            {status === 'loading'
              ? <><Loader2 size={15} className="animate-spin" />分析中...</>
              : <><Languages size={15} />分析語言包</>}
          </button>
        </div>

        {status === 'error' && (
          <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            分析失敗，請確認 ZIP 內包含 blueprint.json 與 string-resource_*.json 語言包。
          </p>
        )}
      </div>

      {/* Results */}
      {status === 'done' && result && (
        <>
          {/* Summary */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">分析結果</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-gray-500 dark:text-slate-400">
                    Blueprint 多語系 key：<span className="font-semibold text-gray-900 dark:text-slate-100">{result.blueprintKeyCount}</span>
                  </span>
                  {totalMissing > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      缺少：<span className="font-semibold">{totalMissing}</span>
                    </span>
                  ) : null}
                  {autoFilled > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      自動補全：<span className="font-semibold">{autoFilled}</span>
                    </span>
                  )}
                  {totalMissing === 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} /> 所有語言包完整
                    </span>
                  )}
                </div>
              </div>

              {totalMissing > 0 && (
                downloadUrl ? (
                  <a
                    href={downloadUrl}
                    download={downloadFilename}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Download size={15} />
                    下載 {downloadFilename}
                  </a>
                ) : (
                  <button
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Download size={15} />
                    產出並下載
                  </button>
                )
              )}
            </div>
          </div>

          {/* Per-language cards */}
          {Object.entries(result.langPacks).map(([langCode, { missing }]) => (
            <div
              key={langCode}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">{langCode}</span>
                {missing.length === 0 ? (
                  <span className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} /> 完整
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                    {missing.length} 個缺少
                  </span>
                )}
              </div>

              {missing.length > 0 && (
                <div className="space-y-2">
                  {missing.map(({ key, autoValue }) => {
                    const val = edits[langCode]?.[key] ?? '';
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400 dark:text-slate-500 w-60 shrink-0 truncate" title={key}>
                          {key}
                        </span>
                        <input
                          type="text"
                          value={val}
                          onChange={e => {
                            setDownloadUrl('');
                            setEdits(prev => ({
                              ...prev,
                              [langCode]: { ...prev[langCode], [key]: e.target.value },
                            }));
                          }}
                          placeholder={autoValue ? undefined : '手動輸入...'}
                          className={`flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                            autoValue
                              ? 'border-emerald-300 dark:border-emerald-700'
                              : 'border-gray-300 dark:border-slate-600'
                          }`}
                        />
                        {autoValue && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 shrink-0 w-8">自動</span>
                        )}
                        {!autoValue && (
                          <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0 w-8">手填</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
