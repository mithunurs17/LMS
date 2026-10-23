import assert from 'node:assert/strict';
import test from 'node:test';
import { ConfigurationError, parseConfig } from '../config.js';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '3100',
  MONGODB_URI: 'mongodb://localhost:27017/lms_test',
  REDIS_URL: 'redis://localhost:6379',
  CORS_ORIGINS: 'http://localhost:5173,https://lms.example.test',
  LOG_LEVEL: 'silent',
};

test('parses and normalizes a valid environment', () => {
  const config = parseConfig(validEnvironment);
  assert.equal(config.PORT, 3100);
  assert.deepEqual(config.CORS_ORIGINS, [
    'http://localhost:5173',
    'https://lms.example.test',
  ]);
});

test('rejects missing service URLs without echoing environment values', () => {
  assert.throws(
    () =>
      parseConfig({
        ...validEnvironment,
        MONGODB_URI: undefined,
        REDIS_URL: undefined,
      }),
    (error: unknown) => {
      assert.ok(error instanceof ConfigurationError);
      assert.match(error.message, /MONGODB_URI/);
      assert.match(error.message, /REDIS_URL/);
      assert.doesNotMatch(error.message, /mongodb:\/\/|redis:\/\//);
      return true;
    },
  );
});

test('rejects invalid ports and non-HTTP CORS origins', () => {
  assert.throws(
    () => parseConfig({ ...validEnvironment, PORT: '70000' }),
    ConfigurationError,
  );
  assert.throws(
    () => parseConfig({ ...validEnvironment, CORS_ORIGINS: 'file:///tmp' }),
    /CORS_ORIGINS/,
  );
});
