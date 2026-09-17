# jordond.dev

Personal portfolio site built with Astro. A single retro, 90s-styled page, with no CSS framework and no client-side JavaScript.

## Setup

```bash
bun install
bun run fetch-repos
```

## Development

```bash
bun run dev      # Start dev server
bun run build    # Production build
bun run preview  # Build, then preview with wrangler
```

## Testing

```bash
bun run test         # Full suite: unit, then smoke, then e2e
bun run test:unit    # Pure functions and worker logic
bun run test:smoke   # Parses the built dist/ output (run `bun run build` first)
bun run test:e2e     # Playwright against wrangler dev (run `bun run build` first;
                      #   first time, also run `bunx playwright install chromium`)
bun run check        # Type-check with astro check
```

## Note

You must run `bun run fetch-repos` before `bun run build`. This fetches repository data from GitHub and generates `src/data/repos.json`. Set `GITHUB_TOKEN` env var for higher API rate limits.
