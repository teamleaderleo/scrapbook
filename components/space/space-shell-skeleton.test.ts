import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SpaceShellSkeleton } from './space-shell-skeleton';

describe('SpaceShellSkeleton', () => {
  it('preserves the current Space desk composition without relying on streaming timing', () => {
    const html = renderToStaticMarkup(createElement(SpaceShellSkeleton));

    expect(html).toContain('data-space-loading-shell="true"');
    expect(html).toContain('aria-label="Loading Space"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('h-[100dvh]');
    expect(html).toContain('min-h-[100dvh]');
    expect(html).toContain('overflow-hidden');
    expect(html.match(/data-space-loading-lane="true"/g)).toHaveLength(4);
    expect(html.match(/data-space-loading-row="true"/g)).toHaveLength(5);
    expect((html.match(/data-skeleton="true"/g) ?? []).length).toBeGreaterThanOrEqual(20);
  });
});
