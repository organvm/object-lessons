#!/usr/bin/env tsx
/**
 * validate-categories.ts
 * Build-time check: every symbolic_category referenced in an episode file
 * must correspond to a kebab value defined in that episode's object file.
 *
 * Usage: npm run validate
 * Exit 0 = all valid. Exit 1 = validation errors found.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse } from 'yaml';

// ---------------------------------------------------------------------------
// Frontmatter parser
// ---------------------------------------------------------------------------

function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return parse(match[1]) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SymbolicCategory {
  name: string;
  kebab: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const contentBase = join(process.cwd(), 'src/content');

  // Load all object definitions: slug → Set<kebab>
  const objectsDir = join(contentBase, 'objects');
  const objectDefs = new Map<string, Set<string>>();

  for (const file of readdirSync(objectsDir).filter(f => f.endsWith('.mdx'))) {
    const content = readFileSync(join(objectsDir, file), 'utf-8');
    const fm = parseFrontmatter(content);
    const slug = basename(file, '.mdx');

    const categories = (fm.symbolic_categories as SymbolicCategory[] | undefined) || [];
    const kebabs = new Set(categories.map(c => c.kebab));
    objectDefs.set(slug, kebabs);
  }

  console.log(`Loaded ${objectDefs.size} object definition(s).`);

  // Validate each episode
  const episodesDir = join(contentBase, 'episodes');
  let errors = 0;

  const episodeFiles = readdirSync(episodesDir).filter(f => f.endsWith('.mdx'));
  console.log(`Validating ${episodeFiles.length} episode(s)...\n`);

  for (const file of episodeFiles) {
    const content = readFileSync(join(episodesDir, file), 'utf-8');
    const fm = parseFrontmatter(content);
    const slug = basename(file, '.mdx');

    const objectSlug = fm.object as string | undefined;
    const categories = (fm.symbolic_categories as string[] | undefined) || [];

    if (!objectSlug) {
      console.error(`ERROR: Episode "${slug}" has no "object" field in frontmatter`);
      errors++;
      continue;
    }

    const validKebabs = objectDefs.get(objectSlug);
    if (!validKebabs) {
      console.error(
        `ERROR: Episode "${slug}" references object "${objectSlug}" — no matching object file found`,
      );
      errors++;
      continue;
    }

    for (const cat of categories) {
      if (!validKebabs.has(cat)) {
        console.error(
          `ERROR: Episode "${slug}" uses category "${cat}" which is not defined in object "${objectSlug}"`,
        );
        errors++;
      }
    }
  }

  if (errors > 0) {
    console.error(`\n${errors} validation error(s) found.`);
    process.exit(1);
  } else {
    console.log('All episode categories are valid.');
    process.exit(0);
  }
}

main();
