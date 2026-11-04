import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  BookOpen,
  HelpCircle,
  FileText,
  KeyRound,
  Share2,
  Settings,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Create Question Paper', path: '/create', icon: FilePlus2, highlight: true },
  { name: 'Syllabus Library', path: '/syllabus', icon: BookOpen },
  { name: 'Question Bank', path: '/questions', icon: HelpCircle },
  { name: 'Generated Papers', path: '/papers', icon: FileText },
  { name: 'Answer Keys', path: '/answers', icon: KeyRound },
  { name: 'Shared Documents', path: '/shared-docs', icon: Share2 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg text-white tracking-tight">Q-GEN</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
              AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Question Paper Engine</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  item.highlight && !isActive
                    ? 'bg-brand-600/10 text-brand-400 hover:bg-brand-600/20 border border-brand-500/20'
                    : isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
              {item.highlight && (
                <Sparkles className="w-3.5 h-3.5 ml-auto text-brand-400 animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Pro Badge & System Status */}
      <div className="p-4 border-t border-slate-800">
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
            <span>Independent Edition</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Multi-board syllabus analysis & dual academic PDF generator.
          </p>
        </div>
      </div>
    </aside>
  );
};

