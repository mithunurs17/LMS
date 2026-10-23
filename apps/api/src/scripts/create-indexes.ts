import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { parseConfig } from '../config.js';

dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../../.env'),
});

async function createIndexes(): Promise<void> {
  const config = parseConfig(process.env);
  await mongoose.connect(config.MONGODB_URI);
  console.info(
    JSON.stringify({ message: 'No domain indexes are registered in Phase 1.' }),
  );
  await mongoose.disconnect();
}

void createIndexes().catch(async (error: unknown) => {
  console.error(
    JSON.stringify({
      message: 'Database index setup failed',
      errorName: error instanceof Error ? error.name : 'UnknownError',
    }),
  );
  await mongoose.disconnect();
  process.exitCode = 1;
});
