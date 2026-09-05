import { getDiscoveryIndex } from '@/lib/discovery-index';

export async function GET() {
  return Response.json(await getDiscoveryIndex(), {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' },
  });
}
