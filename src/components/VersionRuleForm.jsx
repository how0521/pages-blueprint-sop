import { useState } from 'react';
import { Plus, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { generateId, compareVersions } from '../utils/versionUtils';

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
          checked ? 'bg-amber-500 focus:ring-amber-500' : 'bg-slate-600 focus:ring-blue-500'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <div>
        <div className="text-slate-200 text-sm font-medium">{label}</div>
        {description && (
          <div className="text-slate-500 text-xs mt-0.5">{description}</div>
        )}
      </div>
    </div>
  );
}

export default function VersionRuleForm({ initialData, mode, onSave, onCancel }) {
  const [form, setForm] = useState({
    fromVersion: initialData?.fromVersion ?? '',
    toVersion: initialData?.toVersion ?? '',
    requiresMigration: initialData?.requiresMigration ?? false,
    manualSteps: initialData?.manualSteps?.map(s => ({ ...s })) ?? [],
  });
  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const addStep = () => {
    setForm(prev => ({
      ...prev,
      manualSteps: [...prev.manualSteps, { id: generateId(), description: '' }],
    }));
  };

  const removeStep = id => {
    setForm(prev => ({
      ...prev,
      manualSteps: prev.manualSteps.filter(s => s.id !== id),
    }));
  };

  const updateStep = (id, description) => {
    setForm(prev => ({
      ...prev,
      manualSteps: prev.manualSteps.map(s =>
        s.id === id ? { ...s, description } : s
      ),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fromVersion.trim()) {
      errs.fromVersion = '請輸入來源版本號（例：3.9）';
    } else if (!/^\d+(\.\d+)*$/.test(form.fromVersion.trim())) {
      errs.fromVersion = '版本號格式不正確，請使用數字點分格式（例：3.9）';
    }
    if (!form.toVersion.trim()) {
      errs.toVersion = '請輸入目標版本號（例：3.10）';
    } else if (!/^\d+(\.\d+)*$/.test(form.toVersion.trim())) {
      errs.toVersion = '版本號格式不正確，請使用數字點分格式（例：3.10）';
    }
    if (
      form.fromVersion.trim() &&
      form.toVersion.trim() &&
      !errs.fromVersion &&
      !errs.toVersion
    ) {
      if (
        compareVersions(form.fromVersion.trim(), form.toVersion.trim()) >= 0
      ) {
        errs.toVersion = '目標版本必須大於來源版本';
      }
    }
    return errs;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      id: initialData?.id ?? generateId(),
      fromVersion: form.fromVersion.trim(),
      toVersion: form.toVersion.trim(),
      requiresMigration: form.requiresMigration,
      manualSteps: form.manualSteps.filter(s => s.description.trim()),
    });
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-blue-500/30 shadow-xl shadow-blue-900/10">
      {/* Form header */}
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-slate-100 font-semibold">
          {mode === 'add' ? '➕ 新增升版規則' : '✏️ 編輯升版規則'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Version inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              來源版本 *
            </label>
            <input
              type="text"
              value={form.fromVersion}
              onChange={e => setField('fromVersion', e.target.value)}
              placeholder="例：3.9"
              className={`w-full bg-slate-700 border text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-slate-500 transition-colors ${
                errors.fromVersion ? 'border-red-500/70' : 'border-slate-600'
              }`}
            />
            {errors.fromVersion && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle size={11} />
                {errors.fromVersion}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              目標版本 *
            </label>
            <input
              type="text"
              value={form.toVersion}
              onChange={e => setField('toVersion', e.target.value)}
              placeholder="例：3.10"
              className={`w-full bg-slate-700 border text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-slate-500 transition-colors ${
                errors.toVersion ? 'border-red-500/70' : 'border-slate-600'
              }`}
            />
            {errors.toVersion && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle size={11} />
                {errors.toVersion}
              </p>
            )}
          </div>
        </div>

        {/* Migration toggle */}
        <div className="p-4 bg-slate-700/40 rounded-xl border border-slate-700">
          <Toggle
            checked={form.requiresMigration}
            onChange={v => setField('requiresMigration', v)}
            label="需要執行 Migrate 工具"
            description="啟用後，SOP 中此步驟將顯示 Migrate 工具連結"
          />
          {form.requiresMigration && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={12} />
              將在 SOP 此步驟顯示「🔗 前往 Migrate 工具」連結
            </div>
          )}
        </div>

        {/* Manual steps */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              手動調整項目
            </label>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors border border-slate-600"
            >
              <Plus size={13} />
              新增步驟
            </button>
          </div>

          {form.manualSteps.length === 0 ? (
            <div
              onClick={addStep}
              className="flex flex-col items-center justify-center py-8 text-slate-600 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-slate-500 hover:text-slate-500 transition-colors"
            >
              <Plus size={20} className="mb-1" />
              <span className="text-sm">點擊新增手動調整步驟</span>
            </div>
          ) : (
            <div className="space-y-2">
              {form.manualSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2.5">
                  <span className="w-6 h-6 flex-shrink-0 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs text-slate-500 font-mono">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={step.description}
                    onChange={e => updateStep(step.id, e.target.value)}
                    placeholder="輸入手動調整步驟描述..."
                    className="flex-1 bg-slate-700 border border-slate-600 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-700">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30"
          >
            <Save size={15} />
            {mode === 'add' ? '新增規則' : '儲存變更'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors"
          >
            <X size={15} />
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
