import 'dotenv/config';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type PostgresClient = ReturnType<typeof postgres>;

let clientInstance: PostgresClient | null = null;
let databaseInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabaseClient(): PostgresClient {
  if (clientInstance) return clientInstance;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in the environment variables');
  }

  clientInstance = postgres(databaseUrl, { prepare: false });
  return clientInstance;
}

const lazyClientTarget = (() => undefined) as unknown as PostgresClient;

export const client = new Proxy(lazyClientTarget, {
  apply(_target, _thisArg, argumentsList) {
    const activeClient = getDatabaseClient();
    return Reflect.apply(activeClient, activeClient, argumentsList);
  },
  get(_target, property) {
    const activeClient = getDatabaseClient();
    const value = Reflect.get(activeClient, property, activeClient);
    return typeof value === 'function' ? value.bind(activeClient) : value;
  },
});

export function getDatabase() {
  if (databaseInstance) return databaseInstance;
  databaseInstance = drizzle(getDatabaseClient(), { schema });
  return databaseInstance;
}
