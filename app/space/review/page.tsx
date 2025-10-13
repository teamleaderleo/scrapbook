import { ReviewGallery } from "@/components/space/review-gallery";

export default function ReviewPage() {
  const serverNow = Date.now();
  
  return (
    <ReviewGallery serverNow={serverNow} />
  );
}