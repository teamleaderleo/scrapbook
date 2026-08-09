import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReadingPracticeDock } from './reading-practice-dock';

describe('ReadingPracticeDock', () => {
  it('renders a private question-first practice surface without fake chat', () => {
    const html = renderToStaticMarkup(
      createElement(ReadingPracticeDock, {
        slug: 'atomic-cache-publication',
        title: 'Atomic cache publication',
        sourceUrl: 'https://example.com/source',
      })
    );

    expect(html).toContain('Continue the thread');
    expect(html).toContain('Nothing is sent or scored.');
    expect(html).toContain('Question notes');
    expect(html).toContain('Copy prompt');
    expect(html).toContain('Saved on this device');
    expect(html).not.toContain('Assistant');
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
});
