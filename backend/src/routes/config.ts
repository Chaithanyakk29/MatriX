import { Router } from 'express';
import { z } from 'zod';
import { agent } from '../agent/agent';

export const configRouter = Router();

configRouter.get('/config/llm-status', async (req, res) => {
  const isOllamaUp = await agent.checkOllamaHealth();
  res.json({
    success: true,
    data: {
      provider: 'ollama',
      model: process.env.LLM_MODEL || 'qwen2.5:7b',
      apiUrl: process.env.LLM_API_URL || 'http://localhost:11434/v1/chat/completions',
      status: isOllamaUp ? 'connected' : 'offline',
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
