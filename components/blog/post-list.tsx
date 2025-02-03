import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlogPost, PostCategory, categories } from '@/app/lib/definitions/blog';

interface PostListProps {
  posts: BlogPost[];
  title: string;
}

const PostList = ({ posts, title }: PostListProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100%-4rem)]">
          <div className="space-y-4 pr-4">
            {posts.map(post => (
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
  );
};

export default PostList;