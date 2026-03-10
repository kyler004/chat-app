import { Router } from 'express';
import { getRooms, createRoom } from '../controllers/room.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protect, getRooms);
router.post('/', protect, createRoom);

export default router;
