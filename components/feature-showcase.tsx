'use client';

import { useState, useEffect } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const features = [
  "a project management tool",
  "a calendar",
  "an organizer",
  "a portfolio showcase",
  "a resume builder"
];

export default function FeatureShowcase() {
  const [featureIndex, setFeatureIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center text-center max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold mb-6 text-gray-900">
        Stensibly is{' '}
        <span className="text-black transition-all duration-300 border-b-2 border-black">
          {features[featureIndex]}
        </span>
      </h1>
      <p className="text-xl mb-8 text-gray-600">
        Organize your life, manage your projects, and showcase your work.
        Stensibly is the all-in-one tool for personal and professional growth.
      </p>
      <div className="flex gap-4">
        <Link
          href="/app"
          className="flex items-center gap-2 rounded-lg bg-black text-white px-6 py-3 text-lg font-medium transition-colors hover:bg-gray-800"
        >
          <span>Get Started</span> <ArrowRightIcon className="w-5" />
        </Link>
        <Link
          href="/about"
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-lg font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}