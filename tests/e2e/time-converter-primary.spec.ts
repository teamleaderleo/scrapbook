import { expect, test, type Locator } from '@playwright/test';

async function setNativeTimeValue(input: Locator, value: string) {
  await input.evaluate((element, nextValue) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setter) throw new Error('Missing native input value setter');
    setter.call(element, nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function waitForTimeConverter(page: Parameters<typeof test>[0] extends never ? never : any) {
  await expect(page.locator('[data-time-converter-ready="true"]')).toBeVisible();
}

test.describe('time converter primary controls', () => {
  test('keeps the primary time field, scrubber, and local card synchronized', async ({ page }) => {
    await page.goto('/time');
    await waitForTimeConverter(page);

    const timeField = page.getByLabel('Selected local time', { exact: true });
    const scrubber = page.getByRole('slider', { name: 'Selected local time scrubber' });
    const localCard = page.getByText('Local', { exact: true }).locator('..');

    await setNativeTimeValue(timeField, '14:30');
    await expect(timeField).toHaveValue('14:30');
    await expect(scrubber).toHaveValue(String(14 * 60 + 30));
    await expect(localCard).toContainText('14:30');

    await page.getByRole('button', { name: /Morning/ }).click();
    await expect(timeField).toHaveValue('09:00');
    await expect(scrubber).toHaveValue(String(9 * 60));
    await expect(localCard).toContainText('09:00');
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
