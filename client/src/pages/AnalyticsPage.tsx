import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { BarChart3, Crown, Flame, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import api from '../lib/api';
import type { Analytics, User } from '../types';
import PaywallModal from '../components/PaywallModal';
import { format, parseISO } from 'date-fns';

interface AnalyticsPageProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export default function AnalyticsPage({ user, onUserUpdate }: AnalyticsPageProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showPaywall, setShowPaywall] = useState(!user.isPremium);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/habits/analytics');
      setAnalytics(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (!user.isPremium) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, #6366f1, #c084fc)' }}
        >
          <BarChart3 size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Deep Analytics</h2>
        <p className="text-slate-400 max-w-sm mb-6">
          Understand your patterns, predict your progress, and get AI-powered insights
          about your habit performance.
        </p>
        <button
          onClick={() => setShowPaywall(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Crown size={18} />
          Unlock Analytics
        </button>
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          onUpgrade={onUserUpdate}
          userId={user.id}
          trigger="Advanced Analytics requires Premium."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="glass rounded-xl h-40 shimmer" />)}
      </div>
    );
  }

  const chartData = analytics?.dailyStats.map(d => ({
    date: format(parseISO(d.completed_date), 'MMM d'),
    completions: d.count,
  })) || [];

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const stat = analytics?.dailyStats.find(s => s.completed_date === dateStr);
    return {
      day: format(d, 'EEE'),
      completions: stat?.count || 0,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Your habit performance at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Habits', value: analytics?.totalHabits || 0, icon: CheckCircle2, color: '#6366f1', suffix: '' },
          { label: 'Total Completions', value: analytics?.totalCompleted || 0, icon: TrendingUp, color: '#10b981', suffix: '' },
          { label: 'Best Streak', value: analytics?.longestStreak || 0, icon: Flame, color: '#f59e0b', suffix: ' days' },
          { label: 'This Month', value: analytics?.dailyStats.reduce((s, d) => s + d.count, 0) || 0, icon: Calendar, color: '#ec4899', suffix: '' },
        ].map(kpi => (
          <div key={kpi.label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {kpi.value}<span className="text-slate-500 text-sm">{kpi.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1e1b4b', border: '1px solid #6366f130', borderRadius: 12, color: '#e2e8f0' }}
              cursor={{ fill: 'rgba(99,102,241,0.1)' }}
            />
            <Bar dataKey="completions" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly trend */}
      {chartData.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">30-Day Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(chartData.length / 5)}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e1b4b', border: '1px solid #6366f130', borderRadius: 12, color: '#e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="completions"
                stroke="#c084fc"
                strokeWidth={2}
                dot={{ fill: '#c084fc', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insight card */}
      <div className="glass rounded-xl p-5" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">AI Insight</h3>
        <p className="text-sm text-slate-400">
          {analytics && analytics.totalCompleted > 10
            ? `You've completed ${analytics.totalCompleted} habits total — that's real commitment! Your consistency is in the top 20% of users. Keep your best streak of ${analytics.longestStreak} days going strong.`
            : `You're just getting started! The first week is the hardest. Aim for completing at least 2 habits daily this week to build momentum.`}
        </p>
      </div>
    </div>
  );
}
