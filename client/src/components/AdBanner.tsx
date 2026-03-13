import { useState } from 'react';
import { X } from 'lucide-react';

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'inline';
  className?: string;
}

const AD_COPIES = [
  {
    headline: 'Struggling with sleep? 😴',
    body: 'Millions swear by this one habit before bed. 7-day free trial.',
    cta: 'Try Free',
    color: '#1e1b4b',
    accent: '#818cf8',
    emoji: '🌙',
  },
  {
    headline: 'Level up your morning ☀️',
    body: 'The 5AM Club journal — 250K+ copies sold. Start your journey today.',
    cta: 'Learn More',
    color: '#1a1200',
    accent: '#f59e0b',
    emoji: '📓',
  },
  {
    headline: 'Meditation made simple 🧘',
    body: 'Headspace — 70M+ users. Science-backed mindfulness in 10 min/day.',
    cta: 'Try Free',
    color: '#0a1a0a',
    accent: '#10b981',
    emoji: '🧠',
  },
];

export default function AdBanner({ position = 'top', className = '' }: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const ad = AD_COPIES[Math.floor(Math.random() * AD_COPIES.length)];

  if (dismissed) return null;

  return (
    <div
      className={`relative rounded-xl p-3 flex items-center gap-3 ${className}`}
      style={{ background: ad.color, border: `1px solid ${ad.accent}30` }}
    >
      {/* Ad label */}
      <span
        className="absolute top-1 left-2 text-xs text-slate-500 uppercase tracking-wider"
        style={{ fontSize: '9px' }}
      >
        Sponsored
      </span>

      <div className="text-2xl mt-2">{ad.emoji}</div>

      <div className="flex-1 mt-1">
        <p className="text-sm font-semibold text-white">{ad.headline}</p>
        <p className="text-xs text-slate-400 mt-0.5">{ad.body}</p>
      </div>

      <button
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
        style={{ background: ad.accent }}
        onClick={() => {/* stub ad click tracking */}}
      >
        {ad.cta}
      </button>

      <button
        onClick={() => setDismissed(true)}
        className="text-slate-500 hover:text-slate-300 transition-colors ml-1"
      >
        <X size={14} />
      </button>

      {position && (
        <div className="sr-only">Advertisement</div>
      )}
    </div>
  );
}
