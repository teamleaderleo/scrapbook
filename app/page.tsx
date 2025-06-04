import Link from 'next/link';
import SiteNav from '@/components/site-nav';

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <SiteNav />
      {/* <Scene3D /> */}
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
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Latest updates:</h2>
              <p className="text-sm text-gray-600 mb-2">
                Spin the cube! Click and drag or scroll on it!
              </p>
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
    
    </main>
  );
}