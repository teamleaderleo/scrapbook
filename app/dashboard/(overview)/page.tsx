import { Suspense } from 'react';
import { lusitana } from '@/components/ui/fonts';
import { Metadata } from 'next';
import Dashboard from '@/components/dashboard/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function Page() {
  return (
    <>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <Dashboard />
      </Suspense>
    </>
  );
}