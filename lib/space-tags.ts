const HIDDEN_PRESENTATION_PREFIXES = [
  'collection:',
  'mode:',
  'state:',
  'visibility:',
] as const;

export function displaySpaceTags(tags: string[]) {
  return tags
    .filter(
      tag =>
        !HIDDEN_PRESENTATION_PREFIXES.some(prefix => tag.startsWith(prefix))
    )
    .map(tag => {
      const separator = tag.indexOf(':');
      return separator === -1 ? tag : tag.slice(separator + 1);
    });
}
