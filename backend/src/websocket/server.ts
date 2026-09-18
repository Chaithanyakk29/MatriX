import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import pino from 'pino';

const logger = pino({ name: 'websocket' });

let wss: WebSocketServer | null = null;

export interface WsEventPayload {
  runId?: string;
  eventId: string;
  type:
    | 'agent_started'
    | 'investigation_started'
    | 'tool_called'
    | 'tool_completed'
    | 'metric_fetched'
    | 'decision_made'
    | 'safety_check_started'
    | 'safety_check_passed'
    | 'safety_check_failed'
    | 'action_started'
    | 'action_succeeded'
    | 'action_failed'
    | 'verification_started'
    | 'verification_succeeded'
    | 'verification_failed'
    | 'agent_completed'
    | 'agent_error'
    | 'cloud_updated';
  timestamp: string;
  message: string;
  data?: any;
}

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    logger.info('WebSocket client connected.');

    // Send initial handshake
    ws.send(
      JSON.stringify({
        eventId: `evt-${Date.now()}`,
        type: 'cloud_updated',
        timestamp: new Date().toISOString(),
        message: 'Connected to CloudGuard AI Real-time Gateway',
      })
    );

    ws.on('close', () => {
      logger.info('WebSocket client disconnected.');
    });

    ws.on('error', (err) => {
      logger.error('WebSocket client error:', err);
    });
  });
}

export function broadcastEvent(
  type: WsEventPayload['type'],
  message: string,
  data?: any,
  runId?: string
) {
  if (!wss) return;

  const payload: WsEventPayload = {
    runId,
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    timestamp: new Date().toISOString(),
    message,
    data,
  };

  const str = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(str);
    }
  });
}
