import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGODB_URI: z
    .string()
    .trim()
    .min(1)
    .refine((value) => /^mongodb(?:\+srv)?:\/\//.test(value), {
      message: 'must be a MongoDB connection URI',
    }),
  REDIS_URL: z
    .string()
    .trim()
    .min(1)
    .refine((value) => /^rediss?:\/\//.test(value), {
      message: 'must be a Redis connection URL',
    }),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export type AppConfig = Omit<z.infer<typeof configSchema>, 'CORS_ORIGINS'> & {
  CORS_ORIGINS: string[];
};

export class ConfigurationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid environment configuration: ${issues.join(', ')}`);
    this.name = 'ConfigurationError';
  }
}

export function parseConfig(environment: NodeJS.ProcessEnv): AppConfig {
  const result = configSchema.safeParse(environment);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const key = issue.path.join('.') || 'environment';
      return `${key}: ${issue.message}`;
    });
    throw new ConfigurationError(issues);
  }

  const origins = result.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  for (const origin of origins) {
    try {
      const parsedOrigin = new URL(origin);
      if (
        parsedOrigin.protocol !== 'http:' &&
        parsedOrigin.protocol !== 'https:'
      ) {
        throw new Error();
      }
    } catch {
      throw new ConfigurationError([
        'CORS_ORIGINS: must be a comma-separated list of HTTP(S) origins',
      ]);
    }
  }

  return { ...result.data, CORS_ORIGINS: origins };
}
