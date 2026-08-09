import { expect, test } from '@playwright/test';

test.skip(
  Boolean(process.env.LOCAL_CI || process.env.CI),
  'This visual contract uses the live public Space archive; run it separately from hermetic CI.'
);

test('Space Trail is a dense natural-scrolling reading room', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto('/space/trail');
  expect(response?.ok()).toBe(true);

  const trail = page.locator('[data-space-trail]');
  const list = page.locator('[data-space-trail-list]');
  await expect(list).toBeVisible({ timeout: 15_000 });

  const cards = list.locator('[data-trail-item]');
  expect(await cards.count()).toBeGreaterThan(4);

  const geometry = await trail.evaluate(element => {
    const style = getComputedStyle(element);
    const firstCards = Array.from(
      element.querySelectorAll<HTMLElement>('[data-trail-item]')
    ).slice(0, 3);
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollSnapType: style.scrollSnapType,
      cardHeights: firstCards.map(card => card.getBoundingClientRect().height),
    };
  });

  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
  expect(geometry.scrollSnapType).not.toContain('mandatory');
  expect(geometry.cardHeights.every(height => height < 360)).toBe(true);

  const firstCard = cards.first();
  const peek = firstCard.locator('button[aria-controls^="trail-detail-"]');
  await expect(peek).toHaveAttribute('aria-expanded', 'false');
  await peek.click();
  await expect(peek).toHaveAttribute('aria-expanded', 'true');
  await expect(firstCard.locator('[data-trail-detail]')).toBeVisible();
  await expect(firstCard.getByText('Try before opening')).toBeVisible();
  expect(
    await page.evaluate(() => ({
      outerScroll: window.scrollY,
      trailScroll:
        document.querySelector<HTMLElement>('[data-space-trail]')?.scrollTop,
    }))
  ).toMatchObject({ outerScroll: 0 });
  const expandedControlHeights = await firstCard
    .locator('[data-trail-detail] button, [data-trail-detail] a')
    .evaluateAll(elements =>
      elements.map(element => element.getBoundingClientRect().height)
    );
  expect(expandedControlHeights.every(height => height >= 44)).toBe(true);

  const title = (await firstCard.getByRole('link').first().innerText()).trim();
  const filter = page.getByRole('searchbox', { name: 'Filter loaded notes' });
  await filter.fill(title);
  await expect(firstCard).toBeVisible();
  await filter.clear();

  expect(pageErrors).toEqual([]);
});

test('a Trail reading sheet returns to the exact note anchor', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/space/trail');

  const firstCard = page.locator('[data-trail-item]').first();
  await expect(firstCard).toBeVisible({ timeout: 15_000 });
  const itemId = await firstCard.getAttribute('data-trail-item');
  expect(itemId).toBeTruthy();

  const title = firstCard.getByRole('link').first();
  await expect(title).toHaveAttribute(
    'href',
    new RegExp(`return=${encodeURIComponent(itemId ?? '')}`)
  );
  await title.click();

  const back = page.getByRole('link', { name: 'Back to trail' });
  await expect(back).toBeVisible({ timeout: 15_000 });
  await expect(back).toHaveAttribute('href', `/space/trail#trail-${itemId}`);
  await back.click();

  await expect(page).toHaveURL(new RegExp(`/space/trail#trail-${itemId}$`));
  await expect(page.locator(`#trail-${itemId}`)).toBeInViewport();
});
