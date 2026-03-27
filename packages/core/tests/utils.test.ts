import { describe, it, expect } from 'vitest'
import { createIcon, createIconFactory } from '../src/utils'

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
    const hasRed = result.includes('#FF0000')
    const hasGreen = result.includes('#00FF00')
    const hasBlue = result.includes('#0000FF')
    const hasYellow = result.includes('#FFFF00')
    expect(hasRed || hasGreen || hasBlue || hasYellow).toBe(true)
    expect(result).not.toContain('#AB47BC')
  })

  it('palette maps colors by luminance', () => {
    const result = createIcon(colorfulSvg, {
      palette: ['#000000', '#FFFFFF']
    })
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
    expect(result).not.toContain(' .8s')
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
