'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { Rating } from 'ts-fsrs';
import { parseMarkdown, highlightCode } from '@/app/lib/utils/markdown';
import { reviewOnce } from '@/app/lib/fsrs-adapter';
import type { ReviewState } from '@/app/lib/review-types';
import { SPACE_PUBLIC_ITEMS_CACHE_TAG } from '@/app/lib/space-cache';
import { createClient } from '@/utils/supabase/server';
import { requireSpaceAdmin } from './authorization';
import {
  addItemSchema,
  itemIdSchema,
  reviewRatingSchema,
  updateItemSchema,
  type AddItemInput,
  type UpdateItemInput,
} from './validation';

const REVIEW_SELECT = [
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

function toReviewState(value: Record<string, unknown>): ReviewState {
  return {
    due: Number(value.due),
    stability: Number(value.stability ?? 0),
    difficulty: Number(value.difficulty ?? 0),
    scheduled_days: Number(value.scheduled_days ?? 0),
    learning_steps: Number(value.learning_steps ?? 0),
    reps: Number(value.reps ?? 0),
    lapses: Number(value.lapses ?? 0),
    state: Number(value.state) as ReviewState['state'],
    last_review: value.last_review == null ? null : Number(value.last_review),
    suspended: Boolean(value.suspended),
  };
}

function reviewWrite(userId: string, review: ReviewState) {
  return {
    user_id: userId,
    state: review.state,
    due: review.due,
    last_review: review.last_review ?? null,
    stability: review.stability,
    difficulty: review.difficulty,
    scheduled_days: review.scheduled_days,
    learning_steps: review.learning_steps,
    reps: review.reps,
    lapses: review.lapses,
    suspended: review.suspended ?? false,
    updated_at: new Date().toISOString(),
  };
}

function revalidatePublicSpaceItems() {
  updateTag(SPACE_PUBLIC_ITEMS_CACHE_TAG);
  revalidatePath('/space');
}

async function parseVersions(versions: AddItemInput['versions']) {
  return Promise.all(
    versions.map(async version => ({
      label: version.label,
      content: version.content,
      content_html: await parseMarkdown(version.content),
      code: version.code,
      code_html: await highlightCode(version.code, 'python'),
    }))
  );
}

export async function addItemAction(input: AddItemInput) {
  const payload = addItemSchema.parse(input);
  const supabase = await createClient();
  const user = await requireSpaceAdmin(supabase);
  const versions = await parseVersions(payload.versions);

  const { data, error } = await supabase
    .from('items')
    .insert({
      slug: payload.slug,
      user_id: user.id,
      title: payload.title,
      url: payload.url ?? null,
      tags: payload.tags ?? [],
      category: payload.category ?? 'general',
      default_index: payload.defaultIndex ?? 0,
      versions,
      score: payload.score ?? null,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error('Space could not save that item.');

  revalidatePublicSpaceItems();
}

export async function updateItemAction(
  idInput: string,
  input: UpdateItemInput
) {
  const id = itemIdSchema.parse(idInput);
  const updates = updateItemSchema.parse(input);
  const supabase = await createClient();
  await requireSpaceAdmin(supabase);
  const versions = updates.versions
    ? await parseVersions(updates.versions)
    : undefined;

  const { data, error } = await supabase
    .from('items')
    .update({
      ...(updates.slug !== undefined && { slug: updates.slug }),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.url !== undefined && { url: updates.url }),
      ...(updates.tags !== undefined && { tags: updates.tags }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.defaultIndex !== undefined && {
        default_index: updates.defaultIndex,
      }),
      ...(versions && { versions }),
      ...(updates.score !== undefined && { score: updates.score }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error('Space could not save those changes.');
  if (!data)
    throw new Error('That Space item no longer exists or is not writable.');

  revalidatePublicSpaceItems();
}

export async function enrollItemForReviewAction(
  idInput: string
): Promise<ReviewState> {
  const id = itemIdSchema.parse(idInput);
  const supabase = await createClient();
  const user = await requireSpaceAdmin(supabase);

  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (itemError) throw new Error('Space could not verify that item.');
  if (!item) throw new Error('That Space item no longer exists.');

  const { data: existing, error: existingError } = await supabase
    .from('reviews')
    .select(REVIEW_SELECT)
    .eq('item_id', id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError)
    throw new Error('Space could not check the review drawer.');
  if (existing)
    return toReviewState(existing as unknown as Record<string, unknown>);

  const initialReview: ReviewState = {
    state: 0,
    due: Date.now(),
    last_review: null,
    stability: 0,
    difficulty: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: 0,
    lapses: 0,
    suspended: false,
  };

  const { data, error } = await supabase
    .from('reviews')
    .insert({ item_id: id, ...reviewWrite(user.id, initialReview) })
    .select(REVIEW_SELECT)
    .single();

  if (error || !data)
    throw new Error('Space could not add that item to the review drawer.');

  revalidatePath('/space');
  return toReviewState(data as unknown as Record<string, unknown>);
}

export async function reviewItemAction(
  idInput: string,
  ratingInput: Rating
): Promise<ReviewState> {
  const id = itemIdSchema.parse(idInput);
  const rating = reviewRatingSchema.parse(ratingInput) as Rating;
  const supabase = await createClient();
  const user = await requireSpaceAdmin(supabase);

  const { data: current, error: readError } = await supabase
    .from('reviews')
    .select(REVIEW_SELECT)
    .eq('item_id', id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError) throw new Error('Space could not load that review.');
  if (!current) throw new Error('That item is not in the review drawer.');

  const next = reviewOnce(
    toReviewState(current as unknown as Record<string, unknown>),
    rating,
    Date.now()
  );
  const { data, error } = await supabase
    .from('reviews')
    .update(reviewWrite(user.id, next))
    .eq('item_id', id)
    .select('item_id');

  if (error) throw new Error('Space could not save that review.');
  if (!data?.length)
    throw new Error('That review no longer exists or is not writable.');

  revalidatePath('/space');
  return next;
}
