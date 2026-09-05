import { expect, test } from '@playwright/test';
import { originalPassages } from '../../lib/practice-passages';

test('collections keep code and prose notes and attempts separate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/practice');
  await page.getByRole('button', { name: 'Patterns', exact: true }).click();
  await page.getByRole('button', { name: 'Counter to rate', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Typing input' });
  await input.fill('function bytes');
  await page.getByText('Think it through', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Passage notes' }).fill('A reset is not a quiet interval.');
  await page.getByRole('button', { name: 'Ideas', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Passage notes' })).toHaveValue('');
  const memory = originalPassages.find(passage => passage.slug === 'memory-headroom')!;
  await input.fill(memory.text);
  await expect(page.getByText('Exact pass', { exact: true })).toBeVisible();
  await page.getByText('Recent practice', { exact: true }).click();
  await expect(page.getByRole('list').filter({ hasText: 'Memory headroom' })).toBeVisible();
  await page.getByRole('button', { name: 'Patterns', exact: true }).click();
  await page.getByRole('button', { name: 'Counter to rate', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Passage notes' })).toHaveValue('A reset is not a quiet interval.');
  await page.getByText('Source', { exact: true }).click();
  await expect(page.getByText('Original practice passage · v1', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
