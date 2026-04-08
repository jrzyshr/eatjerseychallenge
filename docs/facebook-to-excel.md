# Facebook → Excel Workflow

This guide covers how to bulk-import Facebook Page post URLs into `data/ejc-data-tracker.xlsx` using the Facebook Graph API and the `scripts/facebook-to-excel.py` script.

---

## Overview

```
Facebook Graph API
        │
        │  GET /{page-id}/posts?fields=message,permalink_url
        ▼
scripts/facebook-to-excel.py
        │
        │  FB_PAGE_TOKEN=your_token .venv/bin/python scripts/facebook-to-excel.py
        ▼
data/ejc-data-tracker.xlsx    ← facebook1_* and facebook2_* columns updated
        │
        │  Continue with the standard Excel → CSV → JSON workflow
        ▼
data/municipalities.json
```

Use this workflow to populate the `facebook1_label`, `facebook1_url`, `facebook2_label`, and `facebook2_url` columns for visited towns. The script fetches posts directly from the API, matches them to towns by visit number, and writes only into empty cells — it never overwrites existing data.

---

## Prerequisites

- A **Facebook Page Access Token** with `pages_read_engagement` and `pages_show_list` permissions (see [Step 1](#step-1--get-a-page-access-token) below)
- Python with `openpyxl` and `requests` installed in the project's `.venv`
  ```bash
  .venv/bin/pip install openpyxl requests
  ```
- `data/ejc-data-tracker.xlsx` with `visitNumber` populated for the towns you want to match

> **Important:** The script matches posts to rows by `visitNumber`. If a town's `visitNumber` cell is blank in the spreadsheet, that town's posts will be skipped with a warning. Populate `visitNumber` values first (via the Admin panel or directly in the Excel), then run the import.

---

## Step 1 — Get a Page Access Token

You'll need a **Page Access Token** (not a User Token) for the eatjerseychallenge Facebook Page. Tokens expire after ~60 days; regenerate when needed — the process takes about 2 minutes.

1. Go to [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer).
2. If you haven't already, create a **Meta App** (name it anything; it's never published):
   - Click **My Apps** → **Create App** → choose **Other** → **Consumer** → give it a name.
3. In the Graph API Explorer, select your app from the **Meta App** dropdown.
4. Click **Generate Access Token** and grant these permissions when prompted:
   - `pages_read_engagement`
   - `pages_show_list`
5. In the Explorer query field, call `GET /me/accounts` and click **Submit**.
   - Find the entry for **eatjerseychallenge** in the response.
   - Copy its `access_token` value — this is your **Page Access Token**.
6. *(Optional)* Exchange for a long-lived 60-day token via [developers.facebook.com/tools/debug/accesstoken](https://developers.facebook.com/tools/debug/accesstoken) → **Extend Access Token**.

> **Security:** Treat the token like a password. Use the `FB_PAGE_TOKEN` environment variable rather than passing it as a CLI argument — this keeps it out of your shell history and process listings.

---

## Step 2 — Run the Script

```bash
# Recommended — token via environment variable:
FB_PAGE_TOKEN=your_page_token .venv/bin/python scripts/facebook-to-excel.py

# Or pass the token as an argument:
.venv/bin/python scripts/facebook-to-excel.py --token YOUR_PAGE_TOKEN

# If auto-detection fails (your account manages multiple pages), specify the page ID:
.venv/bin/python scripts/facebook-to-excel.py --token YOUR_TOKEN --page-id PAGE_ID

# To use a different Excel file than the default (data/ejc-data-tracker.xlsx):
.venv/bin/python scripts/facebook-to-excel.py --excel path/to/other.xlsx
```

The script auto-detects the page ID by calling `/me/accounts`. If your token has access to more than one page, it will print all available page IDs and ask you to specify one with `--page-id`.

---

## CLI Reference

```
usage: facebook-to-excel.py [-h] [--token ACCESS_TOKEN] [--page-id PAGE_ID] [--excel PATH]

options:
  --token ACCESS_TOKEN  Facebook Page Access Token.
                        Can also be set via the FB_PAGE_TOKEN environment variable
                        (env var takes precedence).
  --page-id PAGE_ID     Facebook Page ID (numeric).
                        Auto-detected from the token via /me/accounts if not provided.
  --excel PATH          Path to the Excel tracker file.
                        Default: data/ejc-data-tracker.xlsx
```

---

## What the Script Does

### 1. Fetches all posts from the Graph API

The script calls `GET /{page-id}/posts?fields=message,permalink_url&limit=100` and follows pagination cursors until all posts are retrieved. The `permalink_url` field provides the permanent Facebook post URL; the `message` field provides the full post caption text.

### 2. Matches posts to towns

For each post, the script looks at the first non-empty line of the message and applies this pattern:

```
NJ Town #N: ...
NJ Town N: ...
New Jersey Town #N: ...
New Jersey Town N: ...
```

The visit number `N` is extracted and used to look up the corresponding row in the `visitNumber` column of the Excel file. Posts that do not match this pattern (event posts, general updates, etc.) are silently skipped.

### 3. Assigns to the correct slot

| First message line contains | Slot written |
|----------------------------|-------------|
| "Bonus Town Trivia" | `facebook2_label` / `facebook2_url` |
| Anything else | `facebook1_label` / `facebook1_url` |

### 4. Builds normalized labels

Labels are always written in a consistent format regardless of how the caption is phrased:

| Post type | Label written |
|-----------|--------------|
| Main town post | `NJ Town #N: <Town Name>` |
| Bonus Town Trivia | `NJ Town #N: Bonus Town Trivia` |

The town name comes from the `name` column of the Excel file for the matched row — not from the post caption. This ensures labels are identical across platforms (important for grouping in the public map popup — a single character difference creates a separate heading).

### 5. Never overwrites existing data

If either the `label` or `url` cell in the target slot already contains a value, the script skips that post and prints a `SKIP` message. No other columns are read or modified.

### 6. Creates a backup before saving

Before writing any changes, the script copies the current Excel file to a date-stamped backup:

```
data/ejc-data-tracker-backup-YYYYMMDD.xlsx
```

If a backup for the current date already exists, it is not overwritten — the original state is preserved.

---

## What the Script Does NOT Do

- Does not overwrite cells that already contain data
- Does not populate `instagram*`, `tiktok*`, or any other platform columns — use `instagram-to-excel.py` for Instagram (see [instagram-to-excel.md](instagram-to-excel.md))
- Does not modify `extra*` columns
- Does not run `excel-to-json.js` — that step remains manual
- Does not store or cache your access token

---

## Sample Output

```
Detecting page : calling /me/accounts …
Page detected  : Eat Jersey Challenge (ID: 123456789012345)
Fetching posts : GET /123456789012345/posts …
Posts fetched  : 128
  Matched 'NJ Town #N' : 112
  No town pattern (skipped) : 16
Reading        : /path/to/ejc-data-tracker.xlsx
Backup created : /path/to/ejc-data-tracker-backup-20260407.xlsx
  SKIP (already filled): visit #12 [facebook1] — https://www.facebook.com/...
  WARNING: No row found for visit #99 — skipping https://www.facebook.com/...

Saved          : /path/to/ejc-data-tracker.xlsx
Written        : 88 post(s)
Already filled : 23 slot(s) skipped
Not in Excel   : 1 visit number(s) not found
```

---

## After the Script Runs

Continue with the standard [Excel → JSON workflow](excel-to-json.md):

1. Open `data/ejc-data-tracker.xlsx` and review the written entries.
2. Export the Data sheet as CSV: **File > Save As > CSV UTF-8 (Comma delimited)**.
3. Run the import script:
   ```bash
   node scripts/excel-to-json.js path/to/export.csv
   ```
4. Commit and push `data/municipalities.json`.

---

## Troubleshooting

### "ERROR: No access token provided"
Set the `FB_PAGE_TOKEN` environment variable or pass `--token YOUR_TOKEN`. See [Step 1](#step-1--get-a-page-access-token) for how to generate a token.

### "ERROR: Graph API returned HTTP 190" (or similar 4xx)
Your token has expired or is invalid. Regenerate it at [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer). Tokens last approximately 60 days.

### "ERROR: No Facebook Pages found for this token"
You may have generated a User Token instead of a Page Access Token. In the Graph API Explorer, call `GET /me/accounts` and copy the `access_token` from the eatjerseychallenge entry in the response — that is the Page Access Token.

### "ERROR: Token has access to N pages. Use --page-id to specify which one"
Your account manages multiple Facebook Pages. The script lists all page IDs in the error message — copy the correct one and add `--page-id PAGE_ID` to your command.

### "WARNING: No row found for visit #N"
The `visitNumber` column for that town is blank in the Excel file. Add the visit number to the Excel file and re-run the script.

### "SKIP (already filled): visit #N [facebook1]"
That slot already has data from a previous run or manual entry. This is expected behavior; no action needed. To update the entry, edit it manually in the Excel file.
