import { Router } from 'express';
import { simulator } from '../cloud/simulator';

export const cloudRouter = Router();

cloudRouter.get('/cloud/summary', (req, res) => {
  res.json({
    success: true,
    data: simulator.getCloudSummary(),
    requestId: (req as any).requestId,
  });
});

cloudRouter.get('/cloud/cost-history', (req, res) => {
  res.json({
    success: true,
    data: simulator.getCostHistory(),
    requestId: (req as any).requestId,
  });
});

cloudRouter.get('/cloud/instance-history', (req, res) => {
  res.json({
    success: true,
    data: simulator.getInstanceHistory(),
    requestId: (req as any).requestId,
  });
});
