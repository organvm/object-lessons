#!/usr/bin/env tsx
/**
 * ingest-letterboxd.ts
 * Consume letterboxd-history.json (from studium-letterboxd.py) and create
 * a watched/rating overlay for films.yaml.
 *
 * Usage:
 *   npm run ingest-letterboxd [--input <path>] [--output <path>]
 *
 * Defaults:
 *   Input:  logs/letterboxd-history.json (from studium ingester)
 *   Output: src/data/letterboxd-overlay.json (mapping film IDs to watch metadata)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

interface LetterboxdEntry {
  title: string;
  year: number;
  slug: string;
  rating?: number;
  watched_date?: string;
}

interface FilmObject {
  object: string;
  scenes: unknown[];
}

interface FilmRecord {
  id: string;
  title: string;
  year: number;
  director: string;
  objects: FilmObject[];
  density_score: number;
  letterboxd_url?: string;
  imdb_id?: string;
}

interface WatchMetadata {
  watched: true;
  rating?: number;
  watched_date?: string;
}

interface OverlayData {
  generated_at: string;
  source: string;
  stats: {
    total_entries: number;
    matched: number;
    unmatched: number;
  };
  films: Record<string, WatchMetadata>;
  unmatched: LetterboxdEntry[];
}

function extractLetterboxdSlug(url: string): string {
  const match = url.match(/letterboxd\.com\/film\/([^/]+)\//);
  return match ? match[1] : '';
}

function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let inputPath = 'logs/letterboxd-history.json';
  let outputPath = 'src/data/letterboxd-overlay.json';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputPath = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[++i];
    }
  }

  inputPath = resolve(inputPath);
  outputPath = resolve(outputPath);

  // Check if input exists
  if (!existsSync(inputPath)) {
    console.error(`ERROR: Input file not found: ${inputPath}`);
    console.error('Make sure the Letterboxd ingester (studium-letterboxd.py) has been run first.');
    process.exit(1);
  }

  // Load films.yaml
  console.log('Loading films database...');
  const filmsPath = join(process.cwd(), 'src/data/films.yaml');
  const filmsRaw = readFileSync(filmsPath, 'utf-8');
  const films = parse(filmsRaw) as FilmRecord[];

  // Build lookup: normalized letterboxd slug → film ID
  const slugToFilmId = new Map<string, string>();
  for (const film of films) {
    if (film.letterboxd_url) {
      const slug = extractLetterboxdSlug(film.letterboxd_url);
      if (slug) {
        slugToFilmId.set(normalizeSlug(slug), film.id);
      }
    }
  }

  console.log(`Loaded ${films.length} films, indexed ${slugToFilmId.size} by Letterboxd URL.`);

  // Load letterboxd history
  console.log(`Reading Letterboxd history from ${inputPath}...`);
  const historyRaw = readFileSync(inputPath, 'utf-8');
  const history = JSON.parse(historyRaw) as LetterboxdEntry[];
  console.log(`Loaded ${history.length} Letterboxd entries.`);

  // Match and create overlay
  const overlay: OverlayData = {
    generated_at: new Date().toISOString(),
    source: 'studium-letterboxd.py',
    stats: {
      total_entries: history.length,
      matched: 0,
      unmatched: 0,
    },
    films: {},
    unmatched: [],
  };

  for (const entry of history) {
    const slug = normalizeSlug(entry.slug);
    const filmId = slugToFilmId.get(slug);

    if (filmId) {
      overlay.films[filmId] = {
        watched: true,
        ...(entry.rating !== undefined && { rating: entry.rating }),
        ...(entry.watched_date && { watched_date: entry.watched_date }),
      };
      overlay.stats.matched++;
    } else {
      overlay.unmatched.push(entry);
    }
  }

  overlay.stats.unmatched = overlay.unmatched.length;

  // Write overlay
  console.log(`Writing overlay to ${outputPath}...`);
  writeFileSync(outputPath, JSON.stringify(overlay, null, 2));

  // Report
  console.log(`\n✓ Ingestion complete:`);
  console.log(`  Matched: ${overlay.stats.matched} / ${overlay.stats.total_entries}`);
  console.log(`  Unmatched: ${overlay.stats.unmatched}`);
  console.log(`\nOverlay saved to: ${outputPath}`);

  if (overlay.stats.unmatched > 0) {
    console.log(`\nWarning: ${overlay.stats.unmatched} entries could not be matched.`);
    console.log('These may be due to:');
    console.log('  - Films not yet in the database');
    console.log('  - Letterboxd URL slug differences');
    console.log('Review the "unmatched" array in the overlay for details.');
  }
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
