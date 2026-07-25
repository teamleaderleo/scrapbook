import Scene3D from '@/components/three-carousel/scene-3d';
import SiteNav from '@/components/site-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cube',
  description: 'Interactive 3D gallery experiment.',
  alternates: { canonical: '/gallery' },
};

export default function GalleryPage() {
  return (
    <div className="relative h-dvh overflow-hidden">
      <Scene3D />
      {/* ScrollControls owns the full-screen scroll layer, so the nav remains an overlay here. */}
      <div className="absolute inset-x-0 top-0 z-50">
        <SiteNav />
      </div>
    </div>
  );
}
