import { Router } from 'express';
import { uploadMedia } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/', protect, upload.single('media'), uploadMedia);

export default router;
