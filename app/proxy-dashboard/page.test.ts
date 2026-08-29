import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  hasAccess: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('not found');
  }),
  secret: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/app/lib/server/proxy-dashboard-access', () => ({
  hasProxyDashboardAccess: mocks.hasAccess,
  PROXY_DASHBOARD_COOKIE: 'scrapbook_proxy_access',
  proxyDashboardSecret: mocks.secret,
}));
vi.mock('@/components/proxy/usage-page', () => ({ UsagePage: () => null }));

import Page from './page';

describe('proxy dashboard page access', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns not found in production without a configured secret', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mocks.secret.mockReturnValue(null);
    mocks.cookies.mockResolvedValue({ get: vi.fn() });

    await expect(Page()).rejects.toThrow('not found');
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it('returns not found in production without a valid access cookie', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mocks.secret.mockReturnValue('secret');
    mocks.cookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'invalid-cookie' }),
    });
    mocks.hasAccess.mockReturnValue(false);

    await expect(Page()).rejects.toThrow('not found');
    expect(mocks.hasAccess).toHaveBeenCalledWith('invalid-cookie', 'secret');
  });

  it('keeps local development available without a token', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    mocks.secret.mockReturnValue(null);

    await expect(Page()).resolves.toBeTruthy();
    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
