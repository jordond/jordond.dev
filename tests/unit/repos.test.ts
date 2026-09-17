import { describe, expect, test } from "vitest"
import {
  countOwnStars,
  localAppToRepoData,
  localRepoToRepoData,
  parseGitHubRepoUrl,
  sortByStars,
  toRepoData,
  type GitHubRepoResponse,
} from "../../scripts/lib/repos"

const api: GitHubRepoResponse = {
  name: "MaterialKolor",
  full_name: "jordond/MaterialKolor",
  description: "Material 3 color schemes",
  html_url: "https://github.com/jordond/MaterialKolor",
  homepage: "https://materialkolor.com",
  stargazers_count: 1234,
  language: "Kotlin",
  topics: ["kotlin", "compose"],
}

describe("parseGitHubRepoUrl", () => {
  test("extracts owner and name", () => {
    expect(parseGitHubRepoUrl("https://github.com/jordond/jolt")).toEqual({
      owner: "jordond",
      name: "jolt",
    })
  })

  test("ignores trailing path, hash and query", () => {
    expect(
      parseGitHubRepoUrl(
        "https://github.com/jordond/jolt/tree/main?x=1#readme",
      ),
    ).toEqual({ owner: "jordond", name: "jolt" })
  })

  test("returns null for non-GitHub URLs", () => {
    expect(parseGitHubRepoUrl("https://example.com/jordond/jolt")).toBeNull()
  })
})

describe("toRepoData", () => {
  test("defaults to library type and keeps homepage", () => {
    const repo = toRepoData({ name: "MaterialKolor" }, api)
    expect(repo.type).toBe("library")
    expect(repo.homepage).toBe("https://materialkolor.com")
    expect(repo.topics).toEqual(["kotlin", "compose"])
  })

  test("hides homepage when configured", () => {
    const repo = toRepoData({ name: "MaterialKolor", hideHomepage: true }, api)
    expect(repo.homepage).toBeNull()
  })

  test("uses configured type and defaults missing topics", () => {
    const repo = toRepoData(
      { name: "jolt", type: "tool" },
      { ...api, topics: undefined },
    )
    expect(repo.type).toBe("tool")
    expect(repo.topics).toEqual([])
  })
})

describe("countOwnStars", () => {
  test("sums stars and skips forks", () => {
    expect(
      countOwnStars([
        { stargazers_count: 10, fork: false },
        { stargazers_count: 999, fork: true },
        { stargazers_count: 5, fork: false },
      ]),
    ).toBe(15)
  })

  test("returns 0 for no repos", () => {
    expect(countOwnStars([])).toBe(0)
  })
})

describe("localAppToRepoData", () => {
  const app = {
    name: "WhaleSay",
    description: "Docker desktop client",
    homepage: "https://whalesay.app",
    og_image: "whalesay",
    open_source: true,
    role: "Author",
    links: {
      github: "https://github.com/jordond/whalesay",
      app_store: "https://apps.apple.com/app/id1",
    },
    topics: ["macos"],
  }

  test("merges live GitHub data when available", () => {
    const repo = localAppToRepoData(app, {
      ...toRepoData({ name: "whalesay", type: "app" }, api),
      full_name: "jordond/whalesay",
      html_url: "https://github.com/jordond/whalesay",
      stargazers_count: 42,
    })
    expect(repo).toMatchObject({
      type: "app",
      full_name: "jordond/whalesay",
      html_url: "https://github.com/jordond/whalesay",
      stargazers_count: 42,
      role: "Author",
      image: "whalesay",
      links: { appStore: "https://apps.apple.com/app/id1" },
    })
  })

  test("falls back to local data when fetch failed", () => {
    const repo = localAppToRepoData(app, null)
    expect(repo.full_name).toBe("")
    expect(repo.html_url).toBe("https://github.com/jordond/whalesay")
    expect(repo.stargazers_count).toBe(0)
  })

  test("closed-source app without links has no links", () => {
    const repo = localAppToRepoData(
      { name: "Private", description: "d", open_source: false },
      null,
    )
    expect(repo.links).toBeUndefined()
    expect(repo.html_url).toBe("")
    expect(repo.homepage).toBeNull()
  })
})

describe("localRepoToRepoData", () => {
  test("fills in defaults", () => {
    const repo = localRepoToRepoData({ name: "thing" }, "tool")
    expect(repo).toEqual({
      name: "thing",
      type: "tool",
      full_name: "",
      description: null,
      html_url: "",
      homepage: null,
      language: null,
      stargazers_count: 0,
      topics: [],
    })
  })
})

describe("sortByStars", () => {
  test("sorts descending without mutating input", () => {
    const input = [
      { name: "a", stargazers_count: 1 },
      { name: "b", stargazers_count: 3 },
      { name: "c", stargazers_count: 2 },
    ]
    const sorted = sortByStars(input)
    expect(sorted.map((r) => r.name)).toEqual(["b", "c", "a"])
    expect(input.map((r) => r.name)).toEqual(["a", "b", "c"])
  })
})
