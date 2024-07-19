import Link from 'next/link';
import NavLinks from '@/components/dashboard/nav-links';
import AcmeLogo from '@/components/ui/acme-logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Plus } from 'lucide-react';
import { signOut } from '@/auth';

const SideNav = () => {
  return (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      <div className="p-4">
        <Link href="/" className="mb-4 flex items-center">
          <AcmeLogo />
        </Link>
      </div>
      <ScrollArea className="flex-grow px-3">
        <NavLinks />
      </ScrollArea>
      <div className="mt-auto p-4">
        <form
          action={async () => {
            'use server';
            await signOut();
          }}
        >
          <Button variant="ghost" className="w-full justify-start text-white">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SideNav;