# Admin Panel

The admin panel (`admin.html`) is the primary tool for manually editing visit data for individual municipalities. Changes are held in memory until you export and commit the updated JSON file.

---

## Opening the Admin Panel

Because the panel uses `fetch()` to load data files, it **cannot be opened directly as a `file://` URL**. It must be served via a local web server or your deployed host.

**Option A — Python quick server (no install needed)**

```bash
cd /path/to/eatjerseychallenge
python3 -m http.server 8080
```

Then open `http://localhost:8080/admin.html` in your browser.

**Option B — VS Code Live Server extension**

Right-click `admin.html` in the VS Code Explorer and choose **Open with Live Server**.

---

## Layout

```
┌────────────────────────────────────────────────────────────────┐
│  EJC Admin                  42 / 564 visited   [↓ Export JSON] │  ← Header
├──────────────┬─────────────────────────────────────────────────┤
│ Search…      │                                                 │
│              │                                                 │
│ Absecon ✓(2) │              Interactive Map                   │
│ Allenhurst   │                                                 │
│ Allentown ⏳ │               (click a polygon                 │
│ ...          │                to open the edit modal)         │
│              │                                                 │
└──────────────┴─────────────────────────────────────────────────┘
```

**Header bar** — Shows the current visited count and the **Export JSON** button.

**Sidebar (left)** — Scrollable, searchable list of all 564 municipalities. Each item shows:
- The full municipality name with type (e.g. "Absecon city")
- A status badge: ✓ (visited), ⏳ (queued), ★ (pre-challenge)
- A link count in parentheses if links exist, e.g. `(2)`

**Map (right)** — Interactive Leaflet map of New Jersey. Municipality polygons are colored:
- **Gold** — any status other than `unvisited`
- **Grey** — `unvisited`
- Hovering brightens the polygon; the selected (open) municipality is highlighted with a blue border.

---

## Editing a Municipality

Click any municipality in the sidebar list **or** click its polygon on the map. The edit modal opens.

### Visit Status

Select one of the four statuses from the dropdown:

| Option | Stored value | Map color |
|--------|-------------|-----------|
| Not Visited | `unvisited` | Grey |
| Visited (Published) | `visited` | Gold |
| Visited — Coming Soon (no posts yet) | `queued` | Gold |
| Pre-Challenge Visit | `pre-challenge` | Gold |

### Visit Details

| Field | Description |
|-------|-------------|
| **Town Visit Number** | The sequential number of this visit on the journey (1–564). |
| **Restaurant Name** | The primary restaurant or business visited. Also used as the default label for the restaurant link. |
| **Date Visited** | Stored in `YYYY-MM-DD` format. Use the date picker or type directly. |

### Links

Each municipality can have an unlimited number of links organized into categories. Links appear in the map popup on the public site.

#### Link categories

| Category | Popup section heading | Notes |
|----------|-----------------------|-------|
| `restaurant` | Restaurant | Link to the restaurant website or page. |
| `wikipedia` | Wikipedia | Link to the municipality's Wikipedia article. |
| `social` | Social Media | Requires a **Platform** name (e.g. `Instagram`, `TikTok`). Links within Social Media are grouped by their label and listed by platform. |
| `more` | Additional Restaurants & Businesses | For secondary restaurants, local businesses, etc. |
| `custom` | *(your custom name)* | Freeform category label. Displayed as-is in the popup. |

#### Adding a link

1. Choose a **Category** from the dropdown.
   - If you choose **Social Media**, an additional **Platform** field appears (e.g. `Instagram`, `TikTok`, `YouTube`).
   - If you choose **Custom…**, a text field appears for the category name.
2. Enter a **Description** — the clickable link text shown in the popup.
3. Enter the **URL** — must start with `http://` or `https://`.
4. Click **+ Add Link**.

The link is added to the list immediately. The URL is validated before adding; an error message appears if it is not a valid URL.

#### Editing a link

Click the pencil (✏) icon on any link row. The Add Link form fills with the existing values, the heading changes to **Edit Link**, and the button changes to **Update Link**. Click **Update Link** to save, or **Cancel Edit** to discard changes.

#### Reordering links

Use the ↑ and ↓ arrow buttons on each link row to move it up or down. Link order within a category is preserved in the popup on the public site.

#### Removing a link

Click the × button on any link row.

---

## Saving Changes

Clicking **Save Changes** commits the edits to the in-memory data object. The map polygon color updates immediately to reflect the new status, and the visited counter in the header updates.

> **Important:** "Save Changes" does **not** write to disk. All changes are held in memory and are lost if you close or refresh the page before exporting.

Clicking **Cancel** (or pressing Escape, or clicking outside the modal) closes the modal without saving.

---

## Exporting the Updated JSON

When you have finished editing, click the **↓ Export JSON** button in the header.

The browser downloads a file named `municipalities.json` containing the full updated dataset (all 564 municipalities, including any you did not edit).

### Deploying the changes

1. Copy the downloaded `municipalities.json` to `data/municipalities.json` in the repository, replacing the existing file.
2. Commit and push:

```bash
git add data/municipalities.json
git commit -m "Update visit data via admin panel"
git push
```

The public map (`index.html`) will reflect the changes as soon as the deployment completes.

---

## Tips and Caveats

- **Work in one session.** There is no autosave. If you need to make many changes, complete them in a single session and export before closing the browser.
- **The admin panel does not sync with Excel.** If you import from a CSV at the same time the admin panel is open, the admin panel does not see the new data. Either export from the admin panel first, or close and reopen `admin.html` after running the import script.
- **Geographic fields are read-only.** The `name`, `namelsad`, `county`, and `townType` fields come from the GeoJSON and are never modified by the admin panel or import scripts.
- **Search is live.** The sidebar search filters by municipality name and county name simultaneously as you type.
