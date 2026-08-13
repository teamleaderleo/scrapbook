import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /api/agent-access/handoff-schema', () => {
  it('publishes a strict versioned schema for connector handoffs and evidence materialization', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(response.headers.get('content-type')).toContain(
      'application/schema+json'
    );
    expect(body).toMatchObject({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://teamleaderleo.com/api/agent-access/handoff-schema',
      description: expect.stringContaining('preflight third-party GitHub'),
      type: 'object',
      additionalProperties: false,
      properties: {
        formatVersion: { const: 1 },
        repository: { const: 'teamleaderleo/scrapbook' },
        lane: {
          enum: expect.arrayContaining([
            'guest-check-in',
            'bot-desk',
            'agent-journal',
            'repository-work',
          ]),
          description: expect.stringContaining('Workbench'),
        },
        files: {
          type: 'array',
          minItems: 1,
        },
        evidence: {
          type: 'array',
          description: expect.stringContaining('repository GitHub-reference preflight'),
        },
        review: {
          type: 'object',
        },
      },
    });
    expect(body.required).toEqual(
      expect.arrayContaining([
        'formatVersion',
        'repository',
        'base',
        'intent',
        'files',
        'validation',
        'review',
      ])
    );
    expect(body.properties.files.items.anyOf).toHaveLength(2);
  });
});
