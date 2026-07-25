'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/app/lib/hooks/useAuth';
import type { Item } from '@/app/lib/item-types';
import type { DbItem, DbReview } from '@/app/lib/db/supabase';
import { SPACE_ITEM_SELECT, SPACE_PAGE_SIZE } from '@/app/lib/space-data';
import { createClient } from '@/utils/supabase/client';
import { mapDatabaseItemsToItems } from '@/app/lib/utils/database';

const REVIEW_SELECT = [
  'item_id',
  'user_id',
  'updated_at',
  'due',
  'stability',
  'difficulty',
  'scheduled_days',
  'learning_steps',
  'reps',
  'lapses',
  'state',
  'last_review',
  'suspended',
].join(',');

type ItemsContextType = {
  items: Item[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
  user: User | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  nowMs: number;
  editorOpen: boolean;
  setEditorOpen: (open: boolean) => void;
};

const ItemsContext = createContext<ItemsContextType | null>(null);

interface ItemsProviderProps {
  children: ReactNode;
  initialItems?: Item[];
  initialIsAdmin?: boolean;
  initialUser?: User | null;
  initialNowMs?: number;
  initialHasMore?: boolean;
}

export function ItemsProvider({
  children,
  initialItems = [],
  initialIsAdmin = false,
  initialUser = null,
  initialNowMs,
  initialHasMore = false,
}: ItemsProviderProps) {
  const { user, loading: authLoading } = useAuth(initialUser);
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<Item[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nowMs] = useState(() => initialNowMs ?? Date.now());
  const [editorOpen, setEditorOpen] = useState(false);
  const isAdmin = initialIsAdmin;

  useEffect(() => {
    setItems(initialItems);
    setHasMore(initialHasMore);
    setLoading(false);
  }, [initialHasMore, initialItems]);

  const fetchPage = async (offset: number) => {
    const itemsResult = await supabase
      .from('items')
      .select(SPACE_ITEM_SELECT)
      .order('created_at', { ascending: false })
      .range(offset, offset + SPACE_PAGE_SIZE - 1);

    if (itemsResult.error) throw itemsResult.error;

    const databaseItems = (itemsResult.data ?? []) as DbItem[];
    const itemIds = databaseItems.map((item) => item.id);
    let databaseReviews: DbReview[] = [];

    if (isAdmin && itemIds.length > 0) {
      const reviewsResult = await supabase
        .from('reviews')
        .select(REVIEW_SELECT)
        .in('item_id', itemIds);

      if (reviewsResult.error) throw reviewsResult.error;
      databaseReviews = (reviewsResult.data ?? []) as DbReview[];
    }

    return {
      items: mapDatabaseItemsToItems(databaseItems, databaseReviews),
      hasMore: databaseItems.length === SPACE_PAGE_SIZE,
    };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const reload = async () => {
    setLoading(true);
    try {
      const page = await fetchPage(0);
      setItems(page.items);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error('Error reloading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await fetchPage(items.length);
      setItems((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !existingIds.has(item.id))];
      });
      setHasMore(page.hasMore);
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <ItemsContext.Provider
      value={{
        items,
        loading: authLoading || loading,
        loadingMore,
        hasMore,
        reload,
        loadMore,
        user,
        isAdmin,
        signOut,
        nowMs,
        editorOpen,
        setEditorOpen,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) throw new Error('useItems must be used within ItemsProvider');
  return context;
}
