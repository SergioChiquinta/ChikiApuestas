import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import pool from './config/database.js';

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
  })
);
app.use(express.json({ limit: '1mb' }));

app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
