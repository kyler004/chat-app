import { Router } from 'express';
import { updateProfile, getMe, searchUsers, getMyDMs } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', protect, getMe);
router.get('/me/dms', protect, getMyDMs);
router.get('/search', protect, searchUsers);
router.patch('/profile', protect, updateProfile);

export default router;
