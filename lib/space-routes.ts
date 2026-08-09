export function duplicateItemHref(itemId: string) {
  const normalizedId = itemId.trim();
  if (!normalizedId) throw new Error('Duplicate source item id is required');

  const query = new URLSearchParams({ duplicate: normalizedId });
  return `/space/add?${query.toString()}`;
}

export function reviewItemHref(itemId: string, tags?: string, lane?: string) {
  const normalizedId = itemId.trim();
  if (!normalizedId) throw new Error('Review item id is required');

  const query = new URLSearchParams({ item: normalizedId });
  if (tags?.trim()) query.set('tags', tags.trim());
  if (lane?.trim()) query.set('lane', lane.trim());
  return `/space/review?${query.toString()}`;
}

export function readItemHref(slug: string, tags?: string, lane?: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) throw new Error('Reading sheet slug is required');

  const query = new URLSearchParams();
  if (tags?.trim()) query.set('tags', tags.trim());
  if (lane?.trim()) query.set('lane', lane.trim());

  const suffix = query.size ? `?${query.toString()}` : '';
  return `/space/read/${encodeURIComponent(normalizedSlug)}${suffix}`;
}
