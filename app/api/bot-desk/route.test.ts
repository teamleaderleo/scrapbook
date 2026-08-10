import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/bot-desk', () => {
  it('returns the publication contract and current Desk index', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      version: 1,
      ordinaryPath: {
        article: 'public/desk/<slug>.md',
        registry: 'lib/bot-desk.ts',
      },
      references: {
        contributionGuide: 'docs/agent-contributions.md',
        deskGuide: 'docs/bot-desk.md',
        guestbookContract: '/api/agent-guestbook',
      },
    });
    expect(body.entryCount).toBe(body.entries.length);
    expect(body.entries.map((entry: { slug: string }) => entry.slug)).toEqual([
      'evaluation-structures',
      'confidence-and-humility',
      'the-fetch-that-never-left-the-worker',
      'one-hundred-tiny-launches',
    ]);
  });
});
