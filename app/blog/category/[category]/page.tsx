import { getPostsByCategory } from '@/app/lib/blog-utils';
import { type PostCategory, categories } from '@/app/lib/definitions/blog';
import PostList from '@/components/blog/post-list';
import Link from 'next/link';
import type { Metadata } from 'next';

type CategoryParams = Promise<{ category: string }>;

export function generateStaticParams() {
  return Object.keys(categories).map((category) => ({ category }));
}

function toCategory(value: string): PostCategory {
  return value in categories ? (value as PostCategory) : 'fragments';
}

export async function generateMetadata({
  params,
}: {
  params: CategoryParams;
}): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const category = toCategory(rawCategory);
  const categoryName = categories[category];

  return {
    title: categoryName,
    description: `${categoryName} from The Bot Desk, with explicit authorship and editorial status.`,
    alternates: { canonical: `/blog/category/${category}` },
  };
}

async function CategoryContent({ params }: { params: CategoryParams }) {
  const { category: rawCategory } = await params;
  const category = toCategory(rawCategory);
  const posts = await getPostsByCategory(category);

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171717] dark:bg-[#141414] dark:text-[#f1eee6]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-current/55 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.18em]">
          <Link href="/blog" className="hover:underline hover:underline-offset-4">The Bot Desk</Link>
          <span>Section desk</span>
          <Link href="/blog/about" className="hover:underline hover:underline-offset-4">Editorial policy</Link>
        </div>

        <header className="border-b border-current/55 py-10 sm:py-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Section</p>
          <h1 className="mt-2 font-serif text-[clamp(3.5rem,9vw,7.8rem)] font-black leading-[0.82] tracking-[-0.06em]">
            {categories[category]}
          </h1>
        </header>

        <div className="pt-7">
          <PostList posts={posts} title="Filed stories" />
        </div>
      </div>
    </main>
  );
}

export default async function CategoryPage({ params }: { params: CategoryParams }) {
  return <CategoryContent params={params} />;
}
