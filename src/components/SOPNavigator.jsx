import { useState } from 'react';
import { ArrowRight, Compass, RefreshCw, AlertCircle } from 'lucide-react';
import { getUniqueVersions, compareVersions, buildSOPSteps } from '../utils/versionUtils';
import SOPTimeline from './SOPTimeline';

export default function SOPNavigator({ rules, settings }) {
  const [fromVersion, setFromVersion] = useState('');
  const [toVersion, setToVersion] = useState('');
  const [sopSteps, setSopSteps] = useState(null);

  const allVersions = getUniqueVersions(rules);
  const toVersions = fromVersion
    ? allVersions.filter(v => compareVersions(v, fromVersion) > 0)
    : allVersions;

  const handleFromChange = e => {
    setFromVersion(e.target.value);
    setToVersion('');
    setSopSteps(null);
  };

  const handleToChange = e => {
    setToVersion(e.target.value);
    setSopSteps(null);
  };

  const handleGenerate = () => {
    if (!fromVersion || !toVersion) return;
    setSopSteps(buildSOPSteps(rules, fromVersion, toVersion));
  };

  const handleReset = () => {
    setSopSteps(null);
    setFromVersion('');
    setToVersion('');
  };

  const canGenerate = fromVersion && toVersion;

  return (
    <div className="space-y-6">
      {/* Version Selector Card */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Compass size={16} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-slate-100 font-semibold text-base">升版路徑選擇</h2>
            <p className="text-slate-500 text-xs mt-0.5">選擇原始版本與目標版本，系統將自動生成完整 SOP</p>
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-sm">
              尚未設定任何版本規則，請切換至「管理員模式」新增規則。
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              {/* From Version */}
              <div className="flex-1">
                <label className="block text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">
                  原始版本
                </label>
                <select
                  value={fromVersion}
                  onChange={handleFromChange}
                  className="w-full bg-slate-700/80 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer text-sm"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', paddingRight: '40px' }}
                >
                  <option value="">— 選擇版本 —</option>
                  {allVersions.map(v => (
                    <option key={v} value={v}>
                      v{v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Arrow Divider */}
              <div className="flex items-center justify-center sm:pb-1 py-1">
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block w-4 h-px bg-slate-600" />
                  <ArrowRight size={18} className="text-blue-500" />
                  <div className="hidden sm:block w-4 h-px bg-slate-600" />
                </div>
              </div>

              {/* To Version */}
              <div className="flex-1">
                <label className="block text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">
                  目標版本
                </label>
                <select
                  value={toVersion}
                  onChange={handleToChange}
                  disabled={!fromVersion}
                  className="w-full bg-slate-700/80 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', paddingRight: '40px' }}
                >
                  <option value="">— 選擇版本 —</option>
                  {toVersions.map(v => (
                    <option key={v} value={v}>
                      v{v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="flex-1 sm:flex-none sm:px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/30 text-sm"
              >
                生成 SOP
              </button>
              {sopSteps !== null && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors text-sm"
                >
                  <RefreshCw size={14} />
                  重置
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* SOP Output */}
      {sopSteps !== null && (
        <>
          {sopSteps.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={22} className="text-slate-500" />
              </div>
              <p className="text-slate-300 font-medium mb-1">找不到升版路徑</p>
              <p className="text-slate-500 text-sm">
                {fromVersion} → {toVersion} 之間沒有可用的版本節點，請聯繫管理員補充規則。
              </p>
            </div>
          ) : (
            <SOPTimeline
              steps={sopSteps}
              migrationUrl={settings.migrationToolUrl}
              fromVersion={fromVersion}
              toVersion={toVersion}
            />
          )}
        </>
      )}
    </div>
  );
}
