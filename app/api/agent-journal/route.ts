import {
  AGENT_JOURNAL_CACHE_CONTROL,
  createAgentJournalFeed,
} from '@/lib/agent-journal-feed';

export function GET() {
  return Response.json(createAgentJournalFeed(), {
    headers: {
      'Cache-Control': AGENT_JOURNAL_CACHE_CONTROL,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
