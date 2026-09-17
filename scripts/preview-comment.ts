/**
 * Builds the sticky PR comment for the Preview workflow.
 *
 *   bun run scripts/preview-comment.ts collect
 *     Run after the visual tests and before the preview upload. Copies the
 *     page screenshots and any regression diffs into `dist/__screenshots__/`
 *     so they ship with the preview deployment, and writes a summary JSON.
 *
 *   bun run scripts/preview-comment.ts render
 *     Run after the preview upload. Reads the summary plus PREVIEW_URL,
 *     HEAD_SHA, RUN_URL and PR_NUMBER from the environment and writes
 *     `comment.md`.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"

const RESULTS = "test-results/results.json"
// Lives outside test-results/ because Playwright empties that directory at the
// start of every run, including the baseline-recording run in CI.
const SUMMARY = "visual-summary.json"
const SCREENSHOT_DIR = "screenshots"
const OUT_DIR = "dist/__screenshots__"
const COMMENT = "comment.md"

const PAGES = ["home", "404"] as const
const VARIANTS = ["desktop", "mobile"] as const

type Status = "passed" | "changed" | "missing" | "error"

interface VisualResult {
  page: string
  variant: string
  status: Status
  message?: string
  diff?: string
  actual?: string
  expected?: string
}

interface Summary {
  screenshots: string[]
  results: VisualResult[]
}

/* Subset of Playwright's JSON reporter output that we read. */
interface JsonAttachment {
  name: string
  path?: string
}
interface JsonResult {
  status: string
  errors?: { message?: string }[]
  attachments?: JsonAttachment[]
}
interface JsonTest {
  projectName: string
  status: string
  results: JsonResult[]
}
interface JsonSpec {
  title: string
  tests: JsonTest[]
}
interface JsonSuite {
  suites?: JsonSuite[]
  specs?: JsonSpec[]
}
interface JsonReport {
  suites?: JsonSuite[]
}

function* walkSpecs(suites: JsonSuite[] = []): Generator<JsonSpec> {
  for (const suite of suites) {
    yield* suite.specs ?? []
    yield* walkSpecs(suite.suites)
  }
}

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "")
}

function collect() {
  mkdirSync(join(OUT_DIR, "diff"), { recursive: true })

  const screenshots: string[] = []
  if (existsSync(SCREENSHOT_DIR)) {
    for (const file of readdirSync(SCREENSHOT_DIR).sort()) {
      if (!file.endsWith(".png")) continue
      copyFileSync(join(SCREENSHOT_DIR, file), join(OUT_DIR, file))
      screenshots.push(file)
    }
  }

  const results: VisualResult[] = []
  if (existsSync(RESULTS)) {
    const report: JsonReport = JSON.parse(readFileSync(RESULTS, "utf-8"))
    for (const spec of walkSpecs(report.suites)) {
      for (const test of spec.tests) {
        if (!test.projectName.startsWith("visual-")) continue
        const variant = test.projectName.slice("visual-".length)
        const entry: VisualResult = {
          page: spec.title,
          variant,
          status: "passed",
        }
        const last = test.results.at(-1)
        if (test.status !== "expected" && last) {
          const message = stripAnsi(
            last.errors?.map((e) => e.message ?? "").join("\n") ?? "",
          )
          entry.message = message.split("\n")[0]
          entry.status = /snapshot doesn't exist/i.test(message)
            ? "missing"
            : /toHaveScreenshot/.test(message)
              ? "changed"
              : "error"
          for (const kind of ["diff", "actual", "expected"] as const) {
            const attachment = last.attachments?.find(
              (a) => a.name.endsWith(`-${kind}.png`) && a.path,
            )
            if (attachment?.path && existsSync(attachment.path)) {
              const file = `diff/${spec.title}-${variant}-${kind}.png`
              copyFileSync(attachment.path, join(OUT_DIR, file))
              entry[kind] = file
            }
          }
        }
        results.push(entry)
      }
    }
  }

  writeFileSync(SUMMARY, JSON.stringify({ screenshots, results }, null, 2))
  console.log(
    `Collected ${screenshots.length} screenshot(s), ${results.length} visual result(s)`,
  )
}

function render() {
  const previewUrl = (process.env.PREVIEW_URL ?? "").replace(/\/$/, "")
  const sha = process.env.HEAD_SHA ?? ""
  const runUrl = process.env.RUN_URL ?? ""
  const prNumber = process.env.PR_NUMBER ?? ""
  const summary: Summary = existsSync(SUMMARY)
    ? JSON.parse(readFileSync(SUMMARY, "utf-8"))
    : { screenshots: [], results: [] }

  const asset = (file: string) =>
    `${previewUrl}/__screenshots__/${file}?v=${sha.slice(0, 7)}`
  const img = (file: string, width: number) =>
    summary.screenshots.includes(file)
      ? `<a href="${asset(file)}"><img src="${asset(file)}" width="${width}" alt="${file}"></a>`
      : "_missing_"

  const lines: string[] = []
  lines.push("### ✅ Preview deployed", "")
  lines.push("| | |", "| --- | --- |")
  lines.push(`| **URL** | ${previewUrl} |`)
  lines.push(`| **Commit** | ${sha} |`, "")

  lines.push("### 📸 Screenshots", "")
  lines.push("<table>")
  lines.push("<tr><th>Desktop</th><th>Mobile</th></tr>")
  lines.push(
    `<tr><td>${img("home-desktop.png", 480)}</td><td>${img("home-mobile.png", 200)}</td></tr>`,
  )
  lines.push("</table>", "")
  lines.push("<details><summary>404 page</summary>", "")
  lines.push("<table>")
  lines.push("<tr><th>Desktop</th><th>Mobile</th></tr>")
  lines.push(
    `<tr><td>${img("404-desktop.png", 480)}</td><td>${img("404-mobile.png", 200)}</td></tr>`,
  )
  lines.push("</table>", "")
  lines.push("</details>", "")

  const count = (status: Status) =>
    summary.results.filter((r) => r.status === status).length
  const changed = count("changed")
  const missing = count("missing")
  const errored = count("error")

  let heading: string
  if (summary.results.length === 0) {
    heading = "❌ Visual regression: no results (tests did not run)"
  } else if (errored > 0) {
    heading = `❌ Visual regression: ${errored} test(s) errored`
  } else if (changed > 0) {
    heading = `⚠️ Visual regression: ${changed} screenshot(s) changed`
  } else if (missing > 0) {
    heading = `🆕 Visual regression: ${missing} baseline(s) missing`
  } else {
    heading = "✅ Visual regression: no changes"
  }
  lines.push(`### ${heading}`, "")

  if (summary.results.length > 0) {
    lines.push("| Page | Desktop | Mobile |", "| --- | --- | --- |")
    for (const page of PAGES) {
      const cells = VARIANTS.map((variant) => {
        const result = summary.results.find(
          (r) => r.page === page && r.variant === variant,
        )
        if (!result) return "–"
        const link = (label: string, file?: string) =>
          file ? `[${label}](${asset(file)})` : null
        switch (result.status) {
          case "passed":
            return "✅"
          case "changed":
            return [
              "⚠️",
              link("diff", result.diff),
              link("actual", result.actual),
              link("expected", result.expected),
            ]
              .filter(Boolean)
              .join(" · ")
          case "missing":
            return ["🆕", link("actual", result.actual)]
              .filter(Boolean)
              .join(" · ")
          default:
            return `❌ ${result.message ?? "error"}`
        }
      })
      lines.push(`| ${page} | ${cells.join(" | ")} |`)
    }
    lines.push("")
  }

  if (changed > 0 || missing > 0) {
    // Ticking this box fires .github/workflows/visual-accept.yml, which
    // commits the CI-rendered screenshots to the PR branch. The HTML comment
    // is the marker that workflow looks for; keep it on the same line.
    lines.push(
      "- [ ] **Accept these screenshots as the new baselines** (commits them to this branch) <!-- accept-baselines -->",
      "",
      "Or from your machine:",
      "",
      "```sh",
      `gh pr checkout ${prNumber}`,
      "bun run visual:accept",
      "```",
      "",
      "then review and commit `tests/e2e/__screenshots__/`.",
      "",
    )
  }
  if (runUrl && (changed > 0 || missing > 0 || errored > 0)) {
    lines.push(`[Workflow run](${runUrl})`, "")
  }

  lines.push("_Updates on every push to this PR._")
  writeFileSync(COMMENT, lines.join("\n") + "\n")
  console.log(`Wrote ${COMMENT}`)
}

const command = process.argv[2]
if (command === "collect") collect()
else if (command === "render") render()
else {
  console.error("Usage: preview-comment.ts <collect|render>")
  process.exit(1)
}
