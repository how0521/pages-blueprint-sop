import { useState } from 'react';
import { Map, Settings, ShieldCheck, BookOpen, Sun, Moon, Eye, EyeOff, Languages } from 'lucide-react';

const ADMIN_PASSWORD = 'cmoney1234';

function PasswordModal({ onConfirm, onCancel }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onConfirm();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl shadow-black/30 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <ShieldCheck size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-slate-100 font-semibold text-base">進入維護模式</h3>
            <p className="text-gray-500 dark:text-slate-500 text-xs mt-0.5">請輸入管理員密碼</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              autoFocus
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="輸入密碼..."
              className={`w-full bg-gray-50 dark:bg-slate-700 border rounded-xl px-4 py-3 pr-11 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${
                error
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-300 dark:border-slate-600'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1.5">
              密碼錯誤，請重新輸入
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30"
            >
              確認進入
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-slate-600"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Header({ view, onSetView, isDark, onToggleTheme }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const isAdmin = view === 'admin';

  const handleAdminClick = () => {
    if (isAdmin) {
      onSetView('migrate');
    } else {
      setShowPasswordModal(true);
    }
  };

  const handlePasswordConfirm = () => {
    setShowPasswordModal(false);
    onSetView('admin');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 shadow-xl shadow-gray-200/50 dark:shadow-black/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Map size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 dark:text-slate-100 font-bold text-base leading-tight tracking-tight">
                PAGEs Blueprint 升版 SOP 導航站
              </h1>
              <p className="text-gray-500 dark:text-slate-500 text-xs leading-none mt-0.5">
                版本升級流程管理系統
                <span className="ml-1.5 text-gray-400 dark:text-slate-600">v{__APP_VERSION__}</span>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/25">
                <ShieldCheck size={12} />
                維護模式
              </span>
            )}

            {/* Nav buttons (only in non-admin mode) */}
            {!isAdmin && (
              <>
                <button
                  onClick={() => onSetView(view === 'navigator' ? 'migrate' : 'navigator')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    view === 'navigator'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <Map size={15} className="opacity-80" />
                  <span className="hidden sm:inline">SOP 查詢</span>
                </button>
                <button
                  onClick={() => onSetView(view === 'changelog' ? 'migrate' : 'changelog')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    view === 'changelog'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <BookOpen size={15} className="opacity-80" />
                  <span className="hidden sm:inline">Changelog</span>
                </button>
                <button
                  onClick={() => onSetView(view === 'i18n' ? 'migrate' : 'i18n')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    view === 'i18n'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <Languages size={15} className="opacity-80" />
                  <span className="hidden sm:inline">語言包</span>
                </button>
              </>
            )}

            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              title={isDark ? '切換淺色模式' : '切換深色模式'}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 transition-all duration-200"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Admin toggle */}
            <button
              onClick={handleAdminClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isAdmin
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30'
                  : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
              }`}
            >
              <Settings size={15} className="opacity-80" />
              <span className="hidden sm:inline">
                {isAdmin ? '離開維護模式' : '管理員'}
              </span>
            </button>
          </div>
        </div>

        {/* Admin mode indicator bar */}
        {isAdmin && (
          <div className="h-0.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />
        )}
      </header>

      {/* Password Modal */}
      {showPasswordModal && (
        <PasswordModal
          onConfirm={handlePasswordConfirm}
          onCancel={() => setShowPasswordModal(false)}
        />
      )}
    </>
  );
}
