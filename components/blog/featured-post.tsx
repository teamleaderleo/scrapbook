'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlogPost, categories } from '@/app/lib/definitions/blog';

interface FeaturedPostProps {
  post: BlogPost;
  contentHtml: string; // Pre-rendered HTML instead of raw markdown
}

export default function FeaturedPost({ post, contentHtml }: FeaturedPostProps) {
  return (
    <Card className="h-full w-full">
      <CardContent className="p-6 h-full">
        <ScrollArea className="h-full w-full">
          <article className="prose prose-sm dark:prose-invert w-full">
            <Link 
              href={`/blog/${post.slug}`} 
              className="no-underline group"
            >
              <h2 className="text-xl font-bold mt-0 transition-colors group-hover:text-primary-foreground">
                {post.title}
              </h2>
            </Link>
            <div className="flex items-center gap-2 my-2">
              <span className="text-sm text-muted-foreground">{post.date}</span>
              <Link
                href={`/blog/category/${post.category}`}
                className="text-xs bg-secondary text-secondary-foreground rounded px-2 py-1 no-underline transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {categories[post.category]}
              </Link>
            </div>
            {/* Render pre-built HTML instead of parsing markdown */}
            <div 
              className="prose prose-sm dark:prose-invert w-full"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </article>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}