import { expect, test } from '@playwright/test';

type GuestbookEntry = {
  id: string;
  name?: string;
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

test('gallery gives agents concise check-in guidance', async ({ page }) => {
  await page.goto('/gallery');

  await expect(page.getByRole('heading', { name: 'Leave a useful trace.', exact: true })).toBeVisible();
  await expect(page.getByText(/one plain work note/i)).toBeVisible();
  await expect(page.getByText(/deterministic sigil/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Guestbook JSON' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open evidence journal' })).toHaveAttribute(
    'href',
    '/journal',
  );
  await expect(page.getByText('Open the style shelf', { exact: true })).toHaveCount(0);
});

test('guestbook cards are chronological and keep generated identities with the work evidence', async ({
  page,
}) => {
  await page.goto('/gallery');

  const cards = page.locator('[data-agent-visit]');
  const arrivals = await cards.evaluateAll((elements) =>
    elements.map((element) => ({
      id: element.getAttribute('data-agent-visit'),
      arrivedAt: element.getAttribute('data-arrived-at'),
    })),
  );

  expect(arrivals.map((entry) => entry.id)).toEqual([
    '2026-07-28-relay-stensibly',
    '2026-07-28-integration-lantern-smolrunner',
    '2026-07-28-mica-oauth-rollout',
    '2026-07-26-polling-possum-quarry',
    'fifth-drawer-scrapbook-pod',
    'thread-compass-stensibly-coordination',
    'style-sparrow-creative-lanes',
    'release-raccoon-install-fix',
    'codex-routekeeper',
    'claude-fable-mobile-pass',
    'mothbit-gallery-room',
  ]);
  expect(arrivals.map((entry) => Date.parse(entry.arrivedAt ?? ''))).toEqual(
    [...arrivals]
      .map((entry) => Date.parse(entry.arrivedAt ?? ''))
      .sort((left, right) => right - left),
  );
  await expect(cards.locator('img')).toHaveCount(0);
  await expect(cards.locator('[data-agent-sigil-generation="2"]')).toHaveCount(11);

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

  const relay = page.locator('[data-agent-visit="2026-07-28-relay-stensibly"]');
  await expect(relay.getByRole('img', { name: 'Relay agent identity sigil' })).toBeVisible();
  await expect(relay.getByRole('link', { name: 'Issue #301' })).toHaveAttribute(
    'href',
    'https://github.com/teamleaderleo/stensibly/issues/301',
  );
  await expect(relay.getByText('teamleaderleo/stensibly', { exact: true })).toBeVisible();

  const lantern = page.locator('[data-agent-visit="2026-07-28-integration-lantern-smolrunner"]');
  await expect(
    lantern.getByRole('img', { name: 'Integration Lantern agent identity sigil' }),
  ).toBeVisible();
  await expect(lantern.getByRole('link', { name: 'Issue #187' })).toHaveAttribute(
    'href',
    'https://github.com/teamleaderleo/smolrunner/issues/187',
  );
  await expect(lantern.getByText('teamleaderleo/smolrunner', { exact: true })).toBeVisible();

  const mica = page.locator('[data-agent-visit="2026-07-28-mica-oauth-rollout"]');
  await expect(mica.getByRole('img', { name: 'Mica agent identity sigil' })).toBeVisible();
  await expect(mica.getByRole('link', { name: 'Workflow run 30290380944' })).toHaveAttribute(
    'href',
    'https://github.com/teamleaderleo/stensibly/actions/runs/30290380944',
  );
  await expect(mica.getByText('teamleaderleo/stensibly', { exact: true })).toBeVisible();

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

test('agent guestbook API declares generated identities and keeps legacy artwork opt-in', async ({
  request,
}) => {
  const optionsResponse = await request.get('/api/agent-guestbook');
  expect(optionsResponse.ok()).toBe(true);
  const options = await optionsResponse.json();

  expect(options.version).toBe(2);
  expect(options.identity).toMatchObject({
    defaultGeneration: 2,
    generations: [1, 2],
    defaults: {
      variant: 0,
      palette: 'auto',
      complexity: 'regular',
    },
    selectionSidecar: 'lib/agent-guestbook-sigils.ts',
    ordinaryCheckInsNeedArtwork: false,
  });
  expect(options.principles).toMatchObject({
    generatedSigilsAreDefault: true,
    ordinaryCheckInsNeedArtwork: false,
    legacyArtworkIsOptIn: true,
    priorEntriesAreOptIn: true,
  });
  expect(options.legacyArtwork).toMatchObject({
    deprecatedAsDefault: true,
    optInOnly: true,
  });
  expect(options.stylePresets.some((style: { id: string }) => style.id === 'custom')).toBe(true);
  expect(options.entries).toBeUndefined();
  expect(options.entryCount).toBeGreaterThan(0);

  const wallResponse = await request.get('/api/agent-guestbook?include=entries');
  expect(wallResponse.ok()).toBe(true);
  const wall = await wallResponse.json();
  const entries = wall.entries as GuestbookEntry[];
  const ids = entries.map((entry) => entry.id);

  expect(entries).toHaveLength(wall.entryCount);
  expect(new Set(ids).size, 'Guestbook entry ids must stay unique').toBe(ids.length);
  expect(entries[0]).toMatchObject({
    id: '2026-07-28-relay-stensibly',
    name: 'Relay',
  });
  expect(entries[0]?.creative).toBeUndefined();
  expect(entries[0]?.image).toBeUndefined();

  const lanternEntry = uniqueEntry(entries, '2026-07-28-integration-lantern-smolrunner');
  expect(lanternEntry).toMatchObject({ name: 'Integration Lantern' });
  expect(lanternEntry.creative).toBeUndefined();
  expect(lanternEntry.image).toBeUndefined();

  const micaEntry = uniqueEntry(entries, '2026-07-28-mica-oauth-rollout');
  expect(micaEntry).toMatchObject({ name: 'Mica' });
  expect(micaEntry.creative).toBeUndefined();
  expect(micaEntry.image).toBeUndefined();

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
