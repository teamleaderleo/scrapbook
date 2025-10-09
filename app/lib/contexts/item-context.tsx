"use client";
import { createContext, useContext, ReactNode } from 'react';
import { useAllItems } from '@/app/lib/hooks/useAllItems';
import { useAuth } from '@/app/lib/hooks/useAuth';
import type { Item } from '@/app/lib/item-types';

type ItemsContextType = {
  items: Item[];
  loading: boolean;
  reload: () => void;
  user: any;
};

const ItemsContext = createContext<ItemsContextType | null>(null);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // For now, pass user.id to show only user's items when logged in
  // Pass null to show all items (public gallery mode)
  const { items, loading, reload } = useAllItems(user?.id || null);
  
  return (
    <ItemsContext.Provider value={{ items, loading, reload, user }}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) throw new Error('useItems must be used within ItemsProvider');
  return context;
}