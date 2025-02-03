export type PostCategory = 'fragments' | 'polished' | 'learning';

export interface BlogPost {
  id: number;
  title: string;
  date: string;
  content: string;
  blurb: string;
  category: PostCategory;
  slug: string;
}

export const categories: Record<PostCategory, string> = {
  fragments: "Fragments",
  polished: "Polished",
  learning: "Learning & Review"
};