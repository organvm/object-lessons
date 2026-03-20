import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../../site.config';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const essays = await getCollection('essays');
  const sorted = essays.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site!.toString(),
    items: sorted.map(essay => ({
      title: essay.data.title,
      pubDate: essay.data.date,
      description: essay.data.excerpt,
      link: `/essays/${essay.slug}/`,
    })),
  });
}
