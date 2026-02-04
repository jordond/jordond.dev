import { writeFileSync, mkdirSync, existsSync } from "fs"
import { repos, GITHUB_API_BASE, DEFAULT_OWNER } from "../src/config/repos"
import type { RepoConfig, RepoData, RepoType } from "../src/types/repo"

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

async function fetchRepo(config: RepoConfig): Promise<RepoData | null> {
  const url = `${GITHUB_API_BASE}/repos/${config.owner ?? DEFAULT_OWNER}/${config.name}`

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "jordond-portfolio",
  }

  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`
  }

  try {
    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.warn(
        `⚠️ Failed to fetch ${config.owner ?? DEFAULT_OWNER}/${config.name}: ${response.status}`,
      )
      return null
    }

    const data = await response.json()

    return {
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      html_url: data.html_url,
      homepage: config.hideHomepage ? null : data.homepage,
      stargazers_count: data.stargazers_count,
      language: data.language,
      topics: data.topics || [],
      type: config.type ?? "library",
      featured: config.featured || false,
    }
  } catch (error) {
    console.error(
      `❌ Error fetching ${config.owner ?? DEFAULT_OWNER}/${config.name}:`,
      error,
    )
    return null
  }
}

async function main() {
  console.log("🚀 Fetching repository data from GitHub...\n")

  if (!GITHUB_TOKEN) {
    console.log(
      "ℹ️  No GITHUB_TOKEN found. Using unauthenticated requests (60/hour limit).\n",
    )
  }

  const results: RepoData[] = []

  for (const repo of repos) {
    console.log(`📦 Fetching ${repo.owner ?? DEFAULT_OWNER}/${repo.name}...`)
    const data = await fetchRepo(repo)
    if (data) {
      results.push(data)
      console.log(`   ⭐ ${data.stargazers_count} stars`)
    }
  }

  // Ensure data directory exists
  const dataDir = "src/data"
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  // Write results
  const outputPath = `${dataDir}/repos.json`
  writeFileSync(outputPath, JSON.stringify(results, null, 2))

  console.log(
    `\n✅ Successfully fetched ${results.length}/${repos.length} repositories`,
  )
  console.log(`📄 Data saved to ${outputPath}`)
}

main().catch(console.error)
