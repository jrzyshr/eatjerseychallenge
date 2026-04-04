/**
 * scripts/seed.js
 *
 * One-time script: reads nj_municipalities.geojson and generates
 * data/municipalities.json — the static data file used by the map.
 *
 * Each entry keyed by GEOID:
 *   - name:     municipality name (e.g. "Bass River")
 *   - namelsad: full name with type (e.g. "Bass River township")
 *   - county:   county name (e.g. "Burlington")
 *   - visited:  false
 *   - links:    []
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Re-running this resets all visited flags and links back to defaults.
 * To preserve existing data, edit municipalities.json directly and push to GitHub.
 *
 * No npm packages required — uses only Node.js built-ins.
 */

const fs   = require('fs');
const path = require('path');

const geojsonPath = path.join(__dirname, '..', 'data', 'nj_municipalities.geojson');
const outputPath  = path.join(__dirname, '..', 'data', 'municipalities.json');

if (!fs.existsSync(geojsonPath)) {
  console.error('ERROR: data/nj_municipalities.geojson not found.');
  process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

const municipalities = {};
for (const feature of geojson.features) {
  const props = feature.properties;
  municipalities[props.GEOID] = {
    name:     props.name,
    namelsad: props.namelsad,
    county:   props.county,
    visited:  false,
    links:    []
  };
}

fs.writeFileSync(outputPath, JSON.stringify(municipalities, null, 2), 'utf8');
console.log('Done. Generated data/municipalities.json with ' + Object.keys(municipalities).length + ' entries.');

