import { mkdirSync, readdirSync, readFileSync } from 'fs'
import { join, basename, dirname } from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer'

const __dirname2 = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname2, '..')
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

  console.log(`  Icons: ${iconFiles.length}\n`)

  // Dynamically import createIcon if theme is needed
  let applyTheme: ((svg: string) => string) | null = null
  if (args.theme) {
    const { createIcon } = await import('../packages/core/src/utils')
    const theme = args.theme
    applyTheme = (svg: string) => {
      const opts: Record<string, unknown> = {}
      if (['grayscale', 'dark'].includes(theme)) {
        opts.theme = theme
      } else if (theme.startsWith('#')) {
        opts.theme = theme
      }
      return createIcon(svg, opts as any)
    }
  }

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  let count = 0
  for (const file of iconFiles) {
    const name = basename(file, '.svg')
    let svg = readFileSync(join(ICONS_DIR, file), 'utf-8')

    if (applyTheme) {
      svg = applyTheme(svg)
    }

    // Set viewport and content
    await page.setViewport({ width: args.size, height: args.size })
    await page.setContent(`<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:transparent;width:${args.size}px;height:${args.size}px;overflow:hidden;">
${svg.replace(/width="\d+"/, `width="${args.size}"`).replace(/height="\d+"/, `height="${args.size}"`)}
</body></html>`)

    // Small delay to let animations initialize
    await new Promise(r => setTimeout(r, 100))

    for (const format of args.format) {
      const formatDir = join(args.out, format)
      mkdirSync(formatDir, { recursive: true })

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
        // GIF export requires canvas + gif-encoder-2
        // This is a heavier dependency — skip if not available
        try {
          const GIFEncoder = (await import('gif-encoder-2')).default
          const { createCanvas, loadImage } = await import('canvas')

          const encoder = new GIFEncoder(args.size, args.size, 'neuquant', true)
          const { createWriteStream } = await import('fs')
          const stream = createWriteStream(join(formatDir, `${name}.gif`))
          encoder.createReadStream().pipe(stream)
          encoder.start()
          encoder.setRepeat(0)
          encoder.setDelay(50)
          encoder.setQuality(10)

          const frames = 40
          for (let f = 0; f < frames; f++) {
            const screenshot = await page.screenshot({ type: 'png', omitBackground: false })
            const img = await loadImage(screenshot as Buffer)
            const canvas = createCanvas(args.size, args.size)
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)
            encoder.addFrame(ctx as unknown as CanvasRenderingContext2D)
            await new Promise(r => setTimeout(r, 50))
          }

          encoder.finish()
          await new Promise<void>(resolve => stream.on('finish', resolve))
        } catch {
          console.warn(`\n  Warning: GIF export requires 'canvas' and 'gif-encoder-2' packages. Skipping ${name}.gif`)
          break
        }
      }
    }

    count++
    process.stdout.write(`\r  Exported: ${count}/${iconFiles.length} — ${name}`)
  }

  await browser.close()
  console.log(`\n\nDone! ${count} icons exported to ${args.out}`)
}

main().catch(err => {
  console.error('Export failed:', err)
  process.exit(1)
})
