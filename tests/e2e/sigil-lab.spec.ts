import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

const variants = [
  { theme: 'light' as const, width: 390, height: 844 },
  { theme: 'dark' as const, width: 390, height: 844 },
  { theme: 'light' as const, width: 1366, height: 768 },
  { theme: 'dark' as const, width: 1366, height: 768 },
];

for (const variant of variants) {
  test(`sigil lab exposes layered generations in ${variant.theme} at ${variant.width}x${variant.height}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: variant.theme });
    await page.setViewportSize({ width: variant.width, height: variant.height });

    const response = await page.goto('/sigil-lab');
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { name: 'Generative sigils for agents' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Kumiko-informed construction graphs' }),
    ).toBeVisible();

    const cards = page.locator('[data-sigil-card]');
    await expect(cards).toHaveCount(18);
    const fingerprints = await cards.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-sigil-fingerprint')),
    );
    expect(fingerprints.every(Boolean)).toBe(true);
    expect(new Set(fingerprints).size).toBe(fingerprints.length);

    const palettes = page.locator('[data-generation-3-palette]');
    await expect(palettes).toHaveCount(20);
    const paletteMetadata = await palettes.evaluateAll((elements) =>
      elements.map((element) => ({
        family: element.getAttribute('data-generation-3-palette-family'),
        mode: element.getAttribute('data-generation-3-palette-mode'),
      })),
    );
    expect(new Set(paletteMetadata.map((palette) => palette.family)).size).toBe(10);
    for (const family of new Set(paletteMetadata.map((palette) => palette.family))) {
      expect(paletteMetadata.filter((palette) => palette.family === family)).toHaveLength(2);
    }
    expect(new Set(paletteMetadata.map((palette) => palette.mode))).toEqual(
      new Set(['monotone', 'duotone', 'tri-colour', 'material', 'luminous']),
    );
    await expect(page.locator('[data-generation-3-palette-surface]')).toHaveCount(60);
    await expect(page.locator('[data-generation-3-palette-role]')).toHaveCount(240);

    const rerolls = page.locator('[data-sigil-reroll]');
    await expect(rerolls).toHaveCount(8);
    const rerollFingerprints = await rerolls.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-sigil-fingerprint')),
    );
    expect(new Set(rerollFingerprints).size).toBe(rerollFingerprints.length);

    await expect(page.locator('[data-sigil-layer-example]')).toHaveCount(3);
    await expect(page.locator('[data-sigil-generation-example]')).toHaveCount(2);
    await expect(page.locator('[data-agent-sigil]')).toHaveCount(44);
    await expect(page.locator('[data-agent-kumiko]')).toHaveCount(41);
    await expectNoHorizontalOverflow(page);

    await page.screenshot({
      path: testInfo.outputPath(
        `sigil-lab-${variant.theme}-${variant.width}x${variant.height}.png`,
      ),
      fullPage: true,
    });
  });
}

test('repository, designation, and description seeds stay isolated', async ({ page }) => {
  await page.goto('/sigil-lab');

  const examples = page.locator('[data-sigil-layer-example] [data-agent-sigil]');
  await expect(examples).toHaveCount(3);
  const layers = await examples.evaluateAll((elements) =>
    elements.map((element) => ({
      frame: element.getAttribute('data-agent-sigil-frame'),
      glyph: element.getAttribute('data-agent-sigil-glyph'),
      accents: element.getAttribute('data-agent-sigil-accents'),
    })),
  );

  expect(layers[1]?.frame).not.toBe(layers[0]?.frame);
  expect(layers[1]?.glyph).toBe(layers[0]?.glyph);
  expect(layers[1]?.accents).toBe(layers[0]?.accents);
  expect(layers[2]?.frame).toBe(layers[0]?.frame);
  expect(layers[2]?.glyph).toBe(layers[0]?.glyph);
  expect(layers[2]?.accents).not.toBe(layers[0]?.accents);
});

test('Kumiko population stays graph-distinct and occupancy-separated', async ({ page }) => {
  await page.goto('/sigil-lab');

  const contactSheet = page.locator('[data-kumiko-contact-sheet]');
  await expect(contactSheet).toBeVisible();
  const minimumDistance = Number(
    await contactSheet.getAttribute('data-kumiko-minimum-distance'),
  );
  expect(minimumDistance).toBeGreaterThanOrEqual(8);

  const cards = page.locator('[data-kumiko-contact-card]');
  await expect(cards).toHaveCount(18);
  const descriptors = await cards.evaluateAll((elements) =>
    elements.map((element) => ({
      family: element.getAttribute('data-kumiko-family'),
      graph: element.getAttribute('data-kumiko-graph'),
      occupancy: element.getAttribute('data-kumiko-occupancy'),
    })),
  );

  expect(descriptors.every((descriptor) => descriptor.graph && descriptor.occupancy)).toBe(true);
  expect(new Set(descriptors.map((descriptor) => descriptor.graph)).size).toBe(
    descriptors.length,
  );
  expect(new Set(descriptors.map((descriptor) => descriptor.occupancy)).size).toBe(
    descriptors.length,
  );
  expect(new Set(descriptors.map((descriptor) => descriptor.family)).size).toBe(8);

  const familyCards = page.locator('[data-kumiko-family-card]');
  await expect(familyCards).toHaveCount(8);
  const families = await familyCards.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-kumiko-family')),
  );
  expect(new Set(families).size).toBe(8);
});

test('Kumiko description edits change accents without changing the graph', async ({ page }) => {
  await page.goto('/sigil-lab');

  const examples = page.locator('[data-kumiko-layer-example] [data-agent-kumiko]');
  await expect(examples).toHaveCount(3);
  const layers = await examples.evaluateAll((elements) =>
    elements.map((element) => ({
      graph: element.getAttribute('data-agent-kumiko-graph'),
      occupancy: element.getAttribute('data-agent-kumiko-occupancy'),
      lattice: element.getAttribute('data-agent-kumiko-lattice'),
      infill: element.getAttribute('data-agent-kumiko-infill'),
      accents: element.getAttribute('data-agent-kumiko-accents'),
      palette: element.getAttribute('data-agent-kumiko-palette'),
    })),
  );

  expect(new Set(layers.map((layer) => layer.graph)).size).toBe(1);
  expect(new Set(layers.map((layer) => layer.occupancy)).size).toBe(1);
  expect(new Set(layers.map((layer) => layer.lattice)).size).toBe(1);
  expect(new Set(layers.map((layer) => layer.infill)).size).toBe(1);
  expect(new Set(layers.map((layer) => layer.palette)).size).toBe(1);
  expect(new Set(layers.map((layer) => layer.accents)).size).toBe(3);

  await expect(page.locator('[data-kumiko-debug-node]')).not.toHaveCount(0);
});

test('small layered and lattice sigils remain measurable and accessible', async ({ page }) => {
  await page.goto('/sigil-lab');

  const layered = page.locator('[data-sigil-small-sizes] [data-agent-sigil]');
  await expect(layered).toHaveCount(4);
  const layeredSizes = await layered.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height, label: element.getAttribute('aria-label') };
    }),
  );

  expect(layeredSizes.map((size) => Math.round(size.width))).toEqual([24, 32, 48, 72]);
  expect(layeredSizes.every((size) => size.width === size.height)).toBe(true);
  expect(layeredSizes.every((size) => size.label?.includes('agent identity sigil'))).toBe(true);

  const kumiko = page.locator('[data-kumiko-small-sizes] [data-agent-kumiko]');
  await expect(kumiko).toHaveCount(5);
  const kumikoSizes = await kumiko.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height, label: element.getAttribute('aria-label') };
    }),
  );

  expect(kumikoSizes.map((size) => Math.round(size.width))).toEqual([16, 24, 32, 48, 72]);
  expect(kumikoSizes.every((size) => size.width === size.height)).toBe(true);
  expect(kumikoSizes.every((size) => size.label?.includes('Kumiko-informed'))).toBe(true);
});
