import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import pino from 'pino';
import { initWebSocket } from './websocket/server';
import { connectDatabase } from './database/db';
import { healthRouter } from './routes/health';
import { servicesRouter } from './routes/services';
import { cloudRouter } from './routes/cloud';
import { agentRouter } from './routes/agent';
import { actionsRouter } from './routes/actions';
import { scenariosRouter } from './routes/scenarios';
import { configRouter } from './routes/config';

dotenv.config();

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

const app = express();

// Security & Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

// Request ID & Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  (req as any).requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  logger.info({ requestId: reqId, method: req.method, path: req.url }, 'Incoming request');
  next();
});

// API Routes Mounting
app.use('/api', healthRouter);
app.use('/api', servicesRouter);
app.use('/api', cloudRouter);
app.use('/api', agentRouter);
app.use('/api', actionsRouter);
app.use('/api', scenariosRouter);
app.use('/api', configRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The endpoint ${req.method} ${req.originalUrl} does not exist.`,
    },
    requestId: (req as any).requestId,
  });
});

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, requestId: (req as any).requestId }, 'Unhandled server error');
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
    },
    requestId: (req as any).requestId,
  });
});

const server = http.createServer(app);
initWebSocket(server);

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  await connectDatabase();

  server.listen(PORT, () => {
    logger.info(`CloudGuard AI Backend running smoothly on http://localhost:${PORT}`);
    logger.info(`WebSocket Gateway available at ws://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start CloudGuard AI Backend');
  process.exit(1);
});
