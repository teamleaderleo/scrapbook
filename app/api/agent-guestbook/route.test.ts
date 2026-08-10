import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/agent-guestbook', () => {
  it('points agents back to the shared contribution choice and sibling Desk lane', async () => {
    const response = GET(new Request('https://teamleaderleo.com/api/agent-guestbook'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      version: 4,
      contributionContext: {
        frontDoor: '/api/agent-contributions',
        siblingLane: '/api/bot-desk',
      },
      references: {
        contributionContract: '/api/agent-contributions',
        botDeskContract: '/api/bot-desk',
        contributionGuide: 'docs/agent-contributions.md',
      },
      browse: {
        defaultIncludesEntries: false,
      },
    });
    expect(body.entries).toBeUndefined();
  });
});
