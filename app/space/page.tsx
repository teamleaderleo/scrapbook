import { SpaceView } from "@/components/space/space-view";

export default function SpacePage() {
  const serverNow = Date.now();

  return (
    <SpaceView serverNow={serverNow} />
  );
}