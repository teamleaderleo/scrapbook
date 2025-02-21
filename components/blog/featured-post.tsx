'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlogPost, categories } from '@/app/lib/definitions/blog';
import ReactMarkdown from 'react-markdown';

interface FeaturedPostProps {
  post: BlogPost;
}

const FeaturedPost = ({ post }: FeaturedPostProps) => {
  return (
    <Card className="h-full w-full">
      <CardContent className="p-6 h-full">
        <ScrollArea className="h-full w-full">
          <article className="prose prose-sm w-full">
            <Link href={`/blog/${post.slug}`} className="no-underline">
              <h2 className="text-xl font-bold mt-0 hover:text-blue-600">{post.title}</h2>
            </Link>
            <div className="flex items-center gap-2 my-2">
              <span className="text-sm text-gray-500">{post.date}</span>
              <Link
                href={`/blog/category/${post.category}`}
                className="text-xs bg-gray-100 rounded px-2 py-1 hover:bg-gray-200 no-underline"
              >
                {categories[post.category]}
              </Link>
            </div>
            <div className="mdx-content w-full">
              <ReactMarkdown className="prose prose-sm">
                {post.content}
              </ReactMarkdown>
            </div>
          </article>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FeaturedPost;