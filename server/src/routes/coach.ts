import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /coach/messages — get chat history
router.get('/messages', (req: AuthRequest, res: Response): void => {
  if (!req.isPremium) {
    res.status(403).json({
      error: 'Premium required',
      code: 'UPGRADE_REQUIRED',
      message: 'AI Coach is a Premium feature. Upgrade to unlock your personal accountability partner.',
    });
    return;
  }

  const messages = db
    .prepare(
      'SELECT * FROM ai_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 50'
    )
    .all(req.userId);
  res.json(messages);
});

// POST /coach/chat — send message to AI coach
router.post('/chat', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.isPremium) {
    res.status(403).json({
      error: 'Premium required',
      code: 'UPGRADE_REQUIRED',
      message: 'AI Coach is a Premium feature. Upgrade to unlock your personal accountability partner.',
    });
    return;
  }

  const { message } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  // Get user context
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as
    | { name: string; xp: number; level: number }
    | undefined;
  const habits = db
    .prepare('SELECT name, current_streak, total_completions FROM habits WHERE user_id = ? AND is_active = 1')
    .all(req.userId) as Array<{ name: string; current_streak: number; total_completions: number }>;
  const goals = db
    .prepare('SELECT title, category, progress, status FROM goals WHERE user_id = ?')
    .all(req.userId) as Array<{ title: string; category: string; progress: number; status: string }>;

  const todayCompletions = (
    db
      .prepare(
        `SELECT COUNT(*) as cnt FROM habit_logs
         WHERE user_id = ? AND completed_date = date('now')`
      )
      .get(req.userId) as { cnt: number }
  ).cnt;

  // Build context
  const habitsSummary = habits
    .map(h => `- ${h.name} (streak: ${h.current_streak} days, total: ${h.total_completions} completions)`)
    .join('\n') || 'No habits yet';

  const goalsSummary = goals
    .map(g => `- ${g.title} [${g.category}] - ${g.progress}% complete, status: ${g.status}`)
    .join('\n') || 'No goals set yet';

  const systemPrompt = `You are LifeSync AI Coach, a warm, supportive, and insightful personal accountability partner.

User: ${user?.name || 'User'} | Level ${user?.level || 1} | ${user?.xp || 0} XP

Their current habits:
${habitsSummary}

Their goals:
${goalsSummary}

Today's completed habits: ${todayCompletions} out of ${habits.length}

Your role:
- Be encouraging but honest
- Give specific, actionable advice
- Reference their actual habits and goals
- Celebrate streaks and progress
- Keep responses concise (2-4 paragraphs max)
- Use the occasional emoji to feel warm and human
- If they're struggling, offer concrete strategies
- If they're winning, amplify their momentum`;

  // Get recent history
  const history = db
    .prepare(
      'SELECT role, content FROM ai_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
    )
    .all(req.userId) as Array<{ role: string; content: string }>;

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history.reverse().map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  // Save user message
  db.prepare('INSERT INTO ai_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)').run(
    uuidv4(),
    req.userId,
    'user',
    message
  );

  let reply = '';

  if (!process.env.ANTHROPIC_API_KEY) {
    // Demo mode responses when no API key is set
    const demoReplies = [
      `Hey ${user?.name || 'there'}! 👋 I can see you're working on building great habits. Your consistency is really showing — keep that momentum going!\n\nBased on your current habits and goals, I'd suggest focusing on completing your morning routine first thing when you wake up. That early win sets the tone for the whole day. What's been your biggest challenge lately?`,
      `Great question! 🎯 Looking at your progress, you're doing really well with your streaks. The key to maintaining momentum is linking your habits together — what we call "habit stacking." Try attaching a new habit to one you already do consistently.\n\nWhat habit are you finding hardest to maintain right now?`,
      `I love your commitment! 💪 You've already built a solid foundation. Remember: progress isn't always linear. Some days will be harder than others, and that's completely normal.\n\nThe science shows it takes 66 days on average to form a habit — not 21 days like the myth says. Be patient with yourself. What goal feels most aligned with your life right now?`,
    ];
    reply = demoReplies[Math.floor(Math.random() * demoReplies.length)];
  } else {
    try {
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages,
      });
      reply = response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (err) {
      console.error('Claude API error:', err);
      reply = `I'm having a moment of reflection... 🧘 Let me gather my thoughts. Meanwhile, how about sharing what's on your mind about your habits and goals? I'm here to listen.`;
    }
  }

  // Save assistant reply
  db.prepare('INSERT INTO ai_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)').run(
    uuidv4(),
    req.userId,
    'assistant',
    reply
  );

  res.json({ reply });
});

// DELETE /coach/messages — clear chat history
router.delete('/messages', (req: AuthRequest, res: Response): void => {
  db.prepare('DELETE FROM ai_messages WHERE user_id = ?').run(req.userId);
  res.json({ success: true });
});

export default router;
