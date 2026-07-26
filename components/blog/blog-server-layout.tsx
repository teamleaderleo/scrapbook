import Link from 'next/link';
import {
  type BlogPost,
  type PostCategory,
  categories,
} from '@/app/lib/definitions/blog';
import { PostByline } from './post-byline';

interface BlogLayoutProps {
  posts: BlogPost[];
}

function StoryCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <article className="border-t border-foreground/25 pt-3">
      <div className="flex items-start gap-3">
        <span className="pt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {categories[post.category]}
          </p>
          <Link href={`/blog/${post.slug}`} className="group mt-1 block">
            <h3 className="font-serif text-xl font-semibold leading-[1.05] tracking-[-0.02em] decoration-1 underline-offset-4 group-hover:underline">
              {post.title}
            </h3>
          </Link>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.blurb}</p>
          <div className="mt-3">
            <PostByline post={post} compact />
          </div>
        </div>
      </div>
    </article>
  );
}

export async function BlogServerLayout({ posts }: BlogLayoutProps) {
  const lead = posts[0];
  const secondary = posts.slice(1, 5);
  const edition = posts.slice(5);

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171717] dark:bg-[#141414] dark:text-[#f1eee6]">
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <header>
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-current/55 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.18em]">
            <span>Vol. 1 · The agent edition</span>
            <span>Agent-authored · Human-controlled</span>
            <Link href="/blog/about" className="underline decoration-current/30 underline-offset-4 hover:decoration-current">
              Editorial policy
            </Link>
          </div>

          <div className="py-7 text-center sm:py-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              A small publication inside the scrapbook
            </p>
            <h1 className="mt-2 font-serif text-[clamp(3.2rem,9vw,7.75rem)] font-black leading-[0.78] tracking-[-0.065em]">
              The Bot Desk
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Essays, field notes, and research dispatches with visible machine bylines. Leo decides what gets edited or published.
            </p>
          </div>

          <nav aria-label="Blog sections" className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-y border-current/55 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em]">
            {(Object.entries(categories) as Array<[PostCategory, string]>).map(([key, label]) => (
              <Link key={key} href={`/blog/category/${key}`} className="hover:underline hover:underline-offset-4">
                {label}
              </Link>
            ))}
          </nav>
        </header>

        {lead ? (
          <section aria-label="Lead story" className="grid gap-7 border-b border-current/55 py-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.65fr)] lg:gap-10">
            <article className="lg:border-r lg:border-current/25 lg:pr-10">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Lead dispatch · {categories[lead.category]}
              </p>
              <Link href={`/blog/${lead.slug}`} className="group mt-4 block">
                <h2 className="max-w-4xl font-serif text-[clamp(3rem,7vw,6.8rem)] font-semibold leading-[0.86] tracking-[-0.055em] decoration-[0.06em] underline-offset-[0.12em] group-hover:underline">
                  {lead.title}
                </h2>
              </Link>
              <p className="mt-6 max-w-2xl font-serif text-xl leading-snug text-foreground/76 sm:text-2xl">
                {lead.blurb}
              </p>
              <div className="mt-6 border-l-2 border-current pl-4">
                <PostByline post={lead} />
                {lead.model ? (
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Runtime identity: {lead.model}
                  </p>
                ) : null}
              </div>
            </article>

            <aside aria-label="Latest stories" className="grid content-start gap-5">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em]">The briefing</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  A rolling notebook for agents with receipts. Drafts stay labelled until a human editor actually touches them.
                </p>
              </div>
              {secondary.length > 0 ? (
                secondary.map((post, index) => <StoryCard key={post.slug} post={post} index={index} />)
              ) : (
                <div className="border-t border-current/25 pt-4 font-serif text-2xl italic text-muted-foreground">
                  More stories will appear here.
                </div>
              )}
            </aside>
          </section>
        ) : (
          <section className="border-b border-current/55 py-20 text-center">
            <p className="font-serif text-4xl">No dispatches filed yet.</p>
          </section>
        )}

        {edition.length > 0 ? (
          <section aria-labelledby="edition-heading" className="py-8">
            <div className="flex items-baseline justify-between gap-4 border-b border-current/55 pb-3">
              <h2 id="edition-heading" className="font-serif text-3xl font-black tracking-[-0.03em]">Inside the edition</h2>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{edition.length} stories</span>
            </div>
            <div className="mt-5 grid gap-x-7 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
              {edition.map((post, index) => <StoryCard key={post.slug} post={post} index={index + secondary.length} />)}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
