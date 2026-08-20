import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const cacheLife = vi.hoisted(() => vi.fn());
const cacheTag = vi.hoisted(() => vi.fn());
const createPublicClient = vi.hoisted(() => vi.fn());
vi.mock('next/cache', () => ({ cacheLife, cacheTag }));
vi.mock('@/utils/supabase/public', () => ({ createPublicClient }));

import { SPACE_PUBLIC_ITEMS_CACHE_TAG } from '@/app/lib/space-cache';
import { loadPublicSpacePage } from './public-data';

function publicRow(id = 'item-1') {
  return {
    id,
    title: 'Cached public item',
    slug: id,
    url: null,
    default_index: 0,
    versions: [],
    tags: ['topic:cache'],
    category: 'notes',
    score: null,
    created_at: '2026-08-10T00:00:00.000Z',
    updated_at: '2026-08-10T00:00:00.000Z',
  };
}

function queryResult(result: unknown) {
  const abortSignal = vi.fn().mockResolvedValue(result);
  const query = {
    select: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    abortSignal,
  };
  query.select.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.range.mockReturnValue(query);
  return { query, abortSignal };
}

describe('loadPublicSpacePage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the anonymous public projection with an explicit cache lifetime and tag', async () => {
    const { query } = queryResult({ data: [publicRow()], error: null });
    const from = vi.fn().mockReturnValue(query);
    createPublicClient.mockReturnValue({ from });

    const pending = loadPublicSpacePage();
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(cacheLife).toHaveBeenCalledWith({
      stale: 60,
      revalidate: 60,
      expire: 86_400,
    });
    expect(cacheTag).toHaveBeenCalledWith(SPACE_PUBLIC_ITEMS_CACHE_TAG);
    expect(from).toHaveBeenCalledWith('items');
    expect(query.select).toHaveBeenCalledOnce();
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(query.range).toHaveBeenCalledWith(0, 99);
    expect(result.databaseItems).toHaveLength(1);
    expect(result.hasMore).toBe(false);
  });

  it('marks a full first page as having more public archive rows', async () => {
    const rows = Array.from({ length: 100 }, (_, index) =>
      publicRow(`item-${index}`)
    );
    const { query } = queryResult({ data: rows, error: null });
    createPublicClient.mockReturnValue({ from: vi.fn().mockReturnValue(query) });

    const pending = loadPublicSpacePage();
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toMatchObject({ hasMore: true });
  });

  it('aborts a public archive request that exceeds the eight-second boundary', async () => {
    const abortSignal = vi.fn(
      (signal: AbortSignal) =>
        new Promise<never>((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new Error('request aborted')),
            { once: true }
          );
        })
    );
    const query = {
      select: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      abortSignal,
    };
    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.range.mockReturnValue(query);
    createPublicClient.mockReturnValue({ from: vi.fn().mockReturnValue(query) });

    const pending = loadPublicSpacePage();
    const expectation = expect(pending).rejects.toThrow('Space archive timed out');
    await vi.advanceTimersByTimeAsync(8_000);
    await expectation;

    const signal = abortSignal.mock.calls[0]?.[0] as AbortSignal;
    expect(signal.aborted).toBe(true);
  });
});
