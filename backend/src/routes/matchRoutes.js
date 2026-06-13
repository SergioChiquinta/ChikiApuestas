import { Router } from 'express';
import { listMatches, ranking } from '../controllers/matchController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.get('/', requireAuth, asyncHandler(listMatches));
router.get('/ranking', requireAuth, asyncHandler(ranking));
export default router;
