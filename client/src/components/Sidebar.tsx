import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Brain, BarChart3, Trophy, LogOut, Crown } from 'lucide-react';
import Logo from './Logo';
import type { User } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  onUpgradeClick: () => void;
}

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Today' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/coach', icon: Brain, label: 'AI Coach', premium: true },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', premium: true },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

export default function Sidebar({ user, onLogout, onUpgradeClick }: SidebarProps) {
  const xpForNextLevel = 100;
  const xpProgress = (user.xp % xpForNextLevel) / xpForNextLevel * 100;

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{ background: 'rgba(15, 15, 26, 0.98)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="p-5 pb-4">
        <Logo size={36} />
      </div>

      {/* User card */}
      <div className="mx-4 mb-4 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #c084fc)' }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-indigo-400">Level {user.level}</span>
              {user.isPremium && (
                <span className="flex items-center gap-0.5 text-xs text-amber-400">
                  <Crown size={10} /> Premium
                </span>
              )}
            </div>
          </div>
        </div>
        {/* XP bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{user.xp % xpForNextLevel} XP</span>
            <span>{xpForNextLevel} XP</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${xpProgress}%`,
                background: 'linear-gradient(90deg, #6366f1, #c084fc)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ to, icon: Icon, label, premium }) => (
          <NavLink
            key={to}
            to={to}
            onClick={(e) => {
              if (premium && !user.isPremium) {
                e.preventDefault();
                onUpgradeClick();
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(192,132,252,0.1))',
              border: '1px solid rgba(99,102,241,0.2)',
            } : {}}
          >
            <Icon size={18} className="flex-shrink-0" />
            {label}
            {premium && !user.isPremium && (
              <Crown size={12} className="ml-auto text-amber-400/70" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Premium CTA */}
      {!user.isPremium && (
        <div className="mx-4 mb-4">
          <button
            onClick={onUpgradeClick}
            className="w-full py-2.5 px-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.25)',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Crown size={14} />
              Upgrade to Premium
            </div>
            <p className="text-xs font-normal opacity-80 mt-0.5">Unlock AI Coach + unlimited habits</p>
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-slate-800/60">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-slate-500 hover:text-slate-300 text-sm transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-slate-800/60"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
