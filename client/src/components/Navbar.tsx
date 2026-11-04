import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Sparkles, Building2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    api.get('/settings/ai')
      .then((res) => {
        setAiConfigured(res.data.isConfigured);
      })
      .catch(() => {
        setAiConfigured(false);
      });
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {user?.institution?.name || 'Institution Workspace'}
          </span>
          <span className="text-slate-300">•</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-mono">
            Independent Standalone
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* AI Key Status Pill */}
        <Link
          to="/settings"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            aiConfigured
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
          }`}
          title="Click to manage Gemini API Key"
        >
          <Sparkles className={`w-3.5 h-3.5 ${aiConfigured ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span>{aiConfigured ? 'Gemini AI Active' : 'Configure Gemini Key'}</span>
        </Link>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-semibold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
