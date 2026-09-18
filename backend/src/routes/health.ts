import { Router } from 'express';
import { getDatabaseStatus } from '../database/db';
import { agent } from '../agent/agent';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'CloudGuard AI Backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
    requestId: (req as any).requestId,
  });
});

healthRouter.get('/system/status', async (req, res) => {
  const isOllamaUp = await agent.checkOllamaHealth();
  const dbStatus = getDatabaseStatus();

  res.json({
    success: true,
    data: {
      system: 'online',
      database: dbStatus,
      aiProvider: {
        provider: 'Ollama / Local Qwen',
        status: isOllamaUp ? 'connected' : 'offline',
        activeMode: isOllamaUp && !agent.isDemoMode() ? 'ollama' : 'deterministic_demo_mode',
        model: process.env.LLM_MODEL || 'qwen2.5:7b',
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
    requestId: (req as any).requestId,
  });
});

healthRouter.get('/system/config-status', (req, res) => {
  // Safe config view without leaking sensitive credentials
  res.json({
    success: true,
    data: {
      port: process.env.PORT || 3001,
      llmModel: process.env.LLM_MODEL || 'qwen2.5:7b',
      hasMongoConfigured: Boolean(process.env.MONGO_URI),
      demoModeActive: agent.isDemoMode(),
    },
    requestId: (req as any).requestId,
  });
});
