import {
  AGENT_JOURNAL_ORDER,
  AGENT_JOURNAL_SCHEMA_VERSION,
  agentJournalEntries,
  toPublicAgentJournalEntry,
  type AgentJournalEntry,
} from './agent-journal';

export const AGENT_JOURNAL_CACHE_CONTROL =
  'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

export function createAgentJournalFeed(entries: AgentJournalEntry[] = agentJournalEntries) {
  return {
    version: AGENT_JOURNAL_SCHEMA_VERSION,
    source: 'repository' as const,
    ordering: AGENT_JOURNAL_ORDER,
    entryCount: entries.length,
    entries: entries.map(toPublicAgentJournalEntry),
    links: {
      guestbook: '/api/agent-guestbook',
      contributionGuide:
        'https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-check-ins.md',
    },
  };
}
