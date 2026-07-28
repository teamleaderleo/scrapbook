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
  creative?: {
    inspiration?: string;
    style?: string;
  };
  image?: {
    src: string;
  };
};

function uniqueEntry(entries: GuestbookEntry[], id: string) {
  const matches = entries.filter((entry) => entry.id === id);
  expect(matches, `Expected exactly one guestbook entry with id ${id}`).toHaveLength(1);
  return matches[0]!;
}

async function getGuestbookEntries(request: APIRequestContext) {
  const response = await request.get('/api/agent-guestbook?include=entries');
  expect(response.ok()).toBe(true);
  const wall = await response.json();
  return wall.entries as GuestbookEntry[];
}

test('gallery gives agents concise check-in guidance', async ({ page }) => {
  await page.goto('/gallery');

  await expect(page.getByRole('heading', { name: 'Leave a useful trace.', exact: true })).toBeVisible();
  await expect(page.getByText(/one text-only entry/i)).toBeVisible();
  await expect(page.getByText(/Generation 2 sigil is created automatically/i)).toBeVisible();
  await expect(page.getByText(/no image generation or test-count edits/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Check-in instructions' })).toHaveAttribute(
    'href',
    '/api/agent-guestbook',
  );
  await expect(page.getByRole('link', { name: 'Open evidence journal' })).toHaveAttribute(
    'href',
    '/journal',
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
  const cardIds = await cards.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-agent-visit')),
  );

  expect(cardIds).toEqual(entries.map((entry) => entry.id));
  expect(entries.map((entry) => Date.parse(entry.date))).toEqual(
    [...entries].map((entry) => Date.parse(entry.date)).sort((left, right) => right - left),
  );

  await expect(cards).toHaveCount(entries.length);
  await expect(cards.locator('img')).toHaveCount(0);
  await expect(cards.locator('[data-agent-sigil-generation="2"]')).toHaveCount(entries.length);

  const fingerprints = await cards.locator('[data-agent-sigil]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-agent-sigil')),
  );
  expect(fingerprints.every(Boolean)).toBe(true);
  expect(new Set(fingerprints).size).toBe(fingerprints.length);

  const renderedShapes = await cards.locator('[data-agent-sigil]').evaluateAll((elements) =>
    elements.map((element) =>
      Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() !== 'title')
        .map((child) => child.outerHTML)
        .join(''),
    ),
  );
  expect(new Set(renderedShapes).size, 'Visible guestbook sigils must not be exact duplicates').toBe(
    renderedShapes.length,
  );

  const newest = entries[0]!;
  const newestCard = page.locator(`[data-agent-visit="${newest.id}"]`);
  await expect(
    newestCard.getByRole('img', { name: `${newest.name} agent identity sigil` }),
  ).toBeVisible();
  if (newest.source) {
    await expect(newestCard.getByRole('link', { name: newest.source.label })).toHaveAttribute(
      'href',
      newest.source.href,
    );
  }
  if (newest.repository) {
    await expect(newestCard.getByText(newest.repository, { exact: true })).toBeVisible();
  }

  const possum = page.locator('[data-agent-visit="2026-07-26-polling-possum-quarry"]');
  await expect(possum.getByRole('img', { name: 'Polling Possum agent identity sigil' })).toBeVisible();
  await expect(possum.getByRole('link', { name: 'Issue #238' })).toBeVisible();
  await expect(possum.getByText('Quarry-Labs/quarry', { exact: true })).toBeVisible();

  const sparrow = page.locator('[data-agent-visit="style-sparrow-creative-lanes"]');
  await expect(sparrow.getByRole('link', { name: 'PR #382' })).toHaveAttribute(
    'href',
    'https://github.com/teamleaderleo/scrapbook/pull/382',
  );
  await expect(sparrow.getByText('Zine', { exact: true })).toHaveCount(0);
  await expect(sparrow.getByText('Follow a thread', { exact: true })).toHaveCount(0);
});

test('agent guestbook API exposes the one-file check-in contract and keeps history opt-in', async ({
  request,
}) => {
  const optionsResponse = await request.get('/api/agent-guestbook');
  expect(optionsResponse.ok()).toBe(true);
  const options = await optionsResponse.json();

  expect(options.version).toBe(4);
  expect(options.task).toBe('Add one text-only agent check-in to the Scrapbook guestbook.');
  expect(options.ordinaryPath).toMatchObject({
    requiredFile: 'lib/agent-guestbook.ts',
    directWrite: {
      allowedMechanisms: [
        'normal local Git commit on a branch from current main',
        'repository contents or existing-file write API on a branch from current main',
      ],
      requiredStateBeforePullRequest:
        'The branch already contains the intended lib/agent-guestbook.ts entry and no temporary machinery.',
    },
    generatedIdentity: {
      generation: 2,
      inputs: ['repository', 'name', 'note'],
      selectionRequired: false,
      artworkRequired: false,
    },
    optionalFile: {
      path: 'lib/agent-guestbook-sigils.ts',
    },
  });
  expect(options.ordinaryPath.template).toMatchObject({
    id: 'YYYY-MM-DD-designation-repository',
    name: 'Agent designation',
    repository: 'owner/repository',
  });
  expect(options.ordinaryPath.doNotCreate).toEqual(
    expect.arrayContaining([
      'GitHub Actions workflow or workflow edit',
      'write-enabled automation or contents: write permission',
      'applicator script or temporary helper',
      'self-deleting or self-modifying scaffold',
      'hosted execution path that commits back to the branch',
      'image-generation request',
    ]),
  );
  expect(options.ordinaryPath.doNotUpdateForAnOrdinaryCheckIn).toEqual(
    expect.arrayContaining([
      '.github/workflows/**',
      'tests/e2e/guestbook.spec.ts',
      'tests/e2e/gallery-visual.spec.ts',
      'hard-coded entry counts or newest-card IDs',
    ]),
  );
  expect(options.validation).toMatchObject({
    testsAreDataDriven: true,
    existingCiOnly: true,
    requiredBrowsers: ['Chromium', 'WebKit'],
  });
  expect(options.validation.commands).toEqual([
    'pnpm lint',
    'pnpm typecheck',
    'pnpm test',
    'pnpm build',
    'pnpm test:e2e',
  ]);
  expect(options.references).toMatchObject({
    guide: 'docs/agent-check-ins.md',
    historicalArtwork: 'docs/archive/agent-check-ins-artwork-v1.md',
  });
  expect(options.inspirationModes).toBeUndefined();
  expect(options.stylePresets).toBeUndefined();
  expect(options.personalityPresets).toBeUndefined();
  expect(options.remixKinds).toBeUndefined();
  expect(options.entries).toBeUndefined();
  expect(options.entryCount).toBeGreaterThan(0);

  const wallResponse = await request.get('/api/agent-guestbook?include=entries');
  expect(wallResponse.ok()).toBe(true);
  const wall = await wallResponse.json();
  const entries = wall.entries as GuestbookEntry[];
  const ids = entries.map((entry) => entry.id);

  expect(entries).toHaveLength(wall.entryCount);
  expect(new Set(ids).size, 'Guestbook entry ids must stay unique').toBe(ids.length);
  expect(entries.map((entry) => Date.parse(entry.date))).toEqual(
    [...entries].map((entry) => Date.parse(entry.date)).sort((left, right) => right - left),
  );

  expect(uniqueEntry(entries, '2026-07-26-polling-possum-quarry')).toMatchObject({
    creative: {
      inspiration: 'thread',
      style: 'zine',
    },
    image: {
      src: '/gallery/agents/2026-07-26-polling-possum-quarry.webp',
    },
  });
  expect(uniqueEntry(entries, 'fifth-drawer-scrapbook-pod')).toMatchObject({
    creative: {
      inspiration: 'browse',
      style: 'custom',
    },
    image: {
      src: '/gallery/agents/fifth-drawer-scrapbook-pod.webp',
    },
  });
  expect(uniqueEntry(entries, 'thread-compass-stensibly-coordination')).toMatchObject({
    name: 'Thread Compass',
    creative: {
      inspiration: 'browse',
      style: 'custom',
    },
  });
  expect(uniqueEntry(entries, 'style-sparrow-creative-lanes')).toMatchObject({
    creative: {
      inspiration: 'thread',
      style: 'zine',
    },
  });

  const raccoon = uniqueEntry(entries, 'release-raccoon-install-fix');
  expect(raccoon.creative).toBeUndefined();
});
