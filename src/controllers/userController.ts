// src/controllers/userController.ts

import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const checkEmailExists = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    res.json({ exists: !!user });
  } catch (err) {
    console.error("Error checking email:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
