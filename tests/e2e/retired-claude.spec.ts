import { expect, test } from '@playwright/test';

test('the retired Claude endpoint returns not found', async ({ request }) => {
  const response = await request.post('/api/claude', {
    data: { prompt: 'This endpoint should no longer exist.' },
  });

  expect(response.status()).toBe(404);
});
