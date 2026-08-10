import {
  createSpaceBrowseHref,
  createSpaceBrowseParams,
} from './space-browse-state';

export function duplicateItemHref(itemId: string) {
  const normalizedId = itemId.trim();
  if (!normalizedId) throw new Error('Duplicate source item id is required');

  const query = new URLSearchParams({ duplicate: normalizedId });
  return `/space/add?${query.toString()}`;
}

export function reviewItemHref(itemId: string, tags?: string, lane?: string) {
  const normalizedId = itemId.trim();
  if (!normalizedId) throw new Error('Review item id is required');

  return createSpaceBrowseHref('/space/review', {
    lane,
    tags,
    item: normalizedId,
  });
}

export function readItemHref(slug: string, tags?: string, lane?: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) throw new Error('Reading sheet slug is required');

  const query = createSpaceBrowseParams({ lane, tags }).toString();
  const suffix = query ? `?${query}` : '';
  return `/space/read/${encodeURIComponent(normalizedSlug)}${suffix}`;
}
