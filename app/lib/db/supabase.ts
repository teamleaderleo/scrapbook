import { createClient } from '@supabase/supabase-js'
import type { ReviewState } from '../review-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database row types are slightly different due to the Review state thing
export type DbItem = {
  id: string;
  title: string;
  slug: string | null;
  url: string | null;
  content: string;
  content_type: string;
  tags: string[];
  category: string;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export type DbReview = ReviewState & {
  item_id: string;
  updated_at: string;
}