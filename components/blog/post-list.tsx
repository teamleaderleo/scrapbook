import Link from 'next/link';
import { type BlogPost, categories } from '@/app/lib/definitions/blog';
import { PostByline } from './post-byline';

interface PostListProps {
  posts: BlogPost[];
  title: string;
}

export default function PostList({ posts, title }: PostListProps) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b border-current/55 pb-3">
        <h2 className="font-serif text-3xl font-black tracking-[-0.03em]">{title}</h2>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          {posts.length} {posts.length === 1 ? 'story' : 'stories'}
        </span>
      </div>

      <div className="divide-y divide-current/20">
        {posts.map((post, index) => (
          <article key={post.slug} className="grid gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(10rem,0.42fr)] sm:gap-5">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {categories[post.category]}
              </p>
              <Link href={`/blog/${post.slug}`} className="group mt-1 block">
                <h3 className="font-serif text-2xl font-semibold leading-tight tracking-[-0.025em] group-hover:underline group-hover:underline-offset-4">
                  {post.title}
                </h3>
              </Link>
              <div className="mt-3"><PostByline post={post} compact /></div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground sm:border-l sm:border-current/20 sm:pl-5">
              {post.blurb}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
