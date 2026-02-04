import type { RepoConfig } from "../types/repo"

/**
 * List of repositories to feature on the portfolio
 * Order determines display order
 */
export const repos: RepoConfig[] = [
  { owner: "jordond", name: "MaterialKolor", featured: true },
  { owner: "jordond", name: "compass", featured: true },
  { owner: "jordond", name: "kmpalette" },
  { owner: "jordond", name: "jolt", featured: true },
  { owner: "jordond", name: "connectivity" },
]

export const GITHUB_API_BASE = "https://api.github.com"

export const DEFAULT_OWNER = "jordond"
