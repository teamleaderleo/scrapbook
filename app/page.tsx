import AcmeLogo from '@/components/ui/assets/acme-logo';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { lusitana } from '@/components/ui/assets/fonts';
import Image from 'next/image';
import FeatureShowcase from '@/components/feature-showcase';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <FeatureShowcase />
        <div className="flex flex-col items-center justify-center p-6 md:w-1/3 md:px-28 md:py-12">
          <div className="text-center mb-8">
            <h2 className={`${lusitana.className} text-xl font-semibold text-gray-800 md:text-2xl mb-4`}>
              Login Information
            </h2>
            <p className="text-md text-gray-600">
              For testing purposes, use:
            </p>
            <p className="text-sm text-gray-500">
              Email: user@nextmail.com
              <br />
              Password: 123456
            </p>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-5 self-start rounded-lg bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-400 md:text-base"
          >
            <span>Log in</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>
      </div>
    </main>
  );
}