/**
 * AMK SkillHub · Photoreal 3D Showcase (Three.js r128, без React)
 * - PBR-материалы из glTF (map / normalMap / roughnessMap / metalnessMap / aoMap)
 * - Студийная HDRI (RGBELoader + PMREMGenerator) → scene.environment
 * - Мягкие контактные тени (аналог drei ContactShadows: depth → blur → plane)
 * - Лёгкий Bloom (UnrealBloomPass), OrbitControls с демпфированием
 * - Режимы на канвасе: Final Photo-Real / Clay / Wireframe
 * Модели: Poly Haven (CC0) фотограмметрия реальных предметов.
 */
window.PhotorealShowcase = (function () {
  'use strict';

  const THEME_BG = {
    light: { top: '#e2ecff', mid: '#f4f7ff', bottom: '#d8e3f5', exposure: 1.06, shadow: 0.45 },
    graphite: { top: '#1e1b3a', mid: '#141928', bottom: '#090b12', exposure: 1.15, shadow: 0.65 },
    neon: { top: '#1a1040', mid: '#0c1b3a', bottom: '#050814', exposure: 1.22, shadow: 0.72 },
  };

  // Rich per-scene atmospheric studio environments (unique palette, glow, rim light & particles)
  const SCENE_ENVS = {
    sport_wheel_garage: {
      top: '#240f1f', mid: '#18142c', horizon: '#6b211a', bottom: '#090a12',
      accent: 0xf97316, secondary: 0x38bdf8, grid: 0xf97316, fog: 0x120d1a,
    },
    gaming_room_rig: {
      top: '#1e0b42', mid: '#0b1e48', horizon: '#3b1066', bottom: '#050816',
      accent: 0x22d3ee, secondary: 0xec4899, grid: 0x6366f1, fog: 0x0b0f26,
    },
    autoelectric_lab: {
      top: '#062c3d', mid: '#072a28', horizon: '#1e3a2f', bottom: '#040a10',
      accent: 0xfbbf24, secondary: 0x34d399, grid: 0x10b981, fog: 0x06191e,
    },
    hvac_rooftop: {
      top: '#082f49', mid: '#0e3b5c', horizon: '#155e75', bottom: '#06101f',
      accent: 0x38bdf8, secondary: 0xa5f3fc, grid: 0x0ea5e9, fog: 0x081e33,
    },
    design_studio: {
      top: '#3b0764', mid: '#1e1b4b', horizon: '#701a75', bottom: '#090514',
      accent: 0xf472b6, secondary: 0x818cf8, grid: 0xc084fc, fog: 0x18092b,
    },
  };

  const BG_PRESETS = {
    atmosphere: { label: 'Атмосфера' },
    sunset: {
      label: 'Закат',
      top: '#1c0c2e', mid: '#581c4f', horizon: '#ea580c', bottom: '#12081a',
      accent: 0xfb923c, secondary: 0xc084fc, grid: 0xf97316, fog: 0x1d0e24,
    },
    cyber: {
      label: 'Кибер-сетка',
      top: '#040614', mid: '#09112e', horizon: '#1d4ed8', bottom: '#02040c',
      accent: 0x22d3ee, secondary: 0xa855f7, grid: 0x22d3ee, fog: 0x05091c,
    },
    studio: {
      label: 'Циклорама',
      top: '#dbeafe', mid: '#eff6ff', horizon: '#f8fafc', bottom: '#cbd5e1',
      accent: 0x2563eb, secondary: 0x06b6d4, grid: 0x94a3b8, fog: 0xe2e8f0, lightBg: true,
    },
  };

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
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
    if (/^(https?:\/\/|\/|[A-Za-z0-9_.\-]+\.html([?#].*)?$)/i.test(raw)) {
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

  function mount(container, items, opts) {
    opts = opts || {};
    if (!container || !items || !items.length) return null;
    const T = window.THREE;

    container.classList.add('pr-showcase');
    container.innerHTML = '';

    const tabs = el('div', { class: 'pr-tabs', role: 'tablist', 'aria-label': '3D-объекты по курсам' });
    items.forEach((it, i) => {
      const b = el('button', {
        type: 'button', role: 'tab', class: 'pr-tab', 'data-pr-tab': String(i),
        'aria-selected': i === 0 ? 'true' : 'false',
      }, `<span class="pr-tab-course">${escapeHtml(it.course)}</span><span class="pr-tab-title">${escapeHtml(it.short)}</span>`);
      tabs.appendChild(b);
    });

    const stage = el('div', { class: 'pr-stage' });
    const canvasHost = el('div', { class: 'pr-canvas', 'aria-label': 'Интерактивная 3D-модель' });
    const modes = el('div', { class: 'pr-modes', role: 'group', 'aria-label': 'Режим рендера' },
      ['photo', 'clay', 'wire'].map((m, i) => `<button type="button" class="pr-mode" data-pr-mode="${m}" aria-pressed="${i === 0}">${
        m === 'photo' ? 'Photo-Real' : m === 'clay' ? 'Clay' : 'Wire'}</button>`).join(''));
    const bgSwitcher = el('div', { class: 'pr-bg-modes', role: 'group', 'aria-label': 'Фон 3D-студии' },
      Object.entries(BG_PRESETS).map(([key, cfg], i) => `<button type="button" class="pr-bg-btn" data-pr-bg="${key}" aria-pressed="${i === 0}">${escapeHtml(cfg.label)}</button>`).join(''));
    const label = el('div', { class: 'pr-label' });
    const loader = el('div', { class: 'pr-loader', role: 'status' }, '<span class="pr-spinner"></span><span class="pr-loader-text">Загрузка 3D-скана…</span>');
    const hint = el('div', { class: 'pr-hint' }, 'Вращайте на 360° · Колесо — зум · Двойной клик — сброс');
    stage.append(canvasHost, label, modes, bgSwitcher, loader, hint);

    const info = el('div', { class: 'pr-info' });
    container.append(tabs, stage, info);

    const state = {
      active: 0, mode: 'photo', bgPreset: 'atmosphere', loaded: {}, pending: {}, ready: false, visible: false,
      errors: [], envReady: false, renderer: null,
    };
    container.__photoreal = state;

    function renderInfo(i) {
      const it = items[i];
      label.innerHTML = `<b>${escapeHtml(it.course)}</b><span>${escapeHtml(it.title)}</span>`;
      info.innerHTML = `
        <h3 class="pr-info-title">${escapeHtml(it.title)}</h3>
        <p class="pr-info-text">${escapeHtml(it.text)}</p>
        <ul class="pr-info-facts">${(it.facts || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
        <div class="pr-info-meta">3D-скан: <a href="${safeHref(it.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(it.source)}</a> · CC0</div>
        <a class="pr-info-cta" href="${safeHref(it.href)}">${escapeHtml(it.cta)} →</a>`;
    }
    renderInfo(0);

    if (!T || !hasWebGL()) {
      loader.innerHTML = 'WebGL недоступен — откройте страницу в современном браузере.';
      state.errors.push('no-webgl');
      return state;
    }

    // ---------- Renderer / scene ----------
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    state.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    canvasHost.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(32, 1, 0.05, 100);
    camera.position.set(2.6, 1.5, 3.2);

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
          grid: 0x64748b, fog: 0xdbeafe, lightBg: true,
        };
      }
      return byScene || {
        top: '#1a1040', mid: '#0c1b3a', horizon: '#1e3a8a', bottom: '#050814',
        accent: 0x38bdf8, secondary: 0xa855f7, grid: 0x38bdf8, fog: 0x090f24,
      };
    }

    function makeBgTexture() {
      const env = getActiveEnvCfg();
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const g = c.getContext('2d');
      // Rich multi-stop atmospheric studio sky gradient
      const grad = g.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, env.top);
      grad.addColorStop(0.38, env.mid);
      grad.addColorStop(0.64, env.horizon || env.mid);
      grad.addColorStop(1.0, env.bottom);
      g.fillStyle = grad;
      g.fillRect(0, 0, 512, 512);

      // Soft studio aurora orbs & horizon studio glow
      const orb1 = g.createRadialGradient(130, 180, 10, 130, 180, 210);
      orb1.addColorStop(0, env.lightBg ? 'rgba(56,189,248,0.22)' : 'rgba(56,189,248,0.28)');
      orb1.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = orb1;
      g.fillRect(0, 0, 512, 512);

      const orb2 = g.createRadialGradient(390, 240, 10, 390, 240, 220);
      orb2.addColorStop(0, env.lightBg ? 'rgba(139,92,246,0.16)' : 'rgba(236,72,153,0.22)');
      orb2.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = orb2;
      g.fillRect(0, 0, 512, 512);

      // Subtle glowing horizon band
      const hBand = g.createLinearGradient(0, 280, 0, 365);
      hBand.addColorStop(0, 'rgba(255,255,255,0)');
      hBand.addColorStop(0.5, env.lightBg ? 'rgba(255,255,255,0.45)' : 'rgba(125,211,252,0.18)');
      hBand.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = hBand;
      g.fillRect(0, 280, 512, 85);

      const tex = new T.CanvasTexture(c);
      tex.encoding = T.sRGBEncoding;
      return tex;
    }

    // === 3D ATMOSPHERIC STAGE BACKDROP (Glow Rings, Cyber Grid & Floating Dust Particles) ===
    const backdropGroup = new T.Group();
    scene.add(backdropGroup);

    const floorGrid = new T.PolarGridHelper(4.8, 12, 6, 48, 0x38bdf8, 0x1e293b);
    floorGrid.position.y = -0.02;
    if (floorGrid.material) {
      floorGrid.material.transparent = true;
      floorGrid.material.opacity = 0.28;
    }
    backdropGroup.add(floorGrid);

    const haloMat1 = new T.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
    const haloRing1 = new T.Mesh(new T.TorusGeometry(2.35, 0.014, 12, 96), haloMat1);
    haloRing1.rotation.x = Math.PI / 2;
    haloRing1.position.y = 0.01;
    backdropGroup.add(haloRing1);

    const haloMat2 = new T.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.24 });
    const haloRing2 = new T.Mesh(new T.TorusGeometry(2.95, 0.01, 12, 96), haloMat2);
    haloRing2.rotation.x = Math.PI / 2;
    haloRing2.position.y = 0.015;
    backdropGroup.add(haloRing2);

    // Floating luminous studio bokeh particles around the showcase
    const pCount = 90;
    const pPositions = new Float32Array(pCount * 3);
    for (let pi = 0; pi < pCount; pi++) {
      const ang = (pi / pCount) * Math.PI * 2 + (pi % 7) * 0.4;
      const rad = 1.8 + ((pi * 37) % 100) / 100 * 3.2;
      pPositions[pi * 3] = Math.cos(ang) * rad;
      pPositions[pi * 3 + 1] = 0.25 + ((pi * 53) % 100) / 100 * 2.9;
      pPositions[pi * 3 + 2] = Math.sin(ang) * rad;
    }
    const pGeo = new T.BufferGeometry();
    pGeo.setAttribute('position', new T.BufferAttribute(pPositions, 3));
    const pMat = new T.PointsMaterial({ color: 0x7dd3fc, size: 0.055, transparent: true, opacity: 0.65, depthWrite: false });
    const starField = new T.Points(pGeo, pMat);
    backdropGroup.add(starField);

    // Key, Rim & Accent Studio Lights
    const key = new T.DirectionalLight(0xffffff, 2.4);
    key.position.set(3.2, 5.2, 3.0);
    scene.add(key);
    const rim = new T.DirectionalLight(0x38bdf8, 1.8);
    rim.position.set(-3.2, 2.8, -3.0);
    scene.add(rim);
    const accentFill = new T.PointLight(0xa855f7, 2.2, 10);
    accentFill.position.set(2.8, 1.6, -2.2);
    scene.add(accentFill);

    function applyTheme() {
      const t = THEME_BG[currentTheme()] || THEME_BG.neon;
      const env = getActiveEnvCfg();
      if (scene.background && scene.background.dispose) scene.background.dispose();
      scene.background = makeBgTexture();
      scene.fog = new T.FogExp2(env.fog, env.lightBg ? 0.05 : 0.075);
      renderer.toneMappingExposure = env.lightBg ? 1.06 : t.exposure;
      if (shadowPlaneMat) shadowPlaneMat.opacity = env.lightBg ? 0.42 : t.shadow;
      if (bloomPass) bloomPass.strength = env.lightBg ? 0.14 : (state.bgPreset === 'cyber' ? 0.52 : 0.36);

      rim.color.setHex(env.accent);
      accentFill.color.setHex(env.secondary);
      haloMat1.color.setHex(env.accent);
      haloMat1.opacity = env.lightBg ? 0.28 : 0.42;
      haloMat2.color.setHex(env.secondary);
      haloMat2.opacity = env.lightBg ? 0.18 : 0.28;
      pMat.color.setHex(env.accent);
      pMat.opacity = env.lightBg ? 0.32 : 0.72;
      if (floorGrid.material) {
        floorGrid.material.opacity = state.bgPreset === 'cyber' ? 0.5 : (env.lightBg ? 0.18 : 0.3);
      }
      requestRender();
    }

    // ---------- Contact shadows (port of three.js webgl_shadow_contact) ----------
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
      shader.uniforms.darkness = { value: 1.6 };
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
      scene.overrideMaterial = depthMat;
      const prevClear = renderer.getClearAlpha();
      renderer.setClearAlpha(0);
      renderer.setRenderTarget(rtShadow);
      renderer.clear();
      renderer.render(scene, shadowCam);
      scene.overrideMaterial = null;
      blurShadow(3.2);
      blurShadow(1.2);
      renderer.setRenderTarget(null);
      renderer.setClearAlpha(prevClear);
      shadowPlane.visible = true;
      scene.background = bg;
    }

    // ---------- Post-processing (Bloom) ----------
    let composer = null, bloomPass = null;
    const lowPower = (navigator.hardwareConcurrency || 4) <= 2;
    if (T.EffectComposer && T.RenderPass && T.UnrealBloomPass && !lowPower) {
      composer = new T.EffectComposer(renderer);
      composer.addPass(new T.RenderPass(scene, camera));
      bloomPass = new T.UnrealBloomPass(new T.Vector2(512, 512), 0.22, 0.45, 0.9);
      composer.addPass(bloomPass);
    }

    // ---------- Controls ----------
    let controls = null;
    if (T.OrbitControls) {
      controls = new T.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.rotateSpeed = 0.7;
      controls.zoomSpeed = 0.8;
      controls.enablePan = false;
      controls.minDistance = 1.8;
      controls.maxDistance = 7;
      controls.minPolarAngle = 0.15;
      controls.maxPolarAngle = Math.PI / 2 - 0.04;
      controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      controls.autoRotateSpeed = 0.9;
      controls.target.set(0, 0.5, 0);
      controls.addEventListener('start', () => { controls.autoRotate = false; });
      controls.addEventListener('change', requestRender);
    }
    renderer.domElement.addEventListener('dblclick', () => resetView());

    // ---------- HDRI environment ----------
    const pmrem = new T.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    function setFallbackEnv() {
      // Процедурная студия, если HDRI не загрузилась
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
        state.envSource = 'hdri';
        requestRender();
      }, undefined, () => { setFallbackEnv(); state.envSource = 'procedural'; requestRender(); });
    } else {
      setFallbackEnv();
      state.envSource = 'procedural';
    }

    // ---------- Model loading ----------
    const gltfLoader = T.GLTFLoader ? new T.GLTFLoader() : null;
    const root = new T.Group();
    scene.add(root);
    const clayMat = new T.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.78, metalness: 0.0 });
    const wireMat = new T.MeshBasicMaterial({ color: 0x2563eb, wireframe: true, transparent: true, opacity: 0.85 });

    function loadPart(part) {
      return new Promise((resolve, reject) => {
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

    function buildProceduralScene(sceneType) {
      const group = new T.Group();
      const animators = [];

      function makeScreenTex(title, accent, mode) {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 288;
        const ctx = c.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 512, 288);
        g.addColorStop(0, '#090d1f');
        g.addColorStop(1, '#111b36');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 288);
        ctx.strokeStyle = 'rgba(56,189,248,0.18)';
        for (let x = 0; x < 512; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 288); ctx.stroke(); }
        for (let y = 0; y < 288; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }

        if (mode === 'code') {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(18, 18, 130, 252);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(162, 18, 332, 252);
          const colors = ['#38bdf8', '#c084fc', '#34d399', '#fbbf24', '#f472b6'];
          for (let r = 0; r < 11; r++) {
            ctx.fillStyle = colors[r % colors.length];
            ctx.fillRect(180 + (r % 3) * 18, 36 + r * 20, 75 + ((r * 37) % 160), 9);
          }
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 20px monospace';
          ctx.fillText('AMK SKILLHUB IDE', 28, 52);
          ctx.fillStyle = '#34d399';
          ctx.fillRect(28, 72, 95, 10);
          ctx.fillStyle = '#818cf8';
          ctx.fillRect(28, 94, 78, 10);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(28, 116, 102, 10);
        } else if (mode === 'scope') {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 4;
          ctx.beginPath();
          for (let x = 20; x < 492; x += 4) {
            const y = 144 + Math.sin(x * 0.06) * 58 + Math.sin(x * 0.18) * 18;
            if (x === 20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let x = 20; x < 492; x += 4) {
            const sq = (Math.floor(x / 36) % 2 === 0) ? -42 : 42;
            const y = 144 + sq;
            if (x === 20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 22px monospace';
          ctx.fillText('CAN-BUS 500 kbps · 14.2V', 26, 42);
        } else if (mode === 'design') {
          const rg = ctx.createRadialGradient(256, 144, 15, 256, 144, 130);
          rg.addColorStop(0, '#f43f5e');
          rg.addColorStop(0.5, '#8b5cf6');
          rg.addColorStop(1, '#06b6d4');
          ctx.fillStyle = rg;
          ctx.beginPath(); ctx.arc(256, 144, 96, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.strokeRect(110, 42, 292, 204);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText('CMYK · 300 DPI · BLEED 5mm', 100, 272);
        }
        const tex = new T.CanvasTexture(c);
        tex.encoding = T.sRGBEncoding;
        return tex;
      }

      if (sceneType === 'sport_wheel_garage') {
        // === AUTO WORKSHOP ENVIRONMENT ===
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = 512; floorCanvas.height = 512;
        const fctx = floorCanvas.getContext('2d');
        fctx.fillStyle = '#1d212b';
        fctx.fillRect(0, 0, 512, 512);
        for (let y = 0; y < 512; y += 64) {
          for (let x = 0; x < 512; x += 64) {
            fctx.fillStyle = ((x / 64 + y / 64) % 2 === 0) ? '#232834' : '#181c24';
            fctx.fillRect(x, y, 64, 64);
          }
        }
        fctx.fillStyle = '#f59e0b';
        fctx.fillRect(0, 468, 512, 16);
        const floorTex = new T.CanvasTexture(floorCanvas);
        floorTex.encoding = T.sRGBEncoding;
        const floor = new T.Mesh(
          new T.CylinderGeometry(2.3, 2.3, 0.08, 48),
          new T.MeshStandardMaterial({ map: floorTex, roughness: 0.35, metalness: 0.25 })
        );
        floor.position.y = -0.04;
        group.add(floor);

        // Open 360° Neon Showroom Portal Arch (never blocks camera from behind!)
        const archMat = new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.28, metalness: 0.85 });
        const archOuter = new T.Mesh(new T.TorusGeometry(1.55, 0.06, 16, 64, Math.PI), archMat);
        archOuter.position.set(0, 0.02, -0.85);
        group.add(archOuter);
        const ledTube = new T.Mesh(
          new T.TorusGeometry(1.48, 0.022, 12, 64, Math.PI),
          new T.MeshStandardMaterial({ color: 0xfed7aa, emissive: 0xf97316, emissiveIntensity: 2.4 })
        );
        ledTube.position.set(0, 0.02, -0.84);
        group.add(ledTube);

        // Two-post hydraulic lift columns
        const liftMat = new T.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35, metalness: 0.7 });
        [-1.35, 1.35].forEach((lx) => {
          const post = new T.Mesh(new T.BoxGeometry(0.14, 1.95, 0.14), liftMat);
          post.position.set(lx, 0.98, -0.95);
          group.add(post);
        });

        // Red Mechanic Tool Chest Cabinet
        const chest = new T.Mesh(
          new T.BoxGeometry(0.85, 0.78, 0.42),
          new T.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.28, metalness: 0.55 })
        );
        chest.position.set(-1.1, 0.39, -0.82);
        chest.rotation.y = 0.28;
        group.add(chest);
        for (let d = 0; d < 4; d++) {
          const handle = new T.Mesh(
            new T.BoxGeometry(0.62, 0.03, 0.03),
            new T.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.18 })
          );
          handle.position.set(-1.05, 0.16 + d * 0.16, -0.61);
          handle.rotation.y = 0.28;
          group.add(handle);
        }

        // Display Podium Stand
        const stand = new T.Mesh(
          new T.CylinderGeometry(0.65, 0.78, 0.12, 32),
          new T.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.8 })
        );
        stand.position.y = 0.06;
        group.add(stand);
        const standRing = new T.Mesh(
          new T.TorusGeometry(0.71, 0.014, 12, 48),
          new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.0 })
        );
        standRing.rotation.x = Math.PI / 2;
        standRing.position.y = 0.12;
        group.add(standRing);

        // === HERO: FORGED 10-SPOKE SPORT ALLOY WHEEL + BREMBO BRAKE ===
        const wheelAssembly = new T.Group();
        wheelAssembly.position.set(0, 0.92, 0.05);
        wheelAssembly.rotation.y = -0.32;
        group.add(wheelAssembly);

        const spinGroup = new T.Group();
        wheelAssembly.add(spinGroup);

        // Low-profile Sport Tire (matte carbon rubber)
        const tireMat = new T.MeshStandardMaterial({ color: 0x16181e, roughness: 0.86, metalness: 0.06 });
        const tire = new T.Mesh(new T.TorusGeometry(0.62, 0.19, 28, 64), tireMat);
        spinGroup.add(tire);

        // Tread ribs around tire
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * Math.PI * 2;
          const rib = new T.Mesh(new T.BoxGeometry(0.035, 0.04, 0.34), tireMat);
          rib.position.set(Math.cos(a) * 0.805, Math.sin(a) * 0.805, 0);
          rib.rotation.z = a + Math.PI / 2;
          spinGroup.add(rib);
        }

        // Polished Machined Chrome Outer Barrel & Rim Lip
        const chromeMat = new T.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.96, roughness: 0.12 });
        const gunmetalMat = new T.MeshStandardMaterial({ color: 0x334155, metalness: 0.88, roughness: 0.22 });

        const barrel = new T.Mesh(new T.CylinderGeometry(0.49, 0.49, 0.34, 48, 1, true), gunmetalMat);
        barrel.rotation.x = Math.PI / 2;
        spinGroup.add(barrel);

        const frontLip = new T.Mesh(new T.TorusGeometry(0.49, 0.028, 16, 48), chromeMat);
        frontLip.position.z = 0.165;
        spinGroup.add(frontLip);

        // 10 Y-Spokes (Forged Sport Pattern)
        for (let i = 0; i < 5; i++) {
          const baseA = (i / 5) * Math.PI * 2;
          [-0.17, 0.17].forEach((offset) => {
            const a = baseA + offset;
            const spoke = new T.Mesh(new T.BoxGeometry(0.048, 0.42, 0.042), gunmetalMat);
            spoke.position.set(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0.12);
            spoke.rotation.z = a - Math.PI / 2;
            spinGroup.add(spoke);

            const accentStrip = new T.Mesh(new T.BoxGeometry(0.018, 0.40, 0.012), chromeMat);
            accentStrip.position.set(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0.145);
            accentStrip.rotation.z = a - Math.PI / 2;
            spinGroup.add(accentStrip);
          });
        }

        // Center Hub + Carbon Cap + 5 Chrome Lug Nuts
        const hub = new T.Mesh(new T.CylinderGeometry(0.14, 0.16, 0.14, 24), gunmetalMat);
        hub.rotation.x = Math.PI / 2;
        hub.position.z = 0.11;
        spinGroup.add(hub);

        const cap = new T.Mesh(
          new T.CylinderGeometry(0.065, 0.065, 0.03, 24),
          new T.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.22 })
        );
        cap.rotation.x = Math.PI / 2;
        cap.position.z = 0.18;
        spinGroup.add(cap);

        for (let n = 0; n < 5; n++) {
          const a = (n / 5) * Math.PI * 2;
          const nut = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.04, 6), chromeMat);
          nut.rotation.x = Math.PI / 2;
          nut.position.set(Math.cos(a) * 0.105, Math.sin(a) * 0.105, 0.175);
          spinGroup.add(nut);
        }

        // Drilled Ventilated Brake Rotor (behind spokes)
        const rotor = new T.Mesh(
          new T.CylinderGeometry(0.37, 0.37, 0.045, 40),
          new T.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.92, roughness: 0.26 })
        );
        rotor.rotation.x = Math.PI / 2;
        rotor.position.z = -0.02;
        spinGroup.add(rotor);

        // Fixed Brembo-Red Sport Brake Caliper (doesn't spin!)
        const caliper = new T.Mesh(
          new T.BoxGeometry(0.16, 0.34, 0.15),
          new T.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.22, metalness: 0.45, emissive: 0x4c0519, emissiveIntensity: 0.4 })
        );
        caliper.position.set(0.32, 0.08, -0.01);
        caliper.rotation.z = -0.25;
        wheelAssembly.add(caliper);

        // Subtle warm/cool garage lights
        const gLight1 = new T.PointLight(0x38bdf8, 3.2, 5);
        gLight1.position.set(1.4, 1.8, 1.2);
        group.add(gLight1);
        const gLight2 = new T.PointLight(0xf59e0b, 2.4, 5);
        gLight2.position.set(-1.5, 1.4, 0.8);
        group.add(gLight2);

        animators.push((t) => { spinGroup.rotation.z = -t * 0.42; });
      } else if (sceneType === 'gaming_room_rig') {
        // === CYBER GAMING ROOM ENVIRONMENT ===
        const floor = new T.Mesh(
          new T.CylinderGeometry(1.78, 1.88, 0.09, 48),
          new T.MeshStandardMaterial({ color: 0x0b1020, roughness: 0.24, metalness: 0.72 })
        );
        floor.position.y = -0.045;
        group.add(floor);
        const floorRim = new T.Mesh(
          new T.TorusGeometry(1.81, 0.016, 12, 64),
          new T.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 2.2 })
        );
        floorRim.rotation.x = Math.PI / 2;
        floorRim.position.y = 0.004;
        group.add(floorRim);

        // Open 360° Translucent Holographic Cyber Frame (never blocks rear orbit)
        const wall = new T.Mesh(
          new T.TorusGeometry(1.45, 0.03, 12, 64, Math.PI),
          new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.85 })
        );
        wall.position.set(0, 0.1, -0.95);
        group.add(wall);

        const rgbStrips = [];
        [
          { pos: [-0.85, 1.48, -0.99], rot: 0.35, color: 0x38bdf8 },
          { pos: [0, 1.65, -0.99], rot: 0, color: 0xa855f7 },
          { pos: [0.85, 1.48, -0.99], rot: -0.35, color: 0xec4899 },
        ].forEach((s) => {
          const mat = new T.MeshStandardMaterial({ color: s.color, emissive: s.color, emissiveIntensity: 2.4 });
          const bar = new T.Mesh(new T.BoxGeometry(0.68, 0.045, 0.03), mat);
          bar.position.set(...s.pos);
          bar.rotation.z = s.rot;
          group.add(bar);
          rgbStrips.push(mat);
        });

        // Carbon Gaming Desk
        const deskTop = new T.Mesh(
          new T.BoxGeometry(2.3, 0.065, 1.15),
          new T.MeshStandardMaterial({ color: 0x181c28, roughness: 0.32, metalness: 0.45 })
        );
        deskTop.position.set(0, 0.72, -0.15);
        group.add(deskTop);

        // Desk RGB Underglow Edge Strip
        const deskLedMat = new T.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 2.5 });
        const deskLed = new T.Mesh(new T.BoxGeometry(2.32, 0.02, 0.02), deskLedMat);
        deskLed.position.set(0, 0.71, 0.43);
        group.add(deskLed);
        rgbStrips.push(deskLedMat);

        // Desk Legs
        const legMat = new T.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
        [[-1.02, -0.58], [1.02, -0.58], [-1.02, 0.28], [1.02, 0.28]].forEach(([x, z]) => {
          const leg = new T.Mesh(new T.BoxGeometry(0.06, 0.72, 0.06), legMat);
          leg.position.set(x, 0.36, z);
          group.add(leg);
        });

        // XXL Deskmat
        const matMesh = new T.Mesh(
          new T.BoxGeometry(1.32, 0.008, 0.56),
          new T.MeshStandardMaterial({ color: 0x0b1120, roughness: 0.9 })
        );
        matMesh.position.set(-0.22, 0.757, 0.08);
        group.add(matMesh);

        // === HERO 1: POWERFUL GAMING LAPTOP (LEFT-CENTER) ===
        const laptop = new T.Group();
        laptop.position.set(-0.28, 0.765, 0.05);
        laptop.rotation.y = 0.14;
        group.add(laptop);

        const chassisMat = new T.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.22 });
        const base = new T.Mesh(new T.BoxGeometry(0.62, 0.028, 0.42), chassisMat);
        laptop.add(base);

        // Glowing RGB Keyboard Deck
        const kbMat = new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x6366f1, emissiveIntensity: 1.4, roughness: 0.4 });
        const kb = new T.Mesh(new T.BoxGeometry(0.52, 0.006, 0.22), kbMat);
        kb.position.set(0, 0.017, -0.02);
        laptop.add(kb);
        rgbStrips.push(kbMat);

        // Tilted Laptop Lid with Glowing IDE Screen
        const lidGroup = new T.Group();
        lidGroup.position.set(0, 0.014, -0.205);
        lidGroup.rotation.x = -0.26;
        laptop.add(lidGroup);
        const lid = new T.Mesh(new T.BoxGeometry(0.62, 0.39, 0.016), chassisMat);
        lid.position.y = 0.195;
        lidGroup.add(lid);
        const screenTex = makeScreenTex('AMK IDE', '#38bdf8', 'code');
        const screen = new T.Mesh(
          new T.PlaneGeometry(0.57, 0.34),
          new T.MeshStandardMaterial({ map: screenTex, emissiveMap: screenTex, emissive: 0xffffff, emissiveIntensity: 0.95, roughness: 0.15 })
        );
        screen.position.set(0, 0.198, 0.01);
        lidGroup.add(screen);

        // === HERO 2: ULTRA-WIDE CURVED MONITOR (BEHIND) ===
        const monStand = new T.Mesh(new T.BoxGeometry(0.08, 0.24, 0.06), legMat);
        monStand.position.set(-0.22, 0.87, -0.48);
        group.add(monStand);
        const monFrame = new T.Mesh(new T.BoxGeometry(1.16, 0.48, 0.03), chassisMat);
        monFrame.position.set(-0.22, 1.15, -0.45);
        group.add(monFrame);
        const monScreen = new T.Mesh(
          new T.PlaneGeometry(1.11, 0.43),
          new T.MeshStandardMaterial({ map: screenTex, emissiveMap: screenTex, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.15 })
        );
        monScreen.position.set(-0.22, 1.15, -0.433);
        group.add(monScreen);

        // === HERO 3: TEMPERED GLASS RGB GAMING PC TOWER (RIGHT) ===
        const pc = new T.Group();
        pc.position.set(0.76, 1.05, -0.14);
        pc.rotation.y = -0.22;
        group.add(pc);
        const pcBody = new T.Mesh(
          new T.BoxGeometry(0.36, 0.62, 0.62),
          new T.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.78, roughness: 0.24 })
        );
        pc.add(pcBody);
        const glass = new T.Mesh(
          new T.PlaneGeometry(0.54, 0.54),
          new T.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.18, roughness: 0.06, metalness: 0.9 })
        );
        glass.rotation.y = -Math.PI / 2;
        glass.position.x = -0.182;
        pc.add(glass);

        // 3 Front Glowing RGB Cooling Fans
        const fans = [];
        for (let f = 0; f < 3; f++) {
          const fanRingMat = new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.2 });
          const ring = new T.Mesh(new T.TorusGeometry(0.075, 0.012, 12, 28), fanRingMat);
          ring.position.set(0, -0.17 + f * 0.17, 0.315);
          pc.add(ring);
          rgbStrips.push(fanRingMat);
          const hub = new T.Mesh(new T.BoxGeometry(0.11, 0.02, 0.01), chromeMatSafe(T));
          hub.position.set(0, -0.17 + f * 0.17, 0.314);
          pc.add(hub);
          fans.push(hub);
        }

        // RGB Wireless Gaming Mouse
        const mouse = new T.Mesh(new T.BoxGeometry(0.09, 0.036, 0.15), chassisMat);
        mouse.position.set(0.24, 0.778, 0.16);
        group.add(mouse);
        const mouseLed = new T.Mesh(new T.BoxGeometry(0.02, 0.01, 0.06), deskLedMat);
        mouseLed.position.set(0.24, 0.798, 0.16);
        group.add(mouseLed);

        // Neon Room Point Lights
        const nl1 = new T.PointLight(0x38bdf8, 3.0, 5);
        nl1.position.set(-1.1, 1.6, 0.8);
        group.add(nl1);
        const nl2 = new T.PointLight(0xc084fc, 2.8, 5);
        nl2.position.set(1.2, 1.5, 0.9);
        group.add(nl2);

        animators.push((t) => {
          const hue = (t * 0.08) % 1;
          const col = new T.Color().setHSL(hue, 0.9, 0.56);
          rgbStrips.forEach((m, idx) => {
            const c2 = new T.Color().setHSL((hue + idx * 0.14) % 1, 0.92, 0.58);
            m.emissive.copy(c2);
            m.color.copy(c2);
          });
          fans.forEach((fan) => { fan.rotation.z = t * 5.2; });
          nl2.color.copy(col);
        });
      } else if (sceneType === 'autoelectric_lab') {
        const floor = new T.Mesh(
          new T.CylinderGeometry(1.75, 1.85, 0.09, 48),
          new T.MeshStandardMaterial({ color: 0x0b1520, roughness: 0.26, metalness: 0.68 })
        );
        floor.position.y = -0.045;
        group.add(floor);
        const floorRim = new T.Mesh(
          new T.TorusGeometry(1.78, 0.016, 12, 64),
          new T.MeshStandardMaterial({ color: 0x34d399, emissive: 0x34d399, emissiveIntensity: 2.0 })
        );
        floorRim.rotation.x = Math.PI / 2;
        floorRim.position.y = 0.004;
        group.add(floorRim);
        // ESD Anti-Static Bench
        const bench = new T.Mesh(
          new T.BoxGeometry(2.1, 0.08, 1.15),
          new T.MeshStandardMaterial({ color: 0x0f2942, roughness: 0.65, metalness: 0.2 })
        );
        bench.position.set(0, 0.55, 0);
        group.add(bench);
        // Pro Digital Oscilloscope & Diagnostic Station
        const scopeBody = new T.Mesh(
          new T.BoxGeometry(1.08, 0.66, 0.34),
          new T.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.3 })
        );
        scopeBody.position.set(-0.18, 0.92, -0.08);
        group.add(scopeBody);
        const sTex = makeScreenTex('CAN-BUS', '#34d399', 'scope');
        const sMesh = new T.Mesh(
          new T.PlaneGeometry(0.72, 0.46),
          new T.MeshStandardMaterial({ map: sTex, emissiveMap: sTex, emissive: 0xffffff, emissiveIntensity: 1.0 })
        );
        sMesh.position.set(-0.32, 0.94, 0.095);
        group.add(sMesh);
        // Knobs
        for (let k = 0; k < 4; k++) {
          const knob = new T.Mesh(new T.CylinderGeometry(0.036, 0.04, 0.05, 20), chromeMatSafe(T));
          knob.rotation.x = Math.PI / 2;
          knob.position.set(0.22, 0.74 + k * 0.12, 0.11);
          group.add(knob);
        }
        // Smart Digital Multimeter beside it
        const multi = new T.Mesh(
          new T.BoxGeometry(0.32, 0.52, 0.12),
          new T.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.42, metalness: 0.2 })
        );
        multi.position.set(0.68, 0.85, 0.12);
        multi.rotation.y = -0.35;
        multi.rotation.x = -0.25;
        group.add(multi);
        const led = new T.PointLight(0x34d399, 2.8, 5);
        led.position.set(0, 1.8, 1.2);
        group.add(led);
      } else if (sceneType === 'hvac_rooftop') {
        const floor = new T.Mesh(
          new T.CylinderGeometry(1.75, 1.85, 0.09, 48),
          new T.MeshStandardMaterial({ color: 0x0d1726, roughness: 0.28, metalness: 0.65 })
        );
        floor.position.y = -0.045;
        group.add(floor);
        const floorRim = new T.Mesh(
          new T.TorusGeometry(1.78, 0.016, 12, 64),
          new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.0 })
        );
        floorRim.rotation.x = Math.PI / 2;
        floorRim.position.y = 0.004;
        group.add(floorRim);
        // Inverter Condenser Unit
        const box = new T.Mesh(
          new T.BoxGeometry(1.36, 0.98, 0.56),
          new T.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.45 })
        );
        box.position.set(-0.1, 0.56, 0);
        group.add(box);
        const grille = new T.Mesh(
          new T.TorusGeometry(0.36, 0.025, 14, 36),
          new T.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
        );
        grille.position.set(-0.28, 0.58, 0.285);
        group.add(grille);
        const fan = new T.Group();
        fan.position.set(-0.28, 0.58, 0.27);
        group.add(fan);
        const bladeMat = new T.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.65, roughness: 0.25 });
        for (let b = 0; b < 5; b++) {
          const a = (b / 5) * Math.PI * 2;
          const blade = new T.Mesh(new T.BoxGeometry(0.09, 0.31, 0.02), bladeMat);
          blade.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0);
          blade.rotation.z = a + Math.PI / 2;
          blade.rotation.y = 0.25;
          fan.add(blade);
        }
        // Copper Refrigerant Coils & Pressure Manifold Gauges
        const copperMat = new T.MeshStandardMaterial({ color: 0xd97706, metalness: 0.92, roughness: 0.22 });
        const pipe1 = new T.Mesh(new T.CylinderGeometry(0.032, 0.032, 0.72, 16), copperMat);
        pipe1.position.set(0.74, 0.42, 0.1);
        group.add(pipe1);
        const lpGauge = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.05, 24), new T.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.6 }));
        lpGauge.rotation.x = Math.PI / 2;
        lpGauge.position.set(0.68, 0.82, 0.12);
        group.add(lpGauge);
        const hpGauge = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.05, 24), new T.MeshStandardMaterial({ color: 0xe11d48, emissive: 0xe11d48, emissiveIntensity: 0.6 }));
        hpGauge.rotation.x = Math.PI / 2;
        hpGauge.position.set(0.92, 0.82, 0.12);
        group.add(hpGauge);
        animators.push((t) => { fan.rotation.z = -t * 3.8; });
      } else {
        // === DESIGN STUDIO ===
        const floor = new T.Mesh(
          new T.CylinderGeometry(1.72, 1.82, 0.09, 48),
          new T.MeshStandardMaterial({ color: 0x120d22, roughness: 0.24, metalness: 0.72 })
        );
        floor.position.y = -0.045;
        group.add(floor);
        const floorRim = new T.Mesh(
          new T.TorusGeometry(1.75, 0.016, 12, 64),
          new T.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xf472b6, emissiveIntensity: 2.2 })
        );
        floorRim.rotation.x = Math.PI / 2;
        floorRim.position.y = 0.004;
        group.add(floorRim);
        const desk = new T.Mesh(
          new T.BoxGeometry(2.1, 0.07, 1.1),
          new T.MeshStandardMaterial({ color: 0x452c1e, roughness: 0.55 })
        );
        desk.position.set(0, 0.55, 0);
        group.add(desk);
        // Pro Pen Display Tablet
        const tablet = new T.Group();
        tablet.position.set(-0.12, 0.84, 0);
        tablet.rotation.x = -0.42;
        group.add(tablet);
        const body = new T.Mesh(new T.BoxGeometry(1.18, 0.72, 0.035), new T.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.75, roughness: 0.25 }));
        tablet.add(body);
        const dTex = makeScreenTex('CMYK', '#f43f5e', 'design');
        const scr = new T.Mesh(new T.PlaneGeometry(1.08, 0.63), new T.MeshStandardMaterial({ map: dTex, emissiveMap: dTex, emissive: 0xffffff, emissiveIntensity: 0.9 }));
        scr.position.z = 0.02;
        tablet.add(scr);
        // Pantone Swatches
        [0x06b6d4, 0xec4899, 0xfacc15, 0x8b5cf6].forEach((col, idx) => {
          const sw = new T.Mesh(new T.BoxGeometry(0.14, 0.36, 0.015), new T.MeshStandardMaterial({ color: col, roughness: 0.35 }));
          sw.position.set(0.76, 0.62, 0.16);
          sw.rotation.x = -Math.PI / 2;
          sw.rotation.z = -0.35 + idx * 0.24;
          group.add(sw);
        });
      }

      return { group, animators };
    }

    function chromeMatSafe(T) {
      return new T.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.94, roughness: 0.14 });
    }

    async function buildItem(i) {
      if (state.loaded[i]) return state.loaded[i];
      if (state.pending[i]) return state.pending[i];
      state.pending[i] = (async () => {
        const it = items[i];
        const wrap = new T.Group();
        let animators = [];
        if (it.sceneType) {
          const built = buildProceduralScene(it.sceneType);
          wrap.add(built.group);
          animators = built.animators || [];
          normalize(wrap, it.size || 2.35);
        } else {
          const group = new T.Group();
          const parts = await Promise.all(it.parts.map(loadPart));
          parts.forEach((sceneObj, pi) => {
            const p = it.parts[pi];
            const holder = new T.Group();
            if (p.rotation) sceneObj.rotation.set(...p.rotation);
            holder.add(sceneObj);
            normalize(holder, p.size || 1.6);
            if (p.offset) holder.position.add(new T.Vector3(...p.offset));
            group.add(holder);
          });
          wrap.add(group);
          normalize(wrap, it.size || 1.9);
        }

        const meshes = [];
        let maps = { normal: 0, rough: 0, ao: 0, color: 0 };
        wrap.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = true;
          o.receiveShadow = true;
          const m = o.material;
          if (m) {
            if (m.normalMap) maps.normal++;
            if (m.roughnessMap) maps.rough++;
            if (m.aoMap) maps.ao++;
            if (m.map) maps.color++;
            m.envMapIntensity = it.envIntensity || 1.0;
            if (m.aoMap && o.geometry && !o.geometry.attributes.uv2 && o.geometry.attributes.uv) {
              o.geometry.setAttribute('uv2', o.geometry.attributes.uv);
            }
            m.needsUpdate = true;
          }
          o.userData.photoMat = m;
          o.userData.clayMat = clayMat.clone();
          if (m && m.normalMap) {
            o.userData.clayMat.normalMap = m.normalMap;
            o.userData.clayMat.normalScale = m.normalScale ? m.normalScale.clone() : new T.Vector2(1, 1);
          }
          meshes.push(o);
        });
        const entry = { object: wrap, meshes, maps, animators };
        state.loaded[i] = entry;
        delete state.pending[i];
        return entry;
      })();
      try {
        return await state.pending[i];
      } catch (e) {
        delete state.pending[i];
        throw e;
      }
    }

    function applyMode() {
      const entry = state.loaded[state.active];
      if (!entry) return;
      entry.meshes.forEach((m) => {
        m.material = state.mode === 'clay' ? m.userData.clayMat : state.mode === 'wire' ? wireMat : m.userData.photoMat;
      });
      shadowGroup.visible = state.mode !== 'wire';
      requestRender();
    }

    function frame(entry) {
      const box = new T.Box3().setFromObject(entry.object);
      const size = box.getSize(new T.Vector3());
      const center = box.getCenter(new T.Vector3());
      const dist = Math.max(size.x, size.y * 1.2, size.z) * 1.52 + 0.45;
      if (controls) controls.target.copy(center);
      state.home = { target: center.clone(), pos: new T.Vector3(center.x + dist * 0.52, center.y + dist * 0.28, center.z + dist * 0.82) };
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

    let loadToken = 0;
    async function show(i) {
      state.active = i;
      const token = ++loadToken;
      tabs.querySelectorAll('[data-pr-tab]').forEach((b) => b.setAttribute('aria-selected', String(Number(b.dataset.prTab) === i)));
      renderInfo(i);
      if (!items[i].sceneType && !gltfLoader) { loader.textContent = 'GLTFLoader не найден'; return; }
      loader.hidden = false;
      state.ready = false;
      try {
        const entry = await buildItem(i);
        if (token !== loadToken) return;
        while (root.children.length) root.remove(root.children[0]);
        root.add(entry.object);
        applyTheme();
        frame(entry);
        applyMode();
        shadowDirty = true;
        state.ready = true;
        state.activeMaps = entry.maps;
        state.activeMeshes = entry.meshes.length;
        loader.hidden = true;
        container.dispatchEvent(new CustomEvent('photoreal:ready', { detail: { index: i } }));
        // фоновая подгрузка соседней модели
        const next = (i + 1) % items.length;
        if (!state.loaded[next] && 'requestIdleCallback' in window) {
          requestIdleCallback(() => buildItem(next).catch(() => {}));
        }
      } catch (err) {
        state.errors.push(String(err && err.message || err));
        loader.innerHTML = 'Не удалось загрузить 3D-сцену. Проверьте соединение.';
      }
      requestRender();
    }

    // ---------- Resize / render loop (только когда видно) ----------
    function resize() {
      const w = canvasHost.clientWidth || 600;
      const h = canvasHost.clientHeight || 420;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (composer) composer.setSize(w, h);
      requestRender();
    }
    const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvasHost); else window.addEventListener('resize', resize);

    let needsRender = true, shadowDirty = true, rafId = 0;
    function requestRender() { needsRender = true; }
    let frames = 0;
    const t0 = performance.now();
    function loop() {
      rafId = requestAnimationFrame(loop);
      if (!state.visible || document.hidden) return;
      let changed = false;
      const activeEntry = state.loaded[state.active];
      const sec = (performance.now() - t0) * 0.001;
      if (starField) {
        starField.rotation.y = sec * 0.08;
        haloRing1.rotation.z = sec * 0.14;
        haloRing2.rotation.z = -sec * 0.1;
        changed = true;
      }
      if (activeEntry && activeEntry.animators && activeEntry.animators.length) {
        activeEntry.animators.forEach((fn) => fn(sec));
        changed = true;
      }
      if (controls) changed = controls.update() || controls.autoRotate || changed;
      if (!changed && !needsRender) return;
      needsRender = false;
      if (shadowDirty && state.mode !== 'wire' && state.ready) {
        renderContactShadow();
        shadowDirty = false;
      }
      if (composer && state.mode === 'photo') composer.render();
      else renderer.render(scene, camera);
      frames++;
      state.frames = frames;
    }

    // ---------- UI events ----------
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pr-tab]');
      if (b) show(Number(b.dataset.prTab));
    });
    tabs.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = (state.active + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length;
      show(n);
      tabs.querySelector(`[data-pr-tab="${n}"]`).focus();
    });
    modes.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pr-mode]');
      if (!b) return;
      state.mode = b.dataset.prMode;
      modes.querySelectorAll('[data-pr-mode]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      applyMode();
    });
    bgSwitcher.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pr-bg]');
      if (!b) return;
      state.bgPreset = b.dataset.prBg;
      bgSwitcher.querySelectorAll('[data-pr-bg]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      applyTheme();
    });
    const cleanupListeners = [
      () => document.removeEventListener('amk:theme', applyTheme)
    ];
    if (!ro) cleanupListeners.push(() => window.removeEventListener('resize', resize));
    document.addEventListener('amk:theme', applyTheme);

    let io = null;
    function dispose() {
      cancelAnimationFrame(rafId);
      if (io && typeof io.disconnect === 'function') io.disconnect();
      if (typeof window.disposeThreeScene === 'function') {
        window.disposeThreeScene({
          rafId,
          resizeObserver: ro,
          scene,
          renderer,
          controls,
          composer,
          rtShadow,
          rtBlur,
          cleanupListeners
        });
      } else {
        cleanupListeners.forEach((fn) => { try { fn(); } catch (e) {} });
        if (ro) ro.disconnect();
        try { controls?.dispose(); } catch (e) {}
        try { renderer.dispose(); } catch (e) {}
      }
    }
    const onPageHide = () => dispose();
    window.addEventListener('pagehide', onPageHide);
    cleanupListeners.push(() => window.removeEventListener('pagehide', onPageHide));

    applyTheme();
    resize();
    let started = false;
    const start = () => { if (!started) { started = true; show(0); } };
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          state.visible = en.isIntersecting;
          if (en.isIntersecting) { start(); requestRender(); }
        });
      }, { rootMargin: '200px' });
      io.observe(container);
    } else {
      state.visible = true;
      start();
    }
    loop();

    state.show = show;
    state.setMode = (m) => { const b = modes.querySelector(`[data-pr-mode="${m}"]`); if (b) b.click(); };
    state.dispose = dispose;
    return state;
  }

  return { mount };
})();
