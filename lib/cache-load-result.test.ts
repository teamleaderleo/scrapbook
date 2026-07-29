import { describe, expect, it } from 'vitest';
import { captureCacheLoad, unwrapCacheLoad } from './cache-load-result';

describe('cache load results', () => {
  it('returns successful values unchanged', async () => {
    const captured = await captureCacheLoad(async () => ({ value: 7 }));

    expect(captured).toEqual({ ok: true, value: { value: 7 } });
    expect(unwrapCacheLoad(captured)).toEqual({ value: 7 });
  });

  it('serializes loader errors before they reach a persistent cache refresh', async () => {
    const timeout = new Error('The operation was aborted due to timeout');
    timeout.name = 'TimeoutError';

    const captured = await captureCacheLoad(async () => {
      throw timeout;
    });

    expect(captured).toEqual({
      ok: false,
      error: {
        name: 'TimeoutError',
        message: 'The operation was aborted due to timeout',
      },
    });

    try {
      unwrapCacheLoad(captured);
      throw new Error('Expected unwrapCacheLoad to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe('TimeoutError');
      expect((error as Error).message).toBe('The operation was aborted due to timeout');
    }
  });

  it('normalizes non-Error rejections', async () => {
    const captured = await captureCacheLoad(async () => {
      throw 'upstream unavailable';
    });

    expect(captured).toEqual({
      ok: false,
      error: { name: 'Error', message: 'upstream unavailable' },
    });
  });
});
