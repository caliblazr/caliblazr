import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth';
import habitsRoutes from './routes/habits';
import goalsRoutes from './routes/goals';
import coachRoutes from './routes/coach';
import usersRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'LifeSync AI', version: '1.0.0' });
});

// Serve static frontend in production
const distPath = path.join(__dirname, '../../client/dist');
app.use(express.static(distPath));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 LifeSync AI server running on port ${PORT}`);
});
