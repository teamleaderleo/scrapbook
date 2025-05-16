import { getPostsByCategory } from '@/app/lib/blog-utils';
import { PostCategory, categories } from '@/app/lib/definitions/blog';
import PostList from '@/components/blog/post-list';
import { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: {
  params: Promise<any> | undefined;
}): Promise<Metadata> {
  let category: PostCategory = 'fragments';
  
  if (params) {
    const resolvedParams = params instanceof Promise ? await params : params;
    // Cast to PostCategory for type safety
    category = resolvedParams.category as PostCategory;
  }
  
  const categoryName = categories[category];
  
  return {
    title: `${categoryName} | teamleaderleo`,
    description: `Blog posts about ${categoryName.toLowerCase()} by teamleaderleo`,
    alternates: {
      canonical: `https://teamleaderleo.com/blog/category/${category}`
    }
  };
}

export default async function CategoryPage({ 
  params 
}: {
  params: Promise<any> | undefined;
}) {
  let category: PostCategory = 'fragments';
  
  if (params) {
    const resolvedParams = params instanceof Promise ? await params : params;
    // Cast to PostCategory for type safety
    category = resolvedParams.category as PostCategory;
  }
  
  const posts = await getPostsByCategory(category);
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Posts in {categories[category]}
      </h1>
      <PostList posts={posts} title={`Posts in ${categories[category]}`} />
    </div>
  );
}