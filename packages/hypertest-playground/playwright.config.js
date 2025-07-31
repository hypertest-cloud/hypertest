// @ts-check
import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ['json', { outputFile: 'test-artifacts/output/playwright-results.json' }],
  ],
  use: {
    trace: 'on-first-retry',
    video: 'off',
  },
  outputDir: 'test-artifacts/output',
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        headless: true,
      },
    },
  ],
});
