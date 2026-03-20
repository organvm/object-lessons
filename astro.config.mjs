import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://objectlessons.film',
  output: 'static',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  integrations: [
    mdx(),
    react(),
    tailwind(),
    sitemap(),
  ],
});
