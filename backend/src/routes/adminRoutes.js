import { Router } from 'express';
import { createUser, listUsers, updateMatch, updateUser } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/users', asyncHandler(listUsers));
router.post('/users', asyncHandler(createUser));
router.put('/users/:id', asyncHandler(updateUser));
router.put('/matches/:id', asyncHandler(updateMatch));
export default router;
