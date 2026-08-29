import { describe, expect, it } from 'vitest';

import {
  hasMachineDashboardAccess,
  machineDashboardAccessCookie,
} from './machine-dashboard-access';

describe('machine dashboard access', () => {
  it('accepts only the expected unexpired signed cookie', () => {
    const issuedAt = Date.UTC(2026, 7, 29);
    const cookie = machineDashboardAccessCookie('first-secret', issuedAt);

    expect(cookie).not.toContain('first-secret');
    expect(hasMachineDashboardAccess(cookie, 'first-secret', issuedAt)).toBe(
      true
    );
    expect(hasMachineDashboardAccess(cookie, 'second-secret', issuedAt)).toBe(
      false
    );
    expect(
      hasMachineDashboardAccess(
        cookie,
        'first-secret',
        issuedAt + 8 * 24 * 60 * 60 * 1_000
      )
    ).toBe(false);
  });
});
