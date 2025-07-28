// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  if (!token || typeof token !== 'string') {
    return res.status(401).json({ message: 'Token must be a string' });
  }

  try {
    const payload = verifyToken(token);
    (req as any).user = { id: payload.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
