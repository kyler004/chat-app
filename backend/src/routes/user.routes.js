import { Router } from 'express';
import { updateProfile, getMe, changePassword, deleteAccount } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

export default router;
