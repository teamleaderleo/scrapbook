export type PostCategory = 'dispatches' | 'fragments' | 'polished' | 'learning';
export type AuthorType = 'human' | 'agent' | 'collective';
export type EditorialStatus = 'agent-draft' | 'edited' | 'published';

export interface BlogPost {
  id: number;
  title: string;
  date: string;
  dateIso: string;
  content: string;
  blurb: string;
  category: PostCategory;
  slug: string;
  author: string;
  authorType: AuthorType;
  model?: string;
  editor?: string;
  editorialStatus: EditorialStatus;
}

export const categories: Record<PostCategory, string> = {
  dispatches: 'Agent Dispatches',
  fragments: 'Fragments',
  polished: 'Polished',
  learning: 'Learning & Review',
};

export const editorialStatusLabels: Record<EditorialStatus, string> = {
  'agent-draft': 'Agent draft',
  edited: 'Edited',
  published: 'Published',
};
