import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const createClient = vi.hoisted(() => vi.fn());
vi.mock('@/utils/supabase/server', () => ({ createClient }));

import {
  loadInitialSpaceData,
  SpaceLoadTimeoutError,
  withSpaceTimeout,
} from './data';

describe('withSpaceTimeout', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns a result that settles inside the boundary', async () => {
    await expect(
      withSpaceTimeout(Promise.resolve('open'), 100, 'archive')
    ).resolves.toBe('open');
  });

  it('rejects and aborts work that exceeds the boundary', async () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const pending = withSpaceTimeout(
      new Promise<string>(() => undefined),
      100,
      'archive',
      onTimeout
    );

    const expectation = expect(pending).rejects.toEqual(
      new SpaceLoadTimeoutError('archive')
    );
    await vi.advanceTimersByTimeAsync(100);
    await expectation;
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it('loads published learning items without requiring a sign-in', async () => {
    const abortSignal = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'item-1',
          title: 'A living lesson',
          slug: 'a-living-lesson',
          url: null,
          default_index: 0,
          versions: [
            {
              label: 'Lesson',
              content: 'Start with a question.',
              content_html: '<p>Start with a question.</p>',
              code: null,
              code_html: '',
            },
          ],
          tags: ['mode:read'],
          category: 'explain',
          score: 100,
          created_at: '2026-08-09T00:00:00.000Z',
          updated_at: '2026-08-09T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const query = {
      select: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      abortSignal,
    };
    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.range.mockReturnValue(query);
    const from = vi.fn().mockReturnValue(query);
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from,
    });

    const result = await loadInitialSpaceData();

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('A living lesson');
    expect(result.isAdmin).toBe(false);
    expect(result.error).toBeNull();
    expect(from).toHaveBeenCalledWith('items');
    expect(from).not.toHaveBeenCalledWith('reviews');
  });

  it('starts the public archive request while identity is still loading', async () => {
    let resolveIdentity: (value: {
      data: { user: null };
      error: null;
    }) => void = () => undefined;
    const identity = new Promise<{ data: { user: null }; error: null }>(
      resolve => {
        resolveIdentity = resolve;
      }
    );
    const abortSignal = vi.fn().mockResolvedValue({ data: [], error: null });
    const query = {
      select: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      abortSignal,
    };
    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.range.mockReturnValue(query);
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockReturnValue(identity) },
      from: vi.fn().mockReturnValue(query),
    });

    const pending = loadInitialSpaceData();
    await vi.waitFor(() => expect(abortSignal).toHaveBeenCalledOnce());
    resolveIdentity({ data: { user: null }, error: null });

    await expect(pending).resolves.toMatchObject({
      items: [],
      isAdmin: false,
    });
  });
});
