import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readMachineActivity } from '@/app/lib/machine-activity-store';
import { hasMachineDashboardOwnerSession } from '@/app/lib/server/machine-dashboard-owner';
import {
  MACHINE_DASHBOARD_COOKIE,
  hasMachineDashboardAccess,
  machineDashboardSecret,
} from '@/app/lib/server/machine-dashboard-access';

export async function GET() {
  const secret = machineDashboardSecret();
  const cookieStore = await cookies();
  const privateAccess =
    process.env.NODE_ENV !== 'production' ||
    Boolean(
      secret &&
        hasMachineDashboardAccess(
          cookieStore.get(MACHINE_DASHBOARD_COOKIE)?.value,
          secret
        )
    ) ||
    (await hasMachineDashboardOwnerSession());
  const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
  try {
    return NextResponse.json(await readMachineActivity(privateAccess), {
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: 'Activity monitor is waiting for reports' },
      { status: 503, headers }
    );
  }
}
