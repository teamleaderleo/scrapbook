import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/item-types';
import {
  EMPTY_SPACE_TRAIL_MEMORY,
  estimateTrailMinutes,
  markSpaceTrailOpened,
  parseSpaceTrailMemory,
  rankSpaceTrail,
  setSpaceTrailResume,
  trailItemExcerpt,
  updateSpaceTrailReaction,
} from './space-trail';

const nowMs = Date.UTC(2026, 7, 10);

function item(
  id: string,
  category: string,
  tags: string[],
  updatedAt = nowMs - 90 * 86_400_000
): Item {
  return {
    id,
    title: `Study ${id}`,
    slug: `study-${id}`,
    url: null,
    defaultIndex: 0,
    versions: [
      {
        label: 'Note',
        content:
          '# Heading\nA **useful** [linked](https://example.com) explanation.',
        contentHtml: '',
        code: null,
        codeHtml: '',
      },
    ],
    tags,
    category,
    createdAt: updatedAt,
    updatedAt,
  };
}

describe('Space trail ranking', () => {
  it('uses positive feedback to raise related material', () => {
    const source = item('source', 'article', ['topic:linux']);
    const related = item('related', 'trace', ['topic:linux']);
    const unrelated = item('unrelated', 'design', ['topic:css']);
    const memory = updateSpaceTrailReaction(
      EMPTY_SPACE_TRAIL_MEMORY,
      source.id,
      'more'
    );

    const result = rankSpaceTrail([source, unrelated, related], memory, {
      seed: 'stable',
      nowMs,
    });

    expect(
      result.findIndex(entry => entry.item.id === related.id)
    ).toBeLessThan(result.findIndex(entry => entry.item.id === unrelated.id));
    expect(
      result.find(entry => entry.item.id === related.id)?.reasons[0]
    ).toContain('linux');
  });

  it('removes explicit less-like-this items without hiding learned material forever', () => {
    const hidden = item('hidden', 'article', []);
    const learned = item('learned', 'article', []);
    let memory = updateSpaceTrailReaction(
      EMPTY_SPACE_TRAIL_MEMORY,
      hidden.id,
      'less'
    );
    memory = updateSpaceTrailReaction(memory, learned.id, 'learned');

    const result = rankSpaceTrail([hidden, learned], memory, {
      seed: 'stable',
      nowMs,
    });

    expect(result.map(entry => entry.item.id)).toEqual(['learned']);
  });

  it('penalizes repetitive sequences when alternatives exist', () => {
    const items = [
      item('a', 'article', ['topic:a']),
      item('b', 'article', ['topic:b']),
      item('c', 'trace', ['topic:c']),
    ];

    const result = rankSpaceTrail(items, EMPTY_SPACE_TRAIL_MEMORY, {
      seed: 'diverse',
      nowMs,
    });

    expect(result).toHaveLength(3);
    expect(new Set(result.map(entry => entry.item.id))).toHaveLength(3);
    expect(result[0].item.category).not.toBe(result[1].item.category);
  });
});

describe('Space trail memory and presentation helpers', () => {
  it('validates stored memory and bounds the opened history', () => {
    const opened = Array.from({ length: 520 }, (_, index) => `item-${index}`);
    const parsed = parseSpaceTrailMemory(
      JSON.stringify({
        version: 1,
        reactions: { a: 'more', b: 'invalid' },
        opened,
      })
    );

    expect(parsed.reactions).toEqual({ a: 'more' });
    expect(parsed.opened).toHaveLength(500);
    expect(parseSpaceTrailMemory('{broken')).toEqual(EMPTY_SPACE_TRAIL_MEMORY);
    expect(markSpaceTrailOpened(parsed, 'item-519').opened.at(-1)).toBe(
      'item-519'
    );
    expect(setSpaceTrailResume(parsed, 'item-42').resumeId).toBe('item-42');
  });

  it('turns markdown into a compact excerpt and respects time tags', () => {
    const study = item('a', 'article', ['time:7 min']);
    expect(trailItemExcerpt(study)).toBe(
      'Heading A useful linked explanation.'
    );
    expect(estimateTrailMinutes(study)).toBe(7);
  });
});
