import React from 'react';
import SideNav from '@/components/dashboard/sidenav';
import Header from '@/components/dashboard/header';
import Footer from '@/components/dashboard/footer';

export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 flex-shrink-0">
        <SideNav />
      </div>
      <div className="flex flex-col flex-grow">
        <Header title="Dashboard" />
        <main className="flex-grow overflow-y-auto p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}