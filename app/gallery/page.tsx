import Scene3D from '@/components/three-carousel/scene-3d';
import SiteNav from '@/components/site-nav';

export default function GalleryPage() {
  return (
    <div className="h-screen relative">
      <div className="absolute top-0 left-0 right-0">
        <SiteNav />
      </div>
      <Scene3D />
    </div>
  );
}