import { renderOperatorPhrasebookText } from '@/lib/operator-phrases';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';

export function GET() {
  return new Response(renderOperatorPhrasebookText(), {
    headers: {
      'Cache-Control': REPOSITORY_PUBLIC_CACHE_CONTROL,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
