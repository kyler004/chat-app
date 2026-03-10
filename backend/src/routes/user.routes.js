import { Router } from 'express';
import { updateProfile, getMe } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

export default router;
