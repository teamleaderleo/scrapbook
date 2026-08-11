import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/learning-records', () => {
  it('lists ten public repository fixtures without private editorial data', async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.recordCount).toBe(10);
    expect(body.records).toHaveLength(10);
    expect(JSON.stringify(body)).not.toContain('PRIVATE_');
    expect(JSON.stringify(body)).not.toContain('privateEditorial');
  });

  it('serves unlisted records by exact slug and never serves private records', async () => {
    const unlisted = await GET(
      new Request(
        'https://teamleaderleo.com/api/learning-records?slug=unlisted-record-shape-study'
      )
    );
    expect(unlisted.status).toBe(200);
    expect((await unlisted.json()).record.visibility).toBe('unlisted');

    const privateRecord = await GET(
      new Request(
        'https://teamleaderleo.com/api/learning-records?slug=private-working-conversation'
      )
    );
    expect(privateRecord.status).toBe(404);
  });
});
