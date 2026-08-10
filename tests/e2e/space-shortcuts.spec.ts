import { expect, test, type Page } from '@playwright/test';

async function pressMod(page: Page, key: string) {
  const modifier = await page.evaluate(() =>
    /Mac|iPhone|iPad/i.test(navigator.platform) ? 'Meta' : 'Control'
  );
  await page.keyboard.press(`${modifier}+${key}`);
}

test.describe('Space shortcut registry', () => {
  test('generates the reference and preserves typing/search toggle behavior', async ({
    page,
  }) => {
    const response = await page.goto('/space');
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { name: 'Space' })).toBeVisible({
      timeout: 15_000,
    });

    await page.keyboard.press('Shift+/');
    const help = page.locator('[data-space-shortcut-help]');
    await expect(help).toBeVisible();
    await expect(
      help.getByRole('heading', { name: 'Space keyboard shortcuts' })
    ).toBeVisible();
    await expect(
      help.locator('[data-space-shortcut-id="search.toggle"]')
    ).toContainText('Open or close item search');
    await expect(
      help.locator('[data-space-shortcut-id="review.next"]')
    ).toHaveAttribute('data-available', 'false');
    await expect(
      help.locator('[data-space-shortcut-id="trail.next"]')
    ).toHaveAttribute('data-available', 'false');

    await page.keyboard.press('Escape');
    await expect(help).toBeHidden();

    await pressMod(page, 'K');
    const search = page.getByPlaceholder(/Search items/);
    await expect(search).toBeFocused();

    // Mod+K is the narrow editable-field exception so the palette can close
    // while its own input has focus.
    await pressMod(page, 'K');
    await expect(search).toBeHidden();

    await pressMod(page, 'K');
    await expect(search).toBeFocused();
    await page.keyboard.type('j ? k');
    await expect(search).toHaveValue('j ? k');
    await expect(page).toHaveURL(/\/space$/);
  });

  test('dispatches the shared sidebar command once and registers Trail keys', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    let response = await page.goto('/space');
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { name: 'Space' })).toBeVisible({
      timeout: 15_000,
    });

    const sidebar = page.locator('[data-side="left"][data-state]').first();
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    await pressMod(page, 'B');
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    await pressMod(page, 'B');
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');

    response = await page.goto('/space/trail');
    expect(response?.ok()).toBe(true);
    await expect(
      page.getByRole('heading', { name: 'Learning trail' })
    ).toBeAttached({ timeout: 15_000 });

    await page.keyboard.press('Shift+/');
    const help = page.locator('[data-space-shortcut-help]');
    await expect(help).toBeVisible();
    await expect(
      help.locator('[data-space-shortcut-id="trail.next"]')
    ).toContainText('Move to the next Trail recommendation');
    await expect(
      help.locator('[data-space-shortcut-id="trail.previous"]')
    ).toContainText('Move to the previous Trail recommendation');
  });
});
