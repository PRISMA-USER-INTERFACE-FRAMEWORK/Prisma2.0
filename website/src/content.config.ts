import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Sources content from the repo's docs/ folder and root CHANGELOG.md.
// base is relative to website/ (i.e. the repo root).
const prismaui = defineCollection({
  loader: glob({ pattern: ['docs/*.md', 'docs/api/*.md', 'CHANGELOG.md'], base: '..' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { prismaui };
