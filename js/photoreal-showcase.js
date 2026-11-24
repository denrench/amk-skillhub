/**
 * AMK SkillHub · Photoreal 3D Spatial Showcase
 * - Режим по умолчанию «Фотореал 8K»: реальные 8K-сцены мастерских и студий АМК
 *   с 3D-перспективным наклоном (parallax), плавным зумом до 2.6×, панорамированием,
 *   динамическими пресетами студийного освещения и интерактивными инженерными точками (hotspots).
 * - Режимы «3D-скан 360°» и «Сетка»: реальные фотограмметрические PBR-сканы Poly Haven (CC0)
 *   на Three.js + HDRI-освещение (RGBELoader / PMREMGenerator) + контактные тени + OrbitControls.
 */
window.PhotorealShowcase = (function () {
  'use strict';

  const THEME_BG = {
    light: { top: '#e2ecff', mid: '#f4f7ff', bottom: '#d8e3f5', exposure: 1.06, shadow: 0.45 },
    graphite: { top: '#1e1b3a', mid: '#141928', bottom: '#090b12', exposure: 1.15, shadow: 0.65 },
    neon: { top: '#1a1040', mid: '#0c1b3a', bottom: '#050814', exposure: 1.22, shadow: 0.72 },
  };

  const SCENE_ENVS = {
    sport_wheel_garage: {
      top: '#240f1f', mid: '#18142c', horizon: '#6b211a', bottom: '#090a12',
      accent: 0xf97316, secondary: 0x38bdf8, fog: 0x120d1a,
    },
    gaming_room_rig: {
      top: '#1e0b42', mid: '#0b1e48', horizon: '#3b1066', bottom: '#050816',
      accent: 0x22d3ee, secondary: 0xec4899, fog: 0x0b0f26,
    },
    autoelectric_lab: {
      top: '#062c3d', mid: '#072a28', horizon: '#1e3a2f', bottom: '#040a10',
      accent: 0xfbbf24, secondary: 0x34d399, fog: 0x06191e,
    },
    hvac_rooftop: {
      top: '#082f49', mid: '#0e3b5c', horizon: '#155e75', bottom: '#06101f',
      accent: 0x38bdf8, secondary: 0xa5f3fc, fog: 0x081e33,
    },
    design_studio: {
      top: '#3b0764', mid: '#1e1b4b', horizon: '#701a75', bottom: '#090514',
      accent: 0xf472b6, secondary: 0x818cf8, fog: 0x18092b,
    },
  };

  const BG_PRESETS = {
    atmosphere: {
      label: 'Реал HDR',
      photoFilter: 'contrast(1.03) saturate(1.05)',
      sheenColor: 'rgba(255, 255, 255, 0.14)',
      tintBg: 'none',
    },
    sunset: {
      label: 'Закат',
      top: '#1c0c2e', mid: '#581c4f', horizon: '#ea580c', bottom: '#12081a',
      accent: 0xfb923c, secondary: 0xc084fc, fog: 0x1d0e24,
      photoFilter: 'sepia(0.18) saturate(1.24) contrast(1.06) brightness(0.97)',
      sheenColor: 'rgba(251, 146, 60, 0.22)',
      tintBg: 'radial-gradient(ellipse at 78% 18%, rgba(251,146,60,0.26), rgba(168,85,247,0.12) 55%, rgba(12,7,20,0.28) 100%)',
    },
    cyber: {
      label: 'Кибер-свет',
      top: '#040614', mid: '#09112e', horizon: '#1d4ed8', bottom: '#02040c',
      accent: 0x22d3ee, secondary: 0xa855f7, fog: 0x05091c,
      photoFilter: 'contrast(1.12) saturate(1.16) hue-rotate(-8deg) brightness(0.93)',
      sheenColor: 'rgba(56, 189, 248, 0.24)',
      tintBg: 'linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(15,23,42,0.06) 45%, rgba(168,85,247,0.22) 100%)',
    },
    studio: {
      label: 'Дневной',
      top: '#dbeafe', mid: '#eff6ff', horizon: '#f8fafc', bottom: '#cbd5e1',
      accent: 0x2563eb, secondary: 0x06b6d4, fog: 0xe2e8f0, lightBg: true,
      photoFilter: 'brightness(1.1) contrast(1.02) saturate(1.03)',
      sheenColor: 'rgba(255, 255, 255, 0.22)',
      tintBg: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18), transparent 65%)',
    },
  };

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'neon';
  }

  function hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeHref(url) {
    if (!url) return '#';
    const raw = String(url).trim();
    if (/^(https?:\/\/|\/|[A-Za-z0-9_.\-]+\.html([?#].*)?$|assets\/[A-Za-z0-9_./\-]+)$/i.test(raw)) {
      return escapeHtml(raw);
    }
    return '#';
  }

  function el(tag, attrs, html) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function mount(container, items, opts) {
    opts = opts || {};
    if (!container || !items || !items.length) return null;

    container.classList.add('pr-showcase');
    container.innerHTML = '';

    // Tabs
    const tabs = el('div', { class: 'pr-tabs', role: 'tablist', 'aria-label': 'Реалистичные сцены по курсам' });
    items.forEach((it, i) => {
      const b = el('button', {
        type: 'button',
        role: 'tab',
        class: 'pr-tab',
        'data-pr-tab': String(i),
        'aria-selected': i === 0 ? 'true' : 'false',
      }, `<span class="pr-tab-course">${escapeHtml(it.course)}</span><span class="pr-tab-title">${escapeHtml(it.short)}</span>`);
      tabs.appendChild(b);
    });

    // Stage shell
    const stage = el('div', { class: 'pr-stage pr-stage--real' });

    // Real-life 8K interactive 3D spatial layer
    const realView = el('div', { class: 'pr-real-view', 'aria-label': 'Интерактивная фотореалистичная сцена' });
    const realTilt = el('div', { class: 'pr-real-tilt' });
    const realWorld = el('div', { class: 'pr-real-world' });
    const realMedia = el('div', { class: 'pr-real-media' });
    const realImg = el('img', {
      class: 'pr-real-img',
      alt: items[0].title || 'Фотореалистичная сцена',
      draggable: 'false',
      decoding: 'async',
    });
    const realTint = el('div', { class: 'pr-real-tint' });
    const realSheen = el('div', { class: 'pr-real-sheen' });
    const hotspotsLayer = el('div', { class: 'pr-hotspots' });
    realMedia.append(realImg, hotspotsLayer);
    realWorld.append(realMedia);
    realTilt.append(realWorld, realTint, realSheen);
    realView.append(realTilt);

    // WebGL 3D scan layer (lazy mounted when user clicks 3D-скан 360° or Сетка)
    const canvasHost = el('div', { class: 'pr-canvas', 'aria-label': 'Интерактивный 3D-скан 360°', hidden: 'true' });

    // HUD controls
    const label = el('div', { class: 'pr-label' });
    const modes = el('div', { class: 'pr-modes', role: 'group', 'aria-label': 'Режим просмотра' }, [
      { id: 'real', text: 'Фотореал 8K' },
      { id: 'scan', text: '3D-скан 360°' },
      { id: 'wire', text: 'Сетка' },
    ].map((m, i) => `<button type="button" class="pr-mode" data-pr-mode="${m.id}" aria-pressed="${i === 0}">${m.text}</button>`).join(''));

    const zoomBar = el('div', { class: 'pr-zoom-bar', role: 'group', 'aria-label': 'Управление масштабом' }, `
      <button type="button" class="pr-zoom-btn" data-pr-zoom="out" title="Отдалить" aria-label="Отдалить">−</button>
      <button type="button" class="pr-zoom-btn pr-zoom-val" data-pr-zoom="reset" title="Сбросить вид">100%</button>
      <button type="button" class="pr-zoom-btn" data-pr-zoom="in" title="Приблизить" aria-label="Приблизить">+</button>
    `);

    const bgSwitcher = el('div', { class: 'pr-bg-modes', role: 'group', 'aria-label': 'Освещение сцены' },
      Object.entries(BG_PRESETS).map(([key, cfg], i) => `<button type="button" class="pr-bg-btn" data-pr-bg="${key}" aria-pressed="${i === 0}">${escapeHtml(cfg.label)}</button>`).join(''));

    const hotspotCard = el('div', { class: 'pr-hotspot-card', hidden: 'true' });
    const loader = el('div', { class: 'pr-loader', role: 'status', hidden: 'true' }, '<span class="pr-spinner"></span><span class="pr-loader-text">Загрузка 3D-скана…</span>');
    const hint = el('div', { class: 'pr-hint' }, 'Нажимайте точки узлов · Колесо — зум · Перетаскивайте сцену');

    stage.append(realView, canvasHost, label, modes, zoomBar, bgSwitcher, hotspotCard, loader, hint);

    const info = el('div', { class: 'pr-info' });
    container.append(tabs, stage, info);

    const state = {
      active: 0,
      mode: 'real',
      bgPreset: 'atmosphere',
      activeHotspot: -1,
      zoom: 1,
      panX: 0,
      panY: 0,
      mediaW: 720,
      mediaH: 402,
      natW: 1376,
      natH: 768,
      loaded: {},
      pending: {},
      ready: false,
      visible: true,
      errors: [],
      envReady: false,
      renderer: null,
      glBooted: false,
    };
    container.__photoreal = state;

    // ==================== SPATIAL REAL-LIFE ENGINE ====================
    let targetZoom = 1;
    let targetPanX = 0;
    let targetPanY = 0;
    let tiltX = 0;
    let tiltY = 0;
    let curTiltX = 0;
    let curTiltY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOrigPanX = 0;
    let dragOrigPanY = 0;
    let spatialRaf = 0;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function layoutRealMedia() {
      const sw = stage.clientWidth || 720;
      const sh = stage.clientHeight || 470;
      const natR = (state.natW || 1376) / (state.natH || 768);
      const stageR = sw / sh;
      if (stageR < natR) {
        state.mediaH = sh;
        state.mediaW = Math.ceil(sh * natR);
      } else {
        state.mediaW = sw;
        state.mediaH = Math.ceil(sw / natR);
      }
      realMedia.style.width = `${state.mediaW}px`;
      realMedia.style.height = `${state.mediaH}px`;
      clampTargets();
      applySpatialTransform(true);
    }

    function clampTargets() {
      const sw = stage.clientWidth || 720;
      const sh = stage.clientHeight || 470;
      targetZoom = clamp(targetZoom, 1, 2.6);
      const maxX = Math.max(0, (state.mediaW * targetZoom - sw) * 0.5);
      const maxY = Math.max(0, (state.mediaH * targetZoom - sh) * 0.5);
      targetPanX = clamp(targetPanX, -maxX, maxX);
      targetPanY = clamp(targetPanY, -maxY, maxY);
    }

    function updateZoomReadout() {
      const btn = zoomBar.querySelector('[data-pr-zoom="reset"]');
      if (!btn) return;
      btn.textContent = state.mode === 'real' ? `${Math.round(targetZoom * 100)}%` : '360°';
    }

    function applySpatialTransform(instant) {
      if (instant) {
        state.zoom = targetZoom;
        state.panX = targetPanX;
        state.panY = targetPanY;
        curTiltX = tiltX;
        curTiltY = tiltY;
      }
      realWorld.style.transform = `translate3d(${state.panX.toFixed(2)}px, ${state.panY.toFixed(2)}px, 0) scale(${state.zoom.toFixed(4)})`;
      if (!reducedMotion) {
        const damp = clamp(1 - (state.zoom - 1) * 0.75, 0.15, 1);
        const rx = (curTiltX * damp).toFixed(2);
        const ry = (curTiltY * damp).toFixed(2);
        const scaleBoost = state.zoom <= 1.02 ? 1.035 : 1;
        realTilt.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scaleBoost})`;
      } else {
        realTilt.style.transform = 'none';
      }
      // Keep hotspot markers crisp at constant screen size regardless of zoom
      const inv = (1 / Math.max(1, state.zoom)).toFixed(3);
      hotspotsLayer.style.setProperty('--pin-inv-scale', inv);
    }

    function spatialLoop() {
      spatialRaf = requestAnimationFrame(spatialLoop);
      if (!state.visible || document.hidden || state.mode !== 'real') return;
      const lerp = isDragging ? 0.38 : 0.14;
      const dz = targetZoom - state.zoom;
      const dx = targetPanX - state.panX;
      const dy = targetPanY - state.panY;
      const dtx = tiltX - curTiltX;
      const dty = tiltY - curTiltY;
      if (Math.abs(dz) > 0.0005 || Math.abs(dx) > 0.08 || Math.abs(dy) > 0.08 || Math.abs(dtx) > 0.02 || Math.abs(dty) > 0.02) {
        state.zoom += dz * lerp;
        state.panX += dx * lerp;
        state.panY += dy * lerp;
        curTiltX += dtx * 0.12;
        curTiltY += dty * 0.12;
        applySpatialTransform(false);
      }
    }

    function applyPhotoLighting() {
      const preset = BG_PRESETS[state.bgPreset] || BG_PRESETS.atmosphere;
      realImg.style.filter = preset.photoFilter || 'none';
      realTint.style.background = preset.tintBg || 'none';
      realSheen.style.setProperty('--sheen-color', preset.sheenColor || 'rgba(255,255,255,0.14)');
    }

    function resetRealView() {
      state.activeHotspot = -1;
      targetZoom = 1;
      targetPanX = 0;
      targetPanY = 0;
      clampTargets();
      updateZoomReadout();
      syncHotspotUI();
    }

    function focusHotspot(idx) {
      const it = items[state.active];
      const list = (it && it.hotspots) || [];
      if (idx < 0 || idx >= list.length) {
        resetRealView();
        return;
      }
      if (state.mode !== 'real') setMode('real');
      state.activeHotspot = idx;
      const h = list[idx];
      const z = h.zoom || 1.92;
      targetZoom = z;
      // Pan so hotspot lands slightly above center (leaving breathing room for inspection card)
      targetPanX = (0.5 - h.x / 100) * state.mediaW * z;
      targetPanY = (0.44 - h.y / 100) * state.mediaH * z;
      clampTargets();
      updateZoomReadout();
      syncHotspotUI();
    }

    function syncHotspotUI() {
      const it = items[state.active] || {};
      const list = it.hotspots || [];
      hotspotsLayer.querySelectorAll('.pr-hotspot').forEach((btn) => {
        const hi = Number(btn.dataset.prHotspot);
        btn.classList.toggle('is-active', hi === state.activeHotspot);
        btn.setAttribute('aria-pressed', String(hi === state.activeHotspot));
      });
      info.querySelectorAll('.pr-part-chip').forEach((chip) => {
        const hi = Number(chip.dataset.prHotspot);
        chip.classList.toggle('is-active', hi === state.activeHotspot);
        chip.setAttribute('aria-pressed', String(hi === state.activeHotspot));
      });

      if (state.mode === 'real' && state.activeHotspot >= 0 && list[state.activeHotspot]) {
        const h = list[state.activeHotspot];
        const total = list.length;
        hotspotCard.innerHTML = `
          <div class="pr-hc-head">
            <span class="pr-hc-badge">Узел ${state.activeHotspot + 1} / ${total}${h.spec ? ' · ' + escapeHtml(h.spec) : ''}</span>
            <button type="button" class="pr-hc-close" data-pr-hc="close" aria-label="Сбросить приближение">×</button>
          </div>
          <h4 class="pr-hc-title">${escapeHtml(h.title)}</h4>
          <p class="pr-hc-desc">${escapeHtml(h.desc)}</p>
          <div class="pr-hc-nav">
            <button type="button" class="pr-hc-step" data-pr-hc="prev">← Пред.</button>
            <button type="button" class="pr-hc-step pr-hc-step--next" data-pr-hc="next">След. узел →</button>
          </div>
        `;
        hotspotCard.hidden = false;
      } else {
        hotspotCard.hidden = true;
      }
    }

    function renderHotspots(i) {
      const it = items[i] || {};
      const list = it.hotspots || [];
      hotspotsLayer.innerHTML = list.map((h, idx) => `
        <button type="button"
          class="pr-hotspot"
          data-pr-hotspot="${idx}"
          aria-pressed="false"
          aria-label="${escapeHtml(h.title)}"
          style="left:${Number(h.x)}%;top:${Number(h.y)}%;">
          <span class="pr-hotspot-pulse"></span>
          <span class="pr-hotspot-dot">${idx + 1}</span>
          <span class="pr-hotspot-tip">${escapeHtml(h.title)}</span>
        </button>
      `).join('');
    }

    function renderInfo(i) {
      const it = items[i];
      const list = it.hotspots || [];
      label.innerHTML = `<b>${escapeHtml(it.course)}</b><span>${escapeHtml(it.title)}</span>`;
      const chipsHtml = list.length ? `
        <div class="pr-parts-block">
          <div class="pr-parts-label">Интерактивный разбор узлов (клик — приблизить)</div>
          <div class="pr-parts-chips">
            ${list.map((h, idx) => `<button type="button" class="pr-part-chip" data-pr-hotspot="${idx}" aria-pressed="false"><span>${idx + 1}</span>${escapeHtml(h.short || h.title)}</button>`).join('')}
          </div>
        </div>
      ` : '';
      info.innerHTML = `
        <h3 class="pr-info-title">${escapeHtml(it.title)}</h3>
        <p class="pr-info-text">${escapeHtml(it.text)}</p>
        ${chipsHtml}
        <ul class="pr-info-facts">${(it.facts || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
        <div class="pr-info-meta">Сцена: <a href="${safeHref(it.sourceUrl)}">${escapeHtml(it.source)}</a> · 3D-сканы CC0</div>
        <a class="pr-info-cta" href="${safeHref(it.href)}">${escapeHtml(it.cta)} →</a>`;
    }

    // Pointer interactions on Real-Life Stage
    realView.addEventListener('pointermove', (e) => {
      if (state.mode !== 'real') return;
      const rect = realView.getBoundingClientRect();
      const nx = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      const ny = clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
      realSheen.style.setProperty('--mx', `${(nx * 100).toFixed(1)}%`);
      realSheen.style.setProperty('--my', `${(ny * 100).toFixed(1)}%`);

      if (isDragging) {
        targetPanX = dragOrigPanX + (e.clientX - dragStartX);
        targetPanY = dragOrigPanY + (e.clientY - dragStartY);
        clampTargets();
        return;
      }
      if (!reducedMotion) {
        tiltY = (nx - 0.5) * 7.5;
        tiltX = (0.5 - ny) * 5.2;
      }
    });

    realView.addEventListener('pointerleave', () => {
      tiltX = 0;
      tiltY = 0;
      isDragging = false;
      realView.classList.remove('is-dragging');
    });

    realView.addEventListener('pointerdown', (e) => {
      if (state.mode !== 'real') return;
      if (e.target.closest('.pr-hotspot')) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragOrigPanX = targetPanX;
      dragOrigPanY = targetPanY;
      realView.classList.add('is-dragging');
      if (realView.setPointerCapture) {
        try { realView.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });

    realView.addEventListener('pointerup', (e) => {
      isDragging = false;
      realView.classList.remove('is-dragging');
      if (realView.releasePointerCapture) {
        try { realView.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    });

    realView.addEventListener('wheel', (e) => {
      if (state.mode !== 'real') return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.16 : 0.86;
      targetZoom = clamp(targetZoom * factor, 1, 2.6);
      if (targetZoom <= 1.03) {
        targetZoom = 1;
        targetPanX = 0;
        targetPanY = 0;
      }
      clampTargets();
      updateZoomReadout();
    }, { passive: false });

    realView.addEventListener('dblclick', (e) => {
      if (e.target.closest('.pr-hotspot')) return;
      resetRealView();
    });

    hotspotsLayer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pr-hotspot]');
      if (!btn) return;
      e.stopPropagation();
      const idx = Number(btn.dataset.prHotspot);
      if (idx === state.activeHotspot) resetRealView();
      else focusHotspot(idx);
    });

    info.addEventListener('click', (e) => {
      const btn = e.target.closest('.pr-part-chip[data-pr-hotspot]');
      if (!btn) return;
      const idx = Number(btn.dataset.prHotspot);
      if (idx === state.activeHotspot) resetRealView();
      else focusHotspot(idx);
    });

    hotspotCard.addEventListener('click', (e) => {
      const act = e.target.closest('[data-pr-hc]');
      if (!act) return;
      const list = (items[state.active] && items[state.active].hotspots) || [];
      if (!list.length) return;
      const cmd = act.dataset.prHc;
      if (cmd === 'close') resetRealView();
      else if (cmd === 'next') focusHotspot((state.activeHotspot + 1) % list.length);
      else if (cmd === 'prev') focusHotspot((state.activeHotspot - 1 + list.length) % list.length);
    });

    zoomBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pr-zoom]');
      if (!btn) return;
      const cmd = btn.dataset.prZoom;
      if (state.mode === 'real') {
        if (cmd === 'in') targetZoom = clamp(targetZoom + 0.35, 1, 2.6);
        else if (cmd === 'out') targetZoom = clamp(targetZoom - 0.35, 1, 2.6);
        else { resetRealView(); return; }
        if (targetZoom <= 1.03) { targetZoom = 1; targetPanX = 0; targetPanY = 0; }
        clampTargets();
        updateZoomReadout();
      } else if (gl) {
        if (cmd === 'reset') gl.resetView();
        else if (cmd === 'in') gl.dolly(0.84);
        else if (cmd === 'out') gl.dolly(1.18);
      }
    });

    // ==================== LAZY WEBGL 3D PHOTOGRAMMETRY ENGINE ====================
    let gl = null;

    function ensureWebGL() {
      if (gl) return gl;
      const T = window.THREE;
      if (!T || !hasWebGL()) {
        state.errors.push('no-webgl');
        loader.innerHTML = 'WebGL недоступен — используйте режим «Фотореал 8K».';
        loader.hidden = false;
        return null;
      }

      const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      state.renderer = renderer;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.physicallyCorrectLights = true;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      canvasHost.appendChild(renderer.domElement);

      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(32, 1, 0.05, 100);
      camera.position.set(2.4, 1.35, 2.9);

      function getActiveEnvCfg() {
        const preset = BG_PRESETS[state.bgPreset];
        if (preset && preset.top) return preset;
        const it = items[state.active] || {};
        const byScene = SCENE_ENVS[it.sceneType];
        if (currentTheme() === 'light' && state.bgPreset === 'atmosphere') {
          return {
            top: '#dbeafe', mid: '#e0e7ff', horizon: '#f0f9ff', bottom: '#cbd5e1',
            accent: (byScene && byScene.accent) || 0x2563eb,
            secondary: (byScene && byScene.secondary) || 0x06b6d4,
            fog: 0xdbeafe, lightBg: true,
          };
        }
        return byScene || {
          top: '#1a1040', mid: '#0c1b3a', horizon: '#1e3a8a', bottom: '#050814',
          accent: 0x38bdf8, secondary: 0xa855f7, fog: 0x090f24,
        };
      }

      function makeBgTexture() {
        const env = getActiveEnvCfg();
        const c = document.createElement('canvas');
        c.width = 512; c.height = 512;
        const g = c.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0.0, env.top);
        grad.addColorStop(0.4, env.mid);
        grad.addColorStop(0.68, env.horizon || env.mid);
        grad.addColorStop(1.0, env.bottom);
        g.fillStyle = grad;
        g.fillRect(0, 0, 512, 512);
        const tex = new T.CanvasTexture(c);
        tex.encoding = T.sRGBEncoding;
        return tex;
      }

      const podium = new T.Mesh(
        new T.CylinderGeometry(1.75, 1.88, 0.08, 64),
        new T.MeshStandardMaterial({ color: 0x111827, roughness: 0.28, metalness: 0.72 })
      );
      podium.position.y = -0.04;
      podium.receiveShadow = true;
      scene.add(podium);

      const haloMat = new T.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
      const haloRing = new T.Mesh(new T.TorusGeometry(1.82, 0.012, 12, 96), haloMat);
      haloRing.rotation.x = Math.PI / 2;
      haloRing.position.y = 0.005;
      scene.add(haloRing);

      const key = new T.DirectionalLight(0xffffff, 2.6);
      key.position.set(3.2, 5.2, 3.0);
      scene.add(key);
      const rim = new T.DirectionalLight(0x38bdf8, 1.8);
      rim.position.set(-3.2, 2.8, -3.0);
      scene.add(rim);
      const fill = new T.PointLight(0xa855f7, 2.0, 10);
      fill.position.set(2.5, 1.5, -2.2);
      scene.add(fill);

      // Soft contact shadow plane
      const SH_W = 4, SH_H = 4, SH_RES = 512, SH_CAM_H = 1.6;
      const shadowGroup = new T.Group();
      scene.add(shadowGroup);
      const rtShadow = new T.WebGLRenderTarget(SH_RES, SH_RES);
      rtShadow.texture.generateMipmaps = false;
      const rtBlur = new T.WebGLRenderTarget(SH_RES, SH_RES);
      rtBlur.texture.generateMipmaps = false;
      const planeGeo = new T.PlaneGeometry(SH_W, SH_H).rotateX(Math.PI / 2);
      const shadowPlaneMat = new T.MeshBasicMaterial({ map: rtShadow.texture, opacity: 0.55, transparent: true, depthWrite: false });
      const shadowPlane = new T.Mesh(planeGeo, shadowPlaneMat);
      shadowPlane.position.y = 0.002;
      shadowPlane.renderOrder = 1;
      shadowPlane.scale.y = -1;
      shadowGroup.add(shadowPlane);
      const blurPlane = new T.Mesh(planeGeo);
      blurPlane.visible = false;
      shadowGroup.add(blurPlane);
      const shadowCam = new T.OrthographicCamera(-SH_W / 2, SH_W / 2, SH_H / 2, -SH_H / 2, 0, SH_CAM_H);
      shadowCam.rotation.x = Math.PI / 2;
      shadowGroup.add(shadowCam);
      const depthMat = new T.MeshDepthMaterial();
      depthMat.onBeforeCompile = (shader) => {
        shader.uniforms.darkness = { value: 1.5 };
        shader.fragmentShader = 'uniform float darkness;\n' + shader.fragmentShader.replace(
          'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
          'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );');
      };
      depthMat.depthTest = false;
      depthMat.depthWrite = false;
      const hBlur = T.HorizontalBlurShader ? new T.ShaderMaterial(T.HorizontalBlurShader) : null;
      const vBlur = T.VerticalBlurShader ? new T.ShaderMaterial(T.VerticalBlurShader) : null;
      if (hBlur) hBlur.depthTest = false;
      if (vBlur) vBlur.depthTest = false;

      function blurShadow(amount) {
        if (!hBlur || !vBlur) return;
        blurPlane.visible = true;
        blurPlane.material = hBlur;
        hBlur.uniforms.tDiffuse.value = rtShadow.texture;
        hBlur.uniforms.h.value = amount / 256;
        renderer.setRenderTarget(rtBlur);
        renderer.render(blurPlane, shadowCam);
        blurPlane.material = vBlur;
        vBlur.uniforms.tDiffuse.value = rtBlur.texture;
        vBlur.uniforms.v.value = amount / 256;
        renderer.setRenderTarget(rtShadow);
        renderer.render(blurPlane, shadowCam);
        blurPlane.visible = false;
      }

      function renderContactShadow() {
        const bg = scene.background;
        scene.background = null;
        shadowPlane.visible = false;
        podium.visible = false;
        haloRing.visible = false;
        scene.overrideMaterial = depthMat;
        const prevClear = renderer.getClearAlpha();
        renderer.setClearAlpha(0);
        renderer.setRenderTarget(rtShadow);
        renderer.clear();
        renderer.render(scene, shadowCam);
        scene.overrideMaterial = null;
        blurShadow(3.0);
        blurShadow(1.2);
        renderer.setRenderTarget(null);
        renderer.setClearAlpha(prevClear);
        shadowPlane.visible = true;
        podium.visible = true;
        haloRing.visible = true;
        scene.background = bg;
      }

      let controls = null;
      if (T.OrbitControls) {
        controls = new T.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.rotateSpeed = 0.72;
        controls.zoomSpeed = 0.85;
        controls.enablePan = false;
        controls.minDistance = 1.4;
        controls.maxDistance = 6.5;
        controls.minPolarAngle = 0.15;
        controls.maxPolarAngle = Math.PI / 2 - 0.03;
        controls.autoRotate = !reducedMotion;
        controls.autoRotateSpeed = 1.05;
        controls.target.set(0, 0.5, 0);
        controls.addEventListener('start', () => { controls.autoRotate = false; });
        controls.addEventListener('change', requestRender);
      }
      renderer.domElement.addEventListener('dblclick', () => resetView());

      // HDRI
      const pmrem = new T.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      function setFallbackEnv() {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 256;
        const g = c.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#9aa3ad'); grad.addColorStop(0.5, '#e7e9ec'); grad.addColorStop(1, '#3a3d42');
        g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
        g.fillStyle = '#ffffff'; g.fillRect(60, 40, 120, 50); g.fillRect(320, 50, 140, 40);
        const tex = new T.CanvasTexture(c);
        tex.mapping = T.EquirectangularReflectionMapping;
        tex.encoding = T.sRGBEncoding;
        scene.environment = pmrem.fromEquirectangular(tex).texture;
        tex.dispose();
        state.envReady = true;
      }
      if (T.RGBELoader) {
        const rgbe = new T.RGBELoader();
        if (rgbe.setDataType && T.UnsignedByteType !== undefined) rgbe.setDataType(T.UnsignedByteType);
        rgbe.load(opts.hdri || 'assets/hdri/studio_small_09_1k.hdr', (tex) => {
          scene.environment = pmrem.fromEquirectangular(tex).texture;
          tex.dispose();
          state.envReady = true;
          requestRender();
        }, undefined, () => { setFallbackEnv(); requestRender(); });
      } else {
        setFallbackEnv();
      }

      const gltfLoader = T.GLTFLoader ? new T.GLTFLoader() : null;
      const root = new T.Group();
      scene.add(root);
      const wireMat = new T.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.85 });

      function loadPart(part) {
        return new Promise((resolve, reject) => {
          if (!gltfLoader) { reject(new Error('GLTFLoader missing')); return; }
          gltfLoader.load(part.url, (gltf) => resolve(gltf.scene), undefined, reject);
        });
      }

      function normalize(obj, targetSize) {
        obj.updateMatrixWorld(true);
        const box = new T.Box3().setFromObject(obj);
        const size = box.getSize(new T.Vector3());
        const s = targetSize / Math.max(size.x, size.y, size.z, 1e-4);
        obj.scale.multiplyScalar(s);
        obj.updateMatrixWorld(true);
        const b2 = new T.Box3().setFromObject(obj);
        const c = b2.getCenter(new T.Vector3());
        obj.position.x -= c.x;
        obj.position.z -= c.z;
        obj.position.y -= b2.min.y;
      }

      async function buildScanItem(i) {
        if (state.loaded[i]) return state.loaded[i];
        if (state.pending[i]) return state.pending[i];
        state.pending[i] = (async () => {
          const it = items[i];
          const wrap = new T.Group();
          if (it.parts && it.parts.length && gltfLoader) {
            const group = new T.Group();
            const parts = await Promise.all(it.parts.map(loadPart));
            parts.forEach((sceneObj, pi) => {
              const p = it.parts[pi];
              const holder = new T.Group();
              if (p.rotation) sceneObj.rotation.set(...p.rotation);
              holder.add(sceneObj);
              normalize(holder, p.size || 1.75);
              if (p.offset) holder.position.add(new T.Vector3(...p.offset));
              group.add(holder);
            });
            wrap.add(group);
            normalize(wrap, it.scanSize || 2.15);
          } else {
            throw new Error('No 3D photogrammetry parts configured');
          }

          const meshes = [];
          wrap.traverse((o) => {
            if (!o.isMesh) return;
            o.castShadow = true;
            o.receiveShadow = true;
            const m = o.material;
            if (m) {
              m.envMapIntensity = it.envIntensity || 1.25;
              if (m.aoMap && o.geometry && !o.geometry.attributes.uv2 && o.geometry.attributes.uv) {
                o.geometry.setAttribute('uv2', o.geometry.attributes.uv);
              }
              m.needsUpdate = true;
            }
            o.userData.photoMat = m;
            meshes.push(o);
          });
          const entry = { object: wrap, meshes };
          state.loaded[i] = entry;
          delete state.pending[i];
          return entry;
        })();
        try {
          return await state.pending[i];
        } catch (err) {
          delete state.pending[i];
          throw err;
        }
      }

      let needsRender = true;
      let shadowDirty = true;
      let glRafId = 0;
      let loadToken = 0;

      function requestRender() { needsRender = true; }

      function applyGLTheme() {
        const t = THEME_BG[currentTheme()] || THEME_BG.neon;
        const env = getActiveEnvCfg();
        if (scene.background && scene.background.dispose) scene.background.dispose();
        scene.background = makeBgTexture();
        scene.fog = new T.FogExp2(env.fog, env.lightBg ? 0.04 : 0.065);
        renderer.toneMappingExposure = env.lightBg ? 1.08 : t.exposure;
        shadowPlaneMat.opacity = env.lightBg ? 0.4 : t.shadow;
        rim.color.setHex(env.accent);
        fill.color.setHex(env.secondary);
        haloMat.color.setHex(env.accent);
        podium.material.color.setHex(env.lightBg ? 0xdbeafe : 0x111827);
        requestRender();
      }

      function applyGLMode() {
        const entry = state.loaded[state.active];
        if (!entry) return;
        entry.meshes.forEach((m) => {
          m.material = state.mode === 'wire' ? wireMat : m.userData.photoMat;
        });
        shadowGroup.visible = state.mode !== 'wire';
        requestRender();
      }

      function frame(entry) {
        const box = new T.Box3().setFromObject(entry.object);
        const size = box.getSize(new T.Vector3());
        const center = box.getCenter(new T.Vector3());
        const dist = Math.max(size.x, size.y * 1.25, size.z) * 1.55 + 0.5;
        if (controls) controls.target.copy(center);
        state.home = {
          target: center.clone(),
          pos: new T.Vector3(center.x + dist * 0.56, center.y + dist * 0.34, center.z + dist * 0.8),
        };
        camera.position.copy(state.home.pos);
        camera.lookAt(center);
        if (controls) controls.update();
      }

      function resetView() {
        if (!state.home) return;
        camera.position.copy(state.home.pos);
        if (controls) { controls.target.copy(state.home.target); controls.update(); }
        requestRender();
      }

      function dolly(mult) {
        if (!controls) return;
        const offset = camera.position.clone().sub(controls.target).multiplyScalar(mult);
        const len = clamp(offset.length(), controls.minDistance, controls.maxDistance);
        offset.setLength(len);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        requestRender();
      }

      function resizeGL() {
        const w = canvasHost.clientWidth || stage.clientWidth || 640;
        const h = canvasHost.clientHeight || stage.clientHeight || 470;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        requestRender();
      }

      async function showScan(i) {
        const token = ++loadToken;
        loader.innerHTML = '<span class="pr-spinner"></span><span class="pr-loader-text">Загрузка реального 3D-скана…</span>';
        loader.hidden = false;
        try {
          const entry = await buildScanItem(i);
          if (token !== loadToken) return;
          while (root.children.length) root.remove(root.children[0]);
          root.add(entry.object);
          applyGLTheme();
          frame(entry);
          applyGLMode();
          shadowDirty = true;
          state.activeMeshes = entry.meshes.length;
          loader.hidden = true;
          requestRender();
        } catch (err) {
          state.errors.push(String(err && err.message || err));
          loader.innerHTML = 'Не удалось загрузить 3D-скан. Переключитесь на «Фотореал 8K».';
        }
      }

      function glLoop() {
        glRafId = requestAnimationFrame(glLoop);
        if (!state.visible || document.hidden || state.mode === 'real') return;
        let changed = false;
        if (controls) changed = controls.update() || controls.autoRotate || changed;
        if (!changed && !needsRender) return;
        needsRender = false;
        if (shadowDirty && state.mode !== 'wire') {
          renderContactShadow();
          shadowDirty = false;
        }
        renderer.render(scene, camera);
      }

      applyGLTheme();
      resizeGL();
      glLoop();
      state.glBooted = true;

      gl = {
        scene, renderer, controls, rtShadow, rtBlur,
        applyGLTheme, applyGLMode, showScan, resizeGL, resetView, dolly,
        stop: () => cancelAnimationFrame(glRafId),
      };
      return gl;
    }

    // ==================== UNIFIED STAGE CONTROLLER ====================
    function updateHint() {
      if (state.mode === 'real') {
        hint.textContent = 'Нажимайте точки узлов · Колесо — зум · Перетаскивайте сцену';
      } else {
        hint.textContent = 'Вращайте 3D-скан на 360° · Колесо — зум · Двойной клик — сброс';
      }
    }

    function setMode(nextMode) {
      state.mode = nextMode;
      modes.querySelectorAll('[data-pr-mode]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.prMode === nextMode));
      });
      stage.classList.toggle('pr-stage--real', nextMode === 'real');
      stage.classList.toggle('pr-stage--scan', nextMode !== 'real');
      realView.hidden = nextMode !== 'real';
      canvasHost.hidden = nextMode === 'real';
      updateHint();
      updateZoomReadout();

      if (nextMode === 'real') {
        loader.hidden = true;
        layoutRealMedia();
        syncHotspotUI();
      } else {
        hotspotCard.hidden = true;
        const engine = ensureWebGL();
        if (engine) {
          engine.resizeGL();
          engine.showScan(state.active);
        }
      }
    }

    function show(i) {
      state.active = i;
      tabs.querySelectorAll('[data-pr-tab]').forEach((b) => {
        b.setAttribute('aria-selected', String(Number(b.dataset.prTab) === i));
      });
      const it = items[i];
      renderInfo(i);
      renderHotspots(i);
      resetRealView();

      if (it.photoUrl) {
        realImg.classList.remove('is-loaded');
        realImg.alt = it.title || it.course || '';
        realImg.onload = () => {
          state.natW = realImg.naturalWidth || 1376;
          state.natH = realImg.naturalHeight || 768;
          layoutRealMedia();
          realImg.classList.add('is-loaded');
          state.ready = true;
          container.dispatchEvent(new CustomEvent('photoreal:ready', { detail: { index: i } }));
        };
        realImg.src = it.photoUrl;
        if (realImg.complete && realImg.naturalWidth) {
          state.natW = realImg.naturalWidth;
          state.natH = realImg.naturalHeight;
          layoutRealMedia();
          realImg.classList.add('is-loaded');
          state.ready = true;
        }
      }

      applyPhotoLighting();

      if (state.mode !== 'real') {
        const engine = ensureWebGL();
        if (engine) engine.showScan(i);
      }

      // Preload next scene image in background for instant tab switching
      const nextItem = items[(i + 1) % items.length];
      if (nextItem && nextItem.photoUrl) {
        const pre = new Image();
        pre.src = nextItem.photoUrl;
      }
    }

    function applyTheme() {
      applyPhotoLighting();
      if (gl) gl.applyGLTheme();
    }

    // Events
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pr-tab]');
      if (b) show(Number(b.dataset.prTab));
    });
    tabs.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = (state.active + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length;
      show(n);
      const nextBtn = tabs.querySelector(`[data-pr-tab="${n}"]`);
      if (nextBtn) nextBtn.focus();
    });
    modes.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pr-mode]');
      if (b) setMode(b.dataset.prMode);
    });
    bgSwitcher.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pr-bg]');
      if (!b) return;
      state.bgPreset = b.dataset.prBg;
      bgSwitcher.querySelectorAll('[data-pr-bg]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      applyTheme();
    });

    const onResize = () => {
      layoutRealMedia();
      if (gl && state.mode !== 'real') gl.resizeGL();
    };
    const ro = 'ResizeObserver' in window ? new ResizeObserver(onResize) : null;
    if (ro) ro.observe(stage); else window.addEventListener('resize', onResize);

    const cleanupListeners = [
      () => document.removeEventListener('amk:theme', applyTheme),
    ];
    if (!ro) cleanupListeners.push(() => window.removeEventListener('resize', onResize));
    document.addEventListener('amk:theme', applyTheme);

    let io = null;
    function dispose() {
      cancelAnimationFrame(spatialRaf);
      if (io && typeof io.disconnect === 'function') io.disconnect();
      if (gl) {
        gl.stop();
        if (typeof window.disposeThreeScene === 'function') {
          window.disposeThreeScene({
            resizeObserver: ro,
            scene: gl.scene,
            renderer: gl.renderer,
            controls: gl.controls,
            rtShadow: gl.rtShadow,
            rtBlur: gl.rtBlur,
            cleanupListeners,
          });
        } else {
          cleanupListeners.forEach((fn) => { try { fn(); } catch (e) {} });
          if (ro) ro.disconnect();
          try { if (gl.controls) gl.controls.dispose(); } catch (e) {}
          try { gl.renderer.dispose(); } catch (e) {}
        }
      } else {
        cleanupListeners.forEach((fn) => { try { fn(); } catch (e) {} });
        if (ro) ro.disconnect();
      }
    }
    const onPageHide = () => dispose();
    window.addEventListener('pagehide', onPageHide);
    cleanupListeners.push(() => window.removeEventListener('pagehide', onPageHide));

    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { state.visible = en.isIntersecting; });
      }, { rootMargin: '200px' });
      io.observe(container);
    }

    show(0);
    spatialLoop();

    state.show = show;
    state.setMode = setMode;
    state.focusHotspot = focusHotspot;
    state.dispose = dispose;
    return state;
  }

  return { mount };
})();
