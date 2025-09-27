"use client";

import Link from "next/link";

export default function MinimalSiteNav() {
  return (
    <nav className="sticky top-0 z-50 bg-white text-black border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center">
          <div className="flex-1">
            <Link href="/" className="text-lg font-bold">teamleaderleo</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
