# Letterboxd Integration

This document describes how to ingest your Letterboxd watch history into the Object Lessons 253-film database.

## Overview

The integration matches your Letterboxd diary entries (watched films, ratings, dates) to films in `films.yaml` using Letterboxd URLs as the common identifier. The result is an overlay that adds `watched`, `rating`, and `watched_date` metadata to the film database.

**Posture:** read-only ingest of your own data; the scripts never post or log to Letterboxd.

## Data Flow

```
Your Letterboxd account
    ↓
[CSV export OR RSS feed]
    ↓
studium-letterboxd.py (in limen/ repo)
    ↓
logs/letterboxd-history.json
    ↓
npm run ingest-letterboxd
    ↓
src/data/letterboxd-overlay.json
    ↓
[review] → npm run apply-letterboxd-overlay
    ↓
films.yaml (with watched metadata)
```

## Step 1: Export Your Letterboxd Data

Choose one of the two options below.

### Option A: CSV Export (Complete, one-time)

1. Go to [letterboxd.com/settings/import-export](https://letterboxd.com/settings/import-export)
2. Click **Export Your Data**
3. Download the ZIP file to your Downloads folder
4. Unzip it

This export contains your complete watch history, ratings, and diary dates.

### Option B: Public RSS (Partial, live)

If you prefer, you can use your public Letterboxd RSS feed. This is live but only includes films you've explicitly added to your diary.

1. Go to your Letterboxd profile: `https://letterboxd.com/<your-username>`
2. Note your username

## Step 2: Run the Studium Ingester

The ingester script is in the separate `limen/` repository.

### With CSV export:

```bash
cd ~/path/to/limen
python3 scripts/studium-letterboxd.py ~/Downloads/letterboxd-export.zip
```

This creates `logs/letterboxd-history.json` in the limen/ directory.

### With RSS feed:

```bash
cd ~/path/to/limen
python3 scripts/studium-letterboxd.py --user <your-username>
```

## Step 3: Copy the History File

Copy the generated `letterboxd-history.json` to the Object Lessons repo:

```bash
cp ~/path/to/limen/logs/letterboxd-history.json ~/path/to/object-lessons/logs/
```

Create the `logs/` directory if it doesn't exist:

```bash
mkdir -p logs
```

## Step 4: Ingest Into Object Lessons

In the object-lessons repo, run the ingester:

```bash
npm run ingest-letterboxd
```

This creates `src/data/letterboxd-overlay.json`, which contains:

```json
{
  "generated_at": "2026-06-23T...",
  "source": "studium-letterboxd.py",
  "stats": {
    "total_entries": 127,
    "matched": 120,
    "unmatched": 7
  },
  "films": {
    "clockwork-orange-1971": {
      "watched": true,
      "rating": 5,
      "watched_date": "2025-03-15"
    },
    ...
  },
  "unmatched": [
    {
      "title": "Some Film",
      "year": 2020,
      "slug": "some-film-2020",
      "rating": 4
    }
  ]
}
```

**Inspect the output**, particularly:
- **Match rate:** How many films were matched? If low, check for URL slug issues.
- **Unmatched entries:** Films in your Letterboxd diary but not in the 253-film database.

## Step 5: Apply the Overlay (Optional, Staged)

If you're happy with the match rate and unmatched entries, apply the overlay to `films.yaml`:

```bash
npm run apply-letterboxd-overlay
```

This:
1. Creates a backup: `films.yaml.backup-<timestamp>`
2. Adds `watched`, `rating`, and `watched_date` fields to matched films
3. Writes the updated `films.yaml`

**⚠️ Note:** The YAML parser does not preserve file comments. The header comments in `films.yaml` (about density_score and tracked objects) will be lost. You can manually restore them by:

```bash
# After applying, add these back to the top of src/data/films.yaml:
# Object Lessons — Film Database
# density_score: number of tracked objects (milk, mirrors, cigarettes, clocks, doors) present
# Guns are tracked but do NOT count toward density_score
```

**Review the diff** before committing:

```bash
git diff src/data/films.yaml
```

To revert if needed:

```bash
cp src/data/films.yaml.backup-<timestamp> src/data/films.yaml
```

## Step 6: Build & Deploy

Once you're satisfied with the changes:

```bash
npm run build
```

Then commit and push as usual. **No auto-deploy** — this is staged on a local branch pending your review.

## What Gets Added to films.yaml

After applying the overlay, each matched film gains three optional fields:

```yaml
- id: clockwork-orange-1971
  title: A Clockwork Orange
  year: 1971
  director: Stanley Kubrick
  objects: [...]
  density_score: 4
  letterboxd_url: https://letterboxd.com/film/a-clockwork-orange/
  imdb_id: tt0066921
  watched: true                    # NEW
  rating: 5                        # NEW (optional, 1-10)
  watched_date: "2025-03-15"       # NEW (optional, ISO 8601)
```

## Troubleshooting

### "Input file not found: logs/letterboxd-history.json"

The ingester couldn't find the history file. Make sure you:
1. Ran `studium-letterboxd.py` in the limen/ repo
2. Copied the output to `logs/letterboxd-history.json` in this repo

### Low match rate (e.g., 50/127 matched)

This may be due to:
- Letterboxd slug mismatches (e.g., "the-shining-1980" vs "shining-the-1980")
- Films not yet in the 253-film database

Check the `unmatched` array in `letterboxd-overlay.json` for details. You can:
1. Add missing films to `films.yaml` with their `letterboxd_url`
2. Manually fix letterboxd URLs in `films.yaml` if slugs differ
3. Re-run the ingester

### Overlay doesn't apply cleanly

If `apply-letterboxd-overlay` fails, check:
1. That `films.yaml` hasn't been corrupted
2. That `letterboxd-overlay.json` is valid JSON

You can always restore from the backup and retry.

## Runtime Integration

After applying the overlay, the Film interface in `src/lib/films.ts` includes:

```typescript
export interface Film {
  id: string;
  title: string;
  year: number;
  director: string;
  objects: FilmObject[];
  density_score: number;
  letterboxd_url?: string;
  imdb_id?: string;
  watched?: boolean;       // NEW
  rating?: number;         // NEW
  watched_date?: string;   // NEW
}
```

UI components (e.g., `FilmographyTable`) can now display or filter by watched status.

## Future Work

- **Official Letterboxd API:** Request access to the official API for fully automated, ongoing syncs (requires Letterboxd approval)
- **Studium integration:** The force-axis overlay from the Studium curriculum will use the same pattern
- **Rating badges:** Display your ratings on the FilmographyTable or individual film pages

## Questions?

Refer to:
- **Issue:** [#19](https://github.com/organvm/object-lessons/issues/19)
- **Studium ingester:** `limen/scripts/studium-letterboxd.py`
