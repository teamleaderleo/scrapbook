'use client';

import { useState, useEffect } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const features = [
  "a project management tool.",
  "a calendar.",
  "an organize.r",
  "a portfolio showcase.",
  "a resume."
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
    <div className="flex flex-col items-start max-w-4xl mx-auto w-full">
      <div className="w-full text-left mb-6">
        <h1 className="text-5xl font-bold text-gray-900 inline-flex flex-wrap">
          <span className="mr-3 whitespace-nowrap">Stensibly:</span>
          <div className="relative inline-block min-w-[300px]">
            {features.map((feature, index) => (
              <span
                key={index}
                className={`absolute top-0 left-0 whitespace-nowrap transition-opacity duration-300 ${
                  index === featureIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {feature}
              </span>
            ))}
          </div>
        </h1>
      </div>
      <p className="text-xl mb-8 text-gray-600 text-left w-full">
        Organize your life, manage your projects, and showcase your work.
        Stensibly is the all-in-one tool for personal and professional growth.
      </p>
      <div className="flex justify-center w-full gap-4">
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