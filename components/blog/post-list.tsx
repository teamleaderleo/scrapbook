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
            {posts.map(post => (
              <div key={post.id} className="border-b border-border pb-2 last:border-0">
                <Link 
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <h3 className="font-semibold text-sm transition-colors group-hover:text-primary-foreground">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{post.date}</p>
                </Link>
                <Link
                  href={`/blog/category/${post.category}`}
                  className="inline-block text-xs bg-secondary text-secondary-foreground rounded px-2 py-1 mt-1 transition-colors hover:bg-accent hover:text-accent-foreground"
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