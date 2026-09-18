import { Router } from 'express';
import { z } from 'zod';
import { agent } from '../agent/agent';
import { AuditRepository } from '../models/records';

export const agentRouter = Router();

const runPromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required and cannot be empty'),
});

agentRouter.post('/agent/run', async (req, res, next) => {
  try {
    const parseResult = runPromptSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.issues,
        },
        requestId: (req as any).requestId,
      });
    }

    const { prompt } = parseResult.data;
    const report = await agent.runTask(prompt);

    res.json({
      success: true,
      data: report,
      requestId: (req as any).requestId,
    });
  } catch (err: any) {
    next(err);
  }
});

agentRouter.get('/agent/runs', async (req, res) => {
  const runs = await AuditRepository.getAllAgentRuns();
  res.json({
    success: true,
    data: runs,
    requestId: (req as any).requestId,
  });
});

agentRouter.get('/agent/runs/:runId', async (req, res) => {
  const run = await AuditRepository.getAgentRunById(req.params.runId);
  if (!run) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Run ${req.params.runId} not found` },
      requestId: (req as any).requestId,
    });
  }
  res.json({
    success: true,
    data: run,
    requestId: (req as any).requestId,
  });
});

agentRouter.post('/agent/runs/:runId/cancel', (req, res) => {
  res.json({
    success: true,
    data: { message: `Cancellation requested for run ${req.params.runId}` },
    requestId: (req as any).requestId,
  });
});
