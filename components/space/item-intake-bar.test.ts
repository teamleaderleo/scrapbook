import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ItemIntakeBar } from './item-intake-bar';

describe('ItemIntakeBar', () => {
  it('shows interview scope and practice classifications without replacing the editors', () => {
    const html = renderToStaticMarkup(
      createElement(ItemIntakeBar, {
        tags: ['prep:interview', 'mode:review', 'tool:no-ai'],
        category: 'review',
        onChange: vi.fn(),
      })
    );

    expect(html).toContain('Quick intake');
    expect(html).toContain('Markdown and code stay untouched.');
    expect(html).toContain('General');
    expect(html).toContain('Interview');
    expect(html).toContain('Implement');
    expect(html).toContain('Review');
    expect(html).toContain('Debug');
    expect(html).toContain('Design');
    expect(html).toContain('Deep dive');
    expect(html).toContain('Type');
    expect(html).toContain('prep:interview · mode:review · category:review');
  });
});
