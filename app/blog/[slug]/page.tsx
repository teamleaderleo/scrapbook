import { notFound } from 'next/navigation';
import { getBlogPost } from '@/app/lib/blog-utils';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { categories } from '@/app/lib/definitions/blog';
import Link from 'next/link';
import { Metadata } from 'next';

type SlugParams = {
  slug: string;
};

// Next.js 15.3.2 page props expect this
type PageProps = {
  params: Promise<SlugParams> | SlugParams | undefined;
  searchParams?: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ 
  params 
}: PageProps): Promise<Metadata> {
  // Add type assertions for slug params
  let resolvedParams: SlugParams;
  
  if (!params) {
    throw new Error('Params is undefined');
  }
  
  if (params instanceof Promise) {
    resolvedParams = await params;
  } else {
    resolvedParams = params;
  }
  
  const post = await getBlogPost(resolvedParams.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found | teamleaderleo',
      description: 'The requested blog post could not be found.'
    };
  }

  return {
    title: `${post.title} | teamleaderleo`,
    description: post.blurb,
    openGraph: {
      title: `${post.title} | teamleaderleo`,
      type: 'article',
      publishedTime: post.date,
    },
    alternates: {
      canonical: `https://teamleaderleo.com/blog/${resolvedParams.slug}`
    }
  };
}

export default async function BlogPost({ 
  params 
}: PageProps) {
  // Add type assertions for slug params here too (lil duplicate)
  let resolvedParams: SlugParams;
  
  if (!params) {
    throw new Error('Params is undefined');
  }
  
  if (params instanceof Promise) {
    resolvedParams = await params;
  } else {
    resolvedParams = params;
  }
  
  const post = await getBlogPost(resolvedParams.slug);
  
  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <div className="flex items-center gap-2 mt-2 mb-8">
        <time className="text-gray-600">{post.date}</time>
        <span>•</span>
        <Link
          href={`/blog/category/${post.category}`}
          className="text-sm bg-gray-100 rounded px-2 py-1 hover:bg-gray-200"
        >
          {categories[post.category]}
        </Link>
      </div>
      <div className="prose max-w-none">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}