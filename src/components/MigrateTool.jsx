import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Play,
  Loader2,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
} from 'lucide-react';
import { migrateBlueprint } from '../migrations/engine.js';
import { versionDict } from '../migrations/index.js';

const VERSION_LIST = Object.keys(versionDict).sort(
  (a, b) => versionDict[a] - versionDict[b]
);
const LATEST_VERSION = VERSION_LIST[VERSION_LIST.length - 1];

export default function MigrateTool() {
  const [file, setFile] = useState(null);
  const [targetVersion, setTargetVersion] = useState(LATEST_VERSION);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [log, setLog] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('migrated.zip');
  const blobUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setStatus('idle');
    setLog('');
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setDownloadUrl('');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setStatus('loading');
    setLog('');
    setDownloadUrl('');

    const result = await migrateBlueprint(file, targetVersion);
    setLog(result.log || '');

    if (result.success && result.blob) {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(result.blob);
      const baseName = file.name.replace(/\.zip$/i, '');
      const filename = `${baseName}_migrated.zip`;
      setDownloadFilename(filename);
      setDownloadUrl(blobUrlRef.current);
      setStatus('success');
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Blueprint Migrate 工具</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          上傳 Blueprint ZIP 檔案，選擇目標版本後執行升版。
        </p>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 space-y-5 shadow-sm">

        {/* Target version */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">目標版本</label>
          <select
            value={targetVersion}
            onChange={(e) => setTargetVersion(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VERSION_LIST.map((v) => (
              <option key={v} value={v}>
                v{v}{v === LATEST_VERSION ? ' (最新)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* File upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Blueprint ZIP 檔案</label>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
              <Upload size={15} />
              選擇 .zip 檔案
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
              />
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

        {/* Execute button */}
        <div className="flex items-center gap-3 flex-wrap pt-1">
          <button
            onClick={handleSubmit}
            disabled={!file || status === 'loading'}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20"
          >
            {status === 'loading' ? (
              <><Loader2 size={15} className="animate-spin" />執行中...</>
            ) : (
              <><Play size={15} />執行 Migrate</>
            )}
          </button>

          {status === 'success' && downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadFilename}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Download size={15} />
              下載 {downloadFilename}
            </a>
          )}
        </div>

        {/* Status */}
        {status === 'success' && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            Migrate 完成！
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            執行失敗，請確認 ZIP 內容是否包含有效的 blueprint.json。
          </p>
        )}

        {/* Log */}
        {log && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">執行日誌</p>
            <pre className="text-xs bg-gray-950 dark:bg-black/50 rounded-lg p-4 text-green-400 dark:text-green-300/80 overflow-auto max-h-60 whitespace-pre-wrap break-words font-mono">
              {log}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
