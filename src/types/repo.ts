/**
 * Repository type classification
 */
export type RepoType = "library" | "tool" | "app"

/**
 * Configuration for a repository to feature
 */
export interface RepoConfig {
  /** GitHub username/org */
  owner?: string
  /** Repository name */
  name: string
  /** Repository type (library, app or tool) */
  type?: RepoType
  /** Hide the homepage URL from display */
  hideHomepage?: boolean
  ogImage?: boolean
  /** OG image for apps */
  image?: string
  /** Store links for apps */
  links?: {
    playStore?: string
    appStore?: string
    windows?: string
    macos?: string
    linux?: string
  }
}

/**
 * Repository data fetched from GitHub API
 */
export interface RepoData {
  /** Repository name */
  name: string
  /** Full name (owner/repo) */
  full_name: string
  /** Repository description */
  description: string | null
  /** GitHub URL */
  html_url: string
  /** Homepage/website URL */
  homepage: string | null
  /** Star count */
  stargazers_count: number
  /** Primary programming language */
  language: string | null
  /** Topic tags */
  topics: string[]
  /** Repository type (library, app or tool) */
  type: RepoType
  /** OG image for apps */
  image?: string
  /** Store links for apps */
  links?: {
    playStore?: string
    appStore?: string
    windows?: string
    macos?: string
    linux?: string
  }
}

/**
 * Grouped repository data
 */
export interface GroupedRepoData {
  apps: RepoData[]
  tools: RepoData[]
  libraries: RepoData[]
}
