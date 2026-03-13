import { useState, useEffect } from 'react';
import { Trophy, Flame, Zap } from 'lucide-react';
import api from '../lib/api';

interface Leader {
  name: string;
  xp: number;
  level: number;
  best_streak: number | null;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/leaderboard')
      .then(res => setLeaders(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-slate-400 text-sm mt-1">Top habit builders this month</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="glass rounded-xl h-16 shimmer" />)}
        </div>
      ) : leaders.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <Trophy size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No users on the board yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, i) => (
            <div
              key={i}
              className={`glass rounded-xl p-4 flex items-center gap-4 slide-in ${
                i === 0 ? 'border-amber-500/30' : ''
              }`}
              style={i === 0 ? { borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' } : {}}
            >
              <div className="text-2xl w-8 text-center">
                {MEDALS[i] || <span className="text-slate-400 text-sm font-bold">#{i + 1}</span>}
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{
                  background: i === 0
                    ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(135deg, #6366f1, #c084fc)',
                }}
              >
                {leader.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">{leader.name}</p>
                <p className="text-xs text-slate-500">Level {leader.level}</p>
              </div>
              <div className="flex items-center gap-4">
                {leader.best_streak !== null && leader.best_streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame size={14} />
                    <span className="text-sm font-semibold">{leader.best_streak}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-indigo-400">
                  <Zap size={14} />
                  <span className="text-sm font-semibold">{leader.xp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-xl p-4 text-center">
        <p className="text-xs text-slate-500">
          Earn XP by completing habits daily. 10 XP per habit. Level up every 100 XP.
        </p>
      </div>
    </div>
  );
}
