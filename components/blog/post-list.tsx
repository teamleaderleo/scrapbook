'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlogPost, PostCategory, categories } from '@/app/lib/definitions/blog';

interface PostListProps {
  posts: BlogPost[];
  title: string;
}

const PostList = ({ posts, title }: PostListProps) => {
  return (
    <Card className="h-full w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-5rem)] overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="space-y-4 pr-4">
            {posts.map(post => (
              <div key={post.id} className="border-b pb-2">
                <Link 
                  href={`/blog/${post.slug}`}
                  className="block hover:text-blue-600"
                >
                  <h3 className="font-semibold text-sm">{post.title}</h3>
                  <p className="text-xs text-gray-500">{post.date}</p>
                </Link>
                <Link
                  href={`/blog/category/${post.category}`}
                  className="inline-block text-xs bg-gray-100 rounded px-2 py-1 mt-1 hover:bg-gray-200"
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
};

export default PostList;