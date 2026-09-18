import { Router } from 'express';
import { z } from 'zod';
import { agent } from '../agent/agent';

export const configRouter = Router();

configRouter.get('/config/llm-status', async (req, res) => {
  const isMistralUp = await agent.checkMistralHealth();
  res.json({
    success: true,
    data: {
      provider: 'mistral',
      model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
      apiUrl: process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions',
      status: isMistralUp ? 'connected' : 'offline',
      demoModeActive: agent.isDemoMode(),
    },
    requestId: (req as any).requestId,
  });
});

const demoModeSchema = z.object({
  enabled: z.boolean(),
});

configRouter.post('/config/demo-mode', (req, res) => {
  const parseResult = demoModeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'enabled boolean is required' },
      requestId: (req as any).requestId,
    });
  }

  agent.setDemoMode(parseResult.data.enabled);

  res.json({
    success: true,
    data: {
      demoModeActive: agent.isDemoMode(),
      message: `Deterministic demo mode is now ${agent.isDemoMode() ? 'ENABLED' : 'DISABLED'}`,
    },
    requestId: (req as any).requestId,
  });
});
