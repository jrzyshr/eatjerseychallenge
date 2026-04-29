# Analytics — Eat Jersey Challenge

Google Analytics 4 (GA4) is integrated into the public map at `eatjerseychallenge.com`. This document covers what is tracked, how the implementation works, and how to find and interpret the data in GA4.

---

## Files Changed

| File | Change |
|---|---|
| `js/config.js` | Added `gaMeasurementId: 'G-QYS82GHC7L'` to `EJC_CONFIG` |
| `js/analytics.js` | New file — initializes GA4, exposes `window.ejcTrack` event helpers |
| `js/map.js` | Added `ejcTrack` calls in `onEachFeature()` click handler; added `data-link-type` attributes to non-social popup links |
| `index.html` | Added `<script src="js/analytics.js">` after `config.js`; updated Content Security Policy to allow GA4 domains |

---

## What Is Tracked

### Page Views (automatic)
Every time a visitor loads the map, GA4 records a page view automatically. No code beyond loading the library is required for this.

### Town Clicks — `town_click`
Fired when a user clicks any town polygon on the map.

| Parameter | Example value | Description |
|---|---|---|
| `town_name` | `Asbury Park` | Display name of the municipality |
| `geoid` | `3400100550` | Internal municipality ID |
| `county` | `Monmouth` | County the town belongs to |

### Social Link Clicks — `social_link_click`
Fired when a user clicks a social media platform icon inside a town popup (e.g., the Instagram or Facebook icon).

| Parameter | Example value | Description |
|---|---|---|
| `platform` | `instagram` | Social platform (lowercase) |
| `town_name` | `Asbury Park` | Town whose popup was open |
| `geoid` | `3400100550` | Municipality ID |

### Outbound Link Clicks — `outbound_link_click`
Fired when a user clicks a non-social link inside a town popup (restaurant, Wikipedia, or "more" links).

| Parameter | Example value | Description |
|---|---|---|
| `link_type` | `restaurant` | Category: `restaurant`, `wikipedia`, or `more` |
| `town_name` | `Asbury Park` | Town whose popup was open |
| `geoid` | `3400100550` | Municipality ID |

---

## How to Read the Stats in GA4

Go to [analytics.google.com](https://analytics.google.com) and select the **Eat Jersey Challenge** property.

### Overall Traffic — Reports → Acquisition → Overview
- **Users / Sessions / Page Views** — top-line visit numbers
- **First user source / medium** — where visitors are coming from (organic, social, direct, referral)
- **Session source / medium** — same, broken down per session

### Traffic from Social Media Posts
When you share a link on social media, append UTM parameters to track which post drove traffic:

```
https://eatjerseychallenge.com?utm_source=instagram&utm_medium=social&utm_campaign=launch
```

Common `utm_source` values to use: `instagram`, `facebook`, `tiktok`, `threads`, `bluesky`

In GA4, go to **Reports → Acquisition → Traffic Acquisition** and set the primary dimension to **Session source** to see visits per platform side by side.

### Town Click Leaderboard — Reports → Engagement → Events
1. Click **Events** in the left nav
2. Find `town_click` in the table and click it
3. Scroll down to **Event parameters** and select `town_name` from the dropdown
4. You will see a ranked list of every town that has been clicked, with a count

Repeat with the `county` parameter to see which counties attract the most interest.

### Social Platform Click Breakdown
1. Go to **Events**, click `social_link_click`
2. In **Event parameters**, select `platform`
3. See which social platform (Instagram, Facebook, TikTok, etc.) users click most from town popups
4. Switch the parameter to `town_name` to see which towns generate the most social engagement

### Outbound Link Clicks
1. Go to **Events**, click `outbound_link_click`
2. Use `link_type` parameter to compare restaurant vs. Wikipedia vs. other link clicks
3. Use `town_name` to see which towns drive the most restaurant page visits

### Realtime Verification
**Reports → Realtime** shows activity happening on the site right now. Use this to:
- Confirm the tracking is working after a deployment (visit the site, see yourself appear)
- Monitor a spike in traffic immediately after posting on social media

### Custom Exploration (Advanced)
For cross-tab analysis (e.g., "which towns get both a click AND a social link click?"):
1. Go to **Explore** in the left sidebar
2. Create a **Free form** exploration
3. Add dimensions: `event_name`, `town_name`, `platform`
4. Add metrics: `Event count`
5. Drag dimensions to rows/columns to build a pivot table

---

## Changing the Measurement ID

If the GA4 property ever needs to change, update the single value in `js/config.js`:

```js
const EJC_CONFIG = {
  platformOrder: ['facebook', 'instagram', 'tiktok', 'youtube', 'threads', 'bluesky'],
  gaMeasurementId: 'G-XXXXXXXXXX'   // ← replace this
};
```

No other files need to be edited.
