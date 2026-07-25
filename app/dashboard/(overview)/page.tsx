import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

// The parent layout redirects legacy dashboard URLs to /space.
export default function LegacyDashboardPage() {
  return null;
}
