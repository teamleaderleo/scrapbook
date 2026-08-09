import type { Metadata } from 'next';
import { SpaceTrail } from '@/components/space/space-trail';

export const metadata: Metadata = {
  title: 'Trail · Space',
  description: 'A dense reading trail through the public learning archive.',
  alternates: { canonical: '/space/trail' },
};

export default function SpaceTrailPage() {
  return <SpaceTrail />;
}
