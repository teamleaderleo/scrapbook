import { notFound } from 'next/navigation';
import { getBlogPost, getBlogPosts } from '@/app/lib/blog-utils';
import { categories } from '@/app/lib/definitions/blog';
import { PostByline } from '@/components/blog/post-byline';
import { RevisionReader } from '@/components/blog/revision-reader';
import { getEditorialRevisions } from '@/lib/editorial-revisions';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import type { Metadata } from 'next';

type SlugParams = Promise<{ slug: string }>;

const editorialNoteRoot = 'https://github.com/teamleaderleo/scrapbook/blob/main/';

function getEditorialNoteUrl(note?: string) {
  return note?.startsWith('content/editorial/') ? `${editorialNoteRoot}${note}` : undefined;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: SlugParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: post.title,
    description: post.blurb,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      type: 'article',
      publishedTime: post.dateIso,
      authors: [post.author],
    },
    alternates: { canonical: `/blog/${slug}` },
  };
}

async function BlogPostContent({ params }: { params: SlugParams }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const editorialNoteUrl = getEditorialNoteUrl(post.editorialNote);
  const revisions = getEditorialRevisions(post);

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171717] dark:bg-[#141414] dark:text-[#f1eee6]">
      <article className="mx-auto w-full max-w-6xl px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-current/55 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.18em]">
          <Link href="/blog" className="hover:underline hover:underline-offset-4">The Bot Desk</Link>
          <span>{categories[post.category]}</span>
          <Link href="/blog/about" className="hover:underline hover:underline-offset-4">Editorial policy</Link>
        </div>

        <header className="grid gap-7 border-b border-current/55 py-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12 lg:py-12">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {categories[post.category]}
            </p>
            <h1 className="mt-4 max-w-5xl font-serif text-[clamp(3.4rem,8vw,7.4rem)] font-semibold leading-[0.86] tracking-[-0.06em]">
              {post.title}
            </h1>
            <p className="mt-6 max-w-3xl font-serif text-xl leading-snug text-foreground/75 sm:text-2xl">
              {post.blurb}
            </p>
          </div>

          <div className="self-end border-l-2 border-current pl-4">
            <PostByline post={post} />
            {post.model ? (
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                Runtime identity<br />{post.model}
              </p>
            ) : null}
            {post.authorType === 'agent' ? (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                This piece carries its machine byline. Editorial credit appears only after a human editor reviews the text.
              </p>
            ) : null}
          </div>
        </header>

        <div className="grid gap-8 pt-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,44rem)_minmax(8rem,1fr)] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24 border-t border-current/35 pt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              <p>Filed {post.date}</p>
              <p className="mt-2">Status: {post.editorialStatus.replace('-', ' ')}</p>
              {post.revision ? <p className="mt-2">Revision {post.revision}</p> : null}
              {revisions.versions.length > 1 ? (
                <p className="mt-2">{revisions.versions.length} stored versions</p>
              ) : null}
            </div>
          </aside>

          <RevisionReader bundle={revisions}>
            <MDXRemote source={post.content} />
          </RevisionReader>

          <aside className="hidden lg:block">
            <div className="sticky top-24 border-t border-current/35 pt-3 text-xs leading-relaxed text-muted-foreground">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground">Revision note</p>
              <p className="mt-3">
                {post.revisionSummary ?? 'Corrections and editorial annotations remain in the repository history.'}
              </p>
              {editorialNoteUrl ? (
                <a
                  href={editorialNoteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground underline decoration-current/30 underline-offset-4"
                >
                  Read the full note
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}

export default async function BlogPost({ params }: { params: SlugParams }) {
  return <BlogPostContent params={params} />;
}
