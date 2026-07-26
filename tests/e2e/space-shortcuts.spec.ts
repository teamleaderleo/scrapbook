import { expect, test, type Page } from '@playwright/test';

async function pressMod(page: Page, key: string) {
  const modifier = await page.evaluate(() =>
    /Mac|iPhone|iPad/i.test(navigator.platform) ? 'Meta' : 'Control',
  );
  await page.keyboard.press(`${modifier}+${key}`);
}

async function waitForSpaceHydration(page: Page) {
  const help = page.locator('[data-space-shortcut-help]');
  await page.getByRole('button', { name: 'Keyboard shortcuts' }).click();
  await expect(help).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(help).toBeHidden();
}

async function openMobileSidebar(page: Page) {
  const toggle = page.getByRole('button', { name: 'Toggle sidebar' });
  const referenceButton = page.getByRole('button', { name: 'Keyboard shortcuts' });

  await expect
    .poll(
      async () => {
        if (await referenceButton.isVisible()) return true;
        await toggle.click();
        try {
          await referenceButton.waitFor({ state: 'visible', timeout: 1_500 });
          return true;
        } catch {
          return false;
        }
      },
      { timeout: 15_000 },
    )
    .toBe(true);
}

test.describe('Space shortcut registry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/space');
    await expect(page.getByRole('button', { name: 'Toggle sidebar' })).toBeVisible();
    await expect(page.getByText('Shortcut Alpha')).toBeVisible();
    await waitForSpaceHydration(page);
  });

  test('opens the generated reference and preserves typing', async ({ page }) => {
    await page.keyboard.press('Shift+/');

    const help = page.locator('[data-space-shortcut-help]');
    await expect(help).toBeVisible();
    await expect(help.getByRole('heading', { name: 'Space keyboard shortcuts' })).toBeVisible();
    await expect(help.locator('[data-space-shortcut-id="search.toggle"]')).toContainText(
      'Open or close item search',
    );
    await expect(help.locator('[data-space-shortcut-id="sidebar.toggle"]')).toContainText(
      'Open or close the navigation sidebar',
    );
    await expect(help.locator('[data-space-shortcut-id="review.next"]')).toContainText(
      'Move to the next review item',
    );
    await expect(help.locator('[data-space-shortcut-id="review.next"]')).toHaveAttribute(
      'data-available',
      'false',
    );

    await page.keyboard.press('Escape');
    await expect(help).toBeHidden();

    await pressMod(page, 'K');
    const search = page.getByPlaceholder(/Search items/);
    await expect(search).toBeFocused();
    await page.keyboard.type('j ? k');
    await expect(search).toHaveValue('j ? k');
    await expect(page).toHaveURL(/\/space$/);
  });

  test('dispatches sidebar, navigation, and review commands once', async ({ page }) => {
    const sidebar = page.locator('[data-side="left"][data-state]').first();
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');

    await pressMod(page, 'B');
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    await pressMod(page, 'B');
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');

    await pressMod(page, 'E');
    await expect(page).toHaveURL(/\/space\/review(?:\?|$)/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Shortcut Alpha' })).toBeVisible();
    await expect(page.getByText('Alpha review content')).toBeVisible();

    await page.keyboard.press('Space');
    await expect(page.getByText('Alpha review content')).toBeHidden();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { name: 'Shortcut Beta' })).toBeVisible();
    await expect(page.getByText('Beta review content')).toBeVisible();

    await page.keyboard.press('k');
    await expect(page.getByRole('heading', { name: 'Shortcut Alpha' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/space$/, { timeout: 15_000 });
  });

  test('bridges the editor command and keeps the help surface usable on mobile', async ({ page }) => {
    await pressMod(page, 'I');
    const editor = page.locator('[data-space-shortcut-scope="editor"]');
    await expect(editor).toBeVisible();
    await expect(editor.locator('.monaco-editor')).toBeVisible({ timeout: 30_000 });

    await pressMod(page, 'I');
    await expect(editor).toBeHidden();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await openMobileSidebar(page);
    await page.getByRole('button', { name: 'Keyboard shortcuts' }).click();

    await expect(page.locator('[data-space-shortcut-help]')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
      .toBeLessThanOrEqual(1);
  });
});
