import { describe, expect, it, vi } from 'vitest';
import type { Item } from '@/app/lib/item-types';
import {
  SPACE_PUBLIC_SNAPSHOT_KEY,
  SPACE_PUBLIC_SNAPSHOT_MAX_BYTES,
} from './space-public-snapshot';
import {
  clearStoredSpacePublicSnapshot,
  readStoredSpacePublicSnapshot,
  writeStoredSpacePublicSnapshot,
  type SpaceSnapshotStorage,
} from './space-public-snapshot-storage';

function item(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    slug: 'item-1',
    title: 'Cached item',
    category: 'notes',
    tags: ['topic:continuity'],
    url: null,
    versions: [
      {
        label: 'main',
        content: 'Cached item',
        contentHtml: '<p>Cached item</p>',
        code: null,
        codeHtml: '',
      },
    ],
    defaultIndex: 0,
    createdAt: 100,
    updatedAt: 200,
    userId: 'private-user',
    review: { private: true } as unknown as Item['review'],
    ...overrides,
  };
}

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: vi.fn((key: string) =>
      key === SPACE_PUBLIC_SNAPSHOT_KEY ? value : null
    ),
    setItem: vi.fn((key: string, next: string) => {
      if (key === SPACE_PUBLIC_SNAPSHOT_KEY) value = next;
    }),
    removeItem: vi.fn((key: string) => {
      if (key === SPACE_PUBLIC_SNAPSHOT_KEY) value = null;
    }),
  } satisfies SpaceSnapshotStorage;
}

describe('Space public snapshot storage', () => {
  it('writes only non-empty public snapshots and can read them back', () => {
    const storage = memoryStorage();

    expect(
      writeStoredSpacePublicSnapshot(storage, [], {
        savedAt: 1_000,
        hasMore: false,
      })
    ).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();

    expect(
      writeStoredSpacePublicSnapshot(storage, [item()], {
        savedAt: 1_000,
        hasMore: true,
      })
    ).toBe(true);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem.mock.calls[0]?.[1]).not.toContain('private-user');

    const restored = readStoredSpacePublicSnapshot(storage, 1_500);
    expect(restored?.items[0]).toMatchObject({ id: 'item-1' });
    expect(restored?.items[0]).not.toHaveProperty('review');
    expect(restored?.items[0]).not.toHaveProperty('userId');
    expect(restored?.hasMore).toBe(true);
  });

  it('clears an obsolete snapshot without making storage failure fatal', () => {
    const storage = memoryStorage('old');
    expect(clearStoredSpacePublicSnapshot(storage)).toBe(true);
    expect(storage.removeItem).toHaveBeenCalledWith(SPACE_PUBLIC_SNAPSHOT_KEY);
    expect(storage.getItem(SPACE_PUBLIC_SNAPSHOT_KEY)).toBeNull();

    const unavailable = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(() => {
        throw new Error('SecurityError');
      }),
    } satisfies SpaceSnapshotStorage;
    expect(clearStoredSpacePublicSnapshot(unavailable)).toBe(false);
  });

  it('removes invalid, stale, or over-budget stored payloads', () => {
    const invalid = memoryStorage('{');
    expect(readStoredSpacePublicSnapshot(invalid, 5_000)).toBeNull();
    expect(invalid.removeItem).toHaveBeenCalledWith(SPACE_PUBLIC_SNAPSHOT_KEY);

    const stale = memoryStorage();
    writeStoredSpacePublicSnapshot(stale, [item()], {
      savedAt: 1,
      hasMore: false,
    });
    expect(
      readStoredSpacePublicSnapshot(stale, 24 * 60 * 60 * 1000 + 2)
    ).toBeNull();
    expect(stale.removeItem).toHaveBeenCalledWith(SPACE_PUBLIC_SNAPSHOT_KEY);

    const oversized = memoryStorage(
      'x'.repeat(SPACE_PUBLIC_SNAPSHOT_MAX_BYTES + 1)
    );
    expect(readStoredSpacePublicSnapshot(oversized, 5_000)).toBeNull();
    expect(oversized.removeItem).toHaveBeenCalledWith(SPACE_PUBLIC_SNAPSHOT_KEY);
  });

  it('does not attempt a browser write when serialization exceeds the byte budget', () => {
    const storage = memoryStorage();
    const huge = item({
      versions: [
        {
          label: 'main',
          content: 'large',
          contentHtml: 'x'.repeat(SPACE_PUBLIC_SNAPSHOT_MAX_BYTES),
          code: null,
          codeHtml: '',
        },
      ],
    });

    expect(
      writeStoredSpacePublicSnapshot(storage, [huge], {
        savedAt: 1_000,
        hasMore: false,
      })
    ).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('treats unavailable or quota-limited storage as a cache miss', () => {
    const unavailable = {
      getItem: vi.fn(() => {
        throw new Error('SecurityError');
      }),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
      removeItem: vi.fn(),
    } satisfies SpaceSnapshotStorage;

    expect(readStoredSpacePublicSnapshot(unavailable, 1_000)).toBeNull();
    expect(
      writeStoredSpacePublicSnapshot(unavailable, [item()], {
        savedAt: 1_000,
        hasMore: false,
      })
    ).toBe(false);
  });

  it('does not turn failed cleanup into a route failure', () => {
    const storage = {
      getItem: vi.fn(() => '{'),
      setItem: vi.fn(),
      removeItem: vi.fn(() => {
        throw new Error('SecurityError');
      }),
    } satisfies SpaceSnapshotStorage;

    expect(readStoredSpacePublicSnapshot(storage, 1_000)).toBeNull();
  });
});
