import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { getFilms, type Film } from './films';

// THE STUDIUM × Object Lessons — the force-axis overlay (src/data/studium-forces.yaml).
// Additive: joins to films.yaml by Letterboxd slug; films.yaml stays the single source of film identity.
// See ../../STUDIUM-BRIDGE.md. Staged on feat/studium-force-bridge — not deployed (his gate).

export interface StudiumForce {
  slug: string;
  force: string;
  division: number;
  object: string | null;
  in_object_db: boolean;
  object_lesson: string;
}

export interface WatchedEntry {
  slug: string;
  rating?: string;
  watched_date?: string;
}

export interface StudiumBridge {
  canon_work: string;
  films: StudiumForce[];
  watched_overlay: WatchedEntry[];
}

let _bridge: StudiumBridge | null = null;

export function getStudiumBridge(): StudiumBridge {
  if (!_bridge) {
    const raw = readFileSync(new URL('../data/studium-forces.yaml', import.meta.url), 'utf-8');
    _bridge = parse(raw) as StudiumBridge;
  }
  return _bridge;
}

const slugOf = (url?: string): string => (url?.match(/\/film\/([^/]+)\/?/)?.[1] ?? '');

/** A catalogued film (films.yaml) annotated with its Studium force + object lesson, when one exists. */
export interface FilmWithForce extends Film {
  studium?: StudiumForce;
  watched?: WatchedEntry;
}

/** Join the 253-film DB to the force overlay + watch history (by Letterboxd slug). */
export function getFilmsWithForce(): FilmWithForce[] {
  const bySlug = new Map(getStudiumBridge().films.map((f) => [f.slug, f]));
  const watched = new Map(getStudiumBridge().watched_overlay.map((w) => [w.slug, w]));
  return getFilms().map((film) => {
    const slug = slugOf(film.letterboxd_url);
    return { ...film, studium: bySlug.get(slug), watched: watched.get(slug) };
  });
}

/** Studium picks NOT yet in films.yaml — candidate additions to the catalogue. */
export function getStudiumCandidates(): StudiumForce[] {
  return getStudiumBridge().films.filter((f) => !f.in_object_db);
}
