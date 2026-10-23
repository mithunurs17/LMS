import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import type { Logger } from 'pino';
import { AppError, serializeError } from './errors.js';
import {
  liveHandler,
  readyHandler,
  type HealthDependencies,
} from './health.js';

export interface AppOptions {
  corsOrigins: string[];
  dependencies: HealthDependencies;
  logger?: Logger;
}

export function createApp(options: AppOptions) {
  const app = express();
  const logger = options.logger ?? pino({ level: 'info' });

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: options.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      maxAge: 600,
    }),
  );
  app.use(
    pinoHttp({
      logger,
      genReqId: () => randomUUID(),
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    }),
  );
  app.use((request, response, next) => {
    request.id = String(request.id);
    response.setHeader('X-Request-Id', request.id);
    next();
  });
  app.use(express.json({ limit: '1mb' }));

  app.get('/health/live', liveHandler);
  app.get('/health/ready', readyHandler(options.dependencies));
  app.use('/api/v1', express.Router());
  app.use((request, _response, next) => {
    next(
      new AppError(
        404,
        'NOT_FOUND',
        `No route matches ${request.method} ${request.path}.`,
      ),
    );
  });

  const errorHandler: ErrorRequestHandler = (
    error,
    request,
    response,
    next,
  ) => {
    void next;
    const serialized = serializeError(error, String(request.id));
    request.log.error(
      { statusCode: serialized.statusCode, code: serialized.body.error.code },
      'Request failed',
    );
    response.status(serialized.statusCode).json(serialized.body);
  };
  app.use(errorHandler);

  return app;
}
