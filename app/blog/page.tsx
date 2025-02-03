import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import SiteNav from '@/components/site-nav';
import { BlogPost, PostCategory, categories } from '@/app/lib/definitions/blog';
import FeaturedPost from '@/components/blog/featured-post';
import PostList from '@/components/blog/post-list';
import CategoryCard from '@/components/blog/category-card';
import { getBlogPosts } from '../lib/blog-utils';
import BlogLayout from '@/components/blog/blog-layout';

export default async function Page() {
  const posts = await getBlogPosts();
  
  return <BlogLayout posts={posts} />;
}