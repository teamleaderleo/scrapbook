import { createClient } from '@supabase/supabase-js'
import type { ReviewState } from '../review-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database row types
export type DbItem = {
  id: string;  // UUID
  user_id: string | null;
  title: string;
  slug: string;  // User-defined text identifier
  url: string | null;
  content: string;
  content_html: string;
  content_type: string;
  code: string | null;
  code_html: string;
  tags: string[];
  category: string;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export type DbReview = ReviewState & {
  item_id: string;
  user_id: string | null;
  updated_at: string;
}