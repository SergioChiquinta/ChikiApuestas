import { Router } from 'express';
import { mine, upsert } from '../controllers/predictionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.get('/me', requireAuth, requireRole('participante'), asyncHandler(mine));
router.put('/:matchId', requireAuth, requireRole('participante'), asyncHandler(upsert));
export default router;
