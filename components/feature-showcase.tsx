'use client';

import { useState, useEffect } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const features = [
  "a project management tool",
  "a calendar",
  "an organizer",
  "a portfolio showcase",
  "a resume."
];

export default function FeatureShowcase() {
  const [featureIndex, setFeatureIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 3000); // Change text every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/3 md:px-20">
      <h1 className={`text-3xl font-bold text-gray-800 md:text-5xl md:leading-normal`}>
        Stensibly: <span className="text-indigo-600">{features[featureIndex]}</span>
      </h1>
      <p className="text-md text-gray-600 md:text-lg">
        Stensibly is something to help manage projects, organize your life, and showcase your work. 
        It&apos;s an attempt to make a tool that speaks to me.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="flex items-center gap-5 self-start rounded-lg bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-400 md:text-base"
        >
          <span>Get Started</span> <ArrowRightIcon className="w-5 md:w-6" />
        </Link>
        <Link
          href="/about"
          className="flex items-center gap-5 self-start rounded-lg border border-indigo-500 px-6 py-3 text-sm font-medium text-indigo-500 transition-colors hover:bg-indigo-50 md:text-base"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}