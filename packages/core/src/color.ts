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
      const ratio = i / (sortedOriginals.length - 1)
      const nearestIdx = Math.round(ratio * (sortedReplacements.length - 1))
      map[sortedOriginals[i].color] = sortedReplacements[nearestIdx].color
    }
  }

  return map
}
