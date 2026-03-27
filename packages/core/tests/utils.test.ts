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
