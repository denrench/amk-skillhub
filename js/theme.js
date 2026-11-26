/* AMK SkillHub · Master Theme, 3D Tilt Spotlight & Tactile Sound FX Engine
 * Themes: neon (Cyber High-Tech Default) / graphite (Pro Studio Dark) / light (Crisp Daylight)
 * Подключается в <head> без defer — тема применяется мгновенно до отрисовки (без вспышки). */
(function () {
  'use strict';
  var KEY = 'amk.theme.v2';
  var SOUND_KEY = 'amk.sfx.enabled';
  var THEMES = [
    { id: 'neon', label: 'Неон', hint: 'Высококонтрастный кибер-режим с неоновыми акцентами' },
    { id: 'graphite', label: 'Графит', hint: 'Строгий тёмный студийный режим' },
    { id: 'light', label: 'Светлая', hint: 'Светлый режим для чтения документации' },
  ];
  var META = { light: '#F2EFE9', graphite: '#1C1E26', neon: '#070B14' };

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (META[v]) return v;
      // Check legacy key only if user explicitly picked one of dark themes
      var old = localStorage.getItem('amk.theme');
      if (old === 'graphite' || old === 'neon') return old;
      return 'neon';
    } catch (e) {
      return 'neon';
    }
  }

  function isSoundEnabled() {
    try {
      var v = localStorage.getItem(SOUND_KEY);
      return v === null ? true : v === '1';
    } catch (e) {
      return true;
    }
  }

  var _audioCtx = null;
  function playUiSfx(kind) {
    if (!isSoundEnabled()) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!_audioCtx) _audioCtx = new AC();
      if (_audioCtx.state === 'suspended') _audioCtx.resume();
      var now = _audioCtx.currentTime;
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      if (kind === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18);
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.34);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (kind === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.19);
      } else if (kind === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(860, now + 0.06);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.1);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.045);
        gain.gain.setValueAtTime(0.022, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.065);
      }
    } catch (e) {}
  }

  function apply(id, persist) {
    if (!META[id]) id = 'neon';
    document.documentElement.setAttribute('data-theme', id);
    document.documentElement.classList.toggle('dark', id !== 'light');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', META[id]);
    if (persist) {
      try {
        localStorage.setItem(KEY, id);
        localStorage.setItem('amk.theme', id);
      } catch (e) {}
    }
    var btns = document.querySelectorAll('[data-theme-set], [data-theme-value], .theme-switch button[data-theme]');
    for (var i = 0; i < btns.length; i++) {
      var bTheme = btns[i].getAttribute('data-theme-set') || btns[i].getAttribute('data-theme-value') || btns[i].getAttribute('data-theme');
      var active = bTheme === id;
      btns[i].setAttribute('aria-pressed', String(active));
      btns[i].classList.toggle('is-active', active);
    }
    try { document.dispatchEvent(new CustomEvent('amk:theme', { detail: { theme: id } })); } catch (e) {}
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
      var exBtns = existing.querySelectorAll('button[data-theme], button[data-theme-set]');
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
      b.addEventListener('click', function () {
        playUiSfx('step');
        apply(t.id, true);
      });
      wrap.appendChild(b);
    });

    var sfxBtn = document.createElement('button');
    sfxBtn.type = 'button';
    sfxBtn.className = 'theme-sfx-btn';
    sfxBtn.setAttribute('title', 'Звуковые эффекты интерфейса');
    sfxBtn.setAttribute('aria-label', 'Звук интерфейса');
    function syncSfxIcon() {
      var on = isSoundEnabled();
      sfxBtn.textContent = on ? '🔊' : '🔇';
      sfxBtn.setAttribute('aria-pressed', String(on));
    }
    syncSfxIcon();
    sfxBtn.addEventListener('click', function () {
      var next = !isSoundEnabled();
      try { localStorage.setItem(SOUND_KEY, next ? '1' : '0'); } catch (e) {}
      syncSfxIcon();
      if (next) playUiSfx('step');
    });
    wrap.appendChild(sfxBtn);

    host.appendChild(wrap);
    buildMobileNavToggle(host);
  }

  function buildMobileNavToggle(host) {
    if (!host || document.getElementById('amk-mobile-menu-btn') || document.getElementById('mobile-nav-drawer')) return;
    var header = document.querySelector('header, .topbar');
    if (!header) return;
    var nav = header.querySelector('nav');
    if (!nav || header.classList.contains('top-header') || header.classList.contains('lp-top-header')) return;
    var links = nav.querySelectorAll('a');
    if (!links || links.length < 2) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'amk-mobile-menu-btn';
    btn.className = 'amk-mobile-burger-btn';
    btn.setAttribute('aria-label', 'Меню навигации');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '☰';

    var sheet = document.createElement('div');
    sheet.id = 'amk-mobile-nav-sheet';
    sheet.className = 'amk-mobile-nav-sheet';
    sheet.setAttribute('hidden', 'true');
    for (var i = 0; i < links.length; i++) {
      var a = document.createElement('a');
      a.href = links[i].getAttribute('href') || '#';
      a.textContent = (links[i].textContent || '').trim();
      sheet.appendChild(a);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = sheet.hasAttribute('hidden');
      if (open) {
        sheet.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = '✕';
      } else {
        sheet.setAttribute('hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
      }
    });

    document.addEventListener('click', function (e) {
      if (!sheet.hasAttribute('hidden') && !sheet.contains(e.target) && e.target !== btn) {
        sheet.setAttribute('hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
      }
    });

    host.appendChild(btn);
    document.body.appendChild(sheet);
    initSplashIntro();
  }

  function initSplashIntro() {
    try {
      if (window.navigator && window.navigator.webdriver) return;
      var p = (window.location.pathname || '').toLowerCase();
      if (p !== '/' && !p.endsWith('/index.html')) return;
      if (sessionStorage.getItem('amk.nyvor.splash.v1')) return;
      sessionStorage.setItem('amk.nyvor.splash.v1', '1');
      var overlay = document.createElement('div');
      overlay.id = 'amk-nyvor-splash';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 50% 35%,#0f172a,#050814 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#f8fafc;font-family:Inter,system-ui,sans-serif;transition:opacity 320ms ease;';
      overlay.innerHTML = '<img src="assets/nyvor-monogram.svg" alt="NyVor" width="64" height="64" style="border-radius:16px;box-shadow:0 0 32px rgba(56,189,248,0.4);"/>'
        + '<div style="font-size:22px;font-weight:900;letter-spacing:0.06em;">AMK SkillHub <span style="color:#38bdf8;">× NyVor</span></div>'
        + '<div style="font-size:12px;color:#94a3b8;letter-spacing:0.14em;text-transform:uppercase;">Будущее начинается с навыков · THE FUTURE BEGINS WITH SKILLS</div>'
        + '<button type="button" id="amk-splash-skip" style="margin-top:8px;padding:6px 16px;border-radius:999px;border:1px solid rgba(56,189,248,0.4);background:rgba(15,23,42,0.8);color:#bae6fd;font-size:11px;font-weight:700;cursor:pointer;">Пропустить →</button>';
      document.body.appendChild(overlay);
      var closeSplash = function () {
        if (!overlay.parentNode) return;
        overlay.style.opacity = '0';
        setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 320);
      };
      var skipBtn = document.getElementById('amk-splash-skip');
      if (skipBtn) skipBtn.addEventListener('click', closeSplash);
      setTimeout(closeSplash, 1750);
    } catch (e) {}
  }

  // Interactive 3D Tilt & Spotlight Physics on Cards + Tactile Click Audio
  function initInteractivePolish() {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      var selector = '.card, .card-link, .tool-card, .course-header-card, .timeline-card, .cyber-card, .pr-info, .continue-banner';
      document.addEventListener('pointermove', function (e) {
        var el = e.target && e.target.closest ? e.target.closest(selector) : null;
        if (!el) return;
        var rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--mx', x.toFixed(1) + '%');
        el.style.setProperty('--my', y.toFixed(1) + '%');
      }, { passive: true });
    }

    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('button, .btn-primary-cta, .seg-btn, .pr-tab, .tool-tab, .nav-item') : null;
      if (btn && !btn.classList.contains('theme-sfx-btn') && !btn.classList.contains('theme-dot')) {
        playUiSfx('click');
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      buildSwitcher();
      initInteractivePolish();
    });
  } else {
    buildSwitcher();
    initInteractivePolish();
  }

  window.AMKTheme = {
    set: function (id) { apply(id, true); },
    get: read,
    list: THEMES,
    playSfx: playUiSfx,
    isSoundEnabled: isSoundEnabled
  };
})();
