export const skills = [
  "Kotlin",
  "Kotlin Multiplatform",
  "Compose",
  "Android",
  "TypeScript",
  "Rust",
]

export interface CommunityItem {
  title: string
  source: string
  role: string
  description: string
  url: string
  videoId?: string
}

export const community: CommunityItem[] = [
  {
    title: "Media & Camera Experiences",
    source: "Android Build Time",
    role: "Guest Speaker",
    description:
      "Discussed Android Media APIs, handling diverse media formats, and performance strategies for efficient media editing.",
    url: "https://www.youtube.com/watch?v=nWXmrY8J_nY",
    videoId: "nWXmrY8J_nY",
  },
]
