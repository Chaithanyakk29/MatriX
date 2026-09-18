import { Router } from 'express';
import { simulator } from '../cloud/simulator';
import { broadcastEvent } from '../websocket/server';

export const scenariosRouter = Router();

scenariosRouter.get('/scenarios', (req, res) => {
  res.json({
    success: true,
    data: simulator.getAvailableScenarios(),
    requestId: (req as any).requestId,
  });
});

scenariosRouter.get('/scenarios/:scenarioId', (req, res) => {
  const scenarios = simulator.getAvailableScenarios();
  const scenario = scenarios.find(s => s.id === req.params.scenarioId);
  if (!scenario) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Scenario ${req.params.scenarioId} not found` },
      requestId: (req as any).requestId,
    });
  }
  res.json({
    success: true,
    data: scenario,
    requestId: (req as any).requestId,
  });
});

scenariosRouter.post('/scenarios/:scenarioId/load', (req, res) => {
  const success = simulator.loadScenario(req.params.scenarioId);
  if (!success) {
    return res.status(404).json({
      success: false,
      error: { code: 'LOAD_FAILED', message: `Failed to load scenario ${req.params.scenarioId}` },
      requestId: (req as any).requestId,
    });
  }

  broadcastEvent('cloud_updated', `Loaded scenario '${req.params.scenarioId}'`, {
    scenarioId: req.params.scenarioId,
    services: simulator.getAllServices(),
  });

  res.json({
    success: true,
    data: {
      message: `Scenario ${req.params.scenarioId} loaded successfully`,
      services: simulator.getAllServices(),
      summary: simulator.getCloudSummary(),
    },
    requestId: (req as any).requestId,
  });
});

scenariosRouter.post('/scenarios/reset', (req, res) => {
  simulator.resetToDefault();
  broadcastEvent('cloud_updated', 'Reset cloud environment to baseline defaults', {
    scenarioId: 'default',
    services: simulator.getAllServices(),
  });

  res.json({
    success: true,
    data: {
      message: 'Cloud environment successfully reset to default baseline',
      services: simulator.getAllServices(),
      summary: simulator.getCloudSummary(),
    },
    requestId: (req as any).requestId,
  });
});
