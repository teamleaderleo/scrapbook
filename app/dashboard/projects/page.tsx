import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects',
};

// The parent layout redirects legacy dashboard URLs to /space.
export default function LegacyProjectsPage() {
  return null;
}
