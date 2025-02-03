import { notFound } from 'next/navigation';
import { getBlogPost } from '@/app/lib/blog-utils';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { categories } from '@/app/lib/definitions/blog';
import Link from 'next/link';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.'
    };
  }

  return {
    title: post.title,
    description: `${post.title} - a blog post by teamleaderleo`,
    openGraph: {
      title: post.title,
      type: 'article',
      publishedTime: post.date,
    },
    alternates: {
      canonical: `https://teamleaderleo.com/blog/${params.slug}`
    }
  };
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  
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