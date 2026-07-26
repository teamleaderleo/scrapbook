export const NAVIGATION_HISTORY_STORAGE_KEY = 'scrapbook:navigation-duration-history:v1';
export const NAVIGATION_INITIAL_PROGRESS = 0.18;
export const NAVIGATION_PROGRESS_CAP = 0.9;
export const NAVIGATION_MIN_VISIBLE_MS = 220;
export const NAVIGATION_SLOW_STATUS_MS = 4_000;
export const NAVIGATION_FAILURE_STATUS_MS = 15_000;
export const NAVIGATION_COMPLETION_HOLD_MS = 140;
export const NAVIGATION_FADE_MS = 180;
export const NAVIGATION_TICK_MS = 100;

const DEFAULT_ESTIMATE_MS = 900;
const MIN_DURATION_MS = 180;
const MAX_DURATION_MS = 8_000;
const MAX_ROUTE_ESTIMATES = 8;
const ROUTE_SAMPLE_WEIGHT = 0.35;
const GLOBAL_SAMPLE_WEIGHT = 0.2;

type DurationEstimate = {
  durationMs: number;
  samples: number;
  updatedAt: number;
};

export type NavigationDurationHistory = {
  version: 1;
  global: DurationEstimate;
  routes: Record<string, DurationEstimate>;
};

export type NavigationKind = 'link' | 'programmatic' | 'history';
export type NavigationPhase =
  | 'idle'
  | 'running'
  | 'slow'
  | 'settling'
  | 'completing'
  | 'fading'
  | 'failed';

export type NavigationProgressState = {
  phase: NavigationPhase;
  href: string;
  label: string;
  kind: NavigationKind;
  progress: number;
  estimateMs: number;
  startedAt: number;
  minVisibleUntil: number;
  settledAt: number | null;
  failureMessage: string | null;
};

export type NavigationProgressAction =
  | {
      type: 'start';
      href: string;
      label: string;
      kind: NavigationKind;
      estimateMs: number;
      now: number;
    }
  | { type: 'tick'; now: number }
  | { type: 'settle'; now: number }
  | { type: 'complete'; now: number }
  | { type: 'fade' }
  | { type: 'cancel' }
  | { type: 'fail'; message?: string }
  | { type: 'reset' };

export const idleNavigationProgressState: NavigationProgressState = {
  phase: 'idle',
  href: '',
  label: '',
  kind: 'link',
  progress: 0,
  estimateMs: DEFAULT_ESTIMATE_MS,
  startedAt: 0,
  minVisibleUntil: 0,
  settledAt: null,
  failureMessage: null,
};

export function createNavigationDurationHistory(): NavigationDurationHistory {
  return {
    version: 1,
    global: {
      durationMs: DEFAULT_ESTIMATE_MS,
      samples: 0,
      updatedAt: 0,
    },
    routes: {},
  };
}

function clampDuration(durationMs: number) {
  if (!Number.isFinite(durationMs)) return DEFAULT_ESTIMATE_MS;
  return Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, Math.round(durationMs)));
}

function validEstimate(value: unknown): value is DurationEstimate {
  if (!value || typeof value !== 'object') return false;
  const estimate = value as Partial<DurationEstimate>;
  return (
    typeof estimate.durationMs === 'number' &&
    Number.isFinite(estimate.durationMs) &&
    typeof estimate.samples === 'number' &&
    Number.isFinite(estimate.samples) &&
    typeof estimate.updatedAt === 'number' &&
    Number.isFinite(estimate.updatedAt)
  );
}

export function parseNavigationDurationHistory(value: string | null): NavigationDurationHistory {
  if (!value) return createNavigationDurationHistory();

  try {
    const parsed = JSON.parse(value) as Partial<NavigationDurationHistory>;
    if (
      parsed.version !== 1 ||
      !validEstimate(parsed.global) ||
      !parsed.routes ||
      typeof parsed.routes !== 'object'
    ) {
      return createNavigationDurationHistory();
    }

    const routes = Object.fromEntries(
      Object.entries(parsed.routes)
        .filter((entry): entry is [string, DurationEstimate] => validEstimate(entry[1]))
        .sort((left, right) => right[1].updatedAt - left[1].updatedAt)
        .slice(0, MAX_ROUTE_ESTIMATES)
        .map(([family, estimate]) => [
          family,
          {
            durationMs: clampDuration(estimate.durationMs),
            samples: Math.max(0, Math.min(50, Math.round(estimate.samples))),
            updatedAt: Math.max(0, Math.round(estimate.updatedAt)),
          },
        ]),
    );

    return {
      version: 1,
      global: {
        durationMs: clampDuration(parsed.global.durationMs),
        samples: Math.max(0, Math.min(50, Math.round(parsed.global.samples))),
        updatedAt: Math.max(0, Math.round(parsed.global.updatedAt)),
      },
      routes,
    };
  } catch {
    return createNavigationDurationHistory();
  }
}

export function navigationRouteFamily(href: string) {
  const pathname = href.split(/[?#]/, 1)[0] || '/';
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return firstSegment ? `/${firstSegment}` : '/';
}

export function estimateNavigationDuration(history: NavigationDurationHistory, href: string) {
  return history.routes[navigationRouteFamily(href)]?.durationMs ?? history.global.durationMs;
}

function updateEstimate(previous: DurationEstimate, sampleMs: number, weight: number, now: number) {
  const sample = clampDuration(sampleMs);
  const durationMs =
    previous.samples === 0
      ? sample
      : Math.round(previous.durationMs * (1 - weight) + sample * weight);

  return {
    durationMs: clampDuration(durationMs),
    samples: Math.min(50, previous.samples + 1),
    updatedAt: Math.max(0, Math.round(now)),
  };
}

export function recordNavigationDuration(
  history: NavigationDurationHistory,
  href: string,
  durationMs: number,
  now = Date.now(),
): NavigationDurationHistory {
  const family = navigationRouteFamily(href);
  const currentRoute = history.routes[family] ?? {
    durationMs: history.global.durationMs,
    samples: 0,
    updatedAt: 0,
  };
  const routes = {
    ...history.routes,
    [family]: updateEstimate(currentRoute, durationMs, ROUTE_SAMPLE_WEIGHT, now),
  };
  const boundedRoutes = Object.fromEntries(
    Object.entries(routes)
      .sort((left, right) => right[1].updatedAt - left[1].updatedAt)
      .slice(0, MAX_ROUTE_ESTIMATES),
  );

  return {
    version: 1,
    global: updateEstimate(history.global, durationMs, GLOBAL_SAMPLE_WEIGHT, now),
    routes: boundedRoutes,
  };
}

// This percentage is a time-based visual estimate. It never claims byte or network transfer progress.
export function estimatedNavigationProgress(
  elapsedMs: number,
  estimateMs: number,
  previousProgress = 0,
) {
  const safeElapsed = Math.max(0, elapsedMs);
  const safeEstimate = clampDuration(estimateMs);
  const ratio = safeElapsed / safeEstimate;
  const estimated =
    NAVIGATION_INITIAL_PROGRESS +
    (NAVIGATION_PROGRESS_CAP - NAVIGATION_INITIAL_PROGRESS) * (1 - Math.exp(-2.2 * ratio));

  return Math.min(NAVIGATION_PROGRESS_CAP, Math.max(previousProgress, estimated));
}

export function transitionNavigationProgress(
  state: NavigationProgressState,
  action: NavigationProgressAction,
): NavigationProgressState {
  switch (action.type) {
    case 'start': {
      const replacesActiveNavigation = state.phase === 'running' || state.phase === 'slow';
      return {
        phase: 'running',
        href: action.href,
        label: action.label,
        kind: action.kind,
        progress: replacesActiveNavigation
          ? Math.max(state.progress, NAVIGATION_INITIAL_PROGRESS)
          : NAVIGATION_INITIAL_PROGRESS,
        estimateMs: clampDuration(action.estimateMs),
        startedAt: action.now,
        minVisibleUntil: action.now + NAVIGATION_MIN_VISIBLE_MS,
        settledAt: null,
        failureMessage: null,
      };
    }

    case 'tick': {
      if (state.phase !== 'running' && state.phase !== 'slow') return state;
      const elapsedMs = action.now - state.startedAt;
      const progress = estimatedNavigationProgress(elapsedMs, state.estimateMs, state.progress);

      if (elapsedMs >= NAVIGATION_FAILURE_STATUS_MS) {
        return {
          ...state,
          phase: 'failed',
          progress,
          failureMessage: 'Navigation is taking longer than expected. Try the link again or reload this page.',
        };
      }

      return {
        ...state,
        phase: elapsedMs >= NAVIGATION_SLOW_STATUS_MS ? 'slow' : state.phase,
        progress,
      };
    }

    case 'settle':
      if (state.phase === 'idle' || state.phase === 'fading' || state.phase === 'completing') return state;
      if (action.now < state.minVisibleUntil) {
        return {
          ...state,
          phase: 'settling',
          settledAt: action.now,
          failureMessage: null,
        };
      }
      return {
        ...state,
        phase: 'completing',
        progress: 1,
        settledAt: action.now,
        failureMessage: null,
      };

    case 'complete':
      if (state.phase !== 'settling') return state;
      return {
        ...state,
        phase: 'completing',
        progress: 1,
        settledAt: state.settledAt ?? action.now,
      };

    case 'fade':
      if (state.phase === 'idle') return state;
      return {
        ...state,
        phase: 'fading',
      };

    case 'cancel':
      if (state.phase === 'idle') return state;
      return {
        ...state,
        phase: 'fading',
        failureMessage: null,
      };

    case 'fail':
      if (state.phase === 'idle') return state;
      return {
        ...state,
        phase: 'failed',
        progress: Math.max(state.progress, NAVIGATION_PROGRESS_CAP),
        failureMessage:
          action.message ?? 'Navigation could not finish. Try the link again or reload this page.',
      };

    case 'reset':
      return idleNavigationProgressState;
  }
}
