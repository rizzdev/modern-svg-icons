import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://rizzdev.github.io',
  base: '/modern-svg-icons',
  integrations: [
    starlight({
      title: 'modern-svg-icons',
      customCss: ['./src/styles/custom.css'],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/rizzdev/modern-svg-icons',
        },
      ],
      sidebar: [
        { label: 'Getting Started', link: '/getting-started/' },
        { label: 'API Reference', link: '/api-reference/' },
        { label: 'Themes & Customization', link: '/themes/' },
        { label: 'Icon Gallery', link: '/icons/' },
        { label: 'Export CLI', link: '/export-cli/' },
        { label: 'Contributing', link: '/contributing/' },
        { label: 'Changelog', link: '/changelog/' },
        { label: 'FAQ', link: '/faq/' },
      ],
    }),
  ],
});
