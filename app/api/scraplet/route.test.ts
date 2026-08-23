import { beforeEach, describe, expect, it, vi } from 'vitest';

const getScrapletPetCount = vi.fn();
const incrementScrapletPetCount = vi.fn();

vi.mock('@/lib/scraplet-store', () => ({
  getScrapletPetCount,
  incrementScrapletPetCount,
}));

import { GET, POST } from './route';

describe('/api/scraplet', () => {
  beforeEach(() => {
    getScrapletPetCount.mockReset();
    incrementScrapletPetCount.mockReset();
  });

  it('returns the shared pet total without caching it', async () => {
    getScrapletPetCount.mockResolvedValue(1284);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    await expect(response.json()).resolves.toEqual({ pets: 1284 });
  });

  it('increments the shared pet total for same-origin requests', async () => {
    incrementScrapletPetCount.mockResolvedValue(1285);
    const request = new Request('https://scrapbook.test/api/scraplet', {
      method: 'POST',
      headers: {
        host: 'scrapbook.test',
        origin: 'https://scrapbook.test',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(incrementScrapletPetCount).toHaveBeenCalledTimes(1);
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
    expect(incrementScrapletPetCount).not.toHaveBeenCalled();
  });
});
