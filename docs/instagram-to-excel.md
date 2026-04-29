# Instagram → Excel Workflow

This guide covers how to bulk-import Instagram post URLs into `data/ejc-data-tracker.xlsx` using the PostFox browser extension and the `scripts/instagram-to-excel.py` script.

---

## Overview

```
PostFox extension
        │
        │  Export to JSON from your Instagram profile page
        ▼
IGPOSTS_USERS_{username}_{n}.json
        │
        │  .venv/bin/python scripts/instagram-to-excel.py
        ▼
data/ejc-data-tracker.xlsx   ← Instagram URLs written into existing Excel
        │
        │  File > Save As > CSV  (one export covering all edits)
        ▼
path/to/export.csv
        │
        │  node scripts/excel-to-json.js export.csv
        ▼
data/municipalities.json     ← visit data + links + thumbnailShortcode
        │
        │  git push municipalities.json + IGPOSTS_USERS_*.json
        ▼
GitHub Actions (update-town-data.yml)
        │
        │  scripts/fetch-thumbnails.js
        ▼
images/thumbnails/{shortcode}.webp   ← committed automatically
        │
        ▼
municipality popups show thumbnail
```

Use this workflow to populate the `instagram1_label`, `instagram1_url`, `instagram2_label`, and `instagram2_url` columns for visited towns. The script matches posts to towns by visit number and writes only into empty cells — it never overwrites existing data.

---

## Prerequisites

- **PostFox – Export IG Posts** Chrome extension ([Chrome Web Store](https://chromewebstore.google.com/detail/postfox-export-ig-posts/ommecmjombblimoalipfjpnjnjeceiie))
- Python with `openpyxl` installed in the project's `.venv` (already a dependency of `generate-excel-template.py`)
- `data/ejc-data-tracker.xlsx` with `visitNumber` populated for the towns you want to match

> **Important:** The script matches posts to rows by `visitNumber`. If a town's `visitNumber` cell is blank in the spreadsheet, that town's posts will be skipped with a warning. Populate `visitNumber` values first (via the Admin panel or directly in the Excel), then run the import.

---

## Step 1 — Export from PostFox

1. Install the **PostFox – Export IG Posts** Chrome extension.
2. Navigate to your Instagram profile page in Chrome.
3. Click the PostFox extension icon in the toolbar.
4. Select your username and click **Export**.
5. When the export completes, choose **JSON** format and download the file.
   - The filename will follow the pattern `IGPOSTS_USERS_{username}_{n}.json`
   - Move the file anywhere convenient, for example into `data/`.
6. The JSON file contains all posts and reels in a single flat array — there is no need to export separately.

---

## Step 2 — Run the Script

```bash
.venv/bin/python scripts/instagram-to-excel.py data/IGPOSTS_USERS_eatjerseychallenge_62.json
```

The username (`eatjerseychallenge`) is auto-detected from the filename. If your filename uses a different pattern, pass the username explicitly:

```bash
.venv/bin/python scripts/instagram-to-excel.py path/to/file.json --username eatjerseychallenge
```

To use a different Excel file than the default (`data/ejc-data-tracker.xlsx`):

```bash
.venv/bin/python scripts/instagram-to-excel.py path/to/file.json --excel path/to/other.xlsx
```

---

## CLI Reference

```
usage: instagram-to-excel.py [-h] [--username HANDLE] [--excel PATH] json_file

positional arguments:
  json_file          Path to the PostFox JSON export file

options:
  --username HANDLE  Instagram username to filter posts by.
                     Auto-detected from the filename if not provided.
  --excel PATH       Path to the Excel tracker file.
                     Default: data/ejc-data-tracker.xlsx
```

---

## What the Script Does

### 1. Filters by username

The PostFox export may include posts from other accounts (tagged posts, reposts). The script filters to only entries whose `User Name` field matches the target username.

### 2. Matches posts to towns

For each post, the script looks at the first non-empty line of the caption and applies this pattern:

```
NJ Town #N: ...
NJ Town N: ...
New Jersey Town #N: ...
New Jersey Town N: ...
```

The visit number `N` is extracted and used to look up the corresponding row in the `visitNumber` column of the Excel file. Posts that do not match this pattern (year-in-review posts, promotional posts, etc.) are silently skipped.

### 3. Assigns to the correct slot

| First caption line contains | Slot written |
|-----------------------------|-------------|
| "Bonus Town Trivia" | `instagram2_label` / `instagram2_url` |
| Anything else | `instagram1_label` / `instagram1_url` |

### 4. Builds normalized labels

Labels are always written in a consistent format regardless of how the caption is phrased:

| Post type | Label written |
|-----------|--------------|
| Main town post | `NJ Town #N: <Town Name>` |
| Bonus Town Trivia | `NJ Town #N: Bonus Town Trivia` |

The town name comes from the `name` column of the Excel file for the matched row — not from the caption, which often includes subtitles or taglines after the town name. This ensures labels are consistent across platforms (important for grouping in the public map popup).

### 5. Never overwrites existing data

If either the `label` or `url` cell in the target slot already contains a value, the script skips that post and prints a `SKIP` message. The `extra1`, `extra2`, and `extra3` columns are never read or modified.

### 6. Creates a backup before saving

Before writing any changes, the script copies the current Excel file to a date-stamped backup:

```
data/ejc-data-tracker-backup-YYYYMMDD.xlsx
```

If a backup for the current date already exists, it is not overwritten — the original state is preserved.

---

## What the Script Does NOT Do

- Does not overwrite cells that already contain data
- Does not modify `extra*` columns
- Does not populate `facebook*`, `tiktok*`, or any other platform columns — use `facebook-to-excel.py` for Facebook (see [facebook-to-excel.md](facebook-to-excel.md))
- Does not run `excel-to-json.js` — that step remains manual
- Does not fetch live data from Instagram — all input comes from the local PostFox export file

---

## Sample Output

```
Username       : @eatjerseychallenge
Reading        : /path/to/IGPOSTS_USERS_eatjerseychallenge_62.json
Posts in file  : 62
  @eatjerseychallenge posts : 61
  Matched 'NJ Town #N' : 52
  No town pattern (skipped) : 9
Reading        : /path/to/ejc-data-tracker.xlsx
  SKIP (already filled): visit #124 [instagram1] — https://www.instagram.com/p/...
  SKIP (already filled): visit #124 [instagram2] — https://www.instagram.com/p/...
  WARNING: No row found for visit #123 — skipping https://www.instagram.com/p/...
Backup created : /path/to/ejc-data-tracker-backup-20260407.xlsx
Saved          : /path/to/ejc-data-tracker.xlsx

────────────────────────────────────────────
  Written                      : 10
  Skipped (already filled)     : 21
  Skipped (visit # not in Excel) : 21
────────────────────────────────────────────

Review the Excel file, then export to CSV and run:
  node scripts/excel-to-json.js path/to/export.csv
```

---

## After the Script Runs

This script updates the Excel file only. To publish the changes:

1. Open `data/ejc-data-tracker.xlsx` and review the written entries.
2. Export the Data sheet as CSV: **File > Save As > CSV UTF-8 (Comma delimited)**.
3. Run the import script:
   ```bash
   node scripts/excel-to-json.js path/to/export.csv
   ```
   This updates `municipalities.json` with the Instagram links and automatically extracts `thumbnailShortcode` from `instagram1_url`.
4. Commit and push `data/municipalities.json` and `data/IGPOSTS_USERS_*.json` together.

The GitHub Actions workflow will detect the new PostFox export and download any missing thumbnail images automatically (see [Thumbnail Images](#thumbnail-images-automated) below).

---

## Thumbnail Images (Automated)

Committing a new PostFox export file (`data/IGPOSTS_USERS_*.json`) to `main` automatically triggers the **Update Town Data** GitHub Actions workflow, which:

1. Runs `scripts/backfill-shortcodes.js` as a safety net to ensure all entries with an Instagram URL have a `thumbnailShortcode` set. (In the standard workflow this is already handled by `excel-to-json.js`, so backfill typically reports zero changes.)
2. Reads the `thumbnailShortcode` field from every entry in `municipalities.json`.
3. Looks up the matching `Thumbnail URL` in the PostFox export for any shortcode that doesn't yet have an image file.
4. Downloads and resizes the image to a 320px-wide WebP file.
5. Commits any updated `data/municipalities.json` and new `images/thumbnails/*.webp` files with the message `chore: add new town thumbnails [skip ci]`.

The PostFox export used in this workflow doubles as the thumbnail source — no separate export is needed.

> **CDN URL expiry:** Thumbnail URLs in the PostFox export are signed CDN links that expire approximately 3 days after the export was created. Push `data/IGPOSTS_USERS_*.json` within that window for the Action to successfully download thumbnails.

**To fetch thumbnails locally without waiting for the Action** (e.g. to preview them before pushing):

```bash
npm run fetch-thumbnails
```

The fetch script is idempotent — shortcodes that already have a `.webp` file in `images/thumbnails/` are always skipped.

See the [README](README.md#standard-new-town-visit-workflow) for the full end-to-end workflow.

---

## Troubleshooting

### "WARNING: No row found for visit #N"
The `visitNumber` column for that town is blank in the Excel file. The script can only match posts to rows that have a `visitNumber` value. Add the visit number to the Excel file and re-run the script.

### "SKIP (already filled): visit #N [instagram1]"
That slot already has data — either from a previous run of this script, or from manual entry. This is expected behavior; no action needed. If you need to update the entry, edit it manually in the Excel file.

### "Could not auto-detect the Instagram username from the filename"
The JSON filename does not match the expected PostFox pattern (`IGPOSTS_USERS_{username}_{n}.json`). Use the `--username` flag to specify the Instagram handle explicitly.

### No posts matched / written count is 0
- Check that the JSON file is the PostFox export (not a different format).
- Verify that your captions start with "NJ Town #N:" or "New Jersey Town #N:".
- Ensure the `visitNumber` column is populated in the Excel for the towns you expect. Rows without a `visitNumber` are invisible to the script.

### The script wrote to the wrong slot (instagram1 vs instagram2)
The bonus detection looks for "Bonus Town Trivia" anywhere in the first line of the caption. If a caption uses a different phrase, the post will be treated as a main post. Edit the cell manually in Excel to move it to the correct slot.
