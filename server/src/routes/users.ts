import { Router, Response } from 'express';
import db from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/me', (req: AuthRequest, res: Response): void => {
  const user = db.prepare('SELECT id, email, name, is_premium, xp, level, created_at FROM users WHERE id = ?').get(req.userId) as
    | { id: string; email: string; name: string; is_premium: number; xp: number; level: number; created_at: string }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Auto-level up
  const newLevel = Math.floor(user.xp / 100) + 1;
  if (newLevel !== user.level) {
    db.prepare('UPDATE users SET level = ? WHERE id = ?').run(newLevel, req.userId);
    user.level = newLevel;
  }

  res.json({ ...user, isPremium: user.is_premium === 1 });
});

router.get('/leaderboard', (req: AuthRequest, res: Response): void => {
  // Public leaderboard (anonymized)
  const leaders = db
    .prepare(
      `SELECT name, xp, level,
        (SELECT MAX(longest_streak) FROM habits WHERE user_id = users.id) as best_streak
       FROM users ORDER BY xp DESC LIMIT 10`
    )
    .all();
  res.json(leaders);
});

export default router;
