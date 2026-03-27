# Docs Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Astro Starlight documentation site with a custom landing page, interactive icon gallery, and 7 docs pages — deployed to GitHub Pages.

**Architecture:** Astro Starlight renders markdown docs pages with sidebar navigation. A standalone landing page at `src/pages/index.astro` provides a custom hero with animated icon showcase. The icon gallery is an Astro component embedded in an MDX content page, rendering 514 icons as `<img>` tags (SVG CSS animations play natively in `<img>`) with client-side search/filter/copy. A sync script copies icons and `categories.json` from the monorepo root into `docs/public/` before each build. GitHub Actions deploys to Pages on push to master.

**Tech Stack:** Astro 5, @astrojs/starlight, GitHub Actions, pnpm workspaces

---

## File Structure

```
docs/
├── package.json                         # @modern-svg-icons/docs workspace member
├── astro.config.mjs                     # Starlight config, sidebar, base path
├── tsconfig.json                        # Extends Starlight TS preset
├── scripts/
│   └── sync-icons.mjs                   # Copies icons/ + categories.json to public/
├── src/
│   ├── content/
│   │   └── docs/
│   │       ├── getting-started.mdx
│   │       ├── api-reference.md
│   │       ├── themes.md
│   │       ├── icons.mdx                # Icon gallery (imports component)
│   │       ├── export-cli.md
│   │       ├── contributing.md
│   │       ├── changelog.md
│   │       └── faq.md
│   ├── components/
│   │   ├── Landing.astro                # Custom hero landing page
│   │   ├── IconGallery.astro            # Interactive icon browser
│   │   └── FeatureCard.astro            # Feature highlight card
│   ├── pages/
│   │   └── index.astro                  # Landing page entry (standalone, no Starlight layout)
│   └── styles/
│       └── custom.css                   # Dark theme overrides, grid bg, fonts
└── public/
    ├── icons/                           # [gitignored] Synced from root icons/
    └── categories.json                  # [gitignored] Synced from scripts/categories.json
```

Also created/modified at root:
- `pnpm-workspace.yaml` — add `docs` member
- `.gitignore` — add docs build artifacts + `.superpowers/`
- `.github/workflows/docs.yml` — GitHub Pages deployment

---

### Task 1: Scaffold Astro Starlight Project

**Files:**
- Create: `docs/package.json`
- Create: `docs/astro.config.mjs`
- Create: `docs/tsconfig.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `.gitignore`

- [ ] **Step 1: Create `docs/package.json`**

```json
{
  "name": "@modern-svg-icons/docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node scripts/sync-icons.mjs && astro dev",
    "build": "node scripts/sync-icons.mjs && astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^5.7.0",
    "@astrojs/starlight": "^0.34.0",
    "sharp": "^0.33.5"
  }
}
```

- [ ] **Step 2: Create `docs/astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://rizzdev.github.io',
  base: '/modern-svg-icons',
  integrations: [
    starlight({
      title: 'modern-svg-icons',
      customCss: ['./src/styles/custom.css'],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/rizzdev/modern-svg-icons',
        },
      ],
      sidebar: [
        { label: 'Getting Started', slug: 'getting-started' },
        { label: 'API Reference', slug: 'api-reference' },
        { label: 'Themes & Customization', slug: 'themes' },
        { label: 'Icon Gallery', slug: 'icons' },
        { label: 'Export CLI', slug: 'export-cli' },
        { label: 'Contributing', slug: 'contributing' },
        { label: 'Changelog', slug: 'changelog' },
        { label: 'FAQ', slug: 'faq' },
      ],
    }),
  ],
});
```

- [ ] **Step 3: Create `docs/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

- [ ] **Step 4: Update `pnpm-workspace.yaml`**

Replace the entire file content with:

```yaml
packages:
  - "packages/*"
  - "docs"
```

- [ ] **Step 5: Update `.gitignore`**

Append these lines to the end of the existing `.gitignore`:

```
# Docs build artifacts
docs/public/icons/
docs/public/categories.json
docs/.astro/
docs/dist/

# Superpowers plugin cache
.superpowers/
```

- [ ] **Step 6: Install dependencies**

Run:
```bash
cd docs && pnpm install
```

Expected: Dependencies install successfully. `node_modules/` created in docs/.

- [ ] **Step 7: Create placeholder content page for initial build test**

Create `docs/src/content/docs/getting-started.mdx` with minimal content (will be replaced in Task 5):

```mdx
---
title: Getting Started
---

Placeholder — will be replaced.
```

- [ ] **Step 8: Create placeholder custom CSS for initial build test**

Create `docs/src/styles/custom.css` with minimal content (will be replaced in Task 2):

```css
/* Placeholder — replaced in Task 2 */
```

- [ ] **Step 9: Verify build succeeds**

Run from repo root:
```bash
pnpm --filter @modern-svg-icons/docs build
```

Expected: Build completes without errors. Output in `docs/dist/`.

- [ ] **Step 10: Commit**

```bash
git add docs/package.json docs/astro.config.mjs docs/tsconfig.json docs/src/content/docs/getting-started.mdx docs/src/styles/custom.css pnpm-workspace.yaml .gitignore docs/pnpm-lock.yaml
git commit -m "feat(docs): scaffold Astro Starlight project"
```

Note: If `pnpm-lock.yaml` is at the root instead of `docs/`, adjust the path. Also add `node_modules/` entries if pnpm created them.

---

### Task 2: Sync Icons Script + Custom CSS

**Files:**
- Create: `docs/scripts/sync-icons.mjs`
- Modify: `docs/src/styles/custom.css`

- [ ] **Step 1: Create `docs/scripts/sync-icons.mjs`**

```js
import { cpSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(__dirname, '..');
const monoRoot = resolve(docsRoot, '..');

const srcIcons = resolve(monoRoot, 'icons');
const destIcons = resolve(docsRoot, 'public', 'icons');
const srcCategories = resolve(monoRoot, 'scripts', 'categories.json');
const destCategories = resolve(docsRoot, 'public', 'categories.json');

mkdirSync(destIcons, { recursive: true });
cpSync(srcIcons, destIcons, { recursive: true });
cpSync(srcCategories, destCategories);

console.log(`Synced icons/ (${srcIcons}) → ${destIcons}`);
console.log(`Synced categories.json → ${destCategories}`);
```

- [ ] **Step 2: Run the sync script**

```bash
cd docs && node scripts/sync-icons.mjs
```

Expected: Output says "Synced icons/" and "Synced categories.json". `docs/public/icons/` contains 514 SVG files. `docs/public/categories.json` exists.

- [ ] **Step 3: Replace `docs/src/styles/custom.css` with full dark theme**

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;500;700&display=swap');

/* ── Force dark theme on both light and dark modes ── */
:root,
:root[data-theme='light'],
:root[data-theme='dark'] {
  --sl-color-accent-low: #0c2a47;
  --sl-color-accent: #42a5f5;
  --sl-color-accent-high: #e4e4e8;
  --sl-color-white: #e4e4e8;
  --sl-color-gray-1: #e4e4e8;
  --sl-color-gray-2: #c0c0c8;
  --sl-color-gray-3: #8b8b96;
  --sl-color-gray-4: #4a4a54;
  --sl-color-gray-5: #2a2a32;
  --sl-color-gray-6: #16161a;
  --sl-color-gray-7: #0c0c0e;
  --sl-color-black: #0c0c0e;
  --sl-font: 'Outfit', sans-serif;
  --sl-font-mono: 'JetBrains Mono', monospace;
  color-scheme: dark;
}

/* ── Grid background on gallery page ── */
[data-slug='icons'] .main-frame {
  position: relative;
}

[data-slug='icons'] .main-frame::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

/* ── Widen content area for gallery ── */
[data-slug='icons'] .sl-markdown-content {
  max-width: 100%;
}

/* ── Code blocks styling ── */
.sl-markdown-content pre {
  border: 1px solid #2a2a32;
}

/* ── Sidebar active link accent ── */
nav.sidebar a[aria-current='page'] {
  color: #42a5f5;
}
```

- [ ] **Step 4: Verify build with synced icons and custom CSS**

```bash
pnpm --filter @modern-svg-icons/docs build
```

Expected: Build succeeds. The `dist/` output includes `icons/` directory.

- [ ] **Step 5: Commit**

```bash
git add docs/scripts/sync-icons.mjs docs/src/styles/custom.css
git commit -m "feat(docs): add icon sync script and dark theme CSS"
```

---

### Task 3: Landing Page

**Files:**
- Create: `docs/src/components/FeatureCard.astro`
- Create: `docs/src/components/Landing.astro`
- Create: `docs/src/pages/index.astro`

- [ ] **Step 1: Create `docs/src/components/FeatureCard.astro`**

```astro
---
interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---

<div class="feature-card">
  <h3>{title}</h3>
  <p>{description}</p>
</div>

<style>
  .feature-card {
    background: #16161a;
    border: 1px solid #2a2a32;
    border-radius: 14px;
    padding: 28px 24px;
    transition: border-color 0.2s, transform 0.2s;
  }

  .feature-card:hover {
    border-color: #42a5f5;
    transform: translateY(-2px);
  }

  h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #e4e4e8;
    margin: 0 0 8px;
  }

  p {
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    color: #8b8b96;
    line-height: 1.6;
    margin: 0;
  }
</style>
```

- [ ] **Step 2: Create `docs/src/components/Landing.astro`**

```astro
---
import fs from 'node:fs';
import path from 'node:path';
import FeatureCard from './FeatureCard.astro';

const base = import.meta.env.BASE_URL;

/* ── Read showcase icons at build time ── */
const showcaseNames = [
  'terminal', 'docker', 'react-icon', 'api', 'lock', 'chart', 'rocket', 'neural-network',
  'kubernetes', 'python', 'graphql', 'cloud', 'fire', 'typescript', 'database', 'lightning',
  'git', 'server', 'encryption', 'joystick', 'deploy', 'atom', 'compass', 'magic',
];

const iconsDir = path.join(process.cwd(), 'public', 'icons');
const showcaseIcons = showcaseNames.map((name) => {
  try {
    const svg = fs.readFileSync(path.join(iconsDir, `${name}.svg`), 'utf-8');
    return { name, svg };
  } catch {
    return null;
  }
}).filter(Boolean);

/* Split into 3 sets of 8 */
const sets = [
  showcaseIcons.slice(0, 8),
  showcaseIcons.slice(8, 16),
  showcaseIcons.slice(16, 24),
];

const features = [
  {
    title: 'Tree-shakeable',
    description: 'Import only what you use. 514 icons in the package, only the ones you import in your bundle.',
  },
  {
    title: 'Animated',
    description: 'Subtle CSS animations baked into every icon. Cursors blink, gears spin, data flows.',
  },
  {
    title: 'Themeable',
    description: 'Grayscale, dark mode, custom colors. One line to retheme every icon.',
  },
  {
    title: 'TypeScript',
    description: 'Full type declarations and autocomplete for all 514 icon names.',
  },
];
---

<div class="landing">
  <nav class="landing-nav">
    <a href={base} class="nav-logo">modern-svg-icons</a>
    <div class="nav-links">
      <a href={`${base}getting-started/`}>Docs</a>
      <a href={`${base}icons/`}>Gallery</a>
      <a href="https://github.com/rizzdev/modern-svg-icons" target="_blank" rel="noopener">GitHub</a>
    </div>
  </nav>

  <main class="hero">
    {/* ── Animated icon showcase ── */}
    <div class="icon-showcase">
      {sets.map((set, i) => (
        <div class={`icon-set ${i === 0 ? 'active' : ''}`} data-set={i}>
          {set.map((icon) => (
            <div class="showcase-icon" set:html={icon.svg} />
          ))}
        </div>
      ))}
    </div>

    {/* ── Hero text ── */}
    <h1 class="title">modern-svg-icons</h1>
    <p class="tagline">
      514 animated SVG icons for developers — tree-shakeable, zero dependencies, TypeScript-first
    </p>

    {/* ── CTA buttons ── */}
    <div class="cta-buttons">
      <a href={`${base}getting-started/`} class="btn btn-primary">Get Started</a>
      <a href={`${base}icons/`} class="btn btn-secondary">Browse Icons</a>
    </div>

    {/* ── Install command ── */}
    <div class="install-box">
      <code id="install-cmd">npm install @modern-svg-icons/core</code>
      <button class="copy-btn" id="copy-install" aria-label="Copy install command">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>

    {/* ── Feature cards ── */}
    <div class="features">
      {features.map((f) => (
        <FeatureCard title={f.title} description={f.description} />
      ))}
    </div>
  </main>
</div>

<script>
  /* ── Icon showcase rotation ── */
  const sets = document.querySelectorAll('.icon-set');
  if (sets.length > 1) {
    let current = 0;
    setInterval(() => {
      sets[current].classList.remove('active');
      current = (current + 1) % sets.length;
      sets[current].classList.add('active');
    }, 5000);
  }

  /* ── Copy install command ── */
  document.getElementById('copy-install')?.addEventListener('click', () => {
    const cmd = document.getElementById('install-cmd')?.textContent ?? '';
    navigator.clipboard.writeText(cmd).then(() => {
      const btn = document.getElementById('copy-install');
      if (btn) {
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        }, 1500);
      }
    });
  });
</script>

<style>
  /* ── Grid background ── */
  .landing {
    min-height: 100vh;
    background: #0c0c0e;
    color: #e4e4e8;
    font-family: 'Outfit', sans-serif;
    position: relative;
  }

  .landing::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
      linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Nav ── */
  .landing-nav {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 32px;
  }

  .nav-logo {
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(135deg, #42a5f5, #66bb6a, #ffc107);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 24px;
  }

  .nav-links a {
    color: #8b8b96;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s;
  }

  .nav-links a:hover {
    color: #e4e4e8;
  }

  /* ── Hero ── */
  .hero {
    position: relative;
    z-index: 1;
    max-width: 800px;
    margin: 0 auto;
    padding: 60px 32px 100px;
    text-align: center;
  }

  /* ── Icon showcase ── */
  .icon-showcase {
    position: relative;
    height: 64px;
    margin-bottom: 40px;
  }

  .icon-set {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    opacity: 0;
    transition: opacity 0.6s ease-in-out;
  }

  .icon-set.active {
    opacity: 1;
  }

  .showcase-icon {
    width: 48px;
    height: 48px;
  }

  .showcase-icon :global(svg) {
    width: 48px;
    height: 48px;
  }

  /* ── Title ── */
  .title {
    font-size: 56px;
    font-weight: 700;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #42a5f5, #66bb6a, #ffc107);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 16px;
    line-height: 1.1;
  }

  .tagline {
    font-size: 18px;
    color: #8b8b96;
    line-height: 1.6;
    margin: 0 0 32px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  /* ── CTA buttons ── */
  .cta-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 28px;
  }

  .btn {
    padding: 12px 28px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    text-decoration: none;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #42a5f5;
    color: #fff;
  }

  .btn-primary:hover {
    background: #1e88e5;
  }

  .btn-secondary {
    background: transparent;
    color: #e4e4e8;
    border: 1px solid #2a2a32;
  }

  .btn-secondary:hover {
    border-color: #42a5f5;
    color: #42a5f5;
  }

  /* ── Install box ── */
  .install-box {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: #16161a;
    border: 1px solid #2a2a32;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 60px;
  }

  .install-box code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: #8b8b96;
  }

  .copy-btn {
    background: none;
    border: none;
    color: #8b8b96;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    transition: color 0.2s;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }

  .copy-btn:hover {
    color: #42a5f5;
  }

  /* ── Features ── */
  .features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    text-align: left;
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .title {
      font-size: 36px;
    }

    .tagline {
      font-size: 15px;
    }

    .features {
      grid-template-columns: 1fr;
    }

    .icon-showcase {
      height: 48px;
    }

    .showcase-icon {
      width: 36px;
      height: 36px;
    }

    .showcase-icon :global(svg) {
      width: 36px;
      height: 36px;
    }

    .hero {
      padding: 40px 20px 60px;
    }
  }
</style>
```

- [ ] **Step 3: Create `docs/src/pages/index.astro`**

```astro
---
import Landing from '../components/Landing.astro';

const title = 'modern-svg-icons — 514 animated SVG icons for developers';
---

<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content="514 animated SVG icons for developers — tree-shakeable, zero dependencies, TypeScript-first." />
    <link rel="sitemap" href={`${import.meta.env.BASE_URL}sitemap-index.xml`} />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;500;700&display=swap"
      rel="stylesheet"
    />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html { background: #0c0c0e; }
    </style>
  </head>
  <body>
    <Landing />
  </body>
</html>
```

- [ ] **Step 4: Verify build**

```bash
pnpm --filter @modern-svg-icons/docs build
```

Expected: Build succeeds. `dist/index.html` contains the landing page content with gradient title and feature cards.

- [ ] **Step 5: Commit**

```bash
git add docs/src/components/FeatureCard.astro docs/src/components/Landing.astro docs/src/pages/index.astro
git commit -m "feat(docs): add custom landing page with icon showcase"
```

---

### Task 4: Icon Gallery Component + Page

**Files:**
- Create: `docs/src/components/IconGallery.astro`
- Create: `docs/src/content/docs/icons.mdx`

- [ ] **Step 1: Create `docs/src/components/IconGallery.astro`**

This component reads all icon data at build time, renders a searchable/filterable grid, and uses client-side JS for interactivity. Icons use `<img>` tags (CSS animations inside SVG `<style>` blocks play natively in `<img>` elements — no need for inline SVG injection).

```astro
---
import fs from 'node:fs';
import path from 'node:path';

const base = import.meta.env.BASE_URL;

/* ── Read categories.json at build time ── */
const categoriesPath = path.join(process.cwd(), 'public', 'categories.json');
const rawCategories: Record<string, { category: string; tags: string[] }> =
  JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));

/* ── Reserved words matching scripts/build.ts ── */
const RESERVED_WORDS = new Set([
  'abstract','arguments','async','await','boolean','break','byte','case','catch',
  'char','class','const','continue','debugger','default','delete','do','double',
  'else','enum','eval','export','extends','false','final','finally','float','for',
  'from','function','goto','if','implements','import','in','instanceof','int',
  'interface','let','long','native','new','null','of','package','private',
  'protected','public','return','short','static','super','switch','synchronized',
  'this','throw','throws','transient','true','try','type','typeof','var','void',
  'volatile','while','with','yield',
]);

function kebabToCamel(str: string): string {
  let s = str;
  if (/^\d/.test(s)) s = 'http' + s;
  const camel = s.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
  return RESERVED_WORDS.has(camel) ? camel + 'Icon' : camel;
}

function formatCategory(slug: string): string {
  return slug
    .replace(/(^|-)(\w)/g, (_: string, sep: string, c: string) =>
      (sep ? ' ' : '') + c.toUpperCase()
    )
    .replace('Ai Ml', 'AI & ML')
    .replace('Data Api', 'Data & API')
    .replace('Frontend Ui', 'Frontend & UI')
    .replace('Design Ux', 'Design & UX')
    .replace('Testing Qa', 'Testing & QA')
    .replace('Cloud Devops', 'Cloud & DevOps')
    .replace('Database Storage', 'Database & Storage')
    .replace('Status Workflow', 'Status & Workflow')
    .replace('Files Media', 'Files & Media')
    .replace('Arrows Symbols', 'Arrows & Symbols')
    .replace('Math Crypto', 'Math & Crypto')
    .replace('Backend Languages', 'Backend & Languages')
    .replace('Http Codes', 'HTTP Codes');
}

/* ── Build icon list with computed metadata ── */
interface IconEntry {
  name: string;
  category: string;
  categoryDisplay: string;
  tags: string[];
  exportName: string;
}

const icons: IconEntry[] = Object.entries(rawCategories)
  .map(([name, meta]) => ({
    name,
    category: meta.category,
    categoryDisplay: formatCategory(meta.category),
    tags: meta.tags,
    exportName: kebabToCamel(name),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/* ── Unique category display names sorted alphabetically ── */
const categoryDisplayNames = [...new Set(icons.map((i) => i.categoryDisplay))].sort();
---

<div class="gallery-wrapper">
  <div class="gallery-header">
    <div class="gallery-count" id="gallery-count">{icons.length} icons</div>
  </div>

  <div class="gallery-controls">
    <div class="search-wrap">
      <svg viewBox="0 0 24 24" class="search-icon" aria-hidden="true">
        <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <input type="text" id="gallery-search" placeholder="Search icons..." autocomplete="off" />
    </div>
    <div class="filter-pills" id="gallery-filters">
      <button class="pill active" data-category="All">All</button>
      {categoryDisplayNames.map((cat) => (
        <button class="pill" data-category={cat}>{cat}</button>
      ))}
    </div>
  </div>

  <div class="icon-grid" id="icon-grid">
    {icons.map((icon) => (
      <div
        class="icon-card"
        data-name={icon.name}
        data-category={icon.categoryDisplay}
        data-tags={icon.tags.join(',')}
        data-export={icon.exportName}
      >
        <div class="icon-preview">
          <img
            src={`${base}icons/${icon.name}.svg`}
            alt={icon.name}
            width="48"
            height="48"
            loading="lazy"
          />
        </div>
        <span class="icon-name">{icon.name}</span>
        <div class="toast">Copied!</div>
      </div>
    ))}
  </div>

  <div class="gallery-empty" id="gallery-empty" hidden>No icons match your search</div>
</div>

<script>
  const searchEl = document.getElementById('gallery-search') as HTMLInputElement | null;
  const gridEl = document.getElementById('icon-grid');
  const emptyEl = document.getElementById('gallery-empty');
  const countEl = document.getElementById('gallery-count');
  const cards = gridEl ? Array.from(gridEl.querySelectorAll('.icon-card')) as HTMLElement[] : [];
  const pills = Array.from(document.querySelectorAll('.pill')) as HTMLElement[];

  let activeCategory = 'All';

  function render() {
    const q = searchEl?.value.toLowerCase().trim() ?? '';
    let visible = 0;

    for (const card of cards) {
      const name = card.dataset.name ?? '';
      const category = card.dataset.category ?? '';
      const tags = card.dataset.tags ?? '';

      const matchesCategory = activeCategory === 'All' || category === activeCategory;
      const matchesSearch = !q || name.includes(q) || tags.includes(q);

      if (matchesCategory && matchesSearch) {
        card.style.display = '';
        visible++;
      } else {
        card.style.display = 'none';
      }
    }

    if (emptyEl) emptyEl.hidden = visible > 0;
    if (countEl) countEl.textContent = `${visible} icon${visible !== 1 ? 's' : ''}`;
  }

  /* ── Pill click ── */
  for (const pill of pills) {
    pill.addEventListener('click', () => {
      for (const p of pills) p.classList.remove('active');
      pill.classList.add('active');
      activeCategory = pill.dataset.category ?? 'All';
      render();
    });
  }

  /* ── Search ── */
  searchEl?.addEventListener('input', render);

  /* ── Click to copy import statement ── */
  for (const card of cards) {
    card.addEventListener('click', () => {
      const exportName = card.dataset.export ?? '';
      const importStr = `import { ${exportName} } from '@modern-svg-icons/core';`;
      navigator.clipboard.writeText(importStr).then(() => {
        const toast = card.querySelector('.toast') as HTMLElement | null;
        if (toast) {
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 900);
        }
      });
    });
  }
</script>

<style>
  .gallery-wrapper {
    width: 100%;
  }

  .gallery-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
  }

  .gallery-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #8b8b96;
    background: #16161a;
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid #2a2a32;
  }

  .gallery-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  /* ── Search ── */
  .search-wrap {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: #8b8b96;
  }

  .search-wrap input {
    width: 100%;
    padding: 12px 14px 12px 42px;
    background: #16161a;
    border: 1px solid #2a2a32;
    border-radius: 12px;
    color: #e4e4e8;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-wrap input:focus {
    border-color: #42a5f5;
  }

  .search-wrap input::placeholder {
    color: #8b8b96;
  }

  /* ── Filter pills ── */
  .filter-pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .pill {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Outfit', sans-serif;
    background: #16161a;
    border: 1px solid #2a2a32;
    color: #8b8b96;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }

  .pill:hover {
    border-color: #8b8b96;
  }

  .pill.active {
    background: #42a5f5;
    border-color: #42a5f5;
    color: #fff;
  }

  /* ── Icon grid ── */
  .icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .icon-card {
    background: #16161a;
    border: 1px solid #2a2a32;
    border-radius: 14px;
    padding: 16px 8px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .icon-card:hover {
    border-color: #42a5f5;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(66, 165, 245, 0.1);
  }

  .icon-card:active {
    transform: translateY(0);
  }

  .icon-preview {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-preview img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  .icon-name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #8b8b96;
    text-align: center;
    line-height: 1.3;
    word-break: break-all;
  }

  /* ── Copied toast ── */
  .toast {
    position: absolute;
    inset: 0;
    background: rgba(66, 187, 106, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    border-radius: 14px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s;
  }

  .toast.show {
    opacity: 1;
  }

  /* ── Empty state ── */
  .gallery-empty {
    text-align: center;
    padding: 80px 20px;
    color: #8b8b96;
    font-size: 15px;
  }

  @media (max-width: 600px) {
    .icon-grid {
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 8px;
    }

    .icon-card {
      padding: 12px 6px 8px;
    }

    .icon-preview {
      width: 44px;
      height: 44px;
    }

    .icon-preview img {
      width: 40px;
      height: 40px;
    }
  }
</style>
```

- [ ] **Step 2: Create `docs/src/content/docs/icons.mdx`**

```mdx
---
title: Icon Gallery
description: Browse all 514 animated SVG icons — search by name, filter by category, click to copy the import statement.
---

import IconGallery from '../../components/IconGallery.astro';

<IconGallery />
```

- [ ] **Step 3: Verify build**

```bash
pnpm --filter @modern-svg-icons/docs build
```

Expected: Build succeeds. `dist/icons/index.html` contains the gallery with 514 icon cards.

- [ ] **Step 4: Commit**

```bash
git add docs/src/components/IconGallery.astro docs/src/content/docs/icons.mdx
git commit -m "feat(docs): add interactive icon gallery with search and filter"
```

---

### Task 5: Getting Started Page

**Files:**
- Modify: `docs/src/content/docs/getting-started.mdx` (replace placeholder)

- [ ] **Step 1: Replace `docs/src/content/docs/getting-started.mdx`**

```mdx
---
title: Getting Started
description: Install @modern-svg-icons/core and render your first animated icon.
---

## Installation

import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs>
  <TabItem label="npm">
    ```bash
    npm install @modern-svg-icons/core
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```bash
    pnpm add @modern-svg-icons/core
    ```
  </TabItem>
  <TabItem label="yarn">
    ```bash
    yarn add @modern-svg-icons/core
    ```
  </TabItem>
</Tabs>

## Your first icon

Each icon is a named export — a raw SVG string you inject into the DOM:

```js
import { terminal } from '@modern-svg-icons/core';

document.getElementById('my-icon').innerHTML = terminal;
```

That's it. The icon renders as an animated inline SVG — no framework required.

## Using `createIcon()` for customization

The `createIcon` function wraps any icon SVG with options for theming, sizing, and animation control:

```js
import { terminal, createIcon } from '@modern-svg-icons/core';

const icon = createIcon(terminal, {
  size: 32,
  theme: 'grayscale',
});

document.getElementById('my-icon').innerHTML = icon;
```

## Quick HTML example

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="icon"></div>
    <script type="module">
      import { rocket } from 'https://esm.sh/@modern-svg-icons/core';
      document.getElementById('icon').innerHTML = rocket;
    </script>
  </body>
</html>
```

## Next steps

- Browse the [Icon Gallery](../icons/) to find icons
- Learn about [theming and customization](../themes/)
- See the full [API Reference](../api-reference/)
```

- [ ] **Step 2: Verify build**

```bash
pnpm --filter @modern-svg-icons/docs build
```

Expected: Build succeeds. `dist/getting-started/index.html` renders with tabbed install commands. If the Tabs import fails, verify the file extension is `.mdx` (not `.md`).

- [ ] **Step 3: Commit**

```bash
git add docs/src/content/docs/getting-started.mdx
git commit -m "docs: add Getting Started page"
```

---

### Task 6: API Reference Page

**Files:**
- Create: `docs/src/content/docs/api-reference.md`

- [ ] **Step 1: Create `docs/src/content/docs/api-reference.md`**

```md
---
title: API Reference
description: Full API documentation for @modern-svg-icons/core — types, functions, and entrypoints.
---

## Entrypoints

| Import path | Contents |
|---|---|
| `@modern-svg-icons/core` | All 514 icon SVG strings + `createIcon` + `createIconFactory` |
| `@modern-svg-icons/core/utils` | `createIcon`, `createIconFactory`, `IconOptions` type |
| `@modern-svg-icons/core/meta` | `iconMeta` object, `IconMeta` type |

## Icon exports

Each icon is a named export containing a raw SVG string:

```ts
import { terminal, docker, rocket } from '@modern-svg-icons/core';

typeof terminal; // string — raw SVG markup
```

Icon names use camelCase. Kebab-case filenames are converted:
- `terminal` → `terminal`
- `pull-request` → `pullRequest`
- `200-ok` → `http200Ok` (numeric prefix gets `http`)
- `async` → `asyncIcon` (reserved word gets `Icon` suffix)

## `IconOptions`

```ts
interface IconOptions {
  /** Set to false to remove CSS animations. Default: true */
  animated?: boolean;
  /** Override width and height attributes (in pixels) */
  size?: number;
  /** Color theme: 'default' | 'grayscale' | 'dark' | hex string */
  theme?: 'default' | 'grayscale' | 'dark' | string;
  /** Direct palette override: 3-5 hex colors mapped by luminance. Overrides theme. */
  palette?: string[];
  /** Animation speed preset */
  speed?: 'slow' | 'normal' | 'fast';
}
```

## `createIcon(svg, options?)`

Applies theme, size, speed, and animation options to an SVG string. Returns the modified SVG string.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `svg` | `string` | Raw SVG string (from an icon export) |
| `options` | `IconOptions` | Optional customization |

**Returns:** `string` — the modified SVG markup.

```ts
import { terminal, createIcon } from '@modern-svg-icons/core';

// No options — returns the original SVG unchanged
createIcon(terminal);

// Grayscale, 32px, no animation
createIcon(terminal, {
  theme: 'grayscale',
  size: 32,
  animated: false,
});

// Custom color theme
createIcon(terminal, { theme: '#FF5722' });

// Direct palette
createIcon(terminal, {
  palette: ['#E91E63', '#9C27B0', '#3F51B5', '#009688', '#FF9800'],
});

// Fast animation
createIcon(terminal, { speed: 'fast' });
```

## `createIconFactory(defaults)`

Returns a function with baked-in defaults. Useful for applying a consistent theme across your app.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `defaults` | `IconOptions` | Default options applied to every call |

**Returns:** `(svg: string, overrides?: IconOptions) => string`

```ts
import { createIconFactory, terminal, docker } from '@modern-svg-icons/core';

const icon = createIconFactory({ theme: 'dark', size: 24 });

document.body.innerHTML = icon(terminal) + icon(docker);

// Override defaults per-call
const bigTerminal = icon(terminal, { size: 64 });
```

## `IconMeta` type

```ts
interface IconMeta {
  name: string;      // kebab-case filename (e.g. "pull-request")
  category: string;  // category slug (e.g. "dev-tools")
  tags: string[];    // searchable tags
}
```

## `iconMeta`

A `Record<string, IconMeta>` mapping every camelCase export name to its metadata:

```ts
import { iconMeta } from '@modern-svg-icons/core/meta';

iconMeta.terminal;
// { name: "terminal", category: "dev-tools", tags: ["terminal","cli","bash","console"] }

// Find all AI icons
const aiIcons = Object.entries(iconMeta)
  .filter(([, meta]) => meta.category === 'ai-ml');
```
```

- [ ] **Step 2: Verify build**

```bash
pnpm --filter @modern-svg-icons/docs build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add docs/src/content/docs/api-reference.md
git commit -m "docs: add API Reference page"
```

---

### Task 7: Themes & Customization Page

**Files:**
- Create: `docs/src/content/docs/themes.md`

- [ ] **Step 1: Create `docs/src/content/docs/themes.md`**

```md
---
title: Themes & Customization
description: Retheme icons with presets, custom colors, palettes, speed control, and the factory pattern.
---

## Theme presets

Pass a `theme` string to `createIcon()`:

### Default

The original icon colors — no transformation applied:

```js
import { terminal, createIcon } from '@modern-svg-icons/core';

createIcon(terminal, { theme: 'default' });
// Same as: terminal (unchanged)
```

### Grayscale

Converts all colors to their luminance-equivalent grayscale:

```js
createIcon(terminal, { theme: 'grayscale' });
```

### Dark

Darkens all colors by 40% (reduces HSL lightness):

```js
createIcon(terminal, { theme: 'dark' });
```

## Custom color theme

Pass any hex color string. The library generates 5 shades from it and maps them to the icon's colors by luminance:

```js
// Retheme to orange
createIcon(terminal, { theme: '#FF5722' });

// Retheme to purple
createIcon(terminal, { theme: '#9C27B0' });
```

## Palette override

For full control, pass an array of 3-5 hex colors. Colors are sorted by luminance and mapped to the icon's original colors in luminance order:

```js
createIcon(terminal, {
  palette: ['#E91E63', '#9C27B0', '#3F51B5', '#009688', '#FF9800'],
});
```

The `palette` option takes precedence over `theme` if both are set.

## Animation speed

Three presets control animation duration:

| Preset | Effect |
|---|---|
| `'slow'` | 2× duration (half speed) |
| `'normal'` | Original timing (default) |
| `'fast'` | 0.5× duration (double speed) |

```js
createIcon(terminal, { speed: 'slow' });
createIcon(terminal, { speed: 'fast' });
```

## Disabling animations

Set `animated: false` to strip all `<style>` blocks and CSS class attributes:

```js
createIcon(terminal, { animated: false });
```

This produces a static SVG with no animation — useful for print or reduced-motion contexts.

## Size override

Override the SVG `width` and `height` attributes:

```js
createIcon(terminal, { size: 16 });  // 16×16px
createIcon(terminal, { size: 128 }); // 128×128px
```

## Factory pattern

Use `createIconFactory()` to bake in defaults across your entire app:

```js
import { createIconFactory } from '@modern-svg-icons/core';

const icon = createIconFactory({
  theme: 'dark',
  size: 24,
  speed: 'fast',
});

// Every call uses dark theme, 24px, fast speed
icon(terminal);
icon(docker);

// Override per-call
icon(rocket, { size: 64, theme: 'default' });
```

## Combining options

All options compose naturally:

```js
createIcon(terminal, {
  theme: 'grayscale',
  size: 48,
  speed: 'slow',
});

createIcon(terminal, {
  palette: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'],
  size: 32,
  animated: false,
});
```
```

- [ ] **Step 2: Verify build**

```bash
pnpm --filter @modern-svg-icons/docs build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add docs/src/content/docs/themes.md
git commit -m "docs: add Themes & Customization page"
```

---

### Task 8: Export CLI Page

**Files:**
- Create: `docs/src/content/docs/export-cli.md`

- [ ] **Step 1: Create `docs/src/content/docs/export-cli.md`**

```md
---
title: Export CLI
description: Generate PNG, WebP, and GIF raster exports from SVG icons using the built-in CLI.
---

## Purpose

The export CLI converts animated SVG icons to raster formats (PNG, WebP, GIF) for platforms that don't support SVG — Notion custom emoji, Slack, Discord, etc.

## Prerequisites

The CLI uses Puppeteer for headless browser rendering:

```bash
npm install puppeteer
```

Puppeteer is listed as a devDependency in the monorepo root. For GIF export, the optional `canvas` and `gif-encoder-2` packages are also needed.

## Usage

Run from the monorepo root:

```bash
npx tsx scripts/export.ts [options]
```

Or via the workspace script:

```bash
pnpm export [options]
```

## Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--format` | `png \| webp \| gif` | `png` | Output format |
| `--size` | `number` | `128` | Width and height in pixels |
| `--icons` | `string` | all | Comma-separated icon names (kebab-case) |
| `--theme` | `string` | `default` | Theme preset or hex color |
| `--out` | `string` | `exports/` | Output directory |

## Examples

### Export all icons as 128×128 PNG (default)

```bash
pnpm export
```

### Export specific icons as WebP

```bash
pnpm export --format webp --icons terminal,docker,rocket
```

### Export for Notion emoji (128px PNG)

```bash
pnpm export --format png --size 128 --out notion-emoji/
```

### Export with grayscale theme

```bash
pnpm export --theme grayscale
```

### Export large icons for a hero section

```bash
pnpm export --format webp --size 512 --icons rocket,deploy,lightning
```

### Export animated GIF

```bash
pnpm export --format gif --icons terminal --size 64
```

GIF export captures multiple frames of the CSS animation and encodes them as an animated GIF. Requires `canvas` and `gif-encoder-2`.

## Output

Exported files are saved to the output directory with kebab-case filenames:

```
exports/
├── terminal.png
├── docker.png
├── rocket.png
└── ...
```
```

- [ ] **Step 2: Verify build**

```bash
pnpm --filter @modern-svg-icons/docs build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add docs/src/content/docs/export-cli.md
git commit -m "docs: add Export CLI page"
```

---

### Task 9: Contributing + Changelog + FAQ Pages

**Files:**
- Create: `docs/src/content/docs/contributing.md`
- Create: `docs/src/content/docs/changelog.md`
- Create: `docs/src/content/docs/faq.md`

- [ ] **Step 1: Create `docs/src/content/docs/contributing.md`**

```md
---
title: Contributing
description: How to add new icons, update categories, and submit pull requests.
---

## Adding new icons

Icons are generated using the AI prompt in [`PROMPT.md`](https://github.com/rizzdev/modern-svg-icons/blob/master/PROMPT.md). The workflow:

1. Open a Claude conversation
2. Paste the full contents of `PROMPT.md`
3. Append your icon names: `ICONS TO GENERATE: joystick, pixel-heart, save-game`
4. Claude outputs raw SVG — save each to `icons/{name}.svg`

## Icon spec

Every icon must follow these rules:

- **ViewBox:** `0 0 44 44`
- **Size attributes:** `width="256" height="256"`
- **Colors:** Use the palette defined in `PROMPT.md` (17 named colors)
- **Style:** Flat shapes only — no gradients, shadows, blur, or opacity
- **Animation:** One contextual CSS `@keyframes` animation in a `<style>` tag
- **Duration:** 1.5–3s, `ease-in-out`
- **Filename:** kebab-case (e.g. `save-game.svg`)

## Updating `categories.json`

After adding icons, update `scripts/categories.json`:

```json
{
  "save-game": {
    "category": "gaming",
    "tags": ["save", "game", "floppy", "checkpoint"]
  }
}
```

Each entry needs:
- `category` — one of the 23 existing category slugs (kebab-case)
- `tags` — 3-4 searchable keywords

## Building

After adding icons and updating categories:

```bash
pnpm build:icons   # Regenerates TypeScript source from SVGs
pnpm build         # Rebuilds the core package
pnpm test          # Runs tests
```

## Pull request workflow

1. Fork the repo and create a branch
2. Add your icons and update `categories.json`
3. Run `pnpm build:icons && pnpm build && pnpm test`
4. Submit a PR with the new SVG files and updated `categories.json`

Keep PRs focused — one theme or category per PR when possible.
```

- [ ] **Step 2: Create `docs/src/content/docs/changelog.md`**

```md
---
title: Changelog
description: Release history for @modern-svg-icons/core.
---

## v0.1.0

*Initial release*

- 514 animated SVG icons across 23 categories
- Tree-shakeable named exports (ESM + CJS)
- `createIcon()` with theme, palette, size, speed, and animation toggle
- `createIconFactory()` for global defaults
- Icon metadata via `@modern-svg-icons/core/meta`
- Full TypeScript declarations
- Raster export CLI (PNG, WebP, GIF via Puppeteer)

---

## Format for future entries

```md
## vX.Y.Z

*YYYY-MM-DD*

### Added
- New feature description

### Changed
- Behavioral change description

### Fixed
- Bug fix description
```
```

- [ ] **Step 3: Create `docs/src/content/docs/faq.md`**

```md
---
title: FAQ
description: Frequently asked questions about modern-svg-icons.
---

## How does tree-shaking work?

Each icon is a named export in the ESM build. Bundlers like Vite, webpack, Rollup, and esbuild will only include the icons you actually import. If you import 5 icons, only those 5 SVG strings end up in your bundle.

```js
// Only 'terminal' and 'rocket' are bundled
import { terminal, rocket } from '@modern-svg-icons/core';
```

## What's the bundle size impact?

Each icon is roughly 1-2 KB of SVG string (minified). Importing 10 icons adds ~10-20 KB to your bundle (before gzip). The `createIcon` and `createIconFactory` utilities add ~1 KB.

The full package (all 514 icons) is ~500 KB, but tree-shaking means you only pay for what you use.

## Can I use these with React / Vue / Svelte?

Yes. The icons are raw SVG strings, so you can inject them with `dangerouslySetInnerHTML` (React), `v-html` (Vue), or `{@html}` (Svelte):

**React:**
```jsx
import { terminal } from '@modern-svg-icons/core';

function Icon() {
  return <span dangerouslySetInnerHTML={{ __html: terminal }} />;
}
```

**Vue:**
```vue
<template>
  <span v-html="terminal" />
</template>

<script setup>
import { terminal } from '@modern-svg-icons/core';
</script>
```

**Svelte:**
```svelte
<script>
  import { terminal } from '@modern-svg-icons/core';
</script>

<span>{@html terminal}</span>
```

## How do I disable animations?

Pass `animated: false` to `createIcon()`:

```js
import { terminal, createIcon } from '@modern-svg-icons/core';

const staticIcon = createIcon(terminal, { animated: false });
```

This strips all `<style>` blocks and CSS class attributes from the SVG.

## Can I use these as Notion / Slack emojis?

Yes, but these platforms require raster images (PNG). Use the [Export CLI](../export-cli/) to convert:

```bash
pnpm export --format png --size 128 --icons terminal,rocket,fire
```

Then upload the PNGs as custom emoji in your workspace.

## Are the animations accessible?

The icons use CSS animations with `ease-in-out` timing. Users with `prefers-reduced-motion: reduce` set in their OS will still see the animations unless you explicitly handle it. To respect reduced motion:

```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const icon = createIcon(terminal, { animated: !prefersReduced });
```
```

- [ ] **Step 4: Verify build**

```bash
pnpm --filter @modern-svg-icons/docs build
```

Expected: Build succeeds. All 8 content pages render.

- [ ] **Step 5: Commit**

```bash
git add docs/src/content/docs/contributing.md docs/src/content/docs/changelog.md docs/src/content/docs/faq.md
git commit -m "docs: add Contributing, Changelog, and FAQ pages"
```

---

### Task 10: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/docs.yml`

- [ ] **Step 1: Create `.github/workflows/docs.yml`**

```yaml
name: Deploy Docs

on:
  push:
    branches: [master]
    paths:
      - 'docs/**'
      - 'icons/**'
      - 'scripts/categories.json'

  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Build docs
        run: pnpm --filter @modern-svg-icons/docs build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify workflow syntax**

```bash
cat .github/workflows/docs.yml | head -5
```

Expected: File exists and YAML is valid. (A full syntax check can be done with `actionlint` if installed.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/docs.yml
git commit -m "ci: add GitHub Pages docs deployment workflow"
```

---

### Task 11: Final Build Verification

- [ ] **Step 1: Clean build from scratch**

```bash
rm -rf docs/dist docs/public/icons docs/public/categories.json docs/.astro
pnpm --filter @modern-svg-icons/docs build
```

Expected: Sync script runs, icons copied, Astro builds all pages, no errors.

- [ ] **Step 2: Verify all pages exist in output**

```bash
ls docs/dist/
ls docs/dist/getting-started/
ls docs/dist/api-reference/
ls docs/dist/themes/
ls docs/dist/icons/
ls docs/dist/export-cli/
ls docs/dist/contributing/
ls docs/dist/changelog/
ls docs/dist/faq/
```

Expected: Each directory contains an `index.html`.

- [ ] **Step 3: Verify icons are in output**

```bash
ls docs/dist/icons/*.svg | head -5
ls docs/dist/icons/*.svg | wc -l
```

Expected: 514 SVG files in the output icons directory.

- [ ] **Step 4: Preview locally**

```bash
pnpm --filter @modern-svg-icons/docs preview
```

Expected: Site serves at `localhost:4321/modern-svg-icons/`. Landing page shows gradient title, animated icons, and feature cards. Clicking "Browse Icons" navigates to the gallery. Gallery shows 514 icons with working search, filter, and copy-to-clipboard.

- [ ] **Step 5: Final commit (if any fixes were needed)**

```bash
git add -A docs/
git commit -m "fix(docs): final adjustments from build verification"
```

Only create this commit if changes were made during verification.
