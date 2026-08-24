import { describe, expect, it } from 'vitest';
import { getWorkRecord, workRecords } from './work-records';

describe('public work records', () => {
  it('keeps a unique stable id and inspectable evidence on every record', () => {
    expect(new Set(workRecords.map(record => record.id)).size).toBe(
      workRecords.length
    );

    for (const record of workRecords) {
      expect(record.id).toMatch(/^[a-z0-9-]+$/);
      expect(record.accomplishments.length).toBeGreaterThanOrEqual(2);
      expect(record.evidence.length).toBeGreaterThan(0);
      for (const evidence of record.evidence) {
        const url = new URL(evidence.href);
        const owner = url.pathname.split('/').filter(Boolean)[0];

        expect(url.protocol).toBe('https:');
        if (url.hostname === 'teamleaderleo.com') {
          expect(url.pathname).toMatch(/^\/work\//);
        } else if (owner === 'teamleaderleo') {
          expect(url.hostname).toBe('github.com');
        } else {
          expect(url.hostname).toBe('redirect.github.com');
        }
      }
    }
  });

  it('looks up records without inventing a fallback', () => {
    expect(getWorkRecord('preflight')?.title).toBe('Preflight');
    expect(getWorkRecord('missing')).toBeUndefined();
  });
});
