<div align="center">

# ⚡ modern-svg-icons

**514 animated SVG icons for developers — flat material style with CSS animations baked in.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Icons](https://img.shields.io/badge/icons-514-42A5F5.svg)]()
[![Categories](https://img.shields.io/badge/categories-23-66BB6A.svg)]()

[Browse Gallery](#gallery) · [Usage](#usage) · [Categories](#categories) · [Generate More](#generate-more) · [Contributing](#contributing)

</div>

---

<div align="center">
  <img src="preview.svg" alt="Icon preview grid" width="600">
</div>

## Why?

Most icon sets are either static SVGs with no personality, or heavyweight libraries that ship 200KB of JavaScript to render a chevron. **modern-svg-icons** are standalone SVG files with subtle CSS animations baked right in — no runtime, no dependencies, no build step. Drop them in and they just work.

## Features

- 🎨 **Flat material style** — Google Material-inspired flat shapes with distinct colors per element
- ✨ **Animated** — Each icon has a contextual CSS animation (cursor blinks, gears spin, data flows)
- 📦 **Zero dependencies** — Pure SVG with embedded `<style>` tags, works everywhere
- 🌗 **Scalable** — Vector-based, looks crisp at any size from 16px emoji to 256px hero
- 🏷️ **23 categories** — Dev tools, infrastructure, security, AI/ML, HTTP codes, gaming, and more
- 🧠 **AI-generated pipeline** — Includes a prompt to generate unlimited new icons in the same style

## Gallery

**[Browse all 514 icons →](gallery.html)**

The gallery lets you search, filter by category, and preview every icon.

## Usage

### npm (recommended)

```bash
npm install @modern-svg-icons/core
```

```js
// Named import — tree-shakeable
import { terminal } from '@modern-svg-icons/core';

// Inject into the DOM
document.getElementById('icon').innerHTML = terminal;
```

#### Customization with `createIcon()`

```js
import { createIcon } from '@modern-svg-icons/core';

const icon = createIcon('terminal', {
  size: 32,        // px
  className: 'my-icon',
  ariaLabel: 'Terminal',
});
document.body.appendChild(icon); // returns an <svg> element
```

#### Metadata for search / filter

```js
import { metadata } from '@modern-svg-icons/core';

// [{ name: 'terminal', category: 'Dev Tools', tags: ['cli', 'bash', ...] }, ...]
const devTools = metadata.filter(icon => icon.category === 'Dev Tools');
```

### CDN (unpkg / jsDelivr)

No build step needed — load the bundle directly in a `<script>` tag:

```html
<!-- unpkg -->
<script src="https://unpkg.com/@modern-svg-icons/core"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@modern-svg-icons/core"></script>

<script>
  // Available as a global after the script loads
  document.getElementById('icon').innerHTML = ModernSvgIcons.terminal;
</script>
```

### Local files

Clone the repo and reference icons from the `icons/` directory:

```bash
git clone https://github.com/knoxhack/modern-svg-icons.git
```

```html
<img src="icons/terminal.svg" width="32" alt="terminal">
```

### Notion Custom Emoji

SVGs need to be converted to PNG for Notion's custom emoji uploader. Use any SVG-to-PNG tool at 256×256:

```bash
# Using cairosvg (Python)
pip install cairosvg
cairosvg icons/terminal.svg -o terminal.png -W 256 -H 256

# Batch convert all
for f in icons/*.svg; do cairosvg "$f" -o "png/$(basename ${f%.svg}.png)" -W 256 -H 256; done
```

### In React/Vue/HTML

```html
<!-- Inline -->
<img src="/icons/deploy.svg" width="24" height="24" alt="deploy">

<!-- As background -->
<div style="background-image: url('/icons/rocket.svg'); width: 48px; height: 48px;"></div>
```

## Categories

| Category | Count | Examples |
|----------|-------|---------|
| Dev Tools | 55 | `terminal` `code` `git` `debug` `hot-reload` `monorepo` |
| Infrastructure | 54 | `server` `cloud` `kubernetes` `load-balancer` `vpc` `autoscale` |
| Security | 50 | `lock` `shield` `encryption` `zero-trust` `vpn` `captcha` |
| Data & API | 49 | `json` `graphql` `websocket` `grpc` `swagger` `api-gateway` |
| Frontend & UI | 47 | `browser` `react-icon` `tailwind` `modal` `spinner` `skeleton` |
| Backend & Languages | 39 | `python` `rust` `typescript` `kotlin` `wasm` `deno` |
| AI & ML | 33 | `ai-brain` `neural-network` `llm` `transformer` `rag` `diffusion` |
| Cloud & DevOps | 17 | `aws` `terraform` `vercel` `grafana` `lambda` |
| Status & Workflow | 15 | `todo` `in-progress` `done` `blocked` `urgent` |
| Database & Storage | 15 | `sql` `nosql` `sharding` `replication` `transaction` |
| Networking | 14 | `tcp` `http` `ssh` `ping` `cors` |
| HTTP Codes | 14 | `200-ok` `404-not-found` `500-server-error` `circuit-breaker` |
| Testing & QA | 12 | `unit-test` `coverage` `green-build` `flaky-test` |
| Gaming | 10 | `joystick` `trophy` `dice` `gem` `potion` |
| Files & Media | 10 | `file` `folder` `pdf` `video` `yaml` |
| Arrows & Symbols | 10 | `arrow-up` `checkmark` `infinity` `plus` |
| Design & UX | 8 | `wireframe` `figma` `color-picker` `accessibility` |
| Collaboration | 7 | `kanban` `sprint` `roadmap` `brainstorm` |
| Nature | 7 | `tree` `atom` `dna` `compass` `globe` |
| Math & Crypto | 7 | `sha256` `blockchain` `base64` `binary` |
| DevEx | 7 | `vscode` `vim` `tmux` `keyboard` |
| Analytics | 5 | `chart` `dashboard` `funnel` `trend` |
| General | 31 | `settings` `search` `fire` `lightning` `magic` |

## Icon Naming

All icons use **kebab-case** filenames:

```
terminal.svg
pull-request.svg
dns-lookup.svg
hot-reload.svg
500-server-error.svg
```

## Generate More

A generation prompt is included at [`PROMPT.md`](PROMPT.md). Paste it into any Claude conversation and append your icon names:

```
[paste PROMPT.md contents]

ICONS TO GENERATE:
joystick, pixel-heart, save-game, respawn, game-over
```

Claude will output raw SVGs in the exact same flat material animated style. Save them to `icons/` and you're done.

## Animation Styles

Each icon's animation is contextual to its concept:

| Concept | Animation |
|---------|-----------|
| Code/Terminal | Cursor blink, lines typing in |
| Network/Data | Flowing dots, dashed-line pulses |
| Security | Shield pulse, lock click, scan lines |
| Status | Color toggle, checkmark pop |
| Tools/Gears | Spinning, bouncing |
| Loading | Spinners, progress fills |
| General | Gentle float, glow, scale pulse |

All animations are CSS-only (`@keyframes` inside `<style>` tags), `ease-in-out`, 1.5–3s duration.

## Contributing

Add new icons to `icons/` following the existing style. Run through the checklist:

- [ ] ViewBox is `0 0 44 44`, width/height `256`
- [ ] Uses colors from the palette (see `PROMPT.md`)
- [ ] Has one subtle CSS animation in a `<style>` tag
- [ ] Filename is kebab-case
- [ ] Flat shapes only — no gradients, shadows, or blur

## License

[MIT](LICENSE) — use these icons in anything, commercial or otherwise.

---

<div align="center">

**[Browse Gallery](gallery.html)** · **[Report Issue](https://github.com/knoxhack/modern-svg-icons/issues)**

</div>
