import { describe, expect, it } from 'vitest';
import { buildRedline, diffWords, splitEditorialBlocks } from './editorial-diff';

describe('editorial redlines', () => {
  it('marks inserted and removed words inside a changed block', () => {
    const spans = diffWords(
      'The mistake is treating every tool as the same stage.',
      'Use CI for mechanical checks and previews for browser review.',
    );

    expect(spans.some((span) => span.kind === 'removed')).toBe(true);
    expect(spans.some((span) => span.kind === 'added')).toBe(true);
  });

  it('attaches comments to their earlier-version anchor', () => {
    const rows = buildRedline(
      'The mistake is treating every tool as the same stage.',
      'Use CI for mechanical checks.',
      [
        {
          id: 'formula',
          label: 'Formula',
          source: 'editor',
          anchor: 'The mistake is treating every tool as the same stage.',
          note: 'State the practical distinction directly.',
        },
      ],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].commentIds).toEqual(['formula']);
    expect(rows[0].changed).toBe(true);
  });

  it('removes common Markdown syntax from comparison rows', () => {
    expect(splitEditorialBlocks('## Heading\n\n- [Vercel limits](https://vercel.com/docs/limits)')).toEqual([
      'Heading',
      '• Vercel limits',
    ]);
  });
});
