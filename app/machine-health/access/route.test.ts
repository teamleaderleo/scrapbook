import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET, POST } from './route';

describe('machine dashboard token exchange', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is unavailable when no dashboard secret exists', () => {
    vi.stubEnv('MACHINE_HEALTH_DASHBOARD_TOKEN', '');
    vi.stubEnv('PROXY_DASHBOARD_TOKEN', '');
    expect(GET().status).toBe(404);
  });

  it('renders a no-store POST form', async () => {
    vi.stubEnv('MACHINE_HEALTH_DASHBOARD_TOKEN', 'correct-secret');
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.text()).resolves.toContain('method="post"');
  });

  it('exchanges the token for a scoped secure cookie', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MACHINE_HEALTH_DASHBOARD_TOKEN', 'correct-secret');
    const response = await POST(
      new NextRequest('https://example.com/machine-health/access', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'token=correct-secret',
      })
    );
    expect(response.status).toBe(307);
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
});
