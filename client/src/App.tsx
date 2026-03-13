import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { User } from './types';
import { getUser, clearAuth, isAuthenticated } from './lib/auth';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import GoalsPage from './pages/GoalsPage';
import CoachPage from './pages/CoachPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import Sidebar from './components/Sidebar';
import PaywallModal from './components/PaywallModal';

function AppLayout({ user, setUser }: { user: User; setUser: (u: User) => void }) {
  const [showPaywall, setShowPaywall] = useState(false);

  const handleLogout = () => {
    clearAuth();
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#0f0f1a' }}>
      <Sidebar user={user} onLogout={handleLogout} onUpgradeClick={() => setShowPaywall(true)} />
      <main className="ml-64 flex-1 p-6 md:p-8 max-w-3xl">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard user={user} onUserUpdate={setUser} />} />
          <Route path="/goals" element={<GoalsPage user={user} onUserUpdate={setUser} />} />
          <Route path="/coach" element={<CoachPage user={user} onUserUpdate={setUser} />} />
          <Route path="/analytics" element={<AnalyticsPage user={user} onUserUpdate={setUser} />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={setUser}
        userId={user.id}
      />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser());
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f1a' }}>
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!user ? (
        <AuthPage onAuth={setUser} />
      ) : (
        <AppLayout user={user} setUser={setUser} />
      )}
    </BrowserRouter>
  );
}
