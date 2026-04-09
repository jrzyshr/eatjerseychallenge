# Eat Jersey Challenge — Documentation

**Eat Jersey Challenge** is a static web application that tracks visits to all 564 New Jersey municipalities as part of a food/travel challenge. The public map shows colored polygons for each municipality, with popups showing visit details, restaurant info, and social media links.

---

## Table of Contents

- [App Architecture](#app-architecture)
- [Data Model](#data-model)
- [Key Files](#key-files)
- [Data Management Workflow](#data-management-workflow)
- [Detailed Guides](#detailed-guides)

---

## App Architecture

The app is entirely static — no server, no backend, no login. Data lives in a single JSON file committed to the repository.

```
Browser
  ├── index.html       Public-facing map (read-only)
  └── admin.html       Admin panel (edit + export JSON)
        │
        └── data/municipalities.json   ← The single source of truth
```

Both pages load `data/municipalities.json` at runtime via `fetch()`. Because they rely on `fetch()`, the files must be served by a local web server or deployed host — opening them directly as `file://` will fail.

---

## Data Model

`data/municipalities.json` is a flat object keyed by **GEOID** (a 10-digit US Census identifier). Each entry has the following shape:

```json
"3400100100": {
  "name":                "Absecon",
  "namelsad":            "Absecon city",
  "county":              "Atlantic",
  "townType":            "city",
  "status":              "visited",
  "visitNumber":         12,
  "restaurantName":      "The Blue House Restaurant",
  "dateVisited":         "2024-06-15",
  "thumbnailShortcode":  "DIuAH24xYCm",
  "links": [
    { "category": "restaurant", "label": "The Blue House Restaurant", "url": "https://..." },
    { "category": "wikipedia",  "label": "Absecon Wikipedia", "url": "https://..." },
    { "category": "social", "platform": "Instagram", "label": "Absecon Visit", "url": "https://..." }
  ]
}
```

`thumbnailShortcode` is the Instagram post shortcode (the `{code}` segment of `https://www.instagram.com/p/{code}/` or `/reel/{code}/`) used to serve a thumbnail image in the municipality popup. When present, the popup displays a WebP thumbnail sourced from `images/thumbnails/{shortcode}.webp`. If absent or if the image file does not exist, no thumbnail is shown and the popup layout is unaffected.

This field is populated automatically by `scripts/backfill-shortcodes.js` (one-time migration) and kept up to date via the GitHub Actions workflow when a new PostFox export is committed. It should not be edited manually.

### Status values

| Value | Meaning |
|-------|---------|
| `unvisited` | Not yet visited — shown grey on the map |
| `visited` | Visited and published — shown gold on the map |
| `queued` | Visited but post not yet published — shown **orange** on the map when the detail toggle is ON, gold when OFF |
| `pre-challenge` | Visited before the challenge began (pre-2023) — shown **purple** on the map when the detail toggle is ON, gold when OFF |

The public map treats any status other than `unvisited` as "visited" for coloring purposes. When the detail toggle is OFF, `queued` and `pre-challenge` towns are indistinguishable from `visited` towns (all gold).

---

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Public map page |
| `admin.html` | Admin editing panel |
| `js/map.js` | Public map logic (Leaflet, popup rendering) |
| `js/config.js` | App configuration; controls display order of social platform icons in popups |
| `js/admin.js` | Admin panel logic (editing, in-memory save, JSON export) |
| `data/municipalities.json` | **Primary data file** — edit and commit to update the site |
| `data/nj_municipalities.geojson` | NJ municipality polygon boundaries (static, never changes) |
| `scripts/seed.js` | One-time setup: generates `municipalities.json` from GeoJSON |
| `scripts/generate-excel-template.py` | Generates the Excel spreadsheet template |
| `scripts/excel-to-json.js` | Merges a CSV export from Excel into `municipalities.json` |
| `scripts/instagram-to-excel.py` | Imports Instagram post URLs from a PostFox JSON export into the Excel tracker |
| `scripts/facebook-to-excel.py` | Imports Facebook Page post URLs from the Graph API into the Excel tracker |
| `scripts/backfill-shortcodes.js` | One-time migration: populates `thumbnailShortcode` from existing Instagram URLs in `municipalities.json` |
| `scripts/fetch-thumbnails.js` | Downloads and resizes thumbnail images from a PostFox export; saves as WebP to `images/thumbnails/` |
| `scripts/migrate-schema-v2.js` | One-time migration from v1 schema to v2 |
| `images/thumbnails/` | WebP thumbnail images served in town popups, named by Instagram shortcode |
| `.github/workflows/update-town-data.yml` | GitHub Actions workflow; auto-fetches thumbnails when a new PostFox export is committed |

---

## Data Management Workflow

There are two ways to update municipality data:

### Option A — Admin Panel (manual, one-at-a-time)

Best for making edits to a few municipalities.

1. Open `admin.html` in a browser via a local server.
2. Click a municipality on the map or in the sidebar list.
3. Edit status, visit details, and links in the modal.
4. Click **Save Changes** (updates in memory only).
5. Click **Export JSON** in the header to download an updated `municipalities.json`.
6. Replace `data/municipalities.json` in the repo and commit/push.

See [admin-panel.md](admin-panel.md) for full details.

### Option B — Excel → CSV → Import (bulk updates)

Best for updating many municipalities at once.

1. Open `data/ejc-data-tracker.xlsx` (generate it with `npm run gen-template` if needed).
2. Edit visit data in the **Data** sheet.
3. Export the Data sheet as a CSV file (`File > Save As > CSV`).
4. Run the import script: `node scripts/excel-to-json.js path/to/exported.csv`
5. Review the console output for any warnings.
6. Commit and push `data/municipalities.json`.

See [excel-to-json.md](excel-to-json.md) for full details, including the filter/sort impact section.

### Option C — PostFox Instagram Export → Excel (bulk Instagram link import)

Best for populating `instagram1_*` and `instagram2_*` columns for many towns at once.

1. Export your Instagram profile posts to JSON using the **PostFox – Export IG Posts** Chrome extension.
2. Run the import script: `.venv/bin/python scripts/instagram-to-excel.py path/to/IGPOSTS_USERS_*.json`
3. Review the console output for any warnings (e.g. towns with no `visitNumber` set).
4. Continue with the standard Option B workflow: export the Data sheet to CSV and run `excel-to-json.js`.

See [instagram-to-excel.md](instagram-to-excel.md) for full details.

### Option D — Facebook Graph API → Excel (bulk Facebook link import)

Best for populating `facebook1_*` and `facebook2_*` columns for many towns at once.

1. Obtain a Facebook Page Access Token from [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer) with `pages_read_engagement` and `pages_show_list` permissions.
2. Run the import script: `FB_PAGE_TOKEN=your_token .venv/bin/python scripts/facebook-to-excel.py`
3. Review the console output for any warnings (e.g. towns with no `visitNumber` set).
4. Continue with the standard Option B workflow: export the Data sheet to CSV and run `excel-to-json.js`.

See [facebook-to-excel.md](facebook-to-excel.md) for full details.

### Option E — PostFox Export → Thumbnail images (automated via GitHub Actions)

Whenever a new PostFox export is committed, the **Update Town Data** GitHub Actions workflow runs automatically and downloads any missing thumbnails.

**Normal workflow (no manual steps needed after commit):**

1. Export your Instagram posts to JSON using the **PostFox – Export IG Posts** Chrome extension (same file used in Option C).
2. Save the file as `data/IGPOSTS_USERS_eatjerseychallenge_62.json` (replace the previous export).
3. Commit and push to `main`. The GitHub Action runs automatically:
   - Detects any `thumbnailShortcode` values in `municipalities.json` that don't yet have a `images/thumbnails/{shortcode}.webp` file.
   - Downloads and resizes those thumbnails (320px wide, WebP format).
   - Commits the new files back to the repo with the message `chore: add new town thumbnails [skip ci]`.

**To run manually (e.g. after adding a new town visit locally):**

```bash
# Populate thumbnailShortcode from the Instagram URL in the new town's entry:
npm run backfill

# Download any missing thumbnails from the current PostFox export:
npm run fetch-thumbnails
```

`thumbnailShortcode` is also populated automatically by `npm run backfill` whenever a new Instagram social link is added to `municipalities.json`. The fetch script is idempotent — already-downloaded shortcodes are always skipped.

See [instagram-to-excel.md](instagram-to-excel.md) for details on the PostFox export step.

---

## Configuration

`js/config.js` exposes a single global object `EJC_CONFIG` that controls runtime behavior of the public map. You can edit this file directly without touching any other code.

### `platformOrder`

An array of platform name strings (all lowercase) that controls the **left-to-right display order of social media platform icons** in municipality popups. For example:

```js
platformOrder: ['instagram', 'tiktok', 'youtube', 'threads', 'bluesky', 'facebook']
```

When a municipality has multiple social links under one content heading, the icons are sorted according to this array regardless of the order they appear in `municipalities.json`. Platforms not listed here appear after the listed ones, sorted alphabetically among themselves.

To change the order, edit the array and reload the page — no other code changes are needed.

### Legend Toggle (Show visit status)

A toggle switch in the map legend lets visitors show or hide distinct colors for `queued` and `pre-challenge` towns. When ON:

- **Queued** towns render in orange (`#FF8C00`)
- **Pre-challenge** towns render in purple (`#9C59B6`)
- Two additional legend rows appear with descriptive labels

**To change the legend label text:** edit the two `.legend-detail` items inside `#legend` in `index.html`. An HTML comment marks the location:
```html
<!-- STATUS LEGEND LABELS: edit the text in the two items below to update legend descriptions -->
```

**To change the map colors:** edit `STYLE_QUEUED` and `STYLE_PRE_CHALLENGE` in `js/map.js`. A comment marks the location:
```js
// LEGEND COLORS — to change queued/pre-challenge map colors, edit fillColor below.
```

---

## Detailed Guides

- [excel-to-json.md](excel-to-json.md) — Excel template, CSV export, import script, column reference, filter/sort behavior
- [instagram-to-excel.md](instagram-to-excel.md) — Bulk-importing Instagram post URLs from a PostFox JSON export into the Excel tracker, and triggering the automated thumbnail fetch
- [facebook-to-excel.md](facebook-to-excel.md) — Bulk-importing Facebook Page post URLs via the Graph API into the Excel tracker
- [admin-panel.md](admin-panel.md) — Admin panel walkthrough, editing municipalities, managing links, exporting JSON
