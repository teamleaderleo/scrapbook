import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import type { DbItem } from '@/app/lib/db/supabase';
import { SPACE_ITEM_SELECT, SPACE_PAGE_SIZE } from '@/app/lib/space-data';
import { SPACE_PUBLIC_ITEMS_CACHE_TAG } from '@/app/lib/space-cache';
import { createPublicClient } from '@/utils/supabase/public';

const PUBLIC_SPACE_LOAD_TIMEOUT_MS = 8_000;

export type PublicSpacePage = {
  databaseItems: DbItem[];
  hasMore: boolean;
};

export async function loadPublicSpacePage(): Promise<PublicSpacePage> {
  'use cache';
  cacheLife({ stale: 60, revalidate: 60, expire: 86_400 });
  cacheTag(SPACE_PUBLIC_ITEMS_CACHE_TAG);

  const supabase = createPublicClient();
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, PUBLIC_SPACE_LOAD_TIMEOUT_MS);

  try {
    const result = await supabase
      .from('items')
      .select(SPACE_ITEM_SELECT)
      .order('created_at', { ascending: false })
      .range(0, SPACE_PAGE_SIZE - 1)
      .abortSignal(controller.signal);

    if (timedOut) throw new Error('Space archive timed out');
    if (result.error) throw result.error;

    const databaseItems = (result.data ?? []) as unknown as DbItem[];
    return {
      databaseItems,
      hasMore: databaseItems.length === SPACE_PAGE_SIZE,
    };
  } catch (error) {
    if (timedOut) throw new Error('Space archive timed out');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
