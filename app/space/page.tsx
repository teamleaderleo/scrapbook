import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";

export default async function Page() {
  return (
    <main className="p-4">
      <SidebarTrigger />
      <div>yo</div>
    </main>
  );
}