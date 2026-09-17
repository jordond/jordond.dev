import { defineConfig, devices } from "@playwright/test"

const PORT = 8787
const BASE_URL = `http://127.0.0.1:${PORT}`

/**
 * Tests run against `wrangler dev` serving the built `dist/`, so the Worker's
 * static-asset behaviour (404 handling, headers) is exercised too. Run
 * `bun run build` first.
 *
 * Two kinds of project:
 * - `desktop` / `mobile`: functional e2e, run by `bun run test:e2e`.
 * - `visual-desktop` / `visual-mobile`: screenshot comparison, run by
 *   `bun run test:visual`. Baselines are rendered on Linux in CI; see
 *   `scripts/visual-accept.sh` for how to update them.
 */
const functional = { testIgnore: /visual\.spec\.ts/ }
const visual = { testMatch: /visual\.spec\.ts/, retries: 0 }

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { open: "never" }],
        ["json", { outputFile: "test-results/results.json" }],
      ]
    : "list",
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{arg}-{projectName}-{platform}{ext}",
  expect: {
    toHaveScreenshot: {
      // Volatile numbers are masked in the test, so steady state should be a
      // near-zero diff. 500px absorbs antialiasing noise; a broken rule or
      // shifted layout is orders of magnitude larger.
      maxDiffPixels: 500,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, ...functional },
    { name: "mobile", use: { ...devices["Pixel 7"] }, ...functional },
    {
      name: "visual-desktop",
      use: { ...devices["Desktop Chrome"] },
      ...visual,
    },
    { name: "visual-mobile", use: { ...devices["Pixel 7"] }, ...visual },
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
