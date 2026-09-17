import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs"
import { repos, GITHUB_API_BASE, DEFAULT_OWNER } from "../src/config/repos"
import type { RepoConfig, RepoData, GroupedRepoData } from "../src/types/repo"
import {
  countOwnStars,
  localAppToRepoData,
  localRepoToRepoData,
  parseGitHubRepoUrl,
  sortByStars,
  toRepoData,
  type GitHubRepoResponse,
  type GitHubUserRepo,
  type LocalData,
} from "./lib/repos"

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "jordond-portfolio",
  }
  if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`
  return headers
}

async function fetchRepo(config: RepoConfig): Promise<RepoData | null> {
  const owner = config.owner ?? DEFAULT_OWNER
  const url = `${GITHUB_API_BASE}/repos/${owner}/${config.name}`

  try {
    const response = await fetch(url, { headers: githubHeaders() })

    if (!response.ok) {
      console.warn(
        `⚠️ Failed to fetch ${owner}/${config.name}: ${response.status}`,
      )
      return null
    }

    const data: GitHubRepoResponse = await response.json()
    return toRepoData(config, data)
  } catch (error) {
    console.error(`❌ Error fetching ${owner}/${config.name}:`, error)
    return null
  }
}

async function fetchTotalUserStars(user: string): Promise<number> {
  let total = 0
  for (let page = 1; page < 20; page++) {
    const url = `${GITHUB_API_BASE}/users/${user}/repos?per_page=100&page=${page}&type=owner`
    const response = await fetch(url, { headers: githubHeaders() })
    if (!response.ok) {
      console.warn(
        `⚠️ Failed to fetch user repos page ${page}: ${response.status}`,
      )
      break
    }
    const data: GitHubUserRepo[] = await response.json()
    if (data.length === 0) break
    total += countOwnStars(data)
    if (data.length < 100) break
  }
  return total
}

async function main() {
  console.log("🚀 Fetching repository data from GitHub...\n")

  if (!GITHUB_TOKEN) {
    console.log(
      "ℹ️  No GITHUB_TOKEN found. Using unauthenticated requests (60/hour limit).\n",
    )
  }

  const results: GroupedRepoData = {
    apps: [],
    tools: [],
    libraries: [],
    totalUserStars: 0,
  }

  results.totalUserStars = await fetchTotalUserStars(DEFAULT_OWNER)
  console.log(
    `⭐ Total stars across all ${DEFAULT_OWNER} repos: ${results.totalUserStars}\n`,
  )

  for (const repoConfig of repos) {
    console.log(
      `📦 Fetching ${repoConfig.owner ?? DEFAULT_OWNER}/${repoConfig.name}...`,
    )
    const data = await fetchRepo(repoConfig)
    if (data) {
      if (data.type === "app") results.apps.push(data)
      else if (data.type === "tool") results.tools.push(data)
      else results.libraries.push(data)
      console.log(`   ⭐ ${data.stargazers_count} stars`)
    }
  }

  const localDataPath = "src/data/data.json"
  if (existsSync(localDataPath)) {
    console.log(`\n📂 Processing local data from ${localDataPath}...`)
    const localData: LocalData = JSON.parse(
      readFileSync(localDataPath, "utf-8"),
    )

    for (const app of localData.apps ?? []) {
      /* Open-source apps fetch live star count + full_name so the card shows real social proof. */
      let fetched: RepoData | null = null
      const source =
        app.open_source && app.links?.github
          ? parseGitHubRepoUrl(app.links.github)
          : null
      if (source) {
        console.log(`📦 Fetching ${source.owner}/${source.name} (app)...`)
        fetched = await fetchRepo({ ...source, type: "app" })
        if (fetched) console.log(`   ⭐ ${fetched.stargazers_count} stars`)
      }
      results.apps.push(localAppToRepoData(app, fetched))
    }

    for (const tool of localData.tools ?? []) {
      results.tools.push(localRepoToRepoData(tool, "tool"))
    }

    for (const lib of localData.libraries ?? []) {
      results.libraries.push(localRepoToRepoData(lib, "library"))
    }
  }

  /* Apps preserve insertion order from data.json; tools/libraries sort by stars. */
  results.tools = sortByStars(results.tools)
  results.libraries = sortByStars(results.libraries)

  if (results.libraries.length === 0) {
    throw new Error(
      "No libraries were fetched. Refusing to write an empty repos.json.",
    )
  }

  const dataDir = "src/data"
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const outputPath = `${dataDir}/repos.json`
  writeFileSync(outputPath, JSON.stringify(results, null, 2))

  console.log(`\n✅ Successfully processed repositories`)
  console.log(`📄 Data saved to ${outputPath}`)
}

main().catch((error) => {
  console.error("❌ fetch-repos failed:", error)
  process.exit(1)
})
