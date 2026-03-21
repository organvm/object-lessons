# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What This Is

**Object Lessons — The Recurring Objects of Cinema.** Editorial website for the AMP Lab Media YouTube channel ([@AmpLabMedia](https://youtube.com/@AmpLabMedia)). Built with Astro 5.x, deployed to Cloudflare Pages at [object-lessons.pages.dev](https://object-lessons.pages.dev) / custom domain `objectlessons.film`.

The site traces recurring objects (milk, mirrors, cigarettes, clocks, doors, guns…) across a hundred years of film, pairing YouTube essays with written research briefs and a 253-film YAML database.

**Author:** Anthony James Padavano
**Organ:** META-ORGANVM | **Parent repo:** `praxis-perpetua` (own git repo, tracked as a nested project — not a submodule of praxis-perpetua)

## Commands

```bash
npm install

npm run dev        # local dev server (astro dev)
npm run build      # production build: validate → og → astro build
npm run validate   # category validation (scripts/validate-categories.ts)
npm run og         # generate OG images (scripts/generate-og-images.ts)
npm run preview    # preview production build locally
npm run check      # astro type check
```

The `build` script always runs validation and OG generation before the Astro build. Never skip them.

## Architecture

- **Astro 5.x** — static output (`output: 'static'`) with Cloudflare adapter
- **React 18** islands (NOT React 19 — Cloudflare Workers lacks `MessageChannel`, which React 19 requires at module load time)
- **Tailwind CSS 3.x** via `@astrojs/tailwind`
- **MDX** content collections (`@astrojs/mdx`)
- **Cloudflare D1** for submission storage; binding name `DB`
- **Cloudflare Pages** with `nodejs_compat_v2` compatibility flag
- **Satori + @resvg/resvg-js** for OG image generation at build time

Vite SSR conditions are set to `['workerd', 'worker', 'browser']` to target the Cloudflare runtime correctly.

## Project Layout

```
src/
  components/
    astro/         # Astro components (Citation, EpisodeCard, EssayCard, FilmStill,
                   #   Footer, Footnote, Header, Nav, ObjectCard, SEO, StatusBadge,
                   #   YouTubeEmbed)
    react/         # React islands (see below)
  content/
    config.ts      # Zod schemas for all three collections
    objects/       # 10 object MDX files (the tracked film objects)
    episodes/      # 10 episode MDX files
    essays/        # 6 essay MDX files
  data/
    films.yaml     # 253-film research database
    pipeline-status.yaml  # per-object production status tracking
  layouts/         # page layouts
  lib/
    auth.ts        # HMAC-SHA-256 session cookies for collaborator auth
    config.ts      # site-wide config loader
    d1.ts          # D1 query helpers (createSubmission, getSubmissions)
    films.ts       # YAML film database loader
    pipeline.ts    # pipeline-status.yaml loader
  pages/
    index.astro
    about.astro
    research.astro
    pipeline.astro
    collaborator.astro
    submit.astro
    404.astro
    rss.xml.ts
    objects/       # [slug].astro + index.astro
    episodes/      # [slug].astro + index.astro
    essays/        # [slug].astro + index.astro
    api/
      submit.ts              # POST — public film/object/clip submission
      submissions.ts         # GET  — list submissions (collaborator-auth required)
      collaborator/
        auth.ts              # POST — collaborator login (sets HMAC session cookie)
scripts/
  generate-og-images.ts     # build-time OG image generator (Satori)
  validate-categories.ts    # validates symbolic_category kebab slugs
  seed-d1.sql               # D1 schema (run once to initialize the database)
site.config.ts              # top-level site config (name, domain, nav, socials)
```

## Content Collections

Defined in `src/content/config.ts` with Zod schemas. Three collections:

### `objects`
One MDX per tracked film object. Schema: `name`, `status` (published/in-production/researching/candidate), `film_count`, `priority_score` (1–5), `symbolic_categories[]` (each with `name`, `kebab`, `description`), `episodes[]`, `essays[]`, `co_occurrences[]`, `landmark_scenes[]`.

### `episodes`
One MDX per YouTube episode. Schema: `title`, `object`, `date`, `youtube_id`, `status` (published/in-production/scripted/planned), `version` (v1/v2), `duration`, `films[]`, `symbolic_categories[]`, `companion_essay?`, `thumbnail?`, `seo`.

### `essays`
Full research briefs. Schema: `title`, `object`, `date`, `type` (companion/standalone/research-note), `related_episodes[]`, `excerpt`, `citations[]`.

## Content Inventory

### Objects (10 total)
All 10 objects have both an `objects/` MDX and an `episodes/` MDX:
`balloons`, `cereal`, `cigarettes`, `clocks`, `doors`, `eggs`, `guns`, `milk`, `mirrors`, `telephones`

### Episodes (10 total)
- **V1 (published 2018–2020):** balloons, cereal (The Cereal Box), eggs, telephones
- **V2 (2026 series):** cigarettes, clocks, doors, guns, milk, mirrors

V1 episode `youtube_id` values are `"PLACEHOLDER"` — the real IDs need to be added when the channel archive is linked.

### Essays (6 total)
`cigarettes-in-cinema`, `clocks-in-cinema`, `doors-in-cinema`, `guns-in-cinema`, `milk-in-cinema`, `mirrors-in-cinema`

Essays contain **full research text** (350K+ characters total). Never condense, summarize, or truncate essay MDX bodies — they are the primary research record.

## Film Database (`src/data/films.yaml`)

253 films with YAML entries keyed by `id` (kebab slug). Fields include `title`, `year`, `director`, `objects[]`, and per-object scene data. Used by the `FilmographyTable` island and validation scripts.

## React Islands

All five islands live in `src/components/react/`. They are loaded as client components in Astro pages (`client:load` or `client:idle`).

| Island | Purpose |
|---|---|
| `SubmissionForm.tsx` | Tabbed public form for submitting objects, films, or clips. Posts to `POST /api/submit`. |
| `CollaboratorDashboard.tsx` | Password-protected dashboard: shows pipeline objects + all D1 submissions with status management. |
| `FilmographyTable.tsx` | Sortable/filterable table of the 253-film database using `@tanstack/react-table`. |
| `ObjectDensityGraph.tsx` | Matrix heatmap of object co-occurrence density across films. |
| `PipelineTimeline.tsx` | Visual timeline of per-object production stages (research → outline → narration → edit). |

## API Endpoints

All API routes set `export const prerender = false`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/submit` | None | Accept object/film/clip suggestions from the public. Validates type-specific required fields, stores in D1. |
| `GET` | `/api/submissions` | HMAC session cookie | List D1 submissions for collaborator review. Accepts `?status=` filter. |
| `POST` | `/api/collaborator/auth` | None | Validate collaborator password; set 7-day HMAC-SHA-256 session cookie (`ol_collab_session`). |

The collaborator auth uses constant-time string comparison to prevent timing attacks.

## Cloudflare Deployment

- **Project:** `object-lessons` on Cloudflare Pages
- **Output dir:** `dist/`
- **Compatibility date:** `2025-01-01`
- **Compatibility flags:** `nodejs_compat_v2`
- **D1 database:** `object-lessons-submissions` — ID `f1a89504-2ddd-4c9b-ade8-eb52f6aee7a3`
- **D1 binding:** `DB` (accessed via `locals.runtime?.env?.DB` in API routes)

To initialize a new D1 database: `wrangler d1 execute object-lessons-submissions --file=scripts/seed-d1.sql`

### Environment Variables (set in Cloudflare Pages dashboard)

| Variable | Description |
|---|---|
| `COLLABORATOR_PASSWORD` | Plain-text password for collaborator dashboard access. Set as a secret in Pages settings. |

The password is never stored — it is used as the HMAC key for session cookie signing.

## Important Notes

- **React 18 is required.** Do not upgrade to React 19. Cloudflare Workers' runtime lacks `MessageChannel` at module initialization time, which React 19 requires. The `react` and `react-dom` dependencies are pinned to `18.3.1`.
- **Essays are full research briefs.** The `.mdx` bodies under `src/content/essays/` are complete scholarly texts. Never condense or summarize them — treat the full text as load-bearing content.
- **V1 YouTube IDs are placeholders.** The four V1 episodes (balloons, cereal, eggs, telephones) have `youtube_id: "PLACEHOLDER"`. Replace with real IDs before publishing the V2 site.
- **Validate before building.** `npm run validate` checks that all `symbolic_category` kebab slugs in the film database match the schemas. The build will fail if validation fails — this is intentional.
- **D1 is only available at runtime.** During `astro dev` with `platformProxy: { enabled: true }`, Wrangler proxies D1 locally. Without it, D1 bindings are `undefined` — the API routes handle this gracefully with 503 responses.
