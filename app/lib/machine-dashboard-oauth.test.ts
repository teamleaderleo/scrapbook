import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MACHINE_DASHBOARD_PATH,
  machineDashboardOAuthOrigin,
  recoverMachineDashboardOAuthCallback,
  safeAuthDestination,
} from './machine-dashboard-oauth';

describe('machine dashboard OAuth routing', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses the canonical production origin instead of the opening browser host', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(machineDashboardOAuthOrigin('https://www.teamleaderleo.com')).toBe(
      'https://teamleaderleo.com'
    );
  });

  it('recovers a site-root OAuth fallback only for an active Big Red flow', () => {
    const recovered = recoverMachineDashboardOAuthCallback(
      new URL('https://teamleaderleo.com/?code=oauth-code'),
      MACHINE_DASHBOARD_PATH
    );

    expect(recovered?.toString()).toBe(
      'https://teamleaderleo.com/auth/callback?code=oauth-code&next=%2Fmachine-health'
    );
    expect(
      recoverMachineDashboardOAuthCallback(
        new URL('https://teamleaderleo.com/?code=oauth-code'),
        undefined
      )
    ).toBeNull();
  });

  it('allows only the site auth destinations that actually exist', () => {
    expect(safeAuthDestination('/machine-health')).toBe('/machine-health');
    expect(safeAuthDestination('/space')).toBe('/space');
    expect(safeAuthDestination('https://example.com')).toBe('/space');
    expect(safeAuthDestination('//example.com')).toBe('/space');
  });
});
