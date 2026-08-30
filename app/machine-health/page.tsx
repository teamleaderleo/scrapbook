import {
  MACHINE_DASHBOARD_COOKIE,
  hasMachineDashboardAccess,
  machineDashboardSecret,
} from '@/app/lib/server/machine-dashboard-access';
import { MachineHealthPage } from '@/components/machine-health/machine-health-page';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'Big Red health · Leo',
  description: 'Private, lightweight hourly workstation health observations.',
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function Page() {
  await connection();
  const secret = machineDashboardSecret();
  if (process.env.NODE_ENV === 'production') {
    if (!secret) notFound();
    const cookieStore = await cookies();
    if (
      !hasMachineDashboardAccess(
        cookieStore.get(MACHINE_DASHBOARD_COOKIE)?.value,
        secret
      )
    )
      redirect('/machine-health/access');
  }

  return <MachineHealthPage />;
}
