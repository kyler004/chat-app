import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getInvites,
  sendInvite,
  acceptInvite,
  rejectInvite
} from '../controllers/invite.controller.js';

const router = Router();

router.use(protect);

router.get('/', getInvites);
router.post('/', sendInvite);
router.put('/:id/accept', acceptInvite);
router.put('/:id/reject', rejectInvite);

export default router;
