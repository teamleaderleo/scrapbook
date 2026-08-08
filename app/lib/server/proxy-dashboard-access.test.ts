import { describe, expect, it } from 'vitest';

import {
  hasProxyDashboardAccess,
  proxyDashboardAccessCookie,
} from './proxy-dashboard-access';

describe('proxy dashboard access', () => {
  it('derives time-bound, secret-specific cookies', () => {
    const now = Date.UTC(2026, 7, 9);
    const first = proxyDashboardAccessCookie('first-secret', now);

    expect(first).toBe(proxyDashboardAccessCookie('first-secret', now));
    expect(first).not.toBe(proxyDashboardAccessCookie('second-secret', now));
    expect(first).not.toContain('first-secret');
  });

  it('accepts only an unexpired expected signed cookie', () => {
    const issuedAt = Date.UTC(2026, 7, 9);
    const cookie = proxyDashboardAccessCookie('first-secret', issuedAt);

    expect(hasProxyDashboardAccess(cookie, 'first-secret', issuedAt)).toBe(
      true
    );
    expect(hasProxyDashboardAccess(undefined, 'first-secret', issuedAt)).toBe(
      false
    );
    expect(hasProxyDashboardAccess(cookie, 'second-secret', issuedAt)).toBe(
      false
    );
    expect(
      hasProxyDashboardAccess(
        cookie,
        'first-secret',
        issuedAt + 8 * 24 * 60 * 60 * 1_000
      )
    ).toBe(false);
  });
});
