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
    // If params is a Promise, await it
    const resolvedParams = params instanceof Promise ? await params : params;
    slug = resolvedParams.slug;
  }
  
  const post = await getBlogPost(slug);
  
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
      canonical: `https://teamleaderleo.com/blog/${slug}`
    }
  };
}

export default async function BlogPost({ 
  params 
}: {
  params: Promise<any> | undefined;
}) {
  let slug = '';
  
  if (params) {
    // If params is a Promise, await it
    const resolvedParams = params instanceof Promise ? await params : params;
    slug = resolvedParams.slug;
  }
  
  const post = await getBlogPost(slug);
  
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