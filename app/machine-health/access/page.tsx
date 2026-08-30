import { machineDashboardSecret } from '@/app/lib/server/machine-dashboard-access';
import {
  machineDashboardOwner,
  machineDashboardOwnerAuthConfigured,
} from '@/app/lib/server/machine-dashboard-owner';
import { machineDashboardOAuthStartBaseUrl } from '@/app/lib/machine-dashboard-oauth';
import { MachineHealthAccess } from '@/components/machine-health/machine-health-access';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'Open Big Red health · Leo',
  description: 'Owner sign-in for the private Big Red health dashboard.',
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  await connection();
  const error = (await searchParams).error;
  const owner = await machineDashboardOwner();
  if (owner) redirect('/machine-health');

  const recoveryToken = machineDashboardSecret();
  const hasOwnerSignIn = machineDashboardOwnerAuthConfigured();
  if (!hasOwnerSignIn && !recoveryToken) notFound();

  return (
    <MachineHealthAccess
      hasOwnerSignIn={hasOwnerSignIn}
      hasRecoveryToken={Boolean(recoveryToken)}
      oauthStartBaseUrl={machineDashboardOAuthStartBaseUrl()}
      oauthError={typeof error === 'string'}
    />
  );
}
