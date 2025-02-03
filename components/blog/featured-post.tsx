'use client';

import React from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlogPost, categories } from '@/app/lib/definitions/blog';

interface FeaturedPostProps {
  post: BlogPost;
}

const FeaturedPost = ({ post }: FeaturedPostProps) => {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <ScrollArea className="h-full">
          <article className="prose prose-sm max-w-none">
            <h2 className="text-xl font-bold mt-0">{post.title}</h2>
            <div className="flex items-center gap-2 my-2">
              <span className="text-sm text-gray-500">{post.date}</span>
              <span className="text-xs bg-gray-100 rounded px-2 py-1">
                {categories[post.category]}
              </span>
            </div>
            <div className="mdx-content">
              {post.content}
            </div>
          </article>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FeaturedPost;