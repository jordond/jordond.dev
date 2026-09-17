/**
 * Post-build smoke tests. Run after `astro build`; they read `dist/` directly
 * so a dependency bump that breaks output (but not the build) is caught.
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { parseHTML } from "linkedom"
import { beforeAll, describe, expect, test } from "vitest"

const dist = join(process.cwd(), "dist")

function read(file: string): string {
  return readFileSync(join(dist, file), "utf-8")
}

function html(file: string) {
  return parseHTML(read(file)).document
}

function existsInDist(pathname: string): boolean {
  const clean = pathname.replace(/^\//, "")
  if (clean === "") return existsSync(join(dist, "index.html"))
  return (
    existsSync(join(dist, clean)) ||
    existsSync(join(dist, clean, "index.html")) ||
    existsSync(join(dist, `${clean}.html`))
  )
}

beforeAll(() => {
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("dist/index.html missing. Run `bun run build` first.")
  }
})

describe("home page", () => {
  const doc = html("index.html")

  test("has the expected title and h1", () => {
    expect(doc.querySelector("title")?.textContent).toBe(
      "Jordon de Hoog : Software Engineer",
    )
    expect(doc.querySelector("h1")?.textContent?.trim()).toBe("Jordon de Hoog")
    expect(doc.documentElement.getAttribute("lang")).toBe("en")
  })

  test("answers availability and contact above the fold", () => {
    expect(doc.querySelector(".status")?.textContent).toContain(
      "Open to new opportunities",
    )
    expect(doc.querySelector('a[href^="mailto:"]')).not.toBeNull()
    expect(doc.querySelector('a[href="/resume.pdf"]')).not.toBeNull()
    expect(
      doc.querySelector('a[href="https://github.com/jordond"]'),
    ).not.toBeNull()
  })

  test("renders repository data into every section", () => {
    const tables = doc.querySelectorAll("table.projects")
    expect(tables.length).toBe(3)
    for (const table of tables) {
      // Header row plus at least one data row.
      expect(table.querySelectorAll("tr").length).toBeGreaterThan(1)
    }
    const stats = [...doc.querySelectorAll("table.stats .num")].map((el) =>
      el.textContent?.trim(),
    )
    expect(stats).toHaveLength(4)
    for (const stat of stats) expect(stat).toMatch(/^\d[\d,]*$/)
  })

  test("all in-page anchors point at existing ids", () => {
    const hrefs = [...doc.querySelectorAll('a[href^="#"]')].map((a) =>
      a.getAttribute("href")!.slice(1),
    )
    expect(hrefs.length).toBeGreaterThan(0)
    for (const id of hrefs) {
      expect(doc.getElementById(id), `#${id}`).not.toBeNull()
    }
  })

  test("no links to the removed /modern site", () => {
    expect(doc.querySelector('a[href^="/modern"]')).toBeNull()
  })
})

describe("internal links", () => {
  test.each(["index.html", "404.html"])("%s links resolve in dist", (file) => {
    const doc = html(file)
    const internal = [...doc.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href")!)
      .filter((href) => href.startsWith("/"))
      .map((href) => href.split("#")[0])
      .filter((href) => href !== "")
    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) {
      expect(existsInDist(href), href).toBe(true)
    }
  })
})

describe("404 page", () => {
  test("exists and links home", () => {
    const doc = html("404.html")
    expect(doc.body.textContent).toMatch(/4 0 4/)
    expect(doc.querySelector('a[href="/"]')).not.toBeNull()
  })
})

describe("crawler files", () => {
  test("robots.txt points at the sitemap index", () => {
    expect(read("robots.txt")).toContain(
      "Sitemap: https://jordond.dev/sitemap-index.xml",
    )
  })

  test("sitemap lists the home page only", () => {
    expect(read("sitemap-index.xml")).toContain(
      "https://jordond.dev/sitemap-0.xml",
    )
    const sitemap = read("sitemap-0.xml")
    expect(sitemap).toContain("<loc>https://jordond.dev/</loc>")
    expect(sitemap).not.toContain("/modern")
  })

  test("static assets are copied", () => {
    for (const file of ["favicon.svg", "resume.pdf", "og-image.png"]) {
      expect(existsSync(join(dist, file)), file).toBe(true)
    }
  })
})
