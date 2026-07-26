import { describe, expect, it } from 'vitest';

import {
  createViewportRestorationScheduler,
  type ScrollPosition,
  type ViewportRestorationRuntime,
  type VisualViewportLike,
} from './visual-viewport-restoration';

class FakeVisualViewport implements VisualViewportLike {
  height: number;
  offsetTop = 0;
  private listeners = new Map<'resize' | 'scroll', Set<() => void>>();

  constructor(height: number) {
    this.height = height;
  }

  addEventListener(type: 'resize' | 'scroll', listener: () => void) {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: 'resize' | 'scroll', listener: () => void) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: 'resize' | 'scroll') {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }

  listenerCount() {
    return [...this.listeners.values()].reduce((total, listeners) => total + listeners.size, 0);
  }
}

type PendingCallback = {
  id: number;
  callback: () => void;
  dueAt: number;
};

class FakeRuntime implements ViewportRestorationRuntime {
  viewport: FakeVisualViewport | null;
  layoutHeight = 844;
  now = 0;
  focusCount = 0;
  scrolls: ScrollPosition[] = [];
  private nextId = 1;
  private frames = new Map<number, () => void>();
  private timers = new Map<number, PendingCallback>();

  constructor(viewportHeight: number | null) {
    this.viewport = viewportHeight === null ? null : new FakeVisualViewport(viewportHeight);
  }

  getVisualViewport = () => this.viewport;
  getLayoutViewportHeight = () => this.layoutHeight;

  requestAnimationFrame = (callback: () => void) => {
    const id = this.nextId++;
    this.frames.set(id, callback);
    return id;
  };

  cancelAnimationFrame = (id: number) => {
    this.frames.delete(id);
  };

  setTimeout = (callback: () => void, delayMs: number) => {
    const id = this.nextId++;
    this.timers.set(id, { id, callback, dueAt: this.now + delayMs });
    return id;
  };

  clearTimeout = (id: number) => {
    this.timers.delete(id);
  };

  scrollTo = (position: ScrollPosition) => {
    this.scrolls.push(position);
  };

  focus = () => {
    this.focusCount += 1;
  };

  flushFrames() {
    const callbacks = [...this.frames.values()];
    this.frames.clear();
    for (const callback of callbacks) callback();
  }

  advanceBy(delayMs: number) {
    const target = this.now + delayMs;
    while (true) {
      const next = [...this.timers.values()]
        .filter((timer) => timer.dueAt <= target)
        .sort((left, right) => left.dueAt - right.dueAt || left.id - right.id)[0];
      if (!next) break;
      this.now = next.dueAt;
      this.timers.delete(next.id);
      next.callback();
    }
    this.now = target;
  }

  pendingTimerCount() {
    return this.timers.size;
  }

  pendingFrameCount() {
    return this.frames.size;
  }
}

const position = { left: 0, top: 312 };

function schedule(runtime: FakeRuntime) {
  const scheduler = createViewportRestorationScheduler(runtime, {
    quietMs: 80,
    maxWaitMs: 420,
  });
  scheduler.schedule({ focus: runtime.focus, position });
  return scheduler;
}

describe('visual viewport restoration scheduler', () => {
  it('restores on the next frame when the viewport is already stable', () => {
    const runtime = new FakeRuntime(844);
    schedule(runtime);

    expect(runtime.focusCount).toBe(1);
    expect(runtime.scrolls).toEqual([]);
    runtime.flushFrames();
    expect(runtime.scrolls).toEqual([position]);
  });

  it('waits for one delayed keyboard-close resize', () => {
    const runtime = new FakeRuntime(520);
    schedule(runtime);

    runtime.advanceBy(120);
    expect(runtime.scrolls).toEqual([]);
    runtime.viewport!.height = 844;
    runtime.viewport!.emit('resize');
    runtime.advanceBy(79);
    expect(runtime.scrolls).toEqual([]);
    runtime.advanceBy(1);
    expect(runtime.scrolls).toEqual([position]);
  });

  it('restarts the quiet window across repeated viewport changes', () => {
    const runtime = new FakeRuntime(520);
    schedule(runtime);

    runtime.viewport!.height = 830;
    runtime.viewport!.emit('resize');
    runtime.advanceBy(50);
    runtime.viewport!.height = 844;
    runtime.viewport!.emit('resize');
    runtime.advanceBy(79);
    expect(runtime.scrolls).toEqual([]);
    runtime.advanceBy(1);
    expect(runtime.scrolls).toEqual([position]);
  });

  it('uses the bounded timeout when the viewport never expands', () => {
    const runtime = new FakeRuntime(520);
    schedule(runtime);

    runtime.advanceBy(419);
    expect(runtime.scrolls).toEqual([]);
    runtime.advanceBy(1);
    expect(runtime.scrolls).toEqual([position]);
  });

  it('cancels stale restoration when the picker reopens', () => {
    const runtime = new FakeRuntime(520);
    const scheduler = schedule(runtime);

    scheduler.cancel();
    runtime.viewport!.height = 844;
    runtime.viewport!.emit('resize');
    runtime.advanceBy(500);
    runtime.flushFrames();
    expect(runtime.scrolls).toEqual([]);
  });

  it('cleans listeners, timers, and frames during unmount cleanup', () => {
    const runtime = new FakeRuntime(520);
    const scheduler = schedule(runtime);

    expect(runtime.viewport!.listenerCount()).toBe(2);
    expect(runtime.pendingTimerCount()).toBe(1);
    scheduler.cancel();

    expect(runtime.viewport!.listenerCount()).toBe(0);
    expect(runtime.pendingTimerCount()).toBe(0);
    expect(runtime.pendingFrameCount()).toBe(0);
  });
});
