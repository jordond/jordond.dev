import { defineConfig, devices } from "@playwright/test"

const PORT = 8787
const BASE_URL = `http://127.0.0.1:${PORT}`

/**
 * E2E tests run against `wrangler dev` serving the built `dist/`, so the
 * Worker's static-asset behaviour (404 handling, headers) is exercised too.
 * Run `bun run build` first.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `bunx wrangler dev --port ${PORT} --ip 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      WRANGLER_SEND_METRICS: "false",
      CI: "1",
    },
  },
})
