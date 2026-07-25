import 'dotenv/config';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let clientInstance: ReturnType<typeof postgres> | null = null;
let databaseInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabaseClient() {
  if (clientInstance) return clientInstance;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in the environment variables');
  }

  clientInstance = postgres(databaseUrl, { prepare: false });
  return clientInstance;
}

export function getDatabase() {
  if (databaseInstance) return databaseInstance;
  databaseInstance = drizzle(getDatabaseClient(), { schema });
  return databaseInstance;
}
