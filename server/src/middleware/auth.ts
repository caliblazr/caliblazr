import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lifesync-secret-key-2026';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  isPremium?: boolean;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      isPremium: boolean;
    };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.isPremium = decoded.isPremium;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
