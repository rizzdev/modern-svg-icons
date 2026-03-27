# @modern-svg-icons/core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@modern-svg-icons/core` — a tree-shakeable npm package that exports 514 optimized, animated SVG icons as named TypeScript constants, with optional metadata and a `createIcon()` utility.

**Architecture:** pnpm monorepo with `packages/core/`. A build script reads raw SVGs from `icons/`, optimizes via SVGO, and generates per-category TypeScript source files. `tsup` compiles to ESM + CJS + `.d.ts`. GitHub Actions handle CI and npm publishing on release.

**Tech Stack:** TypeScript, pnpm workspaces, SVGO, tsup, Vitest, GitHub Actions

---

## File Map

| File | Responsibility | Created/Modified |
|------|---------------|-----------------|
| `package.json` | Root workspace config, shared dev scripts | Create |
| `pnpm-workspace.yaml` | Declare `packages/*` workspace | Create |
| `.gitignore` | Add generated files, dist, pnpm | Modify |
| `scripts/categories.json` | Icon → category/tags mapping (514 entries) | Create |
| `scripts/build.ts` | Read SVGs → SVGO optimize → generate TS source files | Create |
| `packages/core/package.json` | `@modern-svg-icons/core` package config with exports map | Create |
| `packages/core/tsconfig.json` | TypeScript config for core package | Create |
| `packages/core/README.md` | npm-facing README for SEO/discoverability | Create |
| `packages/core/src/utils.ts` | `createIcon()` helper — hand-written, committed | Create |
| `packages/core/src/icons/*.ts` | Generated per-category icon exports | Generated (gitignored) |
| `packages/core/src/index.ts` | Generated barrel re-exports | Generated (gitignored) |
| `packages/core/src/meta.ts` | Generated metadata catalog | Generated (gitignored) |
| `packages/core/tests/utils.test.ts` | Tests for `createIcon()` | Create |
| `packages/core/tests/build.test.ts` | Tests for build output integrity | Create |
| `.github/workflows/build.yml` | CI: build + test on push/PR | Create |
| `.github/workflows/publish.yml` | CD: publish to npm on GitHub Release | Create |

---

### Task 1: Root Monorepo Setup

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Modify: `.gitignore`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "modern-svg-icons",
  "private": true,
  "scripts": {
    "build": "pnpm -r run build",
    "build:icons": "tsx scripts/build.ts",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint"
  },
  "devDependencies": {
    "svgo": "^3.3.2",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: Update `.gitignore`**

Append to the existing `.gitignore`:

```
# Package outputs
packages/*/dist/

# Generated source files (build artifacts)
packages/core/src/icons/
packages/core/src/index.ts
packages/core/src/meta.ts

# Dependencies
node_modules/
.turbo/

# IDE
.idea/

# OS
.DS_Store
*.pyc
__pycache__/

# Temp
png/
```

Note: This replaces the existing `.gitignore` content (which had `.DS_Store`, `node_modules/`, `png/`, `*.pyc`, `__pycache__/`). All existing entries are preserved.

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`
Expected: lockfile created, `node_modules/` populated, no errors

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore pnpm-lock.yaml
git commit -m "chore: initialize pnpm monorepo workspace"
```

---

### Task 2: Core Package Skeleton

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`

- [ ] **Step 1: Create `packages/core/package.json`**

```json
{
  "name": "@modern-svg-icons/core",
  "version": "0.1.0",
  "description": "514 animated SVG icons for developers — tree-shakeable, zero dependencies, TypeScript-first",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./utils": {
      "import": {
        "types": "./dist/utils.d.ts",
        "default": "./dist/utils.js"
      },
      "require": {
        "types": "./dist/utils.d.cts",
        "default": "./dist/utils.cjs"
      }
    },
    "./meta": {
      "import": {
        "types": "./dist/meta.d.ts",
        "default": "./dist/meta.js"
      },
      "require": {
        "types": "./dist/meta.d.cts",
        "default": "./dist/meta.cjs"
      }
    }
  },
  "sideEffects": false,
  "files": [
    "dist"
  ],
  "keywords": [
    "svg",
    "icons",
    "animated",
    "material",
    "developer",
    "tree-shakeable",
    "typescript",
    "animated-icons",
    "svg-icons",
    "icon-library"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/knoxhack/modern-svg-icons",
    "directory": "packages/core"
  },
  "scripts": {
    "build": "tsx ../../scripts/build.ts && tsup",
    "lint": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "tsup": "^8.1.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/core/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Install workspace dependencies**

Run: `pnpm install`
Expected: Core package dependencies installed, no errors

- [ ] **Step 4: Commit**

```bash
git add packages/core/package.json packages/core/tsconfig.json pnpm-lock.yaml
git commit -m "chore: add @modern-svg-icons/core package skeleton"
```

---

### Task 3: `createIcon()` Utility — Tests First

**Files:**
- Create: `packages/core/src/utils.ts`
- Create: `packages/core/tests/utils.test.ts`

- [ ] **Step 1: Write failing tests for `createIcon()`**

Create `packages/core/tests/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createIcon } from '../src/utils'

const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="256" height="256">
<style>
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.cur{animation:blink .8s step-end infinite}
</style>
<rect x="3" y="6" width="38" height="30" rx="4" fill="#455A64"/>
<rect class="cur" x="26" y="30" width="3" height="2" rx=".5" fill="#FFF"/>
</svg>`

const noStyleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="256" height="256">
<rect x="3" y="6" width="38" height="30" rx="4" fill="#455A64"/>
</svg>`

describe('createIcon', () => {
  it('returns the SVG unchanged when no options are passed', () => {
    const result = createIcon(sampleSvg)
    expect(result).toBe(sampleSvg)
  })

  it('returns the SVG unchanged when animated is true', () => {
    const result = createIcon(sampleSvg, { animated: true })
    expect(result).toBe(sampleSvg)
  })

  it('removes <style> block when animated is false', () => {
    const result = createIcon(sampleSvg, { animated: false })
    expect(result).not.toContain('<style>')
    expect(result).not.toContain('</style>')
    expect(result).not.toContain('@keyframes')
    // Should still contain the structural SVG elements
    expect(result).toContain('<rect x="3"')
    expect(result).toContain('fill="#455A64"')
  })

  it('removes class attributes that reference animation classes when animated is false', () => {
    const result = createIcon(sampleSvg, { animated: false })
    expect(result).not.toContain('class="cur"')
    // The rect element itself should still exist
    expect(result).toContain('<rect')
    expect(result).toContain('fill="#FFF"')
  })

  it('handles SVGs with no <style> tag when animated is false', () => {
    const result = createIcon(noStyleSvg, { animated: false })
    expect(result).toContain('<rect')
    expect(result).toContain('fill="#455A64"')
  })

  it('replaces width and height when size is provided', () => {
    const result = createIcon(sampleSvg, { size: 32 })
    expect(result).toContain('width="32"')
    expect(result).toContain('height="32"')
    expect(result).not.toContain('width="256"')
    expect(result).not.toContain('height="256"')
  })

  it('applies both animated:false and size together', () => {
    const result = createIcon(sampleSvg, { animated: false, size: 48 })
    expect(result).not.toContain('<style>')
    expect(result).toContain('width="48"')
    expect(result).toContain('height="48"')
    expect(result).toContain('<rect x="3"')
  })

  it('preserves viewBox when changing size', () => {
    const result = createIcon(sampleSvg, { size: 32 })
    expect(result).toContain('viewBox="0 0 44 44"')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run tests/utils.test.ts`
Expected: FAIL — `Cannot find module '../src/utils'`

- [ ] **Step 3: Implement `createIcon()`**

Create `packages/core/src/utils.ts`:

```ts
export interface IconOptions {
  /** Set to false to remove CSS animations. Default: true */
  animated?: boolean
  /** Override width and height attributes (in pixels) */
  size?: number
}

export function createIcon(svg: string, options?: IconOptions): string {
  if (!options) return svg

  let result = svg

  if (options.animated === false) {
    // Remove <style>...</style> block
    result = result.replace(/<style>[\s\S]*?<\/style>\s*/g, '')
    // Remove class="..." attributes (animation class references)
    result = result.replace(/\s+class="[^"]*"/g, '')
  }

  if (options.size !== undefined) {
    result = result.replace(/width="\d+"/, `width="${options.size}"`)
    result = result.replace(/height="\d+"/, `height="${options.size}"`)
  }

  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/core && pnpm vitest run tests/utils.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/utils.ts packages/core/tests/utils.test.ts
git commit -m "feat: add createIcon() utility with animation and size options"
```

---

### Task 4: Categories Mapping

**Files:**
- Create: `scripts/categories.json`

- [ ] **Step 1: Create `scripts/categories.json`**

This file maps all 514 icons to their categories and tags, based on the README's category table. The full file is large — here is the structure with every icon mapped:

```json
{
  "200-ok": { "category": "http-codes", "tags": ["status", "success", "response"] },
  "201-created": { "category": "http-codes", "tags": ["status", "success", "response"] },
  "301-redirect": { "category": "http-codes", "tags": ["status", "redirect", "response"] },
  "400-bad-request": { "category": "http-codes", "tags": ["status", "error", "client"] },
  "401-unauthorized": { "category": "http-codes", "tags": ["status", "error", "auth"] },
  "403-forbidden": { "category": "http-codes", "tags": ["status", "error", "auth"] },
  "404-not-found": { "category": "http-codes", "tags": ["status", "error", "client"] },
  "500-server-error": { "category": "http-codes", "tags": ["status", "error", "server"] },
  "502-bad-gateway": { "category": "http-codes", "tags": ["status", "error", "server"] },
  "503-unavailable": { "category": "http-codes", "tags": ["status", "error", "server"] },
  "a-record": { "category": "networking", "tags": ["dns", "domain"] },
  "access-control": { "category": "security", "tags": ["auth", "permissions", "rbac"] },
  "accessibility": { "category": "design-ux", "tags": ["a11y", "wcag", "ui"] },
  "accordion": { "category": "frontend-ui", "tags": ["component", "collapse", "ui"] },
  "agent": { "category": "ai-ml", "tags": ["autonomous", "llm", "bot"] },
  "ai-brain": { "category": "ai-ml", "tags": ["artificial-intelligence", "neural", "ml"] },
  "animation": { "category": "frontend-ui", "tags": ["motion", "css", "transition"] },
  "api": { "category": "data-api", "tags": ["rest", "endpoint", "service"] },
  "api-endpoint-ai": { "category": "ai-ml", "tags": ["api", "inference", "endpoint"] },
  "api-gateway": { "category": "data-api", "tags": ["proxy", "routing", "microservice"] },
  "api-key": { "category": "data-api", "tags": ["auth", "token", "secret"] },
  "api-version": { "category": "data-api", "tags": ["versioning", "semver", "api"] },
  "approved": { "category": "status-workflow", "tags": ["review", "accepted", "done"] },
  "archived": { "category": "status-workflow", "tags": ["stored", "inactive", "history"] },
  "array": { "category": "dev-tools", "tags": ["data-structure", "list", "collection"] },
  "arrow-down": { "category": "arrows-symbols", "tags": ["direction", "navigation", "ui"] },
  "arrow-left": { "category": "arrows-symbols", "tags": ["direction", "navigation", "back"] },
  "arrow-loop": { "category": "arrows-symbols", "tags": ["cycle", "repeat", "loop"] },
  "arrow-right": { "category": "arrows-symbols", "tags": ["direction", "navigation", "forward"] },
  "arrow-up": { "category": "arrows-symbols", "tags": ["direction", "navigation", "ui"] },
  "async": { "category": "dev-tools", "tags": ["promise", "concurrent", "await"] },
  "atom": { "category": "nature", "tags": ["science", "physics", "particle"] },
  "attention": { "category": "general", "tags": ["alert", "warning", "notice"] },
  "audio": { "category": "files-media", "tags": ["sound", "music", "media"] },
  "audit": { "category": "security", "tags": ["review", "compliance", "log"] },
  "auth": { "category": "security", "tags": ["authentication", "login", "identity"] },
  "autoscale": { "category": "infrastructure", "tags": ["scaling", "elastic", "auto"] },
  "avatar": { "category": "frontend-ui", "tags": ["user", "profile", "image"] },
  "aws": { "category": "cloud-devops", "tags": ["amazon", "cloud", "provider"] },
  "azure": { "category": "cloud-devops", "tags": ["microsoft", "cloud", "provider"] },
  "backprop": { "category": "ai-ml", "tags": ["training", "gradient", "neural-network"] },
  "backup": { "category": "infrastructure", "tags": ["restore", "snapshot", "disaster-recovery"] },
  "badge": { "category": "frontend-ui", "tags": ["label", "tag", "ui"] },
  "bandwidth": { "category": "networking", "tags": ["throughput", "speed", "capacity"] },
  "base64": { "category": "math-crypto", "tags": ["encoding", "decode", "binary"] },
  "base-url": { "category": "data-api", "tags": ["endpoint", "root", "url"] },
  "bash-lang": { "category": "backend-languages", "tags": ["shell", "script", "unix"] },
  "batch": { "category": "data-api", "tags": ["bulk", "processing", "queue"] },
  "batch-size": { "category": "ai-ml", "tags": ["training", "hyperparameter", "ml"] },
  "benchmark": { "category": "testing-qa", "tags": ["performance", "speed", "profiling"] },
  "benchmark-ai": { "category": "ai-ml", "tags": ["evaluation", "metrics", "leaderboard"] },
  "beta": { "category": "status-workflow", "tags": ["release", "preview", "testing"] },
  "binary": { "category": "math-crypto", "tags": ["bits", "data", "encoding"] },
  "blockchain": { "category": "math-crypto", "tags": ["crypto", "ledger", "decentralized"] },
  "blocked": { "category": "status-workflow", "tags": ["stuck", "dependency", "waiting"] },
  "bookmark": { "category": "general", "tags": ["save", "favorite", "reference"] },
  "brainstorm": { "category": "collaboration", "tags": ["ideation", "thinking", "creative"] },
  "branch": { "category": "dev-tools", "tags": ["git", "version-control", "fork"] },
  "breadcrumb": { "category": "frontend-ui", "tags": ["navigation", "path", "ui"] },
  "breakpoint": { "category": "dev-tools", "tags": ["debug", "pause", "inspect"] },
  "browser": { "category": "frontend-ui", "tags": ["web", "chrome", "window"] },
  "bug": { "category": "dev-tools", "tags": ["error", "issue", "defect"] },
  "build": { "category": "dev-tools", "tags": ["compile", "package", "ci"] },
  "bulk-api": { "category": "data-api", "tags": ["batch", "mass", "bulk"] },
  "bun": { "category": "backend-languages", "tags": ["runtime", "javascript", "bundler"] },
  "bundle": { "category": "dev-tools", "tags": ["webpack", "package", "build"] },
  "button": { "category": "frontend-ui", "tags": ["click", "action", "ui"] },
  "cache": { "category": "infrastructure", "tags": ["memory", "speed", "redis"] },
  "caching-strategy": { "category": "infrastructure", "tags": ["ttl", "invalidation", "performance"] },
  "calculator": { "category": "general", "tags": ["math", "compute", "tool"] },
  "callback": { "category": "dev-tools", "tags": ["function", "async", "handler"] },
  "captcha": { "category": "security", "tags": ["bot", "verification", "human"] },
  "carousel": { "category": "frontend-ui", "tags": ["slider", "gallery", "ui"] },
  "cdn": { "category": "infrastructure", "tags": ["content-delivery", "edge", "cache"] },
  "certificate": { "category": "security", "tags": ["ssl", "tls", "https"] },
  "changelog": { "category": "dev-tools", "tags": ["history", "release", "notes"] },
  "chart": { "category": "analytics", "tags": ["graph", "data-viz", "visualization"] },
  "chat": { "category": "general", "tags": ["message", "conversation", "communication"] },
  "chatbot": { "category": "ai-ml", "tags": ["bot", "conversation", "assistant"] },
  "checkmark": { "category": "arrows-symbols", "tags": ["done", "success", "confirm"] },
  "checksum": { "category": "security", "tags": ["hash", "integrity", "verify"] },
  "chip": { "category": "infrastructure", "tags": ["hardware", "processor", "cpu"] },
  "ci-cd": { "category": "dev-tools", "tags": ["pipeline", "automation", "deploy"] },
  "circuit-breaker": { "category": "infrastructure", "tags": ["resilience", "fault-tolerance", "pattern"] },
  "class-icon": { "category": "dev-tools", "tags": ["oop", "object", "type"] },
  "cli": { "category": "dev-tools", "tags": ["command-line", "terminal", "shell"] },
  "clipboard": { "category": "general", "tags": ["copy", "paste", "buffer"] },
  "clock": { "category": "general", "tags": ["time", "schedule", "timer"] },
  "cloud": { "category": "infrastructure", "tags": ["hosting", "service", "provider"] },
  "cloudflare-icon": { "category": "cloud-devops", "tags": ["cdn", "dns", "security"] },
  "cluster": { "category": "infrastructure", "tags": ["nodes", "distributed", "group"] },
  "cname": { "category": "networking", "tags": ["dns", "alias", "domain"] },
  "code": { "category": "dev-tools", "tags": ["source", "programming", "editor"] },
  "coin": { "category": "gaming", "tags": ["currency", "reward", "money"] },
  "color-picker": { "category": "design-ux", "tags": ["palette", "color", "ui"] },
  "column": { "category": "database-storage", "tags": ["table", "field", "sql"] },
  "comment": { "category": "dev-tools", "tags": ["annotation", "note", "code"] },
  "commit": { "category": "dev-tools", "tags": ["git", "save", "version-control"] },
  "compass": { "category": "nature", "tags": ["navigation", "direction", "explore"] },
  "compiler": { "category": "dev-tools", "tags": ["build", "compile", "language"] },
  "compliance": { "category": "security", "tags": ["regulation", "audit", "policy"] },
  "component": { "category": "frontend-ui", "tags": ["ui", "reusable", "module"] },
  "compression": { "category": "infrastructure", "tags": ["gzip", "minify", "size"] },
  "config": { "category": "dev-tools", "tags": ["settings", "configuration", "env"] },
  "connection-pool": { "category": "database-storage", "tags": ["connections", "pool", "performance"] },
  "console": { "category": "dev-tools", "tags": ["log", "output", "debug"] },
  "container": { "category": "infrastructure", "tags": ["docker", "isolated", "runtime"] },
  "container-registry": { "category": "infrastructure", "tags": ["docker", "images", "registry"] },
  "content-type": { "category": "data-api", "tags": ["header", "mime", "format"] },
  "context-window": { "category": "ai-ml", "tags": ["tokens", "llm", "memory"] },
  "cookie": { "category": "security", "tags": ["session", "browser", "storage"] },
  "copy": { "category": "general", "tags": ["clipboard", "duplicate", "paste"] },
  "cors": { "category": "networking", "tags": ["cross-origin", "browser", "security"] },
  "cors-policy": { "category": "networking", "tags": ["cross-origin", "headers", "security"] },
  "coverage": { "category": "testing-qa", "tags": ["code-coverage", "percentage", "quality"] },
  "cron": { "category": "infrastructure", "tags": ["schedule", "timer", "job"] },
  "crossmark": { "category": "arrows-symbols", "tags": ["cancel", "close", "delete"] },
  "csharp": { "category": "backend-languages", "tags": ["dotnet", "microsoft", "language"] },
  "csp": { "category": "security", "tags": ["content-security-policy", "header", "xss"] },
  "csrf": { "category": "security", "tags": ["cross-site", "token", "protection"] },
  "css": { "category": "frontend-ui", "tags": ["styles", "design", "web"] },
  "csv": { "category": "files-media", "tags": ["data", "spreadsheet", "export"] },
  "cursor-pagination": { "category": "data-api", "tags": ["pagination", "cursor", "api"] },
  "dark-mode": { "category": "frontend-ui", "tags": ["theme", "dark", "toggle"] },
  "dark-theme": { "category": "frontend-ui", "tags": ["theme", "dark", "ui"] },
  "dart": { "category": "backend-languages", "tags": ["flutter", "mobile", "language"] },
  "dashboard": { "category": "analytics", "tags": ["overview", "metrics", "admin"] },
  "database": { "category": "database-storage", "tags": ["db", "sql", "storage"] },
  "dataset": { "category": "ai-ml", "tags": ["data", "training", "collection"] },
  "data-sync": { "category": "data-api", "tags": ["sync", "realtime", "replication"] },
  "ddos": { "category": "security", "tags": ["attack", "denial-of-service", "protection"] },
  "debug": { "category": "dev-tools", "tags": ["inspect", "breakpoint", "troubleshoot"] },
  "deno": { "category": "backend-languages", "tags": ["runtime", "javascript", "typescript"] },
  "dependency": { "category": "dev-tools", "tags": ["package", "module", "import"] },
  "deploy": { "category": "cloud-devops", "tags": ["release", "ship", "production"] },
  "deprecated": { "category": "status-workflow", "tags": ["old", "removed", "legacy"] },
  "design-system": { "category": "design-ux", "tags": ["components", "tokens", "ui-kit"] },
  "desktop": { "category": "general", "tags": ["computer", "monitor", "screen"] },
  "devtools": { "category": "devex", "tags": ["inspector", "chrome", "debug"] },
  "dice": { "category": "gaming", "tags": ["random", "chance", "game"] },
  "diff": { "category": "dev-tools", "tags": ["compare", "changes", "git"] },
  "diffusion": { "category": "ai-ml", "tags": ["image-gen", "stable-diffusion", "generative"] },
  "digitalocean": { "category": "cloud-devops", "tags": ["cloud", "droplet", "provider"] },
  "divider": { "category": "frontend-ui", "tags": ["separator", "line", "ui"] },
  "dna": { "category": "nature", "tags": ["biology", "genetics", "helix"] },
  "dns-lookup": { "category": "networking", "tags": ["dns", "resolve", "domain"] },
  "dns-record": { "category": "networking", "tags": ["dns", "zone", "config"] },
  "docker": { "category": "infrastructure", "tags": ["container", "image", "devops"] },
  "domain": { "category": "networking", "tags": ["url", "hostname", "web"] },
  "done": { "category": "status-workflow", "tags": ["complete", "finished", "success"] },
  "dotfiles": { "category": "devex", "tags": ["config", "shell", "setup"] },
  "download": { "category": "general", "tags": ["save", "file", "transfer"] },
  "draft": { "category": "status-workflow", "tags": ["wip", "incomplete", "pending"] },
  "dropdown": { "category": "frontend-ui", "tags": ["select", "menu", "ui"] },
  "e2e-test": { "category": "testing-qa", "tags": ["end-to-end", "cypress", "playwright"] },
  "egress": { "category": "networking", "tags": ["outbound", "traffic", "exit"] },
  "elastic": { "category": "infrastructure", "tags": ["elasticsearch", "search", "index"] },
  "elixir": { "category": "backend-languages", "tags": ["erlang", "functional", "language"] },
  "email": { "category": "general", "tags": ["mail", "message", "notification"] },
  "embedding": { "category": "ai-ml", "tags": ["vector", "representation", "semantic"] },
  "empty-state": { "category": "frontend-ui", "tags": ["placeholder", "no-data", "ui"] },
  "encryption": { "category": "security", "tags": ["cipher", "encrypt", "secure"] },
  "endpoint": { "category": "data-api", "tags": ["route", "url", "api"] },
  "enum": { "category": "dev-tools", "tags": ["type", "constant", "value"] },
  "env": { "category": "dev-tools", "tags": ["environment", "dotenv", "config"] },
  "env-variable": { "category": "dev-tools", "tags": ["environment", "config", "secret"] },
  "epoch": { "category": "ai-ml", "tags": ["training", "iteration", "ml"] },
  "error": { "category": "general", "tags": ["exception", "failure", "bug"] },
  "error-state": { "category": "frontend-ui", "tags": ["error", "ui", "feedback"] },
  "etag": { "category": "data-api", "tags": ["cache", "header", "validation"] },
  "event-bus": { "category": "infrastructure", "tags": ["pub-sub", "message", "event"] },
  "failover": { "category": "infrastructure", "tags": ["redundancy", "backup", "ha"] },
  "fallback": { "category": "dev-tools", "tags": ["default", "backup", "error"] },
  "figma": { "category": "design-ux", "tags": ["design", "tool", "ui"] },
  "file": { "category": "files-media", "tags": ["document", "data", "storage"] },
  "filter": { "category": "general", "tags": ["search", "query", "narrow"] },
  "fine-tune": { "category": "ai-ml", "tags": ["training", "customize", "model"] },
  "fingerprint": { "category": "security", "tags": ["biometric", "identity", "auth"] },
  "fire": { "category": "general", "tags": ["hot", "trending", "flame"] },
  "firewall": { "category": "security", "tags": ["network", "protection", "filter"] },
  "firewall-rule": { "category": "security", "tags": ["network", "rule", "policy"] },
  "fixture": { "category": "testing-qa", "tags": ["test-data", "setup", "mock"] },
  "flaky-test": { "category": "testing-qa", "tags": ["intermittent", "unreliable", "ci"] },
  "fly-io": { "category": "cloud-devops", "tags": ["edge", "deploy", "provider"] },
  "focus-mode": { "category": "general", "tags": ["concentrate", "distraction-free", "zen"] },
  "folder": { "category": "files-media", "tags": ["directory", "organize", "storage"] },
  "fork": { "category": "dev-tools", "tags": ["git", "copy", "branch"] },
  "form": { "category": "frontend-ui", "tags": ["input", "submit", "ui"] },
  "formatter": { "category": "dev-tools", "tags": ["prettier", "format", "style"] },
  "function": { "category": "dev-tools", "tags": ["method", "callable", "code"] },
  "funnel": { "category": "analytics", "tags": ["conversion", "pipeline", "metrics"] },
  "gateway": { "category": "infrastructure", "tags": ["proxy", "entry", "routing"] },
  "gcp": { "category": "cloud-devops", "tags": ["google", "cloud", "provider"] },
  "gem": { "category": "gaming", "tags": ["jewel", "treasure", "reward"] },
  "git": { "category": "dev-tools", "tags": ["version-control", "repository", "scm"] },
  "globe": { "category": "nature", "tags": ["world", "international", "web"] },
  "go-lang": { "category": "backend-languages", "tags": ["golang", "google", "language"] },
  "gpu": { "category": "infrastructure", "tags": ["graphics", "cuda", "compute"] },
  "grafana": { "category": "cloud-devops", "tags": ["monitoring", "dashboard", "observability"] },
  "graphql": { "category": "data-api", "tags": ["query", "schema", "api"] },
  "graphql-lang": { "category": "backend-languages", "tags": ["query-language", "schema", "api"] },
  "green-build": { "category": "testing-qa", "tags": ["ci", "passing", "success"] },
  "grid-layout": { "category": "frontend-ui", "tags": ["css-grid", "layout", "responsive"] },
  "grpc": { "category": "data-api", "tags": ["rpc", "protobuf", "api"] },
  "hallucination": { "category": "ai-ml", "tags": ["llm", "error", "accuracy"] },
  "handshake": { "category": "networking", "tags": ["tls", "connection", "protocol"] },
  "hash": { "category": "math-crypto", "tags": ["digest", "checksum", "crypto"] },
  "hash-password": { "category": "security", "tags": ["bcrypt", "salt", "auth"] },
  "haskell": { "category": "backend-languages", "tags": ["functional", "pure", "language"] },
  "header": { "category": "frontend-ui", "tags": ["navigation", "top", "ui"] },
  "health-bar": { "category": "gaming", "tags": ["hp", "life", "status"] },
  "health-check": { "category": "infrastructure", "tags": ["monitoring", "uptime", "status"] },
  "heart": { "category": "general", "tags": ["love", "favorite", "like"] },
  "hosting": { "category": "infrastructure", "tags": ["server", "web", "provider"] },
  "hot-reload": { "category": "dev-tools", "tags": ["hmr", "live", "development"] },
  "hsts": { "category": "security", "tags": ["header", "https", "policy"] },
  "html": { "category": "frontend-ui", "tags": ["markup", "web", "document"] },
  "http": { "category": "networking", "tags": ["protocol", "web", "request"] },
  "https": { "category": "security", "tags": ["ssl", "tls", "secure"] },
  "idempotent": { "category": "data-api", "tags": ["safe", "retry", "api"] },
  "image": { "category": "files-media", "tags": ["picture", "photo", "media"] },
  "index": { "category": "database-storage", "tags": ["search", "performance", "query"] },
  "inference": { "category": "ai-ml", "tags": ["prediction", "model", "runtime"] },
  "infinity": { "category": "arrows-symbols", "tags": ["loop", "unlimited", "math"] },
  "info": { "category": "general", "tags": ["information", "help", "details"] },
  "ingress": { "category": "networking", "tags": ["inbound", "traffic", "entry"] },
  "in-progress": { "category": "status-workflow", "tags": ["wip", "working", "active"] },
  "input": { "category": "frontend-ui", "tags": ["text-field", "form", "ui"] },
  "integration-test": { "category": "testing-qa", "tags": ["integration", "test", "api"] },
  "interface": { "category": "dev-tools", "tags": ["type", "contract", "abstract"] },
  "ip-address": { "category": "networking", "tags": ["network", "address", "ipv4"] },
  "ip-block": { "category": "security", "tags": ["firewall", "block", "ban"] },
  "java": { "category": "backend-languages", "tags": ["jvm", "enterprise", "language"] },
  "javascript": { "category": "backend-languages", "tags": ["js", "web", "language"] },
  "join": { "category": "database-storage", "tags": ["sql", "query", "relation"] },
  "joystick": { "category": "gaming", "tags": ["controller", "gamepad", "input"] },
  "json": { "category": "data-api", "tags": ["format", "data", "serialize"] },
  "jwt": { "category": "security", "tags": ["token", "auth", "bearer"] },
  "kanban": { "category": "collaboration", "tags": ["board", "agile", "project"] },
  "key": { "category": "security", "tags": ["secret", "access", "credential"] },
  "keyboard": { "category": "devex", "tags": ["input", "typing", "shortcuts"] },
  "kotlin": { "category": "backend-languages", "tags": ["jvm", "android", "language"] },
  "kubernetes": { "category": "infrastructure", "tags": ["k8s", "orchestration", "container"] },
  "lambda": { "category": "cloud-devops", "tags": ["serverless", "function", "aws"] },
  "latency": { "category": "infrastructure", "tags": ["delay", "response-time", "performance"] },
  "layout": { "category": "frontend-ui", "tags": ["page", "structure", "grid"] },
  "leaf": { "category": "nature", "tags": ["plant", "green", "eco"] },
  "level-up": { "category": "gaming", "tags": ["xp", "progress", "upgrade"] },
  "light-mode": { "category": "frontend-ui", "tags": ["theme", "light", "toggle"] },
  "lightning": { "category": "general", "tags": ["fast", "power", "energy"] },
  "light-theme": { "category": "frontend-ui", "tags": ["theme", "light", "ui"] },
  "link": { "category": "general", "tags": ["url", "href", "connect"] },
  "lint": { "category": "dev-tools", "tags": ["eslint", "check", "code-quality"] },
  "linter": { "category": "dev-tools", "tags": ["eslint", "static-analysis", "tool"] },
  "llm": { "category": "ai-ml", "tags": ["large-language-model", "gpt", "chat"] },
  "load-balancer": { "category": "infrastructure", "tags": ["routing", "traffic", "ha"] },
  "loading-state": { "category": "frontend-ui", "tags": ["spinner", "skeleton", "ui"] },
  "load-test": { "category": "testing-qa", "tags": ["performance", "stress", "benchmark"] },
  "load-test-infra": { "category": "infrastructure", "tags": ["performance", "stress", "scaling"] },
  "lock": { "category": "security", "tags": ["secure", "locked", "protected"] },
  "log": { "category": "dev-tools", "tags": ["logging", "output", "trace"] },
  "loop": { "category": "dev-tools", "tags": ["iteration", "repeat", "cycle"] },
  "loss-function": { "category": "ai-ml", "tags": ["training", "optimization", "gradient"] },
  "lua": { "category": "backend-languages", "tags": ["scripting", "game", "language"] },
  "magic": { "category": "general", "tags": ["sparkle", "wand", "special"] },
  "malware": { "category": "security", "tags": ["virus", "threat", "attack"] },
  "markdown": { "category": "files-media", "tags": ["md", "text", "format"] },
  "mention": { "category": "collaboration", "tags": ["tag", "notify", "user"] },
  "merge": { "category": "dev-tools", "tags": ["git", "combine", "pr"] },
  "message-queue": { "category": "infrastructure", "tags": ["rabbitmq", "sqs", "async"] },
  "mfa": { "category": "security", "tags": ["two-factor", "auth", "otp"] },
  "microservice": { "category": "infrastructure", "tags": ["service", "distributed", "api"] },
  "middleware": { "category": "dev-tools", "tags": ["handler", "pipeline", "request"] },
  "migration": { "category": "database-storage", "tags": ["schema", "upgrade", "change"] },
  "migration-api": { "category": "data-api", "tags": ["migration", "upgrade", "api"] },
  "milestone": { "category": "collaboration", "tags": ["goal", "target", "release"] },
  "minify": { "category": "dev-tools", "tags": ["compress", "optimize", "build"] },
  "minus": { "category": "arrows-symbols", "tags": ["subtract", "remove", "decrease"] },
  "mobile": { "category": "general", "tags": ["phone", "responsive", "device"] },
  "mock": { "category": "testing-qa", "tags": ["stub", "fake", "test-double"] },
  "modal": { "category": "frontend-ui", "tags": ["dialog", "popup", "overlay"] },
  "model": { "category": "ai-ml", "tags": ["weights", "architecture", "neural"] },
  "mongo": { "category": "database-storage", "tags": ["mongodb", "nosql", "document"] },
  "monitor": { "category": "infrastructure", "tags": ["observability", "watch", "alert"] },
  "monorepo": { "category": "dev-tools", "tags": ["workspace", "multi-package", "repo"] },
  "mount": { "category": "infrastructure", "tags": ["volume", "filesystem", "attach"] },
  "multimodal": { "category": "ai-ml", "tags": ["vision", "text", "audio"] },
  "multipart": { "category": "data-api", "tags": ["upload", "form-data", "file"] },
  "mutation": { "category": "data-api", "tags": ["graphql", "write", "change"] },
  "mx-record": { "category": "networking", "tags": ["dns", "email", "mail"] },
  "nameserver": { "category": "networking", "tags": ["dns", "ns", "resolver"] },
  "navbar": { "category": "frontend-ui", "tags": ["navigation", "menu", "header"] },
  "netlify": { "category": "cloud-devops", "tags": ["hosting", "deploy", "jamstack"] },
  "network": { "category": "networking", "tags": ["internet", "connection", "infrastructure"] },
  "neural-network": { "category": "ai-ml", "tags": ["deep-learning", "layers", "model"] },
  "nginx": { "category": "infrastructure", "tags": ["web-server", "reverse-proxy", "load-balancer"] },
  "nginx-conf": { "category": "infrastructure", "tags": ["config", "web-server", "proxy"] },
  "nlp": { "category": "ai-ml", "tags": ["natural-language", "text", "processing"] },
  "node": { "category": "infrastructure", "tags": ["server", "instance", "compute"] },
  "node-js": { "category": "backend-languages", "tags": ["javascript", "runtime", "server"] },
  "nonce": { "category": "security", "tags": ["token", "unique", "csrf"] },
  "nosql": { "category": "database-storage", "tags": ["document", "key-value", "mongo"] },
  "notification": { "category": "general", "tags": ["alert", "push", "bell"] },
  "npm": { "category": "dev-tools", "tags": ["package-manager", "registry", "node"] },
  "oauth": { "category": "security", "tags": ["authorization", "token", "login"] },
  "oauth-flow": { "category": "security", "tags": ["authorization", "redirect", "token"] },
  "object-oriented": { "category": "dev-tools", "tags": ["oop", "class", "inheritance"] },
  "openapi": { "category": "data-api", "tags": ["swagger", "spec", "documentation"] },
  "orm": { "category": "database-storage", "tags": ["mapping", "model", "query"] },
  "package": { "category": "dev-tools", "tags": ["module", "library", "npm"] },
  "packet": { "category": "networking", "tags": ["data", "tcp", "network"] },
  "pagination": { "category": "data-api", "tags": ["page", "offset", "list"] },
  "pagination-ui": { "category": "frontend-ui", "tags": ["page-numbers", "navigation", "ui"] },
  "palette": { "category": "design-ux", "tags": ["colors", "theme", "design"] },
  "parse": { "category": "dev-tools", "tags": ["decode", "transform", "data"] },
  "password": { "category": "security", "tags": ["credential", "auth", "secret"] },
  "patch": { "category": "data-api", "tags": ["update", "partial", "api"] },
  "payload": { "category": "data-api", "tags": ["body", "request", "data"] },
  "pdf": { "category": "files-media", "tags": ["document", "portable", "file"] },
  "pen-test": { "category": "security", "tags": ["penetration", "security-testing", "audit"] },
  "perl": { "category": "backend-languages", "tags": ["scripting", "regex", "language"] },
  "permission": { "category": "security", "tags": ["access", "role", "authorization"] },
  "pgp": { "category": "security", "tags": ["encryption", "email", "keys"] },
  "php": { "category": "backend-languages", "tags": ["web", "server", "language"] },
  "ping": { "category": "networking", "tags": ["icmp", "latency", "connectivity"] },
  "pipeline": { "category": "dev-tools", "tags": ["ci-cd", "automation", "workflow"] },
  "pixel-sword": { "category": "gaming", "tags": ["weapon", "retro", "pixel"] },
  "plugin": { "category": "dev-tools", "tags": ["extension", "addon", "module"] },
  "plus": { "category": "arrows-symbols", "tags": ["add", "create", "new"] },
  "port": { "category": "networking", "tags": ["socket", "tcp", "listen"] },
  "postgres": { "category": "database-storage", "tags": ["postgresql", "sql", "relational"] },
  "postman": { "category": "dev-tools", "tags": ["api-testing", "http", "tool"] },
  "potion": { "category": "gaming", "tags": ["magic", "health", "item"] },
  "powershell": { "category": "backend-languages", "tags": ["shell", "windows", "script"] },
  "prettier": { "category": "devex", "tags": ["formatter", "code-style", "tool"] },
  "progress-bar": { "category": "frontend-ui", "tags": ["loading", "percentage", "ui"] },
  "promise": { "category": "dev-tools", "tags": ["async", "then", "javascript"] },
  "prompt": { "category": "ai-ml", "tags": ["input", "instruction", "llm"] },
  "protobuf": { "category": "data-api", "tags": ["protocol-buffers", "serialize", "grpc"] },
  "prototype": { "category": "design-ux", "tags": ["wireframe", "mockup", "draft"] },
  "proxy": { "category": "infrastructure", "tags": ["forward", "reverse", "middleman"] },
  "published": { "category": "status-workflow", "tags": ["live", "released", "public"] },
  "pub-sub": { "category": "infrastructure", "tags": ["messaging", "event", "queue"] },
  "pull-request": { "category": "dev-tools", "tags": ["pr", "review", "git"] },
  "python": { "category": "backend-languages", "tags": ["scripting", "data-science", "language"] },
  "query": { "category": "database-storage", "tags": ["sql", "search", "filter"] },
  "queue": { "category": "infrastructure", "tags": ["fifo", "message", "async"] },
  "rag": { "category": "ai-ml", "tags": ["retrieval", "augmented", "generation"] },
  "rate-limit": { "category": "data-api", "tags": ["throttle", "quota", "api"] },
  "rate-limiter": { "category": "infrastructure", "tags": ["throttle", "protection", "api"] },
  "rate-limit-security": { "category": "security", "tags": ["throttle", "protection", "ddos"] },
  "rbac": { "category": "security", "tags": ["role-based", "permissions", "access"] },
  "react-icon": { "category": "frontend-ui", "tags": ["react", "library", "framework"] },
  "red-build": { "category": "testing-qa", "tags": ["ci", "failing", "error"] },
  "redis": { "category": "database-storage", "tags": ["cache", "in-memory", "key-value"] },
  "refactor": { "category": "dev-tools", "tags": ["clean", "improve", "restructure"] },
  "refresh": { "category": "general", "tags": ["reload", "update", "sync"] },
  "regex": { "category": "dev-tools", "tags": ["pattern", "match", "search"] },
  "regex-lang": { "category": "backend-languages", "tags": ["pattern", "match", "language"] },
  "region": { "category": "infrastructure", "tags": ["location", "zone", "geo"] },
  "reinforcement": { "category": "ai-ml", "tags": ["rl", "reward", "agent"] },
  "rejected": { "category": "status-workflow", "tags": ["denied", "failed", "review"] },
  "release": { "category": "dev-tools", "tags": ["version", "publish", "deploy"] },
  "repl": { "category": "dev-tools", "tags": ["interactive", "console", "evaluate"] },
  "replication": { "category": "database-storage", "tags": ["sync", "replica", "redundancy"] },
  "repo": { "category": "dev-tools", "tags": ["repository", "git", "source"] },
  "report": { "category": "analytics", "tags": ["summary", "data", "document"] },
  "request": { "category": "data-api", "tags": ["http", "call", "client"] },
  "response": { "category": "data-api", "tags": ["http", "reply", "server"] },
  "responsive": { "category": "frontend-ui", "tags": ["mobile", "adaptive", "media-query"] },
  "rest-api": { "category": "data-api", "tags": ["restful", "http", "crud"] },
  "retry": { "category": "data-api", "tags": ["backoff", "resilience", "error"] },
  "reverse-proxy": { "category": "infrastructure", "tags": ["nginx", "routing", "load-balancer"] },
  "review": { "category": "collaboration", "tags": ["feedback", "code-review", "pr"] },
  "roadmap": { "category": "collaboration", "tags": ["plan", "timeline", "strategy"] },
  "rollback": { "category": "infrastructure", "tags": ["revert", "undo", "deploy"] },
  "row": { "category": "database-storage", "tags": ["record", "table", "data"] },
  "ruby": { "category": "backend-languages", "tags": ["rails", "scripting", "language"] },
  "runtime": { "category": "dev-tools", "tags": ["execution", "environment", "process"] },
  "rust": { "category": "backend-languages", "tags": ["systems", "memory-safe", "language"] },
  "s3-bucket": { "category": "cloud-devops", "tags": ["storage", "aws", "object"] },
  "safety": { "category": "ai-ml", "tags": ["alignment", "guardrails", "responsible"] },
  "sandbox": { "category": "dev-tools", "tags": ["isolated", "test", "playground"] },
  "scaffold": { "category": "dev-tools", "tags": ["generate", "template", "boilerplate"] },
  "scala": { "category": "backend-languages", "tags": ["jvm", "functional", "language"] },
  "scan": { "category": "security", "tags": ["analyze", "detect", "vulnerability"] },
  "scheduled": { "category": "status-workflow", "tags": ["planned", "timer", "upcoming"] },
  "schema": { "category": "database-storage", "tags": ["structure", "definition", "model"] },
  "search": { "category": "general", "tags": ["find", "query", "lookup"] },
  "secret": { "category": "security", "tags": ["vault", "credential", "hidden"] },
  "security-audit": { "category": "security", "tags": ["review", "compliance", "assessment"] },
  "seed": { "category": "ai-ml", "tags": ["random", "reproducibility", "initialization"] },
  "seed-db": { "category": "database-storage", "tags": ["populate", "test-data", "initialize"] },
  "serialize": { "category": "data-api", "tags": ["encode", "json", "marshal"] },
  "server": { "category": "infrastructure", "tags": ["host", "backend", "machine"] },
  "service-mesh": { "category": "infrastructure", "tags": ["istio", "sidecar", "networking"] },
  "session": { "category": "security", "tags": ["state", "cookie", "auth"] },
  "settings": { "category": "general", "tags": ["config", "preferences", "gear"] },
  "sha256": { "category": "math-crypto", "tags": ["hash", "digest", "crypto"] },
  "sharding": { "category": "database-storage", "tags": ["partition", "distribute", "scale"] },
  "shield": { "category": "security", "tags": ["protect", "defense", "guard"] },
  "sidebar": { "category": "frontend-ui", "tags": ["navigation", "panel", "ui"] },
  "skeleton": { "category": "frontend-ui", "tags": ["loading", "placeholder", "ui"] },
  "sla": { "category": "infrastructure", "tags": ["uptime", "agreement", "reliability"] },
  "snapshot": { "category": "testing-qa", "tags": ["test", "reference", "compare"] },
  "snippet": { "category": "dev-tools", "tags": ["code", "template", "reuse"] },
  "soap": { "category": "data-api", "tags": ["xml", "protocol", "legacy"] },
  "sort": { "category": "general", "tags": ["order", "arrange", "algorithm"] },
  "sourcemap": { "category": "dev-tools", "tags": ["debug", "mapping", "build"] },
  "spinner": { "category": "frontend-ui", "tags": ["loading", "animation", "ui"] },
  "sprint": { "category": "collaboration", "tags": ["agile", "iteration", "scrum"] },
  "sql": { "category": "database-storage", "tags": ["query", "relational", "database"] },
  "sql-injection": { "category": "security", "tags": ["vulnerability", "attack", "database"] },
  "sql-lang": { "category": "backend-languages", "tags": ["query", "database", "language"] },
  "sse": { "category": "data-api", "tags": ["server-sent-events", "streaming", "realtime"] },
  "ssh": { "category": "networking", "tags": ["remote", "secure", "terminal"] },
  "ssh-key": { "category": "security", "tags": ["keypair", "auth", "remote"] },
  "ssl-cert": { "category": "security", "tags": ["certificate", "tls", "https"] },
  "ssl-tls": { "category": "security", "tags": ["encryption", "transport", "https"] },
  "sso": { "category": "security", "tags": ["single-sign-on", "auth", "identity"] },
  "stable": { "category": "status-workflow", "tags": ["release", "production", "reliable"] },
  "stack-trace": { "category": "dev-tools", "tags": ["error", "debug", "traceback"] },
  "star": { "category": "general", "tags": ["favorite", "rating", "bookmark"] },
  "stderr": { "category": "dev-tools", "tags": ["error", "output", "stream"] },
  "stdin": { "category": "dev-tools", "tags": ["input", "stream", "pipe"] },
  "stdout": { "category": "dev-tools", "tags": ["output", "stream", "print"] },
  "stepper": { "category": "frontend-ui", "tags": ["wizard", "steps", "ui"] },
  "storage": { "category": "infrastructure", "tags": ["disk", "persistent", "data"] },
  "stored-procedure": { "category": "database-storage", "tags": ["sql", "function", "database"] },
  "streaming": { "category": "data-api", "tags": ["realtime", "continuous", "data"] },
  "subdomain": { "category": "networking", "tags": ["dns", "prefix", "domain"] },
  "subnet": { "category": "networking", "tags": ["network", "cidr", "ip"] },
  "success": { "category": "general", "tags": ["complete", "done", "check"] },
  "svelte": { "category": "frontend-ui", "tags": ["framework", "reactive", "compiler"] },
  "swagger": { "category": "data-api", "tags": ["openapi", "docs", "api"] },
  "swift": { "category": "backend-languages", "tags": ["apple", "ios", "language"] },
  "tab-bar": { "category": "frontend-ui", "tags": ["tabs", "navigation", "ui"] },
  "table": { "category": "frontend-ui", "tags": ["data-table", "grid", "ui"] },
  "tablet": { "category": "general", "tags": ["device", "ipad", "responsive"] },
  "tag": { "category": "general", "tags": ["label", "metadata", "category"] },
  "tailwind": { "category": "frontend-ui", "tags": ["css", "utility", "framework"] },
  "tcp": { "category": "networking", "tags": ["protocol", "connection", "transport"] },
  "team": { "category": "collaboration", "tags": ["group", "people", "organization"] },
  "temperature": { "category": "ai-ml", "tags": ["sampling", "randomness", "llm"] },
  "template": { "category": "dev-tools", "tags": ["boilerplate", "scaffold", "starter"] },
  "terminal": { "category": "dev-tools", "tags": ["cli", "console", "bash"] },
  "terraform": { "category": "cloud-devops", "tags": ["iac", "infrastructure", "hashicorp"] },
  "test": { "category": "testing-qa", "tags": ["unit", "verify", "assert"] },
  "threat": { "category": "security", "tags": ["danger", "risk", "attack"] },
  "throttle": { "category": "data-api", "tags": ["rate-limit", "slow", "control"] },
  "timeout": { "category": "data-api", "tags": ["deadline", "expire", "abort"] },
  "tmux": { "category": "devex", "tags": ["terminal", "multiplexer", "session"] },
  "toast-notification": { "category": "frontend-ui", "tags": ["alert", "message", "snackbar"] },
  "todo": { "category": "status-workflow", "tags": ["task", "pending", "backlog"] },
  "toggle": { "category": "frontend-ui", "tags": ["switch", "on-off", "ui"] },
  "token": { "category": "ai-ml", "tags": ["tokenization", "nlp", "text"] },
  "tokenizer": { "category": "ai-ml", "tags": ["bpe", "encoding", "nlp"] },
  "tooltip": { "category": "frontend-ui", "tags": ["hover", "hint", "ui"] },
  "traceroute": { "category": "networking", "tags": ["hops", "path", "network"] },
  "training": { "category": "ai-ml", "tags": ["learning", "fit", "model"] },
  "transaction": { "category": "database-storage", "tags": ["acid", "commit", "rollback"] },
  "transform": { "category": "dev-tools", "tags": ["convert", "map", "process"] },
  "transformer": { "category": "ai-ml", "tags": ["attention", "architecture", "model"] },
  "transpile": { "category": "dev-tools", "tags": ["babel", "compile", "convert"] },
  "trash": { "category": "general", "tags": ["delete", "remove", "bin"] },
  "tree": { "category": "nature", "tags": ["plant", "hierarchy", "structure"] },
  "tree-shaking": { "category": "dev-tools", "tags": ["bundle", "optimize", "dead-code"] },
  "trend": { "category": "analytics", "tags": ["chart", "growth", "direction"] },
  "trigger": { "category": "database-storage", "tags": ["event", "automation", "hook"] },
  "trophy": { "category": "gaming", "tags": ["achievement", "win", "award"] },
  "two-factor": { "category": "security", "tags": ["2fa", "mfa", "auth"] },
  "typescript": { "category": "backend-languages", "tags": ["types", "javascript", "language"] },
  "typography": { "category": "design-ux", "tags": ["font", "text", "type"] },
  "udp": { "category": "networking", "tags": ["protocol", "datagram", "transport"] },
  "unit-test": { "category": "testing-qa", "tags": ["test", "assert", "isolated"] },
  "unlock": { "category": "security", "tags": ["open", "access", "unlocked"] },
  "upload": { "category": "general", "tags": ["send", "file", "transfer"] },
  "uptime": { "category": "infrastructure", "tags": ["availability", "monitoring", "sla"] },
  "urgent": { "category": "status-workflow", "tags": ["priority", "critical", "important"] },
  "user": { "category": "general", "tags": ["person", "account", "profile"] },
  "validate": { "category": "dev-tools", "tags": ["check", "verify", "assert"] },
  "variable": { "category": "dev-tools", "tags": ["value", "state", "data"] },
  "vault": { "category": "security", "tags": ["secret", "hashicorp", "store"] },
  "vector": { "category": "ai-ml", "tags": ["embedding", "dimension", "math"] },
  "vercel": { "category": "cloud-devops", "tags": ["hosting", "deploy", "next-js"] },
  "version": { "category": "dev-tools", "tags": ["semver", "release", "tag"] },
  "video": { "category": "files-media", "tags": ["stream", "media", "player"] },
  "view-db": { "category": "database-storage", "tags": ["virtual", "query", "sql"] },
  "vim": { "category": "devex", "tags": ["editor", "terminal", "modal"] },
  "vision-ai": { "category": "ai-ml", "tags": ["computer-vision", "image", "recognition"] },
  "vm": { "category": "infrastructure", "tags": ["virtual-machine", "hypervisor", "compute"] },
  "volume": { "category": "infrastructure", "tags": ["storage", "disk", "mount"] },
  "vpc": { "category": "infrastructure", "tags": ["virtual-network", "private", "cloud"] },
  "vpn": { "category": "security", "tags": ["tunnel", "private", "network"] },
  "vscode": { "category": "devex", "tags": ["editor", "ide", "microsoft"] },
  "vue": { "category": "frontend-ui", "tags": ["framework", "reactive", "javascript"] },
  "vulnerability": { "category": "security", "tags": ["cve", "exploit", "weakness"] },
  "waf": { "category": "security", "tags": ["web-application-firewall", "protection", "filter"] },
  "waf-rule": { "category": "security", "tags": ["firewall-rule", "protection", "policy"] },
  "warning": { "category": "general", "tags": ["alert", "caution", "notice"] },
  "wasm": { "category": "backend-languages", "tags": ["webassembly", "binary", "performance"] },
  "webhook": { "category": "data-api", "tags": ["callback", "event", "http"] },
  "webhook-incoming": { "category": "data-api", "tags": ["receive", "event", "http"] },
  "webhook-outgoing": { "category": "data-api", "tags": ["send", "event", "http"] },
  "websocket": { "category": "data-api", "tags": ["realtime", "bidirectional", "ws"] },
  "wireframe": { "category": "design-ux", "tags": ["mockup", "layout", "prototype"] },
  "workspace": { "category": "dev-tools", "tags": ["monorepo", "project", "directory"] },
  "xml": { "category": "files-media", "tags": ["markup", "data", "format"] },
  "xp": { "category": "gaming", "tags": ["experience", "points", "level"] },
  "xss": { "category": "security", "tags": ["cross-site-scripting", "vulnerability", "injection"] },
  "yaml": { "category": "files-media", "tags": ["config", "data", "format"] },
  "zero-trust": { "category": "security", "tags": ["network", "policy", "identity"] },
  "zig": { "category": "backend-languages", "tags": ["systems", "low-level", "language"] },
  "zip": { "category": "files-media", "tags": ["archive", "compress", "file"] }
}
```

- [ ] **Step 2: Verify all 514 icons are mapped**

Run: `node -e "const c=require('./scripts/categories.json'); const fs=require('fs'); const icons=fs.readdirSync('icons').map(f=>f.replace('.svg','')); const missing=icons.filter(i=>!c[i]); console.log('Total mapped:', Object.keys(c).length); console.log('Total icons:', icons.length); if(missing.length) console.log('Missing:', missing); else console.log('All icons mapped!')"`
Expected: `Total mapped: 514`, `Total icons: 514`, `All icons mapped!`

- [ ] **Step 3: Commit**

```bash
git add scripts/categories.json
git commit -m "chore: add categories.json mapping all 514 icons to categories and tags"
```

---

### Task 5: Build Script

**Files:**
- Create: `scripts/build.ts`

- [ ] **Step 1: Create `scripts/build.ts`**

```ts
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'fs'
import { join, basename } from 'path'
import { optimize } from 'svgo'

const ROOT = join(import.meta.dirname, '..')
const ICONS_DIR = join(ROOT, 'icons')
const CORE_SRC = join(ROOT, 'packages', 'core', 'src')
const ICONS_OUT = join(CORE_SRC, 'icons')
const CATEGORIES_PATH = join(ROOT, 'scripts', 'categories.json')

interface CategoryEntry {
  category: string
  tags: string[]
}

function kebabToCamel(str: string): string {
  // Handle numeric-prefixed names: 200-ok → http200Ok
  if (/^\d/.test(str)) {
    str = 'http' + str
  }
  return str.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
}

function categoryToFilename(category: string): string {
  return category // already kebab-case in categories.json
}

function main() {
  // Load categories
  const categories: Record<string, CategoryEntry> = JSON.parse(
    readFileSync(CATEGORIES_PATH, 'utf-8')
  )

  // Read all SVG files
  const svgFiles = readdirSync(ICONS_DIR)
    .filter(f => f.endsWith('.svg'))
    .sort()

  console.log(`Found ${svgFiles.length} SVG files`)

  // Optimize and group by category
  const byCategory: Record<string, { exportName: string; svg: string; iconName: string }[]> = {}
  const metaEntries: { exportName: string; iconName: string; category: string; tags: string[] }[] = []
  const warnings: string[] = []

  for (const file of svgFiles) {
    const iconName = basename(file, '.svg')
    const exportName = kebabToCamel(iconName)
    const raw = readFileSync(join(ICONS_DIR, file), 'utf-8')

    // Optimize with SVGO
    const result = optimize(raw, {
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              // Keep viewBox — critical for scaling
              removeViewBox: false,
              // Keep style elements — they contain our animations
              inlineStyles: false,
              minifyStyles: false,
            },
          },
        },
        // Remove XML declarations and comments
        'removeXMLProcInst',
        'removeComments',
      ],
    })

    const optimizedSvg = result.data

    // Get category info (default to "general" if unmapped)
    const catEntry = categories[iconName]
    if (!catEntry) {
      warnings.push(`Warning: "${iconName}" not in categories.json — defaulting to "general"`)
    }
    const category = catEntry?.category ?? 'general'
    const tags = catEntry?.tags ?? []

    // Group by category
    if (!byCategory[category]) {
      byCategory[category] = []
    }
    byCategory[category].push({ exportName, svg: optimizedSvg, iconName })

    // Collect metadata
    metaEntries.push({ exportName, iconName, category, tags })
  }

  // Print warnings
  for (const w of warnings) {
    console.warn(w)
  }

  // Clean and recreate output directory
  if (existsSync(ICONS_OUT)) {
    rmSync(ICONS_OUT, { recursive: true })
  }
  mkdirSync(ICONS_OUT, { recursive: true })

  // Generate per-category icon files
  const categoryFiles: string[] = []

  for (const [category, icons] of Object.entries(byCategory)) {
    const filename = categoryToFilename(category)
    categoryFiles.push(filename)

    const lines = icons.map(
      ({ exportName, svg }) =>
        `export const ${exportName} = ${JSON.stringify(svg)}`
    )

    writeFileSync(
      join(ICONS_OUT, `${filename}.ts`),
      lines.join('\n\n') + '\n'
    )

    console.log(`  ${filename}.ts — ${icons.length} icons`)
  }

  // Generate index.ts — re-exports all category files + utils
  const indexLines = [
    ...categoryFiles.map(f => `export * from './icons/${f}'`),
    `export { createIcon } from './utils'`,
    `export type { IconOptions } from './utils'`,
  ]

  writeFileSync(
    join(CORE_SRC, 'index.ts'),
    indexLines.join('\n') + '\n'
  )

  // Generate meta.ts
  const metaLines = [
    `export interface IconMeta {`,
    `  name: string`,
    `  category: string`,
    `  tags: string[]`,
    `}`,
    ``,
    `export const iconMeta: Record<string, IconMeta> = {`,
    ...metaEntries.map(
      ({ exportName, iconName, category, tags }) =>
        `  ${exportName}: { name: ${JSON.stringify(iconName)}, category: ${JSON.stringify(category)}, tags: ${JSON.stringify(tags)} },`
    ),
    `}`,
  ]

  writeFileSync(
    join(CORE_SRC, 'meta.ts'),
    metaLines.join('\n') + '\n'
  )

  console.log(`\nGenerated:`)
  console.log(`  ${categoryFiles.length} category files in packages/core/src/icons/`)
  console.log(`  index.ts — barrel re-exports`)
  console.log(`  meta.ts — ${metaEntries.length} icon metadata entries`)
  console.log(`\nDone!`)
}

main()
```

- [ ] **Step 2: Run the build script**

Run: `cd "C:/Users/andre/PhpstormProjects/modern-svg-icons" && pnpm tsx scripts/build.ts`
Expected: Output showing 514 SVGs processed, category files generated, no errors. Warnings only if any icon is unmapped.

- [ ] **Step 3: Verify generated files exist**

Run: `ls packages/core/src/icons/ && head -5 packages/core/src/icons/dev-tools.ts && head -5 packages/core/src/index.ts && head -10 packages/core/src/meta.ts`
Expected: Category `.ts` files exist. `dev-tools.ts` has `export const terminal = '...'`. `index.ts` has re-exports. `meta.ts` has typed metadata.

- [ ] **Step 4: Commit**

```bash
git add scripts/build.ts
git commit -m "feat: add build script — SVGO optimization + TypeScript generation"
```

---

### Task 6: tsup Configuration & Package Build

**Files:**
- Create: `packages/core/tsup.config.ts`

- [ ] **Step 1: Create `packages/core/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    utils: 'src/utils.ts',
    meta: 'src/meta.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  clean: true,
  outDir: 'dist',
})
```

- [ ] **Step 2: Run full build**

Run: `cd "C:/Users/andre/PhpstormProjects/modern-svg-icons" && pnpm build`
Expected: `scripts/build.ts` generates source, then `tsup` compiles to `packages/core/dist/` with `.js`, `.cjs`, `.d.ts`, `.d.cts` files for `index`, `utils`, and `meta`.

- [ ] **Step 3: Verify dist output**

Run: `ls packages/core/dist/`
Expected: Files include `index.js`, `index.cjs`, `index.d.ts`, `index.d.cts`, `utils.js`, `utils.cjs`, `utils.d.ts`, `utils.d.cts`, `meta.js`, `meta.cjs`, `meta.d.ts`, `meta.d.cts`

- [ ] **Step 4: Verify exports work**

Run: `node -e "const {terminal} = require('./packages/core/dist/index.cjs'); console.log(terminal.substring(0, 60))"`
Expected: Prints the first 60 chars of the terminal SVG string (starts with `<svg`)

Run: `node --input-type=module -e "import {terminal} from './packages/core/dist/index.js'; console.log(terminal.substring(0, 60))"`
Expected: Same output via ESM import

- [ ] **Step 5: Commit**

```bash
git add packages/core/tsup.config.ts
git commit -m "feat: add tsup config — ESM + CJS + dts output"
```

---

### Task 7: Build Output Integration Tests

**Files:**
- Create: `packages/core/tests/build.test.ts`

- [ ] **Step 1: Write build integration tests**

Create `packages/core/tests/build.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const ROOT = join(import.meta.dirname, '..', '..', '..')
const CORE_SRC = join(ROOT, 'packages', 'core', 'src')
const ICONS_DIR = join(ROOT, 'icons')

describe('build output', () => {
  beforeAll(() => {
    // Run the icon generation script (not tsup — just the TS source generation)
    execSync('pnpm tsx scripts/build.ts', { cwd: ROOT })
  })

  it('generates per-category icon files', () => {
    const iconsDir = join(CORE_SRC, 'icons')
    expect(existsSync(iconsDir)).toBe(true)
    const files = readdirSync(iconsDir).filter(f => f.endsWith('.ts'))
    expect(files.length).toBeGreaterThan(0)
  })

  it('generates index.ts with re-exports', () => {
    const indexPath = join(CORE_SRC, 'index.ts')
    expect(existsSync(indexPath)).toBe(true)
    const content = readFileSync(indexPath, 'utf-8')
    expect(content).toContain("export * from './icons/")
    expect(content).toContain("export { createIcon } from './utils'")
  })

  it('generates meta.ts with all icons', () => {
    const metaPath = join(CORE_SRC, 'meta.ts')
    expect(existsSync(metaPath)).toBe(true)
    const content = readFileSync(metaPath, 'utf-8')
    expect(content).toContain('export const iconMeta')
    expect(content).toContain('terminal')
  })

  it('total exported icons matches icons/ directory count', () => {
    const svgCount = readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg')).length
    const metaContent = readFileSync(join(CORE_SRC, 'meta.ts'), 'utf-8')
    // Count entries in iconMeta by counting lines with 'name:' pattern
    const metaCount = (metaContent.match(/name: "/g) || []).length
    expect(metaCount).toBe(svgCount)
  })

  it('generated SVGs are valid (start with <svg and end with </svg>)', () => {
    const iconsDir = join(CORE_SRC, 'icons')
    const files = readdirSync(iconsDir).filter(f => f.endsWith('.ts'))

    for (const file of files) {
      const content = readFileSync(join(iconsDir, file), 'utf-8')
      const svgMatches = content.match(/= "(.*?)"/gs)
      if (svgMatches) {
        for (const match of svgMatches) {
          const svg = JSON.parse(match.replace(/^= /, ''))
          expect(svg).toMatch(/^<svg\s/)
          expect(svg).toMatch(/<\/svg>$/)
        }
      }
    }
  })

  it('kebab-to-camel conversion handles numeric prefixes', () => {
    const iconsDir = join(CORE_SRC, 'icons')
    const httpCodesPath = join(iconsDir, 'http-codes.ts')
    if (existsSync(httpCodesPath)) {
      const content = readFileSync(httpCodesPath, 'utf-8')
      expect(content).toContain('export const http200Ok')
      expect(content).toContain('export const http404NotFound')
    }
  })
})
```

- [ ] **Step 2: Run tests**

Run: `cd packages/core && pnpm vitest run tests/build.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add packages/core/tests/build.test.ts
git commit -m "test: add build output integration tests"
```

---

### Task 8: npm README

**Files:**
- Create: `packages/core/README.md`

- [ ] **Step 1: Create `packages/core/README.md`**

```markdown
# @modern-svg-icons/core

514 animated SVG icons for developers — tree-shakeable, zero dependencies, TypeScript-first.

Flat material style with CSS animations baked in. No runtime, no build step. Import what you need.

## Install

```bash
npm install @modern-svg-icons/core
# or
pnpm add @modern-svg-icons/core
# or
yarn add @modern-svg-icons/core
```

## Usage

### Import icons directly (tree-shakeable)

```ts
import { terminal, docker, kubernetes } from '@modern-svg-icons/core'

// Each export is a raw SVG string
document.getElementById('icon').innerHTML = terminal
```

Only the icons you import end up in your bundle.

### Customize with `createIcon()`

```ts
import { createIcon } from '@modern-svg-icons/core/utils'
import { terminal } from '@modern-svg-icons/core'

// Remove animation
createIcon(terminal, { animated: false })

// Change size
createIcon(terminal, { size: 32 })

// Both
createIcon(terminal, { animated: false, size: 48 })
```

### Search and filter with metadata

```ts
import { iconMeta } from '@modern-svg-icons/core/meta'

// Get info about an icon
iconMeta.terminal
// → { name: 'terminal', category: 'dev-tools', tags: ['cli', 'console', 'bash'] }

// Find all security icons
const securityIcons = Object.entries(iconMeta)
  .filter(([, meta]) => meta.category === 'security')
```

## Categories

23 categories: dev-tools, infrastructure, security, data-api, frontend-ui, backend-languages, ai-ml, cloud-devops, status-workflow, database-storage, networking, http-codes, testing-qa, gaming, files-media, arrows-symbols, design-ux, collaboration, nature, math-crypto, devex, analytics, general.

## CDN

Every npm package is available via CDN:

```html
<!-- Via unpkg -->
<script src="https://unpkg.com/@modern-svg-icons/core"></script>

<!-- Via jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/@modern-svg-icons/core"></script>
```

## License

[MIT](https://github.com/knoxhack/modern-svg-icons/blob/master/LICENSE)
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/README.md
git commit -m "docs: add npm README for @modern-svg-icons/core"
```

---

### Task 9: GitHub Actions — CI Build

**Files:**
- Create: `.github/workflows/build.yml`

- [ ] **Step 1: Create `.github/workflows/build.yml`**

```yaml
name: Build & Test

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - run: pnpm test

      - run: pnpm lint
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/build.yml
git commit -m "ci: add build and test workflow"
```

---

### Task 10: GitHub Actions — npm Publish

**Files:**
- Create: `.github/workflows/publish.yml`

- [ ] **Step 1: Create `.github/workflows/publish.yml`**

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest

    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: https://registry.npmjs.org

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - run: pnpm test

      - name: Publish @modern-svg-icons/core
        working-directory: packages/core
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/publish.yml
git commit -m "ci: add npm publish workflow on GitHub Release"
```

---

### Task 11: Update Root README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the README to replace R2 CDN references with npm usage**

Replace the "Direct URL (CDN)" section and update the usage section to lead with npm installation. Keep the gallery link, categories table, generation instructions, and contributing guide. Remove all `pub-c8881e7b708145c5a525ff9d44814ec2.r2.dev` references. The updated README should:

- Lead with npm install instructions
- Show the named import API as primary usage
- Show `createIcon()` and metadata as secondary usage
- Keep the unpkg/jsdelivr CDN as an alternative (these auto-generate from npm)
- Keep gallery link (update URL later when repo is renamed)
- Keep categories table, animation styles, icon naming, PROMPT.md generation, contributing guide
- Remove all Cloudflare R2 URLs and references

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README — npm-first usage, remove R2 CDN references"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Clean build from scratch**

Run: `rm -rf node_modules packages/core/dist packages/core/src/icons packages/core/src/index.ts packages/core/src/meta.ts && pnpm install && pnpm build`
Expected: Full install + build succeeds with no errors

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass (utils tests + build integration tests)

- [ ] **Step 3: Verify package contents**

Run: `cd packages/core && npm pack --dry-run`
Expected: Shows only `dist/` files being included (no source, no icons, no tests). Package size should be reasonable.

- [ ] **Step 4: Verify tree-shaking signal**

Run: `node -e "const pkg = require('./packages/core/package.json'); console.log('sideEffects:', pkg.sideEffects); console.log('type:', pkg.type); console.log('exports:', JSON.stringify(pkg.exports, null, 2))"`
Expected: `sideEffects: false`, `type: module`, exports map with all three entrypoints

- [ ] **Step 5: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: final verification — clean build and tests pass"
```
