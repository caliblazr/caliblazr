import { useState } from 'react';
import { X, Check, Zap, Brain, BarChart3, Infinity } from 'lucide-react';
import api from '../lib/api';
import { setAuth } from '../lib/auth';
import type { User } from '../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (user: User) => void;
  userId: string;
  trigger?: string;
}

const FEATURES = [
  { icon: Infinity, text: 'Unlimited habits & goals', free: false },
  { icon: Brain, text: 'AI Coach — 24/7 accountability', free: false },
  { icon: BarChart3, text: 'Advanced analytics & insights', free: false },
  { icon: Zap, text: 'Weekly AI progress reports', free: false },
  { icon: Check, text: 'No ads — ever', free: false },
  { icon: Check, text: 'Up to 3 habits (free)', free: true },
  { icon: Check, text: 'Basic streak tracking', free: true },
  { icon: Check, text: 'Daily check-ins', free: true },
];

export default function PaywallModal({ isOpen, onClose, onUpgrade, userId, trigger }: PaywallModalProps) {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      // In production: redirect to Stripe checkout
      // For demo: directly upgrade the user
      const res = await api.post('/auth/upgrade', { userId });
      setAuth(res.data.token, { ...res.data.user, isPremium: true });
      onUpgrade({ ...res.data.user, isPremium: true });
      onClose();
    } catch (err: unknown) {
      setError('Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass rounded-2xl p-6 scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-3 py-1 mb-3">
            <Zap size={14} className="text-indigo-400" />
            <span className="text-xs text-indigo-300 font-medium">Premium Feature</span>
          </div>
          {trigger && (
            <p className="text-slate-400 text-sm mb-2">{trigger}</p>
          )}
          <h2 className="text-2xl font-bold text-white">Unlock Your Full Potential</h2>
          <p className="text-slate-400 text-sm mt-1">Join 10,000+ members transforming their lives</p>
        </div>

        {/* Plan toggle */}
        <div className="flex bg-slate-800/60 rounded-xl p-1 mb-5">
          <button
            onClick={() => setPlan('monthly')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              plan === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPlan('yearly')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all relative ${
              plan === 'yearly'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-1 bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
              -33%
            </span>
          </button>
        </div>

        {/* Price */}
        <div className="text-center mb-5">
          <div className="flex items-end justify-center gap-1">
            <span className="text-5xl font-bold text-white">
              {plan === 'monthly' ? '$9' : '$6'}
            </span>
            <span className="text-slate-400 mb-2">.99/mo</span>
          </div>
          {plan === 'yearly' && (
            <p className="text-emerald-400 text-sm mt-1">
              Billed $79.99/year · Save $39.89
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6">
          {FEATURES.filter(f => !f.free).map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <feature.icon size={12} className="text-indigo-400" />
              </div>
              <span className="text-sm text-slate-300">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #c084fc 100%)',
            boxShadow: '0 4px 24px rgba(99, 102, 241, 0.4)',
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `Start Premium — ${plan === 'monthly' ? '$9.99/mo' : '$79.99/yr'}`
          )}
        </button>

        <p className="text-center text-xs text-slate-500 mt-3">
          7-day free trial · Cancel anytime · Secure payment
        </p>
      </div>
    </div>
  );
}
