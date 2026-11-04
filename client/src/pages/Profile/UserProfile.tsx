import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Building2, Shield, Calendar, Mail } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Educator Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Your credentials and examination workspace information
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-brand-500/20">
            {user?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wider">
              {user?.role || 'TEACHER'}
            </span>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span className="uppercase text-[10px] font-bold">Institution Workspace</span>
            </div>
            <p className="font-semibold text-slate-800 text-sm">
              {user?.institution?.name || 'Independent Academy'}
            </p>
            {user?.institution?.address && (
              <p className="text-slate-500 text-[11px]">{user.institution.address}</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-slate-400">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="uppercase text-[10px] font-bold">Account Security</span>
            </div>
            <p className="font-semibold text-slate-800 text-sm">Active & Verified</p>
            <p className="text-slate-500 text-[11px]">Independent JWT Auth Session</p>
          </div>
        </div>
      </div>
    </div>
  );
};
