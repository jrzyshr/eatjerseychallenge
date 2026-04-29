// analytics.js — Google Analytics 4 initialization for Eat Jersey Challenge
//
// Reads the Measurement ID from EJC_CONFIG (js/config.js), which must be
// loaded before this script. Uses dynamic script injection to satisfy the
// Content Security Policy (no inline scripts allowed).
//
// Phase 1: Page view tracking (automatic)
// Phase 2: Town click events  — fire ejcTrack.townClick(geoid, townName, county)
// Phase 3: Link click events  — fire ejcTrack.linkClick(platform, townName, geoid)

(function () {
  const measurementId = (typeof EJC_CONFIG !== 'undefined') && EJC_CONFIG.gaMeasurementId;
  if (!measurementId) return;

  // Set up the dataLayer and gtag stub before the library loads
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId);

  // Dynamically load the GA4 library (satisfies CSP: script comes from allowlisted domain)
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);

  // ── Public event helpers (used by map.js in Phase 2 & 3) ──────────────────

  window.ejcTrack = {

    // Phase 2: fired when a user clicks a town polygon on the map
    townClick: function (geoid, townName, county) {
      gtag('event', 'town_click', {
        town_name: townName,
        geoid: geoid,
        county: county
      });
    },

    // Phase 3: fired when a user clicks a social platform link inside a popup
    socialLinkClick: function (platform, townName, geoid) {
      gtag('event', 'social_link_click', {
        platform: platform,
        town_name: townName,
        geoid: geoid
      });
    },

    // Phase 3: fired when a user clicks a restaurant, wikipedia, or other link
    outboundLinkClick: function (linkType, townName, geoid) {
      gtag('event', 'outbound_link_click', {
        link_type: linkType,
        town_name: townName,
        geoid: geoid
      });
    }
  };
})();
