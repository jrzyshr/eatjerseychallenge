// admin.js — Admin panel (static JSON workflow)
// Loads municipalities.json, allows editing visited status and links,
// and exports the updated JSON for committing to the repo.

(function () {
  'use strict';

  // ── DOM refs ──────────────────────────────────────────────────────────────────
  const exportBtn     = document.getElementById('export-btn');
  const modalOverlay  = document.getElementById('edit-modal-overlay');
  const modalTitle    = document.getElementById('modal-title');
  const modalCounty   = document.getElementById('modal-county');
  const visitedChk    = document.getElementById('visited-checkbox');
  const linksList     = document.getElementById('links-list');
  const addLinkBtn    = document.getElementById('add-link-btn');
  const linkLabelIn   = document.getElementById('link-label-input');
  const linkUrlIn     = document.getElementById('link-url-input');
  const addLinkErr    = document.getElementById('add-link-error');
  const saveBtn       = document.getElementById('save-btn');
  const cancelBtn     = document.getElementById('cancel-btn');
  const saveError     = document.getElementById('save-error');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const muniList      = document.getElementById('municipality-list');
  const sidebarSearch = document.getElementById('sidebar-search');
  const adminVisited  = document.getElementById('admin-visited-count');

  // ── State ──────────────────────────────────────────────────────────────────
  let municipalityData = {}; // GEOID → Firestore doc data
  let geoidToLayer     = {}; // GEOID → Leaflet layer
  let geojsonLayer     = null;
  let map       = null;
  let editGeoid = null;
  let editLinks = [];

  // ── Style helpers ──────────────────────────────────────────────────────────
  const STYLE_VISITED   = { fillColor: '#FFD700', fillOpacity: 0.75, color: '#b8860b', weight: 1 };
  const STYLE_UNVISITED = { fillColor: '#aaaaaa', fillOpacity: 0.4,  color: '#666666', weight: 1 };
  const STYLE_HOVER     = { fillOpacity: 0.85, weight: 3 };
  const STYLE_SELECTED  = { fillOpacity: 0.9, weight: 3, color: '#1565c0' };

  function getStyle(geoid) {
    const d = municipalityData[geoid];
    return (d && d.visited) ? STYLE_VISITED : STYLE_UNVISITED;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Map init ───────────────────────────────────────────────────────────────
  map = L.map('map', { center: [40.0, -74.4], zoom: 8, minZoom: 7, maxZoom: 16 });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

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
      style: function (feature) { return getStyle(feature.properties.GEOID); },
      onEachFeature: function (feature, layer) {
        const geoid = feature.properties.GEOID;
        geoidToLayer[geoid] = layer;
        layer.on({
          mouseover: function (e) { e.target.setStyle(STYLE_HOVER); e.target.bringToFront(); },
          mouseout:  function (e) {
            if (editGeoid !== geoid) geojsonLayer.resetStyle(e.target);
          },
          click: function () { openModal(geoid); }
        });
      }
    }).addTo(map);

    map.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
    renderSidebar();
  }).catch(function (err) { console.error('Error loading map data:', err); });

  // ── Counter ────────────────────────────────────────────────────────────────
  function updateCounter() {
    const count = Object.values(municipalityData).filter(function (d) { return d.visited; }).length;
    if (adminVisited) adminVisited.textContent = count;
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────
  function renderSidebar() {
    const query = (sidebarSearch.value || '').toLowerCase();
    const items = Object.entries(municipalityData)
      .filter(function (e) {
        const d = e[1];
        if (!query) return true;
        return (d.name || '').toLowerCase().includes(query) ||
               (d.county || '').toLowerCase().includes(query);
      })
      .sort(function (a, b) {
        return (a[1].name || '').localeCompare(b[1].name || '');
      });

    muniList.innerHTML = items.map(function (e) {
      const geoid = e[0];
      const d     = e[1];
      const badge = d.visited ? ' <span class="sb-badge">✓</span>' : '';
      const links = d.links && d.links.length > 0 ? ' <span class="sb-links">(' + d.links.length + ')</span>' : '';
      return `<li class="sb-item" data-geoid="${escapeHtml(geoid)}">${escapeHtml(d.namelsad || d.name)}${badge}${links}</li>`;
    }).join('');

    muniList.querySelectorAll('.sb-item').forEach(function (li) {
      li.addEventListener('click', function () { openModal(li.dataset.geoid); });
    });
  }

  sidebarSearch.addEventListener('input', renderSidebar);

  // ── Modal open/close ───────────────────────────────────────────────────────
  function openModal(geoid) {
    const data = municipalityData[geoid];
    if (!data) return;

    editGeoid  = geoid;
    editLinks  = (data.links || []).map(function (l) { return Object.assign({}, l); });

    modalTitle.textContent  = data.namelsad || data.name || geoid;
    modalCounty.textContent = (data.county || '') + ' County';
    visitedChk.checked      = !!data.visited;

    renderModalLinks();
    addLinkErr.hidden = true;
    saveError.hidden  = true;
    linkLabelIn.value = '';
    linkUrlIn.value   = '';

    // Highlight selected layer
    if (geoidToLayer[geoid]) {
      geoidToLayer[geoid].setStyle(STYLE_SELECTED);
      geoidToLayer[geoid].bringToFront();
    }

    modalOverlay.hidden = false;
  }

  function closeModal() {
    if (editGeoid && geoidToLayer[editGeoid]) {
      geoidToLayer[editGeoid].setStyle(getStyle(editGeoid));
    }
    editGeoid = null;
    editLinks = [];
    modalOverlay.hidden = true;
  }

  modalCloseBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
  });

  // ── Modal links rendering ─────────────────────────────────────────────────
  function renderModalLinks() {
    if (editLinks.length === 0) {
      linksList.innerHTML = '<li class="no-links-msg">No links added yet.</li>';
      return;
    }
    linksList.innerHTML = editLinks.map(function (link, idx) {
      return `
        <li class="link-item" data-idx="${idx}">
          <div class="link-item-info">
            <span class="link-label">${escapeHtml(link.label)}</span>
            <a class="link-url-preview" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(link.url)}
            </a>
          </div>
          <button class="delete-link-btn" data-idx="${idx}" aria-label="Remove link">&times;</button>
        </li>`;
    }).join('');

    linksList.querySelectorAll('.delete-link-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const idx = parseInt(btn.dataset.idx, 10);
        editLinks.splice(idx, 1);
        renderModalLinks();
      });
    });
  }

  // ── Add link ───────────────────────────────────────────────────────────────
  addLinkBtn.addEventListener('click', function () {
    addLinkErr.hidden = true;
    const label = linkLabelIn.value.trim();
    const url   = linkUrlIn.value.trim();

    if (!label) {
      addLinkErr.textContent = 'Please enter a label.';
      addLinkErr.hidden = false;
      return;
    }
    if (!url || !isValidUrl(url)) {
      addLinkErr.textContent = 'Please enter a valid URL (starting with https://).';
      addLinkErr.hidden = false;
      return;
    }

    editLinks.push({ label: label, url: url });
    linkLabelIn.value = '';
    linkUrlIn.value   = '';
    renderModalLinks();
  });

  function isValidUrl(str) {
    try {
      const u = new URL(str);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch (_) {
      return false;
    }
  }

  // ── Save (in-memory) ───────────────────────────────────────────────────────
  saveBtn.addEventListener('click', function () {
    if (!editGeoid) return;

    municipalityData[editGeoid].visited = visitedChk.checked;
    municipalityData[editGeoid].links   = editLinks.slice();

    const layer = geoidToLayer[editGeoid];
    if (layer) layer.setStyle(getStyle(editGeoid));

    updateCounter();
    renderSidebar();
    closeModal();
  });

  // ── Export JSON ────────────────────────────────────────────────────────────
  exportBtn.addEventListener('click', function () {
    const json = JSON.stringify(municipalityData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'municipalities.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

})();
