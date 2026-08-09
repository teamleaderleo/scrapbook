import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const slug = 'cache-files-are-published-atomically';

test.skip(
  Boolean(process.env.LOCAL_CI || process.env.CI),
  'This integration contract uses the live public Space archive; run it separately from hermetic CI.'
);

for (const study of [
  { theme: 'light', width: 390, height: 844 },
  { theme: 'dark', width: 390, height: 844 },
  { theme: 'light', width: 1366, height: 768 },
] as const) {
  test(`reading sheet stays legible in ${study.theme} at ${study.width}px`, async ({
    page,
  }, testInfo) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.setViewportSize({ width: study.width, height: study.height });
    await page.addInitScript(theme => {
      window.localStorage.setItem('theme', theme);
    }, study.theme);

    const response = await page.goto(`/space/read/${slug}?lane=fieldwork`);
    expect(response?.ok()).toBe(true);

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Why should a cache filename mean “complete object”?',
      })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: 'The question' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Try it' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Open pinned source' })
    ).toHaveAttribute(
      'href',
      /linux-fieldwork\/blob\/c79d34b65fb2cd8c54234f361f073248c53b513a/
    );
    await expect(
      page.getByRole('link', { name: 'Back to fieldwork' })
    ).toHaveAttribute('href', '/space?lane=fieldwork');

    const backLink = page.getByRole('link', { name: 'Back to fieldwork' });
    const backHeight = await backLink.evaluate(
      element => element.getBoundingClientRect().height
    );
    const footprint = await page.evaluate(() => {
      const paper = document.querySelector<HTMLElement>(
        'article.material-paper'
      );
      if (!paper) throw new Error('Reading sheet furniture is missing');
      const paperStyle = getComputedStyle(paper);
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        paperWidth: paper.getBoundingClientRect().width,
        paperBackground: paperStyle.backgroundColor,
        paperForeground: paperStyle.color,
      };
    });

    expect(footprint.documentWidth).toBeLessThanOrEqual(
      footprint.viewportWidth + 1
    );
    expect(footprint.paperWidth).toBeLessThanOrEqual(footprint.viewportWidth);
    expect(backHeight).toBeGreaterThanOrEqual(44);
    if (study.theme === 'dark') {
      expect(footprint.paperBackground).toBe('rgb(45, 46, 52)');
      expect(footprint.paperForeground).toBe('rgb(230, 227, 219)');
    }

    expect(pageErrors).toEqual([]);
    expect(
      await page.locator('[data-nextjs-dialog], .vite-error-overlay').count()
    ).toBe(0);

    const screenshotPath = path.join(
      'test-results',
      'space-reading-sheet',
      study.theme,
      testInfo.project.name,
      `${study.width}x${study.height}.png`
    );
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      animations: 'disabled',
    });
  });
}

test('Space routes a public Fieldwork item into its reading sheet', async ({
  page,
}) => {
  const response = await page.goto('/space?lane=fieldwork');
  expect(response?.ok()).toBe(true);

  const item = page.getByRole('link', {
    name: 'Why should a cache filename mean “complete object”?',
  });
  await expect(item).toBeVisible({ timeout: 15_000 });
  await item.click();
  await expect(page).toHaveURL(
    /\/space\/read\/cache-files-are-published-atomically\?lane=fieldwork/
  );
});
