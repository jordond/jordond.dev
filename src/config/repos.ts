import type { RepoConfig } from "../types/repo"

/* Order within each category determines display order. */
export const repos: RepoConfig[] = [
  { name: "MaterialKolor" },
  { name: "compass" },
  { name: "kmpalette", hideHomepage: true },
  { name: "jolt", type: "tool" },
  { name: "compose-resources-kit", type: "tool" },
  { name: "drag-select-compose" },
  { name: "connectivity" },
  { name: "stateholder" },
]

export const GITHUB_API_BASE = "https://api.github.com"

export const DEFAULT_OWNER = "jordond"
