import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('viewport changes respect a manual scroll away from the focused typing field', async ({ page }) => {
  await page.goto('/practice');
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: 'Line notes', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Typing input' });
  await input.focus();
  await input.fill('export');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const position = await page.evaluate(() => window.scrollY);
  expect(position).toBeGreaterThan(100);
  await expect.poll(() => page.locator('[data-typing-cursor]').evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0);
  await page.evaluate(async () => {
    window.visualViewport?.dispatchEvent(new Event('resize'));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(position);
  await expect(input).toBeFocused();
});

test('a swipe over the reference scrolls without focusing the typing field', async ({ page, context }) => {
  await page.goto('/practice');
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Typing input' });
  await expect(input).not.toBeFocused();
  const stage = (await page.locator('[data-typing-stage]').boundingBox())!;
  const startY = Math.min(stage.y + 90, 700);
  const initial = await page.evaluate(() => window.scrollY);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: startY }] });
  await expect(input).not.toBeFocused();
  for (let step = 1; step <= 5; step += 1) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y: startY - step * 35 }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(initial + 50);
  await expect(input).not.toBeFocused();
  await cdp.detach();
});

test('untyped text is translucent while entered text and the caret stay solid', async ({ page }) => {
  await page.goto('/practice');
  const input = page.getByRole('textbox', { name: 'Typing input' });
  const first = page.locator('[data-typing-state="pending"]').first();
  expect(await first.evaluate(element => getComputedStyle(element).color)).toContain('0.65');
  await input.fill('export');
  const correct = page.locator('[data-typing-state="correct"]').first();
  expect(await correct.evaluate(element => getComputedStyle(element).color)).not.toContain('0.65');
  const caret = page.locator('[data-typing-cursor]');
  expect(await caret.evaluate(element => getComputedStyle(element, '::before').borderLeftColor)).not.toContain('0.65');
  await input.fill('exporx');
  expect(await page.locator('[data-typing-state="wrong"]').evaluate(element => getComputedStyle(element).color)).not.toContain('0.65');
});
