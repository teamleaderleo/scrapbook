'use client';

import dynamic from 'next/dynamic';

const Scene3D = dynamic(() => import('@/components/gallery/tesseract-scene'), {
  ssr: false,
  loading: () => <div className="h-full min-h-full w-full min-w-0 bg-[#15161a]" aria-hidden="true" />,
});

export function GalleryScene() {
  return <Scene3D />;
}
