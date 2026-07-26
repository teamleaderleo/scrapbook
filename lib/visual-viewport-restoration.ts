export type ScrollPosition = {
  left: number;
  top: number;
};

type ViewportEvent = 'resize' | 'scroll';

export type VisualViewportLike = {
  height: number;
  offsetTop: number;
  addEventListener: (type: ViewportEvent, listener: () => void) => void;
  removeEventListener: (type: ViewportEvent, listener: () => void) => void;
};

export type ViewportRestorationRuntime = {
  getVisualViewport: () => VisualViewportLike | null;
  getLayoutViewportHeight: () => number;
  requestAnimationFrame: (callback: () => void) => number;
  cancelAnimationFrame: (id: number) => void;
  setTimeout: (callback: () => void, delayMs: number) => number;
  clearTimeout: (id: number) => void;
  scrollTo: (position: ScrollPosition) => void;
};

export type ViewportRestorationOptions = {
  keyboardGapPx?: number;
  quietMs?: number;
  maxWaitMs?: number;
};

export type ViewportRestorationRequest = {
  focus: () => void;
  position: ScrollPosition;
};

export type ViewportRestorationScheduler = {
  schedule: (request: ViewportRestorationRequest) => void;
  cancel: () => void;
};

const DEFAULT_KEYBOARD_GAP_PX = 48;
const DEFAULT_QUIET_MS = 80;
const DEFAULT_MAX_WAIT_MS = 420;

export function createViewportRestorationScheduler(
  runtime: ViewportRestorationRuntime,
  options: ViewportRestorationOptions = {},
): ViewportRestorationScheduler {
  const keyboardGapPx = options.keyboardGapPx ?? DEFAULT_KEYBOARD_GAP_PX;
  const quietMs = options.quietMs ?? DEFAULT_QUIET_MS;
  const maxWaitMs = options.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;

  let generation = 0;
  let frameId: number | null = null;
  let quietTimerId: number | null = null;
  let fallbackTimerId: number | null = null;
  let viewport: VisualViewportLike | null = null;
  let viewportListener: (() => void) | null = null;

  const clearPendingWork = () => {
    if (frameId !== null) runtime.cancelAnimationFrame(frameId);
    if (quietTimerId !== null) runtime.clearTimeout(quietTimerId);
    if (fallbackTimerId !== null) runtime.clearTimeout(fallbackTimerId);
    if (viewport && viewportListener) {
      viewport.removeEventListener('resize', viewportListener);
      viewport.removeEventListener('scroll', viewportListener);
    }

    frameId = null;
    quietTimerId = null;
    fallbackTimerId = null;
    viewport = null;
    viewportListener = null;
  };

  const cancel = () => {
    generation += 1;
    clearPendingWork();
  };

  const schedule = ({ focus, position }: ViewportRestorationRequest) => {
    cancel();
    const activeGeneration = generation;

    focus();

    const finish = () => {
      if (activeGeneration !== generation) return;
      clearPendingWork();
      runtime.scrollTo(position);
    };

    const isKeyboardConstrained = () => {
      if (!viewport) return false;
      const visibleBottom = viewport.offsetTop + viewport.height;
      return runtime.getLayoutViewportHeight() - visibleBottom > keyboardGapPx;
    };

    viewport = runtime.getVisualViewport();
    if (!viewport || !isKeyboardConstrained()) {
      frameId = runtime.requestAnimationFrame(finish);
      return;
    }

    viewportListener = () => {
      if (activeGeneration !== generation) return;
      if (quietTimerId !== null) runtime.clearTimeout(quietTimerId);
      quietTimerId = null;

      if (isKeyboardConstrained()) return;
      quietTimerId = runtime.setTimeout(finish, quietMs);
    };

    viewport.addEventListener('resize', viewportListener);
    viewport.addEventListener('scroll', viewportListener);
    fallbackTimerId = runtime.setTimeout(finish, maxWaitMs);
    viewportListener();
  };

  return { schedule, cancel };
}

export function createBrowserViewportRestorationScheduler(
  options?: ViewportRestorationOptions,
): ViewportRestorationScheduler {
  return createViewportRestorationScheduler(
    {
      getVisualViewport: () => window.visualViewport,
      getLayoutViewportHeight: () => window.innerHeight,
      requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
      cancelAnimationFrame: (id) => window.cancelAnimationFrame(id),
      setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
      clearTimeout: (id) => window.clearTimeout(id),
      scrollTo: ({ left, top }) => window.scrollTo({ left, top, behavior: 'auto' }),
    },
    options,
  );
}
