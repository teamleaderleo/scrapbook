import React from 'react';
import { getBlogPosts } from '../lib/blog-utils';
import BlogLayout from '@/components/blog/blog-layout';

export default async function Page() {
  const posts = await getBlogPosts();
  
  return <BlogLayout posts={posts} />;
}