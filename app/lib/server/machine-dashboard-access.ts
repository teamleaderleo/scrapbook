import { createHmac } from 'node:crypto';

import { timingSafeTokenEqual } from './token-auth';

export const MACHINE_DASHBOARD_COOKIE = 'scrapbook_machine_access';
export const MACHINE_DASHBOARD_ACCESS_SECONDS = 60 * 60 * 24 * 7;

export function machineDashboardSecret() {
  return (
    process.env.MACHINE_HEALTH_DASHBOARD_TOKEN?.trim() ||
    process.env.PROXY_DASHBOARD_TOKEN?.trim() ||
    null
  );
}

function signature(
  secret: string,
  issuedAtSeconds: number,
  expiresAtSeconds: number
) {
  return createHmac('sha256', secret)
    .update(
      `scrapbook:machine-health:access:v1:${issuedAtSeconds}:${expiresAtSeconds}`
    )
    .digest('base64url');
}

export function machineDashboardAccessCookie(
  secret: string,
  nowMs = Date.now()
) {
  const issuedAtSeconds = Math.floor(nowMs / 1_000);
  const expiresAtSeconds = issuedAtSeconds + MACHINE_DASHBOARD_ACCESS_SECONDS;
  return `${issuedAtSeconds}.${expiresAtSeconds}.${signature(secret, issuedAtSeconds, expiresAtSeconds)}`;
}

export function hasMachineDashboardAccess(
  cookieValue: string | undefined,
  secret: string,
  nowMs = Date.now()
) {
  const [issuedRaw, expiresRaw, suppliedSignature, ...extra] =
    cookieValue?.split('.') ?? [];
  if (
    !issuedRaw ||
    !expiresRaw ||
    !suppliedSignature ||
    extra.length > 0 ||
    !/^\d+$/.test(issuedRaw) ||
    !/^\d+$/.test(expiresRaw)
  )
    return false;

  const issuedAt = Number(issuedRaw);
  const expiresAt = Number(expiresRaw);
  const now = Math.floor(nowMs / 1_000);
  if (
    !Number.isSafeInteger(issuedAt) ||
    !Number.isSafeInteger(expiresAt) ||
    issuedAt > now + 60 ||
    expiresAt <= now ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > MACHINE_DASHBOARD_ACCESS_SECONDS
  )
    return false;

  return timingSafeTokenEqual(
    suppliedSignature,
    signature(secret, issuedAt, expiresAt)
  );
}
