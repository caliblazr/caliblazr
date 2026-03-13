import { useState, useEffect, useCallback } from 'react';
import { Plus, Target, Trash2, Edit2, X, Calendar, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import type { Goal, User } from '../types';
import PaywallModal from '../components/PaywallModal';
import AdBanner from '../components/AdBanner';

interface GoalsPageProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const CATEGORIES = [
  { id: 'health', label: 'Health', emoji: '💪', color: '#10b981' },
  { id: 'career', label: 'Career', emoji: '💼', color: '#6366f1' },
  { id: 'learning', label: 'Learning', emoji: '📚', color: '#f59e0b' },
  { id: 'relationships', label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  { id: 'finance', label: 'Finance', emoji: '💰', color: '#84cc16' },
  { id: 'personal', label: 'Personal', emoji: '🌟', color: '#8b5cf6' },
];

export default function GoalsPage({ user, onUserUpdate }: GoalsPageProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'personal', target_date: '',
  });

  const fetchGoals = useCallback(async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      if (editGoal) {
        await api.put(`/goals/${editGoal.id}`, form);
      } else {
        await api.post('/goals', form);
      }
      setShowForm(false);
      setEditGoal(null);
      setForm({ title: '', description: '', category: 'personal', target_date: '' });
      fetchGoals();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string } } };
      if (e.response?.data?.code === 'UPGRADE_REQUIRED') {
        setShowPaywall(true);
        setShowForm(false);
      }
    }
  };

  const handleProgress = async (goal: Goal, delta: number) => {
    const newProgress = Math.max(0, Math.min(100, goal.progress + delta));
    await api.put(`/goals/${goal.id}`, {
      progress: newProgress,
      status: newProgress === 100 ? 'completed' : 'active',
    });
    fetchGoals();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/goals/${id}`);
    fetchGoals();
  };

  const getCat = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals</h1>
          <p className="text-slate-400 text-sm mt-1">Connect your habits to your bigger vision</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Plus size={16} />
          New Goal
        </button>
      </div>

      {!user.isPremium && <AdBanner />}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="glass rounded-xl h-40 shimmer" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <Target size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 font-semibold">No goals yet</p>
          <p className="text-slate-500 text-sm mt-1">Goals give your habits direction and purpose</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Set First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const cat = getCat(goal.category);
            return (
              <div key={goal.id} className="glass rounded-xl p-5 slide-in">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <h3 className={`font-semibold text-sm ${goal.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                        {goal.title}
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${cat.color}20`, color: cat.color }}
                      >
                        {cat.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditGoal(goal); setForm({ title: goal.title, description: goal.description || '', category: goal.category, target_date: goal.target_date || '' }); setShowForm(true); }}
                      className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-xs text-slate-500 mb-3">{goal.description}</p>
                )}

                {/* Progress */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <TrendingUp size={12} /> Progress
                    </span>
                    <span className="text-xs font-semibold" style={{ color: cat.color }}>
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress}%`, background: cat.color }}
                    />
                  </div>
                </div>

                {/* Progress buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleProgress(goal, -10)}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    disabled={goal.progress === 0}
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => handleProgress(goal, 10)}
                    className="px-2 py-1 text-xs rounded-lg text-white transition-colors"
                    style={{ background: `${cat.color}30`, border: `1px solid ${cat.color}50` }}
                    disabled={goal.progress === 100}
                  >
                    +10%
                  </button>
                  {goal.target_date && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={12} />
                      {new Date(goal.target_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {goal.habit_count !== undefined && goal.habit_count > 0 && (
                    <span className="text-xs text-indigo-400 ml-auto">{goal.habit_count} habits linked</span>
                  )}
                </div>

                {goal.status === 'completed' && (
                  <div className="mt-2 text-center text-sm text-emerald-400 font-semibold">
                    🎉 Goal Achieved!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative glass rounded-2xl p-6 w-full max-w-sm scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{editGoal ? 'Edit Goal' : 'New Goal'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Goal *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Run a 5K race"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What does success look like?"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setForm({ ...form, category: cat.id })}
                      className={`py-2 rounded-xl text-xs flex flex-col items-center gap-1 transition-all ${
                        form.category === cat.id ? 'ring-2' : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                      style={form.category === cat.id ? {
                        background: `${cat.color}20`,
                        border: `2px solid ${cat.color}`,
                      } : {}}
                    >
                      <span>{cat.emoji}</span>
                      <span className="text-slate-300">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Target Date</label>
                <input
                  type="date"
                  value={form.target_date}
                  onChange={e => setForm({ ...form, target_date: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {editGoal ? 'Save' : 'Create Goal'}
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
        trigger="Upgrade to set unlimited goals and connect them to your habits."
      />
    </div>
  );
}
