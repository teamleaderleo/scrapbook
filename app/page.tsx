import SiteNav from "@/components/site-nav";
import UTCTimeVisualizer from "@/components/time-conversion-visualizer";

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-sidebar-background">
      <SiteNav />
      <UTCTimeVisualizer />
    </main>
  );
}