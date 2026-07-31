import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const retiredPaths = [
  'app/lib/hooks/useProjectBlocks.ts',
  'app/lib/utils-client.ts',
  'app/lib/utils-server.ts',
  'components/blocks/components/block-image.tsx',
  'components/blocks/forms/block-form.tsx',
  'components/portfolio/portfolio-block.tsx',
  'components/portfolio/project-display.tsx',
  'components/projects/components/project-block-item.tsx',
  'components/projects/forms/project-form.tsx',
  'components/scrapbook/code-preview.tsx',
  'components/scrapbook/fold-comments-data.ts',
  'components/scrapbook/git-inline-data.ts',
  'components/scrapbook/image-preview.tsx',
  'components/scrapbook/potato-compressor-data.ts',
  'components/scrapbook/scrapbook-board.tsx',
  'components/scrapbook/scrapbook-data.ts',
  'components/scrapbook/scrapbook-entry.tsx',
  'components/ui/components/pagination.tsx',
] as const;

describe('disconnected legacy showcase boundary', () => {
  it.each(retiredPaths)('%s stays out of the active source tree', (path) => {
    expect(existsSync(resolve(process.cwd(), path))).toBe(false);
  });

  it('removes the retired Scrapbook showcase component directory', () => {
    expect(existsSync(resolve(process.cwd(), 'components/scrapbook'))).toBe(false);
  });
});
