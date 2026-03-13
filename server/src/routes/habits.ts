import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /habits — list all habits for user
router.get('/', (req: AuthRequest, res: Response): void => {
  const today = new Date().toISOString().slice(0, 10);
  const habits = db
    .prepare(
      `SELECT h.*,
        CASE WHEN hl.id IS NOT NULL THEN 1 ELSE 0 END as completed_today
       FROM habits h
       LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.completed_date = ?
       WHERE h.user_id = ? AND h.is_active = 1
       ORDER BY h.created_at ASC`
    )
    .all(today, req.userId);
  res.json(habits);
});

// POST /habits — create habit (free: max 3, premium: unlimited)
router.post('/', (req: AuthRequest, res: Response): void => {
  if (!req.isPremium) {
    const count = (
      db
        .prepare('SELECT COUNT(*) as cnt FROM habits WHERE user_id = ? AND is_active = 1')
        .get(req.userId) as { cnt: number }
    ).cnt;
    if (count >= 3) {
      res.status(403).json({
        error: 'Free tier limit reached',
        code: 'UPGRADE_REQUIRED',
        message: 'Free accounts are limited to 3 habits. Upgrade to Premium for unlimited habits.',
      });
      return;
    }
  }

  const { name, description, icon, color, frequency, goal_id } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Habit name is required' });
    return;
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO habits (id, user_id, name, description, icon, color, frequency, goal_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.userId,
    name,
    description || null,
    icon || '⭐',
    color || '#6366f1',
    frequency || 'daily',
    goal_id || null
  );

  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  res.status(201).json(habit);
});

// PUT /habits/:id — update habit
router.put('/:id', (req: AuthRequest, res: Response): void => {
  const { name, description, icon, color, frequency } = req.body;
  db.prepare(
    `UPDATE habits SET name = COALESCE(?, name), description = COALESCE(?, description),
     icon = COALESCE(?, icon), color = COALESCE(?, color), frequency = COALESCE(?, frequency)
     WHERE id = ? AND user_id = ?`
  ).run(name, description, icon, color, frequency, req.params.id, req.userId);

  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  res.json(habit);
});

// DELETE /habits/:id — archive habit
router.delete('/:id', (req: AuthRequest, res: Response): void => {
  db.prepare('UPDATE habits SET is_active = 0 WHERE id = ? AND user_id = ?').run(
    req.params.id,
    req.userId
  );
  res.json({ success: true });
});

// POST /habits/:id/complete — mark habit done for today
router.post('/:id/complete', (req: AuthRequest, res: Response): void => {
  const today = new Date().toISOString().slice(0, 10);
  const { notes } = req.body;
  const id = uuidv4();

  try {
    db.prepare(
      'INSERT INTO habit_logs (id, habit_id, user_id, completed_date, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.params.id, req.userId, today, notes || null);

    // Update streak and total completions
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const yLog = db
      .prepare('SELECT id FROM habit_logs WHERE habit_id = ? AND completed_date = ?')
      .get(req.params.id, yesterday);

    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id) as
      | { current_streak: number; longest_streak: number; total_completions: number }
      | undefined;
    if (habit) {
      const newStreak = yLog ? habit.current_streak + 1 : 1;
      const longestStreak = Math.max(newStreak, habit.longest_streak);
      db.prepare(
        `UPDATE habits SET current_streak = ?, longest_streak = ?, total_completions = total_completions + 1
         WHERE id = ?`
      ).run(newStreak, longestStreak, req.params.id);
    }

    // Award XP
    db.prepare('UPDATE users SET xp = xp + 10 WHERE id = ?').run(req.userId);

    res.json({ success: true, xpEarned: 10 });
  } catch {
    // Already completed today — undo
    db.prepare(
      'DELETE FROM habit_logs WHERE habit_id = ? AND completed_date = ?'
    ).run(req.params.id, today);

    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id) as
      | { current_streak: number; total_completions: number }
      | undefined;
    if (habit) {
      db.prepare(
        `UPDATE habits SET current_streak = MAX(0, current_streak - 1),
         total_completions = MAX(0, total_completions - 1) WHERE id = ?`
      ).run(req.params.id);
      db.prepare('UPDATE users SET xp = MAX(0, xp - 10) WHERE id = ?').run(req.userId);
    }

    res.json({ success: true, undone: true });
  }
});

// GET /habits/analytics — completion stats
router.get('/analytics', (req: AuthRequest, res: Response): void => {
  const days = 30;
  const stats = db
    .prepare(
      `SELECT completed_date, COUNT(*) as count
       FROM habit_logs
       WHERE user_id = ? AND completed_date >= date('now', '-${days} days')
       GROUP BY completed_date
       ORDER BY completed_date ASC`
    )
    .all(req.userId);

  const totalHabits = (
    db
      .prepare('SELECT COUNT(*) as cnt FROM habits WHERE user_id = ? AND is_active = 1')
      .get(req.userId) as { cnt: number }
  ).cnt;

  const totalCompleted = (
    db
      .prepare('SELECT COUNT(*) as cnt FROM habit_logs WHERE user_id = ?')
      .get(req.userId) as { cnt: number }
  ).cnt;

  const longestStreak = (
    db
      .prepare('SELECT MAX(longest_streak) as max FROM habits WHERE user_id = ?')
      .get(req.userId) as { max: number | null }
  ).max || 0;

  res.json({ dailyStats: stats, totalHabits, totalCompleted, longestStreak });
});

export default router;
