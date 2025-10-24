import { useEffect, useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import type { Item } from '../item-types';
import { mapDatabaseItemsToItems } from '@/app/lib/utils/database';

export function useAllItems(options?: { isAdmin?: boolean }) {
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [options?.isAdmin]);

  async function loadItems() {
    setLoading(true);
    
    // Always fetch all items (public gallery)
    const itemsQuery = supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch ALL reviews if admin, otherwise no reviews
    const reviewsPromise = options?.isAdmin
      ? supabase.from('reviews').select('*')
      : Promise.resolve({ data: [], error: null });

    const [itemsResult, reviewsResult] = await Promise.all([
      itemsQuery,
      reviewsPromise
    ]);

    if (itemsResult.error) {
      console.error('Error loading items:', itemsResult.error);
      setLoading(false);
      return;
    }

    if (reviewsResult.error) {
      console.error('Error loading reviews:', reviewsResult.error);
    }

    // Use shared mapping function
    const mapped = mapDatabaseItemsToItems(
      itemsResult.data || [], 
      reviewsResult.data || []
    );

    setItems(mapped);
    setLoading(false);
  }

  return { items, loading, reload: loadItems };
}