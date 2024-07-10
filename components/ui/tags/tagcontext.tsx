import React, { createContext, useState, useContext, useCallback } from 'react';
import { Tag } from '@/app/lib/definitions';
import { getAllTags } from '@/app/lib/utils-server';
import { ADMIN_UUID } from '@/app/lib/constants';

interface TagContextType {
  allTags: Tag[];
  refreshTags: () => Promise<void>;
}

const TagContext = createContext<TagContextType | undefined>(undefined);

export function TagProvider({ children }: { children: React.ReactNode }) {
  const [allTags, setAllTags] = useState<Tag[]>([]);

  const refreshTags = useCallback(async () => {
    const fetchedTags = await getAllTags(ADMIN_UUID);
    setAllTags(fetchedTags);
  }, []);

  React.useEffect(() => {
    refreshTags();
  }, [refreshTags]);

  return (
    <TagContext.Provider value={{ allTags, refreshTags }}>
      {children}
    </TagContext.Provider>
  );
}

export function useTagContext() {
  const context = useContext(TagContext);
  if (context === undefined) {
    throw new Error('useTagContext must be used within a TagProvider');
  }
  return context;
}