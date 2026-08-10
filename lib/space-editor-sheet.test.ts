import { describe, expect, it, vi } from 'vitest';

import {
  createEditorSheetRestoration,
  resolveEditorSheetViewport,
  type FocusTargetLike,
  type ScrollRegionLike,
} from './space-editor-sheet';

class FakeRuntime {
  private nextFrameId = 1;
  private frames = new Map<number, () => void>();

  requestAnimationFrame = (callback: () => void) => {
    const id = this.nextFrameId++;
    this.frames.set(id, callback);
    return id;
  };

  cancelAnimationFrame = (id: number) => {
    this.frames.delete(id);
  };

  flushFrames() {
    const callbacks = [...this.frames.values()];
    this.frames.clear();
    for (const callback of callbacks) callback();
  }

  pendingFrameCount() {
    return this.frames.size;
  }
}

function focusTarget(isConnected = true) {
  return {
    isConnected,
    focus: vi.fn(),
  } satisfies FocusTargetLike;
}

function scrollRegion(left: number, top: number) {
  return { scrollLeft: left, scrollTop: top } satisfies ScrollRegionLike;
}

describe('mobile Space editor sheet helpers', () => {
  it('uses the visual viewport while a software keyboard reduces the visible area', () => {
    expect(resolveEditorSheetViewport(844, { offsetTop: 24, height: 500 })).toEqual({
      top: 24,
      height: 500,
      bottom: 524,
    });
  });

  it('clamps delayed viewport values to the layout viewport', () => {
    expect(resolveEditorSheetViewport(390, { offsetTop: 380, height: 240 })).toEqual({
      top: 380,
      height: 10,
      bottom: 390,
    });
    expect(resolveEditorSheetViewport(390, null)).toEqual({
      top: 0,
      height: 390,
      bottom: 390,
    });
  });

  it('restores captured scroll regions and the original focus target', () => {
    const runtime = new FakeRuntime();
    const restoration = createEditorSheetRestoration(runtime);
    const target = focusTarget();
    const first = scrollRegion(8, 120);
    const second = scrollRegion(0, 44);

    restoration.capture(target, [first, second]);
    first.scrollLeft = 30;
    first.scrollTop = 900;
    second.scrollTop = 700;
    restoration.restore();

    expect(target.focus).not.toHaveBeenCalled();
    runtime.flushFrames();

    expect(first).toEqual({ scrollLeft: 8, scrollTop: 120 });
    expect(second).toEqual({ scrollLeft: 0, scrollTop: 44 });
    expect(target.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('uses a visible fallback when the original focus target disconnected', () => {
    const runtime = new FakeRuntime();
    const restoration = createEditorSheetRestoration(runtime);
    const disconnected = focusTarget(false);
    const fallback = focusTarget();

    restoration.capture(disconnected, []);
    restoration.restore(fallback);
    runtime.flushFrames();

    expect(disconnected.focus).not.toHaveBeenCalled();
    expect(fallback.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('cancels stale restoration when the sheet reopens before the frame', () => {
    const runtime = new FakeRuntime();
    const restoration = createEditorSheetRestoration(runtime);
    const firstTarget = focusTarget();
    const secondTarget = focusTarget();
    const region = scrollRegion(0, 100);

    restoration.capture(firstTarget, [region]);
    region.scrollTop = 400;
    restoration.restore();
    expect(runtime.pendingFrameCount()).toBe(1);

    restoration.capture(secondTarget, [region]);
    runtime.flushFrames();

    expect(region.scrollTop).toBe(400);
    expect(firstTarget.focus).not.toHaveBeenCalled();
    expect(secondTarget.focus).not.toHaveBeenCalled();
  });
});
