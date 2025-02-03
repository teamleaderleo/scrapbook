import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import SiteNav from '@/components/site-nav';
import { BlogPost, PostCategory, categories } from '@/app/lib/definitions/blog';

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
        {/* Main content area */}
        <div className="h-[calc(100vh-3rem-1px)] py-6 flex flex-col">
          {/* Top three-column layout */}
          <div className="grid grid-cols-12 gap-6 flex-1">
            {/* Left Column - Newest First */}
            <div className="col-span-3">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Latest Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100%-4rem)]">
                    <div className="space-y-4 pr-4">
                      {sortedPosts.map(post => (
                        <div key={post.id} className="border-b pb-2">
                          <h3 className="font-semibold text-sm">{post.title}</h3>
                          <p className="text-xs text-gray-500">{post.date}</p>
                          <span className="inline-block text-xs bg-gray-100 rounded px-2 py-1 mt-1">
                            {categories[post.category]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Featured Post */}
            <div className="col-span-6">
              <Card className="h-full">
                <CardContent className="p-6">
                  <ScrollArea className="h-full">
                    <article className="prose prose-sm max-w-none">
                      <h2 className="text-xl font-bold mt-0">{latestPost.title}</h2>
                      <div className="flex items-center gap-2 my-2">
                        <span className="text-sm text-gray-500">{latestPost.date}</span>
                        <span className="text-xs bg-gray-100 rounded px-2 py-1">
                          {categories[latestPost.category]}
                        </span>
                      </div>
                      <ReactMarkdown>
                        {latestPost.content}
                      </ReactMarkdown>
                    </article>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Archive */}
            <div className="col-span-3">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Archive</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100%-4rem)]">
                    <div className="space-y-4 pr-4">
                      {[...sortedPosts].reverse().map(post => (
                        <div key={post.id} className="border-b pb-2">
                          <h3 className="font-semibold text-sm">{post.title}</h3>
                          <p className="text-xs text-gray-500">{post.date}</p>
                          <span className="inline-block text-xs bg-gray-100 rounded px-2 py-1 mt-1">
                            {categories[post.category]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom category cards */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            {Object.entries(categories).map(([key, label]) => (
              <Card key={key} className="h-36 hover:bg-gray-50 cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-16">
                    <div className="space-y-2">
                      {postsByCategory[key as PostCategory]?.slice(0, 3).map(post => (
                        <div key={post.id} className="text-sm">
                          <p className="font-medium truncate">{post.title}</p>
                          <p className="text-xs text-gray-500">{post.date}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogLayout;