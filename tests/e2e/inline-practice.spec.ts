import { expect, test } from '@playwright/test';

test('typing and correcting happen on the reference with an editable caret', async ({
  page,
}) => {
  await page.goto('/practice');
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Typing input' });
  const overlay = page.locator('[data-typing-overlay]');
  const stage = page.locator('[data-typing-stage]');
  expect(
    await overlay.evaluate(element => getComputedStyle(element).fontFamily)
  ).toContain('monospace');
  const bounds = await Promise.all([
    stage.boundingBox(),
    input.boundingBox(),
    overlay.boundingBox(),
  ]);
  expect(bounds[1]!.x).toBe(bounds[0]!.x);
  expect(bounds[1]!.y).toBe(bounds[0]!.y);
  expect(bounds[2]!.y).toBeGreaterThanOrEqual(bounds[1]!.y);
  expect(bounds[2]!.y + bounds[2]!.height).toBeLessThanOrEqual(
    bounds[1]!.y + bounds[1]!.height + 1
  );
  await overlay.locator('[data-offset="0"]').click();
  await expect(input).toBeFocused();
  await input.fill('export function spaceTypingWpm(');
  await input.press('Enter');
  await input.pressSequentially('  cor');
  await expect(input).toHaveValue('export function spaceTypingWpm(\n  cor');
  await expect(overlay.locator('[data-typing-cursor]')).toHaveAttribute(
    'data-offset',
    String('export function spaceTypingWpm(\n  cor'.length)
  );
  await page.getByRole('button', { name: 'Restart' }).click();
  await page.keyboard.type('export ');
  await expect(overlay.locator('[data-typing-state="correct"]')).toHaveCount(7);
  await expect(overlay.locator('[data-typing-cursor]')).toHaveAttribute(
    'data-offset',
    '7'
  );
  await input.press('ArrowLeft');
  await expect(overlay.locator('[data-typing-cursor]')).toHaveAttribute(
    'data-offset',
    '6'
  );
  await input.press('Shift+ArrowLeft');
  await expect(overlay.locator('[data-typing-cursor]')).toHaveAttribute(
    'data-offset',
    '5'
  );
  expect(
    await input.evaluate(
      element => (element as HTMLTextAreaElement).selectionStart
    )
  ).toBe(5);
  await input.press('x');
  await expect(input).toHaveValue('exporx ');
  await expect(overlay.locator('[data-typing-state="wrong"]')).toHaveText('x');
  await overlay.locator('[data-offset="2"]').click();
  expect(
    await input.evaluate(
      element => (element as HTMLTextAreaElement).selectionStart
    )
  ).toBe(2);
  await input.press('Escape');
  await expect(input).not.toBeFocused();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
});

test('reduced motion keeps the focused caret static', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/practice');
  const input = page.getByRole('textbox', { name: 'Typing input' });
  await input.focus();
  const caret = page.locator('[data-typing-cursor]');
  expect(
    await caret.evaluate(
      element => getComputedStyle(element, '::before').animationName
    )
  ).toBe('none');
  expect(
    await caret.evaluate(
      element => getComputedStyle(element, '::before').borderLeftWidth
    )
  ).toBe('2px');
});

test('the concept library shows full titles and restores focus on Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/practice?mode=concepts');
  await page.getByRole('button', { name: 'Browse concepts' }).click();
  const dialog = page.getByRole('dialog', { name: 'Choose a concept' });
  await expect(
    dialog.getByRole('textbox', { name: 'Find a concept' })
  ).toBeFocused();
  const box = await dialog.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  expect(box!.width).toBeLessThanOrEqual(390);
  expect(
    await dialog.evaluate(element => getComputedStyle(element).borderRadius)
  ).toBe('0px');
  await dialog
    .getByRole('textbox', { name: 'Find a concept' })
    .fill('virtual machine');
  await expect(
    dialog.getByRole('button', {
      name: /Virtual machines as authority over real resources/,
    })
  ).toBeVisible();
  await expect(dialog.locator('select')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Browse concepts' })
  ).toBeFocused();
});

test.describe('touch typing', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  test('tapping the code focuses the actual input and updates the overlay', async ({
    page,
  }) => {
    await page.goto('/practice');
    await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
    await page.locator('[data-typing-overlay] [data-offset="0"]').tap();
    await expect(
      page.getByRole('textbox', { name: 'Typing input' })
    ).toBeFocused();
    await page.keyboard.insertText('export');
    await expect(page.locator('[data-typing-state="correct"]')).toHaveCount(6);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(390);
  });
});
