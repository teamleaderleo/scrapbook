import { describe, expect, it } from 'vitest';

import {
  NAVIGATION_FAILURE_STATUS_MS,
  NAVIGATION_INITIAL_PROGRESS,
  NAVIGATION_MIN_VISIBLE_MS,
  NAVIGATION_PROGRESS_CAP,
  NAVIGATION_SLOW_STATUS_MS,
  createNavigationDurationHistory,
  estimateNavigationDuration,
  idleNavigationProgressState,
  navigationRouteFamily,
  parseNavigationDurationHistory,
  recordNavigationDuration,
  transitionNavigationProgress,
} from './navigation-progress';

function startNavigation(
  now = 1_000,
  overrides: Partial<{
    href: string;
    label: string;
    kind: 'link' | 'programmatic' | 'history';
    estimateMs: number;
    startProgress: number;
  }> = {},
) {
  return transitionNavigationProgress(idleNavigationProgressState, {
    type: 'start',
    href: overrides.href ?? '/time',
    label: overrides.label ?? 'time',
    kind: overrides.kind ?? 'link',
    estimateMs: overrides.estimateMs ?? 900,
    startProgress: overrides.startProgress,
    now,
  });
}

function restartNavigation(
  state: ReturnType<typeof startNavigation>,
  now = 2_000,
  startProgress?: number,
) {
  return transitionNavigationProgress(state, {
    type: 'start',
    href: '/gallery',
    label: 'gallery',
    kind: 'link',
    estimateMs: 900,
    startProgress,
    now,
  });
}

describe('adaptive navigation progress', () => {
  it('keeps a quick navigation perceptible without delaying route settlement', () => {
    const started = startNavigation();
    const settled = transitionNavigationProgress(started, { type: 'settle', now: 1_080 });

    expect(started.progress).toBe(NAVIGATION_INITIAL_PROGRESS);
    expect(settled.phase).toBe('settling');
    expect(settled.progress).toBe(started.progress);

    const completed = transitionNavigationProgress(settled, {
      type: 'complete',
      now: 1_000 + NAVIGATION_MIN_VISIBLE_MS,
    });
    expect(completed.phase).toBe('completing');
    expect(completed.progress).toBe(1);
  });

  it('preserves the rendered origin when a second navigation begins while settling', () => {
    const started = startNavigation();
    const settled = transitionNavigationProgress(started, { type: 'settle', now: 1_080 });
    const restarted = restartNavigation(settled, 2_000, 0.61);
    const advanced = transitionNavigationProgress(restarted, { type: 'tick', now: 2_100 });

    expect(settled.phase).toBe('settling');
    expect(restarted.phase).toBe('running');
    expect(restarted.progress).toBe(0.61);
    expect(advanced.progress).toBeGreaterThanOrEqual(restarted.progress);
  });

  it('preserves the rendered origin during the completion hold', () => {
    const started = startNavigation();
    const completed = transitionNavigationProgress(started, { type: 'settle', now: 1_300 });
    const restarted = restartNavigation(completed, 2_000, 0.84);
    const advanced = transitionNavigationProgress(restarted, { type: 'tick', now: 2_100 });

    expect(completed.phase).toBe('completing');
    expect(completed.progress).toBe(1);
    expect(restarted.phase).toBe('running');
    expect(restarted.progress).toBe(0.84);
    expect(advanced.progress).toBeGreaterThanOrEqual(restarted.progress);
  });

  it('preserves the rendered origin during the fade', () => {
    const started = startNavigation();
    const completed = transitionNavigationProgress(started, { type: 'settle', now: 1_300 });
    const fading = transitionNavigationProgress(completed, { type: 'fade' });
    const restarted = restartNavigation(fading, 2_000, 0.96);
    const advanced = transitionNavigationProgress(restarted, { type: 'tick', now: 2_100 });

    expect(fading.phase).toBe('fading');
    expect(fading.progress).toBe(1);
    expect(restarted.phase).toBe('running');
    expect(restarted.progress).toBe(0.96);
    expect(advanced.progress).toBeGreaterThanOrEqual(restarted.progress);
  });

  it('carries progress when a second navigation replaces an active navigation', () => {
    const started = startNavigation();
    const advanced = transitionNavigationProgress(started, { type: 'tick', now: 1_500 });
    const restarted = restartNavigation(advanced);

    expect(restarted.progress).toBe(advanced.progress);
  });

  it('does not tick backwards when a replacement begins above the normal running cap', () => {
    const restarted = startNavigation(2_000, { startProgress: 1 });
    const advanced = transitionNavigationProgress(restarted, { type: 'tick', now: 2_100 });

    expect(restarted.progress).toBe(1);
    expect(advanced.progress).toBe(1);
  });

  it('advances a medium navigation monotonically from its duration estimate', () => {
    const started = startNavigation();
    const firstTick = transitionNavigationProgress(started, { type: 'tick', now: 1_350 });
    const secondTick = transitionNavigationProgress(firstTick, { type: 'tick', now: 1_900 });

    expect(firstTick.progress).toBeGreaterThan(started.progress);
    expect(secondTick.progress).toBeGreaterThanOrEqual(firstTick.progress);
    expect(secondTick.progress).toBeLessThanOrEqual(NAVIGATION_PROGRESS_CAP);

    const completed = transitionNavigationProgress(secondTick, { type: 'settle', now: 1_900 });
    expect(completed.phase).toBe('completing');
    expect(completed.progress).toBe(1);
  });

  it('eases a slow navigation toward the cap and exposes a delayed status', () => {
    const started = startNavigation();
    const slow = transitionNavigationProgress(started, {
      type: 'tick',
      now: 1_000 + NAVIGATION_SLOW_STATUS_MS,
    });
    const slower = transitionNavigationProgress(slow, {
      type: 'tick',
      now: 1_000 + NAVIGATION_SLOW_STATUS_MS + 3_000,
    });

    expect(slow.phase).toBe('slow');
    expect(slower.progress).toBeGreaterThanOrEqual(slow.progress);
    expect(slower.progress).toBeLessThanOrEqual(NAVIGATION_PROGRESS_CAP);
  });

  it('fades a cancelled navigation without completing or moving backwards', () => {
    const started = startNavigation();
    const advanced = transitionNavigationProgress(started, { type: 'tick', now: 1_500 });
    const cancelled = transitionNavigationProgress(advanced, { type: 'cancel' });

    expect(cancelled.phase).toBe('fading');
    expect(cancelled.progress).toBe(advanced.progress);
    expect(transitionNavigationProgress(cancelled, { type: 'reset' })).toEqual(
      idleNavigationProgressState,
    );
  });

  it('keeps a failed navigation visible with an actionable message', () => {
    const started = startNavigation();
    const failed = transitionNavigationProgress(started, {
      type: 'tick',
      now: 1_000 + NAVIGATION_FAILURE_STATUS_MS,
    });

    expect(failed.phase).toBe('failed');
    expect(failed.progress).toBeGreaterThanOrEqual(started.progress);
    expect(failed.failureMessage).toMatch(/Try the link again or reload this page/);

    const eventuallySettled = transitionNavigationProgress(failed, {
      type: 'settle',
      now: 1_000 + NAVIGATION_FAILURE_STATUS_MS + 10,
    });
    expect(eventuallySettled.phase).toBe('completing');
    expect(eventuallySettled.progress).toBe(1);
  });

  it('treats history navigation as the same monotonic lifecycle', () => {
    const started = startNavigation(2_000, {
      href: '/gallery?view=wall',
      label: 'previous page',
      kind: 'history',
    });
    const advanced = transitionNavigationProgress(started, { type: 'tick', now: 2_450 });
    const settled = transitionNavigationProgress(advanced, { type: 'settle', now: 2_700 });

    expect(started.kind).toBe('history');
    expect(advanced.progress).toBeGreaterThanOrEqual(started.progress);
    expect(settled.phase).toBe('completing');
  });
});

describe('navigation duration history', () => {
  it('uses route-family estimates and bounds outliers and storage size', () => {
    let history = createNavigationDurationHistory();
    history = recordNavigationDuration(history, '/time?zone=UTC', 420, 1);
    expect(navigationRouteFamily('/time?zone=UTC')).toBe('/time');
    expect(estimateNavigationDuration(history, '/time?zone=Tokyo')).toBe(420);

    history = recordNavigationDuration(history, '/time', 60_000, 2);
    expect(estimateNavigationDuration(history, '/time')).toBeLessThanOrEqual(8_000);

    for (let index = 0; index < 12; index += 1) {
      history = recordNavigationDuration(history, `/route-${index}`, 500 + index, 10 + index);
    }
    expect(Object.keys(history.routes)).toHaveLength(8);
  });

  it('fails closed to conservative defaults for malformed persisted data', () => {
    const fallback = parseNavigationDurationHistory('{"version":1,"routes":"broken"}');
    expect(fallback).toEqual(createNavigationDurationHistory());
  });
});
