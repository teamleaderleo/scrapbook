'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function addItemAction(payload: {
  id: string;
  title: string;
  url?: string;
  tags?: string[];
  category?: string;
  content?: string;
  code?: string | null;
  score?: number | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('items').insert({
    id: payload.id,
    slug: payload.id,
    user_id: user?.id ?? null,
    title: payload.title,
    url: payload.url ?? null,
    tags: payload.tags ?? [],
    category: payload.category ?? 'general',
    content: payload.content ?? '',
    code: payload.code ?? null,
    content_type: 'markdown',
    score: payload.score ?? null,
  });

  if (error) throw new Error(error.message);

  // Make /space fresh for the next read
  revalidatePath('/space');
}

export async function updateItemAction(id: string, updates: any) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/space');
}
