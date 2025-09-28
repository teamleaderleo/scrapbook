import { Suspense } from "react";
import { SpaceView } from "@/components/space/space-view";
import { ITEMS } from "@/app/lib/leetcode-data";
import { ensureSeedReview } from "@/app/lib/seed-review";

export default function SpacePage() {
  const serverNow = Date.now();
  const seeded = ensureSeedReview(ITEMS, serverNow);

  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <SpaceView serverNow={serverNow} seeded={seeded} />
    </Suspense>
  );
}
