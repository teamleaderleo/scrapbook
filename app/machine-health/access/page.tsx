import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Open Big Red health · Leo',
  description: 'Big Red resource health and Codex activity over time.',
  robots: { index: false, follow: false },
};

export const instant = false;

export default function Page() {
  redirect('/machine-health');
}
