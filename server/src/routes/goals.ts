import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res: Response): void => {
  const goals = db
    .prepare(
      `SELECT g.*,
        (SELECT COUNT(*) FROM habits WHERE goal_id = g.id AND is_active = 1) as habit_count
       FROM goals g
       WHERE g.user_id = ?
       ORDER BY g.created_at DESC`
    )
    .all(req.userId);
  res.json(goals);
});

router.post('/', (req: AuthRequest, res: Response): void => {
  if (!req.isPremium) {
    const count = (
      db
        .prepare('SELECT COUNT(*) as cnt FROM goals WHERE user_id = ?')
        .get(req.userId) as { cnt: number }
    ).cnt;
    if (count >= 3) {
      res.status(403).json({
        error: 'Free tier limit reached',
        code: 'UPGRADE_REQUIRED',
        message: 'Free accounts are limited to 3 goals. Upgrade to Premium for unlimited goals.',
      });
      return;
    }
  }

  const { title, description, category, target_date } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Goal title is required' });
    return;
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO goals (id, user_id, title, description, category, target_date)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, req.userId, title, description || null, category || 'personal', target_date || null);

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  res.status(201).json(goal);
});

router.put('/:id', (req: AuthRequest, res: Response): void => {
  const { title, description, category, target_date, progress, status } = req.body;
  db.prepare(
    `UPDATE goals SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      category = COALESCE(?, category),
      target_date = COALESCE(?, target_date),
      progress = COALESCE(?, progress),
      status = COALESCE(?, status)
     WHERE id = ? AND user_id = ?`
  ).run(title, description, category, target_date, progress, status, req.params.id, req.userId);

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
  res.json(goal);
});

router.delete('/:id', (req: AuthRequest, res: Response): void => {
  db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

export default router;
