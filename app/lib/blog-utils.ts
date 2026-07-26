import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unstable_cache } from 'next/cache';
import {
  type AuthorType,
  type BlogPost,
  type EditorialStatus,
  type PostCategory,
} from '@/app/lib/definitions/blog';

const POSTS_PATH = path.join(process.cwd(), 'content/posts');

function normaliseDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid blog post date: ${String(value)}`);

  return {
    iso: date.toISOString(),
    display: new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date),
  };
}

function parsePost(fileName: string): BlogPost {
  const slug = fileName.replace(/\.mdx?$/, '');
  const filePath = path.join(POSTS_PATH, fileName);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const date = normaliseDate(data.date);

  return {
    id: Number(data.id),
    slug,
    title: String(data.title),
    date: date.display,
    dateIso: date.iso,
    category: data.category as PostCategory,
    blurb: String(data.blurb),
    content,
    author: String(data.author ?? 'Scrapbook archive'),
    authorType: (data.authorType ?? (data.author ? 'human' : 'collective')) as AuthorType,
    model: data.model ? String(data.model) : undefined,
    editor: data.editor ? String(data.editor) : undefined,
    editorialStatus: (data.editorialStatus ?? 'published') as EditorialStatus,
  };
}

const cacheConfig: { revalidate: number | false; tags: string[] } = {
  revalidate: process.env.NODE_ENV === 'development' ? 10 : false,
  tags: ['blog-posts'],
};

export const getBlogPosts = unstable_cache(
  async (): Promise<BlogPost[]> => {
    const postFiles = fs
      .readdirSync(POSTS_PATH)
      .filter((file) => /\.mdx?$/.test(file));

    return postFiles
      .map(parsePost)
      .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());
  },
  ['blog-posts-v2'],
  cacheConfig,
);

export const getBlogPost = unstable_cache(
  async (slug: string): Promise<BlogPost | null> => {
    try {
      return parsePost(`${slug}.mdx`);
    } catch {
      return null;
    }
  },
  ['blog-post-v2'],
  cacheConfig,
);

export const getPostsByCategory = unstable_cache(
  async (category: PostCategory): Promise<BlogPost[]> => {
    const allPosts = await getBlogPosts();
    return allPosts.filter((post) => post.category === category);
  },
  ['blog-posts-by-category-v2'],
  cacheConfig,
);
