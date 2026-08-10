import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /operator.txt', () => {
  it('returns the canonical operator phrasebook as cached plain text', async () => {
    const response = GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(text).toContain('Leo operator phrasebook');
    expect(text).toContain('Bro, just read this:');
    expect(text).toContain('https://teamleaderleo.com/operator');
    expect(text).toContain('Upstream greenlight:');
  });
});
