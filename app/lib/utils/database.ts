import type { Item } from '@/app/lib/item-types';
import type { ReviewState } from '@/app/lib/review-types';
import type { DbItem, DbReview } from '../db/supabase';

/**
 * Maps raw database items and reviews to the Item type format
 */
export function mapDatabaseItemsToItems(
  databaseItems: DbItem[],
  databaseReviews: DbReview[] = []
): Item[] {
  // Build review map
  // DbReview extends ReviewState, so we can extract just the ReviewState fields
  const reviewsMap = new Map<string, ReviewState>(
    databaseReviews.map(r => {
      // Destructure to exclude item_id, user_id, updated_at
      const { item_id, user_id, updated_at, ...reviewState } = r;
      return [item_id, reviewState];
    })
  );

  // Map to Item format
  return databaseItems.map(item => ({
    id: item.id,
    userId: item.user_id || undefined,
    title: item.title,
    slug: item.slug,
    url: item.url,
    defaultIndex: item.default_index,
    versions: item.versions.map(v => ({
      label: v.label,
      content: v.content,
      contentHtml: v.content_html,
      code: v.code,
      codeHtml: v.code_html,
    })),
    tags: item.tags,
    category: item.category,
    createdAt: new Date(item.created_at).getTime(),
    updatedAt: new Date(item.updated_at).getTime(),
    score: item.score || undefined,
    review: reviewsMap.get(item.id),
  }));
}