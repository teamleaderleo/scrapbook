import { getPostsByCategory } from '@/app/lib/blog-utils';
import { PostCategory } from '@/app/lib/definitions/blog';
import PostList from '@/components/blog/post-list';
import { Metadata } from 'next';
import { categories } from '@/app/lib/definitions/blog';

export async function generateMetadata({ params }: { params: { category: PostCategory } }): Promise<Metadata> {
  const categoryName = categories[params.category];
  
  return {
    title: `${categoryName} | teamleaderleo`,
    description: `Blog posts about ${categoryName.toLowerCase()} by teamleaderleo`,
    alternates: {
      canonical: `https://teamleaderleo.com/blog/category/${params.category}`
    }
  };
}

export default async function CategoryPage({ 
  params 
}: { 
  params: { category: PostCategory } 
}) {
  const posts = await getPostsByCategory(params.category);
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Posts in {params.category}
      </h1>
      <PostList posts={posts} title={`Posts in ${params.category}`} />
    </div>
  );
}