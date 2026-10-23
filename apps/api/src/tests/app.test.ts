import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import { pino } from 'pino';
import { createApp } from '../app.js';
import { AppError, serializeError } from '../errors.js';

async function withServer(
  dependencies: { mongoReady: () => boolean; redisReady: () => boolean },
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = createApp({
    corsOrigins: ['http://localhost:5173'],
    dependencies,
    logger: pino({ enabled: false }),
  });
  const server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('liveness succeeds and readiness reports dependency state', async () => {
  await withServer(
    { mongoReady: () => true, redisReady: () => false },
    async (baseUrl) => {
      const liveResponse = await fetch(`${baseUrl}/health/live`);
      assert.equal(liveResponse.status, 200);
      assert.deepEqual(await liveResponse.json(), { status: 'ok' });

      const readyResponse = await fetch(`${baseUrl}/health/ready`);
      assert.equal(readyResponse.status, 503);
      assert.deepEqual(await readyResponse.json(), {
        status: 'not_ready',
        checks: { mongodb: true, redis: false },
      });
    },
  );
});

test('readiness succeeds only when all essential dependencies are ready', async () => {
  await withServer(
    { mongoReady: () => true, redisReady: () => true },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health/ready`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        status: 'ok',
        checks: { mongodb: true, redis: true },
      });
    },
  );
});

test('malformed JSON uses the shared error envelope and a request ID', async () => {
  await withServer(
    { mongoReady: () => true, redisReady: () => true },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/request-body-test`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      });
      const requestId = response.headers.get('x-request-id');
      assert.equal(response.status, 400);
      assert.ok(requestId);
      assert.deepEqual(await response.json(), {
        success: false,
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'Request body is not valid JSON.',
          requestId,
        },
      });
    },
  );
});

test('unimplemented versioned routes return the shared not-found envelope', async () => {
  await withServer(
    { mongoReady: () => true, redisReady: () => true },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/courses`);
      const requestId = response.headers.get('x-request-id');
      assert.equal(response.status, 404);
      assert.ok(requestId);
      assert.deepEqual(await response.json(), {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No route matches GET /api/v1/courses.',
          requestId,
        },
      });
    },
  );
});

test('error serialization hides unexpected details and preserves known errors', () => {
  const unexpected = serializeError(
    new Error('private database credential'),
    'req-1',
  );
  assert.equal(unexpected.statusCode, 500);
  assert.deepEqual(unexpected.body, {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      requestId: 'req-1',
    },
  });
  assert.doesNotMatch(
    JSON.stringify(unexpected),
    /private database credential/,
  );

  const known = serializeError(
    new AppError(404, 'NOT_FOUND', 'Resource not found.'),
    'req-2',
  );
  assert.equal(known.statusCode, 404);
  assert.equal(known.body.error.code, 'NOT_FOUND');

  const oversized = serializeError({ type: 'entity.too.large' }, 'req-3');
  assert.equal(oversized.statusCode, 413);
  assert.equal(oversized.body.error.code, 'PAYLOAD_TOO_LARGE');
});
