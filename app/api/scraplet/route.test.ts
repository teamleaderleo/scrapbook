import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({
  getScrapletPetCount: vi.fn(),
  incrementScrapletPetCount: vi.fn(),
}));

vi.mock('@/lib/scraplet-store', () => store);

import { GET, POST } from './route';

describe('/api/scraplet', () => {
  beforeEach(() => {
    store.getScrapletPetCount.mockReset();
    store.incrementScrapletPetCount.mockReset();
  });

  it('returns the shared pet total without caching it', async () => {
    store.getScrapletPetCount.mockResolvedValue(1284);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    await expect(response.json()).resolves.toEqual({ pets: 1284 });
  });

  it('increments the shared pet total for same-origin requests', async () => {
    store.incrementScrapletPetCount.mockResolvedValue(1285);
    const request = new Request('https://scrapbook.test/api/scraplet', {
      method: 'POST',
      headers: {
        host: 'scrapbook.test',
        origin: 'https://scrapbook.test',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(store.incrementScrapletPetCount).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({ pets: 1285 });
  });

  it('rejects cross-origin increments before touching the store', async () => {
    const request = new Request('https://scrapbook.test/api/scraplet', {
      method: 'POST',
      headers: {
        host: 'scrapbook.test',
        origin: 'https://elsewhere.test',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(store.incrementScrapletPetCount).not.toHaveBeenCalled();
  });
});
