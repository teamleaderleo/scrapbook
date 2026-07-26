import { describe, expect, it, vi } from 'vitest';
import { createFixedTimestepLoop, type FrameScheduler } from './loop';

function createFakeScheduler() {
  let visibility: DocumentVisibilityState = 'visible';
  let nextHandle = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  const visibilityListeners = new Set<() => void>();
  const cancelled: number[] = [];

  const scheduler: FrameScheduler = {
    requestFrame(callback) {
      const handle = nextHandle;
      nextHandle += 1;
      callbacks.set(handle, callback);
      return handle;
    },
    cancelFrame(handle) {
      cancelled.push(handle);
      callbacks.delete(handle);
    },
    visibilityState: () => visibility,
    subscribeVisibility(callback) {
      visibilityListeners.add(callback);
      return () => visibilityListeners.delete(callback);
    },
  };

  return {
    scheduler,
    callbacks,
    cancelled,
    visibilityListeners,
    fire(timestamp: number) {
      const entry = callbacks.entries().next().value as [number, FrameRequestCallback] | undefined;
      if (!entry) return;
      callbacks.delete(entry[0]);
      entry[1](timestamp);
    },
    setVisibility(next: DocumentVisibilityState) {
      visibility = next;
      for (const listener of visibilityListeners) listener();
    },
  };
}

describe('fixed timestep lifecycle', () => {
  it('pauses while hidden and resumes without replaying the hidden delta', () => {
    const fake = createFakeScheduler();
    const step = vi.fn();
    const loop = createFixedTimestepLoop({ scheduler: fake.scheduler, step, render: vi.fn() });

    loop.start();
    fake.fire(0);
    fake.fire(17);
    expect(step).toHaveBeenCalledTimes(1);

    fake.setVisibility('hidden');
    expect(fake.callbacks.size).toBe(0);
    fake.setVisibility('visible');
    fake.fire(10_000);
    expect(step).toHaveBeenCalledTimes(1);
    fake.fire(10_017);
    expect(step).toHaveBeenCalledTimes(2);
  });

  it('cancels frames and removes visibility listeners on stop', () => {
    const fake = createFakeScheduler();
    const step = vi.fn();
    const render = vi.fn();
    const loop = createFixedTimestepLoop({ scheduler: fake.scheduler, step, render });

    loop.start();
    expect(fake.callbacks.size).toBe(1);
    expect(fake.visibilityListeners.size).toBe(1);
    loop.stop();

    expect(fake.callbacks.size).toBe(0);
    expect(fake.cancelled).toHaveLength(1);
    expect(fake.visibilityListeners.size).toBe(0);
    fake.fire(1000);
    expect(step).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
  });
});
