import { Suspense } from "react";
import { SpaceView } from "@/components/space/space-view";

export const dynamic = 'force-dynamic';

export default function SpacePage() {
  const serverNow = Date.now();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background p-4">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    }>
      <SpaceView serverNow={serverNow} />
    </Suspense>
  );
}