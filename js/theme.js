/* AMK SkillHub · Theme switcher: light (#F2EFE9) / graphite (#25262B) / neon.
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
    var btns = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-theme-set') === id));
    }
    try { document.dispatchEvent(new CustomEvent('amk:theme', { detail: { theme: id } })); } catch (e) { /* old browsers */ }
  }

  apply(read(), false);

  function buildSwitcher() {
    if (document.querySelector('.theme-switch')) return;
    var host = document.querySelector('.topbar .container') || document.querySelector('header');
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
