import { Suspense } from 'react';
import { Metadata } from 'next';
// import Dashboard from '@/components/dashboard/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function Page() {
  return (
    <>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        {/* <Dashboard /> */}
      </Suspense>
    </>
  );
}