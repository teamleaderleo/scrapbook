import { UsagePage } from '@/components/proxy/usage-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Signal · Leo',
  description: 'Proxy bandwidth and latency dashboard.',
  alternates: { canonical: '/proxy-dashboard' },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <UsagePage />;
}
