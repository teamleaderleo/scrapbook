import { Suspense } from 'react';
import { lusitana } from '@/components/ui/fonts';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';
import ChatArtifact from '@/components/ui/dashboard/chatartifact';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function Page() {
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="mt-6 grid grid-cols-1 gap-6">
        <ChatArtifact />
      </div>
    </main>
  );
}