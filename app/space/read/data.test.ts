import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const createClient = vi.hoisted(() => vi.fn());
vi.mock('@/utils/supabase/server', () => ({ createClient }));

import { loadReadingSheet } from './data';

describe('loadReadingSheet', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('loads the newest public item for a slug without an auth lookup', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      abortSignal: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'item-1',
          title: 'A reading sheet',
          slug: 'a-reading-sheet',
          url: 'https://example.com/source',
          default_index: 0,
          versions: [
            {
              label: 'Read',
              content: 'A bounded lesson.',
              content_html: '<p>A bounded lesson.</p>',
              code: null,
              code_html: '',
            },
          ],
          tags: ['visibility:public'],
          category: 'explain',
          score: 100,
          created_at: '2026-08-10T00:00:00.000Z',
          updated_at: '2026-08-10T00:00:00.000Z',
        },
        error: null,
      }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.abortSignal.mockReturnValue(query);

    const from = vi.fn().mockReturnValue(query);
    createClient.mockResolvedValue({ from });

    const item = await loadReadingSheet('a-reading-sheet');

    expect(item?.title).toBe('A reading sheet');
    expect(from).toHaveBeenCalledWith('items');
    expect(query.eq).toHaveBeenCalledWith('slug', 'a-reading-sheet');
    expect(query.order).toHaveBeenCalledWith('updated_at', {
      ascending: false,
    });
  });

  it('returns null when the public policy hides or cannot find the slug', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      abortSignal: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    for (const method of [
      'select',
      'eq',
      'order',
      'limit',
      'abortSignal',
    ] as const) {
      query[method].mockReturnValue(query);
    }
    createClient.mockResolvedValue({
      from: vi.fn().mockReturnValue(query),
    });

    await expect(loadReadingSheet('private-or-missing')).resolves.toBeNull();
  });
});
