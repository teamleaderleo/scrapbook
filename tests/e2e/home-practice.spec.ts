import { expect, test } from '@playwright/test';
import { codeExercises } from '../../lib/code-practice';

for (const width of [320, 390, 1280]) {
  test(`repository summaries reflow at ${width}px without a contribution dashboard`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const requests: string[] = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto('/');
    await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
    await expect(page.locator('[data-home-repository]')).toHaveCount(6);
    await expect(page.locator('[data-activity-scoreboard]')).toHaveCount(0);
    await expect(
      page.locator('[data-home-tools]').getByRole('link', { name: /Practice/ })
    ).toHaveAttribute('href', '/practice');
    const sizes = await page
      .locator('[data-home-repository]')
      .evaluateAll(rows =>
        rows.map(row => {
          const summary = row.querySelector('span.flex-1')
            ?.lastElementChild as HTMLElement;
          return {
            width: summary.clientWidth,
            content: summary.scrollWidth,
            whiteSpace: getComputedStyle(summary).whiteSpace,
            right: row.getBoundingClientRect().right,
          };
        })
      );
    for (const size of sizes) {
      expect(size.width).toBeGreaterThan(0);
      expect(size.content).toBeLessThanOrEqual(size.width + 1);
      expect(size.whiteSpace).toBe('normal');
      expect(size.right).toBeLessThanOrEqual(width);
    }
    expect(requests.some(url => url.includes('/api/github-activity'))).toBe(
      false
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width);
  });
}

test('typing locates mistakes, pauses, completes, restarts and switches exercises', async ({
  page,
}) => {
  await page.goto('/practice');
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Typing input' });
  await input.pressSequentially('x', { delay: 50 });
  await expect(
    page.getByText(/First mismatch: line 1, column 1/)
  ).toBeVisible();
  await expect(page.getByText(/Typing · [1-9]/)).toBeVisible({ timeout: 4000 });
  await page.getByRole('heading', { name: 'Practice' }).click();
  const paused = await page.getByText(/Paused ·/).textContent();
  await page.waitForTimeout(1100);
  await expect(page.getByText(/Paused ·/)).toHaveText(paused!);
  await input.fill(codeExercises[0].text);
  await expect(page.getByRole('status')).toContainText('Exact pass');
  await expect(input).toHaveAttribute('readonly', '');
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await page
    .getByRole('button', { name: 'Mode validation', exact: true })
    .click();
  await expect(input).toHaveValue('');
  await input.fill(codeExercises[1].text);
  await expect(page.getByRole('status')).toContainText('Exact pass');
  await page.reload();
  await expect(input).toHaveValue('');
});

test('Tab is native unless enabled and pasted attempts have no speed score', async ({
  page,
}) => {
  await page.goto('/practice');
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Typing input' });
  await input.focus();
  await input.press('Tab');
  await expect(page.getByRole('button', { name: 'Restart' })).toBeFocused();
  await page.getByLabel('Tab indents').check();
  await input.fill('export');
  await input.press('Tab');
  await expect(input).toHaveValue('export  ');
  await input.press('Shift+Tab');
  await expect(input).not.toBeFocused();
  await input.dispatchEvent('paste');
  await input.fill(codeExercises[0].text);
  await expect(page.locator('[data-typing-stats]')).toContainText('Pasted');
  await expect(page.locator('[data-typing-stats]')).not.toContainText('WPM');
});

test('practice stays inside a mobile viewport with readable input', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/practice');
  const input = page.getByRole('textbox', { name: 'Typing input' });
  await expect(input).toBeVisible();
  expect(
    await input.evaluate(element =>
      parseFloat(getComputedStyle(element).fontSize)
    )
  ).toBeGreaterThanOrEqual(16);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390);
  await expect(
    page.getByRole('group', { name: 'Passage', exact: true })
  ).toBeVisible();
});
