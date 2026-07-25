import { getPostsByCategory } from '@/app/lib/blog-utils';
import { type PostCategory, categories } from '@/app/lib/definitions/blog';
import PostList from '@/components/blog/post-list';
import type { Metadata } from 'next';
import { Suspense } from 'react';

type CategoryParams = Promise<{ category: string }>;

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
    description: `Blog posts about ${categoryName.toLowerCase()} by teamleaderleo`,
    alternates: { canonical: `/blog/category/${category}` },
  };
}

async function CategoryContent({ params }: { params: CategoryParams }) {
  const { category: rawCategory } = await params;
  const category = toCategory(rawCategory);
  const posts = await getPostsByCategory(category);

  return (
    <div className="mx-auto max-w-4xl py-8">
      <h1 className="mb-6 text-3xl font-bold">Posts in {categories[category]}</h1>
      <PostList posts={posts} title={`Posts in ${categories[category]}`} />
    </div>
  );
}

export default function CategoryPage({ params }: { params: CategoryParams }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl py-8">Loading posts…</div>}>
      <CategoryContent params={params} />
    </Suspense>
  );
}
