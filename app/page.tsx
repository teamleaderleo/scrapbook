import Link from 'next/link';
import FeatureShowcase from '@/components/feature-showcase';
import { Button } from "@/components/ui/button";
import HardcodedStickyNote from '@/components/hardcoded-sticky-note';
import { HeaderConnectionStatus } from '@/components/connection-status';
import ScrapbookEntry from '@/components/scrapbook-entry';

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <nav className="bg-white text-black border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <Link href="/" className="text-lg font-bold">Stensibly</Link>
            <div className="flex items-center space-x-4">
              <Link href="/blog" className="text-sm hover:text-gray-600">Blog</Link>
              <Link href="/about" className="text-sm hover:text-gray-600">About</Link>
              <Link href="/support" className="text-sm hover:text-gray-600">Support</Link>
            </div>
            <div className="flex items-center h-full">
              <HeaderConnectionStatus />
              <HardcodedStickyNote />
              <Link href="/app">
                <Button variant="secondary" size="sm" className="bg-black text-white hover:bg-gray-800 text-xs py-1 px-2">
                  Open Stensibly
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="w-full px-8 mt-8">
        <div className="max-w-lg">
          <h1 className="text-3xl font-normal text-black leading-snug">
            For quicker reference, I&apos;ve gathered the details of some of my resume&apos;s bullet points in one place! 😊
          </h1>
        </div>
      </div>
      <div className="flex-grow flex flex-col items-start max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ScrapbookEntry />
      </div>
      <footer className="bg-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-600">
          © 2025 Stensibly. All rights reserved.
        </div>
      </footer>
    </main>
  );
}