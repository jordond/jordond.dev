import type { RepoConfig } from "../types/repo"

/**
 * List of repositories to feature on the portfolio
 * Order determines display order
 */
export const repos: RepoConfig[] = [
  { name: "MaterialKolor", featured: true },
  { name: "compass" },
  { name: "kmpalette", hideHomepage: true },
  { name: "jolt", type: "app", featured: true },
  { name: "drag-select-compose" },
  { name: "connectivity" },
  { name: "stateholder" },
]

export const GITHUB_API_BASE = "https://api.github.com"

export const DEFAULT_OWNER = "jordond"
