import React from 'react';
import SideNav from '@/components/dashboard/sidenav';
import { ProjectList } from '@/components/dashboard/project-list';
import Header from '@/components/dashboard/header';
import Footer from '@/components/dashboard/footer';

export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex bg-gray-900">
        <div className="w-20 flex-shrink-0">
          <SideNav />
        </div>
        <div className="w-64 flex-shrink-0">
          <ProjectList />
        </div>
      </div>
      <div className="flex flex-col flex-grow">
        <Header />
        <main className="flex-grow overflow-y-auto p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}