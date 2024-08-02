import React from 'react';
import NavLinks from '@/components/dashboard/nav-links';
import { ScrollArea } from '@/components/ui/components/scroll-area';

const SideNav = () => {
  return (
    <div className="flex h-full flex-col bg-[#1E1F22] text-[#B5BAC1] w-[72px]">
      <ScrollArea className="flex-grow px-3 pt-3">
        <NavLinks />
      </ScrollArea>
    </div>
  );
};

export default SideNav;