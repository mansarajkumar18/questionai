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
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any requesting origin (including Vercel deployment domains and localhost) with credentials
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoints
app.use('/api', healthRoutes);
app.use('/api/v1', healthRoutes);
app.use('/', healthRoutes);

// Modular API routes with multi-prefix resilience
const apiModules = [
  { path: '/auth', router: authRoutes },
  { path: '/settings', router: settingsRoutes },
  { path: '/boards', router: boardsRoutes },
  { path: '/syllabus', router: syllabusRoutes },
  { path: '/papers', router: papersRoutes },
  { path: '/public', router: publicShareRoutes },
];

apiModules.forEach(({ path: routePath, router: routeHandler }) => {
  // Support /api/v1/* (primary standard)
  app.use(`/api/v1${routePath}`, routeHandler);
  // Support /api/* (fallback if VITE_API_URL omits /v1)
  app.use(`/api${routePath}`, routeHandler);
  // Support /* (fallback if reverse proxy strips /api)
  app.use(routePath, routeHandler);
});

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
