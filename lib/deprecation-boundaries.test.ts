import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const retiredSourcePaths = [
  'app/dashboard/(overview)/loading.tsx',
  'app/dashboard/projects/[id]/edit/not-found.tsx',
  'app/lib/actions/block-actions.ts',
  'app/lib/actions/project-actions.ts',
  'app/lib/actions/tag-actions.ts',
  'app/lib/constants.ts',
  'app/lib/data/block-data.ts',
  'app/lib/data/cached-block-data.ts',
  'app/lib/data/cached-project-data.ts',
  'app/lib/data/cached-tag-data.ts',
  'app/lib/data/project-data.ts',
  'app/lib/data/tag-data.ts',
  'app/lib/definitions/definitions.ts',
  'app/lib/external/s3-operations.ts',
  'app/lib/external/s3-resource-tracker.ts',
  'app/lib/hooks/useProjectBlocks.ts',
  'app/lib/hooks/useTags.ts',
  'app/lib/db/schema.ts',
  'app/lib/image-processing/image-processing.ts',
  'app/lib/seed-items.ts',
  'app/lib/stores/ui-store.ts',
  'app/lib/utils-client.ts',
  'app/lib/utils-server.ts',
  'components/blocks/components/block-image.tsx',
  'components/blocks/components/button.tsx',
  'components/blocks/forms/block-form.tsx',
  'components/dashboard/footer-tiptap-editor.tsx',
  'components/dashboard/header.tsx',
  'components/dashboard/nav-links.tsx',
  'components/dashboard/quick-access.tsx',
  'components/dashboard/sidenav.tsx',
  'components/dashboard/view-switcher.tsx',
  'components/editor/content-preview.tsx',
  'components/feature-showcase.tsx',
  'components/hardcoded-sticky-note.tsx',
  'components/portfolio/portfolio.css',
  'components/portfolio/portfolio-block.tsx',
  'components/portfolio/project-display.tsx',
  'components/projects/components/button.tsx',
  'components/projects/components/project-block-item.tsx',
  'components/projects/components/status.tsx',
  'components/projects/components/tag-manager.tsx',
  'components/projects/components/tiptap-editor-project-blocks.tsx',
  'components/projects/error.tsx',
  'components/projects/forms/project-form.tsx',
  'components/query-client-provider.tsx',
  'components/scrapbook',
  'components/scrapbook/code-preview.tsx',
  'components/scrapbook/fold-comments-data.ts',
  'components/scrapbook/git-inline-data.ts',
  'components/scrapbook/image-preview.tsx',
  'components/scrapbook/potato-compressor-data.ts',
  'components/scrapbook/scrapbook-board.tsx',
  'components/scrapbook/scrapbook-data.ts',
  'components/scrapbook/scrapbook-entry.tsx',
  'components/suggestions/suggestedtags.tsx',
  'components/suggestions/suggestions.tsx',
  'components/simple-auth-modal.tsx',
  'components/ui/components',
  'components/ui/components/breadcrumb.tsx',
  'components/ui/components/button.tsx',
  'components/ui/components/card.tsx',
  'components/ui/components/input.tsx',
  'components/ui/components/pagination.tsx',
  'components/ui/components/scroll-area.tsx',
  'components/ui/components/select.tsx',
  'components/ui/components/separator.tsx',
  'components/ui/components/skeletons.tsx',
  'components/ui/components/table.tsx',
  'components/ui/components/tabs.tsx',
  'components/ui/components/textarea.tsx',
  'components/ui/components/toggle-group.tsx',
  'components/ui/components/toggle.tsx',
  'components/ui/form.tsx',
  'components/ui/label.tsx',
  'dist/socket-server.js',
  'drizzle.config.ts',
  'drizzle/meta/_journal.json',
  'public/blocks/app-wireframes.pdf',
  'public/blocks/homepage-mockup.png',
  'public/blocks/logo-concepts.png',
  'public/landing-desktop.jpg',
  'public/landing-mobile.jpg',
  'public/placeholder-default.png',
  'public/placeholder-file.png',
  'public/placeholder-text.png',
  'public/scrapbook/blog-landing-preview.webp',
  'public/scrapbook/network-performance-diff.webp',
  'public/scrapbook/platform-vscode-overview.webp',
  'public/scrapbook/server-actions-example.webp',
  'public/scrapbook/tiptap-editor-demo.webp',
  'server/socket-server.cjs',
] as const;

const preservedSourcePaths = [
  'app/lib/db/db.ts',
  'drizzle/0008_proxy_health.sql',
] as const;

const retiredDirectDependencies = [
  '@anthropic-ai/sdk',
  '@aws-sdk/client-cloudfront',
  '@aws-sdk/client-s3',
  '@heroicons/react',
  '@hookform/resolvers',
  '@radix-ui/react-label',
  '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group',
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
  'drizzle-kit',
  'drizzle-orm',
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
  'file-type',
  'maath',
  'monaco-editor',
  'postgres',
  'random-words',
  'sharp',
  'suspend-react',
] as const;

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const directDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

describe('deprecation boundaries', () => {
  it.each(retiredSourcePaths)('%s stays retired', path => {
    expect(existsSync(resolve(process.cwd(), path))).toBe(false);
  });

  it.each(preservedSourcePaths)('%s remains available', path => {
    expect(existsSync(resolve(process.cwd(), path))).toBe(true);
  });

  it.each(retiredDirectDependencies)(
    '%s stays out of the direct manifest',
    name => {
      expect(directDependencies).not.toHaveProperty(name);
    }
  );

  it.each(preservedDirectDependencies)(
    '%s remains a direct dependency',
    name => {
      expect(directDependencies).toHaveProperty(name);
    }
  );
});
