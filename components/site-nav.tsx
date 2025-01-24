import Link from 'next/link';
import { Button } from "@/components/ui/button";
import HardcodedStickyNote from '@/components/hardcoded-sticky-note';
import { HeaderConnectionStatus } from '@/components/connection-status';
import { Book } from 'lucide-react';

export default function SiteNav() {
  return (
    <nav className="bg-white text-black border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center">
          <div className="w-1/3">
            <Link href="/" className="text-lg font-bold">teamleaderleo</Link>
          </div>
          <div className="w-1/3 flex justify-center">
            <Link href="/blog" className="text-sm hover:text-gray-600 flex items-center gap-1">
              <Book size={14} />
              <span>Blog</span>
            </Link>
          </div>
          <div className="w-1/3 flex justify-end items-center">
            <HeaderConnectionStatus />
            <HardcodedStickyNote />
            <Link href="/dashboard">
              <Button variant="secondary" size="sm" className="bg-black text-white hover:bg-gray-800 text-xs py-1 px-2">
                Open Stensibly
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}