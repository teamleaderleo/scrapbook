import type { Item } from '@/app/lib/item-types';
import {
  SPACE_PUBLIC_SNAPSHOT_KEY,
  createSpacePublicSnapshot,
  parseSpacePublicSnapshot,
  serializeSpacePublicSnapshot,
  type RestoredSpacePublicSnapshot,
} from './space-public-snapshot';

export type SpaceSnapshotStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>;

export function readStoredSpacePublicSnapshot(
  storage: SpaceSnapshotStorage,
  nowMs: number
): RestoredSpacePublicSnapshot | null {
  let raw: string | null;
  try {
    raw = storage.getItem(SPACE_PUBLIC_SNAPSHOT_KEY);
  } catch {
    return null;
  }

  const restored = parseSpacePublicSnapshot(raw, nowMs);
  if (restored || raw === null) return restored;

  try {
    storage.removeItem(SPACE_PUBLIC_SNAPSHOT_KEY);
  } catch {
    // A failed cleanup should not turn continuity into a route failure.
  }
  return null;
}

export function writeStoredSpacePublicSnapshot(
  storage: SpaceSnapshotStorage,
  items: readonly Item[],
  options: { savedAt: number; hasMore: boolean }
) {
  if (items.length === 0) return false;

  const snapshot = createSpacePublicSnapshot(items, options);
  try {
    storage.setItem(
      SPACE_PUBLIC_SNAPSHOT_KEY,
      serializeSpacePublicSnapshot(snapshot)
    );
    return true;
  } catch {
    return false;
  }
}
