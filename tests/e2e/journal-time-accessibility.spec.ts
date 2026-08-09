import { expect, test, type Locator, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function expectMinimumTargetSize(locator: Locator, minimum = 44) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(minimum);
}

test('journal exposes one main landmark and readable, touch-sized records at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/journal');

  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(
    page.getByRole('region', { name: 'Recorded work' })
  ).toBeVisible();

  const firstEntry = page.locator('[data-journal-entry]').first();
  const entryHeading = firstEntry.getByRole('heading', {
    name: 'The Two-Handed Discipline',
    exact: true,
  });
  const headingId = await entryHeading.getAttribute('id');
  expect(headingId).not.toBeNull();
  await expect(firstEntry.locator('article')).toHaveAttribute(
    'aria-labelledby',
    headingId!
  );

  const disclosure = firstEntry.locator('summary');
  await expectMinimumTargetSize(disclosure);
  await disclosure.click();
  await expectMinimumTargetSize(
    firstEntry.getByRole('link', {
      name: /Open evidence: PR #493/i,
    })
  );

  const smallestLedgerLabel = firstEntry.getByText('Record 01', {
    exact: true,
  });
  const labelSize = await smallestLedgerLabel.evaluate(element =>
    Number.parseFloat(getComputedStyle(element).fontSize)
  );
  expect(labelSize).toBeGreaterThanOrEqual(10);
  await expectNoHorizontalOverflow(page);
});

test('journal and time controls remove decorative motion when reduced motion is requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/journal');

  const journalCard = page.locator('[data-journal-entry] article').first();
  await journalCard.hover();
  await expect
    .poll(() =>
      journalCard.evaluate(element => getComputedStyle(element).transform)
    )
    .toBe('none');

  await page.goto('/time');
  const trigger = page.locator('[data-timezone-trigger]');
  await expect
    .poll(() =>
      trigger.evaluate(element => getComputedStyle(element).transitionDuration)
    )
    .toBe('0s');
});

test('time controls reflow at 320px with visible labels and machine-readable values', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/time');

  const currentTimeButton = page.getByRole('button', {
    name: /Jump the slider to the current time, \d{2}:\d{2}/,
  });
  const slider = page.getByRole('slider', { name: 'Slide through the day' });
  const trigger = page.locator('[data-timezone-trigger]');

  await expect(currentTimeButton).toBeVisible();
  await expect(slider).toHaveAttribute(
    'aria-valuetext',
    /^\d{2}:\d{2} (Night|Morning|Afternoon|Evening)$/
  );
  await expectMinimumTargetSize(currentTimeButton);
  await expectMinimumTargetSize(trigger, 48);
  await expectMinimumTargetSize(slider);

  const semanticTimes = page.locator('time[datetime]');
  await expect(semanticTimes).toHaveCount(6);
  for (let index = 0; index < (await semanticTimes.count()); index += 1) {
    await expect(semanticTimes.nth(index)).toHaveAttribute(
      'datetime',
      /^\d{2}:\d{2}$/
    );
  }

  const cards = page
    .getByRole('region', { name: 'Time comparisons' })
    .locator(':scope > div');
  const firstCard = await cards.nth(0).boundingBox();
  const secondCard = await cards.nth(1).boundingBox();
  expect(firstCard).not.toBeNull();
  expect(secondCard).not.toBeNull();
  expect(secondCard!.y).toBeGreaterThan(firstCard!.y);
  await expectNoHorizontalOverflow(page);
});
