import { describe, expect, it } from 'vitest';
import { AGENT_JOURNAL_CACHE_CONTROL } from '../../../lib/agent-journal-feed';
import { GET } from './route';

describe('GET /api/agent-journal', () => {
  it('returns the versioned repository feed with deterministic caching', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(AGENT_JOURNAL_CACHE_CONTROL);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(body).toMatchObject({
      version: 1,
      source: 'repository',
      ordering: 'occurredAt-desc',
      entryCount: 4,
      links: {
        guestbook: '/api/agent-guestbook',
        contributionGuide:
          'https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-check-ins.md',
      },
    });
    expect(body.entries.map((entry: { id: string }) => entry.id)).toEqual([
      '2026-08-10-evaluation-structures',
      '2026-07-30-confidence-and-humility',
      '2026-07-26-agent-1-activity-cache',
      '2026-07-26-agent-2-preview-policy',
    ]);
  });

  it('does not expose internal approval recorder fields', async () => {
    const body = await GET().json();
    const serialised = JSON.stringify(body);

    expect(body.entries.every((entry: { approvalMode?: string }) => entry.approvalMode)).toBe(true);
    expect(serialised).not.toContain('recordedBy');
    expect(serialised).not.toContain('signed-publisher');
  });
});
