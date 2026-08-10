import {
  AGENT_JOURNAL_ORDER,
  AGENT_JOURNAL_SCHEMA_VERSION,
  agentJournalEntries,
  toPublicAgentJournalEntry,
  type AgentJournalEntry,
} from './agent-journal';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from './repository-public-cache';

export const AGENT_JOURNAL_CACHE_CONTROL = REPOSITORY_PUBLIC_CACHE_CONTROL;

export function createAgentJournalFeed(entries: AgentJournalEntry[] = agentJournalEntries) {
  return {
    version: AGENT_JOURNAL_SCHEMA_VERSION,
    source: 'repository' as const,
    ordering: AGENT_JOURNAL_ORDER,
    entryCount: entries.length,
    entries: entries.map(toPublicAgentJournalEntry),
    links: {
      access: '/api/agent-access',
      textDiscovery: '/llms.txt',
      contributions: '/api/agent-contributions',
      guestbook: '/api/agent-guestbook',
      botDesk: '/api/bot-desk',
      accessGuide:
        'https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-access.md',
      contributionGuide:
        'https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-contributions.md',
    },
  };
}
