import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Update `site` and set `base: '/'` when a custom domain is configured in GitHub Pages.
// Until then, GitHub Pages serves from https://prisma-user-interface-framework.github.io/Prisma2.0/
export default defineConfig({
  site: 'https://prisma-user-interface-framework.github.io',
  base: '/Prisma2.0',
  integrations: [mdx()],
});
