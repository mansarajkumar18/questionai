import { Router } from 'express';
import { prisma } from '../config/db.js';

const router = Router();

router.get('/health', async (req, res) => {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = `unhealthy: ${err.message}`;
  }

  res.json({
    status: 'ok',
    service: 'Q-GEN AI Backend Engine',
    version: '1.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
