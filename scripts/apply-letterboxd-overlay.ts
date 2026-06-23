#!/usr/bin/env tsx
/**
 * apply-letterboxd-overlay.ts
 * Apply letterboxd-overlay.json to films.yaml, adding watched/rating metadata.
 * Creates a backup before modifying.
 *
 * Usage:
 *   npm run apply-letterboxd-overlay [--overlay <path>] [--films <path>]
 *
 * Defaults:
 *   Overlay: src/data/letterboxd-overlay.json
 *   Films:   src/data/films.yaml
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse, stringify } from 'yaml';

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
  unmatched: unknown[];
}

interface FilmRecord {
  id: string;
  title: string;
  year: number;
  director: string;
  objects: unknown[];
  density_score: number;
  letterboxd_url?: string;
  imdb_id?: string;
  watched?: boolean;
  rating?: number;
  watched_date?: string;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let overlayPath = 'src/data/letterboxd-overlay.json';
  let filmsPath = 'src/data/films.yaml';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--overlay' && args[i + 1]) {
      overlayPath = args[++i];
    } else if (args[i] === '--films' && args[i + 1]) {
      filmsPath = args[++i];
    }
  }

  overlayPath = resolve(overlayPath);
  filmsPath = resolve(filmsPath);

  // Check files exist
  if (!existsSync(overlayPath)) {
    console.error(`ERROR: Overlay file not found: ${overlayPath}`);
    console.error('Run "npm run ingest-letterboxd" first.');
    process.exit(1);
  }

  if (!existsSync(filmsPath)) {
    console.error(`ERROR: Films file not found: ${filmsPath}`);
    process.exit(1);
  }

  // Load overlay
  console.log(`Loading overlay from ${overlayPath}...`);
  const overlayRaw = readFileSync(overlayPath, 'utf-8');
  const overlay = JSON.parse(overlayRaw) as OverlayData;

  // Load films
  console.log(`Loading films from ${filmsPath}...`);
  const filmsRaw = readFileSync(filmsPath, 'utf-8');
  const films = parse(filmsRaw) as FilmRecord[];

  // Apply overlay
  let appliedCount = 0;
  for (const film of films) {
    const metadata = overlay.films[film.id];
    if (metadata) {
      film.watched = metadata.watched;
      if (metadata.rating !== undefined) {
        film.rating = metadata.rating;
      }
      if (metadata.watched_date) {
        film.watched_date = metadata.watched_date;
      }
      appliedCount++;
    }
  }

  // Create backup
  const backupPath = `${filmsPath}.backup-${Date.now()}`;
  console.log(`Creating backup: ${backupPath}`);
  writeFileSync(backupPath, filmsRaw);

  // Write updated films
  console.log(`Writing updated films to ${filmsPath}...`);
  const updatedYaml = stringify(films, {
    indent: 2,
    lineWidth: 0,
  });
  writeFileSync(filmsPath, updatedYaml);

  console.log(`\n✓ Applied ${appliedCount} watched entries to films.yaml`);
  console.log(`\nReview the changes, then commit if satisfied.`);
  console.log(`\nTo revert: cp ${backupPath} ${filmsPath}`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
