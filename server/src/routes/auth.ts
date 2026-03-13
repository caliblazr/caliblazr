import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lifesync-secret-key-2026';

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    res.status(400).json({ error: 'Email, name and password are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  db.prepare(
    'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
  ).run(id, email, name, passwordHash);

  // Seed 3 example habits for new users
  const sampleHabits = [
    { name: 'Morning Meditation', icon: '🧘', color: '#8b5cf6' },
    { name: 'Exercise 30 min', icon: '💪', color: '#10b981' },
    { name: 'Read 20 pages', icon: '📚', color: '#f59e0b' },
  ];
  for (const h of sampleHabits) {
    db.prepare(
      'INSERT INTO habits (id, user_id, name, icon, color) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), id, h.name, h.icon, h.color);
  }

  const token = jwt.sign({ userId: id, email, isPremium: false }, JWT_SECRET, {
    expiresIn: '30d',
  });

  res.status(201).json({ token, user: { id, email, name, isPremium: false, xp: 0, level: 1 } });
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | { id: string; email: string; name: string; password_hash: string; is_premium: number; xp: number; level: number }
    | undefined;

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, isPremium: user.is_premium === 1 },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isPremium: user.is_premium === 1,
      xp: user.xp,
      level: user.level,
    },
  });
});

router.post('/upgrade', async (req: Request, res: Response): Promise<void> => {
  // Stub: in production this would validate a Stripe payment
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }

  db.prepare('UPDATE users SET is_premium = 1 WHERE id = ?').run(userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as
    | { id: string; email: string; name: string; is_premium: number; xp: number; level: number }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, isPremium: true },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token, user: { ...user, isPremium: true } });
});

export default router;
