import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  let globalPets = 1200;
  await page.route('**/api/scraplet', async route => {
    if (route.request().method() === 'POST') globalPets += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ pets: globalPets }),
    });
  });
});

test('tracks personal plus worldwide Scraplet pets', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const pet = page.locator('[data-scrapbook-pet]');

  await expect(pet).toHaveAttribute('data-pets', '0');
  await expect(pet).toHaveAttribute('data-global-pets', '1200');
  await expect(pet.locator('[data-paper-creature-tail]')).toHaveCount(1);
  await expect(pet.locator('[data-paper-creature-tail-fold]')).toHaveCount(1);
  await expect(
    pet.locator('[data-paper-creature-back-plates] path')
  ).toHaveCount(3);
  await expect(
    pet.locator('[data-paper-creature-back-folds] path')
  ).toHaveCount(3);
  expect(
    await pet.evaluate(element => {
      const plates = element.querySelector('[data-paper-creature-back-plates]');
      const torso = element.querySelector('[data-paper-creature-torso]');
      return Boolean(
        plates &&
          torso &&
          plates.compareDocumentPosition(torso) &
            Node.DOCUMENT_POSITION_FOLLOWING
      );
    })
  ).toBe(true);

  await pet.click();
  await expect(pet).toHaveAttribute('data-pets', '1');
  await expect(pet).toHaveAttribute('data-global-pets', '1201');

  await page.reload();
  const reloadedPet = page.locator('[data-scrapbook-pet]');
  await expect(reloadedPet).toBeVisible({ timeout: 15_000 });
  await expect(reloadedPet).toHaveAttribute('data-pets', '1');
  await expect(reloadedPet).toHaveAttribute('data-global-pets', '1201');
});
