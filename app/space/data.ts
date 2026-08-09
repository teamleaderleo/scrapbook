import 'server-only';

import type { User } from '@supabase/supabase-js';
import { isAdminUser } from '@/app/lib/auth/admin';
import type { DbItem, DbReview } from '@/app/lib/db/supabase';
import type { Item } from '@/app/lib/item-types';
import { SPACE_ITEM_SELECT, SPACE_PAGE_SIZE } from '@/app/lib/space-data';
import { mapDatabaseItemsToItems } from '@/app/lib/utils/database';
import { createClient } from '@/utils/supabase/server';

const INITIAL_LOAD_TIMEOUT_MS = 8_000;
const AUTH_TIMEOUT_MS = 5_000;
const REVIEW_LOAD_TIMEOUT_MS = 5_000;

const REVIEW_SELECT = [
  'item_id',
  'user_id',
  'updated_at',
  'due',
  'stability',
  'difficulty',
  'scheduled_days',
  'learning_steps',
  'reps',
  'lapses',
  'state',
  'last_review',
  'suspended',
].join(',');

export class SpaceLoadTimeoutError extends Error {
  constructor(label: string) {
    super(`${label} timed out`);
    this.name = 'SpaceLoadTimeoutError';
  }
}

export function withSpaceTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  label: string,
  onTimeout?: () => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      reject(new SpaceLoadTimeoutError(label));
    }, timeoutMs);

    Promise.resolve(promise).then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export type InitialSpaceData = {
  items: Item[];
  isAdmin: boolean;
  user: User | null;
  nowMs: number;
  hasMore: boolean;
  error: string | null;
};

function unavailableSpaceData(message: string): InitialSpaceData {
  return {
    items: [],
    isAdmin: false,
    user: null,
    nowMs: Date.now(),
    hasMore: false,
    error: message,
  };
}

export async function loadInitialSpaceData(): Promise<InitialSpaceData> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return unavailableSpaceData(
      'Space is resting because its archive is not configured.'
    );
  }

  const supabase = await createClient();
  const userPromise: Promise<User | null> = withSpaceTimeout(
    supabase.auth.getUser(),
    AUTH_TIMEOUT_MS,
    'Space identity'
  )
    .then(authResult => (authResult.error ? null : authResult.data.user))
    .catch(authError => {
      console.warn('Space identity check did not complete:', authError);
      return null;
    });

  const itemsAbortController = new AbortController();
  let itemsResult;
  try {
    [, itemsResult] = await Promise.all([
      userPromise,
      withSpaceTimeout(
        supabase
          .from('items')
          .select(SPACE_ITEM_SELECT)
          .order('created_at', { ascending: false })
          .range(0, SPACE_PAGE_SIZE - 1)
          .abortSignal(itemsAbortController.signal),
        INITIAL_LOAD_TIMEOUT_MS,
        'Space archive',
        () => itemsAbortController.abort()
      ),
    ]);
  } catch (itemsError) {
    console.error('Space archive could not be loaded:', itemsError);
    const user = await userPromise;
    return {
      ...unavailableSpaceData(
        'Space could not open the archive. Try again in a moment.'
      ),
      user,
      isAdmin: isAdminUser(user),
    };
  }

  const user = await userPromise;
  const isAdmin = isAdminUser(user);

  if (itemsResult.error) {
    console.error('Space archive could not be loaded:', itemsResult.error);
    return {
      ...unavailableSpaceData(
        'Space could not open the archive. Try again in a moment.'
      ),
      user,
      isAdmin,
    };
  }

  const databaseItems = (itemsResult.data ?? []) as unknown as DbItem[];
  let databaseReviews: DbReview[] = [];
  let error: string | null = null;

  if (isAdmin && databaseItems.length > 0) {
    const reviewsAbortController = new AbortController();
    try {
      const reviewsResult = await withSpaceTimeout(
        supabase
          .from('reviews')
          .select(REVIEW_SELECT)
          .in(
            'item_id',
            databaseItems.map(item => item.id)
          )
          .order('updated_at', { ascending: true })
          .abortSignal(reviewsAbortController.signal),
        REVIEW_LOAD_TIMEOUT_MS,
        'Space review drawer',
        () => reviewsAbortController.abort()
      );

      if (reviewsResult.error) throw reviewsResult.error;
      databaseReviews = (reviewsResult.data ?? []) as unknown as DbReview[];
    } catch (reviewError) {
      console.error('Space review drawer could not be loaded:', reviewError);
      error =
        'The clippings are here, but the review drawer could not be opened.';
    }
  }

  return {
    items: mapDatabaseItemsToItems(databaseItems, databaseReviews),
    isAdmin,
    user,
    nowMs: Date.now(),
    hasMore: databaseItems.length === SPACE_PAGE_SIZE,
    error,
  };
}
