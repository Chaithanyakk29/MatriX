import nodemailer from 'nodemailer';
import { broadcastEvent } from '../websocket/server';

export interface AnomalyPayload {
  serviceId: string;
  serviceName?: string;
  type: 'latency_sla_breach' | 'unhealthy_service' | 'traffic_surge' | 'safety_gate_blocked' | 'capacity_fault';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  currentValue: string | number;
  threshold: string | number;
  description: string;
  proposedRemediation: string;
  telemetry?: Record<string, any>;
}

export interface AlertEmailRecord {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  serviceId: string;
  type: string;
  previewUrl?: string | null;
  status: 'sent' | 'failed' | 'simulated';
  error?: string;
}

class MailerService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitializing: boolean = false;
  private lastAlertTimes: Map<string, number> = new Map();
  private alertHistory: AlertEmailRecord[] = [];
  private operatorEmail: string = process.env.ALERT_OPERATOR_EMAIL || 'sre-operator@atleos.com';

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    if (this.transporter || this.isInitializing) return;
    this.isInitializing = true;

    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        console.log(`[Mailer] Initialized custom SMTP transporter for ${process.env.SMTP_HOST}`);
      } else {
        // Create an Ethereal test inbox for instant development & hackathon demo previews
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`[Mailer] Initialized Ethereal test mailer account: ${testAccount.user}`);
      }
    } catch (err: any) {
      console.warn(`[Mailer] Fallback to JSON transport: ${err.message}`);
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    } finally {
      this.isInitializing = false;
    }
  }

  public getHistory(): AlertEmailRecord[] {
    return [...this.alertHistory];
  }

  public clearHistory(): void {
    this.alertHistory = [];
  }

  public async sendAnomalyAlert(anomaly: AnomalyPayload, forceSend: boolean = false): Promise<AlertEmailRecord> {
    const throttleKey = `${anomaly.serviceId}:${anomaly.type}`;
    const now = Date.now();
    const lastSent = this.lastAlertTimes.get(throttleKey) || 0;

    // Throttle duplicate anomaly alerts (2 minutes) unless forceSend is true
    if (!forceSend && now - lastSent < 120000) {
      const existing = this.alertHistory.find((a) => a.serviceId === anomaly.serviceId && a.type === anomaly.type);
      if (existing) return existing;
    }

    if (!this.transporter) {
      await this.initTransporter();
    }

    this.lastAlertTimes.set(throttleKey, now);

    const alertId = `alert-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const subject = `🚨 [${anomaly.severity}] CloudGuard SRE Alert: ${anomaly.serviceId} - ${anomaly.type.replace(/_/g, ' ').toUpperCase()}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
    .header { background: ${anomaly.severity === 'CRITICAL' ? '#e11d48' : '#f59e0b'}; padding: 18px 24px; color: #ffffff; font-weight: bold; font-size: 16px; }
    .content { padding: 24px; }
    .metric-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #3b82f6; color: white; }
    .footer { padding: 16px 24px; background: #0f172a; font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ⚠️ SRE INCIDENT DISPATCH: ${anomaly.severity}
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #ffffff;">Service: ${anomaly.serviceName || anomaly.serviceId}</h2>
      <p style="color: #cbd5e1; font-size: 14px;">CloudGuard AI has detected an operational anomaly requiring operator visibility:</p>
      
      <div class="metric-box">
        <div><strong>Anomaly:</strong> ${anomaly.description}</div>
        <div style="margin-top: 8px;"><strong>Current Metric:</strong> <span style="color: #f43f5e;">${anomaly.currentValue}</span> (Threshold: ${anomaly.threshold})</div>
        <div style="margin-top: 8px;"><strong>Cluster:</strong> gke-prod-uscentral1-atleos</div>
        <div style="margin-top: 8px;"><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
      </div>

      <h3 style="color: #60a5fa; font-size: 14px;">Autonomous Recommendation / Mitigation:</h3>
      <p style="background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; padding: 10px 14px; font-size: 13px; color: #e2e8f0;">
        ${anomaly.proposedRemediation}
      </p>
    </div>
    <div class="footer">
      Dispatched autonomously by CloudGuard SRE Engine • Confidential NCR Atleos Infrastructure
    </div>
  </div>
</body>
</html>
    `;

    const record: AlertEmailRecord = {
      id: alertId,
      timestamp: new Date().toISOString(),
      recipient: this.operatorEmail,
      subject,
      severity: anomaly.severity,
      serviceId: anomaly.serviceId,
      type: anomaly.type,
      status: 'sent',
    };

    try {
      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: '"CloudGuard SRE Alerting" <alerts@cloudguard.atleos.com>',
          to: this.operatorEmail,
          subject,
          text: `CloudGuard Alert: ${anomaly.severity} on ${anomaly.serviceId}. ${anomaly.description}. Mitigation: ${anomaly.proposedRemediation}`,
          html,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          record.previewUrl = previewUrl as string;
          console.log(`[Mailer] 📧 Email sent! Preview URL: ${previewUrl}`);
        }
      }
    } catch (err: any) {
      console.error(`[Mailer] Failed to dispatch alert email: ${err.message}`);
      record.status = 'failed';
      record.error = err.message;
    }

    this.alertHistory.unshift(record);
    if (this.alertHistory.length > 50) this.alertHistory.pop();

    // Broadcast WebSocket notification to frontend
    broadcastEvent('operator_alert_sent', `Operator Alert: ${anomaly.severity} on ${anomaly.serviceId}`, {
      ...record,
      anomaly,
    });

    return record;
  }
}

export const mailer = new MailerService();
