/* AMK SkillHub · Theme switcher: light (#F2EFE9) / graphite (#25262B) / neon (#0B0C10).
 * Подключается в <head> без defer — тема применяется до отрисовки (без вспышки). */
(function () {
  'use strict';
  var KEY = 'amk.theme';
  var THEMES = [
    { id: 'light', label: 'Светлая', hint: 'Светлый режим для чтения документации' },
    { id: 'graphite', label: 'Графит', hint: 'Строгий графитовый режим' },
    { id: 'neon', label: 'Неон', hint: 'Контрастный режим с неоновыми акцентами' },
  ];
  var META = { light: '#F2EFE9', graphite: '#25262B', neon: '#0b0c10' };

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return META[v] ? v : 'light';
    } catch (e) {
      return 'light';
    }
  }

  function apply(id, persist) {
    if (!META[id]) id = 'light';
    document.documentElement.setAttribute('data-theme', id);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', META[id]);
    if (persist) {
      try { localStorage.setItem(KEY, id); } catch (e) { /* private mode */ }
    }
    var btns = document.querySelectorAll('[data-theme-set], [data-theme-value], .theme-switch button[data-theme]');
    for (var i = 0; i < btns.length; i++) {
      var bTheme = btns[i].getAttribute('data-theme-set') || btns[i].getAttribute('data-theme-value') || btns[i].getAttribute('data-theme');
      var active = bTheme === id;
      btns[i].setAttribute('aria-pressed', String(active));
      btns[i].classList.toggle('is-active', active);
    }
    try { document.dispatchEvent(new CustomEvent('amk:theme', { detail: { theme: id } })); } catch (e) { /* old browsers */ }
  }

  apply(read(), false);

  function findHeaderHost() {
    var slot = document.getElementById('theme-switch-slot');
    if (slot) return slot;
    var topbarContainer = document.querySelector('.topbar .container');
    if (topbarContainer) return topbarContainer;
    var header = document.querySelector('header');
    if (!header) return null;
    var innerRow = header.querySelector('.max-w-7xl, .header-actions');
    if (innerRow) return innerRow;
    return header;
  }

  function buildSwitcher() {
    var existing = document.querySelector('.theme-switch');
    if (existing) {
      var exBtns = existing.querySelectorAll('button');
      for (var j = 0; j < exBtns.length; j++) {
        var tid = exBtns[j].getAttribute('data-theme-set') || exBtns[j].getAttribute('data-theme-value') || exBtns[j].getAttribute('data-theme');
        if (tid) {
          exBtns[j].setAttribute('data-theme-set', tid);
          exBtns[j].setAttribute('data-theme-value', tid);
          exBtns[j].setAttribute('data-theme', tid);
        }
      }
      apply(read(), false);
      return;
    }
    var host = findHeaderHost();
    if (!host) return;
    var wrap = document.createElement('div');
    wrap.className = 'theme-switch';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Визуальный режим');
    var cur = read();
    THEMES.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'theme-dot theme-dot--' + t.id;
      b.setAttribute('data-theme-set', t.id);
      b.setAttribute('data-theme-value', t.id);
      b.setAttribute('data-theme', t.id);
      b.setAttribute('aria-pressed', String(t.id === cur));
      b.setAttribute('title', t.hint);
      b.setAttribute('aria-label', t.label);
      b.innerHTML = '<span class="theme-dot-swatch" aria-hidden="true"></span><span class="theme-dot-label">' + t.label + '</span>';
      b.addEventListener('click', function () { apply(t.id, true); });
      wrap.appendChild(b);
    });
    host.appendChild(wrap);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildSwitcher);
  else buildSwitcher();

  window.AMKTheme = { set: function (id) { apply(id, true); }, get: read, list: THEMES };
})();

