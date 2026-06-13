import { Router } from 'express';
import { listMatches, participation } from '../controllers/matchController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.get('/', requireAuth, asyncHandler(listMatches));
router.get('/participation', requireAuth, asyncHandler(participation));
router.get('/ranking', requireAuth, asyncHandler(participation));
export default router;
