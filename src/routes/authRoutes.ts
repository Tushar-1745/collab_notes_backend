// 📄 src/routes/auth.ts

import express from 'express';
import { prisma } from '../prismaClient';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password, mobile } = req.body;
  if (!name || !email || !password || !mobile) return res.status(400).json({ message: 'Missing fields' });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(409).json({ message: 'User already exists' });

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, mobile },
  });

  res.status(201).json({ message: 'User created', userId: user.id });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user.id);
  res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile } });
});

export default router;