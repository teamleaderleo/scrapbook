import { describe, expect, it } from 'vitest';
import type { Item } from './item-types';
import { searchItems } from './item-search';
import { parseQuery } from './searchlang';

function item(overrides: Partial<Item>): Item {
  return {
    id: 'item',
    title: 'Study',
    slug: 'study',
    url: null,
    defaultIndex: 0,
    versions: [],
    tags: [],
    category: 'practical',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('searchItems', () => {
  const studies = [
    item({
      id: 'review',
      title: 'Review an idempotency patch',
      tags: ['prep:interview', 'mode:review', 'tool:no-ai', 'company:openai'],
    }),
    item({
      id: 'design',
      title: 'Design a rate limiter',
      tags: ['prep:interview', 'mode:design', 'tool:ai-optional', 'company:openai'],
    }),
    item({
      id: 'typing',
      title: 'Type a cache implementation',
      category: 'typing',
      tags: ['mode:typing', 'time:5-min'],
    }),
  ];

  it('keeps the existing typed namespaces working', () => {
    expect(
      searchItems(studies, parseQuery('company:openai'), Date.now()).map(
        value => value.id
      )
    ).toEqual(['review', 'design']);
  });

  it('matches new namespaces as exact tags without search-engine changes', () => {
    expect(
      searchItems(
        studies,
        parseQuery('prep:interview mode:review tool:no-ai'),
        Date.now()
      ).map(value => value.id)
    ).toEqual(['review']);

    expect(
      searchItems(studies, parseQuery('time:5-min'), Date.now()).map(
        value => value.id
      )
    ).toEqual(['typing']);
  });

  it('requires every value supplied for the same namespace', () => {
    expect(
      searchItems(
        [
          item({
            id: 'multi-mode',
            tags: ['prep:interview', 'mode:review', 'mode:debug'],
          }),
          item({
            id: 'review-only',
            tags: ['prep:interview', 'mode:review'],
          }),
        ],
        parseQuery('mode:review mode:debug'),
        Date.now()
      ).map(value => value.id)
    ).toEqual(['multi-mode']);
  });

  it('keeps plain search terms useful across tag values and titles', () => {
    expect(
      searchItems(studies, parseQuery('review'), Date.now()).map(value => value.id)
    ).toEqual(['review']);
    expect(
      searchItems(studies, parseQuery('limiter'), Date.now()).map(value => value.id)
    ).toEqual(['design']);
  });
});
