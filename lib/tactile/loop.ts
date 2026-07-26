export type FixedStepResult = {
  steps: number;
  remainderMs: number;
  droppedMs: number;
};

export type LoopFrame = FixedStepResult & {
  timestampMs: number;
  elapsedMs: number;
};

export type FrameScheduler = {
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (handle: number) => void;
  visibilityState: () => DocumentVisibilityState;
  subscribeVisibility: (callback: () => void) => () => void;
};

export type FixedTimestepLoopOptions = {
  fixedStepMs?: number;
  maxCatchUpSteps?: number;
  scheduler: FrameScheduler;
  step: (deltaSeconds: number) => void;
  render: (frame: LoopFrame) => void;
  onVisibilityPause?: (paused: boolean) => void;
};

export function consumeFixedTime(
  accumulatorMs: number,
  elapsedMs: number,
  fixedStepMs: number,
  maxCatchUpSteps: number,
): FixedStepResult {
  const total = Math.max(0, accumulatorMs) + Math.max(0, elapsedMs);
  const availableSteps = Math.floor(total / fixedStepMs);
  const steps = Math.min(availableSteps, maxCatchUpSteps);
  let remainderMs = total - steps * fixedStepMs;
  let droppedMs = 0;

  if (steps === maxCatchUpSteps && remainderMs >= fixedStepMs) {
    droppedMs = remainderMs - (remainderMs % fixedStepMs);
    remainderMs %= fixedStepMs;
  }

  return { steps, remainderMs, droppedMs };
}

export function createBrowserFrameScheduler(): FrameScheduler {
  return {
    requestFrame: (callback) => window.requestAnimationFrame(callback),
    cancelFrame: (handle) => window.cancelAnimationFrame(handle),
    visibilityState: () => document.visibilityState,
    subscribeVisibility: (callback) => {
      document.addEventListener('visibilitychange', callback);
      return () => document.removeEventListener('visibilitychange', callback);
    },
  };
}

export function createFixedTimestepLoop(options: FixedTimestepLoopOptions) {
  const fixedStepMs = options.fixedStepMs ?? 1000 / 60;
  const maxCatchUpSteps = options.maxCatchUpSteps ?? 5;
  let frameHandle: number | null = null;
  let lastTimestamp: number | null = null;
  let accumulatorMs = 0;
  let manuallyPaused = false;
  let visibilityPaused = options.scheduler.visibilityState() !== 'visible';
  let stopped = false;

  const isPaused = () => manuallyPaused || visibilityPaused;

  const schedule = () => {
    if (stopped || isPaused() || frameHandle !== null) return;
    frameHandle = options.scheduler.requestFrame(onFrame);
  };

  const onFrame: FrameRequestCallback = (timestampMs) => {
    frameHandle = null;
    if (stopped || isPaused()) return;

    const elapsedMs = lastTimestamp === null ? 0 : Math.max(0, timestampMs - lastTimestamp);
    lastTimestamp = timestampMs;
    const result = consumeFixedTime(accumulatorMs, elapsedMs, fixedStepMs, maxCatchUpSteps);
    accumulatorMs = result.remainderMs;
    for (let index = 0; index < result.steps; index += 1) {
      options.step(fixedStepMs / 1000);
    }
    options.render({ ...result, timestampMs, elapsedMs });
    schedule();
  };

  const onVisibilityChange = () => {
    const nextVisibilityPaused = options.scheduler.visibilityState() !== 'visible';
    if (visibilityPaused === nextVisibilityPaused) return;
    visibilityPaused = nextVisibilityPaused;
    lastTimestamp = null;
    accumulatorMs = 0;
    if (frameHandle !== null) {
      options.scheduler.cancelFrame(frameHandle);
      frameHandle = null;
    }
    options.onVisibilityPause?.(visibilityPaused);
    schedule();
  };

  const unsubscribeVisibility = options.scheduler.subscribeVisibility(onVisibilityChange);

  return {
    start() {
      if (stopped) return;
      lastTimestamp = null;
      schedule();
    },
    pause() {
      manuallyPaused = true;
      if (frameHandle !== null) {
        options.scheduler.cancelFrame(frameHandle);
        frameHandle = null;
      }
    },
    resume() {
      if (stopped) return;
      manuallyPaused = false;
      lastTimestamp = null;
      accumulatorMs = 0;
      schedule();
    },
    singleStep() {
      if (stopped) return;
      options.step(fixedStepMs / 1000);
      options.render({
        steps: 1,
        remainderMs: accumulatorMs,
        droppedMs: 0,
        timestampMs: 0,
        elapsedMs: fixedStepMs,
      });
    },
    stop() {
      if (stopped) return;
      stopped = true;
      if (frameHandle !== null) options.scheduler.cancelFrame(frameHandle);
      frameHandle = null;
      unsubscribeVisibility();
    },
    state() {
      return {
        stopped,
        manuallyPaused,
        visibilityPaused,
        scheduled: frameHandle !== null,
        accumulatorMs,
      };
    },
  };
}
