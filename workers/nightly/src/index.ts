// Kicks off the site's Deploy workflow on a Cloudflare cron so repo stars and
// info stay fresh. GitHub disables its own scheduled workflows after 60 days
// without repo activity; Cloudflare cron triggers don't have that problem.

const GITHUB_API_BASE = "https://api.github.com"
const REPO = "jordond/jordond.dev"
const WORKFLOW = "deploy.yml"
const REF = "main"

interface Env {
  // Fine-grained PAT scoped to this repo with "Actions: Read and write"
  GITHUB_TOKEN: string
}

export default {
  async scheduled(_controller: unknown, env: Env) {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "User-Agent": "jordond-dev-nightly",
        },
        body: JSON.stringify({ ref: REF }),
      },
    )

    // Throwing marks the cron run as failed in Workers observability
    if (!response.ok) {
      throw new Error(
        `Dispatching ${WORKFLOW} failed: ${response.status} ${await response.text()}`,
      )
    }
  },
}
