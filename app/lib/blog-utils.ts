import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unstable_cache } from 'next/cache';
import { BlogPost, PostCategory } from '@/app/lib/definitions/blog';

const POSTS_PATH = path.join(process.cwd(), 'content/posts');

function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function parsePost(fileName: string): BlogPost {
  const slug = fileName.replace(/\.mdx?$/, '');
  const filePath = path.join(POSTS_PATH, fileName);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  
  const { data, content } = matter(fileContents);
  
  return {
    id: data.id,
    slug,
    title: data.title,
    date: formatDate(data.date),
    category: data.category as PostCategory,
    blurb: data.blurb,
    content: content,
  };
}

// Cache the blog posts list
// Cache indefinitely in production (new posts = new deployment)
// Short cache in development for quick iteration
const cacheConfig: { revalidate: number | false; tags: string[] } = {
  revalidate: process.env.NODE_ENV === 'development' ? 10 : false,
  tags: ['blog-posts'],
};

export const getBlogPosts = unstable_cache(
  async (): Promise<BlogPost[]> => {
    const postFiles = fs
      .readdirSync(POSTS_PATH)
      .filter((file) => /\.mdx?$/.test(file));

    const posts = postFiles.map(parsePost);

    return posts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
  ['blog-posts'],
  cacheConfig
);

// Cache individual blog posts
export const getBlogPost = unstable_cache(
  async (slug: string): Promise<BlogPost | null> => {
    try {
      return parsePost(`${slug}.mdx`);
    } catch (e) {
      return null;
    }
  },
  ['blog-post'],
  cacheConfig
);

// Cache posts by category
export const getPostsByCategory = unstable_cache(
  async (category: PostCategory): Promise<BlogPost[]> => {
    const allPosts = await getBlogPosts();
    return allPosts.filter(post => post.category === category);
  },
  ['blog-posts-by-category'],
  cacheConfig
);