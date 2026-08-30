export const MACHINE_DASHBOARD_PATH = '/machine-health';
export const MACHINE_DASHBOARD_OAUTH_RETURN_COOKIE =
  'machine_health_oauth_return';

const CANONICAL_SITE_ORIGIN = 'https://teamleaderleo.com';
const ALLOWED_AUTH_DESTINATIONS = new Set(['/space', MACHINE_DASHBOARD_PATH]);

export function machineDashboardOAuthOrigin(requestOrigin?: string) {
  if (process.env.VERCEL_ENV === 'production') return CANONICAL_SITE_ORIGIN;
  return requestOrigin ? new URL(requestOrigin).origin : '';
}

export function machineDashboardOAuthStartBaseUrl() {
  return machineDashboardOAuthOrigin();
}

export function safeAuthDestination(value: string | null | undefined) {
  return value && ALLOWED_AUTH_DESTINATIONS.has(value) ? value : '/space';
}

export function recoverMachineDashboardOAuthCallback(
  requestUrl: URL,
  returnCookie: string | undefined
) {
  const code = requestUrl.searchParams.get('code');
  if (
    requestUrl.pathname !== '/' ||
    !code ||
    returnCookie !== MACHINE_DASHBOARD_PATH
  ) {
    return null;
  }

  const callbackUrl = new URL('/auth/callback', requestUrl);
  callbackUrl.searchParams.set('code', code);
  callbackUrl.searchParams.set('next', MACHINE_DASHBOARD_PATH);
  return callbackUrl;
}
