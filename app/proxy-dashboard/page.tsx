import {
  hasProxyDashboardAccess,
  PROXY_DASHBOARD_COOKIE,
  proxyDashboardSecret,
} from '@/app/lib/server/proxy-dashboard-access';
import { UsagePage } from '@/components/proxy/usage-page';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Signal · Leo',
  description: 'Proxy bandwidth and latency dashboard.',
  alternates: { canonical: '/proxy-dashboard' },
  robots: { index: false, follow: false },
};

export default async function Page() {
  if (process.env.NODE_ENV === 'production') {
    const secret = proxyDashboardSecret();
    if (!secret) {
      notFound();
    }

    const cookieStore = await cookies();
    const accessCookie = cookieStore.get(PROXY_DASHBOARD_COOKIE)?.value;
    if (!hasProxyDashboardAccess(accessCookie, secret)) {
      notFound();
    }
  }

  return <UsagePage />;
}
