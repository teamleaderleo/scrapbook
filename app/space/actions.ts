'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { parseMarkdown, highlightCode } from '@/app/lib/utils/markdown';

export async function addItemAction(payload: {
  slug: string;
  title: string;
  url?: string | null;
  tags?: string[];
  category?: string | null;
  content?: string;
  code?: string | null;
  score?: number | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parse ONCE when saving
  const contentHtml = await parseMarkdown(payload.content ?? '');
  const codeHtml = await highlightCode(payload.code ?? null, 'python');

  // Don't specify id; let Supabase generate it with gen_random_uuid()
  const { error } = await supabase.from('items').insert({
    slug: payload.slug,  // User-provided slug
    user_id: user?.id ?? null,
    title: payload.title,
    url: payload.url ?? null,
    tags: payload.tags ?? [],
    category: payload.category ?? 'general',
    content: payload.content ?? '',
    content_html: contentHtml,
    code: payload.code ?? null,
    code_html: codeHtml,
    content_type: 'markdown',
    score: payload.score ?? null,
  });

  if (error) throw new Error(error.message);

  // Make /space fresh for the next read
  revalidatePath('/space');
}

export async function updateItemAction(id: string, updates: any) {
  const supabase = await createClient();

  // Parse whenever content/code changes
  const contentHtml = updates.content !== undefined 
    ? await parseMarkdown(updates.content ?? '')
    : undefined;
  
  const codeHtml = updates.code !== undefined
    ? await highlightCode(updates.code ?? null, 'python')
    : undefined;

  const { error } = await supabase
    .from('items')
    .update({ 
      ...updates, 
      ...(contentHtml !== undefined && { content_html: contentHtml }),
      ...(codeHtml !== undefined && { code_html: codeHtml }),
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/space');
}