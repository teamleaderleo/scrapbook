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

const pool = new Pool(connectionConfig);

export const db = drizzle(pool, { schema });