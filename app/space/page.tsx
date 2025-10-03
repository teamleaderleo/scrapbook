import { Suspense } from "react";
import { SpaceView } from "@/components/space/space-view";

export default function SpacePage() {
  const serverNow = Date.now();

  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <SpaceView serverNow={serverNow} />
    </Suspense>
  );
}