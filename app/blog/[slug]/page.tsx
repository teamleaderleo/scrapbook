import { notFound } from 'next/navigation';
import { getBlogPost } from '@/app/lib/blog-utils';
import { MDXRemote } from 'next-mdx-remote/rsc';

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  
  if (!post) {
    notFound();
  }

  return (
    <article className="prose prose-lg mx-auto py-8">
      <h1>{post.title}</h1>
      <div className="flex gap-2 text-gray-600 mb-8">
        <time>{post.date}</time>
        <span>•</span>
        <span>{post.category}</span>
      </div>
      <MDXRemote source={post.content} />
    </article>
  );
}