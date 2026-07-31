import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const retiredPaths = [
  'app/dashboard/(overview)/loading.tsx',
  'app/dashboard/projects/[id]/edit/not-found.tsx',
  'components/dashboard/quick-access.tsx',
  'components/dashboard/view-switcher.tsx',
  'components/feature-showcase.tsx',
  'components/projects/components/status.tsx',
  'components/suggestions/suggestedtags.tsx',
  'components/suggestions/suggestions.tsx',
  'components/ui/components/button.tsx',
  'components/ui/components/skeletons.tsx',
  'components/ui/form.tsx',
  'components/ui/label.tsx',
] as const;

const retiredDirectDependencies = [
  '@anthropic-ai/sdk',
  '@aws-sdk/client-cloudfront',
  '@aws-sdk/client-s3',
  '@heroicons/react',
  '@hookform/resolvers',
  '@radix-ui/react-label',
  '@radix-ui/themes',
  '@tanstack/react-query',
  '@vercel/postgres',
  '@virtuoso.dev/message-list',
  '@types/bcrypt',
  '@types/pg',
  '@types/react-beautiful-dnd',
  '@types/react-syntax-highlighter',
  '@types/uuid',
  '@types/ws',
  'bcryptjs',
  'drizzle-zod',
  'mitt',
  'modern-monaco',
  'node-vibrant',
  'pg',
  'react-hook-form',
  'react-icons',
  'react-syntax-highlighter',
  'react-virtuoso',
  'swr',
  'use-debounce',
  'uuid',
  'ws',
  'zustand',
] as const;

const preservedDirectDependencies = [
  '@shikijs/monaco',
  'drizzle-orm',
  'drizzle-kit',
  'file-type',
  'maath',
  'monaco-editor',
  'postgres',
  'random-words',
  'sharp',
  'suspend-react',
] as const;

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const directDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

describe('orphan UI and dependency retirement boundary', () => {
  it.each(retiredPaths)('%s stays out of the active source tree', (path) => {
    expect(existsSync(resolve(process.cwd(), path))).toBe(false);
  });

  it.each(retiredDirectDependencies)('%s stays out of the direct manifest', (name) => {
    expect(directDependencies).not.toHaveProperty(name);
  });

  it.each(preservedDirectDependencies)('%s remains a direct dependency', (name) => {
    expect(directDependencies).toHaveProperty(name);
  });
});
