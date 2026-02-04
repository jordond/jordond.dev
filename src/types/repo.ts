/**
 * Configuration for a repository to feature
 */
export interface RepoConfig {
  /** GitHub username/org */
  owner: string
  /** Repository name */
  name: string
  /** Whether to feature prominently */
  featured?: boolean
  /** Hide the homepage URL from display */
  hideHomepage?: boolean
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
  /** Whether this is a featured project */
  featured?: boolean
}
