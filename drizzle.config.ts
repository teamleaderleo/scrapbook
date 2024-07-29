import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
config({ path: '.env' });

export default defineConfig({
  schema: './app/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // 'postgresql' | 'mysql' | 'sqlite'
  dbCredentials: {
    url: process.env.SUPABASE_DATABASE_URL!,
    ssl: true,
  },
});
