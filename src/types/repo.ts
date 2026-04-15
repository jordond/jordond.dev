export type RepoType = "library" | "tool" | "app"

export interface RepoConfig {
  owner?: string
  name: string
  type?: RepoType
  hideHomepage?: boolean
  ogImage?: boolean
  image?: string
  links?: {
    playStore?: string
    appStore?: string
    windows?: string
    macos?: string
    linux?: string
  }
}

export interface RepoData {
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  stargazers_count: number
  language: string | null
  topics: string[]
  type: RepoType
  image?: string
  role?: string
  links?: {
    playStore?: string
    appStore?: string
    windows?: string
    macos?: string
    linux?: string
  }
}

export interface GroupedRepoData {
  apps: RepoData[]
  tools: RepoData[]
  libraries: RepoData[]
  totalUserStars: number
}
