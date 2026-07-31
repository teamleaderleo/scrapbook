export type RssFeedItem = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  link: string;
  author: string;
};

export type RssFeedOptions = {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  items: RssFeedItem[];
  maximumItems?: number;
};

const DEFAULT_MAXIMUM_ITEMS = 50;

function xmlText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '\uFFFD')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function canonicalHttpsUrl(value: string, expectedOrigin?: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error(`RSS feed URL must use credential-free HTTPS: ${value}`);
  }
  if (expectedOrigin && url.origin !== expectedOrigin) {
    throw new Error(`RSS feed item must stay on the site origin: ${value}`);
  }
  url.hash = '';
  return url.toString();
}

function publishedTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`RSS feed date is invalid: ${value}`);
  return timestamp;
}

function boundedText(value: string, label: string, maximum: number): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maximum) {
    throw new Error(`RSS feed ${label} must contain 1–${maximum} characters`);
  }
  return trimmed;
}

export function createRssFeed(options: RssFeedOptions): string {
  const title = boundedText(options.title, 'title', 160);
  const description = boundedText(options.description, 'description', 500);
  const siteUrl = canonicalHttpsUrl(options.siteUrl);
  const siteOrigin = new URL(siteUrl).origin;
  const feedUrl = canonicalHttpsUrl(options.feedUrl, siteOrigin);
  const maximumItems = options.maximumItems ?? DEFAULT_MAXIMUM_ITEMS;

  if (!Number.isSafeInteger(maximumItems) || maximumItems < 1 || maximumItems > 200) {
    throw new Error('RSS feed maximumItems must be an integer between 1 and 200');
  }

  const seenIds = new Set<string>();
  const items = options.items
    .map((item) => {
      const id = canonicalHttpsUrl(item.id, siteOrigin);
      if (seenIds.has(id)) throw new Error(`RSS feed item id is duplicated: ${id}`);
      seenIds.add(id);

      return {
        id,
        title: boundedText(item.title, 'item title', 240),
        summary: boundedText(item.summary, 'item summary', 2_000),
        publishedAt: publishedTimestamp(item.publishedAt),
        link: canonicalHttpsUrl(item.link, siteOrigin),
        author: boundedText(item.author, 'item author', 160),
      };
    })
    .sort((left, right) => right.publishedAt - left.publishedAt)
    .slice(0, maximumItems);

  if (items.length === 0) throw new Error('RSS feed requires at least one public item');

  const itemXml = items
    .map(
      (item) => `    <item>
      <title>${xmlText(item.title)}</title>
      <link>${xmlText(item.link)}</link>
      <guid isPermaLink="true">${xmlText(item.id)}</guid>
      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
      <dc:creator>${xmlText(item.author)}</dc:creator>
      <description>${xmlText(item.summary)}</description>
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlText(title)}</title>
    <link>${xmlText(siteUrl)}</link>
    <description>${xmlText(description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(items[0].publishedAt).toUTCString()}</lastBuildDate>
    <atom:link href="${xmlText(feedUrl)}" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>
`;
}
