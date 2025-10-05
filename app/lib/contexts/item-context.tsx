"use client";
import { createContext, useContext, ReactNode } from 'react';
import { useAllItems } from '@/app/lib/hooks/useAllItems';
import type { Item } from '@/app/lib/item-types';

type ItemsContextType = {
  items: Item[];
  loading: boolean;
  reload: () => void;
};

const ItemsContext = createContext<ItemsContextType | null>(null);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const data = useAllItems(); // Fetching once here
  return (
    <ItemsContext.Provider value={data}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) throw new Error('useItems must be used within ItemsProvider');
  return context;
}