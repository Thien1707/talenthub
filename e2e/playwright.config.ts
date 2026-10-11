import { defineConfig, devices } from "@playwright/test";

const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
const apiUrl = process.env.API_URL ?? "http://localhost:4000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: webUrl,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PW_SKIP_WEB_SERVER
    ? undefined
    : [
        {
          command: "npm run start -w api",
          url: `${apiUrl}/api/v1/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: "npm run start -w web",
          url: webUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});
