import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('SUPABASE_DATABASE_URL is not set in the environment variables');
}

const connectionConfig = {
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
};

console.log('Using Supabase database URL:', databaseUrl.replace(/:[^:@]+@/, ':***@')); // Mask the password

let db: ReturnType<typeof drizzle>;

if (typeof window === 'undefined') {
  // Server-side code
  const pool = new Pool(connectionConfig);
  db = drizzle(pool, { schema });
} else {
  // Client-side code
  console.warn('Attempted to use database on the client-side. This is not supported.');
  db = null as any;
}

export { db };