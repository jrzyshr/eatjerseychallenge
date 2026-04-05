// migrate-schema-v2.js
// One-time migration: converts municipalities.json from v1 schema to v2.
//
// Changes:
//   visited: boolean  →  status: "unvisited" | "visited"
//   (new) townType    →  derived from last word of namelsad
//   (new) visitNumber →  null
//   (new) restaurantName → null
//   (new) dateVisited →  null
//   links: []         →  unchanged (already correct structure)
//
// Safe to re-run: already-migrated entries (status field present) are skipped.

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'municipalities.json');

// NJ municipality type suffixes present in namelsad
const KNOWN_TYPES = ['city', 'borough', 'township', 'town', 'village'];

function deriveTownType(namelsad) {
  if (!namelsad) return null;
  const lastWord = namelsad.trim().split(' ').pop().toLowerCase();
  return KNOWN_TYPES.includes(lastWord) ? lastWord : null;
}

function migrateEntry(entry) {
  // Already migrated — leave untouched
  if ('status' in entry) return entry;

  const status = entry.visited ? 'visited' : 'unvisited';

  const migrated = {
    name:           entry.name,
    namelsad:       entry.namelsad,
    county:         entry.county,
    townType:       deriveTownType(entry.namelsad),
    status:         status,
    visitNumber:    null,
    restaurantName: null,
    dateVisited:    null,
    links:          entry.links || []
  };

  return migrated;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const raw  = fs.readFileSync(DATA_FILE, 'utf8');
const data = JSON.parse(raw);

let migrated = 0;
let skipped  = 0;

const updated = {};
for (const [geoid, entry] of Object.entries(data)) {
  if ('status' in entry) {
    updated[geoid] = entry;
    skipped++;
  } else {
    updated[geoid] = migrateEntry(entry);
    migrated++;
  }
}

fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf8');

console.log(`Migration complete.`);
console.log(`  Migrated : ${migrated}`);
console.log(`  Skipped  : ${skipped} (already on v2 schema)`);
console.log(`  Total    : ${migrated + skipped}`);
