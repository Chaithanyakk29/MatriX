import { Router } from 'express';
import { AuditRepository } from '../models/records';
import { safetyEngine } from '../safety/safetyEngine';
import { simulator } from '../cloud/simulator';

export const actionsRouter = Router();

actionsRouter.get('/actions', async (req, res) => {
  const actions = await AuditRepository.getAllActions();
  res.json({
    success: true,
    data: actions,
    requestId: (req as any).requestId,
  });
});

actionsRouter.get('/actions/:actionId', async (req, res) => {
  const action = await AuditRepository.getActionById(req.params.actionId);
  if (!action) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Action ${req.params.actionId} not found` },
      requestId: (req as any).requestId,
    });
  }
  res.json({
    success: true,
    data: action,
    requestId: (req as any).requestId,
  });
});

actionsRouter.post('/actions/:actionId/revalidate', async (req, res) => {
  const action = await AuditRepository.getActionById(req.params.actionId);
  if (!action) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Action ${req.params.actionId} not found` },
      requestId: (req as any).requestId,
    });
  }

  const validation = safetyEngine.validateAction({
    action: action.action,
    service_id: action.serviceId,
    target_instances: action.requestedInstances,
  });

  res.json({
    success: true,
    data: {
      actionId: action.actionId,
      currentSafetyResult: validation,
    },
    requestId: (req as any).requestId,
  });
});

actionsRouter.get('/actions/:actionId/verification', async (req, res) => {
  const action = await AuditRepository.getActionById(req.params.actionId);
  if (!action) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Action ${req.params.actionId} not found` },
      requestId: (req as any).requestId,
    });
  }

  const currentVerification = simulator.verifyService(action.serviceId);

  res.json({
    success: true,
    data: {
      recordedVerification: action.verification,
      liveVerification: currentVerification,
    },
    requestId: (req as any).requestId,
  });
});
