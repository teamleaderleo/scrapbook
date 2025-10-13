"use client";
import { createContext, useContext, ReactNode, useState } from 'react';
import { useAuth } from '@/app/lib/hooks/useAuth';
import type { Item } from '@/app/lib/item-types';
import { createClient } from '@/utils/supabase/client';

type ItemsContextType = {
  items: Item[];
  loading: boolean;
  reload: () => Promise<void>;
  user: any;
  isAdmin: boolean;
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
}

export function ItemsProvider({ 
  children, 
  initialItems = [],
  initialIsAdmin = false,
}: ItemsProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  
  // Use server-provided isAdmin if available, otherwise compute from user
  const ADMIN_USER_IDS = [
    '7f041d78-8d8d-4d77-934d-6e839c2c7e39',
    '9c838f77-83a9-416e-9bd0-ef18e77424e4',
  ];
  const isAdmin = initialIsAdmin || (user ? ADMIN_USER_IDS.includes(user.id) : false);
  
  const reload = async () => {
    setLoading(true);
    const supabase = createClient();
    
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
      contentType: item.content_type as 'markdown' | 'html' | 'plaintext',
      code: item.code || null,
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
    <ItemsContext.Provider value={{ 
      items, 
      loading: authLoading || loading, 
      reload,
      user,
      isAdmin 
    }}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) throw new Error('useItems must be used within ItemsProvider');
  return context;
}