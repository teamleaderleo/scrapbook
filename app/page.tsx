import Link from 'next/link';
import FeatureShowcase from '@/components/feature-showcase';
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-white text-gray-900">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">Stensibly</Link>
            <div className="flex items-center space-x-6">
              <Link href="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/support" className="text-gray-600 hover:text-gray-900">Support</Link>
            </div>
            <div>
              <Link href="/app">
                <Button variant="default" size="sm" className="bg-black text-white hover:bg-gray-800">
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
      <footer className="border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          © 2024 Stensibly. All rights reserved.
        </div>
      </footer>
    </main>
  );
}