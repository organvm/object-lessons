# Object Lessons × THE STUDIUM — the force-axis bridge

> Staged on branch `feat/studium-force-bridge`. **Additive and non-deployed** — nothing here changes the
> live site until Anthony merges + deploys (his gate). It touches **no existing file**: `films.yaml` and the
> 253-film catalogue are untouched; this is a new overlay that joins by Letterboxd slug.

## Why
**THE STUDIUM** (Anthony's great-books transmission curriculum, repo `limen/studium`) reads the canon through
a taxonomy of **forces** (wrath, fate, grief, law, kingship, sacrifice …) and pairs each passage with a *film
that relates* — chosen as an **object lesson**: a non-obvious film from film history whose tracked **object**
(milk / mirror / clock / …) makes the text's force visible. That is precisely this project's spine, approached
from the literary side. The two share one model:

```
film  ↔  { force (Studium) · object (Object Lessons) · watched (Letterboxd) }
```

`films.yaml` already keys every film by `letterboxd_url`, so the join is exact.

## What this branch adds
- **`src/data/studium-forces.yaml`** — the force overlay: each Studium film pick → `{force, division, object,
  in_object_db, object_lesson}`, joined by Letterboxd slug. `in_object_db: false` flags Studium picks not yet
  in `films.yaml` — candidate additions to the catalogue (e.g. *Paths of Glory*, *Come and See*, *Ran*).
- **`src/lib/studium.ts`** — typed loader (mirrors `films.ts` / `pipeline.ts`): `getStudiumBridge()`,
  `getFilmsWithForce()` (annotates `getFilms()` with force + watch status), `getStudiumCandidates()`.
- **`watched_overlay`** (in the YAML) — populated when his Letterboxd export is ingested
  (`limen/scripts/studium-letterboxd.py`; tracked by the Letterboxd ingestion **issue #19**). Empty until then;
  the bridge degrades gracefully (a film simply shows no "seen" mark).

## Wiring it to the site later (his gate)
A `/studium` page (or a force chip on existing film cards) can consume `getFilmsWithForce()` to show, for any
catalogued film, *which canonical text it is an object lesson for* — turning the object catalogue into a
two-axis map (object × force). Not built here: adding a route changes the deployed site.

## Currently in both (proof of join)
Raging Bull (`wrath`, mirror) and 2001: A Space Odyssey (`divine-intervention`) are already in `films.yaml`;
the overlay annotates them. The crosswalk that produced this lives at `limen/scripts/studium-objectlessons.py`.
