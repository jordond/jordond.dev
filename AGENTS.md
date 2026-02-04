# AGENTS.md

Guidelines for AI agents working on jordond.dev - a personal portfolio site built with Astro.

## Project Overview

- **Framework**: Astro v5 (static site generator)
- **Styling**: Tailwind CSS v4 with CSS custom properties for theming
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm (v10.26.2)
- **Node Version**: 24+

## Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build

# Code Quality
pnpm format           # Format all files with Prettier
pnpm format:check     # Check formatting without changes

# Data Fetching
pnpm fetch-repos      # Fetch GitHub repo data (requires GITHUB_TOKEN)
```

### Pre-commit Hooks

Husky runs `lint-staged` on commit, which auto-formats `*.{ts,css,md,astro}` files with Prettier.

## Project Structure

```
src/
├── assets/           # Static images (processed by Astro)
├── components/       # Astro components (PascalCase.astro)
├── config/           # Configuration and static data
├── data/             # Generated data (gitignored)
├── layouts/          # Page layouts
├── pages/            # Routes (file-based routing)
├── styles/           # Global CSS
└── types/            # TypeScript type definitions
scripts/              # Build-time utilities
public/               # Static assets (copied as-is)
```

## Code Style

### Formatting (Prettier)

- **No semicolons**: `const x = 1` not `const x = 1;`
- **Trailing commas**: Always use trailing commas in multiline structures
- **Quotes**: Double quotes for JSX attributes, Prettier defaults elsewhere

### Naming Conventions

| Type                | Convention       | Example                            |
| ------------------- | ---------------- | ---------------------------------- |
| Components          | PascalCase       | `RepoCard.astro`, `Hero.astro`     |
| TypeScript files    | camelCase        | `fetch-repos.ts`, `data.ts`        |
| Types/Interfaces    | PascalCase       | `RepoConfig`, `RepoData`           |
| Constants           | UPPER_SNAKE_CASE | `GITHUB_API_BASE`, `DEFAULT_OWNER` |
| Functions/Variables | camelCase        | `fetchRepo`, `languageColors`      |

### Imports

```typescript
// 1. Type imports first (use `import type`)
import type { RepoConfig, RepoData } from "../types/repo"

// 2. External packages
import { writeFileSync } from "fs"

// 3. Internal modules (relative paths, no aliases)
import { repos, GITHUB_API_BASE } from "../config/repos"
```

**No path aliases configured** - use relative imports (`../`, `./`).

### Exports

- **Named exports** for configs, types, utilities, and constants
- **Default exports** only for Astro components (automatic)

```typescript
// Good: Named exports
export const skills = ["Kotlin", "TypeScript"]
export interface CommunityItem { ... }
export type RepoType = "library" | "app"

// Avoid: Default exports in .ts files
export default { ... }  // Don't do this
```

## TypeScript Guidelines

### Type Definitions

Always add JSDoc comments to interfaces:

```typescript
/**
 * Configuration for a repository to feature
 */
export interface RepoConfig {
  /** GitHub username/org */
  owner?: string
  /** Repository name */
  name: string
  /** Whether to feature prominently */
  featured?: boolean
}
```

### Type Safety

- **Never use `as any`** - fix the actual type issue
- **Never use `@ts-ignore` or `@ts-expect-error`** - these hide real problems
- Use `import type` for type-only imports
- Use optional chaining (`?.`) and nullish coalescing (`??`) appropriately

```typescript
// Good
const owner = config.owner ?? DEFAULT_OWNER
const stars = repo?.stargazers_count ?? 0

// Bad
const owner = config.owner as any
```

## Astro Component Patterns

### Component Structure

```astro
---
// 1. Type imports
import type { RepoData } from "../types/repo"

// 2. Component imports
import ThemeToggle from "./ThemeToggle.astro"

// 3. Props interface
interface Props {
  repo: RepoData
  featured?: boolean
}

// 4. Props destructuring with defaults
const { repo, featured = false } = Astro.props

// 5. Component logic
const langColor = languageColors[repo.language || ""] || "#6B7280"
---

<!-- Template -->
<article class="...">...</article>
```

### Styling

- Use **Tailwind CSS utilities** as the primary styling method
- Use **CSS custom properties** for theme values: `var(--color-text)`, `var(--color-accent)`
- Use `class:list` for conditional classes in Astro

```astro
<div
  class:list={[
    "base-classes",
    featured && "featured-classes",
    `delay-${index * 100}`,
  ]}
>
</div>
```

### Theme Colors

```css
--color-accent       /* Primary accent (teal) */
--color-bg           /* Page background */
--color-surface      /* Card backgrounds */
--color-text         /* Primary text */
--color-text-muted   /* Secondary text */
```

## Error Handling

Use try-catch with graceful degradation:

```typescript
async function fetchRepo(config: RepoConfig): Promise<RepoData | null> {
  try {
    const response = await fetch(url, { headers })
    if (!response.ok) {
      console.warn(
        `Warning: Failed to fetch ${config.name}: ${response.status}`,
      )
      return null
    }
    return await response.json()
  } catch (error) {
    console.error(`Error: Failed to fetch ${config.name}:`, error)
    return null
  }
}
```

- Return `null` on error instead of throwing (for non-critical operations)
- Use `console.warn` for recoverable issues
- Use `console.error` for actual errors
- Continue processing other items if one fails

## Testing

No test framework is currently configured. When adding tests:

- Prefer Vitest for unit tests (compatible with Vite/Astro)
- Use Playwright for E2E tests if needed

## CI/CD

GitHub Actions workflow (`.github/workflows/`) runs on push/PR to main:

1. Install dependencies (`pnpm install`)
2. Fetch repo data (`pnpm fetch-repos`)
3. Build site (`pnpm build`)

## Common Tasks

### Adding a New Component

1. Create `src/components/ComponentName.astro`
2. Define `Props` interface with JSDoc comments
3. Use Tailwind + CSS custom properties for styling
4. Import and use in pages/layouts

### Adding a Featured Repository

Edit `src/config/repos.ts`:

```typescript
export const repos: RepoConfig[] = [
  { name: "new-repo", featured: true },
  // ...
]
```

### Modifying Theme Colors

Edit `src/styles/global.css` for CSS custom properties and `tailwind.config.mjs` for Tailwind theme extensions.
