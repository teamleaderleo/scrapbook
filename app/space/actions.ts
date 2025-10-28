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
  defaultIndex?: number;
  versions: Array<{
    label: string;
    content: string;
    code: string | null;
  }>;
  score?: number | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parse all versions
  const parsedVersions = await Promise.all(
    payload.versions.map(async (v) => ({
      label: v.label,
      content: v.content,
      content_html: await parseMarkdown(v.content),
      code: v.code,
      code_html: await highlightCode(v.code ?? null, 'python'),
    }))
  );

  const { error } = await supabase.from('items').insert({
    slug: payload.slug,
    user_id: user?.id ?? null,
    title: payload.title,
    url: payload.url ?? null,
    tags: payload.tags ?? [],
    category: payload.category ?? 'general',
    default_index: payload.defaultIndex ?? 0,
    versions: parsedVersions,
    score: payload.score ?? null,
  });

  if (error) throw new Error(error.message);

  // Make /space fresh for the next read
  revalidatePath('/space');
}

export async function updateItemAction(id: string, updates: {
  slug?: string;
  title?: string;
  url?: string | null;
  tags?: string[];
  category?: string | null;
  defaultIndex?: number;
  versions?: Array<{
    label: string;
    content: string;
    code: string | null;
  }>;
  score?: number | null;
}) {
  const supabase = await createClient();

  // Parse versions if they're being updated
  const parsedVersions = updates.versions
    ? await Promise.all(
        updates.versions.map(async (v) => ({
          label: v.label,
          content: v.content,
          content_html: await parseMarkdown(v.content),
          code: v.code,
          code_html: await highlightCode(v.code ?? null, 'python'),
        }))
      )
    : undefined;

  const { error } = await supabase
    .from('items')
    .update({
      ...(updates.slug !== undefined && { slug: updates.slug }),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.url !== undefined && { url: updates.url }),
      ...(updates.tags !== undefined && { tags: updates.tags }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.defaultIndex !== undefined && { default_index: updates.defaultIndex }),
      ...(parsedVersions && { versions: parsedVersions }),
      ...(updates.score !== undefined && { score: updates.score }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/space');
}