import 'server-only';

import { cache } from 'react';
import type { DbItem } from '@/app/lib/db/supabase';
import type { Item } from '@/app/lib/item-types';
import { SPACE_ITEM_SELECT } from '@/app/lib/space-data';
import { mapDatabaseItemsToItems } from '@/app/lib/utils/database';
import { createClient } from '@/utils/supabase/server';
import { withSpaceTimeout } from '../data';

const READING_SHEET_TIMEOUT_MS = 8_000;

export const loadReadingSheet = cache(
  async (slug: string): Promise<Item | null> => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error('Space archive is not configured.');
    }

    const supabase = await createClient();
    const abortController = new AbortController();
    const { data, error } = await withSpaceTimeout(
      supabase
        .from('items')
        .select(SPACE_ITEM_SELECT)
        .eq('slug', slug)
        .order('updated_at', { ascending: false })
        .limit(1)
        .abortSignal(abortController.signal)
        .maybeSingle(),
      READING_SHEET_TIMEOUT_MS,
      'Space reading sheet',
      () => abortController.abort()
    );

    if (error) throw new Error('Space could not load this reading sheet.');
    if (!data) return null;

    return mapDatabaseItemsToItems([data as unknown as DbItem])[0] ?? null;
  }
);
