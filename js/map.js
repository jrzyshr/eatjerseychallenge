// map.js — Public map view
// Loads NJ municipality polygons, reads visited state + links from Firestore,
// and renders an interactive map with real-time updates.

(function () {
  'use strict';

  // ── Firebase init ──────────────────────────────────────────────────────────
  firebase.initializeApp(FIREBASE_CONFIG);
  const db = firebase.firestore();

  // ── Leaflet map init ───────────────────────────────────────────────────────
  const map = L.map('map', {
    center: [40.0, -74.4],
    zoom: 8,
    minZoom: 7,
    maxZoom: 16
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // ── State ──────────────────────────────────────────────────────────────────
  // Maps GEOID → Firestore document data { visited, links, name, county }
  let municipalityData = {};
  // Maps GEOID → Leaflet layer (set after GeoJSON loads)
  let geoidToLayer = {};
  let geojsonLayer = null;

  // ── Style helpers ──────────────────────────────────────────────────────────
  const STYLE_VISITED = {
    fillColor: '#4CAF50',
    fillOpacity: 0.65,
    color: '#2e7d32',
    weight: 1
  };
  const STYLE_UNVISITED = {
    fillColor: '#aaaaaa',
    fillOpacity: 0.4,
    color: '#666666',
    weight: 1
  };
  const STYLE_HOVER = {
    fillOpacity: 0.85,
    weight: 3
  };

  function getStyle(geoid) {
    const data = municipalityData[geoid];
    return (data && data.visited) ? STYLE_VISITED : STYLE_UNVISITED;
  }

  // ── Popup builder ──────────────────────────────────────────────────────────
  function buildPopupContent(geoid, geoProps) {
    const data = municipalityData[geoid] || {};
    const name = data.name || geoProps.namelsad || geoProps.name;
    const county = data.county || geoProps.county || '';
    const links = data.links || [];
    const visitedBadge = data.visited
      ? '<span class="popup-badge visited-badge">✓ Visited</span>'
      : '';

    let linksHtml = '';
    if (links.length > 0) {
      linksHtml = '<ul class="popup-links">' +
        links.map(l =>
          `<li><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)}</a></li>`
        ).join('') +
        '</ul>';
    } else {
      linksHtml = '<p class="popup-no-links">No links yet.</p>';
    }

    return `
      <div class="popup-content">
        <h3 class="popup-title">${escapeHtml(name)}</h3>
        <p class="popup-county">${escapeHtml(county)} County</p>
        ${visitedBadge}
        ${linksHtml}
      </div>`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Per-feature event handlers ─────────────────────────────────────────────
  function onEachFeature(feature, layer) {
    const geoid = feature.properties.GEOID;
    geoidToLayer[geoid] = layer;

    layer.on({
      mouseover: function (e) {
        e.target.setStyle(STYLE_HOVER);
        e.target.bringToFront();
      },
      mouseout: function (e) {
        geojsonLayer.resetStyle(e.target);
      },
      click: function (e) {
        const content = buildPopupContent(geoid, feature.properties);
        L.popup({ maxWidth: 320, className: 'ejc-popup' })
          .setLatLng(e.latlng)
          .setContent(content)
          .openOn(map);
      }
    });
  }

  // ── Update counter ────────────────────────────────────────────────────────
  function updateCounter() {
    const visitedCount = Object.values(municipalityData).filter(d => d.visited).length;
    const el = document.getElementById('visited-count');
    if (el) el.textContent = visitedCount;
  }

  // ── Apply Firestore data to a single layer ─────────────────────────────────
  function refreshLayer(geoid) {
    const layer = geoidToLayer[geoid];
    if (!layer) return;
    layer.setStyle(getStyle(geoid));
  }

  // ── Load GeoJSON, then attach Firestore real-time listener ────────────────
  fetch('data/nj_municipalities.geojson')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load GeoJSON: ' + res.status);
      return res.json();
    })
    .then(function (geojsonData) {
      geojsonLayer = L.geoJson(geojsonData, {
        style: function (feature) {
          return getStyle(feature.properties.GEOID);
        },
        onEachFeature: onEachFeature
      }).addTo(map);

      // Fit map to NJ bounds
      map.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });

      // ── Firestore real-time listener ─────────────────────────────────────
      db.collection('municipalities').onSnapshot(function (snapshot) {
        snapshot.docChanges().forEach(function (change) {
          const data = change.doc.data();
          const geoid = change.doc.id;

          if (change.type === 'removed') {
            delete municipalityData[geoid];
          } else {
            municipalityData[geoid] = data;
          }
          refreshLayer(geoid);
        });
        updateCounter();
      }, function (err) {
        console.error('Firestore listener error:', err);
      });
    })
    .catch(function (err) {
      console.error('Error loading map data:', err);
    });

})();
