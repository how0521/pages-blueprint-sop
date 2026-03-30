import { useState, useEffect, useRef } from 'react';
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
  Cloud,
  Loader2,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import VersionRuleForm from './VersionRuleForm';
import { compareVersions } from '../utils/versionUtils';

function Badge({ children, variant = 'default' }) {
  const styles = {
    default: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
    blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function GlobalSettings({ settings, onUpdateSettings, onSyncToGist, onLoadFromGist, onCreateGist }) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [gistStatus, setGistStatus] = useState(null);

  useEffect(() => {
    setForm(prev => ({ ...prev, gistId: settings.gistId }));
  }, [settings.gistId]);

  const handleSave = () => {
    onUpdateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGistAction = async (fn) => {
    setGistStatus({ type: 'loading', msg: '' });
    const result = await fn(form);
    if (result.ok) {
      setGistStatus({
        type: 'ok',
        msg: result.gistId ? `已建立！Gist ID 已自動填入，請記得儲存設定。` : '同步成功！',
      });
    } else {
      setGistStatus({ type: 'error', msg: result.error || '發生未知錯誤' });
    }
    setTimeout(() => setGistStatus(null), 6000);
  };

  const inputClass =
    'w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400 dark:placeholder-slate-500 transition-colors';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-6">
      {/* 全域設定 */}
      <div className="flex items-center gap-2">
        <Settings2 size={16} className="text-gray-500 dark:text-slate-400" />
        <h3 className="text-gray-900 dark:text-slate-100 font-semibold">全域設定</h3>
      </div>

      {/* 跨裝置同步 */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Cloud size={16} className="text-gray-500 dark:text-slate-400" />
          <h3 className="text-gray-900 dark:text-slate-100 font-semibold">跨裝置同步</h3>
          <span className="text-xs text-gray-400 dark:text-slate-500">（GitHub Gist）</span>
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-slate-500 bg-gray-50 dark:bg-slate-700/40 rounded-lg p-3">
          <Info size={13} className="flex-shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
          <span>
            使用 GitHub Gist 儲存設定，其他裝置開啟頁面時會自動載入最新資料。
            需要 GitHub Personal Access Token（勾選 <code className="text-gray-700 dark:text-slate-300">gist</code> 權限）。
            Token 僅存於本機，不會上傳至 Gist。
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              GitHub Token
            </label>
            <input
              type="password"
              value={form.githubToken || ''}
              onChange={e => setForm({ ...form, githubToken: e.target.value })}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Gist ID
            </label>
            <input
              type="text"
              value={form.gistId || ''}
              onChange={e => setForm({ ...form, gistId: e.target.value })}
              placeholder="首次請點「建立新 Gist」，或貼上現有 Gist ID"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!form.gistId && (
            <button
              onClick={() => handleGistAction(onCreateGist)}
              disabled={!form.githubToken || gistStatus?.type === 'loading'}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              建立新 Gist
            </button>
          )}
          <button
            onClick={() => handleGistAction(onLoadFromGist)}
            disabled={!form.gistId || gistStatus?.type === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} />
            從 Gist 載入
          </button>
          <button
            onClick={() => handleGistAction(onSyncToGist)}
            disabled={!form.gistId || !form.githubToken || gistStatus?.type === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {gistStatus?.type === 'loading' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            發布到 Gist
          </button>
        </div>

        {gistStatus && (
          <div
            className={`flex items-start gap-2 text-sm rounded-lg p-3 ${
              gistStatus.type === 'loading'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : gistStatus.type === 'ok'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {gistStatus.type === 'loading' && <Loader2 size={14} className="animate-spin flex-shrink-0 mt-0.5" />}
            {gistStatus.type === 'ok' && <Check size={14} className="flex-shrink-0 mt-0.5" />}
            {gistStatus.type === 'error' && <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />}
            <span>{gistStatus.type === 'loading' ? '處理中…' : gistStatus.msg}</span>
          </div>
        )}
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

function PublishConfirmModal({ onConfirm, onCancel, isLoading, status }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isLoading ? onCancel : undefined} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Send size={18} className="text-blue-500" />
            </div>
            <h3 className="text-gray-900 dark:text-slate-100 font-semibold">確認發佈</h3>
          </div>
          {!isLoading && (
            <button
              onClick={onCancel}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {!status ? (
          <>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              確定要將目前所有設定發佈到 Gist 嗎？其他裝置將在重新整理後看到最新內容。
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {isLoading ? '發佈中…' : '確定發佈'}
              </button>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 ${
                status.type === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {status.type === 'ok' ? <Check size={14} /> : <AlertTriangle size={14} />}
              <span>{status.type === 'ok' ? '發佈成功！' : status.msg}</span>
            </div>
            <button
              onClick={onCancel}
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
            >
              關閉
            </button>
          </>
        )}
      </div>
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
  onSyncToGist,
  onLoadFromGist,
  onCreateGist,
}) {
  const [activeTab, setActiveTab] = useState('rules');
  const [formMode, setFormMode] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handlePublish = async () => {
    setPublishLoading(true);
    const result = await onSyncToGist(settings);
    setPublishLoading(false);
    if (result.ok) {
      setPublishStatus({ type: 'ok' });
    } else {
      setPublishStatus({ type: 'error', msg: result.error || '發生未知錯誤' });
    }
  };

  const handleClosePublishModal = () => {
    setShowPublishModal(false);
    setPublishStatus(null);
  };

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

  const sortedRules = [...rules].sort((a, b) => {
    const cmp = compareVersions(a.fromVersion, b.fromVersion);
    return cmp !== 0 ? cmp : compareVersions(a.toVersion, b.toVersion);
  });

  const migrationCount = rules.filter(r => r.requiresMigration).length;

  return (
    <div className="space-y-6">
      {showPublishModal && (
        <PublishConfirmModal
          onConfirm={handlePublish}
          onCancel={handleClosePublishModal}
          isLoading={publishLoading}
          status={publishStatus}
        />
      )}

      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900 dark:text-slate-100 font-bold text-xl">管理員維護模式</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            管理升版規則與全域工具設定
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-slate-600"
          >
            <Download size={14} />
            匯出 JSON
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-slate-600"
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
          <button
            onClick={() => { setPublishStatus(null); setShowPublishModal(true); }}
            disabled={!settings?.gistId || !settings?.githubToken}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
            title={!settings?.gistId || !settings?.githubToken ? '請先在「全域設定」設定 GitHub Token 與 Gist ID' : ''}
          >
            <Send size={14} />
            發佈
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{rules.length}</div>
          <div className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">升版規則</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
          <div className="text-2xl font-bold text-amber-500 dark:text-amber-400">{migrationCount}</div>
          <div className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">需 Migrate</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
          <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">
            {rules.reduce((a, r) => a + (r.manualSteps?.length ?? 0), 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">手動步驟總計</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 gap-1">
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
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== null && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">
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

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                {sortedRules.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-gray-400 dark:text-slate-600">
                    <Database size={32} className="mb-3 opacity-50" />
                    <p className="font-medium text-gray-500 dark:text-slate-500">尚無任何規則</p>
                    <p className="text-sm mt-1">點擊上方「新增規則」開始設定</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-700">
                          <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wide whitespace-nowrap">
                            版本路徑
                          </th>
                          <th className="text-center px-4 py-3 text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wide whitespace-nowrap">
                            需 Migrate
                          </th>
                          <th className="text-center px-4 py-3 text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wide whitespace-nowrap">
                            手動步驟
                          </th>
                          <th className="text-right px-5 py-3 text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wide whitespace-nowrap">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRules.map((rule, index) => (
                          <tr
                            key={rule.id}
                            className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${
                              index < sortedRules.length - 1
                                ? 'border-b border-gray-100 dark:border-slate-700/50'
                                : ''
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-gray-800 dark:text-slate-200 font-semibold">
                                  v{rule.fromVersion}
                                </span>
                                <ChevronRight
                                  size={13}
                                  className="text-gray-400 dark:text-slate-600"
                                />
                                <span className="font-mono text-sm text-gray-800 dark:text-slate-200 font-semibold">
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
                                <span className="text-gray-300 dark:text-slate-700 text-sm select-none">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="text-gray-500 dark:text-slate-400 text-sm font-mono">
                                {rule.manualSteps?.length ?? 0}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleEdit(rule)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                >
                                  <Pencil size={12} />
                                  編輯
                                </button>
                                <button
                                  onClick={() => handleDelete(rule.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-300 bg-gray-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
          onSyncToGist={onSyncToGist}
          onLoadFromGist={onLoadFromGist}
          onCreateGist={onCreateGist}
        />
      )}
    </div>
  );
}
