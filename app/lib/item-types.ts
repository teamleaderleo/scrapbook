import type { ReviewState } from "./review-types";

export type Item = {
  id: string;
  userId?: string;
  title: string;
  slug: string | null;
  url: string | null;
  
  content: string;
  contentHtml?: string;
  contentType: 'markdown' | 'html' | 'plaintext';
  code?: string | null;
  codeHtml?: string;
  
  tags: string[];  // ['company:google', 'topic:dp', 'difficulty:hard', 'type:leetcode']
  category: string;  // 'leetcode' | 'article' | 'system-design' | etc
  
  createdAt: number;
  updatedAt: number;
  score?: number;
  
  review?: ReviewState;
};

export type LCItem = Item;