import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const createClient = vi.hoisted(() => vi.fn());
const loadPublicSpacePage = vi.hoisted(() => vi.fn());
vi.mock('@/utils/supabase/server', () => ({ createClient }));
vi.mock('./public-data', () => ({ loadPublicSpacePage }));

import {
  loadInitialSpaceData,
  SpaceLoadTimeoutError,
  withSpaceTimeout,
} from './data';

describe('withSpaceTimeout', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
    loadPublicSpacePage.mockResolvedValue({
      databaseItems: [],
      hasMore: false,
    });
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

  it('loads cached public learning items without using request-bound item access', async () => {
    loadPublicSpacePage.mockResolvedValue({
      databaseItems: [
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
      hasMore: false,
    });
    const from = vi.fn();
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
    expect(loadPublicSpacePage).toHaveBeenCalledOnce();
    expect(from).not.toHaveBeenCalled();
  });

  it('starts the cached public archive request while identity is still loading', async () => {
    let resolveIdentity: (value: {
      data: { user: null };
      error: null;
    }) => void = () => undefined;
    const identity = new Promise<{ data: { user: null }; error: null }>(
      resolve => {
        resolveIdentity = resolve;
      }
    );
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockReturnValue(identity) },
      from: vi.fn(),
    });

    const pending = loadInitialSpaceData();
    await vi.waitFor(() => expect(loadPublicSpacePage).toHaveBeenCalledOnce());
    resolveIdentity({ data: { user: null }, error: null });

    await expect(pending).resolves.toMatchObject({
      items: [],
      isAdmin: false,
    });
  });

  it('keeps identity context when the shared public archive cannot load', async () => {
    loadPublicSpacePage.mockRejectedValue(new Error('archive offline'));
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn(),
    });

    await expect(loadInitialSpaceData()).resolves.toMatchObject({
      items: [],
      isAdmin: false,
      user: null,
      error: 'Space could not open the archive. Try again in a moment.',
    });
  });
});
