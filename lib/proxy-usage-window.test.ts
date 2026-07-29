import { describe, expect, it } from 'vitest';
import { getUsageWeekWindow } from './proxy-usage-window';

describe('proxy usage week window', () => {
  it('uses the rolling seven-day window when the cycle began earlier', () => {
    const window = getUsageWeekWindow('2026-08-01T00:00:00Z', '2026-07-29T12:00:00Z');

    expect(window.label).toBe('7 days');
    expect(window.resetOverrides).toBe(false);
    expect(window.start.toISOString()).toBe('2026-07-23T00:00:00.000Z');
    expect(window.dayCount).toBe(7);
  });

  it('starts at a recent reset instead of counting pre-reset days', () => {
    const window = getUsageWeekWindow('2026-08-27T00:00:00Z', '2026-07-29T12:00:00Z');

    expect(window.label).toBe('Since reset');
    expect(window.resetOverrides).toBe(true);
    expect(window.start.toISOString()).toBe('2026-07-27T00:00:00.000Z');
    expect(window.dayCount).toBe(3);
  });

  it('preserves month-end reset dates', () => {
    const window = getUsageWeekWindow('2026-08-31T08:30:00Z', '2026-08-02T12:00:00Z');

    expect(window.label).toBe('Since reset');
    expect(window.start.toISOString()).toBe('2026-07-31T00:00:00.000Z');
    expect(window.dayCount).toBe(3);
  });

  it('falls back cleanly when reset metadata is missing', () => {
    const window = getUsageWeekWindow(null, '2026-07-29T12:00:00Z');

    expect(window.label).toBe('7 days');
    expect(window.start.toISOString()).toBe('2026-07-23T00:00:00.000Z');
  });
});
