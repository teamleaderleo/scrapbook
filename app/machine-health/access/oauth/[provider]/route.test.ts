import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const signInWithOAuth = vi.hoisted(() => vi.fn());
const setCookie = vi.hoisted(() => vi.fn());

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { signInWithOAuth } })),
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: setCookie })),
}));

import { GET } from './route';

describe('machine dashboard OAuth start', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project-ref.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'publishable-key');
    signInWithOAuth.mockResolvedValue({
      data: {
        url: 'https://project-ref.supabase.co/auth/v1/authorize?provider=google',
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('starts on the canonical origin and records the private return route', async () => {
    const response = await GET(
      new NextRequest(
        'https://www.teamleaderleo.com/machine-health/access/oauth/google'
      ),
      { params: Promise.resolve({ provider: 'google' }) }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://project-ref.supabase.co/auth/v1/authorize?provider=google'
    );
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://teamleaderleo.com/auth/callback' },
    });
    expect(setCookie).toHaveBeenCalledWith(
      'machine_health_oauth_return',
      '/machine-health',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 600,
      })
    );
  });

  it('rejects unknown providers without contacting Supabase', async () => {
    const response = await GET(
      new NextRequest(
        'https://teamleaderleo.com/machine-health/access/oauth/not-real'
      ),
      { params: Promise.resolve({ provider: 'not-real' }) }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://teamleaderleo.com/machine-health?auth=provider'
    );
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it('rejects an unexpected authorization origin', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    signInWithOAuth.mockResolvedValueOnce({
      data: { url: 'https://example.com/not-supabase' },
      error: null,
    });

    const response = await GET(
      new NextRequest(
        'https://teamleaderleo.com/machine-health/access/oauth/github'
      ),
      { params: Promise.resolve({ provider: 'github' }) }
    );

    expect(response.headers.get('location')).toBe(
      'https://teamleaderleo.com/machine-health?auth=start'
    );
    expect(setCookie).not.toHaveBeenCalled();
  });
});
