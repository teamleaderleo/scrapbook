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
      browserGroups: [],
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
      browserGroups: [],
    });

    expect(classifyCiPaths(['lib/agent-guestbook.ts'])).toMatchObject({
      mode: 'writing-fast-pass',
      runVerify: false,
      runBrowser: false,
      browserGroups: [],
    });
  });

  it('keeps colocated unit-test and SQL-only changes off Chromium', () => {
    expect(
      classifyCiPaths([
        'lib/rss-feed.test.ts',
        'components/example.test.tsx',
        'drizzle/0015_scraplet_global_pets.sql',
      ])
    ).toMatchObject({
      mode: 'verify-only',
      runVerify: true,
      runBrowser: false,
      browserGroups: [],
    });
  });

  it('scopes homepage runtime changes to homepage browser contracts', () => {
    expect(
      classifyCiPaths([
        'app/page.tsx',
        'components/home/scrapbook-pet.tsx',
        'app/api/scraplet/route.ts',
      ])
    ).toMatchObject({
      mode: 'scoped-browser',
      runVerify: true,
      runBrowser: true,
      browserGroups: ['home'],
    });
  });

  it('unions known browser groups for cross-surface changes', () => {
    expect(
      classifyCiPaths([
        'components/ui/censor-reveal.tsx',
        'lib/site-navigation.ts',
        'components/labs/activity-counter-lab.tsx',
      ])
    ).toMatchObject({
      mode: 'scoped-browser',
      runVerify: true,
      runBrowser: true,
      browserGroups: ['activity-lab', 'desk', 'home', 'navigation', 'shell'],
    });
  });

  it('maps known e2e files to their own browser group', () => {
    expect(
      classifyCiPaths(['tests/e2e/activity-field-lab.spec.ts'])
    ).toMatchObject({
      mode: 'scoped-browser',
      browserGroups: ['activity-lab'],
    });
    expect(classifyCiPaths(['tests/e2e/bot-desk.spec.ts'])).toMatchObject({
      mode: 'scoped-browser',
      browserGroups: ['desk'],
    });
  });

  it('keeps unknown runtime, broad e2e, package, config, workflow, and script changes on the full suite', () => {
    for (const path of [
      'app/space/page.tsx',
      'components/space/space-view.tsx',
      'lib/space-routes.ts',
      'tests/e2e/space-shortcuts.spec.ts',
      'tests/e2e/smoke.spec.ts',
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
        browserGroups: ['full'],
      });
    }
  });

  it('keeps unscoped runtime changes full when mixed with known browser surfaces', () => {
    expect(
      classifyCiPaths([
        'components/home/scrapbook-pet.tsx',
        'app/space/page.tsx',
      ])
    ).toMatchObject({
      mode: 'full',
      runVerify: true,
      runBrowser: true,
      browserGroups: ['full'],
    });
  });

  it('treats Markdown, SQL, and colocated unit tests as browser-independent', () => {
    expect(isBrowserIndependentCiPath('docs/space-continuity.md')).toBe(true);
    expect(isBrowserIndependentCiPath('README.md')).toBe(true);
    expect(isBrowserIndependentCiPath('public/desk/example.md')).toBe(true);
    expect(isBrowserIndependentCiPath('drizzle/0015_scraplet_global_pets.sql')).toBe(
      true
    );
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
      browserGroups: [],
    });
    expect(result.browserIndependentPaths).toEqual(['docs/notes.md', 'README.md']);
  });

  it('fails safe when no changed paths were resolved', () => {
    expect(classifyCiPaths([])).toMatchObject({
      mode: 'full',
      runVerify: true,
      runBrowser: true,
      browserGroups: ['full'],
      browserRelevantPaths: [],
    });
  });
});
