import { Router } from 'express';
import { updateDM } from '../controllers/dm.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.put('/:id', protect, updateDM);

export default router;
