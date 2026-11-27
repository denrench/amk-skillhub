/**
 * AMK SkillHub — On-Demand Per-Specialty Topic Games Loader
 * Loads only the active specialty's game chunk (~90-117 KB) instead of the full 702 KB bundle,
 * with automatic fallback/lazy-loading if the user switches specialty.
 */
(function () {
  'use strict';
  const VALID = ['it', 'graphic_design', 'autoelectric', 'hvac', 'automechanic'];
  const params = new URLSearchParams(window.location.search);
  const spec = params.get('specialty') || params.get('course') || 'it';
  const active = VALID.indexOf(spec) >= 0 ? spec : 'it';

  function loadSyncOrScript(src) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', src, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        (0, eval)(xhr.responseText);
        return true;
      }
    } catch (e) {}
    return false;
  }

  window.EDU_TOPIC_GAMES = window.EDU_TOPIC_GAMES || {};
  if (!window.EDU_TOPIC_GAMES[active]) {
    if (!loadSyncOrScript('js/data/games_' + active + '.js')) {
      loadSyncOrScript('js/topic-games-60.js');
    }
  }

  window.AMKLoadSpecialtyGames = function (slug) {
    const s = VALID.indexOf(slug) >= 0 ? slug : 'it';
    if (!window.EDU_TOPIC_GAMES[s]) {
      loadSyncOrScript('js/data/games_' + s + '.js');
    }
    return window.EDU_TOPIC_GAMES[s] || {};
  };
})();
