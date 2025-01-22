import Link from 'next/link';
import SiteNav from '@/components/site-nav';
import ScrapbookBoard from '@/components/scrapbook/scrapbook-board';

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <SiteNav />
      
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4 mb-6">
        <div className="flex justify-start items-start gap-16">
          <div className="max-w-sm flex-shrink-0">
            <h1 className="text-2xl font-normal text-black leading-snug mb-2">
              This is Leo&apos;s personal website!😊
            </h1>
            <p className="text-gray-600 text-sm">
              If you&apos;d like, you can open the app and test out the text editing and tag adding for yourself. 
              Those are the most technically impressive features.<br/>
              Below is a gallery of my resume bullet points' content.
            </p>
          </div>

          <div className="flex flex-row gap-12 items-start flex-shrink-0">
            <div className="w-64">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Blog Posts</h2>
              <ul className="space-y-2">
                <li className="text-sm">
                  <Link href="/blog/post-1" className="text-gray-600 hover:text-gray-900">
                    Lorem ipsum dolor sit amet consectetur
                  </Link>
                  <span className="block text-gray-500 text-xs">Jan 15, 2025</span>
                </li>
                <li className="text-sm">
                  <Link href="/blog/post-2" className="text-gray-600 hover:text-gray-900">
                    Adipiscing elit sed do eiusmod tempor
                  </Link>
                  <span className="block text-gray-500 text-xs">Jan 10, 2025</span>
                </li>
              </ul>
            </div>

            <div className="w-64">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Currently Reading / Working On</h2>
              <ul className="space-y-3">
                <li className="text-sm text-gray-600">
                  <span className="block font-medium text-gray-900">Lorem Ipsum</span>
                  <span className="text-gray-500">Consectetur adipiscing elit</span>
                </li>
                <li className="text-sm text-gray-600">
                  <span className="block font-medium text-gray-900">Dolor Sit</span>
                  <span className="text-gray-500">Sed do eiusmod tempor</span>
                </li>
              </ul>
            </div>
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