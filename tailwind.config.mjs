/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        link: 'var(--color-link)',
        divider: 'var(--color-divider)',
        'data-bg': 'var(--color-data-bg)',
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        reading: '680px',
        content: '1100px',
      },
    },
  },
  plugins: [],
};
