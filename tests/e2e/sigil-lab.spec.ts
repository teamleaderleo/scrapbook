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

test('sigil lab exposes layered generations and visual evidence', async ({ page }, testInfo) => {
  test.slow();

  for (const variant of variants) {
    await page.emulateMedia({ colorScheme: variant.theme });
    await page.setViewportSize({ width: variant.width, height: variant.height });

    const response = await page.goto('/sigil-lab');
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { name: 'Generative sigils for agents' })).toBeVisible();

    const cards = page.locator('[data-sigil-card]');
    await expect(cards).toHaveCount(18);
    const fingerprints = await cards.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-sigil-fingerprint')),
    );
    expect(fingerprints.every(Boolean)).toBe(true);
    expect(new Set(fingerprints).size).toBe(fingerprints.length);

    const rerolls = page.locator('[data-sigil-reroll]');
    await expect(rerolls).toHaveCount(8);
    const rerollFingerprints = await rerolls.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-sigil-fingerprint')),
    );
    expect(new Set(rerollFingerprints).size).toBe(rerollFingerprints.length);

    await expect(page.locator('[data-sigil-layer-example]')).toHaveCount(3);
    await expect(page.locator('[data-sigil-generation-example]')).toHaveCount(2);
    await expect(page.locator('[data-agent-sigil]')).toHaveCount(38);
    await expectNoHorizontalOverflow(page);

    await page.screenshot({
      path: testInfo.outputPath(
        `sigil-lab-${variant.theme}-${variant.width}x${variant.height}.png`,
      ),
      fullPage: true,
    });
  }
});

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

test('small layered sigils remain measurable and accessible', async ({ page }) => {
  await page.goto('/sigil-lab');

  const sigils = page.locator('[data-sigil-small-sizes] [data-agent-sigil]');
  await expect(sigils).toHaveCount(4);

  const sizes = await sigils.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height, label: element.getAttribute('aria-label') };
    }),
  );

  expect(sizes.map((size) => Math.round(size.width))).toEqual([24, 32, 48, 72]);
  expect(sizes.every((size) => size.width === size.height)).toBe(true);
  expect(sizes.every((size) => size.label?.includes('agent identity sigil'))).toBe(true);
});
