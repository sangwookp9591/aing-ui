import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', outputDir: '.verify/playwright', reporter: [['list'], ['json', { outputFile: '.verify/m1-browser.json' }]],
  snapshotPathTemplate: '{testDir}/baselines/{platform}/{projectName}/{arg}{ext}',
  use: { baseURL: process.env.VERIFY_ORIGIN ?? 'http://localhost:3210', trace: 'retain-on-failure' },
  workers: 1, retries: 0,
  webServer: process.env.VERIFY_ORIGIN ? undefined : { command: 'pnpm start --port 3210', url: 'http://localhost:3210/m1', reuseExistingServer: true },
  projects: [ { name: 'chromium', use: { ...devices['Desktop Chrome'] } }, { name: 'firefox', use: { ...devices['Desktop Firefox'] } }, { name: 'webkit', use: { ...devices['Desktop Safari'] } } ],
});
