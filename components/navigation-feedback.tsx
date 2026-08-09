'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  NAVIGATION_COMPLETION_HOLD_MS,
  NAVIGATION_FAILURE_STATUS_MS,
  NAVIGATION_FADE_MS,
  NAVIGATION_HISTORY_STORAGE_KEY,
  NAVIGATION_INITIAL_PROGRESS,
  NAVIGATION_MIN_VISIBLE_MS,
  NAVIGATION_PROGRESS_CAP,
  NAVIGATION_SLOW_STATUS_MS,
  createNavigationDurationHistory,
  estimateNavigationDuration,
  estimatedNavigationProgress,
  idleNavigationProgressState,
  parseNavigationDurationHistory,
  recordNavigationDuration,
  transitionNavigationProgress,
  type NavigationKind,
} from '@/lib/navigation-progress';

const IDLE_PREFETCH_ROUTES = ['/', '/time', '/gallery', '/journal', '/atelier'];
const NAVIGATION_START_EVENT = 'scrapbook:navigation-start';
const NAVIGATION_CANCEL_EVENT = 'scrapbook:navigation-cancel';
const NAVIGATION_ERROR_EVENT = 'scrapbook:navigation-error';
const NAVIGATION_PROGRESS_SNAPSHOT_MS = 180;
const NAVIGATION_ANIMATION_MIN_MS = 720;
const NAVIGATION_ANIMATION_ESTIMATE_MULTIPLIER = 2.4;
const NAVIGATION_ANIMATION_OFFSETS = [0, 0.08, 0.18, 0.32, 0.5, 0.72, 1] as const;

type NavigationStartDetail = {
  href: string;
  label?: string;
};

type NavigationErrorDetail = {
  message?: string;
};

type ActiveNavigation = {
  href: string;
  label: string;
  kind: NavigationKind;
  startedAt: number;
  minVisibleUntil: number;
};

export function startNavigationFeedback(href: string, label?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<NavigationStartDetail>(NAVIGATION_START_EVENT, {
      detail: { href, label },
    }),
  );
}

export function cancelNavigationFeedback() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(NAVIGATION_CANCEL_EVENT));
}

export function failNavigationFeedback(message?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<NavigationErrorDetail>(NAVIGATION_ERROR_EVENT, {
      detail: { message },
    }),
  );
}

function anchorFromTarget(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLAnchorElement>('a[href]') : null;
}

function internalDestination(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== '_self') return null;
  if (anchor.hasAttribute('download')) return null;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (!['http:', 'https:'].includes(url.protocol)) return null;

  return `${url.pathname}${url.search}`;
}

function normaliseDestination(href: string) {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function destinationLabel(href: string) {
  const path = href.split('?')[0];
  if (path === '/') return 'home';
  return path.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') ?? 'page';
}

function persistDurationHistory(history: ReturnType<typeof createNavigationDurationHistory>) {
  try {
    window.localStorage.setItem(NAVIGATION_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Navigation feedback stays in-memory when storage is unavailable.
  }
}

function navigationAnimationDuration(estimateMs: number) {
  return Math.min(
    NAVIGATION_FAILURE_STATUS_MS,
    Math.max(NAVIGATION_ANIMATION_MIN_MS, estimateMs * NAVIGATION_ANIMATION_ESTIMATE_MULTIPLIER),
  );
}

function renderedProgress(element: HTMLElement | null) {
  if (!element?.parentElement) return NAVIGATION_INITIAL_PROGRESS;
  const railWidth = element.parentElement.getBoundingClientRect().width;
  if (railWidth <= 0) return NAVIGATION_INITIAL_PROGRESS;
  const progressWidth = element.getBoundingClientRect().width;
  return Math.min(1, Math.max(NAVIGATION_INITIAL_PROGRESS, progressWidth / railWidth));
}

function progressKeyframes(startProgress: number, estimateMs: number) {
  const duration = navigationAnimationDuration(estimateMs);
  return NAVIGATION_ANIMATION_OFFSETS.map((offset) => ({
    offset,
    transform: `scaleX(${estimatedNavigationProgress(offset * duration, estimateMs, startProgress)})`,
  }));
}

export function NavigationFeedback() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(transitionNavigationProgress, idleNavigationProgressState);
  const activeNavigation = useRef<ActiveNavigation | null>(null);
  const historyRef = useRef(createNavigationDurationHistory());
  const prefetched = useRef(new Set<string>());
  const progressElement = useRef<HTMLDivElement | null>(null);
  const progressAnimation = useRef<Animation | null>(null);
  const animationOrigin = useRef(NAVIGATION_INITIAL_PROGRESS);
  const completionFrame = useRef<number | null>(null);
  const progressSnapshotTimer = useRef<number | null>(null);
  const slowTimer = useRef<number | null>(null);
  const failureTimer = useRef<number | null>(null);
  const completionTimer = useRef<number | null>(null);
  const fadeTimer = useRef<number | null>(null);
  const resetTimer = useRef<number | null>(null);
  const routeKey = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const previousRouteKey = useRef(routeKey);

  useEffect(() => {
    try {
      historyRef.current = parseNavigationDurationHistory(
        window.localStorage.getItem(NAVIGATION_HISTORY_STORAGE_KEY),
      );
    } catch {
      historyRef.current = createNavigationDurationHistory();
    }
  }, []);

  const clearPhaseTimers = useCallback(() => {
    for (const timer of [
      progressSnapshotTimer,
      slowTimer,
      failureTimer,
      completionTimer,
      fadeTimer,
      resetTimer,
    ]) {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const clearCompletionFrame = useCallback(() => {
    if (completionFrame.current !== null) window.cancelAnimationFrame(completionFrame.current);
    completionFrame.current = null;
  }, []);

  const freezeProgressAnimation = useCallback(() => {
    const element = progressElement.current;
    const currentProgress = renderedProgress(element);
    progressAnimation.current?.cancel();
    progressAnimation.current = null;
    if (element) element.style.transform = `scaleX(${currentProgress})`;
    return currentProgress;
  }, []);

  const scheduleFade = useCallback(() => {
    fadeTimer.current = window.setTimeout(() => {
      dispatch({ type: 'fade' });
    }, NAVIGATION_COMPLETION_HOLD_MS);
    resetTimer.current = window.setTimeout(() => {
      dispatch({ type: 'reset' });
    }, NAVIGATION_COMPLETION_HOLD_MS + NAVIGATION_FADE_MS);
  }, []);

  const beginNavigation = useCallback(
    (rawHref: string, rawLabel: string | undefined, kind: NavigationKind) => {
      const href = normaliseDestination(rawHref);
      if (!href) return;
      const current = `${window.location.pathname}${window.location.search}`;
      if (kind !== 'history' && href === current) return;

      clearPhaseTimers();
      clearCompletionFrame();
      const startProgress = progressElement.current
        ? freezeProgressAnimation()
        : NAVIGATION_INITIAL_PROGRESS;
      animationOrigin.current = startProgress;

      const now = performance.now();
      const label = rawLabel ?? destinationLabel(href);
      activeNavigation.current = {
        href,
        label,
        kind,
        startedAt: now,
        minVisibleUntil: now + NAVIGATION_MIN_VISIBLE_MS,
      };
      dispatch({
        type: 'start',
        href,
        label,
        kind,
        estimateMs: estimateNavigationDuration(historyRef.current, href),
        startProgress,
        now,
      });

      progressSnapshotTimer.current = window.setTimeout(() => {
        dispatch({ type: 'tick', now: performance.now() });
      }, NAVIGATION_PROGRESS_SNAPSHOT_MS);
      slowTimer.current = window.setTimeout(() => {
        dispatch({ type: 'tick', now: performance.now() });
      }, NAVIGATION_SLOW_STATUS_MS);
      failureTimer.current = window.setTimeout(() => {
        dispatch({ type: 'tick', now: performance.now() });
      }, NAVIGATION_FAILURE_STATUS_MS);
    },
    [clearCompletionFrame, clearPhaseTimers, freezeProgressAnimation],
  );

  const settleNavigation = useCallback(() => {
    const active = activeNavigation.current;
    if (!active) return;
    activeNavigation.current = null;
    clearPhaseTimers();

    const now = performance.now();
    const durationMs = Math.max(0, now - active.startedAt);
    historyRef.current = recordNavigationDuration(historyRef.current, active.href, durationMs);
    persistDurationHistory(historyRef.current);

    try {
      performance.measure(`scrapbook:navigation:${active.kind}`, {
        start: active.startedAt,
        end: now,
      });
    } catch {
      // Performance measurements are advisory and never affect navigation.
    }

    dispatch({ type: 'settle', now });
    const remainingVisibleMs = Math.max(0, active.minVisibleUntil - now);
    if (remainingVisibleMs > 0) {
      completionTimer.current = window.setTimeout(() => {
        dispatch({ type: 'complete', now: performance.now() });
        scheduleFade();
      }, remainingVisibleMs);
      return;
    }

    scheduleFade();
  }, [clearPhaseTimers, scheduleFade]);

  const cancelNavigation = useCallback(() => {
    activeNavigation.current = null;
    clearPhaseTimers();
    clearCompletionFrame();
    freezeProgressAnimation();
    dispatch({ type: 'cancel' });
    resetTimer.current = window.setTimeout(() => dispatch({ type: 'reset' }), NAVIGATION_FADE_MS);
  }, [clearCompletionFrame, clearPhaseTimers, freezeProgressAnimation]);

  useEffect(() => {
    if (previousRouteKey.current === routeKey) return;
    previousRouteKey.current = routeKey;
    settleNavigation();
  }, [routeKey, settleNavigation]);

  useEffect(() => {
    const element = progressElement.current;
    if (!element || state.startedAt === 0) return;

    progressAnimation.current?.cancel();
    progressAnimation.current = null;
    const startProgress = animationOrigin.current;
    element.style.transform = `scaleX(${startProgress})`;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const animation = element.animate(progressKeyframes(startProgress, state.estimateMs), {
      duration: navigationAnimationDuration(state.estimateMs),
      easing: 'linear',
      fill: 'forwards',
    });
    progressAnimation.current = animation;

    return () => {
      if (progressAnimation.current !== animation) return;
      const currentProgress = renderedProgress(element);
      animation.cancel();
      progressAnimation.current = null;
      element.style.transform = `scaleX(${currentProgress})`;
    };
  }, [state.estimateMs, state.startedAt]);

  useEffect(() => {
    const element = progressElement.current;
    if (!element) return;

    if (state.phase === 'completing') {
      const currentProgress = freezeProgressAnimation();
      element.style.transform = `scaleX(${currentProgress})`;
      clearCompletionFrame();
      completionFrame.current = window.requestAnimationFrame(() => {
        element.style.transform = 'scaleX(1)';
        completionFrame.current = null;
      });
      return;
    }

    if (state.phase === 'failed') {
      const currentProgress = freezeProgressAnimation();
      element.style.transform = `scaleX(${currentProgress})`;
      clearCompletionFrame();
      completionFrame.current = window.requestAnimationFrame(() => {
        element.style.transform = `scaleX(${Math.max(currentProgress, NAVIGATION_PROGRESS_CAP)})`;
        completionFrame.current = null;
      });
      return;
    }

    if (state.phase === 'fading') {
      clearCompletionFrame();
      freezeProgressAnimation();
    }
  }, [clearCompletionFrame, freezeProgressAnimation, state.phase]);

  useEffect(() => {
    const prefetch = (href: string) => {
      if (prefetched.current.has(href)) return;
      prefetched.current.add(href);
      router.prefetch(href);
    };

    const prefetchFromEvent = (event: Event) => {
      const anchor = anchorFromTarget(event.target);
      if (!anchor) return;
      const href = internalDestination(anchor);
      if (href) prefetch(href);
    };

    const startNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = anchorFromTarget(event.target);
      if (!anchor) return;
      const href = internalDestination(anchor);
      if (!href) return;

      const current = `${window.location.pathname}${window.location.search}`;
      if (href === current || anchor.hash) return;

      prefetch(href);
      beginNavigation(href, destinationLabel(href), 'link');
    };

    const startProgrammaticNavigation = (event: Event) => {
      const detail = (event as CustomEvent<NavigationStartDetail>).detail;
      if (!detail?.href) return;
      const href = normaliseDestination(detail.href);
      if (!href) return;
      prefetch(href);
      beginNavigation(href, detail.label, 'programmatic');
    };

    const startHistoryNavigation = () => {
      const href = `${window.location.pathname}${window.location.search}`;
      beginNavigation(href, destinationLabel(href), 'history');
    };

    const cancelProgrammaticNavigation = () => cancelNavigation();
    const failProgrammaticNavigation = (event: Event) => {
      const detail = (event as CustomEvent<NavigationErrorDetail>).detail;
      activeNavigation.current = null;
      clearPhaseTimers();
      clearCompletionFrame();
      freezeProgressAnimation();
      dispatch({ type: 'fail', message: detail?.message });
    };

    document.addEventListener('pointerover', prefetchFromEvent, true);
    document.addEventListener('focusin', prefetchFromEvent, true);
    document.addEventListener('pointerdown', prefetchFromEvent, true);
    document.addEventListener('click', startNavigation, true);
    window.addEventListener(NAVIGATION_START_EVENT, startProgrammaticNavigation);
    window.addEventListener(NAVIGATION_CANCEL_EVENT, cancelProgrammaticNavigation);
    window.addEventListener(NAVIGATION_ERROR_EVENT, failProgrammaticNavigation);
    window.addEventListener('popstate', startHistoryNavigation);

    const idlePrefetch = () => {
      for (const href of IDLE_PREFETCH_ROUTES) {
        if (href !== pathname) prefetch(href);
      }
    };

    const windowWithIdle = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = windowWithIdle.requestIdleCallback
      ? windowWithIdle.requestIdleCallback(idlePrefetch, { timeout: 1800 })
      : window.setTimeout(idlePrefetch, 900);

    return () => {
      document.removeEventListener('pointerover', prefetchFromEvent, true);
      document.removeEventListener('focusin', prefetchFromEvent, true);
      document.removeEventListener('pointerdown', prefetchFromEvent, true);
      document.removeEventListener('click', startNavigation, true);
      window.removeEventListener(NAVIGATION_START_EVENT, startProgrammaticNavigation);
      window.removeEventListener(NAVIGATION_CANCEL_EVENT, cancelProgrammaticNavigation);
      window.removeEventListener(NAVIGATION_ERROR_EVENT, failProgrammaticNavigation);
      window.removeEventListener('popstate', startHistoryNavigation);
      if (windowWithIdle.cancelIdleCallback) windowWithIdle.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, [
    beginNavigation,
    cancelNavigation,
    clearCompletionFrame,
    clearPhaseTimers,
    freezeProgressAnimation,
    pathname,
    router,
  ]);

  useEffect(
    () => () => {
      clearPhaseTimers();
      clearCompletionFrame();
      progressAnimation.current?.cancel();
      progressAnimation.current = null;
    },
    [clearCompletionFrame, clearPhaseTimers],
  );

  if (state.phase === 'idle') return null;

  const showSlowStatus = state.phase === 'slow';
  const showFailureStatus = state.phase === 'failed';

  return (
    <div
      className="navigation-feedback pointer-events-none fixed inset-x-0 top-0 z-[100]"
      data-navigation-feedback=""
      data-navigation-href={state.href}
      data-navigation-kind={state.kind}
      data-navigation-progress={state.progress.toFixed(3)}
      data-navigation-state={state.phase}
    >
      <div className="navigation-rail" aria-hidden="true">
        <div
          ref={progressElement}
          className="navigation-progress"
          style={{ transform: `scaleX(${state.progress})` }}
        />
      </div>
      {(showSlowStatus || showFailureStatus) && (
        <div
          className="navigation-status"
          role="status"
          aria-live={showFailureStatus ? 'assertive' : 'polite'}
        >
          {showFailureStatus ? state.failureMessage : `Still opening ${state.label}…`}
        </div>
      )}
    </div>
  );
}
