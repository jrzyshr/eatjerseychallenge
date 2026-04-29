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

The public map includes a **town search** feature: a magnifying-glass icon in the upper-left corner opens a slide-out panel where users can filter municipalities by name or county. Selecting a result zooms the map to that town and opens its popup. The panel closes when the user taps the map, presses Escape, or clicks the search icon again.

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

This field is extracted automatically by `scripts/excel-to-json.js` from the `instagram1_url` column when importing a CSV. It is never overwritten once set, so manual overrides are preserved. The GitHub Actions workflow also runs `scripts/backfill-shortcodes.js` as a safety net in case any entries are missing the shortcode.

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
| `js/map.js` | Public map logic (Leaflet, popup rendering, town search) |
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

### Standard New Town Visit Workflow

Use this end-to-end flow whenever a new town visit is ready to publish.

1. **Enter visit data in Excel.** Open `data/ejc-data-tracker.xlsx` and fill in the new row: `status`, `visitNumber`, `restaurantName`, `dateVisited`, `restaurant_url`, `wikipedia_url`, and any other non-Instagram columns.

2. **Export from PostFox.** On Instagram in Chrome, click the [PostFox – Export IG Posts](https://chromewebstore.google.com/detail/postfox-export-ig-posts/ommecmjombblimoalipfjpnjnjeceiie) extension and export your profile posts to JSON. Save the file to `data/` (e.g. `data/IGPOSTS_USERS_eatjerseychallenge_66.json`).

3. **Import Instagram URLs into Excel.** Run:
   ```bash
   .venv/bin/python scripts/instagram-to-excel.py data/IGPOSTS_USERS_eatjerseychallenge_66.json
   ```
   This writes the Instagram post URLs and normalized labels into the same Excel file from step 1. See [instagram-to-excel.md](instagram-to-excel.md) for details.

4. **Export CSV and import to JSON (once).** Export the Data sheet as CSV (`File > Save As > CSV UTF-8`), then run:
   ```bash
   node scripts/excel-to-json.js path/to/exported.csv
   ```
   This updates `data/municipalities.json` with all visit data, links, and automatically extracts `thumbnailShortcode` from the Instagram URL. See [excel-to-json.md](excel-to-json.md) for details.

5. **Commit and push.** Commit `data/municipalities.json` and `data/IGPOSTS_USERS_*.json` together and push to `main`.

6. **GitHub Action runs automatically.** The [Update Town Data](.github/workflows/update-town-data.yml) workflow:
   - Runs `backfill-shortcodes.js` as a safety net for any entries missing `thumbnailShortcode`.
   - Downloads any missing thumbnails from the PostFox export (320px wide WebP).
   - Commits updated `data/municipalities.json` and new `images/thumbnails/*.webp` files with the message `chore: add new town thumbnails [skip ci]`.

> **CDN URL expiry:** PostFox export thumbnail URLs expire approximately 3 days after export. Push the PostFox export within that window for the Action to successfully download thumbnails.

---

### Other Update Options

### Option A — Admin Panel (manual, one-at-a-time)

Best for making edits to a few municipalities without touching the spreadsheet.

1. Open `admin.html` in a browser via a local server.
2. Click a municipality on the map or in the sidebar list.
3. Edit status, visit details, and links in the modal.
4. Click **Save Changes** (updates in memory only).
5. Click **Export JSON** in the header to download an updated `municipalities.json`.
6. Replace `data/municipalities.json` in the repo and commit/push.

See [admin-panel.md](admin-panel.md) for full details.

### Option B — Excel → CSV → Import (bulk updates without Instagram)

Best for bulk-updating visit data, restaurant links, Wikipedia URLs, or other non-Instagram columns.

1. Open `data/ejc-data-tracker.xlsx` (generate it with `npm run gen-template` if needed).
2. Edit visit data in the **Data** sheet.
3. Export the Data sheet as a CSV file (`File > Save As > CSV`).
4. Run the import script: `node scripts/excel-to-json.js path/to/exported.csv`
5. Review the console output for any warnings.
6. Commit and push `data/municipalities.json`.

See [excel-to-json.md](excel-to-json.md) for full details, including the filter/sort impact section.

### Option C — PostFox Instagram Export → Excel (Instagram links only)

Best for backfilling Instagram URLs for many towns at once without going through the full new-visit workflow.

1. Export your Instagram profile posts to JSON using the **PostFox – Export IG Posts** Chrome extension.
2. Run: `.venv/bin/python scripts/instagram-to-excel.py path/to/IGPOSTS_USERS_*.json`
3. Review the console output for any warnings (e.g. towns with no `visitNumber` set).
4. Export the Data sheet to CSV and run `excel-to-json.js` (Option B steps 3–6).

See [instagram-to-excel.md](instagram-to-excel.md) for full details.

### Option D — Facebook Graph API → Excel (bulk Facebook link import)

Best for populating `facebook1_*` and `facebook2_*` columns for many towns at once.

1. Obtain a Facebook Page Access Token from [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer) with `pages_read_engagement` and `pages_show_list` permissions.
2. Run: `FB_PAGE_TOKEN=your_token .venv/bin/python scripts/facebook-to-excel.py`
3. Review the console output for any warnings.
4. Export the Data sheet to CSV and run `excel-to-json.js` (Option B steps 3–6).

See [facebook-to-excel.md](facebook-to-excel.md) for full details.

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

### Town Search

The public map has a slide-out search panel triggered by a magnifying-glass icon button in the upper-left corner of the map. When open, the panel displays a text input and a scrollable list of all municipalities, filtered live as the user types. Filtering matches against municipality name and county name (case-insensitive).

- **Duplicate names:** Towns whose name appears in more than one county show a county suffix in parentheses (e.g. "Washington (Morris)"). Towns with unique names show only the name.
- **Result selection:** Clicking a result closes the panel, fits the map to the selected municipality's bounds (capped at zoom level 13), and opens the standard public popup.
- **Close behavior:** The panel closes when the user clicks/taps the map, presses Escape, or clicks the search icon again.
- **Mobile:** On viewports narrower than 480px, the panel expands to nearly full width.

No configuration is needed — the search uses the same `municipalities.json` data already loaded for the map.

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

- [excel-to-json.md](excel-to-json.md) — Excel template, CSV export, import script, column reference, `thumbnailShortcode` extraction, filter/sort behavior
- [instagram-to-excel.md](instagram-to-excel.md) — Importing Instagram post URLs from a PostFox JSON export into the Excel tracker; automated thumbnail fetch via GitHub Actions
- [facebook-to-excel.md](facebook-to-excel.md) — Importing Facebook Page post URLs via the Graph API into the Excel tracker
- [admin-panel.md](admin-panel.md) — Admin panel walkthrough: editing municipalities, managing links, exporting JSON
