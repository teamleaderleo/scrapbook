import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const retiredLegacyPaths = [
  'app/lib/actions/block-actions.ts',
  'app/lib/actions/project-actions.ts',
  'app/lib/actions/tag-actions.ts',
  'app/lib/data/block-data.ts',
  'app/lib/data/cached-block-data.ts',
  'app/lib/data/cached-project-data.ts',
  'app/lib/data/cached-tag-data.ts',
  'app/lib/data/project-data.ts',
  'app/lib/data/tag-data.ts',
  'app/lib/hooks/useTags.ts',
  'app/lib/stores/ui-store.ts',
  'components/blocks/components/button.tsx',
  'components/dashboard/header.tsx',
  'components/dashboard/nav-links.tsx',
  'components/dashboard/sidenav.tsx',
  'components/projects/components/button.tsx',
] as const;

describe('retired dashboard runtime boundary', () => {
  it.each(retiredLegacyPaths)('%s stays out of the active source tree', (path) => {
    expect(existsSync(resolve(process.cwd(), path))).toBe(false);
  });
});
