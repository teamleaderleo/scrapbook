import { defineConfig, devices } from '@playwright/test';

const isAutomatedRun = Boolean(process.env.CI || process.env.LOCAL_CI);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isAutomatedRun,
  retries: 0,
  workers: isAutomatedRun ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !isAutomatedRun,
    timeout: 120_000,
  },
});
