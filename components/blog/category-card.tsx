'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlogPost, PostCategory } from '@/app/lib/definitions/blog';

interface CategoryCardProps {
  categoryKey: PostCategory;
  categoryLabel: string;
  posts: BlogPost[];
}

export default function CategoryCard({ categoryKey, categoryLabel, posts }: CategoryCardProps) {
  return (
    <Link href={`/blog/category/${categoryKey}`}>
      <Card className="h-36 transition-colors hover:bg-accent hover:border-accent-foreground/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{categoryLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-16">
            <div className="space-y-2">
              {posts.slice(0, 3).map(post => (
                <div key={post.id} className="text-sm">
                  <p className="font-medium truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.date}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </Link>
  );
}