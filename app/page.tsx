import Link from 'next/link';
import SiteNav from '@/components/site-nav';
import ScrapbookBoard from '@/components/scrapbook/scrapbook-board';
import Scene3D from '@/components/three-carousel/scene-3d';
import { SCRAPBOOK_DATA } from '@/components/scrapbook/scrapbook-data';
import { GIT_INLINE_DATA } from '@/components/scrapbook/git-inline-data';
import { POTATO_DATA } from '@/components/scrapbook/potato-compressor-data';
import { FOLD_COMMENTS_DATA } from '@/components/scrapbook/fold-comments-data';

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <SiteNav />
      <Scene3D />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4 mb-6">
        <div className="flex justify-start items-start gap-16">
          <div className="max-w-sm flex-shrink-0">
            <h1 className="text-2xl font-normal text-black leading-snug mb-2">
              This is Leo&apos;s personal website!😊
            </h1>
            <p className="text-gray-600 text-sm">
              If you&apos;d like, you can open the <b>app</b> and test out the text editing and tag adding for yourself. 
              Those are the most technically impressive features.<br/>
              Below is a gallery of my resume bullet points&apos; content.<br/>
              I&apos;m still figuring out how to best present this stuff.<br/><br/>
              (WE&apos;RE JUST GONNA USE A LIBRARY LATER. MAYBE MASONRY. MAYBE SOMETHING CUTER.)<br/>
              The github source code may be more interesting&#58;
            </p>
            <a href="https://github.com/teamleaderleo">https://github.com/teamleaderleo</a>
          </div>

          <div className="flex flex-row gap-12 items-start flex-shrink-0">
            <div className="w-64 max-h-128 overflow-auto">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Some blog posts I intend on writing</h2>
              <ul className="space-y-2">
                <li className="text-sm">
                  <Link href="/blog/post-1" className="text-gray-600 hover:text-gray-900">
                    What&apos;s the deal with JavaScript bundlers?
                  </Link>
                  <span className="block text-gray-500 text-xs">Headaches with dynamic imports...</span>
                </li>
                <li className="text-sm">
                  <Link href="/blog/post-1" className="text-gray-600 hover:text-gray-900">
                    What I&apos;m learning from building a blog
                  </Link>
                  <span className="block text-gray-500 text-xs">There&apos;s a lot.</span>
                </li>
                <li className="text-sm">
                  <Link href="/blog/post-2" className="text-gray-600 hover:text-gray-900">
                    What I&apos;ve learned from building Scrapbook
                  </Link>
                  <span className="block text-gray-500 text-xs">Polishing is sometimes worth it.</span>
                </li>
                {/* <li className="text-sm">
                  <Link href="/blog/post-3" className="text-gray-600 hover:text-gray-900">
                    Observations on modern sites and their decision-making
                  </Link>
                  <span className="block text-gray-500 text-xs">Given infinite time, we could do better.</span>
                </li> */}
              </ul>
            </div>

            <div className="w-64 max-h-128 overflow-auto">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Currently Reading:</h2>
              <ul className="space-y-3">
                <li className="text-sm text-gray-600">
                  <span className="block font-medium text-gray-900">Designing Data-Intensive Applications</span>
                  <span className="text-gray-500">Page 217/601</span>
                </li>
                <li className="text-sm text-gray-600">
                  <span className="block font-medium text-gray-900">The Pragmatic Programmer</span>
                  <span className="text-gray-500">Page 66/489</span>
                </li>
                <li className="text-sm text-gray-600">
                  <span className="block font-medium text-gray-900">A Philosophy of Software Design</span>
                  <span className="text-gray-500">Page 65/157</span>
                </li>
                <li className="text-sm text-gray-600">
                  <span className="block font-medium text-gray-900">The Ultimate Hitchhiker&apos;s Guide to the Galaxy</span>
                  <span className="text-gray-500">Page 31/725</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
      
      {/* <div className="space-y-32">
        <div className="px-4 sm:px-6 lg:px-8">
          <ScrapbookBoard data={SCRAPBOOK_DATA} title='Scrapbook'/>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-8">
          <ScrapbookBoard data={GIT_INLINE_DATA} title='Git Inline'/>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-8">
          <ScrapbookBoard data={POTATO_DATA} title='Potato Image Compressor'/>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-8">
          <ScrapbookBoard data={FOLD_COMMENTS_DATA} title='Fold Single-Line Comments'/>
        </div>
      </div> */}
      
      {/* <footer className="py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-600">
          © 2025 teamleaderleo. All rights reserved.
        </div>
      </footer> */}
    </main>
  );
}