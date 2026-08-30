import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from './route';

describe('machine dashboard recovery token exchange', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('exchanges the recovery token for a scoped secure cookie', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MACHINE_HEALTH_DASHBOARD_TOKEN', 'correct-secret');
    const response = await POST(
      new NextRequest('https://example.com/machine-health/access/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'token=correct-secret',
      })
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://example.com/machine-health'
    );
    const cookie = response.headers.get('set-cookie');
    expect(cookie).toContain('scrapbook_machine_access=');
    expect(cookie).toContain('Path=/machine-health');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).not.toContain('correct-secret');
  });

  it('fails closed for a missing or incorrect recovery token', async () => {
    vi.stubEnv('MACHINE_HEALTH_DASHBOARD_TOKEN', 'correct-secret');

    const response = await POST(
      new NextRequest('https://example.com/machine-health/access/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'token=wrong-secret',
      })
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
