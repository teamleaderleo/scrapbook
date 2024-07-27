import AcmeLogo from '@/components/ui/assets/acme-logo';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
// import styles from '@/app/ui/home.module.css';
import { lusitana } from '@/components/ui/assets/fonts';
import Image from 'next/image';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-indigo-600 p-4 md:h-52">
        <AcmeLogo />
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
          {/* <div className={styles.shape} /> */}
          <p
            className={`${lusitana.className} text-xl text-gray-800 md:text-3xl md:leading-normal`}
          >
            <strong>This is setzen,</strong> an MVP for a 
            scrapbook-style project management app built by Leo. 
            Login with user@nextmail.com and 123456.
            {/* {' '}
            <a href="https://nextjs.org/" className="text-indigo-500">
              Next.js
            </a>
            , and deployed using {' '}
            <a href="https://vercel.com/" className="text-indigo-500">
              Vercel
            </a>. */}
          </p>
          <Link
            href="/login"
            className="flex items-center gap-5 self-start rounded-lg bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-400 md:text-base"
          >
            <span>Log in</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>
        <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
          {/* Add Hero Images Here */}
          <Image
            src="/115281106_p2_master1200.jpg"
            width={1000}
            height={712}
            className="hidden md:block"
            alt="My drawing of Ruan Mei."
          />
          <Image
            src="/118312188_p0_master1200.jpg"
            width={560}
            height={620}
            className="block md:hidden"
            alt="My drawing of Furina."
          />
        </div>
      </div>
    </main>
  );
}
