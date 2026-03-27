# GitHub Pages Documentation Site — Design Spec

## Overview

Build a documentation site for `@modern-svg-icons/core` using Astro Starlight, deployed to GitHub Pages. Includes a custom centered hero landing page, interactive icon gallery, and full API/usage documentation across 8 pages. Dark theme with the subtle grid background pattern from the existing gallery.

## Tech Stack

- **Astro + Starlight** — static site generator with docs theme
- **GitHub Pages** — hosting via GitHub Actions deployment
- **Astro components** — custom landing page and icon gallery

## Site Structure

```
docs/                              # In the monorepo root (not under packages/)
├── astro.config.mjs
├── package.json                   # @modern-svg-icons/docs (workspace member)
├── src/
│   ├── content/
│   │   └── docs/
│   │       ├── getting-started.md
│   │       ├── api-reference.md
│   │       ├── themes.md
│   │       ├── export-cli.md
│   │       ├── contributing.md
│   │       ├── changelog.md
│   │       └── faq.md
│   ├── components/
│   │   ├── Landing.astro          # Custom centered hero
│   │   ├── IconGallery.astro      # Interactive icon browser
│   │   └── FeatureCard.astro      # Feature highlight cards
│   ├── pages/
│   │   └── index.astro            # Landing page entry
│   └── styles/
│       └── custom.css             # Grid background, dark theme overrides
└── public/
    └── icons/                     # Copy of root icons/ for gallery rendering
```

The `docs/` directory is added to `pnpm-workspace.yaml` as a workspace member. It is not published to npm — it's only for the documentation site.

## Landing Page

### Layout: Centered Hero

Dark background (`#0c0c0e`) with the subtle grid pattern from `gallery.html`:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255,255,255,.015) 1px, transparent 1px),
    linear-gradient(rgba(255,255,255,.015) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}
```

### Hero Content (top to bottom)

1. **Animated icon showcase** — a row of 6-8 actual SVG icons from the library, displayed inline with their CSS animations playing. Icons rotate on a timer (swap a new random set every 5 seconds with a fade transition).

2. **Title** — `modern-svg-icons` in large gradient text (blue `#42A5F5` → green `#66BB6A` → yellow `#FFC107`), matching the gallery header style.

3. **Tagline** — "514 animated SVG icons for developers — tree-shakeable, zero dependencies, TypeScript-first" in subdued text color (`#8b8b96`).

4. **CTA buttons** — two buttons side by side:
   - "Get Started" — primary (filled `#42A5F5`), links to `/getting-started`
   - "Browse Icons" — secondary (outlined), links to `/icons` (the gallery page)

5. **Install command** — monospace box with copy button:
   ```
   npm install @modern-svg-icons/core
   ```

6. **Feature cards** — below the fold, 4 cards in a row:
   - **Tree-shakeable** — "Import only what you use. 514 icons in the package, only the ones you import in your bundle."
   - **Animated** — "Subtle CSS animations baked into every icon. Cursor blinks, gears spin, data flows."
   - **Themeable** — "Grayscale, dark mode, custom colors. One line to retheme every icon."
   - **TypeScript** — "Full type declarations and autocomplete for all 514 icon names."

## Docs Pages

All markdown-based, auto-rendered by Starlight with sidebar navigation.

### Getting Started
- Install command (npm/pnpm/yarn)
- First import example
- Basic `createIcon()` usage
- Quick example showing an icon rendered in HTML

### API Reference
- `IconOptions` interface — all fields with types and descriptions
- `createIcon(svg, options?)` — params, return value, examples
- `createIconFactory(defaults)` — params, return value, examples
- Entrypoints: `@modern-svg-icons/core`, `@modern-svg-icons/core/utils`, `@modern-svg-icons/core/meta`
- `IconMeta` type and `iconMeta` object

### Themes & Customization
- Theme presets: `'default'`, `'grayscale'`, `'dark'`
- Custom color theme (hex string)
- Palette override (array of hex colors)
- Speed presets: `'slow'`, `'normal'`, `'fast'`
- Factory pattern for global defaults
- Code examples for each

### Icon Gallery
- Custom Astro component (port of `gallery.html`)
- Search by name
- Filter by category (23 category pills)
- Click icon to copy import statement: `import { terminal } from '@modern-svg-icons/core'`
- Icons rendered as inline SVGs (not `<img>` tags) so animations play
- Loads from `categories.json` as single source of truth
- Grid background pattern consistent with landing page

### Export CLI
- Purpose (generating raster emojis for Notion, Slack, etc.)
- Installation (Puppeteer dependency)
- All flags: `--format`, `--size`, `--icons`, `--theme`, `--out`
- Examples for common use cases

### Contributing
- How to add new icons (PROMPT.md workflow)
- Icon spec (viewBox, colors, animation rules)
- Updating `categories.json`
- PR workflow

### Changelog
- v0.1.0 initial release notes
- Format for future entries

### FAQ
- How does tree-shaking work?
- What's the bundle size impact?
- Can I use these with React/Vue/Svelte?
- How do I disable animations?
- Can I use these as Notion/Slack emojis?

## Visual Design

### Theme
Dark theme throughout, consistent with the existing gallery aesthetic:
- Background: `#0c0c0e`
- Surface: `#16161a`
- Border: `#2a2a32`
- Text: `#e4e4e8`
- Muted text: `#8b8b96`
- Accent: `#42A5F5` (blue)
- Accent 2: `#66BB6A` (green)
- Accent 3: `#FFC107` (yellow)

### Grid Background
The subtle grid pattern from `gallery.html` is applied to:
- Landing page (full page)
- Icon gallery page

### Fonts
- Headings: `Outfit` (from Google Fonts, matching gallery)
- Code/monospace: `JetBrains Mono` (matching gallery)
- Body: Starlight default or `Outfit`

## GitHub Actions Deployment

New workflow: `.github/workflows/docs.yml`

```yaml
name: Deploy Docs

on:
  push:
    branches: [master]
    paths: ['docs/**', 'icons/**', 'scripts/categories.json']

triggers:
- Changes to docs/ content
- Changes to icons/ (gallery needs to reflect new icons)
- Changes to categories.json (gallery categories)

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - Checkout
      - Setup pnpm + Node 20
      - pnpm install
      - Copy icons/ to docs/public/icons/
      - Build Astro site
      - Deploy to GitHub Pages
```

Site URL: `https://rizzdev.github.io/modern-svg-icons/`

## Workspace Integration

- Add `docs` to `pnpm-workspace.yaml`: `packages: ["packages/*", "docs"]`
- Add `.superpowers/` to `.gitignore`
- The docs site imports nothing from `@modern-svg-icons/core` at build time — it references the raw SVG files and `categories.json` directly. This avoids a circular dependency.

## Out of Scope

- Custom domain (can be added later via GitHub Pages settings)
- Search analytics
- i18n / translations
- Blog section
