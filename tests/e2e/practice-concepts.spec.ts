import { expect, test } from '@playwright/test';
import { codeExercises } from '../../lib/code-practice';

test('a Knowledge page opens practice on that exact concept', async ({
  page,
}) => {
  await page.goto('/knowledge/storage/mvcc');
  await page.getByRole('link', { name: 'Practise this concept →' }).click();
  await expect(
    page.getByRole('heading', { name: 'MVCC', exact: true })
  ).toBeVisible();
  await expect(page).toHaveURL(/concept=storage%2Fmvcc/);
  await page.reload();
  await expect(page).toHaveURL(/concept=storage%2Fmvcc/);
});

test('concepts reveal sources, preserve notes and support revisits', async ({
  page,
}) => {
  await page.goto('/practice?mode=concepts');
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: 'Browse concepts' }).click();
  await page.getByLabel('Find a concept').fill('critical path');
  await page
    .getByRole('button', { name: /Profiling the critical path/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Profiling the critical path' })
  ).toBeVisible();
  await expect(page.getByText('Compare with the concept')).toHaveCount(0);
  await page.getByText('Notes', { exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Concept notes' })
    .fill('Measure the event that gates the result.');
  await page.getByRole('button', { name: 'Reveal reference' }).click();
  await expect(
    page.getByText(/A speedup changes end-to-end latency/)
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Read the full concept/ })
  ).toHaveAttribute('href', '/knowledge/performance/profiling-critical-path');
  await page.getByRole('button', { name: 'Revisit', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Marked for revisit');
  await page.reload();
  await page.getByRole('button', { name: 'Browse concepts' }).click();
  await page.getByLabel('Marked for revisit', { exact: true }).check();
  await page
    .getByRole('button', { name: /Profiling the critical path/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Profiling the critical path' })
  ).toBeVisible();
  await page.getByText('Notes', { exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Concept notes' })
  ).toHaveValue('Measure the event that gates the result.');
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(
    page.getByText('Which event gates that outcome?', { exact: true })
  ).toBeVisible();
  await page.getByText('Notes', { exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Concept notes' })
  ).toHaveValue('');
  await page.getByText('Recent practice', { exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Clear history' })
  ).toBeVisible();
});

test('code records corrected attempts and keeps recall separate', async ({
  page,
}) => {
  await page.goto('/practice');
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Typing input' });
  await input.pressSequentially('x');
  await expect(page.getByText(/Typing · [1-9]/)).toBeVisible();
  await input.fill(codeExercises[0].text);
  await expect(page.getByText(/copy best .* WPM/)).toBeVisible();
  await page.getByText('Recent practice', { exact: true }).click();
  await expect(page.getByText(/1 corrected/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/copy best .* WPM/)).toBeVisible();
  await page.getByRole('button', { name: 'Recall', exact: true }).click();
  await expect(page.getByText(/copy best/)).toHaveCount(0);
  await expect(page.locator('[data-typing-overlay]')).not.toContainText(
    'export function'
  );
  await page.getByRole('button', { name: 'Reveal code' }).click();
  await expect(page.locator('[data-typing-exercise] pre')).toBeVisible();
  await input.fill(codeExercises[0].text);
  await expect(page.getByText(/recall best/)).toHaveCount(0);
  await page.getByText('Recent practice', { exact: true }).click();
  await expect(page.getByText(/corrected · assisted/)).toBeVisible();
  await page.getByRole('button', { name: 'Clear history' }).click();
  await page.reload();
  await page.getByText('Recent practice', { exact: true }).click();
  await expect(
    page.getByText(/Complete a function or check a concept/)
  ).toBeVisible();
});

test('history stays usable when browser storage is denied', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'scrapbook:practice-history:v1')
        throw new Error('Storage denied');
      original.call(this, key, value);
    };
  });
  await page.goto('/practice');
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Typing input' })
    .fill(codeExercises[0].text);
  await page.getByText('Recent practice', { exact: true }).click();
  await expect(
    page.getByText('This session only · browser storage unavailable')
  ).toBeVisible();
});

test('mobile concepts reflow and material selection survives reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/practice');
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: 'Concepts', exact: true }).click();
  await expect(page).toHaveURL(/mode=concepts/);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Concepts', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Reveal reference' }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(320);
  await expect(
    page.getByRole('button', { name: 'Recalled', exact: true })
  ).toBeVisible();
});
