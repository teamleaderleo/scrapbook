import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const retiredPaths = [
  'app/lib/constants.ts',
  'app/lib/db/db.ts',
  'app/lib/definitions/definitions.ts',
  'app/lib/external/s3-operations.ts',
  'app/lib/external/s3-resource-tracker.ts',
  'app/lib/image-processing/image-processing.ts',
  'app/lib/seed-items.ts',
  'server/socket-server.cjs',
] as const;

const preservedDatabasePaths = [
  'app/lib/db/schema.ts',
  'drizzle.config.ts',
  'drizzle/0008_proxy_health.sql',
] as const;

describe('disconnected infrastructure boundary', () => {
  it.each(retiredPaths)('%s stays out of the active source tree', (path) => {
    expect(existsSync(resolve(process.cwd(), path))).toBe(false);
  });

  it.each(preservedDatabasePaths)('%s remains available', (path) => {
    expect(existsSync(resolve(process.cwd(), path))).toBe(true);
  });
});
