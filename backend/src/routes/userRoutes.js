import { Router } from 'express';
import { updatePhoto, updateProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { uploadProfile } from '../middleware/upload.js';

const router = Router();
router.put('/me', requireAuth, asyncHandler(updateProfile));
router.post('/me/photo', requireAuth, uploadProfile.single('foto'), asyncHandler(updatePhoto));
export default router;
