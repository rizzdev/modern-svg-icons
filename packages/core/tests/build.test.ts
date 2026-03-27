import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORE_SRC = join(ROOT, 'packages', 'core', 'src')
const ICONS_DIR = join(ROOT, 'icons')

describe('build output', () => {
  beforeAll(() => {
    // Run the icon generation script (not tsup — just the TS source generation)
    execSync('pnpm tsx scripts/build.ts', { cwd: ROOT })
  })

  it('generates per-category icon files', () => {
    const iconsDir = join(CORE_SRC, 'icons')
    expect(existsSync(iconsDir)).toBe(true)
    const files = readdirSync(iconsDir).filter(f => f.endsWith('.ts'))
    expect(files.length).toBeGreaterThan(0)
  })

  it('generates index.ts with re-exports', () => {
    const indexPath = join(CORE_SRC, 'index.ts')
    expect(existsSync(indexPath)).toBe(true)
    const content = readFileSync(indexPath, 'utf-8')
    expect(content).toContain("export * from './icons/")
    expect(content).toContain("export { createIcon } from './utils'")
  })

  it('generates meta.ts with all icons', () => {
    const metaPath = join(CORE_SRC, 'meta.ts')
    expect(existsSync(metaPath)).toBe(true)
    const content = readFileSync(metaPath, 'utf-8')
    expect(content).toContain('export const iconMeta')
    expect(content).toContain('terminal')
  })

  it('total exported icons matches icons/ directory count', () => {
    const svgCount = readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg')).length
    const metaContent = readFileSync(join(CORE_SRC, 'meta.ts'), 'utf-8')
    // Count entries in iconMeta by counting lines with 'name:' pattern
    const metaCount = (metaContent.match(/name: "/g) || []).length
    expect(metaCount).toBe(svgCount)
  })

  it('generated SVGs are valid (start with <svg and end with </svg>)', () => {
    const iconsDir = join(CORE_SRC, 'icons')
    const files = readdirSync(iconsDir).filter(f => f.endsWith('.ts'))

    for (const file of files) {
      const content = readFileSync(join(iconsDir, file), 'utf-8')
      // Match exported const values (JSON strings) — handles \" inside strings
      const matches = content.matchAll(/export const \w+ = ("[^"\\]*(?:\\.[^"\\]*)*")/g)
      for (const match of matches) {
        const svg = JSON.parse(match[1])
        expect(svg).toMatch(/^<svg\s/)
        expect(svg).toMatch(/<\/svg>$/)
      }
    }
  })

  it('kebab-to-camel conversion handles numeric prefixes', () => {
    const iconsDir = join(CORE_SRC, 'icons')
    const httpCodesPath = join(iconsDir, 'http-codes.ts')
    if (existsSync(httpCodesPath)) {
      const content = readFileSync(httpCodesPath, 'utf-8')
      expect(content).toContain('export const http200Ok')
      expect(content).toContain('export const http404NotFound')
    }
  })
})
