import { Suspense } from "react";
import { SpaceView } from "@/components/space/space-view";

export default function SpacePage() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <SpaceView />
    </Suspense>
  );
}
