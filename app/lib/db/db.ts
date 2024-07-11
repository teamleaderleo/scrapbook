import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Check if we have a full database URL
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let connectionConfig;

if (databaseUrl) {
  // If we have a full URL, use it
  connectionConfig = {
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  };
  console.log('Using database URL:', databaseUrl.replace(/:[^:@]+@/, ':***@')); // Mask the password
} else {
  // Otherwise, use individual fields
  connectionConfig = {
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: {
      rejectUnauthorized: false
    }
  };
  console.log('Database connection config:', {
    host: connectionConfig.host,
    user: connectionConfig.user,
    database: connectionConfig.database,
  });
}

const pool = new Pool(connectionConfig);

export const db = drizzle(pool, { schema });