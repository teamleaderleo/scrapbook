import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getBlogPost } from '@/app/lib/blog-utils';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { categories } from '@/app/lib/definitions/blog';
import Link from 'next/link';
import type { Metadata } from 'next';

type SlugParams = Promise<{ slug: string }>;

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
    openGraph: {
      title: post.title,
      type: 'article',
      publishedTime: post.date,
    },
    alternates: { canonical: `/blog/${slug}` },
  };
}

function BlogPostSkeleton() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mb-8 mt-2 flex items-center gap-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <span className="text-muted-foreground">•</span>
        <div className="h-6 w-20 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
      </div>
    </article>
  );
}

async function BlogPostContent({ params }: { params: SlugParams }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground">{post.title}</h1>

      <div className="mb-8 mt-2 flex items-center gap-2">
        <time className="text-sm text-muted-foreground">{post.date}</time>
        <span className="text-muted-foreground">•</span>
        <Link
          href={`/blog/category/${post.category}`}
          className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80"
        >
          {categories[post.category]}
        </Link>
      </div>

      <div className="prose max-w-none dark:prose-invert">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}

export default function BlogPost({ params }: { params: SlugParams }) {
  return (
    <Suspense fallback={<BlogPostSkeleton />}>
      <BlogPostContent params={params} />
    </Suspense>
  );
}
