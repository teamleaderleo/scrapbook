import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import SiteNav from '@/components/site-nav';
import { BlogPost, PostCategory, categories } from '@/app/lib/definitions/blog';
import FeaturedPost from '@/components/blog/featured-post';
import PostList from '@/components/blog/post-list';
import CategoryCard from '@/components/blog/category-card';

const posts: BlogPost[] = [
  {
    id: 1,
    title: "My First Blog Post",
    date: "January 27, 2025",
    content: `# My First Blog Post\n\nHold on, this is still under construction...`,
    blurb: "Hold on, this is still under construction. I will be working on posting some more posts this week.",
    category: "fragments" as PostCategory,
    slug: "first-post"
  },
  {
    id: 2,
    title: "Learning TypeScript Generics",
    date: "January 25, 2025",
    content: "",  // We need to add this to match the type
    blurb: "A deep dive into TypeScript generics and their practical applications...",
    category: "learning" as PostCategory,
    slug: "typescript-generics"
  },
];


const BlogLayout = () => {
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const latestPost = sortedPosts[0];

  const postsByCategory = sortedPosts.reduce<Record<PostCategory, BlogPost[]>>((acc, post) => {
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
          {/* Top three-column layout */}
          <div className="grid grid-cols-12 gap-6 flex-1">
            {/* Left Column - Latest Posts */}
            <div className="col-span-3">
              <PostList 
                posts={sortedPosts}
                title="Latest Posts"
              />
            </div>

            {/* Middle Column - Featured Post */}
            <div className="col-span-6">
              <FeaturedPost post={latestPost} />
            </div>

            {/* Right Column - Archive */}
            <div className="col-span-3">
              <PostList 
                posts={[...sortedPosts].reverse()}
                title="Archive"
              />
            </div>
          </div>

          {/* Bottom category cards */}
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