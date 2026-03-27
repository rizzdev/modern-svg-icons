Generate animated SVG emoji icons in the "flat material" style. Output raw SVG only — no explanation, no markdown.

SPEC:
- ViewBox: "0 0 44 44", width="256" height="256", xmlns="http://www.w3.org/2000/svg"
- Flat shapes only — no gradients, no shadows, no blur, no stroke-only outlines
- 3-5 distinct fill colors per icon from this palette:
  #42A5F5 blue, #66BB6A green, #EF5350 red, #FFC107 yellow, #AB47BC purple,
  #FFB74D orange, #78909C gray, #5C6BC0 indigo, #FF7043 deep-orange,
  #29B6F6 light-blue, #CE93D8 light-purple, #8BC34A lime,
  #ECEFF1 light-bg, #37474F dark-bg, #263238 darker-bg, #455A64 slate,
  #CFD8DC light-gray, #FFF white
- One subtle CSS animation per icon inside a <style> tag, contextual to the concept:
  • Code/terminal → cursor blink, lines typing in
  • Network/data → flowing dots, dashed-line pulses
  • Security → shield pulse, lock click
  • Status → color toggle, checkmark pop
  • Tools/gears → spinning, bouncing
  • General → gentle float, glow, scale pulse
  • Keep animations ease-in-out, 1.5–3s duration, minimal and tasteful
- Simple geometry: rects, circles, ellipses, paths, lines. No complex illustrations.
- Monospace text OK for short labels (max ~6 chars), use font-family="monospace" font-size="3"–"8"
- Kebab-case filenames for multi-word names (e.g. pull-request, dns-lookup, hot-reload)

Generate each icon as a complete standalone SVG. When given a list, output each SVG in sequence separated by the icon name as a comment.

ICONS TO GENERATE:
