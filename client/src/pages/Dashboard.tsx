import { useState, useEffect, useCallback } from 'react';
import { Plus, Flame, CheckCircle2, Circle, Trash2, Edit2, X, Zap } from 'lucide-react';
import api from '../lib/api';
import type { Habit, User } from '../types';
import AdBanner from '../components/AdBanner';
import PaywallModal from '../components/PaywallModal';
import { format } from 'date-fns';

interface DashboardProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const ICONS = ['⭐', '💪', '📚', '🧘', '💧', '🏃', '🥗', '😴', '🎯', '🎨', '✍️', '🧠', '☀️', '🌿', '💊'];
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

export default function Dashboard({ user, onUserUpdate }: DashboardProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState('');
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [xpFlash, setXpFlash] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', icon: '⭐', color: '#6366f1',
  });

  const fetchHabits = useCallback(async () => {
    try {
      const res = await api.get('/habits');
      setHabits(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const today = format(new Date(), 'EEEE, MMMM d');
  const completedToday = habits.filter(h => h.completed_today).length;
  const totalHabits = habits.length;
  const completionPct = totalHabits ? Math.round((completedToday / totalHabits) * 100) : 0;

  const handleComplete = async (habit: Habit) => {
    try {
      const res = await api.post(`/habits/${habit.id}/complete`);
      if (!res.data.undone && res.data.xpEarned) {
        setXpFlash(`+${res.data.xpEarned} XP!`);
        setTimeout(() => setXpFlash(null), 2000);
        // Refresh user XP
        const userRes = await api.get('/users/me');
        onUserUpdate({ ...user, ...userRes.data, isPremium: userRes.data.is_premium === 1 || userRes.data.isPremium });
      }
      fetchHabits();
    } catch { /* noop */ }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/habits/${id}`);
    fetchHabits();
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editHabit) {
        await api.put(`/habits/${editHabit.id}`, form);
      } else {
        await api.post('/habits', form);
      }
      setShowForm(false);
      setEditHabit(null);
      setForm({ name: '', description: '', icon: '⭐', color: '#6366f1' });
      fetchHabits();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string; message?: string } } };
      if (e.response?.data?.code === 'UPGRADE_REQUIRED') {
        setPaywallTrigger(e.response.data.message || 'Upgrade to add more habits');
        setShowPaywall(true);
        setShowForm(false);
      }
    }
  };

  const openEdit = (habit: Habit) => {
    setEditHabit(habit);
    setForm({ name: habit.name, description: habit.description || '', icon: habit.icon, color: habit.color });
    setShowForm(true);
  };

  const openNew = () => {
    setEditHabit(null);
    setForm({ name: '', description: '', icon: '⭐', color: '#6366f1' });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* XP Flash */}
      {xpFlash && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white font-bold px-4 py-2 rounded-full shadow-lg animate-bounce scale-in">
          {xpFlash}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-white">
            {completedToday === 0 ? `Good day, ${user.name.split(' ')[0]}!` :
             completedToday === totalHabits ? `You're crushing it! 🔥` :
             `Keep going, ${user.name.split(' ')[0]}!`}
          </h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Plus size={16} />
          New Habit
        </button>
      </div>

      {/* Ad banner (free users) */}
      {!user.isPremium && <AdBanner />}

      {/* Progress overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Today</p>
          <p className="text-2xl font-bold text-white">{completedToday}<span className="text-slate-500 text-lg">/{totalHabits}</span></p>
          <p className="text-xs text-slate-400 mt-1">habits done</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Best Streak</p>
          <p className="text-2xl font-bold text-white">
            {habits.reduce((max, h) => Math.max(max, h.current_streak), 0)}
            <span className="text-orange-400 ml-1">🔥</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">days</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Completion</p>
          <p className="text-2xl font-bold text-white">{completionPct}<span className="text-slate-500 text-lg">%</span></p>
          <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${completionPct}%`,
                background: completionPct === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #c084fc)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Habits list */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Your Habits
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-xl p-4 shimmer h-20" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-slate-300 font-medium">No habits yet</p>
            <p className="text-slate-500 text-sm mt-1">Start your journey by adding your first habit</p>
            <button
              onClick={openNew}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Add First Habit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className={`glass rounded-xl p-4 flex items-center gap-4 transition-all slide-in ${
                  habit.completed_today ? 'opacity-70' : 'hover:bg-white/[0.07]'
                }`}
              >
                {/* Complete button */}
                <button
                  onClick={() => handleComplete(habit)}
                  className="flex-shrink-0 transition-transform active:scale-90"
                >
                  {habit.completed_today ? (
                    <CheckCircle2 size={28} className="text-emerald-400" />
                  ) : (
                    <Circle size={28} className="text-slate-600 hover:text-indigo-400 transition-colors" />
                  )}
                </button>

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${habit.color}20`, border: `1px solid ${habit.color}40` }}
                >
                  {habit.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${habit.completed_today ? 'line-through text-slate-500' : 'text-white'}`}>
                    {habit.name}
                  </p>
                  {habit.description && (
                    <p className="text-xs text-slate-500 truncate">{habit.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {habit.current_streak > 0 && (
                      <span className="flex items-center gap-1 text-xs text-orange-400">
                        <Flame size={12} />
                        {habit.current_streak} day streak
                      </span>
                    )}
                    {habit.total_completions > 0 && (
                      <span className="text-xs text-slate-500">{habit.total_completions} total</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(habit)}
                    className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-700/50 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Hover state for actions */}
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => openEdit(habit)} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(habit.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Free tier prompt */}
      {!user.isPremium && habits.length >= 3 && (
        <div
          className="rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(192,132,252,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}
          onClick={() => { setPaywallTrigger('You\'ve reached the 3-habit limit on the free plan.'); setShowPaywall(true); }}
        >
          <Zap className="text-indigo-400 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-semibold text-white">Unlock unlimited habits</p>
            <p className="text-xs text-slate-400">Upgrade to Premium to add more habits, access AI coaching, and get advanced analytics.</p>
          </div>
        </div>
      )}

      {/* Add/Edit Habit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative glass rounded-2xl p-6 w-full max-w-sm scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{editHabit ? 'Edit Habit' : 'New Habit'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Exercise 30 minutes"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Any cardio counts"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                        form.icon === icon ? 'ring-2 ring-indigo-500 scale-110' : 'hover:bg-slate-700'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        form.color === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {editHabit ? 'Save Changes' : 'Add Habit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={onUserUpdate}
        userId={user.id}
        trigger={paywallTrigger}
      />
    </div>
  );
}
