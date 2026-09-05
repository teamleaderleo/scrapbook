import { expect, test } from '@playwright/test';

test('line examples preserve typing and stay hidden during recall', async ({ page }) => {
  await page.goto('/practice');
  await page.getByRole('button', { name: 'Patterns', exact: true }).click();
  await page.getByRole('button', { name: 'Counter to rate', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Typing input' });
  await input.fill('function bytes');
  const toggle = page.getByRole('button', { name: 'Line notes', exact: true });
  await toggle.click();
  const notes = page.getByRole('complementary', { name: 'Line notes' });
  await expect(notes).toBeVisible();
  await notes.getByRole('button', { name: 'Allow a falling counter', exact: true }).click();
  await expect(notes.getByText('-14800', { exact: true })).toBeVisible();
  await expect(input).toHaveValue('function bytes');
  await expect(page.locator('[data-line-note]').first()).toBeVisible();
  await notes.getByRole('button', { name: /Milliseconds to seconds/ }).click();
  await notes.getByRole('button', { name: 'Drop the conversion', exact: true }).click();
  await expect(notes.getByText('2000', { exact: true })).toBeVisible();
  await expect(notes.getByText('2', { exact: true })).toBeVisible();
  await notes.getByRole('button', { name: 'Original', exact: true }).click();
  await expect(notes.getByText('Changed', { exact: true })).toHaveCount(0);
  await toggle.click();
  await expect(notes).toHaveCount(0);
  await expect(input).toHaveValue('function bytes');
  await toggle.click();
  await page.getByRole('button', { name: 'Recall', exact: true }).click();
  await expect(notes).toHaveCount(0);
  await expect(toggle).toHaveCount(0);
  await expect(page.locator('[data-typing-overlay]')).not.toContainText('bytesPerSecond');
});

test('line notes reflow below the typing surface on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/practice');
  await page.getByRole('button', { name: 'Line notes', exact: true }).click();
  const notes = page.getByRole('complementary', { name: 'Line notes' });
  await notes.getByRole('button', { name: 'Remove the guard', exact: true }).click();
  await expect(notes.getByText('Infinity', { exact: true })).toBeVisible();
  const fieldBox = (await page.locator('[data-typing-exercise]').boundingBox())!;
  const notesBox = (await notes.boundingBox())!;
  expect(notesBox.y).toBeGreaterThanOrEqual(fieldBox.y + fieldBox.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
