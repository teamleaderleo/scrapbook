import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /llms.txt', () => {
  it('points agents to the canonical capability, Workbench, and reference contracts', async () => {
    const response = GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(text).toContain('https://teamleaderleo.com/api/agent-access');
    expect(text).toContain(
      'https://teamleaderleo.com/api/agent-access/handoff-schema'
    );
    expect(text).toContain('https://teamleaderleo.com/operator');
    expect(text).toContain('https://teamleaderleo.com/operator.txt');
    expect(text).toContain('https://teamleaderleo.com/api/agent-contributions');
    expect(text).toContain('https://teamleaderleo.com/work');
    expect(text).toContain('https://teamleaderleo.com/api/work');
    expect(text).toContain('https://teamleaderleo.com/space/records');
    expect(text).toContain('https://teamleaderleo.com/api/learning-records');
    expect(text).toContain(
      'https://teamleaderleo.com/api/bot-desk?slug=<slug>'
    );
    expect(text).toContain('Workbench index/publication contract');
    expect(text).toContain('retain the older bot-desk identifier for compatibility');
    expect(text).toContain('redirect.github.com');
    expect(text).toContain('repositories owned by teamleaderleo');
    expect(text).toContain('every third-party GitHub repository');
    expect(text).toContain('explicitly wants the durable direct relationship');
    expect(text).toContain('https://github.com/teamleaderleo/scrapbook');
    expect(text).toContain('leave the repository unchanged');
    expect(text).toContain(
      'validated against /api/agent-access/handoff-schema'
    );
    expect(text).toContain('Do not publish repository-backed contributions');
  });
});
