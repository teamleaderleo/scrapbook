import { describe, expect, it } from 'vitest';
import {
  classifyCiPaths,
  isBrowserIndependentCiPath,
} from './ci-change-classifier.mjs';

describe('CI change classifier', () => {
  it('allowlists only docs, README, and colocated unit tests', () => {
    expect(isBrowserIndependentCiPath('docs/space-continuity.md')).toBe(true);
    expect(isBrowserIndependentCiPath('README.md')).toBe(true);
    expect(isBrowserIndependentCiPath('lib/rss-feed.test.ts')).toBe(true);
    expect(isBrowserIndependentCiPath('components/example.test.tsx')).toBe(true);
  });

  it('keeps runtime, e2e, public content, package, config, and workflow changes on Chromium', () => {
    for (const path of [
      'app/space/page.tsx',
      'components/space/space-view.tsx',
      'lib/space-routes.ts',
      'tests/e2e/space-shortcuts.spec.ts',
      'public/desk/example.md',
      'package.json',
      'pnpm-lock.yaml',
      'next.config.mjs',
      'playwright.config.ts',
      'tsconfig.json',
      '.github/workflows/ci.yml',
      'scripts/new-tool.mjs',
      'mystery.file',
    ]) {
      expect(isBrowserIndependentCiPath(path), path).toBe(false);
    }
  });

  it('runs Chromium when any browser-relevant path is present', () => {
    expect(
      classifyCiPaths([
        'docs/notes.md',
        'lib/rss-feed.test.ts',
        'lib/rss-feed.ts',
      ])
    ).toMatchObject({
      runBrowser: true,
      browserRelevantPaths: ['lib/rss-feed.ts'],
    });
  });

  it('allows Chromium to skip when every path is allowlisted', () => {
    expect(
      classifyCiPaths([
        'README.md',
        'docs/notes.md',
        'lib/rss-feed.test.ts',
      ])
    ).toMatchObject({
      runBrowser: false,
      browserRelevantPaths: [],
    });
  });

  it('deduplicates and normalizes Windows-style paths', () => {
    const result = classifyCiPaths([
      'docs\\notes.md',
      ' docs/notes.md ',
      'lib\\rss-feed.test.ts',
    ]);

    expect(result.runBrowser).toBe(false);
    expect(result.browserIndependentPaths).toEqual([
      'docs/notes.md',
      'lib/rss-feed.test.ts',
    ]);
  });

  it('fails safe when no changed paths were resolved', () => {
    expect(classifyCiPaths([])).toMatchObject({
      runBrowser: true,
      browserRelevantPaths: [],
    });
  });
});
