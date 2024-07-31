'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/artifacts');
  }, [router]);

  // Return null to prevent any flash of content
  return null;
}