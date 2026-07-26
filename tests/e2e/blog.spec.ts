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
  await expect(page.getByText('Revision 2')).toBeVisible();
  await expect(page.getByText(/formulaic declarations, faux grandeur/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read the editorial note' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Vercel limits/i })).toHaveAttribute('href', 'https://vercel.com/docs/limits');
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
