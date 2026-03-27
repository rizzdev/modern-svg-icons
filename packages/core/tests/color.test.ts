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
