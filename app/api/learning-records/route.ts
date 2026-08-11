import {
  getReadableLearningRecord,
  publicLearningRecords,
} from '@/lib/learning-records';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';

const responseOptions = {
  headers: { 'Cache-Control': REPOSITORY_PUBLIC_CACHE_CONTROL },
};

export async function GET(request?: Request) {
  const slug = request
    ? new URL(request.url).searchParams.get('slug')?.trim()
    : undefined;

  if (slug) {
    const record = getReadableLearningRecord(slug);
    if (!record) {
      return Response.json(
        { error: 'Learning record not found.' },
        { status: 404, ...responseOptions }
      );
    }
    return Response.json(
      { version: 1, source: 'repository-fixtures', record },
      responseOptions
    );
  }

  return Response.json(
    {
      version: 1,
      source: 'repository-fixtures',
      recordCount: publicLearningRecords.length,
      records: publicLearningRecords,
      links: {
        publicPage: '/space/records',
        record: '/api/learning-records?slug=<slug>',
        contract:
          'https://github.com/teamleaderleo/scrapbook/blob/main/lib/learning-records.ts',
      },
    },
    responseOptions
  );
}
