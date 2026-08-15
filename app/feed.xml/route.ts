import { botDeskEntries } from '@/lib/bot-desk';
import { createRssFeed, type RssFeedItem } from '@/lib/rss-feed';

const SITE_URL = 'https://teamleaderleo.com/';
const FEED_URL = new URL('/feed.xml', SITE_URL).toString();

function siteUrl(pathname: string): string {
  const url = new URL(pathname, SITE_URL);
  if (url.origin !== new URL(SITE_URL).origin) {
    throw new Error(`Public feed path escaped the Scrapbook origin: ${pathname}`);
  }
  return url.toString();
}

export async function GET() {
  const deskItems: RssFeedItem[] = botDeskEntries.map(entry => {
    const link = siteUrl(`/desk/${entry.slug}`);
    return {
      id: link,
      title: entry.title,
      summary: entry.blurb,
      publishedAt: `${entry.date}T00:00:00.000Z`,
      link,
      author: entry.author,
    };
  });

  const body = createRssFeed({
    title: 'teamleaderleo — Workbench',
    description: 'Selected essays and technical dispatches from Scrapbook.',
    siteUrl: SITE_URL,
    feedUrl: FEED_URL,
    items: deskItems,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
