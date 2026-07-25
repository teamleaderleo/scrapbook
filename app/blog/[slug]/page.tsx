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
          prefetch
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

export default async function BlogPost({ params }: { params: SlugParams }) {
  return <BlogPostContent params={params} />;
}
