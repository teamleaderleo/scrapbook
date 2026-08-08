import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET, POST } from './route';

describe('proxy dashboard token exchange', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns not found when access is unconfigured', () => {
    vi.stubEnv('PROXY_DASHBOARD_TOKEN', '');
    expect(GET().status).toBe(404);
  });

  it('renders a no-store POST form without accepting a query token', async () => {
    vi.stubEnv('PROXY_DASHBOARD_TOKEN', 'correct-secret');
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    await expect(response.text()).resolves.toContain('method="post"');
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('rejects an invalid token supplied in the request body', async () => {
    vi.stubEnv('PROXY_DASHBOARD_TOKEN', 'correct-secret');
    const response = await POST(
      new NextRequest('https://example.com/proxy-dashboard/access', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'token=nope',
      })
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('exchanges a POSTed token for a secure expiring cookie and clean URL', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PROXY_DASHBOARD_TOKEN', 'correct-secret');

    const response = await POST(
      new NextRequest('https://example.com/proxy-dashboard/access', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'token=correct-secret',
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://example.com/proxy-dashboard'
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    const cookie = response.headers.get('set-cookie');
    expect(cookie).toContain('scrapbook_proxy_access=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toMatch(/SameSite=strict/i);
    expect(cookie).not.toContain('correct-secret');
  });
});
