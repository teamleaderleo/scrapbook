export function duplicateItemHref(itemId: string) {
  const normalizedId = itemId.trim();
  if (!normalizedId) throw new Error('Duplicate source item id is required');

  const query = new URLSearchParams({ duplicate: normalizedId });
  return `/space/add?${query.toString()}`;
}
