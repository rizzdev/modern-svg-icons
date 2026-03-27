import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'fs'
import { join, basename, dirname } from 'path'
import { fileURLToPath } from 'url'
import { optimize } from 'svgo'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ICONS_DIR = join(ROOT, 'icons')
const CORE_SRC = join(ROOT, 'packages', 'core', 'src')
const ICONS_OUT = join(CORE_SRC, 'icons')
const CATEGORIES_PATH = join(ROOT, 'scripts', 'categories.json')

interface CategoryEntry {
  category: string
  tags: string[]
}

function kebabToCamel(str: string): string {
  // Handle numeric-prefixed names: 200-ok → http200Ok
  if (/^\d/.test(str)) {
    str = 'http' + str
  }
  return str.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
}

function categoryToFilename(category: string): string {
  return category // already kebab-case in categories.json
}

function main() {
  // Load categories
  const categories: Record<string, CategoryEntry> = JSON.parse(
    readFileSync(CATEGORIES_PATH, 'utf-8')
  )

  // Read all SVG files
  const svgFiles = readdirSync(ICONS_DIR)
    .filter(f => f.endsWith('.svg'))
    .sort()

  console.log(`Found ${svgFiles.length} SVG files`)

  // Optimize and group by category
  const byCategory: Record<string, { exportName: string; svg: string; iconName: string }[]> = {}
  const metaEntries: { exportName: string; iconName: string; category: string; tags: string[] }[] = []
  const warnings: string[] = []

  for (const file of svgFiles) {
    const iconName = basename(file, '.svg')
    const exportName = kebabToCamel(iconName)
    const raw = readFileSync(join(ICONS_DIR, file), 'utf-8')

    // Optimize with SVGO
    const result = optimize(raw, {
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              // Keep viewBox — critical for scaling
              removeViewBox: false,
              // Keep style elements — they contain our animations
              inlineStyles: false,
              minifyStyles: false,
            },
          },
        },
        // Remove XML declarations and comments
        'removeXMLProcInst',
        'removeComments',
      ],
    })

    const optimizedSvg = result.data

    // Get category info (default to "general" if unmapped)
    const catEntry = categories[iconName]
    if (!catEntry) {
      warnings.push(`Warning: "${iconName}" not in categories.json — defaulting to "general"`)
    }
    const category = catEntry?.category ?? 'general'
    const tags = catEntry?.tags ?? []

    // Group by category
    if (!byCategory[category]) {
      byCategory[category] = []
    }
    byCategory[category].push({ exportName, svg: optimizedSvg, iconName })

    // Collect metadata
    metaEntries.push({ exportName, iconName, category, tags })
  }

  // Print warnings
  for (const w of warnings) {
    console.warn(w)
  }

  // Clean and recreate output directory
  if (existsSync(ICONS_OUT)) {
    rmSync(ICONS_OUT, { recursive: true })
  }
  mkdirSync(ICONS_OUT, { recursive: true })

  // Generate per-category icon files
  const categoryFiles: string[] = []

  for (const [category, icons] of Object.entries(byCategory)) {
    const filename = categoryToFilename(category)
    categoryFiles.push(filename)

    const lines = icons.map(
      ({ exportName, svg }) =>
        `export const ${exportName} = ${JSON.stringify(svg)}`
    )

    writeFileSync(
      join(ICONS_OUT, `${filename}.ts`),
      lines.join('\n\n') + '\n'
    )

    console.log(`  ${filename}.ts — ${icons.length} icons`)
  }

  // Generate index.ts — re-exports all category files + utils
  const indexLines = [
    ...categoryFiles.map(f => `export * from './icons/${f}'`),
    `export { createIcon } from './utils'`,
    `export type { IconOptions } from './utils'`,
  ]

  writeFileSync(
    join(CORE_SRC, 'index.ts'),
    indexLines.join('\n') + '\n'
  )

  // Generate meta.ts
  const metaLines = [
    `export interface IconMeta {`,
    `  name: string`,
    `  category: string`,
    `  tags: string[]`,
    `}`,
    ``,
    `export const iconMeta: Record<string, IconMeta> = {`,
    ...metaEntries.map(
      ({ exportName, iconName, category, tags }) =>
        `  ${exportName}: { name: ${JSON.stringify(iconName)}, category: ${JSON.stringify(category)}, tags: ${JSON.stringify(tags)} },`
    ),
    `}`,
  ]

  writeFileSync(
    join(CORE_SRC, 'meta.ts'),
    metaLines.join('\n') + '\n'
  )

  console.log(`\nGenerated:`)
  console.log(`  ${categoryFiles.length} category files in packages/core/src/icons/`)
  console.log(`  index.ts — barrel re-exports`)
  console.log(`  meta.ts — ${metaEntries.length} icon metadata entries`)
  console.log(`\nDone!`)
}

main()
