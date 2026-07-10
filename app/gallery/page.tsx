import Scene3D from '@/components/three-carousel/scene-3d';
import SiteNav from '@/components/site-nav';

export default function GalleryPage() {
  return (
    <div className="h-screen relative">
      <Scene3D />
      {/* drei's ScrollControls overlays a full-screen scroll container, so the
          nav must sit above it to stay clickable */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <SiteNav />
      </div>
    </div>
  );
}