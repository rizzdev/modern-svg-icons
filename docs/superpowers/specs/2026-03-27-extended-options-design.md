# Extended Icon Options — Design Spec

## Overview

Extend `@modern-svg-icons/core` with four features: theme/color overrides, animation speed presets, a factory function for global defaults, and a local CLI for exporting icons to raster formats (PNG, GIF, WebP). All runtime features are zero-dependency string manipulation on SVG strings. The export CLI is a local-only script using Puppeteer.

## 1. Extended `IconOptions` API

The existing `IconOptions` interface in `packages/core/src/utils.ts` gains new fields:

```ts
interface IconOptions {
  // Existing
  animated?: boolean
  size?: number

  // New: Theme
  theme?: 'default' | 'grayscale' | 'dark' | string  // string = hex color like '#3B82F6'
  palette?: string[]                                    // 3-5 colors to replace fills

  // New: Animation speed
  speed?: 'slow' | 'normal' | 'fast'                  // 0.5x, 1x, 2x multipliers
}
```

### Theme

Controls the color palette of the icon. Applied by finding all `fill="..."` and `stroke="..."` hex values in the SVG and replacing them.

- `'default'` — no color changes.
- `'grayscale'` — converts each fill/stroke to its luminance-equivalent gray. A bright yellow becomes a light gray, a dark navy becomes a dark gray. Preserves visual contrast between elements.
- `'dark'` — shifts all fills/strokes darker by reducing lightness by ~40% in HSL space. Intended for icons on dark backgrounds where the original colors are too bright.
- Any hex string (e.g. `'#3B82F6'`) — auto-generates 5 shades from the base color by varying lightness in HSL: L+30%, L+15%, base, L-15%, L-30%. The icon's original fills are sorted by luminance and mapped 1:1 to the generated shades sorted by luminance.

### Palette

Overrides `theme` if both are provided. Provides direct control over color mapping.

```ts
createIcon(terminal, {
  palette: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560']
})
```

The provided colors are sorted by luminance and mapped to the icon's original fills sorted by luminance. If the palette has fewer colors than the icon's fills, the nearest shade is reused. If more colors than fills, extras are ignored.

### Speed

Controls animation speed via presets that multiply the original durations:

| Preset | Multiplier | `.8s` becomes | `3s` becomes |
|--------|-----------|---------------|--------------|
| `'slow'` | 0.5x | `1.6s` | `6s` |
| `'normal'` | 1x | `.8s` | `3s` |
| `'fast'` | 2x | `.4s` | `1.5s` |

The speed option modifies duration values found in the `<style>` block's `animation` shorthand (e.g., `animation: name 1.5s ease-in-out infinite`) and `animation-duration` properties. `@keyframes` percentage-based timing is untouched — only the playback speed changes.

If `animated: false` is also set, `speed` is ignored.

## 2. Factory Function

A new export from `@modern-svg-icons/core/utils`:

```ts
import { createIconFactory } from '@modern-svg-icons/core/utils'
import { terminal, docker, lock } from '@modern-svg-icons/core'

const icon = createIconFactory({
  theme: 'grayscale',
  speed: 'fast',
  size: 24
})

icon(terminal)                          // all defaults applied
icon(docker)                            // all defaults applied
icon(lock, { size: 48 })                // override size, keep other defaults
icon(lock, { theme: 'default' })        // override theme, keep other defaults
```

**Behavior:**
- `createIconFactory(defaults)` returns a function `(svg: string, overrides?: IconOptions) => string`.
- Per-call `overrides` shallow-merge over the factory defaults. Each field is independently overridable.
- `createIcon()` remains unchanged — it's the no-config entrypoint.
- Both `createIcon` and `createIconFactory` export from `@modern-svg-icons/core/utils`.

**Implementation:** `createIconFactory` is trivially implemented as:

```ts
function createIconFactory(defaults: IconOptions) {
  return (svg: string, overrides?: IconOptions) =>
    createIcon(svg, { ...defaults, ...overrides })
}
```

## 3. Color Manipulation (internals)

All color math is pure functions with zero external dependencies. Implemented as internal helpers in utils.ts (not exported).

### Hex parsing and luminance

- Parse hex colors: `#RRGGBB` or `#RGB` → `[r, g, b]` (0-255)
- Relative luminance: `0.2126 * R/255 + 0.7152 * G/255 + 0.0722 * B/255` (0 = black, 1 = white)

### HSL conversion

- Hex → HSL for lightness manipulation (dark theme, shade generation)
- HSL → Hex for converting back after manipulation
- Standard conversion formulas, no dependencies

### Color replacement in SVG

Find all `fill="..."` and `stroke="..."` attributes containing hex colors via regex. Build a map of original colors → replacement colors, then do a single pass replacement.

Colors that are not hex (e.g., `fill="none"`, `fill="currentColor"`) are left untouched.

### Grayscale

For each unique hex color in the SVG:
1. Calculate luminance
2. Convert to gray: `#XXXXXX` where `XX` = `round(luminance * 255)` in hex

### Dark

For each unique hex color:
1. Convert to HSL
2. Multiply L by 0.6
3. Convert back to hex

### Custom color (single hex)

1. Convert input hex to HSL, extract base lightness (L)
2. Generate 5 shades: L+30%, L+15%, L, L-15%, L-30% (clamped to 0-100%)
3. Sort generated shades by luminance
4. Sort icon's original fill/stroke colors by luminance
5. Map 1:1 (nth-darkest original → nth-darkest shade)

### Palette (array)

1. Sort provided palette colors by luminance
2. Sort icon's original fill/stroke colors by luminance
3. Map 1:1. If fewer palette colors than original colors, reuse the nearest by luminance. If more palette colors, ignore extras.

## 4. Animation Speed (internals)

Parse the `<style>` block and modify duration values.

### Duration regex

Match CSS animation durations in two contexts:
- Shorthand: `animation: name 1.5s ease-in-out infinite` — match the `\d*\.?\d+s` that appears after the animation name
- Longhand: `animation-duration: 1.5s` — match the value

### Speed multiplier application

For each matched duration string (e.g., `1.5s`):
1. Parse the numeric value: `1.5`
2. Divide by the multiplier: `1.5 / 2 = 0.75` (for `'fast'`)
3. Replace in the style string: `0.75s`

Rounding: round to 2 decimal places to avoid floating point noise.

### Multiplier map

```ts
const SPEED_MULTIPLIERS = { slow: 0.5, normal: 1, fast: 2 }
```

## 5. Export CLI Script

A local-only script at `scripts/export.ts`. Not published to npm — for repo owner's use only (e.g., generating Notion emojis).

### Usage

```bash
# Export all icons as PNG (default 128x128)
pnpm export --format png

# Export as GIF (animated)
pnpm export --format gif

# Export as WebP
pnpm export --format webp

# Multiple formats at once
pnpm export --format png,gif

# Custom size
pnpm export --format png --size 256

# Specific icons only
pnpm export --format png --icons terminal,docker,lock

# Apply theme before export
pnpm export --format png --theme grayscale

# Custom output directory (default: exports/)
pnpm export --format png --out ./notion-emojis
```

### Implementation

Uses Puppeteer (headless Chrome) to render SVGs:

1. Parse CLI args (format, size, icons, theme, out)
2. Launch headless browser
3. For each icon:
   a. Apply theme/options via `createIcon()` if specified
   b. Load SVG into a page
   c. For PNG/WebP: screenshot the element
   d. For GIF: capture multiple frames over the animation duration, assemble into GIF using `gif-encoder-2` or similar
4. Save to `{out}/{format}/{icon-name}.{ext}`

### Dependencies

- `puppeteer` — headless Chrome for rendering
- `gif-encoder-2` — GIF assembly from frames (only needed for GIF export)

These are added as optional/dev dependencies in the root `package.json`, not in the core package. They're only needed when running the export script.

### Config

Default size: 128x128 (standard emoji size for most platforms).

Output directory `exports/` is added to `.gitignore`.

### Root package.json script

```json
"export": "tsx scripts/export.ts"
```

## File Changes Summary

| File | Change |
|------|--------|
| `packages/core/src/utils.ts` | Extend `IconOptions`, add theme/speed/palette logic, add `createIconFactory()`, add internal color math helpers |
| `packages/core/tests/utils.test.ts` | Tests for all new options: theme variants, palette, speed presets, factory function, edge cases |
| `scripts/export.ts` | New CLI script for raster export |
| `packages/core/README.md` | Document new options and factory |
| `README.md` | Document export CLI |
| `.gitignore` | Add `exports/` |
| `package.json` (root) | Add `export` script, add puppeteer + gif-encoder-2 as dev deps |

## Out of Scope

- Framework wrapper updates (`@modern-svg-icons/react`, etc.) — not yet created
- Publishing the export tool as a separate npm package — local-only for now
- Animated WebP/APNG export — only GIF gets animation frame capture; PNG and WebP are static snapshots
