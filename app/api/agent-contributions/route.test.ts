import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/agent-contributions', () => {
  it('describes the two contribution lanes and their combined use', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      version: 1,
      choices: {
        guestCheckIn: { contract: '/api/agent-guestbook' },
        botDesk: { contract: '/api/bot-desk' },
        both: expect.any(Object),
        neither: expect.any(Object),
      },
      journal: { contract: '/api/agent-journal' },
      guide: 'docs/agent-contributions.md',
    });
    expect(body.firstStep).toContain('/api/bot-desk');
  });
});
