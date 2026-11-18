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
    light: { top: '#f7f5f0', bottom: '#e4dfd5', exposure: 1.0, shadow: 0.55 },
    graphite: { top: '#34353b', bottom: '#1c1d21', exposure: 1.08, shadow: 0.75 },
    neon: { top: '#13161f', bottom: '#05060a', exposure: 1.12, shadow: 0.8 },
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
        m === 'photo' ? 'Final Photo-Real' : m === 'clay' ? 'Clay' : 'Wireframe'}</button>`).join(''));
    const label = el('div', { class: 'pr-label' });
    const loader = el('div', { class: 'pr-loader', role: 'status' }, '<span class="pr-spinner"></span><span class="pr-loader-text">Загрузка 3D-скана…</span>');
    const hint = el('div', { class: 'pr-hint' }, 'Вращайте · Колесо — зум · Двойной клик — сброс');
    stage.append(canvasHost, label, modes, loader, hint);

    const info = el('div', { class: 'pr-info' });
    container.append(tabs, stage, info);

    const state = {
      active: 0, mode: 'photo', loaded: {}, pending: {}, ready: false, visible: false,
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

    function makeBgTexture() {
      const t = THEME_BG[currentTheme()] || THEME_BG.light;
      const c = document.createElement('canvas');
      c.width = 4; c.height = 256;
      const g = c.getContext('2d');
      const grad = g.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, t.top);
      grad.addColorStop(1, t.bottom);
      g.fillStyle = grad;
      g.fillRect(0, 0, 4, 256);
      const tex = new T.CanvasTexture(c);
      tex.encoding = T.sRGBEncoding;
      return tex;
    }
    function applyTheme() {
      const t = THEME_BG[currentTheme()] || THEME_BG.light;
      if (scene.background && scene.background.dispose) scene.background.dispose();
      scene.background = makeBgTexture();
      renderer.toneMappingExposure = t.exposure;
      if (shadowPlaneMat) shadowPlaneMat.opacity = t.shadow;
      if (bloomPass) bloomPass.strength = currentTheme() === 'neon' ? 0.42 : 0.22;
      requestRender();
    }

    // Key light for crisp shading (HDRI gives reflections/ambient)
    const key = new T.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 5, 2.5);
    scene.add(key);
    const rim = new T.DirectionalLight(0xdbeafe, 1.1);
    rim.position.set(-3, 2.5, -3);
    scene.add(rim);

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

    async function buildItem(i) {
      if (state.loaded[i]) return state.loaded[i];
      if (state.pending[i]) return state.pending[i];
      state.pending[i] = (async () => {
        const it = items[i];
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
        // Итоговая нормализация всей композиции
        const wrap = new T.Group();
        wrap.add(group);
        normalize(wrap, it.size || 1.9);

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
            // aoMap в glTF использует uv2 — дублируем uv при отсутствии
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
        const entry = { object: wrap, meshes, maps };
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
      const dist = Math.max(size.x, size.y * 1.28, size.z) * 1.95 + 0.65;
      if (controls) controls.target.copy(center);
      state.home = { target: center.clone(), pos: new T.Vector3(center.x + dist * 0.62, center.y + dist * 0.34, center.z + dist * 0.72) };
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
      if (!gltfLoader) { loader.textContent = 'GLTFLoader не найден'; return; }
      loader.hidden = false;
      state.ready = false;
      try {
        const entry = await buildItem(i);
        if (token !== loadToken) return;
        while (root.children.length) root.remove(root.children[0]);
        root.add(entry.object);
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
        loader.innerHTML = 'Не удалось загрузить 3D-скан. Проверьте соединение.';
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
    function loop() {
      rafId = requestAnimationFrame(loop);
      if (!state.visible || document.hidden) return;
      let changed = false;
      if (controls) changed = controls.update() || controls.autoRotate;
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
    document.addEventListener('amk:theme', applyTheme);
    window.addEventListener('pagehide', () => {
      cancelAnimationFrame(rafId);
      try { renderer.dispose(); } catch (e) {}
    });

    applyTheme();
    resize();
    let started = false;
    const start = () => { if (!started) { started = true; show(0); } };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          state.visible = en.isIntersecting;
          if (en.isIntersecting) { start(); requestRender(); }
        });
      }, { rootMargin: '200px' }).observe(container);
    } else {
      state.visible = true;
      start();
    }
    loop();

    state.show = show;
    state.setMode = (m) => { const b = modes.querySelector(`[data-pr-mode="${m}"]`); if (b) b.click(); };
    return state;
  }

  return { mount };
})();
