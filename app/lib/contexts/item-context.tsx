"use client";
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/hooks/useAuth';
import type { Item } from '@/app/lib/item-types';
import { createClient } from '@/utils/supabase/client';

type ItemsContextType = {
  items: Item[];
  loading: boolean;
  reload: () => Promise<void>;
  user: any;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  nowMs: number;
};

const ItemsContext = createContext<ItemsContextType | null>(null);

const ADMIN_USER_IDS = [
  '7f041d78-8d8d-4d77-934d-6e839c2c7e39', // Google
  '9c838f77-83a9-416e-9bd0-ef18e77424e4', // GitHub
];

interface ItemsProviderProps {
  children: ReactNode;
  initialItems?: Item[];
  initialIsAdmin?: boolean;
  initialUser?: any;
  initialNowMs?: number;
}

export function ItemsProvider({ 
  children, 
  initialItems = [],
  initialIsAdmin = false,
  initialUser = null,
  initialNowMs = Date.now(), // Default for client-only usage
}: ItemsProviderProps) {
  // Hydrate auth with server user to avoid flash
  const { user, loading: authLoading } = useAuth(initialUser);

  const [items, setItems] = useState<Item[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [nowMs] = useState(initialNowMs);
  
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  
  const isAdmin =
    initialIsAdmin || (user ? ADMIN_USER_IDS.includes(user.id) : false);

  const supabase = createClient();
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // useAuth subscribes to auth state changes, so `user` will become null automatically.
      // To force-refresh server components, we must do it from the caller with router.refresh().
    } catch (e) {
      console.error("Sign out error:", e);
      throw e;
    }
  };

  const reload = async () => {
    setLoading(true);

    // Fetch items
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error loading items:', itemsError);
      setLoading(false);
      return;
    }

    // Fetch reviews if admin
    let reviewsMap = new Map();
    if (isAdmin) {
      const { data: reviews } = await supabase.from('reviews').select('*');
      if (reviews) {
        reviewsMap = new Map(
          reviews.map(r => [r.item_id, {
            state: r.state,
            due: r.due,
            last_review: r.last_review,
            stability: r.stability,
            difficulty: r.difficulty,
            scheduled_days: r.scheduled_days,
            learning_steps: r.learning_steps,
            reps: r.reps,
            lapses: r.lapses,
            suspended: r.suspended,
          }])
        );
      }
    }

    // Map to Item format
    const mapped: Item[] = (itemsData || []).map(item => ({
      id: item.id,
      userId: item.user_id || undefined,
      title: item.title,
      slug: item.slug,
      url: item.url,
      content: item.content,
      contentHtml: item.content_html,
      contentType: item.content_type as 'markdown' | 'html' | 'plaintext',
      code: item.code || null,
      codeHtml: item.code_html,
      tags: item.tags || [],
      category: item.category,
      createdAt: new Date(item.created_at).getTime(),
      updatedAt: new Date(item.updated_at).getTime(),
      score: item.score || undefined,
      review: reviewsMap.get(item.id),
    }));

    setItems(mapped);
    setLoading(false);
  };

  return (
    <ItemsContext.Provider
      value={{
        items,
        loading: authLoading || loading,
        reload,
        user,
        isAdmin,
        signOut,
        nowMs,
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
