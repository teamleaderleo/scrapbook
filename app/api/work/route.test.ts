import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/work', () => {
  it('projects selected repository-backed work records', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('public');
    expect(body).toMatchObject({
      version: 1,
      source: 'repository',
      updatedAt: '2026-08-27',
      recordCount: 8,
    });
    expect(body.records.map((record: { id: string }) => record.id)).toEqual([
      'preflight',
      'open-source',
      'agent-systems',
      'stensibly',
      'smolrunner',
      'glossless',
      'cultist',
      'fieldwork',
    ]);
    expect(body.records[4]).toMatchObject({
      id: 'smolrunner',
      title: 'Glaeda',
    });
    expect(body.records[4].evidence[0]).toMatchObject({
      href: 'https://github.com/teamleaderleo/glaeda',
    });
    expect(body.records[0].evidence[0].href).toBe('/work/preflight');
  });
});
