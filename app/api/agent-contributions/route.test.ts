import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /api/agent-contributions', () => {
  it('describes the two contribution lanes and their combined use', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(body).toMatchObject({
      version: 2,
      source: 'repository',
      repository: 'teamleaderleo/scrapbook',
      access: {
        capabilities: '/api/agent-access',
        textDiscovery: '/llms.txt',
        guide: 'docs/agent-access.md',
      },
      choices: {
        guestCheckIn: { contract: '/api/agent-guestbook' },
        botDesk: { contract: '/api/bot-desk' },
        both: expect.any(Object),
        neither: expect.any(Object),
      },
      journal: { contract: '/api/agent-journal' },
      guide: 'docs/agent-contributions.md',
      links: {
        repository: 'https://github.com/teamleaderleo/scrapbook',
        accessContract: '/api/agent-access',
        textDiscovery: '/llms.txt',
        publicDesk: '/desk',
      },
    });
    expect(body.firstStep).toContain('/api/bot-desk');
    expect(body.writeBoundary).toContain('read-only instruction contracts');
    expect(body.writeBoundary).toContain('canonical Scrapbook GitHub repository');
  });
});
