import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("requestfailed", (request) => {
    errors.push(`${request.url()} ${request.failure()?.errorText}`)
  })
  return errors
}

test("home page renders with no runtime errors", async ({ page }) => {
  const errors = collectErrors(page)

  const response = await page.goto("/")
  expect(response?.status()).toBe(200)

  await expect(
    page.getByRole("heading", { level: 1, name: "Jordon de Hoog" }),
  ).toBeVisible()
  await expect(page.getByText("Open to new opportunities")).toBeVisible()
  await expect(page.getByRole("link", { name: "resume.pdf" })).toBeVisible()

  expect(errors).toEqual([])
})

test("in-page navigation reaches every section", async ({ page }) => {
  await page.goto("/")
  for (const name of [
    "Summary",
    "Apps",
    "Libraries",
    "Tools",
    "Talks",
    "Contact",
  ]) {
    const link = page.locator(".topnav").getByRole("link", { name })
    const id = (await link.getAttribute("href"))!.slice(1)
    await link.click()
    await expect(page).toHaveURL(new RegExp(`#${id}$`))
    await expect(page.locator(`#${id}`)).toBeInViewport()
  }
})

test("unknown routes serve the 404 page with a 404 status", async ({
  page,
}) => {
  const response = await page.goto("/this-page-does-not-exist")
  expect(response?.status()).toBe(404)
  await expect(
    page.getByText("D O C U M E N T   N O T   F O U N D"),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Back to the home page" }),
  ).toBeVisible()
})

test("static files are served", async ({ request }) => {
  const resume = await request.get("/resume.pdf")
  expect(resume.status()).toBe(200)
  expect(resume.headers()["content-type"]).toContain("application/pdf")

  const robots = await request.get("/robots.txt")
  expect(robots.status()).toBe(200)
  expect(await robots.text()).toContain("Sitemap: https://jordond.dev/")

  const sitemap = await request.get("/sitemap-index.xml")
  expect(sitemap.status()).toBe(200)
})

test.describe("accessibility", () => {
  for (const path of ["/", "/this-page-does-not-exist"]) {
    test(`${path} has no WCAG 2.1 AA violations`, async ({ page }) => {
      await page.goto(path)
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
      expect(
        results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([])
    })
  }
})
