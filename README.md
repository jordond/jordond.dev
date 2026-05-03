# jordond.dev

Personal portfolio site built with Astro and Tailwind CSS.

## Setup

```bash
bun install
bun run fetch-repos
```

## Development

```bash
bun run dev      # Start dev server
bun run build    # Production build
bun run preview  # Preview production build
```

## Note

You must run `bun run fetch-repos` before `bun run build`. This fetches repository data from GitHub and generates `src/data/repos.json`. Set `GITHUB_TOKEN` env var for higher API rate limits.
