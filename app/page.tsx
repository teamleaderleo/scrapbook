import Link from 'next/link';
import FeatureShowcase from '@/components/feature-showcase';
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <nav className="bg-gradient-to-r from-slate-900 to-indigo-600 text-white border-b border-indigo-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <Link href="/" className="text-lg font-bold">Stensibly</Link>
            <div className="flex items-center space-x-4">
              <Link href="/blog" className="text-sm hover:text-indigo-200">Blog</Link>
              <Link href="/about" className="text-sm hover:text-indigo-200">About</Link>
              <Link href="/support" className="text-sm hover:text-indigo-200">Support</Link>
            </div>
            <div>
              <Link href="/app">
                <Button variant="secondary" size="sm" className="bg-white text-indigo-700 hover:bg-indigo-100 text-xs py-1 px-2">
                  Open Stensibly
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex-grow flex items-center justify-center p-6">
        <FeatureShowcase />
      </div>
      <footer className="bg-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-600">
          © 2024 Stensibly. All rights reserved.
        </div>
      </footer>
    </main>
  );
}