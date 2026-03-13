import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Trash2, Brain, Crown } from 'lucide-react';
import api from '../lib/api';
import type { Message, User } from '../types';
import PaywallModal from '../components/PaywallModal';

interface CoachPageProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const SUGGESTED_PROMPTS = [
  "How am I doing with my habits this week?",
  "What habit should I focus on to reach my goals?",
  "I'm struggling to stay consistent. Help me.",
  "Give me a morning routine based on my habits",
  "How do I build momentum when I'm feeling unmotivated?",
];

export default function CoachPage({ user, onUserUpdate }: CoachPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(!user.isPremium);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!user.isPremium) return;
    try {
      const res = await api.get('/coach/messages');
      setMessages(res.data);
    } catch { /* noop */ }
  }, [user.isPremium]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);

    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      user_id: user.id,
      role: 'user',
      content: msg,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.post('/coach/chat', { message: msg });
      const replyMsg: Message = {
        id: 'reply-' + Date.now(),
        user_id: user.id,
        role: 'assistant',
        content: res.data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), tempMsg, replyMsg]);
    } catch { /* noop */ } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    await api.delete('/coach/messages');
    setMessages([]);
  };

  if (!user.isPremium) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, #6366f1, #c084fc)' }}
        >
          <Brain size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Meet Your AI Coach</h2>
        <p className="text-slate-400 max-w-sm mb-6">
          Your personal accountability partner powered by Claude AI. Get real-time coaching,
          habit analysis, and personalized strategies for your goals.
        </p>
        <div className="space-y-3 mb-6 w-full max-w-sm">
          {['Analyzes your actual habit data', 'Provides personalized strategies', '24/7 accountability support', 'Weekly progress reports'].map(f => (
            <div key={f} className="flex items-center gap-3 glass rounded-xl p-3">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
              <span className="text-sm text-slate-300">{f}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowPaywall(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Crown size={18} />
          Unlock AI Coach
        </button>
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          onUpgrade={(updatedUser) => { onUserUpdate(updatedUser); setShowPaywall(false); }}
          userId={user.id}
          trigger="AI Coach is available on Premium."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #c084fc)' }}
          >
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Coach</h1>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Always available
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-4">Ask me anything about your habits and goals 👋</p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-sm text-left glass rounded-xl px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} slide-in`}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-1"
                style={{ background: 'linear-gradient(135deg, #6366f1, #c084fc)' }}
              >
                <Brain size={14} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'text-white rounded-tr-sm'
                  : 'text-slate-200 rounded-tl-sm glass'
              }`}
              style={msg.role === 'user' ? {
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              } : {}}
            >
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #c084fc)' }}
            >
              <Brain size={14} className="text-white" />
            </div>
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask your AI coach..."
          className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Send size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
