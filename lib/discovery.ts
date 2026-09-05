export type DiscoveryKind =
  | 'Workbench'
  | 'Knowledge'
  | 'Study'
  | 'Project'
  | 'Page';

export type DiscoveryItem = {
  href: string;
  title: string;
  summary: string;
  kind: DiscoveryKind;
  topics: readonly string[];
  date?: string;
};

export function searchDiscovery(
  items: readonly DiscoveryItem[],
  query: string,
  kind = ''
) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return items
    .filter(item => !kind || item.kind === kind)
    .map(item => {
      const title = item.title.toLocaleLowerCase();
      const topics = item.topics.join(' ').toLocaleLowerCase();
      const text = `${title} ${topics} ${item.summary.toLocaleLowerCase()}`;
      return {
        item,
        score: terms.every(term => text.includes(term))
          ? terms.reduce(
              (score, term) =>
                score +
                (title.includes(term) ? 4 : topics.includes(term) ? 2 : 1),
              0
            )
          : -1,
      };
    })
    .filter(result => result.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.item);
}

export const RECENT_STORAGE_KEY = 'scrapbook:recent-public-pages:v1';
export const RECENT_CHANGE_EVENT = 'scrapbook:recent-changed';

export function parseRecentPaths(raw: string | null): string[] {
  if (!raw || raw.length > 8192) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed.filter(
          (path): path is string =>
            typeof path === 'string' &&
            path.length <= 240 &&
            /^\/(?:desk|knowledge|space\/records|work)\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(
              path
            )
        )
      ),
    ].slice(0, 12);
  } catch {
    return [];
  }
}
