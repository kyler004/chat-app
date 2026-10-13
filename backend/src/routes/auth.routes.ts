import { Router } from 'express';
import { register, login, getMe, googleAuth, googleAuthCallback } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Google OAuth Manual Flow Routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

export default router;
