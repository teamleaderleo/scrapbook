import { describe, expect, it, vi } from 'vitest';
import type { Item } from '@/app/lib/item-types';
import { SPACE_PUBLIC_SNAPSHOT_KEY } from './space-public-snapshot';
import {
  readStoredSpacePublicSnapshot,
  writeStoredSpacePublicSnapshot,
  type SpaceSnapshotStorage,
} from './space-public-snapshot-storage';

function item(): Item {
  return {
    id: 'item-1',
    slug: 'item-1',
    title: 'Cached item',
    category: 'notes',
    tags: ['topic:continuity'],
    url: null,
    versions: [{ label: 'main', contentHtml: '<p>Cached item</p>' }],
    defaultIndex: 0,
    userId: 'private-user',
    review: { private: true } as unknown as Item['review'],
  } as Item;
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
    expect(restored?.items[0]).toMatchObject({
      id: 'item-1',
      review: null,
      userId: null,
    });
    expect(restored?.hasMore).toBe(true);
  });

  it('removes invalid or stale stored payloads', () => {
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
