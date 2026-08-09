import { createHmac } from 'node:crypto';

import { timingSafeTokenEqual } from './token-auth';

export const PROXY_DASHBOARD_COOKIE = 'scrapbook_proxy_access';
export const PROXY_DASHBOARD_ACCESS_SECONDS = 60 * 60 * 24 * 7;

export function proxyDashboardSecret() {
  return process.env.PROXY_DASHBOARD_TOKEN?.trim() || null;
}

function proxyDashboardAccessSignature(
  secret: string,
  issuedAtSeconds: number,
  expiresAtSeconds: number
) {
  return createHmac('sha256', secret)
    .update(
      `scrapbook:proxy-dashboard:access:v2:${issuedAtSeconds}:${expiresAtSeconds}`
    )
    .digest('base64url');
}

export function proxyDashboardAccessCookie(secret: string, nowMs = Date.now()) {
  const issuedAtSeconds = Math.floor(nowMs / 1_000);
  const expiresAtSeconds = issuedAtSeconds + PROXY_DASHBOARD_ACCESS_SECONDS;
  const signature = proxyDashboardAccessSignature(
    secret,
    issuedAtSeconds,
    expiresAtSeconds
  );

  return `${issuedAtSeconds}.${expiresAtSeconds}.${signature}`;
}

export function hasProxyDashboardAccess(
  cookieValue: string | undefined,
  secret: string,
  nowMs = Date.now()
) {
  const [issuedAtRaw, expiresAtRaw, suppliedSignature, ...extra] =
    cookieValue?.split('.') ?? [];
  if (
    !issuedAtRaw ||
    !expiresAtRaw ||
    !suppliedSignature ||
    extra.length > 0 ||
    !/^\d+$/.test(issuedAtRaw) ||
    !/^\d+$/.test(expiresAtRaw)
  ) {
    return false;
  }

  const issuedAtSeconds = Number(issuedAtRaw);
  const expiresAtSeconds = Number(expiresAtRaw);
  const nowSeconds = Math.floor(nowMs / 1_000);
  if (
    !Number.isSafeInteger(issuedAtSeconds) ||
    !Number.isSafeInteger(expiresAtSeconds) ||
    issuedAtSeconds > nowSeconds + 60 ||
    expiresAtSeconds <= nowSeconds ||
    expiresAtSeconds <= issuedAtSeconds ||
    expiresAtSeconds - issuedAtSeconds > PROXY_DASHBOARD_ACCESS_SECONDS
  ) {
    return false;
  }

  return timingSafeTokenEqual(
    suppliedSignature,
    proxyDashboardAccessSignature(secret, issuedAtSeconds, expiresAtSeconds)
  );
}
