import { expect, test, type Page, type Response } from '@playwright/test';

const route = '/tactile-lab';
const marker = 'TACTILE_SIMULATION_CLIENT_v1';

async function openLab(page: Page) {
  const response = await page.goto(route);
  expect(response?.ok()).toBe(true);
  const lab = page.locator('[data-tactile-lab]');
  await expect(lab).toHaveAttribute('data-sim-ready', 'true');
  await expect(page.locator('[data-tactile-canvas]')).toBeVisible();
  return lab;
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

async function numericDataset(page: Page, name: string) {
  const value = await page.locator('[data-tactile-lab]').getAttribute(name);
  return Number(value);
}

test('keeps the simulation client out of the ordinary homepage bundle', async ({ page }) => {
  const scriptBodies: Promise<string>[] = [];
  const collect = (response: Response) => {
    const contentType = response.headers()['content-type'] ?? '';
    if (response.url().includes('/_next/static/') && contentType.includes('javascript')) {
      scriptBodies.push(response.text().catch(() => ''));
    }
  };
  page.on('response', collect);

  const homeResponse = await page.goto('/');
  expect(homeResponse?.ok()).toBe(true);
  await page.waitForLoadState('networkidle');
  expect((await Promise.all(scriptBodies)).join('\n')).not.toContain(marker);

  scriptBodies.length = 0;
  await openLab(page);
  await page.waitForLoadState('networkidle');
  expect((await Promise.all(scriptBodies)).join('\n')).toContain(marker);
});

test('drags a rigid block with pointer capture', async ({ page }) => {
  const lab = await openLab(page);
  await page.locator('[data-tactile-pause]').click();
  await expect(lab).toHaveAttribute('data-running', 'false');
  await page.locator('[data-tactile-selection]').selectOption('block-a');
  await expect(lab).toHaveAttribute('data-selected', 'block-a');

  const canvas = page.locator('[data-tactile-canvas]');
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  const beforeX = await numericDataset(page, 'data-selected-x');
  const beforeY = await numericDataset(page, 'data-selected-y');
  const startX = box!.x + (beforeX / 720) * box!.width;
  const startY = box!.y + (beforeY / 420) * box!.height;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + Math.min(90, box!.width * 0.12), startY + 8, { steps: 5 });
  await page.mouse.up();

  await expect.poll(() => numericDataset(page, 'data-selected-x')).toBeGreaterThan(beforeX + 35);
});

test('supports keyboard selection, nudging, reset, agitation, pause, and single-step', async ({
  page,
}) => {
  const lab = await openLab(page);
  const canvas = page.locator('[data-tactile-canvas]');
  await canvas.focus();
  await page.keyboard.press('Space');
  await expect(lab).toHaveAttribute('data-running', 'false');

  await page.keyboard.press('2');
  await expect(lab).toHaveAttribute('data-selected', 'block-a');
  const beforeX = await numericDataset(page, 'data-selected-x');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => numericDataset(page, 'data-selected-x')).toBeGreaterThan(beforeX + 6);

  const beforeFrame = await numericDataset(page, 'data-frame');
  await page.keyboard.press('.');
  await expect.poll(() => numericDataset(page, 'data-frame')).toBe(beforeFrame + 1);
  await page.keyboard.press('a');
  await page.keyboard.press('r');
  await expect(lab).toHaveAttribute('data-selected', 'gel');
  await expect(lab).toHaveAttribute('data-frame', '0');
});

test('pauses for controls and hidden tabs without replaying the hidden delta', async ({ page }) => {
  const lab = await openLab(page);
  await expect(lab).toHaveAttribute('data-running', 'true');
  const initialFrame = await numericDataset(page, 'data-frame');
  await expect.poll(() => numericDataset(page, 'data-frame')).toBeGreaterThan(initialFrame);

  await page.locator('[data-tactile-pause]').click();
  await expect(lab).toHaveAttribute('data-running', 'false');
  const pausedFrame = await numericDataset(page, 'data-frame');
  await page.waitForTimeout(180);
  expect(await numericDataset(page, 'data-frame')).toBe(pausedFrame);

  await page.locator('[data-tactile-pause]').click();
  await expect(lab).toHaveAttribute('data-running', 'true');
  await page.evaluate(() => {
    const testWindow = window as typeof window & { __tactileVisibility?: DocumentVisibilityState };
    testWindow.__tactileVisibility = 'hidden';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => testWindow.__tactileVisibility ?? 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(lab).toHaveAttribute('data-hidden-paused', 'true');
  const hiddenFrame = await numericDataset(page, 'data-frame');
  await page.waitForTimeout(180);
  expect(await numericDataset(page, 'data-frame')).toBe(hiddenFrame);

  await page.evaluate(() => {
    const testWindow = window as typeof window & { __tactileVisibility?: DocumentVisibilityState };
    testWindow.__tactileVisibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(lab).toHaveAttribute('data-hidden-paused', 'false');
  await expect.poll(() => numericDataset(page, 'data-frame')).toBeGreaterThan(hiddenFrame);
  expect(await numericDataset(page, 'data-last-steps')).toBeLessThanOrEqual(5);
});

test('defaults reduced motion and low-power modes to paused single-step operation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const lab = await openLab(page);
  await expect(lab).toHaveAttribute('data-reduced-motion', 'true');
  await expect(lab).toHaveAttribute('data-running', 'false');
  const beforeFrame = await numericDataset(page, 'data-frame');
  await page.waitForTimeout(140);
  expect(await numericDataset(page, 'data-frame')).toBe(beforeFrame);
  await page.locator('[data-tactile-step]').click();
  await expect.poll(() => numericDataset(page, 'data-frame')).toBe(beforeFrame + 1);

  await page.locator('[data-tactile-low-power]').click();
  await expect(lab).toHaveAttribute('data-low-power', 'true');
  await expect(lab).toHaveAttribute('data-running', 'false');
});

test('preserves natural page width in portrait and landscape', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 740, height: 360 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await openLab(page);
    await expectNoHorizontalOverflow(page);
  }
});
