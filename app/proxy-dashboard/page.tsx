import { UsagePage } from '@/components/proxy/usage-page';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import {
  hasProxyDashboardAccess,
  PROXY_DASHBOARD_COOKIE,
  proxyDashboardSecret,
} from '@/app/lib/server/proxy-dashboard-access';

export const metadata: Metadata = {
  title: 'Proxy dashboard',
  description: 'Private proxy health and usage dashboard.',
  alternates: { canonical: '/proxy-dashboard' },
  robots: { index: false, follow: false },
};

export default async function Page() {
  const secret = proxyDashboardSecret();

  if (secret) {
    const accessCookie = (await cookies()).get(PROXY_DASHBOARD_COOKIE)?.value;
    if (!hasProxyDashboardAccess(accessCookie, secret)) notFound();
  } else if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <UsagePage />;
}
