export type VisualViewportSnapshot = {
  height: number;
  offsetTop: number;
};

export type EditorSheetViewport = {
  top: number;
  height: number;
  bottom: number;
};

export function resolveEditorSheetViewport(
  layoutHeight: number,
  viewport?: VisualViewportSnapshot | null
): EditorSheetViewport {
  const safeLayoutHeight = Math.max(0, layoutHeight);
  if (!viewport) {
    return { top: 0, height: safeLayoutHeight, bottom: safeLayoutHeight };
  }

  const top = Math.max(0, Math.min(viewport.offsetTop, safeLayoutHeight));
  const height = Math.max(0, Math.min(viewport.height, safeLayoutHeight - top));
  return { top, height, bottom: top + height };
}

export type FocusTargetLike = {
  isConnected?: boolean;
  focus: (options?: { preventScroll?: boolean }) => void;
};

export type ScrollRegionLike = {
  scrollLeft: number;
  scrollTop: number;
};

export type EditorSheetRestorationRuntime = {
  requestAnimationFrame: (callback: () => void) => number;
  cancelAnimationFrame: (id: number) => void;
};

export type EditorSheetRestoration = {
  capture: (
    focusTarget: FocusTargetLike | null,
    regions: Iterable<ScrollRegionLike>
  ) => void;
  restore: (fallbackFocus?: FocusTargetLike | null) => void;
  cancel: () => void;
};

export function createEditorSheetRestoration(
  runtime: EditorSheetRestorationRuntime
): EditorSheetRestoration {
  let generation = 0;
  let frameId: number | null = null;
  let focusTarget: FocusTargetLike | null = null;
  let scrollSnapshots: Array<{
    region: ScrollRegionLike;
    left: number;
    top: number;
  }> = [];

  const cancelFrame = () => {
    if (frameId !== null) runtime.cancelAnimationFrame(frameId);
    frameId = null;
  };

  const cancel = () => {
    generation += 1;
    cancelFrame();
  };

  const capture = (
    nextFocusTarget: FocusTargetLike | null,
    regions: Iterable<ScrollRegionLike>
  ) => {
    cancel();
    focusTarget = nextFocusTarget;
    scrollSnapshots = Array.from(regions, region => ({
      region,
      left: region.scrollLeft,
      top: region.scrollTop,
    }));
  };

  const restore = (fallbackFocus: FocusTargetLike | null = null) => {
    cancelFrame();
    const activeGeneration = generation;
    frameId = runtime.requestAnimationFrame(() => {
      frameId = null;
      if (activeGeneration !== generation) return;

      for (const snapshot of scrollSnapshots) {
        snapshot.region.scrollLeft = snapshot.left;
        snapshot.region.scrollTop = snapshot.top;
      }

      const target =
        focusTarget?.isConnected === false ? fallbackFocus : focusTarget;
      target?.focus({ preventScroll: true });
    });
  };

  return { capture, restore, cancel };
}

export function createBrowserEditorSheetRestoration() {
  return createEditorSheetRestoration({
    requestAnimationFrame: callback => window.requestAnimationFrame(callback),
    cancelAnimationFrame: id => window.cancelAnimationFrame(id),
  });
}
