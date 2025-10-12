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
  isAdmin: boolean;
};

const ItemsContext = createContext<ItemsContextType | null>(null);

const ADMIN_USER_IDS = [
  '7f041d78-8d8d-4d77-934d-6e839c2c7e39', // Google
  '9c838f77-83a9-416e-9bd0-ef18e77424e4', // GitHub
];

export function ItemsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  // Check if current user is admin
  const isAdmin = user ? ADMIN_USER_IDS.includes(user.id) : false;
  
  // Always show ALL items, but fetch reviews only if admin
  const { items, loading: itemsLoading, reload } = useAllItems({ isAdmin });
  
  return (
    <ItemsContext.Provider value={{ 
      items, 
      loading: authLoading || itemsLoading, 
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