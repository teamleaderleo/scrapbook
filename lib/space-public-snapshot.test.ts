import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/item-types';
import {
  SPACE_PUBLIC_SNAPSHOT_MAX_AGE_MS,
  SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS,
  SPACE_PUBLIC_SNAPSHOT_VERSION,
  createSpacePublicSnapshot,
  parseSpacePublicSnapshot,
  serializeSpacePublicSnapshot,
} from './space-public-snapshot';

function item(index = 1, overrides: Partial<Item> = {}): Item {
  return {
    id: `item-${index}`,
    slug: `item-${index}`,
    title: `Item ${index}`,
    category: 'notes',
    tags: ['source:test', 'topic:continuity'],
    url: `https://example.com/items/${index}`,
    versions: [
      {
        label: 'main',
        contentHtml: `<p>Item ${index}</p>`,
      },
    ],
    defaultIndex: 0,
    userId: 'private-user',
    review: { private: true } as unknown as Item['review'],
    ...overrides,
  } as Item;
}

describe('Space public snapshot contract', () => {
  it('caps the archive page and strips private/admin fields before serialization', () => {
    const items = Array.from(
      { length: SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS + 7 },
      (_, index) => item(index + 1)
    );
    const snapshot = createSpacePublicSnapshot(items, {
      savedAt: 1_000,
      hasMore: true,
    });

    expect(snapshot.version).toBe(SPACE_PUBLIC_SNAPSHOT_VERSION);
    expect(snapshot.items).toHaveLength(SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS);
    expect(snapshot.items[0]).not.toHaveProperty('review');
    expect(snapshot.items[0]).not.toHaveProperty('userId');
    expect(serializeSpacePublicSnapshot(snapshot)).not.toContain('private-user');
    expect(serializeSpacePublicSnapshot(snapshot)).not.toContain('private');
  });

  it('restores a fresh public snapshot with private fields explicitly null', () => {
    const raw = serializeSpacePublicSnapshot(
      createSpacePublicSnapshot([item()], {
        savedAt: 10_000,
        hasMore: false,
      })
    );

    const restored = parseSpacePublicSnapshot(raw, 12_500);
    expect(restored).toMatchObject({
      savedAt: 10_000,
      ageMs: 2_500,
      hasMore: false,
    });
    expect(restored?.items).toHaveLength(1);
    expect(restored?.items[0]).toMatchObject({
      id: 'item-1',
      slug: 'item-1',
      title: 'Item 1',
      review: null,
      userId: null,
    });
  });

  it('rejects stale, far-future, wrong-version, and oversized snapshots', () => {
    const snapshot = createSpacePublicSnapshot([item()], {
      savedAt: 5_000,
      hasMore: false,
    });

    expect(
      parseSpacePublicSnapshot(
        serializeSpacePublicSnapshot(snapshot),
        5_000 + SPACE_PUBLIC_SNAPSHOT_MAX_AGE_MS + 1
      )
    ).toBeNull();
    expect(
      parseSpacePublicSnapshot(
        serializeSpacePublicSnapshot(snapshot),
        snapshot.savedAt - 5 * 60 * 1000 - 1
      )
    ).toBeNull();

    const wrongVersion = { ...snapshot, version: 99 };
    expect(parseSpacePublicSnapshot(JSON.stringify(wrongVersion), 5_000)).toBeNull();

    const oversized = {
      ...snapshot,
      items: Array.from(
        { length: SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS + 1 },
        () => snapshot.items[0]
      ),
    };
    expect(parseSpacePublicSnapshot(JSON.stringify(oversized), 5_000)).toBeNull();
  });

  it('rejects malformed or private-field-injected browser data', () => {
    const snapshot = createSpacePublicSnapshot([item()], {
      savedAt: 5_000,
      hasMore: false,
    });

    expect(parseSpacePublicSnapshot('{', 5_000)).toBeNull();
    expect(parseSpacePublicSnapshot(null, 5_000)).toBeNull();

    const privateInjection = {
      ...snapshot,
      items: [{ ...snapshot.items[0], userId: 'restored-private-user' }],
    };
    expect(
      parseSpacePublicSnapshot(JSON.stringify(privateInjection), 5_000)
    ).toBeNull();

    const malformedVersion = {
      ...snapshot,
      items: [{ ...snapshot.items[0], versions: [{ label: 'main' }] }],
    };
    expect(
      parseSpacePublicSnapshot(JSON.stringify(malformedVersion), 5_000)
    ).toBeNull();
  });
});
