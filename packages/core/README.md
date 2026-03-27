# @modern-svg-icons/core

514 animated SVG icons for developers — tree-shakeable, zero dependencies, TypeScript-first.

Flat material style with CSS animations baked in. No runtime, no build step. Import what you need.

## Install

```bash
npm install @modern-svg-icons/core
# or
pnpm add @modern-svg-icons/core
# or
yarn add @modern-svg-icons/core
```

## Usage

### Import icons directly (tree-shakeable)

```ts
import { terminal, docker, kubernetes } from '@modern-svg-icons/core'

// Each export is a raw SVG string
document.getElementById('icon').innerHTML = terminal
```

Only the icons you import end up in your bundle.

### Customize with `createIcon()`

```ts
import { createIcon } from '@modern-svg-icons/core/utils'
import { terminal } from '@modern-svg-icons/core'

// Remove animation
createIcon(terminal, { animated: false })

// Change size
createIcon(terminal, { size: 32 })

// Both
createIcon(terminal, { animated: false, size: 48 })
```

### Search and filter with metadata

```ts
import { iconMeta } from '@modern-svg-icons/core/meta'

// Get info about an icon
iconMeta.terminal
// → { name: 'terminal', category: 'dev-tools', tags: ['cli', 'console', 'bash'] }

// Find all security icons
const securityIcons = Object.entries(iconMeta)
  .filter(([, meta]) => meta.category === 'security')
```

## Categories

23 categories: dev-tools, infrastructure, security, data-api, frontend-ui, backend-languages, ai-ml, cloud-devops, status-workflow, database-storage, networking, http-codes, testing-qa, gaming, files-media, arrows-symbols, design-ux, collaboration, nature, math-crypto, devex, analytics, general.

## CDN

Every npm package is available via CDN:

```html
<!-- Via unpkg -->
<script src="https://unpkg.com/@modern-svg-icons/core"></script>

<!-- Via jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/@modern-svg-icons/core"></script>
```

## License

[MIT](https://github.com/knoxhack/modern-svg-icons/blob/master/LICENSE)
