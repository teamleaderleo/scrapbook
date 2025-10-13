import { Suspense } from "react";
import { ReviewGallery } from "@/components/space/review-gallery";

export default function ReviewPage() {
  const serverNow = Date.now();
  
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <ReviewGallery serverNow={serverNow} />
    </Suspense>
  );
}