export interface IconOptions {
  /** Set to false to remove CSS animations. Default: true */
  animated?: boolean
  /** Override width and height attributes (in pixels) */
  size?: number
}

export function createIcon(svg: string, options?: IconOptions): string {
  if (!options) return svg

  let result = svg

  if (options.animated === false) {
    // Remove <style>...</style> block
    result = result.replace(/<style>[\s\S]*?<\/style>\s*/g, '')
    // Remove class="..." attributes (animation class references)
    result = result.replace(/\s+class="[^"]*"/g, '')
  }

  if (options.size !== undefined) {
    result = result.replace(/width="\d+"/, `width="${options.size}"`)
    result = result.replace(/height="\d+"/, `height="${options.size}"`)
  }

  return result
}
