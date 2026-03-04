import { BookOpen, ChevronRight, AlertTriangle, ClipboardList, Zap } from 'lucide-react';
import { compareVersions } from '../utils/versionUtils';

export default function ChangelogView({ rules }) {
  const sortedRules = [...rules].sort((a, b) => {
    const cmp = compareVersions(a.fromVersion, b.fromVersion);
    return cmp !== 0 ? cmp : compareVersions(a.toVersion, b.toVersion);
  });

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <BookOpen size={17} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-gray-900 dark:text-slate-100 font-semibold text-base">
              版本升版 Changelog
            </h2>
            <p className="text-gray-500 dark:text-slate-500 text-xs mt-0.5">
              所有已定義的升版規則（唯讀）— 如需修改請切換至管理員模式
            </p>
          </div>
        </div>

        {rules.length > 0 && (
          <div className="flex gap-4 mt-5 pt-4 border-t border-gray-100 dark:border-slate-700">
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-gray-900 dark:text-slate-100">
                {rules.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">升版規則</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-amber-500 dark:text-amber-400">
                {rules.filter(r => r.requiresMigration).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">需 Migrate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-blue-500 dark:text-blue-400">
                {rules.reduce((a, r) => a + (r.manualSteps?.length ?? 0), 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">手動步驟</div>
            </div>
          </div>
        )}
      </div>

      {/* Rules */}
      {sortedRules.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <p className="text-gray-600 dark:text-slate-400 font-medium">尚無任何升版規則</p>
          <p className="text-gray-400 dark:text-slate-600 text-sm mt-1">
            請切換至管理員模式新增規則
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRules.map(rule => (
            <div
              key={rule.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none"
            >
              {/* Rule header */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-gray-800 dark:text-slate-200 font-semibold text-sm">
                      v{rule.fromVersion}
                    </span>
                    <ChevronRight size={14} className="text-gray-400 dark:text-slate-500" />
                    <span className="text-gray-800 dark:text-slate-200 font-semibold text-sm">
                      v{rule.toVersion}
                    </span>
                  </div>

                  {rule.requiresMigration && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                      <AlertTriangle size={10} />
                      需 Migrate
                    </span>
                  )}

                  {!rule.requiresMigration && rule.manualSteps?.length === 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Zap size={10} />
                      無需操作
                    </span>
                  )}
                </div>

                {rule.manualSteps?.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">
                    {rule.manualSteps.length} 個手動步驟
                  </span>
                )}
              </div>

              {/* Manual steps */}
              {rule.manualSteps?.length > 0 ? (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList size={13} className="text-gray-400 dark:text-slate-500" />
                    <span className="text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-slate-500">
                      手動調整項目
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {rule.manualSteps.map((step, i) => (
                      <div key={step.id} className="flex items-start gap-3">
                        <span className="w-5 h-5 flex-shrink-0 rounded-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center text-xs font-mono text-gray-500 dark:text-slate-400 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-gray-700 dark:text-slate-300">
                          {step.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-400 dark:text-slate-600 italic">
                    {rule.requiresMigration
                      ? '僅需執行 Migrate 工具，無額外手動步驟。'
                      : '此升版區間無需手動調整。'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
