import { describe, expect, it } from 'vitest';
import {
  classifyCiPaths,
  isBrowserIndependentCiPath,
  isWritingFastPassChange,
  isWritingFastPassPath,
} from './ci-change-classifier.mjs';

describe('CI change classifier', () => {
  it('recognizes ordinary writing paths', () => {
    for (const path of [
      'README.md',
      'AGENTS.md',
      'docs/space-continuity.md',
      'public/desk/example.md',
      'public/journal/2026-08-22-note.md',
      'lib/agent-guestbook.ts',
      'lib/bot-desk.ts',
    ]) {
      expect(isWritingFastPassPath(path), path).toBe(true);
    }
  });

  it('requires a Workbench article when bot-desk registry changes', () => {
    expect(isWritingFastPassChange(['lib/bot-desk.ts'])).toBe(false);
    expect(
      isWritingFastPassChange([
        'lib/bot-desk.ts',
        'public/desk/the-thunderdome-is-in-the-mind.md',
      ])
    ).toBe(true);
  });

  it('fast-passes Markdown and ordinary publication/check-in changes', () => {
    expect(classifyCiPaths(['docs/notes.md'])).toMatchObject({
      mode: 'writing-fast-pass',
      runVerify: false,
      runBrowser: false,
    });

    expect(
      classifyCiPaths([
        'lib/bot-desk.ts',
        'public/desk/the-thunderdome-is-in-the-mind.md',
      ])
    ).toMatchObject({
      mode: 'writing-fast-pass',
      runVerify: false,
      runBrowser: false,
    });

    expect(classifyCiPaths(['lib/agent-guestbook.ts'])).toMatchObject({
      mode: 'writing-fast-pass',
      runVerify: false,
      runBrowser: false,
    });
  });

  it('keeps colocated unit-test-only changes on verify without Chromium', () => {
    expect(
      classifyCiPaths([
        'lib/rss-feed.test.ts',
        'components/example.test.tsx',
      ])
    ).toMatchObject({
      mode: 'verify-only',
      runVerify: true,
      runBrowser: false,
    });
  });

  it('keeps runtime, e2e, package, config, workflow, and script changes on the full suite', () => {
    for (const path of [
      'app/space/page.tsx',
      'components/space/space-view.tsx',
      'lib/space-routes.ts',
      'tests/e2e/space-shortcuts.spec.ts',
      'package.json',
      'pnpm-lock.yaml',
      'next.config.mjs',
      'playwright.config.ts',
      'tsconfig.json',
      '.github/workflows/ci.yml',
      'scripts/new-tool.mjs',
      'mystery.file',
    ]) {
      expect(classifyCiPaths([path]), path).toMatchObject({
        mode: 'full',
        runVerify: true,
        runBrowser: true,
      });
    }
  });

  it('keeps runtime changes full when mixed with writing', () => {
    expect(
      classifyCiPaths([
        'public/desk/example.md',
        'lib/bot-desk.ts',
        'app/desk/[slug]/page.tsx',
      ])
    ).toMatchObject({
      mode: 'full',
      runVerify: true,
      runBrowser: true,
      browserRelevantPaths: ['lib/bot-desk.ts', 'app/desk/[slug]/page.tsx'],
    });
  });

  it('treats Markdown and colocated unit tests as browser-independent', () => {
    expect(isBrowserIndependentCiPath('docs/space-continuity.md')).toBe(true);
    expect(isBrowserIndependentCiPath('README.md')).toBe(true);
    expect(isBrowserIndependentCiPath('public/desk/example.md')).toBe(true);
    expect(isBrowserIndependentCiPath('lib/rss-feed.test.ts')).toBe(true);
    expect(isBrowserIndependentCiPath('components/example.test.tsx')).toBe(true);
  });

  it('deduplicates and normalizes Windows-style paths', () => {
    const result = classifyCiPaths([
      'docs\\notes.md',
      ' docs/notes.md ',
      'README.md',
    ]);

    expect(result).toMatchObject({
      mode: 'writing-fast-pass',
      runVerify: false,
      runBrowser: false,
    });
    expect(result.browserIndependentPaths).toEqual(['docs/notes.md', 'README.md']);
  });

  it('fails safe when no changed paths were resolved', () => {
    expect(classifyCiPaths([])).toMatchObject({
      mode: 'full',
      runVerify: true,
      runBrowser: true,
      browserRelevantPaths: [],
    });
  });
});
