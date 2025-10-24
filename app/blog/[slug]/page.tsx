// app/blog/[slug]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getBlogPost } from '@/app/lib/blog-utils';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { categories } from '@/app/lib/definitions/blog';
import Link from 'next/link';
import { Metadata } from 'next';

type SlugParam = {
  slug: string;
};

export async function generateMetadata({ 
  params 
}: {
  params: Promise<any> | undefined;
}): Promise<Metadata> {
  let slug = '';
  
  if (params) {
    const resolvedParams = params instanceof Promise ? await params : params;
    slug = resolvedParams.slug;
  }
  
  const post = await getBlogPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found | teamleaderleo',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: `${post.title} | teamleaderleo`,
    description: post.blurb,
    openGraph: { title: `${post.title} | teamleaderleo`, type: 'article', publishedTime: post.date },
    alternates: { canonical: `https://teamleaderleo.com/blog/${slug}` },
  };
}

// Skeleton uses semantic tokens (no hardcoded grays)
function BlogPostSkeleton() {
  return (
    <article className="max-w-4xl mx-auto py-8 px-4">
      <div className="h-10 bg-muted rounded w-3/4 mb-4 animate-pulse" />
      <div className="flex items-center gap-2 mt-2 mb-8">
        <div className="h-4 bg-muted rounded w-24 animate-pulse" />
        <span className="text-muted-foreground">•</span>
        <div className="h-6 bg-muted rounded w-20 animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full animate-pulse" />
        <div className="h-4 bg-muted rounded w-full animate-pulse" />
        <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
      </div>
    </article>
  );
}

// Separate component for the blog post content
async function BlogPostContent({ slug }: { slug: string }) {
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-foreground">{post.title}</h1>

      <div className="flex items-center gap-2 mt-2 mb-8">
        <time className="text-sm text-muted-foreground">{post.date}</time>
        <span className="text-muted-foreground">•</span>
        <Link
          href={`/blog/category/${post.category}`}
          className="text-xs rounded px-2 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          {categories[post.category]}
        </Link>
      </div>

      {/* Match “space” typography + dark inversion */}
      <div className="prose dark:prose-invert max-w-none">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}

export default async function BlogPost({
  params,
}: {
  params: Promise<any> | undefined;
}) {
  let slug = '';
  if (params) {
    const resolvedParams = params instanceof Promise ? await params : params;
    slug = resolvedParams.slug;
  }
  return (
    <Suspense fallback={<BlogPostSkeleton />}>
      <BlogPostContent slug={slug} />
    </Suspense>
  );
}
