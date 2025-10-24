"use client";
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/hooks/useAuth';
import type { Item } from '@/app/lib/item-types';
import { createClient } from '@/utils/supabase/client';
import { mapDatabaseItemsToItems } from '@/app/lib/utils/database';

type ItemsContextType = {
  items: Item[];
  loading: boolean;
  reload: () => Promise<void>;
  user: any;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  nowMs: number;
  editorOpen: boolean;
  setEditorOpen: (open: boolean) => void;
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
  initialNowMs = Date.now(),
}: ItemsProviderProps) {
  // Hydrate auth with server user to avoid flash
  const { user, loading: authLoading } = useAuth(initialUser);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [nowMs] = useState(initialNowMs);
  const [editorOpen, setEditorOpen] = useState(false);
  
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  
  const isAdmin =
    initialIsAdmin || (user ? ADMIN_USER_IDS.includes(user.id) : false);

  const supabase = createClient();
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
      throw e;
    }
  };

  const reload = async () => {
    setLoading(true);

    // Fetch items and reviews
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
    let reviewsData = [];
    if (isAdmin) {
      const { data } = await supabase.from('reviews').select('*');
      if (data) reviewsData = data;
    }

    // Use shared mapping function
    const mapped = mapDatabaseItemsToItems(itemsData || [], reviewsData);
    
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