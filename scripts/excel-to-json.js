/**
 * scripts/excel-to-json.js
 *
 * Merges data from a CSV (exported from Excel) into data/municipalities.json.
 * Existing municipality records are updated in-place; geographic fields
 * (name, namelsad, county, townType) are never overwritten by this script.
 *
 * Usage:
 *   node scripts/excel-to-json.js path/to/your-data.csv
 *
 * ── CSV Column Reference ──────────────────────────────────────────────────────
 *
 * REQUIRED (one of):
 *   geoid          GEOID key matching municipalities.json (e.g. 3400100100)
 *   name           Municipality name (e.g. "Absecon") — used if geoid is absent.
 *                  If the name matches multiple entries, add a "county" column
 *                  to disambiguate (e.g. "Atlantic").
 *
 * VISIT DATA (all optional):
 *   status         unvisited | visited | queued | pre-challenge
 *   visitNumber    Integer (1–564)
 *   restaurantName Text
 *   dateVisited    YYYY-MM-DD  or  MM/DD/YYYY
 *
 * KNOWN LINK COLUMNS (all optional, leave blank to skip):
 *   restaurant_label   Display text for the restaurant link (defaults to restaurantName)
 *   restaurant_url     URL → { category:"restaurant", label, url }
 *
 *   wikipedia_url      URL → { category:"wikipedia", label:"<name> Wikipedia", url }
 *
 *   instagram1_label, instagram1_url   → { category:"social", platform:"Instagram", label, url }
 *   instagram2_label, instagram2_url
 *   tiktok1_label,    tiktok1_url      → { category:"social", platform:"TikTok",    label, url }
 *   tiktok2_label,    tiktok2_url
 *   youtube1_label,   youtube1_url     → { category:"social", platform:"YouTube",   label, url }
 *   youtube2_label,   youtube2_url
 *   threads1_label,   threads1_url     → { category:"social", platform:"Threads",   label, url }
 *   threads2_label,   threads2_url
 *   bluesky1_label,   bluesky1_url     → { category:"social", platform:"Bluesky",   label, url }
 *   bluesky2_label,   bluesky2_url
 *
 * EXTRA / OVERFLOW LINK SLOTS (3 slots, all optional):
 *   extra1_category, extra1_platform, extra1_label, extra1_url
 *   extra2_category, extra2_platform, extra2_label, extra2_url
 *   extra3_category, extra3_platform, extra3_label, extra3_url
 *
 *   extra*_platform is only used when extra*_category is "social".
 *   Leave extra*_platform blank for non-social categories.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * No npm packages required — uses only Node.js built-ins.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────
const csvPath  = process.argv[2];
const dataFile = path.join(__dirname, '..', 'data', 'municipalities.json');

if (!csvPath) {
  console.error('Usage: node scripts/excel-to-json.js path/to/your-data.csv');
  process.exit(1);
}
if (!fs.existsSync(csvPath)) {
  console.error('ERROR: CSV file not found:', csvPath);
  process.exit(1);
}

// ── Simple CSV parser ─────────────────────────────────────────────────────────
// Handles quoted fields (including commas and newlines inside quotes).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  // Normalise line endings
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < s.length; i++) {
    const ch   = s[i];
    const next = s[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"')           { inQuotes = false; }
      else                           { field += ch; }
    } else {
      if (ch === '"')  { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') {
        row.push(field); field = '';
        rows.push(row);  row = [];
      } else {
        field += ch;
      }
    }
  }
  // Final field/row
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }

  if (rows.length < 2) return [];

  const headers = rows[0].map(function (h) { return h.trim().toLowerCase(); });
  return rows.slice(1).filter(function (r) {
    return r.some(function (c) { return c.trim() !== ''; });
  }).map(function (r) {
    const obj = {};
    headers.forEach(function (h, i) { obj[h] = (r[i] || '').trim(); });
    return obj;
  });
}

// ── Date normalisation → YYYY-MM-DD ───────────────────────────────────────────
function normaliseDate(str) {
  if (!str) return null;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // MM/DD/YYYY
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    return mdy[3] + '-' + mdy[1].padStart(2, '0') + '-' + mdy[2].padStart(2, '0');
  }
  console.warn('  WARNING: unrecognised date format "' + str + '" — stored as-is');
  return str;
}

// ── Build links array from one CSV row ────────────────────────────────────────
const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'threads', 'bluesky'];
const VALID_STATUSES   = ['unvisited', 'visited', 'queued', 'pre-challenge'];

function buildLinks(row, municipalityName, restaurantName) {
  const links = [];

  function push(category, label, url, platform) {
    if (!url) return;
    const entry = { category: category, label: label || url, url: url };
    if (platform) entry.platform = platform;
    links.push(entry);
  }

  // Restaurant
  const restLabel = row['restaurant_label'] || restaurantName || 'Restaurant Website';
  push('restaurant', restLabel, row['restaurant_url']);

  // Wikipedia
  push('wikipedia', (municipalityName || 'Wikipedia'), row['wikipedia_url']);

  // Known social platforms (up to 2 each)
  SOCIAL_PLATFORMS.forEach(function (platform) {
    const displayName = platform.charAt(0).toUpperCase() + platform.slice(1);
    for (let n = 1; n <= 2; n++) {
      const labelKey = platform + n + '_label';
      const urlKey   = platform + n + '_url';
      if (row[urlKey]) {
        push('social', row[labelKey] || displayName, row[urlKey], displayName);
      }
    }
  });

  // Extra slots
  for (let n = 1; n <= 3; n++) {
    const cat      = row['extra' + n + '_category'];
    const platform = row['extra' + n + '_platform'];
    const label    = row['extra' + n + '_label'];
    const url      = row['extra' + n + '_url'];
    if (cat && url) {
      push(cat, label || url, url, cat === 'social' ? (platform || null) : undefined);
    }
  }

  return links;
}

// ── Build name → geoid lookup ─────────────────────────────────────────────────
function buildNameIndex(data) {
  const index = {}; // lowercase name → [geoid, ...]
  for (const [geoid, entry] of Object.entries(data)) {
    const key = (entry.name || '').toLowerCase();
    if (!index[key]) index[key] = [];
    index[key].push(geoid);
  }
  return index;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const raw  = fs.readFileSync(dataFile, 'utf8');
const data = JSON.parse(raw);
const nameIndex = buildNameIndex(data);

const csvText = fs.readFileSync(csvPath, 'utf8');
const rows    = parseCsv(csvText);

let updated = 0;
let skipped = 0;
let warnings = 0;

for (const row of rows) {
  // Resolve GEOID
  let geoid = row['geoid'] ? String(row['geoid']).trim() : null;

  if (!geoid) {
    const nameKey = (row['name'] || '').toLowerCase().trim();
    if (!nameKey) { console.warn('  SKIP: row has no geoid or name'); skipped++; continue; }

    const matches = nameIndex[nameKey] || [];

    if (matches.length === 0) {
      console.warn('  SKIP: no municipality found for name "' + row['name'] + '"');
      skipped++; warnings++; continue;
    }

    if (matches.length > 1) {
      const countyFilter = (row['county'] || '').toLowerCase().trim();
      if (countyFilter) {
        const filtered = matches.filter(function (g) {
          return (data[g].county || '').toLowerCase() === countyFilter;
        });
        if (filtered.length === 1) {
          geoid = filtered[0];
        } else {
          console.warn('  SKIP: "' + row['name'] + '" matches ' + matches.length + ' entries; add a "county" column to disambiguate');
          skipped++; warnings++; continue;
        }
      } else {
        console.warn('  SKIP: "' + row['name'] + '" matches ' + matches.length + ' entries; add a "county" column to disambiguate');
        skipped++; warnings++; continue;
      }
    } else {
      geoid = matches[0];
    }
  }

  if (!data[geoid]) {
    console.warn('  SKIP: GEOID "' + geoid + '" not found in municipalities.json');
    skipped++; warnings++; continue;
  }

  const entry = data[geoid];

  // Status
  if (row['status']) {
    const s = row['status'].trim().toLowerCase();
    if (VALID_STATUSES.includes(s)) {
      entry.status = s;
    } else {
      console.warn('  WARNING: unknown status "' + row['status'] + '" for ' + entry.name + ' — skipped status field');
      warnings++;
    }
  }

  // Visit number
  if (row['visitnumber'] !== undefined && row['visitnumber'] !== '') {
    const n = parseInt(row['visitnumber'], 10);
    entry.visitNumber = isNaN(n) ? null : n;
  }

  // Restaurant name
  if (row['restaurantname'] !== undefined && row['restaurantname'] !== '') {
    entry.restaurantName = row['restaurantname'] || null;
  }

  // Date visited
  if (row['datevisited'] !== undefined && row['datevisited'] !== '') {
    entry.dateVisited = normaliseDate(row['datevisited']);
  }

  // Links — only replace if the CSV row contains any link columns
  const hasLinkData = Object.keys(row).some(function (k) {
    return (k.endsWith('_url') || k.endsWith('_label')) && row[k];
  });
  if (hasLinkData) {
    entry.links = buildLinks(row, entry.name, entry.restaurantName);
  }

  updated++;
}

fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');

console.log('\nImport complete.');
console.log('  Updated  : ' + updated);
console.log('  Skipped  : ' + skipped);
if (warnings > 0) {
  console.log('  Warnings : ' + warnings + ' (see above)');
}
