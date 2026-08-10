import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/item-types';
import {
  SPACE_PUBLIC_SNAPSHOT_MAX_AGE_MS,
  SPACE_PUBLIC_SNAPSHOT_MAX_BYTES,
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
        content: `Item ${index}`,
        contentHtml: `<p>Item ${index}</p>`,
        code: null,
        codeHtml: '',
      },
    ],
    defaultIndex: 0,
    createdAt: 100 + index,
    updatedAt: 200 + index,
    userId: 'private-user',
    review: { private: true } as unknown as Item['review'],
    ...overrides,
  };
}

describe('Space public snapshot contract', () => {
  it('caps the archive page and projects only explicit public fields', () => {
    const first = item();
    (first as Item & { futurePrivate?: string }).futurePrivate = 'future-secret';
    const items = [
      first,
      ...Array.from(
        { length: SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS + 6 },
        (_, index) => item(index + 2)
      ),
    ];
    const snapshot = createSpacePublicSnapshot(items, {
      savedAt: 1_000,
      hasMore: true,
    });
    const serialized = serializeSpacePublicSnapshot(snapshot);

    expect(snapshot.version).toBe(SPACE_PUBLIC_SNAPSHOT_VERSION);
    expect(snapshot.items).toHaveLength(SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS);
    expect(snapshot.items[0]).not.toHaveProperty('review');
    expect(snapshot.items[0]).not.toHaveProperty('userId');
    expect(snapshot.items[0]).not.toHaveProperty('futurePrivate');
    expect(serialized).not.toContain('private-user');
    expect(serialized).not.toContain('future-secret');
  });

  it('restores a fresh public snapshot without private fields', () => {
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
      createdAt: 101,
      updatedAt: 201,
    });
    expect(restored?.items[0]).not.toHaveProperty('review');
    expect(restored?.items[0]).not.toHaveProperty('userId');
  });

  it('rejects stale, far-future, wrong-version, oversized-count, and oversized-byte snapshots', () => {
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

    const oversizedCount = {
      ...snapshot,
      items: Array.from(
        { length: SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS + 1 },
        () => snapshot.items[0]
      ),
    };
    expect(
      parseSpacePublicSnapshot(JSON.stringify(oversizedCount), 5_000)
    ).toBeNull();

    expect(
      parseSpacePublicSnapshot('x'.repeat(SPACE_PUBLIC_SNAPSHOT_MAX_BYTES + 1), 5_000)
    ).toBeNull();

    const huge = createSpacePublicSnapshot(
      [
        item(1, {
          versions: [
            {
              label: 'main',
              content: 'large',
              contentHtml: 'x'.repeat(SPACE_PUBLIC_SNAPSHOT_MAX_BYTES),
              code: null,
              codeHtml: '',
            },
          ],
        }),
      ],
      { savedAt: 5_000, hasMore: false }
    );
    expect(() => serializeSpacePublicSnapshot(huge)).toThrow(
      'browser cache byte budget'
    );
  });

  it('rejects malformed, private-field-injected, and unknown-field browser data', () => {
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

    const unknownRoot = { ...snapshot, futurePrivate: 'secret' };
    expect(parseSpacePublicSnapshot(JSON.stringify(unknownRoot), 5_000)).toBeNull();

    const unknownItem = {
      ...snapshot,
      items: [{ ...snapshot.items[0], futurePrivate: 'secret' }],
    };
    expect(parseSpacePublicSnapshot(JSON.stringify(unknownItem), 5_000)).toBeNull();

    const unknownVersion = {
      ...snapshot,
      items: [
        {
          ...snapshot.items[0],
          versions: [{ ...snapshot.items[0].versions[0], futurePrivate: 'secret' }],
        },
      ],
    };
    expect(
      parseSpacePublicSnapshot(JSON.stringify(unknownVersion), 5_000)
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
