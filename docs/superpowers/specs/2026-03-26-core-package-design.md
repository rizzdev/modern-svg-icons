# @modern-svg-icons/core — Package Design Spec

## Overview

Turn the existing 514 animated SVG icons into a production-ready, tree-shakeable npm package published as `@modern-svg-icons/core`. The package provides named TypeScript exports of optimized SVG strings, an optional metadata entrypoint for search/filtering, and a utility helper for runtime customization (disable animation, resize). Built via SVGO optimization + TypeScript compilation, published automatically via GitHub Actions on release.

Designed to scale to 10,000+ icons without impacting consumer bundle size.

## Repository Structure

```
modern-svg-icons/
├── icons/                              # Raw source SVGs (existing, unchanged)
│   ├── terminal.svg
│   ├── docker.svg
│   └── ... (514+ icons)
├── packages/
│   └── core/                           # @modern-svg-icons/core
│       ├── package.json
│       ├── README.md                   # npm-specific README (SEO/discoverability)
│       ├── tsconfig.json
│       └── src/
│           ├── icons/                  # Generated — one file per category
│           │   ├── dev-tools.ts
│           │   ├── security.ts
│           │   ├── ai-ml.ts
│           │   └── ...
│           ├── index.ts                # Generated — re-exports all icons + utils
│           ├── meta.ts                 # Generated — icon metadata catalog
│           └── utils.ts                # Hand-written — createIcon() helper
├── scripts/
│   ├── build.ts                        # Main build: SVGO → generate → compile
│   ├── generate-meta.ts                # Generates metadata from categories.json
│   └── categories.json                 # Hand-maintained: icon → category/tags mapping
├── gallery.html                        # Existing
├── PROMPT.md                           # Existing
├── README.md                           # Existing (repo-level)
├── package.json                        # Root workspace config
├── pnpm-workspace.yaml                 # Workspace definition
└── .github/
    └── workflows/
        ├── build.yml                   # Build + lint on push/PR
        └── publish.yml                 # Publish to npm on GitHub Release
```

### Key decisions

- `icons/` stays at the root as the single source of truth for all SVG files.
- Generated TypeScript files in `packages/core/src/icons/` are split by category for IDE performance at scale (10k+). They are `.gitignore`'d — they're build artifacts.
- Monorepo structure via pnpm workspaces — only `core` ships now, but `@modern-svg-icons/react`, `@modern-svg-icons/vue`, etc. can be added as `packages/react/`, `packages/vue/` later.
- The `utils.ts` file is hand-written and committed. Everything else in `src/` is generated.

## Package Exports & API

Three entrypoints via the `exports` field in `package.json`:

### Main — individual icon imports (tree-shakeable)

```ts
import { terminal, docker, kubernetes } from '@modern-svg-icons/core'

// Each export is a raw SVG string
document.getElementById('icon').innerHTML = terminal
```

Icon names are converted from kebab-case filenames to camelCase exports:
- `api-gateway.svg` → `apiGateway`
- `ci-cd.svg` → `ciCd`
- `200-ok.svg` → `http200Ok` (numeric-prefixed get an `http` prefix)
- `terminal.svg` → `terminal`

### Utils — customization helpers

```ts
import { createIcon } from '@modern-svg-icons/core/utils'
import { terminal } from '@modern-svg-icons/core'

// Strip animation
createIcon(terminal, { animated: false })

// Change size
createIcon(terminal, { size: 32 })

// Both
createIcon(terminal, { animated: false, size: 48 })
```

`createIcon()` performs lightweight string operations on the SVG:
- `animated: false` — removes the `<style>...</style>` block and any `class="..."` attributes referencing animation classes
- `size` — replaces the `width` and `height` attributes

### Meta — searchable catalog (opt-in)

```ts
import { iconMeta } from '@modern-svg-icons/core/meta'

iconMeta.terminal
// → { name: 'terminal', category: 'dev-tools', tags: ['cli', 'console', 'bash'] }

// Iterate all icons
Object.entries(iconMeta).forEach(([name, meta]) => {
  console.log(name, meta.category, meta.tags)
})
```

### package.json exports map

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils.js",
      "require": "./dist/utils.cjs",
      "types": "./dist/utils.d.ts"
    },
    "./meta": {
      "import": "./dist/meta.js",
      "require": "./dist/meta.cjs",
      "types": "./dist/meta.d.ts"
    }
  }
}
```

## Build Pipeline

**Build script (`scripts/build.ts`)** executes in order:

1. **Read** all `.svg` files from `icons/`
2. **Optimize** each through SVGO — minify, strip unnecessary attributes, normalize paths
3. **Load** `scripts/categories.json` for category/tag assignments
4. **Generate `icons/*.ts`** — one file per category, each containing `export const` declarations with optimized SVG strings
5. **Generate `index.ts`** — re-exports all icons from category files + exports from `utils.ts`
6. **Generate `meta.ts`** — typed metadata map keyed by icon name
7. **Compile** via `tsup` — outputs ESM (`.js`) + CJS (`.cjs`) + type declarations (`.d.ts`) to `packages/core/dist/`

### Category-split generation (10k+ scale)

Instead of one monolithic icons file, the build generates per-category modules:

```
packages/core/src/icons/
  dev-tools.ts        # export const terminal = '...'; export const code = '...';
  security.ts         # export const lock = '...'; export const shield = '...';
  ai-ml.ts            # export const aiBrain = '...'; export const neuralNetwork = '...';
  ...
```

`index.ts` re-exports everything:
```ts
export * from './icons/dev-tools'
export * from './icons/security'
export * from './icons/ai-ml'
// ...
```

The public API is unchanged — `import { terminal } from '@modern-svg-icons/core'` works regardless of internal file structure. The split keeps individual files manageable for IDE autocomplete and type-checking at scale.

### categories.json format

Hand-maintained file mapping each icon to its category and tags:

```json
{
  "terminal": { "category": "dev-tools", "tags": ["cli", "console", "bash"] },
  "docker": { "category": "infrastructure", "tags": ["container", "devops"] },
  "lock": { "category": "security", "tags": ["auth", "encryption"] }
}
```

Icons not listed in `categories.json` default to `{ category: "general", tags: [] }`. The build script warns about unmapped icons so they can be categorized before release.

### Dev commands

```bash
pnpm build          # Full build: optimize → generate → compile
pnpm build:icons    # Just regenerate from SVGs (after adding new icons)
```

## TypeScript Configuration

- Full `.d.ts` type declarations generated automatically by tsup
- Every icon export typed as `string`
- `createIcon` options typed via an `IconOptions` interface
- `iconMeta` typed as `Record<IconName, IconMeta>` where `IconName` is a union of all icon names
- Consumers get autocomplete for all icon names

### Key package.json fields

```json
{
  "name": "@modern-svg-icons/core",
  "version": "1.0.0",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "files": ["dist"],
  "keywords": [
    "svg", "icons", "animated", "material", "developer",
    "tree-shakeable", "typescript", "animated-icons"
  ]
}
```

`sideEffects: false` tells bundlers every export is safe to tree-shake.

## GitHub Actions CI/CD

### `build.yml` — on every push and PR

1. Checkout repo
2. Setup Node 20 + pnpm
3. `pnpm install`
4. `pnpm build` — full pipeline verification
5. `pnpm lint` — TypeScript compilation check, export validation
6. Runs on `ubuntu-latest`

### `publish.yml` — on GitHub Release creation

1. Same build steps as `build.yml`
2. `npm publish --access public` using `NPM_TOKEN` repository secret
3. Tag format: `v1.0.0` → publishes `@modern-svg-icons/core@1.0.0`

### Workflow for adding new icons

1. Generate SVGs (using PROMPT.md), drop them in `icons/`
2. Update `scripts/categories.json` with categories and tags
3. Push to master — CI builds and verifies
4. Create a GitHub Release with a semver tag → auto-publishes to npm

## Scalability

The design supports 10,000+ icons:

- **Consumer bundle size**: Tree-shaking ensures only imported icons are included. 10k icons in the package, 5 in the bundle.
- **Build time**: SVGO processes icons linearly — ~30-60s for 10k. One-time CI cost, not a consumer concern.
- **npm install size**: Grows with icon count (expected ~15-30MB at 10k), but only affects install time, not runtime. Normal for icon packages.
- **IDE performance**: Category-split generation keeps individual files manageable. No single file with 10k exports.

## Out of Scope (Future)

- Framework wrappers (`@modern-svg-icons/react`, `@modern-svg-icons/vue`, etc.) — will be added as separate packages in `packages/` later
- Gallery web app — potential future milestone
- GitHub repo rename to match npm scope — tracked separately
