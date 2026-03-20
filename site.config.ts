export const siteConfig = {
  name: 'Object Lessons',
  tagline: 'The Recurring Objects of Cinema',
  domain: 'objectlessons.film',
  url: 'https://objectlessons.film',
  description: 'Tracing recurring objects across a hundred years of film — milk, mirrors, cigarettes, clocks, doors, guns.',
  author: 'Anthony James Padavano',
  socials: {
    youtube: 'https://youtube.com/@AmpLabMedia',
    patreon: '',
    letterboxd: '',
    bluesky: '',
    email: '',
  },
  nav: [
    { label: 'Episodes', href: '/episodes' },
    { label: 'Essays', href: '/essays' },
    { label: 'Objects', href: '/objects' },
    { label: 'Research', href: '/research' },
    { label: 'Pipeline', href: '/pipeline' },
    { label: 'Submit', href: '/submit' },
    { label: 'About', href: '/about' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
