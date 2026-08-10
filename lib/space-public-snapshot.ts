import type { Item } from '@/app/lib/item-types';

export const SPACE_PUBLIC_SNAPSHOT_KEY = 'scrapbook:space-public-snapshot:v1';
export const SPACE_PUBLIC_SNAPSHOT_VERSION = 1;
export const SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS = 100;
export const SPACE_PUBLIC_SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

type PublicSnapshotItem = Omit<Item, 'review' | 'userId'>;

export type SpacePublicSnapshot = {
  version: typeof SPACE_PUBLIC_SNAPSHOT_VERSION;
  savedAt: number;
  hasMore: boolean;
  items: PublicSnapshotItem[];
};

export type RestoredSpacePublicSnapshot = {
  savedAt: number;
  ageMs: number;
  hasMore: boolean;
  items: Item[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === 'string');
}

function isPublicVersion(value: unknown) {
  if (!isRecord(value)) return false;
  if (typeof value.label !== 'string') return false;
  if (typeof value.contentHtml !== 'string') return false;
  if (value.code !== undefined && value.code !== null && typeof value.code !== 'string') {
    return false;
  }
  if (
    value.codeHtml !== undefined &&
    value.codeHtml !== null &&
    typeof value.codeHtml !== 'string'
  ) {
    return false;
  }
  return true;
}

function isPublicSnapshotItem(value: unknown): value is PublicSnapshotItem {
  if (!isRecord(value)) return false;
  if ('review' in value || 'userId' in value) return false;
  if (typeof value.id !== 'string' || value.id.length === 0) return false;
  if (typeof value.slug !== 'string' || value.slug.length === 0) return false;
  if (typeof value.title !== 'string') return false;
  if (typeof value.category !== 'string') return false;
  if (!isStringArray(value.tags)) return false;
  if (value.url !== null && value.url !== undefined && typeof value.url !== 'string') {
    return false;
  }
  if (!Array.isArray(value.versions) || value.versions.length === 0) return false;
  if (!value.versions.every(isPublicVersion)) return false;
  if (!Number.isInteger(value.defaultIndex)) return false;
  if (
    (value.defaultIndex as number) < 0 ||
    (value.defaultIndex as number) >= value.versions.length
  ) {
    return false;
  }
  return true;
}

function toPublicSnapshotItem(item: Item): PublicSnapshotItem {
  const { review: _review, userId: _userId, ...publicItem } = item;
  return publicItem;
}

export function createSpacePublicSnapshot(
  items: readonly Item[],
  options: { savedAt: number; hasMore: boolean }
): SpacePublicSnapshot {
  return {
    version: SPACE_PUBLIC_SNAPSHOT_VERSION,
    savedAt: options.savedAt,
    hasMore: options.hasMore,
    items: items
      .slice(0, SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS)
      .map(toPublicSnapshotItem),
  };
}

export function serializeSpacePublicSnapshot(snapshot: SpacePublicSnapshot) {
  return JSON.stringify(snapshot);
}

export function parseSpacePublicSnapshot(
  raw: string | null,
  nowMs: number
): RestoredSpacePublicSnapshot | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (parsed.version !== SPACE_PUBLIC_SNAPSHOT_VERSION) return null;
  if (typeof parsed.savedAt !== 'number' || !Number.isFinite(parsed.savedAt)) {
    return null;
  }
  if (typeof parsed.hasMore !== 'boolean') return null;
  if (!Array.isArray(parsed.items)) return null;
  if (parsed.items.length > SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS) return null;
  if (!parsed.items.every(isPublicSnapshotItem)) return null;

  const ageMs = nowMs - parsed.savedAt;
  if (ageMs < -MAX_CLOCK_SKEW_MS || ageMs > SPACE_PUBLIC_SNAPSHOT_MAX_AGE_MS) {
    return null;
  }

  return {
    savedAt: parsed.savedAt,
    ageMs: Math.max(0, ageMs),
    hasMore: parsed.hasMore,
    items: parsed.items.map(item => ({ ...item })) as Item[],
  };
}
