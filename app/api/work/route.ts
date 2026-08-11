import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { workRecords, workRecordUpdatedAt } from '@/lib/work-records';

export async function GET() {
  return Response.json(
    {
      version: 1,
      source: 'repository',
      updatedAt: workRecordUpdatedAt,
      recordCount: workRecords.length,
      records: workRecords,
      links: {
        publicPage: '/work',
        repositoryRecord:
          'https://github.com/teamleaderleo/scrapbook/tree/main/work',
      },
    },
    {
      headers: {
        'Cache-Control': REPOSITORY_PUBLIC_CACHE_CONTROL,
      },
    }
  );
}
