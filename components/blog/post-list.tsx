'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlogPost, categories } from '@/app/lib/definitions/blog';

interface PostListProps {
  posts: BlogPost[];
  title: string;
}

export default function PostList({ posts, title }: PostListProps) {
  return (
    <Card className="h-full w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)] overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="space-y-4 pr-4">
            {posts.map((post) => (
              <div key={post.id} className="border-b border-border pb-2 last:border-0">
                <Link
                  href={`/blog/${post.slug}`}
                  prefetch
                  className="group block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <h3 className="text-sm font-semibold transition-colors group-hover:text-primary-foreground">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{post.date}</p>
                </Link>
                <Link
                  href={`/blog/category/${post.category}`}
                  prefetch
                  className="mt-1 inline-block rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {categories[post.category]}
                </Link>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
