import { Router } from 'express'; 
import { getRoomMessages, getDMMessages } from '../controllers/messages.controller.js'; 
import { protect } from '../middleware/auth.middleware.js'

const router = Router(); 

router.get('/room/:roomId', protect, getRoomMessages); 
router.get('/dm/:conversationId', protect, getDMMessages);

export default router; 