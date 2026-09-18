import { Router } from 'express';
import { z } from 'zod';
import { simulator } from '../cloud/simulator';
import { AuditRepository } from '../models/records';

export const servicesRouter = Router();

servicesRouter.get('/services', (req, res) => {
  const services = simulator.getAllServices();
  res.json({
    success: true,
    data: services,
    requestId: (req as any).requestId,
  });
});

servicesRouter.get('/services/:serviceId', (req, res) => {
  const service = simulator.getService(req.params.serviceId);
  if (!service) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Service ${req.params.serviceId} not found` },
      requestId: (req as any).requestId,
    });
  }
  res.json({
    success: true,
    data: service,
    requestId: (req as any).requestId,
  });
});

servicesRouter.get('/services/:serviceId/metrics', (req, res) => {
  const metrics = simulator.getServiceMetrics(req.params.serviceId);
  if (!metrics) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Service ${req.params.serviceId} not found` },
      requestId: (req as any).requestId,
    });
  }
  res.json({
    success: true,
    data: metrics,
    requestId: (req as any).requestId,
  });
});

servicesRouter.get('/services/:serviceId/traffic', (req, res) => {
  const traffic = simulator.getLatestTraffic(req.params.serviceId);
  if (!traffic) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Service ${req.params.serviceId} not found` },
      requestId: (req as any).requestId,
    });
  }
  res.json({
    success: true,
    data: traffic,
    requestId: (req as any).requestId,
  });
});

servicesRouter.get('/services/:serviceId/events', async (req, res) => {
  const events = await AuditRepository.getEventsByService(req.params.serviceId);
  res.json({
    success: true,
    data: events,
    requestId: (req as any).requestId,
  });
});

servicesRouter.get('/services/:serviceId/cost', (req, res) => {
  const cost = simulator.getServiceCost(req.params.serviceId);
  if (!cost) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Service ${req.params.serviceId} not found` },
      requestId: (req as any).requestId,
    });
  }
  res.json({
    success: true,
    data: cost,
    requestId: (req as any).requestId,
  });
});

servicesRouter.get('/services/:serviceId/verify', (req, res) => {
  const verification = simulator.verifyService(req.params.serviceId);
  res.json({
    success: true,
    data: verification,
    requestId: (req as any).requestId,
  });
});
