import { Router } from 'express';
import { z } from 'zod';
import { mailer } from '../services/mailer';

export const alertsRouter = Router();

alertsRouter.get('/alerts/history', (req, res) => {
  res.json({
    success: true,
    data: mailer.getHistory(),
    requestId: (req as any).requestId,
  });
});

const testAlertSchema = z.object({
  serviceId: z.string().default('payment-api'),
  severity: z.enum(['CRITICAL', 'WARNING', 'INFO']).default('CRITICAL'),
  type: z.enum(['latency_sla_breach', 'unhealthy_service', 'traffic_surge', 'safety_gate_blocked', 'capacity_fault']).default('latency_sla_breach'),
  description: z.string().default('Latency exceeded 300ms SLA target (observed 410ms)'),
  proposedRemediation: z.string().default('Provision additional replica to absorb transaction surge'),
  currentValue: z.union([z.string(), z.number()]).default(410),
  threshold: z.union([z.string(), z.number()]).default(300),
});

alertsRouter.post('/alerts/test', async (req, res) => {
  try {
    const parsed = testAlertSchema.safeParse(req.body);
    const data = parsed.success ? parsed.data : {
      serviceId: 'payment-api',
      severity: 'CRITICAL' as const,
      type: 'latency_sla_breach' as const,
      description: 'Latency exceeded 300ms SLA target (observed 410ms)',
      proposedRemediation: 'Provision additional replica to absorb transaction surge',
      currentValue: 410,
      threshold: 300,
    };

    const record = await mailer.sendAnomalyAlert(data, true);
    res.json({
      success: true,
      data: record,
      requestId: (req as any).requestId,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'ALERT_FAILED', message: err.message },
      requestId: (req as any).requestId,
    });
  }
});
