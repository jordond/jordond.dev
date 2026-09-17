import { expect, test } from "vitest"
import { getRobotsTxt } from "../../src/pages/robots.txt"

test("allows all crawlers and points at the sitemap index", () => {
  const txt = getRobotsTxt(new URL("https://jordond.dev/sitemap-index.xml"))
  expect(txt).toBe(
    "User-agent: *\nAllow: /\n\nSitemap: https://jordond.dev/sitemap-index.xml\n",
  )
})
