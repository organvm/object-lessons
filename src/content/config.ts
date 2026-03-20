import { defineCollection, z } from 'astro:content';

const episodes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    object: z.string(),
    date: z.date(),
    youtube_id: z.string(),
    status: z.enum(['published', 'in-production', 'scripted', 'planned']),
    version: z.enum(['v1', 'v2']),
    duration: z.string().default(''),
    films: z.array(z.string()).default([]),
    symbolic_categories: z.array(z.string()).default([]),
    companion_essay: z.string().optional(),
    thumbnail: z.string().optional(),
    seo: z.object({
      description: z.string(),
      keywords: z.array(z.string()).default([]),
    }),
  }),
});

const essays = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    object: z.string(),
    date: z.date(),
    type: z.enum(['companion', 'standalone', 'research-note']),
    related_episodes: z.array(z.string()).default([]),
    excerpt: z.string(),
    citations: z.array(z.object({
      key: z.string(),
      text: z.string(),
    })).default([]),
  }),
});

const objects = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    status: z.enum(['published', 'in-production', 'researching', 'candidate']),
    film_count: z.number(),
    priority_score: z.number().min(1).max(5),
    symbolic_categories: z.array(z.object({
      name: z.string(),
      kebab: z.string(),
      description: z.string(),
    })),
    episodes: z.array(z.string()).default([]),
    essays: z.array(z.string()).default([]),
    co_occurrences: z.array(z.object({
      object: z.string(),
      count: z.number(),
      films: z.array(z.string()),
    })).default([]),
    landmark_scenes: z.array(z.object({
      film: z.string(),
      description: z.string(),
      tier: z.number().min(1).max(3),
    })).default([]),
  }),
});

export const collections = { episodes, essays, objects };
