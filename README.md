# jordond.dev

Personal portfolio site built with Astro and Tailwind CSS.

## Setup

```bash
pnpm install
pnpm fetch-repos
```

## Development

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm preview  # Preview production build
```

## Note

You must run `pnpm fetch-repos` before `pnpm build`. This fetches repository data from GitHub and generates `src/data/repos.json`. Set `GITHUB_TOKEN` env var for higher API rate limits.
