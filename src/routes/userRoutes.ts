// src/routes/userRoutes.ts

import express from 'express';
import { checkEmailExists } from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/check-email', authenticate, checkEmailExists);

export default router;
