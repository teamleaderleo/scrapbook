import Scene3D from '@/components/three-carousel/scene-3d';
import SiteNav from '@/components/site-nav';

export default function GalleryPage() {
  return (
    // TODO: fix the z level issue
    <div className="h-screen relative">
      <Scene3D />
      <div className="absolute top-0 left-0 right-0 z-[0]">
        <SiteNav />
      </div>
    </div>
  );
}