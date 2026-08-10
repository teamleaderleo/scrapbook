import type { Item } from '@/app/lib/item-types';

export const SPACE_PUBLIC_SNAPSHOT_KEY = 'scrapbook:space-public-snapshot:v1';
export const SPACE_PUBLIC_SNAPSHOT_VERSION = 1;
export const SPACE_PUBLIC_SNAPSHOT_MAX_ITEMS = 100;
export const SPACE_PUBLIC_SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const SPACE_PUBLIC_SNAPSHOT_MAX_BYTES = 2 * 1024 * 1024;

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export type PublicSnapshotVersion = {
  label: string;
  content: string;
  contentHtml: string;
  code: string | null;
  codeHtml: string;
};

export type PublicSnapshotItem = {
  id: string;
  title: string;
  slug: string;
  url: string | null;
  defaultIndex: number;
  versions: PublicSnapshotVersion[];
  tags: string[];
  category: string;
  createdAt: number;
  updatedAt: number;
  score?: number;
};

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

const SNAPSHOT_KEYS = new Set(['version', 'savedAt', 'hasMore', 'items']);
const ITEM_KEYS = new Set([
  'id',
  'title',
  'slug',
  'url',
  'defaultIndex',
  'versions',
  'tags',
  'category',
  'createdAt',
  'updatedAt',
  'score',
]);
const VERSION_KEYS = new Set([
  'label',
  'content',
  'contentHtml',
  'code',
  'codeHtml',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>) {
  return Object.keys(value).every(key => allowed.has(key));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === 'string');
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function isPublicVersion(value: unknown): value is PublicSnapshotVersion {
  if (!isRecord(value) || !hasOnlyKeys(value, VERSION_KEYS)) return false;
  return (
    typeof value.label === 'string' &&
    typeof value.content === 'string' &&
    typeof value.contentHtml === 'string' &&
    (value.code === null || typeof value.code === 'string') &&
    typeof value.codeHtml === 'string'
  );
}

function isPublicSnapshotItem(value: unknown): value is PublicSnapshotItem {
  if (!isRecord(value) || !hasOnlyKeys(value, ITEM_KEYS)) return false;
  if (typeof value.id !== 'string' || value.id.length === 0) return false;
  if (typeof value.slug !== 'string' || value.slug.length === 0) return false;
  if (typeof value.title !== 'string') return false;
  if (typeof value.category !== 'string') return false;
  if (!isStringArray(value.tags)) return false;
  if (value.url !== null && typeof value.url !== 'string') return false;
  if (!Number.isFinite(value.createdAt) || !Number.isFinite(value.updatedAt)) {
    return false;
  }
  if (value.score !== undefined && !Number.isFinite(value.score)) return false;
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

function toPublicSnapshotVersion(
  version: Item['versions'][number]
): PublicSnapshotVersion {
  return {
    label: version.label,
    content: version.content,
    contentHtml: version.contentHtml,
    code: version.code,
    codeHtml: version.codeHtml,
  };
}

function toPublicSnapshotItem(item: Item): PublicSnapshotItem {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    url: item.url,
    defaultIndex: item.defaultIndex,
    versions: item.versions.map(toPublicSnapshotVersion),
    tags: [...item.tags],
    category: item.category,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    ...(item.score === undefined ? {} : { score: item.score }),
  };
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
  const serialized = JSON.stringify(snapshot);
  if (utf8ByteLength(serialized) > SPACE_PUBLIC_SNAPSHOT_MAX_BYTES) {
    throw new Error('Space public snapshot exceeds the browser cache byte budget');
  }
  return serialized;
}

export function parseSpacePublicSnapshot(
  raw: string | null,
  nowMs: number
): RestoredSpacePublicSnapshot | null {
  if (!raw || utf8ByteLength(raw) > SPACE_PUBLIC_SNAPSHOT_MAX_BYTES) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || !hasOnlyKeys(parsed, SNAPSHOT_KEYS)) return null;
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
    items: parsed.items.map(item => ({
      ...item,
      versions: item.versions.map(version => ({ ...version })),
      tags: [...item.tags],
    })),
  };
}
