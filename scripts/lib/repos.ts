import type { RepoConfig, RepoData, RepoType } from "../../src/types/repo"

/**
 * Subset of the GitHub REST `GET /repos/{owner}/{repo}` response we read.
 */
export interface GitHubRepoResponse {
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  stargazers_count: number
  language: string | null
  topics?: string[]
}

/**
 * Subset of the GitHub REST `GET /users/{user}/repos` items we read.
 */
export interface GitHubUserRepo {
  stargazers_count: number
  fork: boolean
}

/**
 * Hand-maintained app entry from `src/data/data.json`.
 */
export interface LocalApp {
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
}

/**
 * Hand-maintained tool/library entry from `src/data/data.json`. Mirrors
 * `RepoData` but every GitHub-derived field is optional.
 */
export interface LocalRepo {
  name: string
  full_name?: string
  description?: string | null
  html_url?: string
  homepage?: string | null
  stargazers_count?: number
  language?: string | null
  topics?: string[]
  image?: string
}

/**
 * Shape of `src/data/data.json`.
 */
export interface LocalData {
  apps?: LocalApp[]
  tools?: LocalRepo[]
  libraries?: LocalRepo[]
}

/**
 * Extracts `owner` and `name` from a github.com repository URL.
 */
export function parseGitHubRepoUrl(
  url: string,
): { owner: string; name: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/#?]+)/)
  if (!match) return null
  const [, owner, name] = match
  return { owner, name }
}

/**
 * Maps a GitHub API response onto our `RepoData`, honouring per-repo config.
 */
export function toRepoData(
  config: RepoConfig,
  api: GitHubRepoResponse,
): RepoData {
  return {
    name: api.name,
    full_name: api.full_name,
    description: api.description,
    html_url: api.html_url,
    homepage: config.hideHomepage ? null : api.homepage,
    stargazers_count: api.stargazers_count,
    language: api.language,
    topics: api.topics ?? [],
    type: config.type ?? "library",
    image: config.image,
    links: config.links,
  }
}

/**
 * Sums stars across a user's non-fork repositories.
 */
export function countOwnStars(repos: GitHubUserRepo[]): number {
  return repos.reduce(
    (total, repo) => (repo.fork ? total : total + repo.stargazers_count),
    0,
  )
}

/**
 * Builds the `RepoData` for a hand-maintained app. `fetched` is the live
 * GitHub data for open-source apps, or `null` when unavailable.
 */
export function localAppToRepoData(
  app: LocalApp,
  fetched: RepoData | null,
): RepoData {
  return {
    name: app.name,
    full_name: fetched?.full_name ?? "",
    description: app.description,
    html_url: fetched?.html_url || app.links?.github || "",
    homepage: app.homepage || null,
    stargazers_count: fetched?.stargazers_count ?? 0,
    language: null,
    topics: app.topics ?? [],
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
  }
}

/**
 * Fills in defaults for a hand-maintained tool or library entry.
 */
export function localRepoToRepoData(
  repo: LocalRepo,
  type: Exclude<RepoType, "app">,
): RepoData {
  return {
    ...repo,
    type,
    full_name: repo.full_name ?? "",
    description: repo.description ?? null,
    html_url: repo.html_url ?? "",
    homepage: repo.homepage ?? null,
    language: repo.language ?? null,
    stargazers_count: repo.stargazers_count ?? 0,
    topics: repo.topics ?? [],
  }
}

/**
 * Returns a new array sorted by stars, highest first. Stable for ties.
 */
export function sortByStars<T extends { stargazers_count: number }>(
  items: readonly T[],
): T[] {
  return items.slice().sort((a, b) => b.stargazers_count - a.stargazers_count)
}
