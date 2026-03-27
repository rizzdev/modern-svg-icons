# Extended Icon Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `@modern-svg-icons/core` with theme/color overrides, animation speed presets, a factory function for global defaults, and a local CLI for raster export.

**Architecture:** Color math and speed manipulation are internal helpers in a new `color.ts` file. `utils.ts` gains the new `IconOptions` fields and `createIconFactory()`. The export CLI is a standalone script using Puppeteer. All runtime features remain zero-dependency.

**Tech Stack:** TypeScript, Vitest, Puppeteer (export CLI only), gif-encoder-2 (export CLI only)

---

## File Map

| File | Responsibility | Created/Modified |
|------|---------------|-----------------|
| `packages/core/src/color.ts` | Internal color math: hex parse, luminance, HSL conversion, grayscale, darken, shade generation, palette mapping | Create |
| `packages/core/src/utils.ts` | Extend `IconOptions`, add theme/speed/palette application, add `createIconFactory()` | Modify |
| `packages/core/tests/color.test.ts` | Tests for all color math functions | Create |
| `packages/core/tests/utils.test.ts` | Tests for theme, speed, palette, factory on SVG strings | Modify |
| `scripts/export.ts` | CLI script for PNG/GIF/WebP export via Puppeteer | Create |
| `.gitignore` | Add `exports/` | Modify |
| `package.json` (root) | Add `export` script, puppeteer + gif-encoder-2 as optional dev deps | Modify |
| `packages/core/README.md` | Document new options and factory | Modify |

---

### Task 1: Color Math Helpers — Tests First

**Files:**
- Create: `packages/core/src/color.ts`
- Create: `packages/core/tests/color.test.ts`

- [ ] **Step 1: Write failing tests for color helpers**

Create `packages/core/tests/color.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  parseHex,
  hexToRgb,
  rgbToHex,
  luminance,
  rgbToHsl,
  hslToRgb,
  toGrayscale,
  darken,
  generateShades,
  mapColorsByLuminance,
} from '../src/color'

describe('parseHex', () => {
  it('normalizes 3-char hex to 6-char', () => {
    expect(parseHex('#FFF')).toBe('#FFFFFF')
    expect(parseHex('#abc')).toBe('#AABBCC')
  })

  it('normalizes 6-char hex to uppercase', () => {
    expect(parseHex('#ff5733')).toBe('#FF5733')
  })

  it('returns null for non-hex values', () => {
    expect(parseHex('none')).toBeNull()
    expect(parseHex('currentColor')).toBeNull()
    expect(parseHex('red')).toBeNull()
  })
})

describe('hexToRgb / rgbToHex', () => {
  it('converts hex to rgb tuple', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0])
    expect(hexToRgb('#00FF00')).toEqual([0, 255, 0])
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
  })

  it('converts rgb tuple back to hex', () => {
    expect(rgbToHex([255, 0, 0])).toBe('#FF0000')
    expect(rgbToHex([0, 255, 0])).toBe('#00FF00')
    expect(rgbToHex([0, 0, 0])).toBe('#000000')
  })

  it('roundtrips correctly', () => {
    expect(rgbToHex(hexToRgb('#42A5F5'))).toBe('#42A5F5')
    expect(rgbToHex(hexToRgb('#FFC107'))).toBe('#FFC107')
  })
})

describe('luminance', () => {
  it('returns 0 for black', () => {
    expect(luminance([0, 0, 0])).toBeCloseTo(0, 2)
  })

  it('returns 1 for white', () => {
    expect(luminance([255, 255, 255])).toBeCloseTo(1, 2)
  })

  it('returns higher value for lighter colors', () => {
    const yellow = luminance(hexToRgb('#FFC107'))
    const navy = luminance(hexToRgb('#263238'))
    expect(yellow).toBeGreaterThan(navy)
  })
})

describe('rgbToHsl / hslToRgb', () => {
  it('converts pure red', () => {
    const [h, s, l] = rgbToHsl([255, 0, 0])
    expect(h).toBeCloseTo(0, 0)
    expect(s).toBeCloseTo(100, 0)
    expect(l).toBeCloseTo(50, 0)
  })

  it('converts white', () => {
    const [h, s, l] = rgbToHsl([255, 255, 255])
    expect(l).toBeCloseTo(100, 0)
  })

  it('converts black', () => {
    const [h, s, l] = rgbToHsl([0, 0, 0])
    expect(l).toBeCloseTo(0, 0)
  })

  it('roundtrips correctly', () => {
    const original: [number, number, number] = [66, 165, 245]
    const hsl = rgbToHsl(original)
    const back = hslToRgb(hsl)
    expect(back[0]).toBeCloseTo(original[0], 0)
    expect(back[1]).toBeCloseTo(original[1], 0)
    expect(back[2]).toBeCloseTo(original[2], 0)
  })
})

describe('toGrayscale', () => {
  it('converts a color to its luminance-equivalent gray', () => {
    const gray = toGrayscale('#FF0000')
    const rgb = hexToRgb(gray)
    // All channels should be equal (it's a gray)
    expect(rgb[0]).toBe(rgb[1])
    expect(rgb[1]).toBe(rgb[2])
  })

  it('converts white to white', () => {
    expect(toGrayscale('#FFFFFF')).toBe('#FFFFFF')
  })

  it('converts black to black', () => {
    expect(toGrayscale('#000000')).toBe('#000000')
  })
})

describe('darken', () => {
  it('reduces lightness by 40%', () => {
    const dark = darken('#42A5F5')
    const originalL = rgbToHsl(hexToRgb('#42A5F5'))[2]
    const darkenedL = rgbToHsl(hexToRgb(dark))[2]
    expect(darkenedL).toBeCloseTo(originalL * 0.6, 0)
  })

  it('does not go below 0 lightness', () => {
    const dark = darken('#111111')
    const rgb = hexToRgb(dark)
    expect(rgb[0]).toBeGreaterThanOrEqual(0)
    expect(rgb[1]).toBeGreaterThanOrEqual(0)
    expect(rgb[2]).toBeGreaterThanOrEqual(0)
  })
})

describe('generateShades', () => {
  it('returns 5 shades from a base color', () => {
    const shades = generateShades('#3B82F6')
    expect(shades).toHaveLength(5)
    shades.forEach(s => expect(s).toMatch(/^#[0-9A-F]{6}$/))
  })

  it('shades are sorted lightest to darkest', () => {
    const shades = generateShades('#3B82F6')
    const lums = shades.map(s => luminance(hexToRgb(s)))
    for (let i = 1; i < lums.length; i++) {
      expect(lums[i]).toBeLessThanOrEqual(lums[i - 1])
    }
  })
})

describe('mapColorsByLuminance', () => {
  it('maps original colors to replacement colors by luminance rank', () => {
    const originals = ['#FFFFFF', '#000000', '#808080']
    const replacements = ['#FF0000', '#00FF00', '#0000FF']
    const map = mapColorsByLuminance(originals, replacements)
    // Brightest original (#FFFFFF) maps to brightest replacement
    // Darkest original (#000000) maps to darkest replacement
    expect(Object.keys(map)).toHaveLength(3)
  })

  it('handles fewer replacements than originals by reusing nearest', () => {
    const originals = ['#FFFFFF', '#CCCCCC', '#808080', '#333333', '#000000']
    const replacements = ['#FF0000', '#0000FF']
    const map = mapColorsByLuminance(originals, replacements)
    expect(Object.keys(map)).toHaveLength(5)
  })

  it('handles more replacements than originals by ignoring extras', () => {
    const originals = ['#FFFFFF', '#000000']
    const replacements = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']
    const map = mapColorsByLuminance(originals, replacements)
    expect(Object.keys(map)).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run tests/color.test.ts`
Expected: FAIL — cannot find module `../src/color`

- [ ] **Step 3: Implement color helpers**

Create `packages/core/src/color.ts`:

```ts
export function parseHex(value: string): string | null {
  const match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!match) return null
  let hex = match[1].toUpperCase()
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  return '#' + hex
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export function rgbToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(c =>
    Math.round(Math.max(0, Math.min(255, c))).toString(16).toUpperCase().padStart(2, '0')
  ).join('')
}

export function luminance(rgb: [number, number, number]): number {
  return 0.2126 * (rgb[0] / 255) + 0.7152 * (rgb[1] / 255) + 0.0722 * (rgb[2] / 255)
}

export function rgbToHsl(rgb: [number, number, number]): [number, number, number] {
  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) return [0, 0, l * 100]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return [h * 360, s * 100, l * 100]
}

export function hslToRgb(hsl: [number, number, number]): [number, number, number] {
  const h = hsl[0] / 360
  const s = hsl[1] / 100
  const l = hsl[2] / 100

  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

export function toGrayscale(hex: string): string {
  const rgb = hexToRgb(hex)
  const l = luminance(rgb)
  const gray = Math.round(l * 255)
  return rgbToHex([gray, gray, gray])
}

export function darken(hex: string): string {
  const hsl = rgbToHsl(hexToRgb(hex))
  hsl[2] = Math.max(0, hsl[2] * 0.6)
  return rgbToHex(hslToRgb(hsl))
}

export function generateShades(hex: string): string[] {
  const hsl = rgbToHsl(hexToRgb(hex))
  const offsets = [30, 15, 0, -15, -30]
  return offsets.map(offset => {
    const newL = Math.max(0, Math.min(100, hsl[2] + offset))
    return rgbToHex(hslToRgb([hsl[0], hsl[1], newL]))
  })
}

export function mapColorsByLuminance(
  originals: string[],
  replacements: string[]
): Record<string, string> {
  const sortedOriginals = [...originals]
    .map(c => ({ color: c, lum: luminance(hexToRgb(c)) }))
    .sort((a, b) => b.lum - a.lum)

  const sortedReplacements = [...replacements]
    .map(c => ({ color: c, lum: luminance(hexToRgb(c)) }))
    .sort((a, b) => b.lum - a.lum)

  const map: Record<string, string> = {}

  for (let i = 0; i < sortedOriginals.length; i++) {
    if (i < sortedReplacements.length) {
      map[sortedOriginals[i].color] = sortedReplacements[i].color
    } else {
      // Reuse nearest by position ratio
      const ratio = i / (sortedOriginals.length - 1)
      const nearestIdx = Math.round(ratio * (sortedReplacements.length - 1))
      map[sortedOriginals[i].color] = sortedReplacements[nearestIdx].color
    }
  }

  return map
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/core && pnpm vitest run tests/color.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/color.ts packages/core/tests/color.test.ts
git commit -m "feat: add internal color math helpers (hex, HSL, luminance, shades)"
```

---

### Task 2: Theme Support — Tests First

**Files:**
- Modify: `packages/core/src/utils.ts`
- Modify: `packages/core/tests/utils.test.ts`

- [ ] **Step 1: Add failing tests for theme options**

Append to `packages/core/tests/utils.test.ts`:

```ts
import { createIcon } from '../src/utils'
// Add to imports at top if not already present

const colorfulSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="256" height="256">
<style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}.p{animation:pulse 2s ease-in-out infinite}</style>
<circle cx="22" cy="22" r="16" fill="#AB47BC"/>
<circle class="p" cx="16" cy="28" r="2" fill="#FFC107"/>
<circle class="p" cx="28" cy="28" r="2" fill="#42A5F5"/>
<line x1="16" y1="28" x2="22" y2="16" stroke="#E1BEE7" stroke-width="1"/>
</svg>`

describe('theme option', () => {
  it('theme default returns SVG unchanged', () => {
    const result = createIcon(colorfulSvg, { theme: 'default' })
    expect(result).toBe(colorfulSvg)
  })

  it('theme grayscale replaces all fill colors with grays', () => {
    const result = createIcon(colorfulSvg, { theme: 'grayscale' })
    expect(result).not.toContain('#AB47BC')
    expect(result).not.toContain('#FFC107')
    expect(result).not.toContain('#42A5F5')
    // Should still have fill attributes
    expect(result).toContain('fill="#')
  })

  it('theme grayscale replaces stroke colors too', () => {
    const result = createIcon(colorfulSvg, { theme: 'grayscale' })
    expect(result).not.toContain('stroke="#E1BEE7"')
    expect(result).toContain('stroke="#')
  })

  it('theme dark darkens all colors', () => {
    const result = createIcon(colorfulSvg, { theme: 'dark' })
    expect(result).not.toContain('#AB47BC')
    expect(result).not.toContain('#FFC107')
    expect(result).toContain('fill="#')
  })

  it('theme with hex string applies custom color shades', () => {
    const result = createIcon(colorfulSvg, { theme: '#3B82F6' })
    expect(result).not.toContain('#AB47BC')
    expect(result).not.toContain('#FFC107')
    expect(result).toContain('fill="#')
  })

  it('palette overrides theme', () => {
    const result = createIcon(colorfulSvg, {
      theme: 'grayscale',
      palette: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00']
    })
    // Should use palette colors, not grayscale
    // At least one palette color should appear
    const hasRed = result.includes('#FF0000')
    const hasGreen = result.includes('#00FF00')
    const hasBlue = result.includes('#0000FF')
    const hasYellow = result.includes('#FFFF00')
    expect(hasRed || hasGreen || hasBlue || hasYellow).toBe(true)
    // Should not be grayscale
    expect(result).not.toContain('#AB47BC')
  })

  it('palette maps colors by luminance', () => {
    const result = createIcon(colorfulSvg, {
      palette: ['#000000', '#FFFFFF']
    })
    // Should contain both palette colors
    expect(result).toContain('#000000')
    expect(result).toContain('#FFFFFF')
  })

  it('theme does not affect non-hex fill values', () => {
    const svgWithNone = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="256" height="256">
<path d="M15 18 L15 13" stroke="#78909C" fill="none"/>
</svg>`
    const result = createIcon(svgWithNone, { theme: 'grayscale' })
    expect(result).toContain('fill="none"')
  })
})
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `cd packages/core && pnpm vitest run tests/utils.test.ts`
Expected: New theme tests FAIL (theme option not yet handled)

- [ ] **Step 3: Implement theme and palette support in utils.ts**

Replace `packages/core/src/utils.ts` with:

```ts
import {
  parseHex,
  toGrayscale,
  darken,
  generateShades,
  mapColorsByLuminance,
} from './color'

export interface IconOptions {
  /** Set to false to remove CSS animations. Default: true */
  animated?: boolean
  /** Override width and height attributes (in pixels) */
  size?: number
  /** Color theme: 'default', 'grayscale', 'dark', or a hex color string */
  theme?: 'default' | 'grayscale' | 'dark' | string
  /** Direct palette override: 3-5 hex colors mapped by luminance. Overrides theme. */
  palette?: string[]
  /** Animation speed preset */
  speed?: 'slow' | 'normal' | 'fast'
}

function extractColors(svg: string): string[] {
  const colorRegex = /(?:fill|stroke)="(#[0-9a-fA-F]{3,6})"/g
  const colors = new Set<string>()
  let match
  while ((match = colorRegex.exec(svg)) !== null) {
    const parsed = parseHex(match[1])
    if (parsed) colors.add(parsed)
  }
  return [...colors]
}

function buildColorMap(
  originals: string[],
  options: IconOptions
): Record<string, string> | null {
  if (options.palette && options.palette.length > 0) {
    const normalizedPalette = options.palette
      .map(c => parseHex(c))
      .filter((c): c is string => c !== null)
    return mapColorsByLuminance(originals, normalizedPalette)
  }

  if (!options.theme || options.theme === 'default') return null

  if (options.theme === 'grayscale') {
    const map: Record<string, string> = {}
    for (const color of originals) {
      map[color] = toGrayscale(color)
    }
    return map
  }

  if (options.theme === 'dark') {
    const map: Record<string, string> = {}
    for (const color of originals) {
      map[color] = darken(color)
    }
    return map
  }

  // Custom hex color — generate shades and map
  const parsed = parseHex(options.theme)
  if (parsed) {
    const shades = generateShades(parsed)
    return mapColorsByLuminance(originals, shades)
  }

  return null
}

function applyColorMap(svg: string, colorMap: Record<string, string>): string {
  return svg.replace(
    /((?:fill|stroke)=")(#[0-9a-fA-F]{3,6})(")/g,
    (full, prefix, color, suffix) => {
      const normalized = parseHex(color)
      if (normalized && colorMap[normalized]) {
        return prefix + colorMap[normalized] + suffix
      }
      return full
    }
  )
}

export function createIcon(svg: string, options?: IconOptions): string {
  if (!options) return svg

  let result = svg

  // Apply theme/palette (before stripping animations, so colors in style are still there)
  if (options.palette || (options.theme && options.theme !== 'default')) {
    const originals = extractColors(result)
    const colorMap = buildColorMap(originals, options)
    if (colorMap) {
      result = applyColorMap(result, colorMap)
    }
  }

  if (options.animated === false) {
    result = result.replace(/<style>[\s\S]*?<\/style>\s*/g, '')
    result = result.replace(/\s+class="[^"]*"/g, '')
  }

  if (options.size !== undefined) {
    result = result.replace(/width="\d+"/, `width="${options.size}"`)
    result = result.replace(/height="\d+"/, `height="${options.size}"`)
  }

  return result
}

export function createIconFactory(defaults: IconOptions) {
  return (svg: string, overrides?: IconOptions): string =>
    createIcon(svg, { ...defaults, ...overrides })
}
```

- [ ] **Step 4: Run all tests**

Run: `cd packages/core && pnpm vitest run`
Expected: All tests pass (existing + new theme tests)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/utils.ts packages/core/tests/utils.test.ts
git commit -m "feat: add theme and palette color override options"
```

---

### Task 3: Animation Speed — Tests First

**Files:**
- Modify: `packages/core/src/utils.ts`
- Modify: `packages/core/tests/utils.test.ts`

- [ ] **Step 1: Add failing tests for speed option**

Append to `packages/core/tests/utils.test.ts`:

```ts
describe('speed option', () => {
  const animatedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="256" height="256">
<style>
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
.cur{animation:blink .8s step-end infinite}
.p{animation:pulse 2s ease-in-out infinite}
</style>
<rect class="cur" x="26" y="30" width="3" height="2" fill="#FFF"/>
<circle class="p" cx="16" cy="28" r="2" fill="#FFC107"/>
</svg>`

  it('speed normal leaves durations unchanged', () => {
    const result = createIcon(animatedSvg, { speed: 'normal' })
    expect(result).toContain('.8s')
    expect(result).toContain('2s')
  })

  it('speed fast halves all durations', () => {
    const result = createIcon(animatedSvg, { speed: 'fast' })
    expect(result).toContain('.4s')
    expect(result).toContain('1s')
    expect(result).not.toContain('.8s')
    expect(result).not.toContain('2s ease')
  })

  it('speed slow doubles all durations', () => {
    const result = createIcon(animatedSvg, { speed: 'slow' })
    expect(result).toContain('1.6s')
    expect(result).toContain('4s')
    expect(result).not.toContain('.8s')
  })

  it('speed is ignored when animated is false', () => {
    const result = createIcon(animatedSvg, { animated: false, speed: 'fast' })
    expect(result).not.toContain('<style>')
  })

  it('handles durations with leading zero like 0.5s', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="256" height="256">
<style>.x{animation:foo 0.5s ease infinite}</style>
<rect fill="#000"/>
</svg>`
    const result = createIcon(svg, { speed: 'fast' })
    expect(result).toContain('0.25s')
  })

  it('preserves keyframe percentages unchanged', () => {
    const result = createIcon(animatedSvg, { speed: 'fast' })
    expect(result).toContain('0%,100%')
    expect(result).toContain('50%')
  })
})
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `cd packages/core && pnpm vitest run tests/utils.test.ts`
Expected: Speed tests FAIL (speed option not yet handled)

- [ ] **Step 3: Implement speed support in utils.ts**

Add the speed constants and `applySpeed` function to `packages/core/src/utils.ts`. Insert before the `createIcon` function:

```ts
const SPEED_MULTIPLIERS: Record<string, number> = {
  slow: 0.5,
  normal: 1,
  fast: 2,
}

function applySpeed(svg: string, speed: 'slow' | 'normal' | 'fast'): string {
  const multiplier = SPEED_MULTIPLIERS[speed]
  if (!multiplier || multiplier === 1) return svg

  // Match the <style> block and modify durations within it
  return svg.replace(/<style>[\s\S]*?<\/style>/, (styleBlock) => {
    // Replace animation duration values (e.g., .8s, 1.5s, 2s, 0.5s)
    // Only match values followed by 's' that are part of animation properties, not keyframe percentages
    return styleBlock.replace(
      /(\b(?:animation|animation-duration)\s*:[^}]*?)(\d*\.?\d+)(s)/g,
      (match, before, numStr, unit) => {
        const original = parseFloat(numStr)
        const newVal = Math.round((original / multiplier) * 100) / 100
        return before + newVal + unit
      }
    )
  })
}
```

Then add the speed application to `createIcon`, after theme/palette and before animated check:

```ts
  // Apply speed (before animated check — if animated:false, style gets stripped anyway)
  if (options.speed && options.speed !== 'normal' && options.animated !== false) {
    result = applySpeed(result, options.speed)
  }
```

- [ ] **Step 4: Run all tests**

Run: `cd packages/core && pnpm vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/utils.ts packages/core/tests/utils.test.ts
git commit -m "feat: add animation speed presets (slow, normal, fast)"
```

---

### Task 4: Factory Function — Tests First

**Files:**
- Modify: `packages/core/tests/utils.test.ts`

Note: `createIconFactory` was already added to `utils.ts` in Task 2. This task adds tests for it.

- [ ] **Step 1: Add failing tests for createIconFactory**

Append to `packages/core/tests/utils.test.ts`:

```ts
import { createIcon, createIconFactory } from '../src/utils'

describe('createIconFactory', () => {
  const testSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="256" height="256">
<style>.x{animation:spin 2s linear infinite}</style>
<circle cx="22" cy="22" r="16" fill="#AB47BC"/>
<circle cx="16" cy="28" r="2" fill="#FFC107"/>
</svg>`

  it('returns a function', () => {
    const icon = createIconFactory({ size: 32 })
    expect(typeof icon).toBe('function')
  })

  it('applies defaults to every call', () => {
    const icon = createIconFactory({ size: 32 })
    const result = icon(testSvg)
    expect(result).toContain('width="32"')
    expect(result).toContain('height="32"')
  })

  it('per-call overrides replace defaults', () => {
    const icon = createIconFactory({ size: 32, theme: 'grayscale' })
    const result = icon(testSvg, { size: 64 })
    expect(result).toContain('width="64"')
    expect(result).toContain('height="64"')
  })

  it('per-call overrides only affect specified fields', () => {
    const icon = createIconFactory({ size: 32, theme: 'grayscale' })
    const result = icon(testSvg, { size: 64 })
    // Theme should still be grayscale (not overridden)
    expect(result).not.toContain('#AB47BC')
  })

  it('works with no per-call options', () => {
    const icon = createIconFactory({ theme: 'grayscale', speed: 'fast' })
    const result = icon(testSvg)
    expect(result).not.toContain('#AB47BC')
    expect(result).toContain('1s')
  })

  it('produces same result as createIcon with same options', () => {
    const opts = { size: 48, theme: 'grayscale' as const, speed: 'fast' as const }
    const icon = createIconFactory(opts)
    const factoryResult = icon(testSvg)
    const directResult = createIcon(testSvg, opts)
    expect(factoryResult).toBe(directResult)
  })
})
```

- [ ] **Step 2: Run tests**

Run: `cd packages/core && pnpm vitest run tests/utils.test.ts`
Expected: All tests pass (factory was already implemented in Task 2)

- [ ] **Step 3: Commit**

```bash
git add packages/core/tests/utils.test.ts
git commit -m "test: add createIconFactory tests"
```

---

### Task 5: Update Package Exports

**Files:**
- Modify: `packages/core/src/utils.ts` (export verification only — already done)

The `createIconFactory` is already exported from `utils.ts` (added in Task 2). The `index.ts` is generated and re-exports from utils. Verify:

- [ ] **Step 1: Rebuild and verify exports**

Run: `cd "C:/Users/andre/PhpstormProjects/modern-svg-icons" && pnpm build`

- [ ] **Step 2: Verify createIconFactory is accessible**

Run: `node -e "const {createIconFactory} = require('./packages/core/dist/utils.cjs'); console.log('createIconFactory:', typeof createIconFactory)"`
Expected: `createIconFactory: function`

Run: `node -e "const {createIcon, createIconFactory} = require('./packages/core/dist/index.cjs'); console.log('createIcon:', typeof createIcon, 'createIconFactory:', typeof createIconFactory)"`
Expected: `createIcon: function createIconFactory: function`

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit if any changes needed**

If no changes needed, skip this step.

---

### Task 6: Export CLI Script

**Files:**
- Create: `scripts/export.ts`
- Modify: `package.json` (root)
- Modify: `.gitignore`

- [ ] **Step 1: Add `exports/` to `.gitignore`**

Append to `.gitignore`:

```
# Export output
exports/
```

- [ ] **Step 2: Add export script and deps to root `package.json`**

Add to `scripts`:
```json
"export": "tsx scripts/export.ts"
```

Add to `devDependencies`:
```json
"puppeteer": "^23.0.0",
"gif-encoder-2": "^1.0.5",
"canvas": "^2.11.2"
```

- [ ] **Step 3: Install new dependencies**

Run: `pnpm install`

- [ ] **Step 4: Create `scripts/export.ts`**

```ts
import { mkdirSync, existsSync, readdirSync, readFileSync } from 'fs'
import { join, basename } from 'path'
import puppeteer from 'puppeteer'
import GIFEncoder from 'gif-encoder-2'
import { createWriteStream } from 'fs'
import { createIcon, type IconOptions } from '../packages/core/src/utils'

const ROOT = join(import.meta.dirname ?? __dirname, '..')
const ICONS_DIR = join(ROOT, 'icons')

interface ExportArgs {
  format: string[]
  size: number
  icons?: string[]
  theme?: string
  out: string
}

function parseArgs(): ExportArgs {
  const args = process.argv.slice(2)
  const result: ExportArgs = {
    format: ['png'],
    size: 128,
    out: join(ROOT, 'exports'),
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--format':
        result.format = args[++i].split(',')
        break
      case '--size':
        result.size = parseInt(args[++i], 10)
        break
      case '--icons':
        result.icons = args[++i].split(',')
        break
      case '--theme':
        result.theme = args[++i]
        break
      case '--out':
        result.out = args[++i]
        break
    }
  }

  return result
}

async function exportIcon(
  page: puppeteer.Page,
  svgContent: string,
  name: string,
  format: string,
  size: number,
  outDir: string
): Promise<void> {
  const formatDir = join(outDir, format)
  mkdirSync(formatDir, { recursive: true })

  await page.setViewport({ width: size, height: size })
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:transparent;width:${size}px;height:${size}px;overflow:hidden;">
      ${svgContent.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`)}
    </body>
    </html>
  `)

  if (format === 'png') {
    await page.screenshot({
      path: join(formatDir, `${name}.png`),
      type: 'png',
      omitBackground: true,
    })
  } else if (format === 'webp') {
    await page.screenshot({
      path: join(formatDir, `${name}.webp`),
      type: 'webp',
      omitBackground: true,
    })
  } else if (format === 'gif') {
    const encoder = new GIFEncoder(size, size, 'neuquant', true)
    const stream = createWriteStream(join(formatDir, `${name}.gif`))
    encoder.createReadStream().pipe(stream)
    encoder.start()
    encoder.setTransparent(0x00000000)
    encoder.setRepeat(0)
    encoder.setDelay(50)
    encoder.setQuality(10)

    const frames = 40
    for (let f = 0; f < frames; f++) {
      const screenshot = await page.screenshot({
        type: 'png',
        omitBackground: false,
      })
      const { createCanvas, loadImage } = await import('canvas')
      const img = await loadImage(screenshot as Buffer)
      const canvas = createCanvas(size, size)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      encoder.addFrame(ctx as unknown as CanvasRenderingContext2D)
      // Wait one frame interval for animation to advance
      await new Promise(r => setTimeout(r, 50))
    }

    encoder.finish()
    await new Promise<void>(resolve => stream.on('finish', resolve))
  }
}

async function main() {
  const args = parseArgs()
  console.log(`Export settings:`)
  console.log(`  Formats: ${args.format.join(', ')}`)
  console.log(`  Size: ${args.size}x${args.size}`)
  console.log(`  Output: ${args.out}`)
  if (args.theme) console.log(`  Theme: ${args.theme}`)

  // Get icon list
  let iconFiles = readdirSync(ICONS_DIR)
    .filter(f => f.endsWith('.svg'))
    .sort()

  if (args.icons) {
    const requested = new Set(args.icons)
    iconFiles = iconFiles.filter(f => requested.has(basename(f, '.svg')))
  }

  console.log(`  Icons: ${iconFiles.length}`)

  // Build icon options for theme
  const iconOpts: IconOptions = {}
  if (args.theme) {
    if (['grayscale', 'dark'].includes(args.theme)) {
      iconOpts.theme = args.theme as 'grayscale' | 'dark'
    } else if (args.theme.startsWith('#')) {
      iconOpts.theme = args.theme
    }
  }

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  for (const file of iconFiles) {
    const name = basename(file, '.svg')
    let svg = readFileSync(join(ICONS_DIR, file), 'utf-8')

    // Apply theme if specified
    if (Object.keys(iconOpts).length > 0) {
      svg = createIcon(svg, iconOpts)
    }

    for (const format of args.format) {
      await exportIcon(page, svg, name, format, args.size, args.out)
    }

    process.stdout.write(`\r  Exported: ${name}`)
  }

  await browser.close()
  console.log(`\n\nDone! ${iconFiles.length} icons exported to ${args.out}`)
}

main().catch(err => {
  console.error('Export failed:', err)
  process.exit(1)
})
```

- [ ] **Step 5: Test the export script with a few icons**

Run: `pnpm export --format png --icons terminal,docker,lock --size 128`
Expected: Creates `exports/png/terminal.png`, `exports/png/docker.png`, `exports/png/lock.png`

- [ ] **Step 6: Commit**

```bash
git add scripts/export.ts package.json pnpm-lock.yaml .gitignore
git commit -m "feat: add raster export CLI (PNG, GIF, WebP via Puppeteer)"
```

---

### Task 7: Update Documentation

**Files:**
- Modify: `packages/core/README.md`

- [ ] **Step 1: Update npm README with new options**

Add sections after the existing "Customize with `createIcon()`" section in `packages/core/README.md`:

````markdown
### Themes

```ts
import { createIcon } from '@modern-svg-icons/core/utils'
import { terminal } from '@modern-svg-icons/core'

// Grayscale
createIcon(terminal, { theme: 'grayscale' })

// Darkened
createIcon(terminal, { theme: 'dark' })

// Custom color — auto-generates shades
createIcon(terminal, { theme: '#3B82F6' })

// Direct palette control
createIcon(terminal, { palette: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'] })
```

### Animation Speed

```ts
createIcon(terminal, { speed: 'slow' })   // 0.5x
createIcon(terminal, { speed: 'normal' }) // 1x (default)
createIcon(terminal, { speed: 'fast' })   // 2x
```

### Factory (global defaults)

```ts
import { createIconFactory } from '@modern-svg-icons/core/utils'
import { terminal, docker, lock } from '@modern-svg-icons/core'

const icon = createIconFactory({
  theme: 'grayscale',
  speed: 'fast',
  size: 24
})

icon(terminal)                    // all defaults
icon(docker)                      // all defaults
icon(lock, { size: 48 })          // override size only
```
````

- [ ] **Step 2: Commit**

```bash
git add packages/core/README.md
git commit -m "docs: document theme, speed, palette, and factory options"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Clean build from scratch**

Run: `rm -rf node_modules packages/core/dist packages/core/src/icons packages/core/src/index.ts packages/core/src/meta.ts && pnpm install && pnpm build`
Expected: Full build succeeds

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass (color tests + utils tests + build tests)

- [ ] **Step 3: Verify package contents**

Run: `cd packages/core && npm pack --dry-run`
Expected: `dist/` files only. `color.ts` helpers should be bundled into `utils.js`/`index.js` by tsup (not a separate entrypoint).

- [ ] **Step 4: Verify new exports work via CJS**

Run: `node -e "const {createIcon, createIconFactory} = require('./packages/core/dist/index.cjs'); const svg = '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 44 44\" width=\"256\" height=\"256\"><circle fill=\"#FF0000\" cx=\"22\" cy=\"22\" r=\"10\"/></svg>'; console.log('grayscale:', createIcon(svg, {theme:'grayscale'}).includes('#FF0000')); const icon = createIconFactory({size:32}); console.log('factory:', icon(svg).includes('width=\"32\"'))"`
Expected: `grayscale: false`, `factory: true`

- [ ] **Step 5: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: final verification — extended options clean build passes"
```
