import { expect, test } from '@playwright/test';

test('themes preserve typing and syntax colors and remember light and dark choices', async ({ page }) => {
  await page.goto('/practice');
  const input = page.getByRole('textbox', { name: 'Typing input' });
  await input.fill('export');
  await page.getByRole('button', { name: /^Practice theme:/ }).click();
  await page.getByRole('dialog', { name: 'Practice theme' }).getByRole('button', { name: 'Catppuccin Mocha', exact: true }).click();
  await expect(page.locator('[data-practice-theme]')).toHaveAttribute('data-practice-theme', 'catppuccin-mocha');
  await expect(input).toHaveValue('export');
  const correct = page.locator('[data-typing-state="correct"]').first();
  const keywordColor = await correct.evaluate(element => getComputedStyle(element).color);
  expect(keywordColor).toBe('rgb(203, 166, 247)');
  expect(await correct.evaluate(element => getComputedStyle(element).textDecorationLine)).toBe('underline');
  await page.getByRole('button', { name: /^Practice theme:/ }).click();
  await page.getByRole('dialog', { name: 'Practice theme' }).getByRole('button', { name: 'Vesper', exact: true }).click();
  await expect(input).toHaveValue('export');
  await page.reload();
  await expect(page.locator('[data-practice-theme]')).toHaveAttribute('data-practice-theme', 'vesper');
  await page.getByRole('button', { name: /^Practice theme:/ }).click();
  await page.getByRole('dialog', { name: 'Practice theme' }).getByRole('button', { name: 'Catppuccin Latte', exact: true }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(page.locator('[data-practice-theme]')).toHaveAttribute('data-practice-theme', 'catppuccin-latte');
  await page.getByRole('button', { name: 'Toggle light and dark mode' }).click();
  await expect(page.locator('[data-practice-theme]')).toHaveAttribute('data-practice-theme', 'vesper');
});

test('phone theme picker fits, restores focus, and recall reveals no token colors', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/practice');
  const trigger = page.getByRole('button', { name: /^Practice theme:/ });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Practice theme' });
  const box = (await dialog.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Recall', exact: true }).click();
  await expect(page.locator('[data-syntax-token]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
