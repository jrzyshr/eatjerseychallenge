# Excel-to-JSON Workflow

This guide covers the full pipeline for maintaining visit data in Excel and importing it into `data/municipalities.json`.

---

## Overview

```
generate-excel-template.py
         │
         ▼
data/ejc-data-tracker.xlsx    ← Edit your data here
         │
         │  File > Save As > CSV (Data sheet only)
         ▼
your-data.csv
         │
         │  node scripts/excel-to-json.js your-data.csv
         ▼
data/municipalities.json      ← Commit and push to update the site
```

---

## Step 1 — Generate the Excel Template

Run the Python script once to create `data/ejc-data-tracker.xlsx`:

```bash
npm run gen-template
# or directly:
.venv/bin/python scripts/generate-excel-template.py
```

**Requires:** Python with `openpyxl` installed in the `.venv` virtual environment.

The script reads the current `data/municipalities.json` and pre-populates the Data sheet with all 564 municipalities sorted alphabetically, **including all existing link data** (restaurant URLs, Wikipedia URLs, social media posts, etc.). The Summary sheet and county sheets use live Excel formulas referencing the Data sheet, so they update automatically as you fill in data.

The script also **auto-expands platform slot columns**: if any town in `municipalities.json` currently has more than 2 links for a given social media platform, the script automatically adds the extra columns (e.g. `instagram3_label` / `instagram3_url`) to the sheet. The minimum is always 2 slots per platform; it scales up to 5. Towns that only use 1 or 2 slots are unaffected.

**Re-run whenever you want the spreadsheet to reflect the current state of `municipalities.json`** — notably after running `npm run import` (CSV bulk load) or after editing municipalities manually. There is no need to re-run it just to add data; only re-run when you want to sync from JSON back to Excel.

> **Important — back up your data before regenerating.** Running the generator overwrites `data/ejc-data-tracker.xlsx` (the previous version is automatically saved as `ejc-data-tracker-backup.xlsx`). Any data you have typed into Excel that has not yet been imported to `municipalities.json` will be lost in the main file. **Always export your current spreadsheet to CSV and run the import script before regenerating** so that your edits are preserved in `municipalities.json` first.

---

## Step 2 — Edit the Data Sheet

Open `data/ejc-data-tracker.xlsx` in Excel or a compatible spreadsheet application. Edit the **Data** sheet.

### Column Reference

The Data sheet has color-coded column groups. Every column is optional except at least one of `geoid` or `name`.

#### Identity (blue-grey)

| Column | Description |
|--------|-------------|
| `name` | Municipality name (e.g. `Absecon`). **Required if `geoid` is absent.** |
| `county` | County name (e.g. `Atlantic`). Used to disambiguate duplicate municipality names. |
| `geoid` | 10-digit US Census GEOID (e.g. `3400100100`). Preferred over name lookup. |
| `townType` | Auto-derived from GeoJSON. One of: `city`, `borough`, `township`, `town`, `village`. |

> **Disambiguation:** Several municipality names appear in more than one county (e.g. "Washington" exists in multiple counties). If you use `name` instead of `geoid`, you must also fill in the `county` column for those rows, or the import script will skip them with a warning.

#### Visit Data (green)

| Column | Description |
|--------|-------------|
| `status` | One of: `unvisited`, `visited`, `queued`, `pre-challenge`. Has a dropdown validator in Excel. |
| `visitNumber` | Integer (1–564) representing the order this town was visited on the journey. |
| `restaurantName` | Name of the primary restaurant or business visited. |
| `dateVisited` | Date visited. **Always type in `YYYY-MM-DD` format** (e.g. `2019-06-23`). The column is formatted as `YYYY-MM-DD` in the tracker so Excel will not auto-convert it. The import script also accepts `MM/DD/YYYY` (4-digit year). If a 2-digit year is encountered (e.g. `6/23/19`), it is assumed to be a 19xx year (e.g. `1919-06-23`) and a warning is printed — use 4-digit years to avoid ambiguity. |

#### Link Columns

All link columns are optional. Leave any column blank to skip that link. The `_url` columns drive whether a link is created — if the URL is empty, the label is ignored.

**Restaurant link (yellow)**

| Column | Description |
|--------|-------------|
| `restaurant_label` | Display text for the restaurant link. Defaults to `restaurantName` if blank. |
| `restaurant_url` | URL to the restaurant's website or social page. |

**Wikipedia (light blue)**

| Column | Description |
|--------|-------------|
| `wikipedia_url` | URL to the municipality's Wikipedia article. The label is auto-set to `"<Name> Wikipedia"`. |

**Social platforms (up to 5 posts each)**

Each platform follows the same pattern. Replace `{platform}` with `instagram`, `tiktok`, `youtube`, `threads`, `bluesky`, or `facebook`, and `{N}` with a number from 1 to 5.

| Column | Description |
|--------|-------------|
| `{platform}{N}_label` | Description of post N (e.g. `"Restaurant Name"`, `"Bonus Town Trivia"`). |
| `{platform}{N}_url` | URL to post N. |

> **Label consistency is required for grouping.** In the public map popup, all social links that share the same `label` value are grouped under one content heading, with their platform icons displayed side-by-side. If the same label is spelled differently across columns — even by a single character, an extra space, or a capitalization difference — the links will appear as separate content headings instead of grouped together. For example, `"NJ Town #121 - Union Twp"` and `"NJ Town #121 - Union Township"` would create two separate headings. **Always copy-paste the label text** when adding the same post across multiple platform columns to avoid accidental splits.
>
> **For Instagram columns specifically**, the `scripts/instagram-to-excel.py` script automatically writes normalized labels in the form `"NJ Town #N: Town Name"` and `"NJ Town #N: Bonus Town Trivia"`. When you later add matching Facebook, TikTok, or other platform links for the same post, use these exact label strings to ensure the icons are grouped correctly in the popup. See [instagram-to-excel.md](instagram-to-excel.md) for details.

The Excel template includes columns for slots 1 and 2 for each platform. **The template does not need to be regenerated to use slots 3–5.** Simply add the extra columns yourself, following the same naming convention (e.g. `instagram3_label`, `instagram3_url`). The import script checks up to slot 5 for every platform and silently skips any slot whose URL column is absent or blank.

If you re-run `npm run gen-template` after importing data that contains 3+ posts for a platform, the regenerated spreadsheet will automatically include those extra columns pre-populated with the existing data.

**Extra / overflow slots (grey)**

Three additional link slots for any category that doesn't fit the standard columns. These are useful for links that don't belong to a known platform (e.g. a press article, a custom category) rather than as overflow for social posts, since the named platform columns now support up to 5 slots each.

| Column | Description |
|--------|-------------|
| `extra1_category` | Category: `restaurant`, `wikipedia`, `social`, `more`, or any custom text. |
| `extra1_platform` | Platform name (only used when `extra1_category` is `social`). |
| `extra1_label` | Display text for this link. |
| `extra1_url` | URL. |
| `extra2_*`, `extra3_*` | Same pattern for two additional overflow slots. |

---

## Step 3 — Export to CSV

Export **only the Data sheet** as a CSV file:

1. Click on the **Data** tab (do not export Summary or county sheets).
2. Go to **File > Save As** (or **Save a Copy**).
3. Choose **CSV UTF-8 (Comma delimited) (.csv)** as the format.
4. Save the file anywhere convenient (e.g. `~/Downloads/ejc-export.csv`).

---

## Step 4 — Run the Import Script

```bash
node scripts/excel-to-json.js path/to/ejc-export.csv
```

Or using the npm script shortcut:

```bash
npm run import -- path/to/ejc-export.csv
```

The script will print a summary:

```
Import complete.
  Updated  : 42
  Skipped  : 0
```

If there are warnings (e.g. unrecognised municipality names, invalid status values, ambiguous name matches), they will appear above the summary. Review them before committing.

### What the script does

- Reads `data/municipalities.json` into memory.
- Parses the CSV (handles quoted fields, commas inside quotes, `\r\n` line endings).
- For each row, resolves the municipality by `geoid` first, then falls back to `name` + optional `county`.
- **Updates only the fields that are present in the CSV row.** Blank cells do not overwrite existing data.
- Rebuilds the `links` array from CSV columns when the row contains at least one non-empty `*_url` or `*_label` column. Any links already in the JSON whose URLs were not present in the CSV are **preserved and appended** to the rebuilt array, and a warning is printed for each one (see [Troubleshooting](#troubleshooting)).
- Writes the updated `municipalities.json` in-place (pretty-printed, 2-space indent).

### What the script does NOT do

- It never overwrites the geographic fields `name`, `namelsad`, `county`, or `townType`.
- Rows absent from the CSV are left completely untouched in `municipalities.json`.
- It does not silently delete links that exist in the JSON but are absent from the CSV — those links are preserved and flagged with a warning.

### Blank cell behavior

Blanking or deleting a cell in the spreadsheet **does not clear that field in `municipalities.json`**. The script only writes a field when the CSV cell contains a value — a blank cell is silently skipped. This means you cannot accidentally wipe data by leaving a cell empty.

| Field | Blank cell effect |
|-------|-------------------|
| `status` | Preserved — blank is ignored |
| `visitNumber` | Preserved — blank is ignored |
| `restaurantName` | Preserved — blank is ignored |
| `dateVisited` | Preserved — blank is ignored |
| Link columns (`*_url`, `*_label`) | Partially preserved — when at least one link column is non-empty, the `links` array is rebuilt from the CSV. Any existing JSON links whose URLs are not in the CSV are **kept and appended**, with a warning printed for each one. |

> **To intentionally clear a field**, use the Admin panel (`admin.html`) or edit `data/municipalities.json` directly. There is no way to clear a value via the CSV import.

---

## Step 5 — Commit and Deploy

```bash
git add data/municipalities.json
git commit -m "Update visit data"
git push
```

The site deploys automatically on push (e.g. via GitHub Pages or your hosting provider).

---

## Impact of Filters and Sorting in Excel

### Sorting

**Sorting does not affect the import.** The script matches each CSV row to a municipality using the `geoid` or `name` column — row order is irrelevant. You can freely sort the Data sheet by county, status, visit number, or any other column before exporting without affecting the import result.

### Filters (AutoFilter)

**Active filters do not exclude rows from a standard CSV export.** When you use **File > Save As > CSV**, Excel exports _all_ rows in the sheet, including rows that are currently hidden by active AutoFilter criteria. From the import script's perspective, the CSV contains every row regardless of what the filter shows.

> **Important exception:** If you manually copy only the visible/filtered rows into a new file and export that file as CSV, then only that subset of municipalities will be updated. All other municipalities in `municipalities.json` will remain unchanged. This can be intentional — for example, to update only "visited" entries — but be aware of the distinction between a standard Save As export and a copy-paste-filtered export.

#### Summary table

| Action in Excel | Effect on CSV export | Effect on import |
|----------------|---------------------|-----------------|
| Sort by any column | Rows exported in sorted order | No effect — rows matched by geoid/name |
| AutoFilter applied | **All rows exported** (filters are visual only in Save As) | All rows processed unchanged |
| Copy filtered rows → new file → CSV | Only visible rows exported | Only those municipalities updated |
| Hide a column | Column values still exported | All columns processed normally |

---

## Troubleshooting

### "SKIP: no municipality found for name"
The `name` value in your CSV doesn't match any entry in `municipalities.json`. Check spelling exactly — the name must match the `name` field (not `namelsad`). Using the `geoid` column eliminates this issue entirely.

### "SKIP: matches N entries; add a county column to disambiguate"
The municipality name exists in more than one county. Add a `county` column with the correct county name for that row.

### "WARNING: unrecognised date format"
The `dateVisited` value is not in `YYYY-MM-DD` or `MM/DD/YYYY` format. The value is stored as-is. Fix the cell format in Excel and re-export.

### "WARNING: unknown status"
The `status` value is not one of: `unvisited`, `visited`, `queued`, `pre-challenge`. The status field is skipped for that row; all other fields are still updated. Use the Excel dropdown validator to avoid typos.

### Links not updated
Links are only rebuilt when the row contains at least one non-empty `*_url` or `*_label` value. If you want to clear all links for a municipality, use the Admin panel instead.

### "WARNING: N link(s) found in JSON that were not in the CSV and have been preserved"
A link exists in `municipalities.json` for this municipality (e.g. added via the admin panel) that has no corresponding URL column in the CSV row. The link has been kept in `municipalities.json` and appended after the CSV-derived links. Review the warning output — if the link is no longer needed, remove it using the Admin panel (`admin.html`).
