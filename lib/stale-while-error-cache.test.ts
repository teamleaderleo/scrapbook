import { describe, expect, it } from 'vitest';
import { createStaleWhileErrorCache } from './stale-while-error-cache';

function createClock(initial = Date.parse('2026-07-27T00:00:00.000Z')) {
  let timestamp = initial;
  return {
    now: () => timestamp,
    advance: (milliseconds: number) => {
      timestamp += milliseconds;
    },
  };
}

describe('createStaleWhileErrorCache', () => {
  it('reports an initial miss followed by a fresh hit', async () => {
    const clock = createClock();
    let loads = 0;
    const cache = createStaleWhileErrorCache({
      load: async () => ++loads,
      freshForMs: 100,
      staleForMs: 1_000,
      retryBaseMs: 20,
      retryMaxMs: 100,
      now: clock.now,
    });

    const miss = await cache.get();
    const hit = await cache.get();

    expect(miss.value).toBe(1);
    expect(miss.diagnostics.status).toBe('miss');
    expect(hit.value).toBe(1);
    expect(hit.diagnostics.status).toBe('hit');
    expect(loads).toBe(1);
  });

  it('coalesces concurrent misses into one load', async () => {
    const clock = createClock();
    let loads = 0;
    let resolveLoad: ((value: number) => void) | undefined;
    const cache = createStaleWhileErrorCache({
      load: () => {
        loads += 1;
        return new Promise<number>((resolve) => {
          resolveLoad = resolve;
        });
      },
      freshForMs: 100,
      staleForMs: 1_000,
      retryBaseMs: 20,
      retryMaxMs: 100,
      now: clock.now,
    });

    const first = cache.get();
    const second = cache.get();
    expect(loads).toBe(1);

    resolveLoad?.(7);
    await expect(first).resolves.toMatchObject({ value: 7 });
    await expect(second).resolves.toMatchObject({ value: 7 });
    expect(loads).toBe(1);
  });

  it('serves the previous value as stale after a failed refresh', async () => {
    const clock = createClock();
    let shouldFail = false;
    let loads = 0;
    const cache = createStaleWhileErrorCache({
      load: async () => {
        loads += 1;
        if (shouldFail) throw new Error('upstream unavailable');
        return 12;
      },
      freshForMs: 100,
      staleForMs: 1_000,
      retryBaseMs: 20,
      retryMaxMs: 100,
      now: clock.now,
    });

    await cache.get();
    clock.advance(101);
    shouldFail = true;

    const stale = await cache.get();
    expect(stale.value).toBe(12);
    expect(stale.diagnostics.status).toBe('stale');
    expect(stale.diagnostics.consecutiveFailures).toBe(1);
    expect(stale.diagnostics.nextRetryAt).toBe('2026-07-27T00:00:00.121Z');

    clock.advance(10);
    const backedOff = await cache.get();
    expect(backedOff.value).toBe(12);
    expect(backedOff.diagnostics.status).toBe('stale');
    expect(loads).toBe(2);
  });

  it('does not serve a value after the stale window expires', async () => {
    const clock = createClock();
    let shouldFail = false;
    const cache = createStaleWhileErrorCache({
      load: async () => {
        if (shouldFail) throw new Error('upstream unavailable');
        return 4;
      },
      freshForMs: 100,
      staleForMs: 200,
      retryBaseMs: 20,
      retryMaxMs: 100,
      now: clock.now,
    });

    await cache.get();
    clock.advance(201);
    shouldFail = true;

    const unavailable = await cache.get();
    expect(unavailable.value).toBeNull();
    expect(unavailable.diagnostics.status).toBe('miss');
    expect(unavailable.error).toBeInstanceOf(Error);
  });

  it('uses exponential retry backoff capped at the configured maximum', async () => {
    const clock = createClock();
    const cache = createStaleWhileErrorCache({
      load: async () => {
        throw new Error('upstream unavailable');
      },
      freshForMs: 100,
      staleForMs: 1_000,
      retryBaseMs: 20,
      retryMaxMs: 50,
      now: clock.now,
    });

    const first = await cache.get();
    expect(first.diagnostics.nextRetryAt).toBe('2026-07-27T00:00:00.020Z');

    clock.advance(20);
    const second = await cache.get();
    expect(second.diagnostics.nextRetryAt).toBe('2026-07-27T00:00:00.060Z');

    clock.advance(40);
    const third = await cache.get();
    expect(third.diagnostics.nextRetryAt).toBe('2026-07-27T00:00:00.110Z');
    expect(third.diagnostics.consecutiveFailures).toBe(3);
  });

  it('recovers after backoff and clears failure diagnostics', async () => {
    const clock = createClock();
    let value = 3;
    let shouldFail = false;
    const cache = createStaleWhileErrorCache({
      load: async () => {
        if (shouldFail) throw new Error('upstream unavailable');
        return value;
      },
      freshForMs: 100,
      staleForMs: 1_000,
      retryBaseMs: 20,
      retryMaxMs: 100,
      now: clock.now,
    });

    await cache.get();
    clock.advance(101);
    shouldFail = true;
    await cache.get();

    clock.advance(20);
    shouldFail = false;
    value = 8;
    const recovered = await cache.get();

    expect(recovered.value).toBe(8);
    expect(recovered.diagnostics.status).toBe('miss');
    expect(recovered.diagnostics.consecutiveFailures).toBe(0);
    expect(recovered.diagnostics.nextRetryAt).toBeNull();
  });
});
