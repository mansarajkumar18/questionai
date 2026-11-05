import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AIProviderService } from '../services/aiProvider.service.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Get AI Settings Status
router.get('/ai', requireAuth, async (req: Request, res: Response) => {
  try {
    const keySetting = await prisma.systemSetting.findUnique({
      where: { key: 'GEMINI_API_KEY' },
    });
    const modelSetting = await prisma.systemSetting.findUnique({
      where: { key: 'GEMINI_MODEL' },
    });

    const hasDbKey = !!keySetting && keySetting.value.trim().length > 0;
    const hasEnvKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
    const isConfigured = hasDbKey || hasEnvKey;

    const rawKey = hasDbKey ? keySetting!.value : (process.env.GEMINI_API_KEY || '');
    const maskedKey = rawKey ? `${rawKey.substring(0, 4)}••••••••••••${rawKey.slice(-4)}` : '';

    const currentModel = modelSetting?.value || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    res.json({
      success: true,
      isConfigured,
      source: hasDbKey ? 'DATABASE' : hasEnvKey ? 'ENVIRONMENT' : 'NONE',
      maskedKey,
      model: currentModel,
      availableModels: [
        { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite (Recommended - Ultra Fast & High Throughput)' },
        { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (Fast & Precise Structured JSON)' },
        { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Balanced Reasoning & Depth)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Legacy)' },
      ],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test AI Connection
router.post('/ai/test', requireAuth, async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    const result = await AIProviderService.testConnection(apiKey);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update AI Settings
router.put('/ai', requireAuth, async (req: Request, res: Response) => {
  try {
    const { apiKey, model } = req.body;

    if (apiKey !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'GEMINI_API_KEY' },
        update: { value: apiKey.trim() },
        create: { key: 'GEMINI_API_KEY', value: apiKey.trim() },
      });
    }

    if (model) {
      await prisma.systemSetting.upsert({
        where: { key: 'GEMINI_MODEL' },
        update: { value: model.trim() },
        create: { key: 'GEMINI_MODEL', value: model.trim() },
      });
    }

    res.json({
      success: true,
      message: 'AI provider settings updated successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Institution Profile via settings
router.put('/institution', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, address, contactEmail, examHeaderConfig } = req.body;
    let inst = await prisma.institution.findFirst();
    if (inst) {
      inst = await prisma.institution.update({
        where: { id: inst.id },
        data: {
          name: name?.trim(),
          address,
          contactEmail,
          examHeaderConfig: examHeaderConfig ? JSON.stringify(examHeaderConfig) : undefined,
        },
      });
    } else {
      inst = await prisma.institution.create({
        data: {
          name: name?.trim() || 'My Educational Institution',
          address,
          contactEmail,
          examHeaderConfig: examHeaderConfig ? JSON.stringify(examHeaderConfig) : undefined,
        },
      });
    }
    res.json({ success: true, institution: inst });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

