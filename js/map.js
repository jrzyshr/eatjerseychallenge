// map.js — Public map view
// Loads NJ municipality polygons and visited/links data from the static
// municipalities.json file, then renders an interactive Leaflet map.

(function () {
  'use strict';

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
  let municipalityData = {}; // GEOID → { name, county, status, visitNumber, restaurantName, dateVisited, links }
  let geoidToLayer     = {}; // GEOID → Leaflet layer
  let geojsonLayer     = null;

  // ── Style helpers ──────────────────────────────────────────────────────────
  const STYLE_VISITED = {
    fillColor: '#FFD700',
    fillOpacity: 0.75,
    color: '#b8860b',
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

  function isVisited(data) {
    return data && data.status && data.status !== 'unvisited';
  }

  function getStyle(geoid) {
    return isVisited(municipalityData[geoid]) ? STYLE_VISITED : STYLE_UNVISITED;
  }

  // ── Link category display config ───────────────────────────────────────────
  const CATEGORY_LABELS = {
    restaurant: 'Restaurant',
    wikipedia:  'Wikipedia',
    social:     'Social Media',
    more:       'Additional Restaurants & Businesses'
  };
  const CATEGORY_ORDER = ['restaurant', 'wikipedia', 'social', 'more'];

  function categoryLabel(cat) {
    return CATEGORY_LABELS[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
  }

  // ── Date formatting ────────────────────────────────────────────────────────
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || !parts[0]) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ── Popup builder ──────────────────────────────────────────────────────────
  function buildPopupContent(geoid, geoProps) {
    const data   = municipalityData[geoid] || {};
    const name   = data.name || geoProps.namelsad || geoProps.name;
    const type   = data.townType || '';
    const capType = type ? (type.charAt(0).toUpperCase() + type.slice(1)) : '';
    const displayName = (name && capType && !name.toLowerCase().endsWith(' ' + type.toLowerCase()))
      ? name + ' ' + capType
      : (name || '');
    const county = data.county || geoProps.county || '';
    const links  = data.links || [];
    const status = data.status || 'unvisited';

    // Status badge
    var statusBadge = '';
    if (status === 'visited') {
      statusBadge = '<span class="popup-badge visited-badge">&#10003; Visited</span>';
    } else if (status === 'queued') {
      statusBadge = '<span class="popup-badge queued-badge">&#8987; Coming Soon</span>';
    } else if (status === 'pre-challenge') {
      statusBadge = '<span class="popup-badge pre-challenge-badge">&#9733; Pre-Challenge Visit</span>';
    }

    // Visit info block
    var visitInfoHtml = '';
    if (status !== 'unvisited') {
      var lines = '';
      if (data.visitNumber) {
        lines += '<div class="popup-visit-number">Town #' + escapeHtml(String(data.visitNumber)) + ' visited</div>';
      }
      if (data.restaurantName) {
        lines += '<div class="popup-restaurant">' + escapeHtml(data.restaurantName) + '</div>';
      }
      if (data.dateVisited) {
        lines += '<div class="popup-date">' + escapeHtml(formatDate(data.dateVisited)) + '</div>';
      }
      if (lines) {
        visitInfoHtml = '<div class="popup-visit-info">' + lines + '</div>';
      }
    }

    // Links — group by category, then by platform within social
    var linksHtml = '';
    if (links.length > 0) {
      var groups = {};
      var groupOrder = [];
      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var cat = link.category || 'other';
        if (!groups[cat]) { groups[cat] = []; groupOrder.push(cat); }
        groups[cat].push(link);
      }

      groupOrder.sort(function (a, b) {
        var ai = CATEGORY_ORDER.indexOf(a);
        var bi = CATEGORY_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

      var sectionsHtml = '';
      for (var g = 0; g < groupOrder.length; g++) {
        var cat = groupOrder[g];
        var catLinks = groups[cat];
        var sectionContent = '';

        if (cat === 'social') {
          // Sub-group by content title (label), then list platforms as links
          var contentGroups = {};
          var contentOrder = [];
          for (var p = 0; p < catLinks.length; p++) {
            var lbl = catLinks[p].label || 'Untitled';
            if (!contentGroups[lbl]) { contentGroups[lbl] = []; contentOrder.push(lbl); }
            contentGroups[lbl].push(catLinks[p]);
          }
          for (var k = 0; k < contentOrder.length; k++) {
            var contentLabel = contentOrder[k];
            sectionContent += '<div class="popup-content-heading">' + escapeHtml(contentLabel) + '</div>';
            sectionContent += '<ul class="popup-links">' +
              contentGroups[contentLabel].map(function (l) {
                return '<li><a href="' + escapeHtml(l.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(l.platform || 'Link') + '</a></li>';
              }).join('') + '</ul>';
          }
        } else {
          sectionContent = '<ul class="popup-links">' +
            catLinks.map(function (l) {
              return '<li><a href="' + escapeHtml(l.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(l.label) + '</a></li>';
            }).join('') + '</ul>';
        }

        sectionsHtml += '<div class="popup-link-section">' +
          '<div class="popup-section-heading">' + escapeHtml(categoryLabel(cat)) + '</div>' +
          sectionContent + '</div>';
      }

      linksHtml = '<div class="popup-links-container">' + sectionsHtml + '</div>';
    }

    return '<div class="popup-content">' +
      '<h3 class="popup-title">' + escapeHtml(displayName) + '</h3>' +
      '<p class="popup-county">' + escapeHtml(county) + ' County</p>' +
      statusBadge +
      visitInfoHtml +
      linksHtml +
      '</div>';
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
        L.popup({ maxWidth: 340, className: 'ejc-popup' })
          .setLatLng(e.latlng)
          .setContent(content)
          .openOn(map);
      }
    });
  }

  // ── Update counter ─────────────────────────────────────────────────────────
  function updateCounter() {
    const count = Object.values(municipalityData).filter(function (d) { return isVisited(d); }).length;
    const el = document.getElementById('visited-count');
    if (el) el.textContent = count;
  }

  // ── Load data ──────────────────────────────────────────────────────────────
  Promise.all([
    fetch('data/municipalities.json').then(function (r) {
      if (!r.ok) throw new Error('municipalities.json failed to load');
      return r.json();
    }),
    fetch('data/nj_municipalities.geojson').then(function (r) {
      if (!r.ok) throw new Error('nj_municipalities.geojson failed to load');
      return r.json();
    })
  ]).then(function (results) {
    municipalityData = results[0];
    var geojsonData  = results[1];

    updateCounter();

    geojsonLayer = L.geoJson(geojsonData, {
      style:         function (feature) { return getStyle(feature.properties.GEOID); },
      onEachFeature: onEachFeature
    }).addTo(map);

    map.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
  }).catch(function (err) {
    console.error('Error loading map data:', err);
  });

})();
