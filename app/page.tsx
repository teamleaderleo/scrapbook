import Link from 'next/link';
import { Button } from "@/components/ui/button";
import HardcodedStickyNote from '@/components/hardcoded-sticky-note';
import { HeaderConnectionStatus } from '@/components/connection-status';
import { Book } from 'lucide-react';
import ScrapbookBoard from '@/components/scrapbook-board';

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <nav className="bg-white text-black border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <Link href="/" className="text-lg font-bold">Stensibly</Link>
            <div className="flex items-center space-x-4">
              <Link href="/blog" className="text-sm hover:text-gray-600">Blog (Not set up yet!)</Link>
            </div>
            <div className="flex items-center h-full">
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
      
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="max-w-xl">
            <h1 className="text-2xl font-normal text-black leading-snug mb-2">
              This is Leo&apos;s personal website! I&apos;m currently working on interesting ways to preview my resume&apos;s bullet points! 😊
            </h1>
            <p className="text-gray-600 text-sm">
              January 20, 2025: A lot of stuff is still unpolished! For instance, I&apos;m still deciding on which pictures would be best to add under here. 
              If you&apos;d like, you can open the app and test out the text editing and tag adding for yourself. There are still a lot of things I need to sort out there, though.
            </p>
          </div>
          
        </div>
      </div>
      
      <div className="px-4 sm:px-6 lg:px-8">
        <ScrapbookBoard />
      </div>
      
      <footer className="py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-600">
          © 2025 Stensibly. All rights reserved.
        </div>
      </footer>
    </main>
  );
}