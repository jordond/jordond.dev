import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs"
import { repos, GITHUB_API_BASE, DEFAULT_OWNER } from "../src/config/repos"
import type { RepoConfig, RepoData, GroupedRepoData } from "../src/types/repo"

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

interface LocalData {
  apps?: Array<{
    name: string
    description: string
    homepage?: string
    og_image?: string
    open_source: boolean
    role?: string
    links?: {
      github?: string
      play_store?: string
      app_store?: string
      windows?: string
      macos?: string
      linux?: string
    }
    topics?: string[]
  }>
  tools?: Array<any>
  libraries?: Array<any>
}

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
      image: config.image,
      links: config.links,
    }
  } catch (error) {
    console.error(
      `❌ Error fetching ${config.owner ?? DEFAULT_OWNER}/${config.name}:`,
      error,
    )
    return null
  }
}

async function fetchTotalUserStars(user: string): Promise<number> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "jordond-portfolio",
  }
  if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`

  let total = 0
  for (let page = 1; page < 20; page++) {
    const url = `${GITHUB_API_BASE}/users/${user}/repos?per_page=100&page=${page}&type=owner`
    const response = await fetch(url, { headers })
    if (!response.ok) {
      console.warn(
        `⚠️ Failed to fetch user repos page ${page}: ${response.status}`,
      )
      break
    }
    const data: Array<{ stargazers_count: number; fork: boolean }> =
      await response.json()
    if (data.length === 0) break
    for (const repo of data) {
      if (!repo.fork) total += repo.stargazers_count
    }
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

    if (localData.apps) {
      for (const app of localData.apps) {
        /* Open-source apps fetch live star count + full_name so the card shows real social proof. */
        let stargazers = 0
        let fullName = ""
        let htmlUrl = app.links?.github || ""

        if (app.open_source && app.links?.github) {
          const match = app.links.github.match(
            /github\.com\/([^/]+)\/([^/#?]+)/,
          )
          if (match) {
            const [, owner, name] = match
            console.log(`📦 Fetching ${owner}/${name} (app)...`)
            const fetched = await fetchRepo({ owner, name, type: "app" })
            if (fetched) {
              stargazers = fetched.stargazers_count
              fullName = fetched.full_name
              htmlUrl = fetched.html_url || htmlUrl
              console.log(`   ⭐ ${stargazers} stars`)
            }
          }
        }

        results.apps.push({
          name: app.name,
          full_name: fullName,
          description: app.description,
          html_url: htmlUrl,
          homepage: app.homepage || null,
          stargazers_count: stargazers,
          language: null,
          topics: app.topics || [],
          type: "app",
          image: app.og_image,
          role: app.role,
          links: app.links
            ? {
                playStore: app.links.play_store,
                appStore: app.links.app_store,
                windows: app.links.windows,
                macos: app.links.macos,
                linux: app.links.linux,
              }
            : undefined,
        })
      }
    }

    if (localData.tools) {
      for (const tool of localData.tools) {
        results.tools.push({
          ...tool,
          type: "tool",
          full_name: tool.full_name || "",
          stargazers_count: tool.stargazers_count || 0,
          topics: tool.topics || [],
        })
      }
    }

    if (localData.libraries) {
      for (const lib of localData.libraries) {
        results.libraries.push({
          ...lib,
          type: "library",
          full_name: lib.full_name || "",
          stargazers_count: lib.stargazers_count || 0,
          topics: lib.topics || [],
        })
      }
    }
  }

  /* Apps preserve insertion order from data.json; tools/libraries sort by stars. */
  results.tools.sort((a, b) => b.stargazers_count - a.stargazers_count)
  results.libraries.sort((a, b) => b.stargazers_count - a.stargazers_count)

  const dataDir = "src/data"
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const outputPath = `${dataDir}/repos.json`
  writeFileSync(outputPath, JSON.stringify(results, null, 2))

  console.log(`\n✅ Successfully processed repositories`)
  console.log(`📄 Data saved to ${outputPath}`)
}

main().catch(console.error)
