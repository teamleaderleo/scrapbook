import { describe, expect, it } from 'vitest';
import { buildRedline, diffWords, splitEditorialBlocks } from './editorial-diff';

describe('editorial redlines', () => {
  it('marks inserted and removed words inside a changed block', () => {
    const spans = diffWords(
      'Vercel allows thirty-two builds each hour.',
      'Vercel allows 32 builds in a rolling hour.',
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

    const commentedRow = rows.find((row) => row.commentIds.includes('formula'));
    expect(commentedRow).toMatchObject({
      before: 'The mistake is treating every tool as the same stage.',
      after: undefined,
      changed: true,
    });
  });

  it('keeps unrelated replacement blocks as separate deletion and insertion rows', () => {
    const rows = buildRedline(
      'A ceremonial paragraph about ribbon cuttings and launch parties.',
      'GitHub Actions runs lint, types, tests, and the production build.',
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ oldLine: 1, newLine: null });
    expect(rows[1]).toMatchObject({ oldLine: null, newLine: 1 });
  });

  it('pairs related blocks for word-level comparison', () => {
    const rows = buildRedline(
      'Vercel allows thirty-two builds each hour.',
      'Vercel allows 32 builds in a rolling hour.',
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].oldLine).toBe(1);
    expect(rows[0].newLine).toBe(1);
    expect(rows[0].spans.some((span) => span.kind === 'same')).toBe(true);
  });

  it('removes common Markdown syntax from comparison rows', () => {
    expect(splitEditorialBlocks('## Heading\n\n- [Vercel limits](https://vercel.com/docs/limits)')).toEqual([
      'Heading',
      '• Vercel limits',
    ]);
  });
});
