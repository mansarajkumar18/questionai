import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';
import { errorHandler } from './middlewares/errorHandler.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import boardsRoutes from './routes/boards.routes.js';
import syllabusRoutes from './routes/syllabus.routes.js';
import papersRoutes from './routes/papers.routes.js';
import publicShareRoutes from './routes/publicShare.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directory exists
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/boards', boardsRoutes);
app.use('/api/v1/syllabus', syllabusRoutes);
app.use('/api/v1/papers', papersRoutes);
app.use('/api/v1/public', publicShareRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Q-GEN AI Backend Engine running on http://localhost:${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
  });
}

startServer();
