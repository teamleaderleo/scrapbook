import { getBlogPosts } from '../lib/blog-utils';
import { BlogServerLayout } from '@/components/blog/blog-server-layout';

export default async function Page() {
  const posts = await getBlogPosts();
  return <BlogServerLayout posts={posts} />;
}