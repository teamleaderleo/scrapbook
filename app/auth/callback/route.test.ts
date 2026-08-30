import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const exchangeCodeForSession = vi.hoisted(() => vi.fn());
const getCookie = vi.hoisted(() => vi.fn());

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { exchangeCodeForSession } })),
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: getCookie })),
}));

import { GET } from './route';

describe('OAuth callback', () => {
  beforeEach(() => {
    vi.stubEnv('VERCEL_ENV', 'production');
    getCookie.mockReturnValue({ value: '/machine-health' });
    exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('opens Big Red on the canonical domain after exchanging the code', async () => {
    const response = await GET(
      new Request('https://www.teamleaderleo.com/auth/callback?code=valid')
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith('valid');
    expect(response.headers.get('location')).toBe(
      'https://teamleaderleo.com/machine-health'
    );
    expect(response.headers.get('set-cookie')).toContain(
      'machine_health_oauth_return='
    );
    expect(response.headers.get('set-cookie')).toContain(
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );
  });

  it('returns to access with a visible error when code exchange fails', async () => {
    exchangeCodeForSession.mockResolvedValueOnce({
      error: { code: 'bad_code' },
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const response = await GET(
      new Request('https://teamleaderleo.com/auth/callback?code=invalid')
    );

    expect(response.headers.get('location')).toBe(
      'https://teamleaderleo.com/machine-health/access?error=callback'
    );
  });
});
