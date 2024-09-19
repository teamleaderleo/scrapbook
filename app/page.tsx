import Link from 'next/link';
import FeatureShowcase from '@/components/feature-showcase';
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <nav className="bg-gradient-to-r from-indigo-900 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-xl font-bold">Stensibly</Link>
              <Link href="/blog" className="hover:underline">Blog</Link>
              <Link href="/about" className="hover:underline">About</Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm opacity-75">user@nextmail.com / 123456</span>
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex-grow flex items-center justify-center p-6">
        <FeatureShowcase />
      </div>
    </main>
  );
}