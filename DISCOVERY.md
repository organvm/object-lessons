# DISCOVERY — organvm/object-lessons

**Date:** 2026-06-22
**Verdict:** ✅ Real latent value — promote to ranked tier (not archival).

## Value Thesis

`organvm/object-lessons` is not merely an editorial website; its highest latent value is a **hand-curated, scene-level film-semiotics dataset that does not exist anywhere else in this form** — 253 films annotated across recurring objects (milk, mirrors, cigarettes, clocks, doors, guns…) with ~329 distinct symbolic categories, Tier-1/2 scene weighting, object co-occurrence "density" scoring, and Letterboxd/IMDb cross-references (`src/data/films.yaml`), backed by ~350K characters of original, citation-bearing scholarly essays (`src/content/essays/`, e.g. Barthes/Brown "Thing Theory"/Kopytoff frameworks applied to film). On top of this corpus sits a fully-built, deployable revenue surface: an Astro 5 + Cloudflare Pages/D1 site with React-island data tools (sortable filmography table, object-density heatmap, production-pipeline timeline) and a public submission + collaborator-auth pipeline — a content-marketing engine for an active YouTube channel (@AmpLabMedia) with clear monetization paths (ads/sponsors/Patreon, plus the essays themselves as a book/ebook). The reusable, defensible asset the rest of the estate can draw on is the **structured object→scene→symbolic-category knowledge graph**: it can be exposed as a queryable dataset/API, serve as a RAG/training corpus for film-analysis tooling, and the site itself is a reusable "YAML-content-DB → editorial-database site" template (content DB → tables/heatmaps/timelines/submission pipeline) clonable for other taxonomic ORGANVM properties.

## Highest-Leverage First Task

**Expose the 253-film object-semiotics database as a stable, documented public JSON endpoint** (e.g. `/films.json`, prerendered from `getFilms()` in `src/lib/films.ts`) with a published schema. This converts the buried YAML — currently consumed only internally by `FilmographyTable` — into a reusable estate asset and external data product, unlocking the dataset's value with the smallest possible change while adding an SEO/discovery surface. It is self-contained, needs no new infra, and is the natural foundation for any downstream API/RAG/licensing build-out.

## Build-Health Caveat (flag, not part of thesis)

`package.json` currently pins `react`/`react-dom` to **19.2.7**, but `CLAUDE.md` explicitly requires **18.3.1** because the Cloudflare Workers runtime lacks `MessageChannel` at module init (a React 19 hard requirement). This drift was introduced by dependabot bumps (#16/#17) and is a likely deploy regression. Restoring the React 18 pin should precede or accompany the first task to keep the Cloudflare build/deploy green.
