'use client';

import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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

const SPACE_CLIENT_LOAD_TIMEOUT_MS = 10_000;

type ItemsContextType = {
  items: Item[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
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
  initialError?: string | null;
}

export function ItemsProvider({
  children,
  initialItems = [],
  initialIsAdmin = false,
  initialUser = null,
  initialNowMs,
  initialHasMore = false,
  initialError = null,
}: ItemsProviderProps) {
  const { user, loading: authLoading } = useAuth(initialUser);
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<Item[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nowMs] = useState(() => initialNowMs ?? Date.now());
  const [editorOpen, setEditorOpen] = useState(false);
  const activeReload = useRef<AbortController | null>(null);
  const activeLoadMore = useRef<AbortController | null>(null);
  const lastRefreshAt = useRef(initialNowMs ?? 0);
  const isAdmin = initialIsAdmin;

  useEffect(() => {
    setItems(initialItems);
    setHasMore(initialHasMore);
    setLoading(false);
    setRefreshing(false);
    setError(initialError);
    lastRefreshAt.current = Date.now();
  }, [initialError, initialHasMore, initialItems]);

  const fetchPage = useCallback(
    async (offset: number, signal: AbortSignal) => {
      const requestController = new AbortController();
      let timedOut = false;
      const abortFromCaller = () => requestController.abort();
      signal.addEventListener('abort', abortFromCaller, { once: true });
      const timer = window.setTimeout(() => {
        timedOut = true;
        requestController.abort();
      }, SPACE_CLIENT_LOAD_TIMEOUT_MS);

      try {
        const itemsResult = await supabase
          .from('items')
          .select(SPACE_ITEM_SELECT)
          .order('created_at', { ascending: false })
          .range(offset, offset + SPACE_PAGE_SIZE - 1)
          .abortSignal(requestController.signal);

        if (timedOut) throw new Error('Space archive request timed out');
        if (itemsResult.error) throw itemsResult.error;

        const databaseItems = (itemsResult.data ?? []) as unknown as DbItem[];
        const itemIds = databaseItems.map(item => item.id);
        let databaseReviews: DbReview[] = [];

        if (isAdmin && itemIds.length > 0) {
          const reviewsResult = await supabase
            .from('reviews')
            .select(REVIEW_SELECT)
            .in('item_id', itemIds)
            .order('updated_at', { ascending: true })
            .abortSignal(requestController.signal);

          if (timedOut) throw new Error('Space review request timed out');
          if (reviewsResult.error) throw reviewsResult.error;
          databaseReviews = (reviewsResult.data ?? []) as unknown as DbReview[];
        }

        return {
          items: mapDatabaseItemsToItems(databaseItems, databaseReviews),
          hasMore: databaseItems.length === SPACE_PAGE_SIZE,
        };
      } finally {
        window.clearTimeout(timer);
        signal.removeEventListener('abort', abortFromCaller);
      }
    },
    [isAdmin, supabase]
  );

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  }, [supabase]);

  const reload = useCallback(async () => {
    activeReload.current?.abort();
    const controller = new AbortController();
    activeReload.current = controller;
    setError(null);

    if (items.length > 0) setRefreshing(true);
    else setLoading(true);

    try {
      const page = await fetchPage(0, controller.signal);
      if (controller.signal.aborted) return;
      setItems(page.items);
      setHasMore(page.hasMore);
      lastRefreshAt.current = Date.now();
    } catch (reloadError) {
      if (controller.signal.aborted) return;
      console.error('Error reloading items:', reloadError);
      setError(
        items.length > 0
          ? 'Could not refresh items. Showing the last loaded version.'
          : 'Could not load items.'
      );
    } finally {
      if (activeReload.current === controller) activeReload.current = null;
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchPage, items.length]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    activeLoadMore.current?.abort();
    const controller = new AbortController();
    activeLoadMore.current = controller;
    setLoadingMore(true);
    setError(null);

    try {
      const page = await fetchPage(items.length, controller.signal);
      if (controller.signal.aborted) return;
      setItems(current => {
        const existingIds = new Set(current.map(item => item.id));
        return [
          ...current,
          ...page.items.filter(item => !existingIds.has(item.id)),
        ];
      });
      setHasMore(page.hasMore);
    } catch (loadError) {
      if (controller.signal.aborted) return;
      console.error('Error loading more items:', loadError);
      setError('Could not load more items. The current list is unchanged.');
    } finally {
      if (activeLoadMore.current === controller) activeLoadMore.current = null;
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [fetchPage, hasMore, items.length, loadingMore]);

  useEffect(() => {
    const refreshIfStale = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastRefreshAt.current < 60_000) return;
      void reload();
    };

    window.addEventListener('focus', refreshIfStale);
    document.addEventListener('visibilitychange', refreshIfStale);
    return () => {
      window.removeEventListener('focus', refreshIfStale);
      document.removeEventListener('visibilitychange', refreshIfStale);
    };
  }, [reload]);

  useEffect(() => {
    return () => {
      activeReload.current?.abort();
      activeLoadMore.current?.abort();
    };
  }, []);

  return (
    <ItemsContext.Provider
      value={{
        items,
        loading: authLoading || loading,
        refreshing,
        loadingMore,
        error,
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
