import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PROD_PORT || 3219);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 2,
  reporter: [["list"], ["html", { outputFolder: "test-artifacts/playwright-prod-report", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "prod-chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "prod-chromium-mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
