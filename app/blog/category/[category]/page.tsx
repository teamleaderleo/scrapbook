import { getPostsByCategory } from '@/app/lib/blog-utils';
import { PostCategory } from '@/app/lib/definitions/blog';
import PostList from '@/components/blog/post-list';

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