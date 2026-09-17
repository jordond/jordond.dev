import { expect, test } from "@playwright/test"

/**
 * Screenshot tests. Each test does two things:
 *
 * 1. Saves an unmasked full-page PNG to `screenshots/` so the PR preview
 *    comment can show what the page looks like.
 * 2. Compares a masked full-page screenshot against the committed baseline in
 *    `tests/e2e/__screenshots__/`. Star counts change nightly, so anything
 *    tagged `.num` or `.stars` is masked out of the comparison.
 */
const pages = [
  { name: "home", path: "/" },
  { name: "404", path: "/this-page-does-not-exist" },
]

for (const { name, path } of pages) {
  test(name, async ({ page }, testInfo) => {
    await page.goto(path)
    await page.evaluate(() => document.fonts.ready)

    const variant = testInfo.project.name.replace(/^visual-/, "")
    await page.screenshot({
      path: `screenshots/${name}-${variant}.png`,
      fullPage: true,
      scale: "css",
    })

    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      mask: [page.locator(".num"), page.locator(".stars")],
    })
  })
}
