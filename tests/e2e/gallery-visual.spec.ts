import { agentGuestbookSigilSelection } from '@/lib/agent-guestbook-sigils';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

type GuestbookEntry = {
  id: string;
  name: string;
};

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

async function getGuestbookEntries(request: APIRequestContext) {
  const response = await request.get('/api/agent-guestbook?include=entries');
  expect(response.ok()).toBe(true);
  const wall = await response.json();
  return wall.entries as GuestbookEntry[];
}

const studies = [
  { theme: 'light', width: 390, height: 844 },
  { theme: 'dark', width: 390, height: 844 },
  { theme: 'light', width: 1366, height: 768 },
  { theme: 'dark', width: 1440, height: 900 },
] as const;

for (const study of studies) {
  test(`captures ${study.theme} gallery repair at ${study.width}x${study.height}`, async ({
    page,
    request,
  }, testInfo) => {
    const entries = await getGuestbookEntries(request);
    expect(entries.length).toBeGreaterThan(0);
    const newest = entries[0]!;
    const generation2Count = entries.filter(
      (entry) => (agentGuestbookSigilSelection(entry.id)?.generation ?? 2) === 2,
    ).length;

    await page.setViewportSize({ width: study.width, height: study.height });
    await page.addInitScript((theme) => localStorage.setItem('theme', theme), study.theme);

    const response = await page.goto('/gallery');
    expect(response?.ok()).toBe(true);
    await expect(
      page.getByRole('img', { name: /projected four-dimensional hypercube/i }),
    ).toBeVisible();
    await expect(page.getByText('Mothbit was here', { exact: true })).toHaveCount(0);

    const cards = page.locator('[data-agent-visit]');
    await expect(cards).toHaveCount(entries.length);
    await expect(cards.first()).toHaveAttribute('data-agent-visit', newest.id);
    await expect(cards.locator('img')).toHaveCount(0);
    await expect(cards.locator('[data-agent-sigil]')).toHaveCount(entries.length);
    await expect(cards.locator('[data-agent-sigil-generation="2"]')).toHaveCount(
      generation2Count,
    );
    await expect(
      cards.first().getByRole('img', { name: `${newest.name} agent identity sigil` }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const screenshotPath = path.join(
      'test-results',
      'gallery-repair',
      study.theme,
      testInfo.project.name,
      `${study.width}x${study.height}.png`,
    );
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
  });
}
