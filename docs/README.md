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
  "name":           "Absecon",
  "namelsad":       "Absecon city",
  "county":         "Atlantic",
  "townType":       "city",
  "status":         "visited",
  "visitNumber":    12,
  "restaurantName": "The Blue House Restaurant",
  "dateVisited":    "2024-06-15",
  "links": [
    { "category": "restaurant", "label": "The Blue House Restaurant", "url": "https://..." },
    { "category": "wikipedia",  "label": "Absecon Wikipedia", "url": "https://..." },
    { "category": "social", "platform": "Instagram", "label": "Absecon Visit", "url": "https://..." }
  ]
}
```

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
| `scripts/migrate-schema-v2.js` | One-time migration from v1 schema to v2 |

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

1. Open `data/ejc-data-template.xlsx` (generate it with `npm run gen-template` if needed).
2. Edit visit data in the **Data** sheet.
3. Export the Data sheet as a CSV file (`File > Save As > CSV`).
4. Run the import script: `node scripts/excel-to-json.js path/to/exported.csv`
5. Review the console output for any warnings.
6. Commit and push `data/municipalities.json`.

See [excel-to-json.md](excel-to-json.md) for full details, including the filter/sort impact section.

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
- [admin-panel.md](admin-panel.md) — Admin panel walkthrough, editing municipalities, managing links, exporting JSON
