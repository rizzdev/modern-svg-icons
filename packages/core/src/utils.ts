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

  // Apply theme/palette
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
