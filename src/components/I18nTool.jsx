import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  FileArchive,
  Languages,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import JSZip from 'jszip';
import zhHantDict from '../i18n/string-resource_zh-Hant.json';
import zhHansDict from '../i18n/string-resource_zh-Hans.json';
import enDict from '../i18n/string-resource_en.json';

const DICTIONARIES = {
  'zh-Hant': zhHantDict,
  'zh-Hans': zhHansDict,
  'en': enDict,
};

const LANG_LABELS = {
  'zh-Hant': '繁體中文',
  'zh-Hans': '簡體中文',
  'en': 'English',
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
  // edits for existing lang packs: { langCode: { key: value } }
  const [edits, setEdits] = useState({});
  // which new languages to add: { langCode: true/false }
  const [addLangs, setAddLangs] = useState({});
  // edits for newly added lang packs: { langCode: { key: value } }
  const [addLangEdits, setAddLangEdits] = useState({});
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
    setAddLangs({});
    setAddLangEdits({});
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

      const blueprintEntry = Object.values(zip.files).find(
        f => !f.dir && f.name.toLowerCase().endsWith('blueprint.json')
      );
      if (!blueprintEntry) throw new Error('找不到 blueprint.json');
      const blueprint = JSON.parse(await blueprintEntry.async('string'));
      const blueprintKeys = extractI18nKeys(blueprint);

      // Find all existing string-resource_*.json
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

      setResult({ blueprintKeyCount: blueprintKeys.size, blueprintKeys: [...blueprintKeys], langPacks });

      // Init edits for existing packs
      const initialEdits = {};
      for (const [langCode, { missing }] of Object.entries(langPacks)) {
        initialEdits[langCode] = {};
        for (const { key, autoValue } of missing) {
          initialEdits[langCode][key] = autoValue;
        }
      }
      setEdits(initialEdits);

      // Init add-lang selections (only dictionary langs not already in ZIP)
      const availableToAdd = Object.keys(DICTIONARIES).filter(lc => !(lc in langPacks));
      const initialAddLangs = {};
      const initialAddLangEdits = {};
      for (const lc of availableToAdd) {
        initialAddLangs[lc] = false;
        initialAddLangEdits[lc] = { ...DICTIONARIES[lc] };
      }
      setAddLangs(initialAddLangs);
      setAddLangEdits(initialAddLangEdits);

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

    // Add newly selected languages
    for (const [langCode, selected] of Object.entries(addLangs)) {
      if (!selected) continue;
      // Only include keys that are in blueprint
      const filtered = {};
      for (const key of result.blueprintKeys) {
        const val = addLangEdits[langCode]?.[key] ?? '';
        if (val) filtered[key] = val;
      }
      newZip.file(`string-resource_${langCode}.json`, JSON.stringify(filtered, null, 2));
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
  const addLangCount = Object.values(addLangs).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">語言包補全工具</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          上傳 Blueprint ZIP，自動偵測缺少的語言包 key，並可新增額外語言。
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

        <div className="pt-1">
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
            分析失敗，請確認 ZIP 內包含有效的 blueprint.json。
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
                  {Object.keys(result.langPacks).length === 0 && (
                    <span className="text-amber-600 dark:text-amber-400">ZIP 內無語言包</span>
                  )}
                  {totalMissing > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      缺少：<span className="font-semibold">{totalMissing}</span>
                    </span>
                  )}
                  {autoFilled > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      自動補全：<span className="font-semibold">{autoFilled}</span>
                    </span>
                  )}
                  {addLangCount > 0 && (
                    <span className="text-blue-600 dark:text-blue-400">
                      新增語言：<span className="font-semibold">{addLangCount}</span>
                    </span>
                  )}
                  {totalMissing === 0 && Object.keys(result.langPacks).length > 0 && addLangCount === 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} /> 所有語言包完整
                    </span>
                  )}
                </div>
              </div>

              {(totalMissing > 0 || addLangCount > 0 || Object.keys(result.langPacks).length === 0) && (
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

          {/* Existing lang packs */}
          {Object.entries(result.langPacks).map(([langCode, { missing }]) => (
            <ExistingLangCard
              key={langCode}
              langCode={langCode}
              missing={missing}
              edits={edits[langCode] ?? {}}
              onChange={(key, val) => {
                setDownloadUrl('');
                setEdits(prev => ({ ...prev, [langCode]: { ...prev[langCode], [key]: val } }));
              }}
            />
          ))}

          {/* Add languages section */}
          {Object.keys(addLangs).length > 0 && (
            <AddLangsSection
              addLangs={addLangs}
              addLangEdits={addLangEdits}
              blueprintKeys={result.blueprintKeys}
              onToggle={(lc) => {
                setDownloadUrl('');
                setAddLangs(prev => ({ ...prev, [lc]: !prev[lc] }));
              }}
              onEdit={(lc, key, val) => {
                setDownloadUrl('');
                setAddLangEdits(prev => ({ ...prev, [lc]: { ...prev[lc], [key]: val } }));
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function ExistingLangCard({ langCode, missing, edits, onChange }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">{langCode}</span>
        <span className="text-xs text-gray-400 dark:text-slate-500">{LANG_LABELS[langCode] ?? ''}</span>
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
            const val = edits[key] ?? '';
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400 dark:text-slate-500 w-60 shrink-0 truncate" title={key}>{key}</span>
                <input
                  type="text"
                  value={val}
                  onChange={e => onChange(key, e.target.value)}
                  placeholder={autoValue ? undefined : '手動輸入...'}
                  className={`flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                    autoValue ? 'border-emerald-300 dark:border-emerald-700' : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
                <span className={`text-xs shrink-0 w-8 ${autoValue ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}`}>
                  {autoValue ? '自動' : '手填'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddLangsSection({ addLangs, addLangEdits, blueprintKeys, onToggle, onEdit }) {
  const [expanded, setExpanded] = useState({});

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Plus size={15} className="text-blue-500" />
        <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">新增語言</span>
        <span className="text-xs text-gray-400 dark:text-slate-500">勾選後將在下載的 ZIP 中新增對應語言包</span>
      </div>

      <div className="space-y-3">
        {Object.keys(addLangs).map(lc => {
          const isSelected = addLangs[lc];
          const isExpanded = expanded[lc] ?? false;
          const dict = DICTIONARIES[lc] ?? {};
          const autoCount = blueprintKeys.filter(k => dict[k]).length;
          const missingCount = blueprintKeys.length - autoCount;

          return (
            <div key={lc} className={`rounded-xl border transition-colors ${isSelected ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-slate-700'}`}>
              {/* Header row */}
              <div className="flex items-center gap-3 p-3">
                <input
                  type="checkbox"
                  id={`add-${lc}`}
                  checked={isSelected}
                  onChange={() => onToggle(lc)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <label htmlFor={`add-${lc}`} className="flex-1 flex items-center gap-2 cursor-pointer">
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{lc}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{LANG_LABELS[lc] ?? ''}</span>
                  {isSelected && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      自動帶入 {autoCount} 個
                      {missingCount > 0 && <span className="text-amber-600 dark:text-amber-400 ml-1">，{missingCount} 個需手填</span>}
                    </span>
                  )}
                </label>
                {isSelected && (
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [lc]: !prev[lc] }))}
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {isExpanded ? '收合' : '展開編輯'}
                  </button>
                )}
              </div>

              {/* Expanded key list */}
              {isSelected && isExpanded && (
                <div className="border-t border-blue-200 dark:border-blue-800 px-3 pb-3 pt-3 space-y-2 max-h-80 overflow-y-auto">
                  {blueprintKeys.map(key => {
                    const autoValue = dict[key] ?? '';
                    const val = addLangEdits[lc]?.[key] ?? autoValue;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400 dark:text-slate-500 w-60 shrink-0 truncate" title={key}>{key}</span>
                        <input
                          type="text"
                          value={val}
                          onChange={e => onEdit(lc, key, e.target.value)}
                          placeholder="手動輸入..."
                          className={`flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                            autoValue ? 'border-emerald-300 dark:border-emerald-700' : 'border-gray-300 dark:border-slate-600'
                          }`}
                        />
                        <span className={`text-xs shrink-0 w-8 ${autoValue ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}`}>
                          {autoValue ? '自動' : '手填'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
