import type { RepoConfig } from "../types/repo"

/**
 * List of repositories to feature on the portfolio
 * Order determines display order
 */
export const repos: RepoConfig[] = [
  { owner: "jordond", name: "MaterialKolor", featured: true },
  { owner: "jordond", name: "compass" },
  { owner: "jordond", name: "kmpalette", hideHomepage: true },
  { owner: "jordond", name: "jolt", featured: true },
  { owner: "jordond", name: "drag-select-compose" },
  { owner: "jordond", name: "connectivity" },
  { owner: "jordond", name: "stateholder" },
]

export const GITHUB_API_BASE = "https://api.github.com"

export const DEFAULT_OWNER = "jordond"
