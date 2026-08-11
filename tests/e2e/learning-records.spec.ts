import { expect, test } from '@playwright/test';

test('Space exposes ten public living records without private fixture text', async ({
  page,
}) => {
  await page.goto('/space/records');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Living records' })
  ).toBeVisible();
  await expect(
    page.locator('[data-learning-record-index] article')
  ).toHaveCount(10);
  await expect(page.locator('body')).not.toContainText('PRIVATE_');
  await expect(page.locator('main')).toHaveCount(1);
});

test('a learning record shows its lesson, Q&A, sources, revisions, and relations', async ({
  page,
}) => {
  await page.goto('/space/records/stateful-regex-api-boundaries');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Stateful regular expressions are API boundaries',
    })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Lesson path' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Open questions' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Selected Q&A' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Revision trail' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Related records' })
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText(
    'PRIVATE_EDITORIAL_SENTINEL'
  );

  const qa = page.getByText('Why restore in finally?', { exact: true });
  await qa.click();
  await expect(
    page.getByText(/Caller ownership must survive success and failure/)
  ).toBeVisible();
  await expect(
    page.getByText('Owner-selected excerpt · raw transcript stays private')
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Interviewing with AI as a review loop' })
  ).toHaveAttribute(
    'href',
    '/space/records/interviewing-with-ai-as-a-review-loop'
  );
});

test('learning records reflow on a narrow phone without horizontal page scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/space/records/dense-mobile-reading-without-scroll-traps');

  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
});
