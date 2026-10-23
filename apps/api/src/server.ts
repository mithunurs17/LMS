import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { pino } from 'pino';
import { createClient } from 'redis';
import { createApp } from './app.js';
import { parseConfig } from './config.js';

dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env'),
});

async function startServer(): Promise<void> {
  let config;
  try {
    config = parseConfig(process.env);
  } catch (error) {
    const issues =
      error instanceof Error
        ? error.message
        : 'Invalid environment configuration';
    console.error(JSON.stringify({ level: 'error', message: issues }));
    process.exitCode = 1;
    return;
  }

  const logger = pino({ level: config.LOG_LEVEL });
  const redis = createClient({ url: config.REDIS_URL });
  redis.on('error', (error: Error) => {
    logger.error(
      { service: 'redis', errorName: error.name },
      'Redis client error',
    );
  });

  try {
    await Promise.all([mongoose.connect(config.MONGODB_URI), redis.connect()]);
  } catch (error) {
    logger.fatal(
      { errorName: error instanceof Error ? error.name : 'UnknownError' },
      'API dependency startup failed',
    );
    if (redis.isOpen) await redis.quit();
    await mongoose.disconnect();
    process.exitCode = 1;
    return;
  }

  const app = createApp({
    corsOrigins: config.CORS_ORIGINS,
    dependencies: {
      mongoReady: () => mongoose.connection.readyState === 1,
      redisReady: () => redis.isReady,
    },
    logger,
  });
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'API listening');
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'API shutdown started');
    server.close(async (error) => {
      if (error)
        logger.error({ errorName: error.name }, 'HTTP server shutdown failed');
      if (redis.isOpen) await redis.quit();
      await mongoose.disconnect();
      process.exitCode = error ? 1 : 0;
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

void startServer();
