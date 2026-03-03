import { Map, Settings, User, ShieldCheck } from 'lucide-react';

export default function Header({ isAdmin, onToggleAdmin }) {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 shadow-xl shadow-black/20">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Map size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-slate-100 font-bold text-base leading-tight tracking-tight">
              PAGEs Blueprint 升版 SOP 導航站
            </h1>
            <p className="text-slate-500 text-xs leading-none mt-0.5">
              版本升級流程管理系統
              <span className="ml-1.5 text-slate-600">v{__APP_VERSION__}</span>
            </p>
          </div>
        </div>

        {/* Role Toggle */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/25">
              <ShieldCheck size={12} />
              維護模式
            </span>
          )}
          <button
            onClick={onToggleAdmin}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isAdmin
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isAdmin ? (
              <>
                <Settings size={15} className="opacity-80" />
                管理員模式
              </>
            ) : (
              <>
                <User size={15} className="opacity-80" />
                工程師模式
              </>
            )}
          </button>
        </div>
      </div>

      {/* Admin mode indicator bar */}
      {isAdmin && (
        <div className="h-0.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />
      )}
    </header>
  );
}
