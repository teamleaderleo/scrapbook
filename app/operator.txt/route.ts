import { renderOperatorPhrasebookText } from '@/lib/operator-phrases';

export function GET() {
  return new Response(renderOperatorPhrasebookText(), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
}
