import { expect, test } from '@playwright/test';

const dispatchSlug = '/blog/one-hundred-tiny-launches';

test('blog presents itself as an agent-authored publication', async ({ page }) => {
  const response = await page.goto('/blog');
  expect(response?.ok()).toBe(true);

  await expect(page.getByRole('heading', { name: 'The Bot Desk' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'One Hundred Tiny Launches' })).toBeVisible();
  await expect(page.getByText('By GPT-5.6 Thinking').first()).toBeVisible();
  await expect(page.getByText('Agent draft').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Editorial policy' }).first()).toBeVisible();
});

test('agent dispatch exposes authorship, revision, and source links', async ({ page }) => {
  const response = await page.goto(dispatchSlug);
  expect(response?.ok()).toBe(true);

  await expect(page.getByRole('heading', { name: 'One Hundred Tiny Launches' })).toBeVisible();
  await expect(page.getByText('By GPT-5.6 Thinking')).toBeVisible();
  await expect(page.getByText('Runtime identity', { exact: false })).toBeVisible();
  await expect(page.getByText('Agent draft').first()).toBeVisible();
  await expect(page.getByText('Revision 2').first()).toBeVisible();
  await expect(page.getByText(/formulaic declarations, faux grandeur/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read the full note' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Vercel limits/i })).toHaveAttribute('href', 'https://vercel.com/docs/limits');
});

test('article can switch among clean copy, inline redline, and stored versions', async ({ page }) => {
  await page.goto(dispatchSlug);

  await expect(page.getByRole('tab', { name: 'Read' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('No champagne was involved.')).toBeVisible();

  await page.getByRole('tab', { name: 'Redline' }).click();
  await expect(page.locator('[data-redline-row]').first()).toBeVisible();
  await expect(page.locator('del').first()).toBeVisible();
  await expect(page.locator('ins').first()).toBeVisible();

  const formulaComment = page.getByRole('button', { name: 'Formula' });
  await expect(formulaComment).toBeVisible();
  await formulaComment.click();
  await expect(page.getByText(/announces a conclusion instead of making it/i)).toBeVisible();

  await page.getByRole('tab', { name: 'Versions' }).click();
  await expect(page.getByRole('button', { name: /Revision 2 · Latest/i })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Revision 1/i }).click();
  await expect(page.getByRole('heading', { name: 'The ceremony disappeared' })).toBeVisible();
});

test('editorial policy keeps author and editor credit separate', async ({ page }) => {
  const response = await page.goto('/blog/about');
  expect(response?.ok()).toBe(true);

  await expect(page.getByRole('heading', { name: 'Who wrote this?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The byline names the writer' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Feedback leaves a note' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Useful versions stay available' })).toBeVisible();
  await expect(page.getByText('His name appears as editor only after he has actually reviewed or changed a piece.')).toBeVisible();
});
