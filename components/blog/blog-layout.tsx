'use client';

import React from 'react';
import SiteNav from '@/components/site-nav';
import PostList from './post-list';
import FeaturedPost from './featured-post';
import CategoryCard from './category-card';
import { BlogPost, PostCategory, categories } from '@/app/lib/definitions/blog';

interface BlogLayoutProps {
  posts: BlogPost[];
}

const BlogLayout = ({ posts }: BlogLayoutProps) => {
  const latestPost = posts[0];

  const postsByCategory = posts.reduce<Record<PostCategory, BlogPost[]>>((acc, post) => {
    if (!acc[post.category]) {
      acc[post.category] = [];
    }
    acc[post.category].push(post);
    return acc;
  }, {} as Record<PostCategory, BlogPost[]>);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteNav />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[calc(100vh-3rem-1px)] py-6 flex flex-col">
          <div className="grid grid-cols-12 gap-6 flex-1">
            <div className="col-span-3">
              <PostList 
                posts={posts}
                title="Latest Posts"
              />
            </div>

            <div className="col-span-6">
              <FeaturedPost post={latestPost} />
            </div>

            <div className="col-span-3">
              <PostList 
                posts={[...posts].reverse()}
                title="Archive"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-6">
            {Object.entries(categories).map(([key, label]) => (
              <CategoryCard
                key={key}
                categoryKey={key as PostCategory}
                categoryLabel={label}
                posts={postsByCategory[key as PostCategory] || []}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogLayout;