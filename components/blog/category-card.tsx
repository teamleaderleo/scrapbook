import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlogPost, PostCategory } from '@/app/lib/definitions/blog';

interface CategoryCardProps {
  categoryKey: PostCategory;
  categoryLabel: string;
  posts: BlogPost[];
}

const CategoryCard = ({ categoryKey, categoryLabel, posts }: CategoryCardProps) => {
  return (
    <Card className="h-36 hover:bg-gray-50 cursor-pointer">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{categoryLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-16">
          <div className="space-y-2">
            {posts.slice(0, 3).map(post => (
              <div key={post.id} className="text-sm">
                <p className="font-medium truncate">{post.title}</p>
                <p className="text-xs text-gray-500">{post.date}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;