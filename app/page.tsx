import SiteNav from "@/components/site-nav";
import UTCTimeVisualizer from "@/components/time-conversion-visualizer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Time Zone Converter Visualizer - Convert Time Across Global Time Zones',
  description: 'Visualize time zone conversions. Convert time between UTC, EST, PST, CET and your local timezone. A visual interface for time conversion.',
};

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-sidebar-background">
      <SiteNav />
      <UTCTimeVisualizer />
    </main>
  );
}