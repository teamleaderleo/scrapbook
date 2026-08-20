import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Rating } from 'ts-fsrs';

const {
  createClient,
  requireSpaceAdmin,
  from,
  parseMarkdown,
  highlightCode,
  revalidatePath,
  updateTag,
} = vi.hoisted(() => ({
  createClient: vi.fn(),
  requireSpaceAdmin: vi.fn(),
  from: vi.fn(),
  parseMarkdown: vi.fn(),
  highlightCode: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath, updateTag }));
vi.mock('@/utils/supabase/server', () => ({ createClient }));
vi.mock('./authorization', () => ({ requireSpaceAdmin }));
vi.mock('@/app/lib/utils/markdown', () => ({ parseMarkdown, highlightCode }));

import { SPACE_PUBLIC_ITEMS_CACHE_TAG } from '@/app/lib/space-cache';
import {
  addItemAction,
  enrollItemForReviewAction,
  reviewItemAction,
  updateItemAction,
} from './actions';

const itemId = '24bb5d50-6dd6-414d-b890-1e2692ca9c8a';
const validItem = {
  slug: 'server-authorized-note',
  title: 'Server-authorized note',
  versions: [{ label: 'v1', content: '# Note', code: null }],
};

describe('Space server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({ auth: { getUser: vi.fn() }, from });
    requireSpaceAdmin.mockRejectedValue(new Error('not allowed'));
    parseMarkdown.mockResolvedValue('<h1>Note</h1>');
    highlightCode.mockResolvedValue('');
  });

  it.each([
    ['add', () => addItemAction(validItem)],
    ['update', () => updateItemAction(itemId, { title: 'Changed' })],
    ['enroll', () => enrollItemForReviewAction(itemId)],
    ['review', () => reviewItemAction(itemId, Rating.Good)],
  ])(
    'does not reach the database when %s authorization fails',
    async (_name, action) => {
      await expect(action()).rejects.toThrow('not allowed');
      expect(requireSpaceAdmin).toHaveBeenCalledOnce();
      expect(from).not.toHaveBeenCalled();
      expect(updateTag).not.toHaveBeenCalled();
    }
  );

  it('validates identifiers before opening an authenticated client', async () => {
    await expect(
      updateItemAction('not-an-id', { title: 'Changed' })
    ).rejects.toThrow();
    await expect(reviewItemAction('not-an-id', Rating.Good)).rejects.toThrow();
    expect(createClient).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });

  it('authorizes before parsing or inserting an item and invalidates the public cache after success', async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: itemId }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    from.mockReturnValue({ insert });
    requireSpaceAdmin.mockResolvedValue({ id: 'admin-id' });

    await expect(addItemAction(validItem)).resolves.toBeUndefined();

    expect(requireSpaceAdmin).toHaveBeenCalledOnce();
    expect(parseMarkdown).toHaveBeenCalledWith('# Note');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'admin-id' })
    );
    expect(updateTag).toHaveBeenCalledWith(SPACE_PUBLIC_ITEMS_CACHE_TAG);
    expect(revalidatePath).toHaveBeenCalledWith('/space');
    expect(requireSpaceAdmin.mock.invocationCallOrder[0]).toBeLessThan(
      parseMarkdown.mock.invocationCallOrder[0]
    );
  });

  it('does not invalidate public cache when an item update matched no row', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ update });
    requireSpaceAdmin.mockResolvedValue({ id: 'admin-id' });

    await expect(
      updateItemAction(itemId, { title: 'Changed' })
    ).rejects.toThrow('That Space item no longer exists or is not writable.');
    expect(updateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
