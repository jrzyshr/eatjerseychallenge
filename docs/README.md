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
| `queued` | Visited but content not yet posted — shown gold on the map |
| `pre-challenge` | Visited before the challenge officially started — shown gold |

The public map treats any status other than `unvisited` as "visited" for coloring purposes.

---

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Public map page |
| `admin.html` | Admin editing panel |
| `js/map.js` | Public map logic (Leaflet, popup rendering) |
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

## Detailed Guides

- [excel-to-json.md](excel-to-json.md) — Excel template, CSV export, import script, column reference, filter/sort behavior
- [admin-panel.md](admin-panel.md) — Admin panel walkthrough, editing municipalities, managing links, exporting JSON
