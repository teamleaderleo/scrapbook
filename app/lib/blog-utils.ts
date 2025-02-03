import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BlogPost, PostCategory } from '@/app/lib/definitions/blog';

const POSTS_PATH = path.join(process.cwd(), 'content/posts');

function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const postFiles = fs
    .readdirSync(POSTS_PATH)
    .filter((file) => /\.mdx?$/.test(file));

  const posts = postFiles.map((fileName) => {
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
  });

  return posts.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(POSTS_PATH, `${slug}.mdx`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    const { data, content } = matter(fileContents);
    
    return {
      id: data.id,
      slug,
      title: data.title,
      date: data.date,
      category: data.category as PostCategory,
      blurb: data.blurb,
      content: content,
    };
  } catch (e) {
    return null;
  }
}

export async function getPostsByCategory(category: PostCategory): Promise<BlogPost[]> {
  const allPosts = await getBlogPosts();
  return allPosts.filter(post => post.category === category);
}