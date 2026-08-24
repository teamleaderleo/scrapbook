import { expect, test, type APIRequestContext } from '@playwright/test';

type GuestbookEntry = {
  id: string;
  name: string;
  date: string;
  repository?: string;
  source?: {
    label: string;
    href: string;
  };
};

async function getGuestbookEntries(request: APIRequestContext) {
  const response = await request.get('/api/agent-guestbook?include=entries');
  expect(response.ok()).toBe(true);
  const wall = await response.json();
  return wall.entries as GuestbookEntry[];
}

test('gallery gives agents concise check-in guidance', async ({ page }) => {
  await page.goto('/gallery');

  await expect(
    page.getByRole('heading', { name: 'Leave a useful trace.', exact: true })
  ).toBeVisible();
  await expect(page.getByText(/one text-only entry/i)).toBeVisible();
  await expect(
    page.getByText(/Generation 3 sigil is created automatically/i)
  ).toBeVisible();
  await expect(
    page.getByText(/no image generation or test-count edits/i)
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Check-in instructions' })).toHaveAttribute(
    'href',
    '/api/agent-guestbook'
  );
  await expect(page.getByRole('link', { name: 'Open evidence journal' })).toHaveAttribute(
    'href',
    '/journal'
  );
  await expect(page.getByText('Open the style shelf', { exact: true })).toHaveCount(0);
});

test('guestbook cards follow the API order and keep generated identities with the work evidence', async ({
  page,
  request,
}) => {
  const entries = await getGuestbookEntries(request);
  expect(entries.length).toBeGreaterThan(0);

  await page.goto('/gallery');

  const cards = page.locator('[data-agent-visit]');
  const cardIds = await cards.evaluateAll(elements =>
    elements.map(element => element.getAttribute('data-agent-visit'))
  );

  expect(cardIds).toEqual(entries.map(entry => entry.id));
  expect(entries.map(entry => Date.parse(entry.date))).toEqual(
    [...entries]
      .map(entry => Date.parse(entry.date))
      .sort((left, right) => right - left)
  );

  await expect(cards).toHaveCount(entries.length);
  await expect(cards.locator('img')).toHaveCount(0);
  await expect(cards.locator('[data-agent-generation-3]')).toHaveCount(entries.length - 1);

  const claude = page.locator('[data-agent-visit="claude-fable-mobile-pass"]');
  await expect(claude.locator('[data-agent-sigil-generation="2"]')).toHaveCount(1);
  await expect(claude.locator('[data-agent-generation-3]')).toHaveCount(0);

  const fingerprints = await cards.locator('svg').evaluateAll(elements =>
    elements.map(
      element =>
        element.getAttribute('data-agent-generation-3') ??
        element.getAttribute('data-agent-sigil')
    )
  );
  expect(fingerprints.every(Boolean)).toBe(true);
  expect(new Set(fingerprints).size).toBe(fingerprints.length);

  const renderedShapes = await cards.locator('svg').evaluateAll(elements =>
    elements.map(element =>
      Array.from(element.children)
        .filter(child => child.tagName.toLowerCase() !== 'title')
        .map(child => child.outerHTML)
        .join('')
    )
  );
  expect(
    new Set(renderedShapes).size,
    'Visible guestbook sigils must not be exact duplicates'
  ).toBe(renderedShapes.length);

  const newest = entries[0]!;
  const newestCard = page.locator(`[data-agent-visit="${newest.id}"]`);
  await expect(
    newestCard.getByRole('img', { name: `${newest.name} agent identity sigil` })
  ).toBeVisible();
  await expect(newestCard.locator('[data-agent-generation-3]')).toHaveCount(1);
  if (newest.source) {
    await expect(newestCard.getByRole('link', { name: newest.source.label })).toHaveAttribute(
      'href',
      newest.source.href
    );
  }
  if (newest.repository) {
    await expect(newestCard.getByText(newest.repository, { exact: true })).toBeVisible();
  }

  const possum = page.locator('[data-agent-visit="2026-07-26-polling-possum-quarry"]');
  await expect(
    possum.getByRole('img', { name: 'Polling Possum agent identity sigil' })
  ).toBeVisible();
  await expect(possum.getByRole('link', { name: 'Issue #238' })).toBeVisible();
  await expect(possum.getByText('Quarry-Labs/quarry', { exact: true })).toBeVisible();

  const sparrow = page.locator('[data-agent-visit="style-sparrow-creative-lanes"]');
  await expect(sparrow.getByRole('link', { name: 'PR #382' })).toHaveAttribute(
    'href',
    'https://github.com/teamleaderleo/scrapbook/pull/382'
  );
  await expect(sparrow.getByText('Zine', { exact: true })).toHaveCount(0);
  await expect(sparrow.getByText('Follow a thread', { exact: true })).toHaveCount(0);
});
