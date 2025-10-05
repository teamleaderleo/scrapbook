import { useEffect, useState } from 'react';
import { supabase, type DbItem, type DbReview } from '../db/supabase';
import type { Item } from '../item-types';
import type { ReviewState } from '@/app/lib/review-types';

export function useAllItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    
    const [itemsResult, reviewsResult] = await Promise.all([
      supabase.from('items').select('*').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*')
    ]);

    if (itemsResult.error) {
      console.error('Error loading items:', itemsResult.error);
      setLoading(false);
      return;
    }

    if (reviewsResult.error) {
      console.error('Error loading reviews:', reviewsResult.error);
    }

    // Build review map
    const reviewsMap = new Map<string, ReviewState>(
      (reviewsResult.data || []).map(r => [r.item_id, {
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

    // Map to Item format
    const mapped: Item[] = (itemsResult.data || []).map(item => ({
      id: item.id,
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
  }

  return { items, loading, reload: loadItems };
}