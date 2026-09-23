import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import {
  impactIndex,
  impactSummary,
  queryImpactRecords,
} from '@/lib/work-impact';

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const filters = {
    q: params.get('q') ?? '',
    repo: params.get('repo') ?? '',
    area: params.get('area') ?? '',
    dimension: params.get('dimension') ?? '',
    id: params.get('id') ?? '',
  };
  const records = queryImpactRecords(filters);

  return Response.json(
    {
      version: 1,
      source: 'repository',
      updatedAt: impactIndex.updatedAt,
      totalRecordCount: impactIndex.recordCount,
      recordCount: records.length,
      filters,
      summary: impactSummary,
      records,
      links: {
        publicPage: '/work/impact',
        repositoryRecord:
          'https://github.com/teamleaderleo/scrapbook/tree/main/work/impact',
        compactIndex: '/data/impact-index-v1.json',
        compactSummary: '/data/impact-summary-v1.json',
      },
    },
    {
      headers: {
        'Cache-Control': REPOSITORY_PUBLIC_CACHE_CONTROL,
      },
    }
  );
}
