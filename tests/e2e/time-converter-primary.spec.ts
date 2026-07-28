import { expect, test, type Page } from '@playwright/test';

async function waitForTimeConverter(page: Page) {
  await expect(page.locator('[data-time-converter-ready="true"]')).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(0);
}

test.describe('owned time converter controls', () => {
  test('keeps the custom clock editor, scrubber, presets, and cards synchronized', async ({
    page,
  }) => {
    await page.goto('/time');
    await waitForTimeConverter(page);

    const hour = page.getByRole('spinbutton', { name: 'Selected hour' });
    const minute = page.getByRole('spinbutton', { name: 'Selected minute' });
    const surface = page.locator('[data-time-editor-surface]');
    const scrubber = page.getByRole('slider', { name: 'Selected local time scrubber' });
    const localCard = page.getByText('Local', { exact: true }).locator('..');

    await hour.fill('14');
    await minute.fill('30');
    await page.getByRole('heading', { name: 'Choose the time you want to compare.' }).click();

    await expect(hour).toHaveValue('14');
    await expect(minute).toHaveValue('30');
    await expect(surface).toHaveAttribute('data-selected-local-time', '14:30');
    await expect(scrubber).toHaveValue(String(14 * 60 + 30));
    await expect(localCard).toContainText('14:30');

    await page.getByRole('button', { name: /Morning/ }).click();
    await expect(hour).toHaveValue('09');
    await expect(minute).toHaveValue('00');
    await expect(scrubber).toHaveValue(String(9 * 60));
    await expect(localCard).toContainText('09:00');

    await minute.focus();
    await minute.press('ArrowUp');
    await expect(surface).toHaveAttribute('data-selected-local-time', '09:01');

    await page.getByRole('button', { name: 'Move selected time 15 minutes later' }).click();
    await expect(surface).toHaveAttribute('data-selected-local-time', '09:16');
  });

  test('keeps the clock editor physically substantial on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/time');
    await waitForTimeConverter(page);

    const surface = page.locator('[data-time-editor-surface]');
    const hour = page.getByRole('spinbutton', { name: 'Selected hour' });
    const minute = page.getByRole('spinbutton', { name: 'Selected minute' });

    const [surfaceBox, hourBox, minuteBox] = await Promise.all([
      surface.boundingBox(),
      hour.boundingBox(),
      minute.boundingBox(),
    ]);

    expect(surfaceBox).toBeTruthy();
    expect(hourBox).toBeTruthy();
    expect(minuteBox).toBeTruthy();
    expect(surfaceBox!.width).toBeGreaterThanOrEqual(300);
    expect(hourBox!.width).toBeGreaterThanOrEqual(108);
    expect(minuteBox!.width).toBeGreaterThanOrEqual(108);
    expect(hourBox!.height).toBeGreaterThanOrEqual(78);
    expect(minuteBox!.height).toBeGreaterThanOrEqual(78);
    expect(Math.abs(hourBox!.width - minuteBox!.width)).toBeLessThanOrEqual(1);
    await expectNoHorizontalOverflow(page);
  });

  test('renders the zone picker as a substantial full-width input surface', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/time');
    await waitForTimeConverter(page);

    const trigger = page.locator('[data-timezone-trigger]');
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox).toBeTruthy();
    expect(triggerBox!.height).toBeGreaterThanOrEqual(62);

    await trigger.click();

    const picker = page.locator('[data-timezone-picker]');
    const search = page.getByRole('combobox', { name: 'Search time zones' });
    const firstOption = page.locator('[cmdk-item]').first();
    await expect(picker).toBeVisible();
    await expect(search).toBeFocused();
    await expect(firstOption).toBeVisible();

    const [pickerBox, searchBox, optionBox] = await Promise.all([
      picker.boundingBox(),
      search.boundingBox(),
      firstOption.boundingBox(),
    ]);
    expect(pickerBox).toBeTruthy();
    expect(searchBox).toBeTruthy();
    expect(optionBox).toBeTruthy();
    expect(pickerBox!.width).toBeGreaterThanOrEqual(triggerBox!.width - 2);
    expect(searchBox!.height).toBeGreaterThanOrEqual(54);
    expect(optionBox!.height).toBeGreaterThanOrEqual(54);
  });
});
