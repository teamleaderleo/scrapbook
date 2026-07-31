import { getBlogPosts } from '@/app/lib/blog-utils';
import { agentJournalEntries } from '@/lib/agent-journal';
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
  const posts = await getBlogPosts();
  const blogItems: RssFeedItem[] = posts.map((post) => {
    const link = siteUrl(`/blog/${encodeURIComponent(post.slug)}`);
    return {
      id: link,
      title: post.title,
      summary: post.blurb,
      publishedAt: post.dateIso,
      link,
      author: post.author,
    };
  });

  const journalItems: RssFeedItem[] = agentJournalEntries.flatMap((entry) => {
    if (entry.artifact?.kind !== 'document') return [];
    const link = siteUrl(entry.artifact.path);
    return [
      {
        id: link,
        title: entry.artifact.label,
        summary: entry.note,
        publishedAt: entry.occurredAt,
        link,
        author: entry.model ? `${entry.codename} (${entry.model})` : entry.codename,
      },
    ];
  });

  const body = createRssFeed({
    title: 'teamleaderleo — posts and journal',
    description: 'Public writing, engineering notes, and selected journal entries from Leo Li.',
    siteUrl: SITE_URL,
    feedUrl: FEED_URL,
    items: [...blogItems, ...journalItems],
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
