import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import {
  impactCandidates,
  queryImpactCandidateRecords,
} from '@/lib/work-impact';

function parseLimit(value: string | null) {
  if (value === null) return 30;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : 30;
}

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const filters = {
    q: params.get('q') ?? '',
    repo: params.get('repo') ?? '',
    limit: parseLimit(params.get('limit')),
  };
  const records = queryImpactCandidateRecords(filters);

  return Response.json(
    {
      version: 1,
      source: 'repository-snapshot',
      updatedAt: impactCandidates.updatedAt,
      totalRecordCount: impactCandidates.recordCount,
      recordCount: records.length,
      filters,
      records,
      links: {
        curated: '/api/work-impact',
        publicPage: '/work/impact',
        compactIndex: '/data/impact-pr-candidates-v1.json',
      },
    },
    {
      headers: {
        'Cache-Control': REPOSITORY_PUBLIC_CACHE_CONTROL,
      },
    }
  );
}
