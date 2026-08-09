import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/item-types';
import {
  countItemsBySpaceLane,
  filterItemsBySpaceLane,
  isSpaceLaneId,
  itemMatchesSpaceLane,
  resolveSpaceLane,
} from './space-lanes';

function item(overrides: Partial<Item>): Item {
  return {
    id: 'item',
    title: 'Item',
    slug: 'item',
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

describe('Space lanes', () => {
  const practical = item({ id: 'practical' });
  const leetcode = item({
    id: 'leetcode',
    category: 'leetcode',
    tags: ['type:leetcode'],
  });
  const template = item({ id: 'template', category: 'template' });
  const fieldwork = item({
    id: 'fieldwork',
    tags: ['source:fieldwork', 'mode:review'],
  });
  const linuxFieldwork = item({
    id: 'linux-fieldwork',
    url: 'https://github.com/teamleaderleo/linux-fieldwork/blob/main/note.md',
  });

  it('recognizes only supported URL lane values', () => {
    expect(isSpaceLaneId('open')).toBe(true);
    expect(isSpaceLaneId('fieldwork')).toBe(true);
    expect(isSpaceLaneId('garden')).toBe(false);
    expect(isSpaceLaneId(null)).toBe(false);
  });

  it('opens filtered and directly targeted views against the archive', () => {
    expect(resolveSpaceLane(null)).toBe('open');
    expect(resolveSpaceLane(null, { hasQuery: true })).toBe('archive');
    expect(resolveSpaceLane(null, { hasTarget: true })).toBe('archive');
    expect(resolveSpaceLane('scales', { hasTarget: true })).toBe('scales');
  });

  it('keeps legacy algorithms and templates in scales', () => {
    expect(itemMatchesSpaceLane(leetcode, 'scales')).toBe(true);
    expect(itemMatchesSpaceLane(template, 'scales')).toBe(true);
    expect(itemMatchesSpaceLane(leetcode, 'open')).toBe(false);
  });

  it('recognizes Fieldwork from tags or canonical repository URLs', () => {
    expect(itemMatchesSpaceLane(fieldwork, 'fieldwork')).toBe(true);
    expect(itemMatchesSpaceLane(linuxFieldwork, 'fieldwork')).toBe(true);
    expect(itemMatchesSpaceLane(fieldwork, 'open')).toBe(true);
    expect(
      itemMatchesSpaceLane(
        item({ id: 'other-repository', tags: ['domain:real-codebase'] }),
        'fieldwork'
      )
    ).toBe(false);
  });

  it('allows non-drill Fieldwork in Open and uses Archive for everything', () => {
    const items = [practical, leetcode, template, fieldwork, linuxFieldwork];

    expect(
      filterItemsBySpaceLane(items, 'open').map(value => value.id)
    ).toEqual(['practical', 'fieldwork', 'linux-fieldwork']);
    expect(filterItemsBySpaceLane(items, 'archive')).toEqual(items);
    expect(countItemsBySpaceLane(items)).toEqual({
      open: 3,
      fieldwork: 2,
      scales: 2,
      archive: 5,
    });
  });
});
