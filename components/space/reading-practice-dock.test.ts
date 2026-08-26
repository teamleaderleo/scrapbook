import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReadingPracticeDock } from './reading-practice-dock';

describe('ReadingPracticeDock', () => {
  it('renders a private multi-mode practice surface without fake chat', () => {
    const html = renderToStaticMarkup(
      createElement(ReadingPracticeDock, {
        slug: 'atomic-cache-publication',
        title: 'Atomic cache publication',
        sourceUrl: 'https://example.com/source',
      })
    );

    expect(html).toContain('Work the material');
    expect(html).toContain('Drafts stay on this device.');
    expect(html).toContain('Question notes');
    expect(html).toContain('Review');
    expect(html).toContain('Alter');
    expect(html).toContain('Copy prompt');
    expect(html).toContain('Saved on this device');
    expect(html).not.toContain('Assistant');
    expect(html).not.toContain('>Type<');
  });

  it('opens on a contextual next move when Trail supplies one', () => {
    const html = renderToStaticMarkup(
      createElement(ReadingPracticeDock, {
        slug: 'atomic-cache-publication',
        title: 'Atomic cache publication',
        initialMode: 'trace',
        promptOverride: 'Predict the first observable write.',
      })
    );

    expect(html).toContain('Predict the first observable write.');
    expect(html).toContain('Trace notes');
    expect(html).toContain('aria-pressed="true"');
  });

  it('renders a bounded typing exercise when a reading supplies a target', () => {
    const html = renderToStaticMarkup(
      createElement(ReadingPracticeDock, {
        slug: 'atomic-cache-publication',
        title: 'Atomic cache publication',
        initialMode: 'type',
        typingTarget: {
          kind: 'code',
          label: 'Implementation code',
          text: 'const value = cache.get(key);',
        },
      })
    );

    expect(html).toContain('Implementation code');
    expect(html).toContain('Exact code');
    expect(html).toContain('Typing input');
    expect(html).toContain('Exactness first');
    expect(html).toContain('Copy exercise');
    expect(html).toContain('>Type<');
  });
});
