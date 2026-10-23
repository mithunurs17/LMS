import type { Request, Response } from 'express';

export interface HealthDependencies {
  mongoReady: () => boolean;
  redisReady: () => boolean;
}

export function liveHandler(_request: Request, response: Response): void {
  response.status(200).json({ status: 'ok' });
}

export function readyHandler(dependencies: HealthDependencies) {
  return (_request: Request, response: Response): void => {
    const checks = {
      mongodb: dependencies.mongoReady(),
      redis: dependencies.redisReady(),
    };
    const ready = Object.values(checks).every(Boolean);
    response
      .status(ready ? 200 : 503)
      .json({ status: ready ? 'ok' : 'not_ready', checks });
  };
}
