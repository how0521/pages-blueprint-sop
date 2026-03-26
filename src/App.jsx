import { useState, useEffect } from 'react';
import Header from './components/Header';
import SOPNavigator from './components/SOPNavigator';
import AdminPanel from './components/AdminPanel';
import ChangelogView from './components/ChangelogView';
import MigrateTool from './components/MigrateTool';

const GIST_FILE = 'rules.json';
const PUBLIC_GIST_ID = '1966a795b97f9716c32316c52fcc974f';

const DEFAULT_SETTINGS = {
  migrationToolUrl: 'http://192.168.105.175:4999/migrate',
  gistId: PUBLIC_GIST_ID,
  githubToken: '',
};

const DEFAULT_RULES = [
  {
    id: 'rule-1',
    fromVersion: '3.1',
    toVersion: '3.2',
    requiresMigration: false,
    manualSteps: [
      { id: 'r1s1', description: '更新 blueprint.config.js 中的 pageRenderer 選項' },
      { id: 'r1s2', description: '確認 components/ 目錄結構符合新版規範' },
    ],
  },
  {
    id: 'rule-2',
    fromVersion: '3.2',
    toVersion: '3.3',
    requiresMigration: false,
    manualSteps: [
      { id: 'r2s1', description: '移除已棄用的 useLegacyLayout 相關設定' },
      { id: 'r2s2', description: '更新 CSS 變數命名（--page-bg → --bp-background）' },
    ],
  },
  {
    id: 'rule-3',
    fromVersion: '3.3',
    toVersion: '3.4',
    requiresMigration: true,
    manualSteps: [
      { id: 'r3s1', description: '執行資料庫 Schema 更新腳本' },
      { id: 'r3s2', description: '更新 API Gateway 路由設定檔' },
      { id: 'r3s3', description: '重新發布並驗證所有 API 端點運作正常' },
    ],
  },
  {
    id: 'rule-4',
    fromVersion: '3.4',
    toVersion: '3.5',
    requiresMigration: false,
    manualSteps: [
      { id: 'r4s1', description: '更新 i18n 語系檔案至新版格式' },
      { id: 'r4s2', description: '確認翻譯 key 無缺漏（執行 i18n:check）' },
    ],
  },
  {
    id: 'rule-5',
    fromVersion: '3.5',
    toVersion: '3.9',
    requiresMigration: true,
    manualSteps: [
      { id: 'r5s1', description: '備份目前所有配置檔案至安全位置' },
      { id: 'r5s2', description: '執行完整資料移轉流程（約需 15 分鐘）' },
      { id: 'r5s3', description: '更新 auth 模組至新版 JWT 格式' },
      { id: 'r5s4', description: '重新設定 CDN 快取規則' },
      { id: 'r5s5', description: '執行全站功能驗收測試 (smoke test)' },
    ],
  },
  {
    id: 'rule-6',
    fromVersion: '3.9',
    toVersion: '3.10',
    requiresMigration: false,
    manualSteps: [
      { id: 'r6s1', description: '確認 3.10 新增的 PageSkeleton 元件已正確引入' },
      { id: 'r6s2', description: '移除舊版 polyfill 相關設定' },
    ],
  },
  {
    id: 'rule-7',
    fromVersion: '3.10',
    toVersion: '3.15',
    requiresMigration: true,
    manualSteps: [
      { id: 'r7s1', description: '更新打包設定以支援新的 code splitting 策略' },
      { id: 'r7s2', description: '重新生成所有 TypeScript 型別定義檔案' },
      { id: 'r7s3', description: '驗證 SSR 渲染流程運作正常' },
      { id: 'r7s4', description: '更新 theme.config.ts 中的顏色 token' },
    ],
  },
  {
    id: 'rule-8',
    fromVersion: '3.15',
    toVersion: '3.20',
    requiresMigration: true,
    manualSteps: [
      { id: 'r8s1', description: '執行 CLI 指令：pages blueprint migrate --major' },
      { id: 'r8s2', description: '更新所有頁面的 meta 設定至新版 Schema' },
      { id: 'r8s3', description: '確認 Edge Function 相容性（執行 edge:compat-check）' },
      { id: 'r8s4', description: '更新部署腳本中的環境變數設定' },
      { id: 'r8s5', description: '執行 smoke test 並截圖存檔備查' },
    ],
  },
];

export default function App() {
  // 'navigator' | 'changelog' | 'admin'
  const [view, setView] = useState('migrate');

  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('pages-sop-theme');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // 套用 dark class 到 <html>，讓 Tailwind dark: 變體生效
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pages-sop-theme', JSON.stringify(isDark));
  }, [isDark]);

  const [rules, setRules] = useState(() => {
    try {
      const saved = localStorage.getItem('pages-sop-rules');
      return saved ? JSON.parse(saved) : DEFAULT_RULES;
    } catch {
      return DEFAULT_RULES;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('pages-sop-settings');
      if (!saved) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        gistId: parsed.gistId || PUBLIC_GIST_ID,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('pages-sop-rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('pages-sop-settings', JSON.stringify(settings));
  }, [settings]);

  // 頁面載入時自動從公開 Gist 拉取最新設定
  useEffect(() => {
    fetch(`https://api.github.com/gists/${PUBLIC_GIST_ID}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(gist => {
        const file = gist.files[GIST_FILE];
        if (!file) return;
        const data = JSON.parse(file.content);
        if (data.rules) setRules(data.rules);
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            ...data.settings,
            gistId: prev.gistId,
            githubToken: prev.githubToken,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const addRule = rule => setRules(prev => [...prev, rule]);

  const updateRule = (id, updatedRule) =>
    setRules(prev => prev.map(r => (r.id === id ? { ...updatedRule, id } : r)));

  const deleteRule = id =>
    setRules(prev => prev.filter(r => r.id !== id));

  const updateSettings = newSettings => setSettings(newSettings);

  const exportData = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      rules,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date()
      .toLocaleDateString('zh-TW')
      .replace(/\//g, '-');
    a.download = `pages-sop-config-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = file => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.rules) setRules(data.rules);
        if (data.settings) setSettings(data.settings);
        alert('✅ 匯入成功！');
      } catch {
        alert('❌ 匯入失敗：JSON 格式有誤，請確認檔案內容。');
      }
    };
    reader.readAsText(file);
  };

  const syncToGist = async (currentSettings) => {
    const { gistId, githubToken } = currentSettings;
    if (!gistId) return { ok: false, error: '請先設定 Gist ID' };
    if (!githubToken) return { ok: false, error: '請先設定 GitHub Token' };

    const { gistId: _g, githubToken: _t, ...publicSettings } = currentSettings;
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      rules,
      settings: publicSettings,
    };

    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: { [GIST_FILE]: { content: JSON.stringify(data, null, 2) } },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const loadFromGist = async (currentSettings) => {
    const { gistId, githubToken } = currentSettings;
    if (!gistId) return { ok: false, error: '請先設定 Gist ID' };

    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: githubToken ? { Authorization: `Bearer ${githubToken}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const gist = await res.json();
      const file = gist.files[GIST_FILE];
      if (!file) throw new Error(`Gist 中找不到 ${GIST_FILE}`);
      const data = JSON.parse(file.content);
      if (data.rules) setRules(data.rules);
      if (data.settings) {
        setSettings(prev => ({
          ...prev,
          ...data.settings,
          gistId: prev.gistId,
          githubToken: prev.githubToken,
        }));
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const createGist = async (currentSettings) => {
    const { githubToken } = currentSettings;
    if (!githubToken) return { ok: false, error: '請先設定 GitHub Token' };

    const { gistId: _g, githubToken: _t, ...publicSettings } = currentSettings;
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      rules,
      settings: publicSettings,
    };

    try {
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'PAGEs Blueprint SOP Config',
          public: false,
          files: { [GIST_FILE]: { content: JSON.stringify(data, null, 2) } },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const gist = await res.json();
      setSettings(prev => ({ ...prev, gistId: gist.id }));
      return { ok: true, gistId: gist.id };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <Header
        view={view}
        onSetView={setView}
        isDark={isDark}
        onToggleTheme={() => setIsDark(v => !v)}
      />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className={view === 'navigator' ? '' : 'hidden'}>
          <SOPNavigator rules={rules} settings={settings} />
        </div>
        <div className={view === 'migrate' ? '' : 'hidden'}>
          <MigrateTool />
        </div>
        {view === 'changelog' && <ChangelogView rules={rules} />}
        {view === 'admin' && (
          <AdminPanel
            rules={rules}
            settings={settings}
            onAddRule={addRule}
            onUpdateRule={updateRule}
            onDeleteRule={deleteRule}
            onUpdateSettings={updateSettings}
            onExport={exportData}
            onImport={importData}
            onSyncToGist={syncToGist}
            onLoadFromGist={loadFromGist}
            onCreateGist={createGist}
          />
        )}
      </main>
    </div>
  );
}
