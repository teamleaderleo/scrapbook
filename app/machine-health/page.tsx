import {
  MACHINE_DASHBOARD_COOKIE,
  hasMachineDashboardAccess,
  machineDashboardSecret,
} from '@/app/lib/server/machine-dashboard-access';
import {
  hasMachineDashboardOwnerSession,
  machineDashboardOwnerAuthConfigured,
} from '@/app/lib/server/machine-dashboard-owner';
import { MachineHealthPage } from '@/components/machine-health/machine-health-page';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'Big Red health · Leo',
  description: 'Big Red resource health and Codex activity over time.',
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  await connection();
  const { auth } = await searchParams;
  const secret = machineDashboardSecret();
  let hasPrivateAccess = process.env.NODE_ENV !== 'production';
  if (process.env.NODE_ENV === 'production') {
    const cookieStore = await cookies();
    const hasRecoveryAccess = Boolean(
      secret &&
        hasMachineDashboardAccess(
          cookieStore.get(MACHINE_DASHBOARD_COOKIE)?.value,
          secret
        )
    );
    hasPrivateAccess =
      hasRecoveryAccess || (await hasMachineDashboardOwnerSession());
  }

  return (
    <MachineHealthPage
      hasPrivateAccess={hasPrivateAccess}
      ownerAuthConfigured={machineDashboardOwnerAuthConfigured()}
      authError={Boolean(auth)}
    />
  );
}
