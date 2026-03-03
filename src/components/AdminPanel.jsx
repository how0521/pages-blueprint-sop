import { useState, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Settings2,
  ListChecks,
  ChevronRight,
  AlertTriangle,
  Check,
  Database,
  Info,
} from 'lucide-react';
import VersionRuleForm from './VersionRuleForm';
import { compareVersions } from '../utils/versionUtils';

function Badge({ children, variant = 'default' }) {
  const styles = {
    default: 'bg-slate-700 text-slate-400 border-slate-600',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function GlobalSettings({ settings, onUpdateSettings }) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 size={16} className="text-slate-400" />
        <h3 className="text-slate-100 font-semibold">全域設定</h3>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
          Migrate 工具網址
        </label>
        <input
          type="url"
          value={form.migrationToolUrl}
          onChange={e => setForm({ ...form, migrationToolUrl: e.target.value })}
          placeholder="http://192.168.105.175:4999/migrate"
          className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-slate-500 transition-colors"
        />
        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-700/40 rounded-lg p-3">
          <Info size={13} className="flex-shrink-0 mt-0.5 text-blue-400" />
          <span>
            當版本升版規則標記為「需 Migrate」時，SOP 中將顯示此連結。
            此連結套用至所有有 Migrate 需求的版本步驟。
          </span>
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          saved
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30'
        }`}
      >
        {saved && <Check size={15} />}
        {saved ? '已儲存！' : '儲存設定'}
      </button>
    </div>
  );
}

export default function AdminPanel({
  rules,
  settings,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onUpdateSettings,
  onExport,
  onImport,
}) {
  const [activeTab, setActiveTab] = useState('rules');
  const [formMode, setFormMode] = useState(null); // null | 'add' | 'edit'
  const [editingRule, setEditingRule] = useState(null);
  const fileInputRef = useRef(null);

  const handleEdit = rule => {
    setEditingRule(rule);
    setFormMode('edit');
  };

  const handleDelete = id => {
    if (window.confirm('確定要刪除此升版規則嗎？此操作無法復原。')) {
      onDeleteRule(id);
    }
  };

  const handleSaveRule = ruleData => {
    if (formMode === 'add') {
      onAddRule(ruleData);
    } else {
      onUpdateRule(editingRule.id, ruleData);
    }
    setFormMode(null);
    setEditingRule(null);
  };

  const handleCancelForm = () => {
    setFormMode(null);
    setEditingRule(null);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  // Sort rules by fromVersion, then toVersion
  const sortedRules = [...rules].sort((a, b) => {
    const cmp = compareVersions(a.fromVersion, b.fromVersion);
    return cmp !== 0 ? cmp : compareVersions(a.toVersion, b.toVersion);
  });

  const migrationCount = rules.filter(r => r.requiresMigration).length;

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">管理員維護模式</h2>
          <p className="text-slate-400 text-sm mt-1">
            管理升版規則與全域工具設定
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-slate-600"
          >
            <Download size={14} />
            匯出 JSON
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-slate-600"
          >
            <Upload size={14} />
            匯入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
          <div className="text-2xl font-bold text-slate-100">{rules.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">升版規則</div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{migrationCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">需 Migrate</div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {rules.reduce((a, r) => a + (r.manualSteps?.length ?? 0), 0)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">手動步驟總計</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 gap-1">
        {[
          {
            id: 'rules',
            icon: <ListChecks size={15} />,
            label: '版本規則管理',
            count: rules.length,
          },
          {
            id: 'settings',
            icon: <Settings2 size={15} />,
            label: '全域設定',
            count: null,
          },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== 'rules') {
                setFormMode(null);
                setEditingRule(null);
              }
            }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== null && (
              <span className="px-1.5 py-0.5 text-xs bg-slate-700 text-slate-400 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Rules tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {formMode ? (
            <VersionRuleForm
              initialData={formMode === 'edit' ? editingRule : null}
              mode={formMode}
              onSave={handleSaveRule}
              onCancel={handleCancelForm}
            />
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={() => setFormMode('add')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30"
                >
                  <Plus size={15} />
                  新增規則
                </button>
              </div>

              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                {sortedRules.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-slate-600">
                    <Database size={32} className="mb-3 opacity-50" />
                    <p className="font-medium text-slate-500">尚無任何規則</p>
                    <p className="text-sm mt-1">點擊上方「新增規則」開始設定</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-700">
                          <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium uppercase tracking-wide whitespace-nowrap">
                            版本路徑
                          </th>
                          <th className="text-center px-4 py-3 text-xs text-slate-400 font-medium uppercase tracking-wide whitespace-nowrap">
                            需 Migrate
                          </th>
                          <th className="text-center px-4 py-3 text-xs text-slate-400 font-medium uppercase tracking-wide whitespace-nowrap">
                            手動步驟
                          </th>
                          <th className="text-right px-5 py-3 text-xs text-slate-400 font-medium uppercase tracking-wide whitespace-nowrap">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRules.map((rule, index) => (
                          <tr
                            key={rule.id}
                            className={`hover:bg-slate-700/30 transition-colors ${
                              index < sortedRules.length - 1
                                ? 'border-b border-slate-700/50'
                                : ''
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-slate-200 font-semibold">
                                  v{rule.fromVersion}
                                </span>
                                <ChevronRight
                                  size={13}
                                  className="text-slate-600"
                                />
                                <span className="font-mono text-sm text-slate-200 font-semibold">
                                  v{rule.toVersion}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {rule.requiresMigration ? (
                                <Badge variant="amber">
                                  <AlertTriangle size={10} />
                                  是
                                </Badge>
                              ) : (
                                <span className="text-slate-700 text-sm select-none">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="text-slate-400 text-sm font-mono">
                                {rule.manualSteps?.length ?? 0}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleEdit(rule)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                                >
                                  <Pencil size={12} />
                                  編輯
                                </button>
                                <button
                                  onClick={() => handleDelete(rule.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-red-300 bg-slate-700 hover:bg-red-900/30 rounded-lg transition-colors"
                                >
                                  <Trash2 size={12} />
                                  刪除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <GlobalSettings
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}
    </div>
  );
}
