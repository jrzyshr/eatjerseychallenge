/**
 * scripts/seed.js
 *
 * One-time script: reads nj_municipalities.geojson and creates one Firestore
 * document per municipality in the `municipalities` collection.
 *
 * Each document:
 *   - ID:       GEOID string (e.g. "3400503370")
 *   - visited:  false
 *   - links:    []   (array of { label: string, url: string })
 *   - name:     municipality name (e.g. "Bass River")
 *   - namelsad: full name with type (e.g. "Bass River township")
 *   - county:   county name (e.g. "Burlington")
 *
 * Usage:
 *   1. npm install firebase-admin
 *   2. Download your Firebase service account key:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *      Save it as scripts/serviceAccountKey.json  (DO NOT commit this file)
 *   3. node scripts/seed.js
 *
 * The script is safe to re-run — it uses set() with { merge: false } so it
 * will overwrite existing docs. If you want to preserve existing data (e.g.
 * visited flags you've already set), use { merge: true } instead.
 */

const admin  = require('firebase-admin');
const fs     = require('fs');
const path   = require('path');

// ── Service account ──────────────────────────────────────────────────────────
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('ERROR: scripts/serviceAccountKey.json not found.');
  console.error('Download it from Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ── Load GeoJSON ─────────────────────────────────────────────────────────────
const geojsonPath = path.join(__dirname, '..', 'data', 'nj_municipalities.geojson');
const geojson     = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  const features = geojson.features;
  const BATCH_SIZE = 500; // Firestore batch limit
  let total = 0;

  for (let i = 0; i < features.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = features.slice(i, i + BATCH_SIZE);

    for (const feature of chunk) {
      const props = feature.properties;
      const ref   = db.collection('municipalities').doc(props.GEOID);
      batch.set(ref, {
        name:     props.name,
        namelsad: props.namelsad,
        county:   props.county,
        visited:  false,
        links:    []
      });
      total++;
    }

    await batch.commit();
    console.log(`Committed batch: ${i + 1}–${Math.min(i + BATCH_SIZE, features.length)}`);
  }

  console.log(`\nDone. Seeded ${total} municipalities.`);
  process.exit(0);
}

seed().catch(function (err) {
  console.error('Seed error:', err);
  process.exit(1);
});
