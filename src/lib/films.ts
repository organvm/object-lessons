import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export interface FilmScene {
  description: string;
  symbolic_category: string;
  tier: number;
}

export interface FilmObject {
  object: string;
  scenes: FilmScene[];
}

export interface Film {
  id: string;
  title: string;
  year: number;
  director: string;
  objects: FilmObject[];
  density_score: number;
  letterboxd_url?: string;
  imdb_id?: string;
}

let _films: Film[] | null = null;

export function getFilms(): Film[] {
  if (!_films) {
    const raw = readFileSync(new URL('../data/films.yaml', import.meta.url), 'utf-8');
    _films = parse(raw) as Film[];
  }
  return _films;
}

export function getFilmById(id: string): Film | undefined {
  return getFilms().find(f => f.id === id);
}

export function getFilmsByObject(object: string): Film[] {
  return getFilms().filter(f => f.objects.some(o => o.object === object));
}

export function getHighDensityFilms(minDensity: number = 3): Film[] {
  return getFilms().filter(f => f.density_score >= minDensity);
}
