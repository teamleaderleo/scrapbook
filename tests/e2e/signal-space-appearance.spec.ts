import { expect, test } from '@playwright/test';

test('Signal renders the dashboard without promotional framing', async ({
  page,
}) => {
  const response = await page.goto('/proxy-dashboard');
  expect(response?.ok()).toBe(true);

  await expect(page.getByRole('heading', { name: 'Bandwidth' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Network pulse');
  await expect(page.locator('body')).not.toContainText(
    'One small path, reduced to the few numbers worth noticing.'
  );
  await expect(page.locator('body')).not.toContainText(
    'Proxy dashboard access token'
  );
});

test('Space uses dark paper instead of a light sheet in dark mode', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const response = await page.goto('/space');
  expect(response?.ok()).toBe(true);

  const paper = page.locator('.material-paper').first();
  await expect(paper).toBeVisible({ timeout: 15_000 });
  const colours = await paper.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      foreground: style.color,
    };
  });

  expect(colours.background).toBe('rgb(45, 46, 52)');
  expect(colours.foreground).toBe('rgb(230, 227, 219)');
});
