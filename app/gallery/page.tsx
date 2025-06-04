import Scene3D from '@/components/three-carousel/scene-3d';
import SiteNav from '@/components/site-nav';

export default function GalleryPage() {
  return (
    <div className="h-screen flex flex-col">
      <SiteNav />
      <div className="flex-1">
        <Scene3D />
      </div>
    </div>
  );
}