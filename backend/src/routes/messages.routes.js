import { Router } from 'express'; 
import { getRoomMessages } from '../controllers/messages.controller.js'; 
import { protect } from '../middleware/auth.middleware.js'

const router = Router(); 

router.get('/room/:roomId', protect, getRoomMessages); 

export default router; 