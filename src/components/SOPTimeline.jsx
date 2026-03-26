import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';

function ProgressBar({ value, max }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-slate-400 w-12 text-right font-mono">
        {value}/{max}
      </span>
    </div>
  );
}


function StepCard({ step, index, isLast, checkedItems, onCheck }) {
  const key = `${step.fromVersion}-${step.toVersion}`;
  const items = step.rule?.manualSteps ?? [];
  const hasMigration = step.rule?.requiresMigration;
  const doneCount = items.filter(it => checkedItems[`${key}-${it.id}`]).length;
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <div className="flex gap-4">
      {/* Left rail */}
      <div className="flex flex-col items-center flex-shrink-0 w-10">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold z-10 ring-2 transition-all duration-300 ${
            allDone
              ? 'bg-emerald-600 ring-emerald-600/30 text-white'
              : hasMigration
              ? 'bg-amber-600 ring-amber-600/30 text-white'
              : 'bg-blue-600 ring-blue-600/30 text-white'
          }`}
        >
          {allDone ? <CheckCircle2 size={17} /> : index + 1}
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-2 bg-gradient-to-b from-gray-300 to-gray-200/30 dark:from-slate-600 dark:to-slate-700/30 min-h-[24px]" />
        )}
      </div>

      {/* Right: card */}
      <div className="flex-1 min-w-0 pb-5">
        <div
          className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
            allDone
              ? 'border-emerald-300 dark:border-emerald-700/40 bg-emerald-50/50 dark:bg-slate-800/60'
              : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
          }`}
        >
          {/* Card header */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-gray-800 dark:text-slate-200 font-semibold text-sm">v{step.fromVersion}</span>
                <ChevronRight size={14} className="text-gray-400 dark:text-slate-500" />
                <span className="text-gray-800 dark:text-slate-200 font-semibold text-sm">v{step.toVersion}</span>
              </div>
              {/* 只顯示「需 Migrate」標籤，不再顯示各步驟的 migrate 連結 */}
              {allDone && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex-shrink-0">
                  <CheckCircle2 size={10} />
                  完成
                </span>
              )}
            </div>
            {items.length > 0 && (
              <span className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0 ml-2">
                {doneCount}/{items.length}
              </span>
            )}
          </div>

          {/* Manual steps */}
          {step.rule && items.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList size={13} className="text-gray-400 dark:text-slate-500" />
                <span className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase tracking-widest">
                  手動調整項目
                </span>
              </div>
              <div className="space-y-2.5">
                {items.map(item => {
                  const itemKey = `${key}-${item.id}`;
                  const isChecked = !!checkedItems[itemKey];
                  return (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 cursor-pointer group select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => onCheck(itemKey, e.target.checked)}
                        className="mt-0.5 w-4 h-4 flex-shrink-0 accent-blue-500 cursor-pointer"
                      />
                      <span
                        className={`text-sm leading-relaxed transition-colors ${
                          isChecked
                            ? 'line-through text-gray-300 dark:text-slate-600'
                            : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100'
                        }`}
                      >
                        {item.description}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* No rule defined */}
          {!step.rule && (
            <div className="px-5 py-4">
              <p className="text-sm text-gray-400 dark:text-slate-600 italic">
                此版本區間尚未定義升版規則，請聯繫管理員補充。
              </p>
            </div>
          )}

          {/* Rule exists but no manual steps */}
          {step.rule && items.length === 0 && (
            <div className="px-5 py-4">
              <p className="text-sm text-gray-400 dark:text-slate-500">此升版區間無需手動調整。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SOPTimeline({ steps, fromVersion, toVersion }) {
  const [checkedItems, setCheckedItems] = useState({});

  const handleCheck = (key, checked) => {
    setCheckedItems(prev => ({ ...prev, [key]: checked }));
  };

  const hasMigration = steps.some(s => s.rule?.requiresMigration);
  const totalItems = steps.reduce(
    (acc, s) => acc + (s.rule?.manualSteps?.length ?? 0),
    0
  ) + (hasMigration ? 1 : 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const allDone = totalItems > 0 && checkedCount === totalItems;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div
        className={`rounded-2xl border p-5 transition-colors ${
          allDone
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40'
            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-500 dark:text-slate-400 text-sm">升版路徑</span>
              <span className="font-mono font-semibold text-gray-900 dark:text-slate-100">
                v{fromVersion}
              </span>
              <ChevronRight size={14} className="text-gray-400 dark:text-slate-500" />
              <span className="font-mono font-semibold text-gray-900 dark:text-slate-100">
                v{toVersion}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className="text-xs text-gray-500 dark:text-slate-500">
                共 {steps.length} 個升版區間
              </span>
              {hasMigration && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={11} />
                  包含需執行 Migrate 的步驟
                </span>
              )}
              {allDone && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 size={11} />
                  全部完成！
                </span>
              )}
            </div>
          </div>
          {totalItems > 0 && (
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-500 dark:text-slate-500 mb-1">手動項目進度</div>
              <div className="text-xl font-bold font-mono text-gray-900 dark:text-slate-100">
                {Math.round((checkedCount / totalItems) * 100)}
                <span className="text-sm font-normal text-gray-500 dark:text-slate-500">%</span>
              </div>
            </div>
          )}
        </div>
        {totalItems > 0 && (
          <ProgressBar value={checkedCount} max={totalItems} />
        )}

        {/* 全域唯一的 Migrate checkbox */}
        {hasMigration && (
          <label className="flex items-start gap-3 cursor-pointer group select-none mt-4">
            <input
              type="checkbox"
              checked={!!checkedItems['migrate']}
              onChange={e => handleCheck('migrate', e.target.checked)}
              className="mt-0.5 w-4 h-4 flex-shrink-0 accent-amber-500 cursor-pointer"
            />
            <span
              className={`text-sm leading-relaxed transition-colors ${
                checkedItems['migrate']
                  ? 'line-through text-gray-300 dark:text-slate-600'
                  : 'text-amber-700 dark:text-amber-400 group-hover:text-amber-900 dark:group-hover:text-amber-300'
              }`}
            >
              透過 <strong>Migrate 工具</strong> 對 Blueprint 進行升版（v{fromVersion} → v{toVersion}）
            </span>
          </label>
        )}
      </div>

      {/* Timeline steps — 只顯示有手動調整項目的步驟 */}
      {(() => {
        const visibleSteps = steps.filter(s => (s.rule?.manualSteps?.length ?? 0) > 0);
        return visibleSteps.length > 0 ? (
          <div>
            {visibleSteps.map((step, index) => (
              <StepCard
                key={`${step.fromVersion}-${step.toVersion}`}
                step={step}
                index={index}
                isLast={index === visibleSteps.length - 1}
                checkedItems={checkedItems}
                onCheck={handleCheck}
              />
            ))}
          </div>
        ) : null;
      })()}
    </div>
  );
}
