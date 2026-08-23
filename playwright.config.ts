import { defineConfig, devices } from '@playwright/test';

const isHostedCi = Boolean(process.env.CI);
const isLocalCi = Boolean(process.env.LOCAL_CI);
const isAutomatedRun = isHostedCi || isLocalCi;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isAutomatedRun,
  retries: isAutomatedRun ? 1 : 0,
  workers: isAutomatedRun ? 2 : undefined,
  reporter: isHostedCi ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(isHostedCi ? { channel: 'chrome' as const } : {}),
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !isAutomatedRun,
    timeout: 120_000,
  },
});
