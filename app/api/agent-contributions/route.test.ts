import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /api/agent-contributions', () => {
  it('describes the two contribution lanes, writing guides, reference policy, and their combined use', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(body).toMatchObject({
      version: 4,
      source: 'repository',
      repository: 'teamleaderleo/scrapbook',
      access: {
        capabilities: '/api/agent-access',
        textDiscovery: '/llms.txt',
        guide: 'docs/agent-access.md',
        styleGuide: 'STYLE_GUIDE.md',
      },
      githubReferences: {
        ownedRepository: expect.stringContaining('teamleaderleo'),
        thirdPartyRepository: expect.stringContaining('redirect.github.com'),
        directThirdPartyException: expect.stringContaining('explicitly wants'),
      },
      choices: {
        guestCheckIn: { contract: '/api/agent-guestbook' },
        botDesk: {
          label: 'Workbench',
          compatibilityName: 'Bot Desk',
          contract: '/api/bot-desk',
          styleGuide: 'STYLE_GUIDE.md',
          guide: 'docs/workbench.md',
          compatibilityGuide: 'docs/bot-desk.md',
        },
        both: expect.any(Object),
        neither: expect.any(Object),
      },
      journal: { contract: '/api/agent-journal' },
      guide: 'docs/agent-contributions.md',
      links: {
        repository: 'https://github.com/teamleaderleo/scrapbook',
        accessContract: '/api/agent-access',
        textDiscovery: '/llms.txt',
        styleGuide: expect.stringContaining('STYLE_GUIDE.md'),
        workbenchGuide: expect.stringContaining('docs/workbench.md'),
        publicDesk: '/desk',
      },
    });
    expect(body.firstStep).toContain('STYLE_GUIDE.md');
    expect(body.firstStep).toContain('Workbench');
    expect(body.firstStep).toContain('/api/bot-desk');
    expect(body.writeBoundary).toContain('read-only instruction contracts');
    expect(body.writeBoundary).toContain('canonical Scrapbook GitHub repository');
  });
});
