/**
 * AMK SkillHub · True WebGL 3D Photoreal Showcase (Three.js r128)
 * - Режим по умолчанию «Фотореал 3D»: реальные 8K-сцены мастерских и студий АМК,
 *   реконструированные в настоящую 3D-геометрию рельефа (56 000+ треугольников)
 *   по нейросетевым картам глубины Depth-Anything-V2 с перспективной развёрткой,
 *   живым 3D-светом, частицами в объёме, 3D-камерой OrbitControls и 3D-точками узлов (hotspots).
 * - Режимы «Глина 3D» и «Сетка 3D»: инспекция реальной 3D-геометрии рельефа.
 * - Режим «Скан 360°»: реальные фотограмметрические PBR-сканы Poly Haven (CC0) на 360°.
 */
window.PhotorealShowcase = (function () {
  'use strict';

  const BG_PRESETS = {
    atmosphere: {
      label: 'Реал HDR',
      bgHex: 0x070b14,
      hemiSky: 0xffffff, hemiGround: 0xdbeafe, hemiInt: 0.78,
      keyColor: 0xffffff, keyInt: 0.36,
      rimColor: 0x7dd3fc, rimInt: 0.26,
      cursorColor: 0x38bdf8, cursorInt: 0.32,
      emissiveInt: 0.22,
      exposure: 1.0,
      particleColor: 0x7dd3fc,
    },
    sunset: {
      label: 'Закат',
      bgHex: 0x160a1c,
      hemiSky: 0xffedd5, hemiGround: 0x6b21a8, hemiInt: 0.72,
      keyColor: 0xfb923c, keyInt: 0.72,
      rimColor: 0xc084fc, rimInt: 0.58,
      cursorColor: 0xf97316, cursorInt: 0.55,
      emissiveInt: 0.14,
      exposure: 1.02,
      particleColor: 0xfdba74,
    },
    cyber: {
      label: 'Кибер-свет',
      bgHex: 0x040714,
      hemiSky: 0xbae6fd, hemiGround: 0x312e81, hemiInt: 0.66,
      keyColor: 0x38bdf8, keyInt: 0.65,
      rimColor: 0xe879f9, rimInt: 0.68,
      cursorColor: 0x22d3ee, cursorInt: 0.62,
      emissiveInt: 0.13,
      exposure: 1.0,
      particleColor: 0x22d3ee,
    },
    studio: {
      label: 'Дневной',
      bgHex: 0x1e293b,
      hemiSky: 0xffffff, hemiGround: 0xf1f5f9, hemiInt: 0.96,
      keyColor: 0xfffbeb, keyInt: 0.45,
      rimColor: 0x93c5fd, rimInt: 0.28,
      cursorColor: 0xffffff, cursorInt: 0.3,
      emissiveInt: 0.28,
      exposure: 1.06,
      particleColor: 0xe2e8f0,
    },
  };

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

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('Image load failed: ' + url));
      img.src = url;
    });
  }

  function mount(container, items, opts) {
    opts = opts || {};
    if (!container || !items || !items.length) return null;
    const T = window.THREE;

    container.classList.add('pr-showcase');
    container.innerHTML = '';

    // Tabs
    const tabs = el('div', { class: 'pr-tabs', role: 'tablist', 'aria-label': '3D-сцены по курсам' });
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

    // Stage
    const stage = el('div', { class: 'pr-stage pr-stage--3d' });
    const canvasHost = el('div', { class: 'pr-canvas', 'aria-label': 'Интерактивная 3D-сцена WebGL' });
    const hotspotsLayer = el('div', { class: 'pr-hotspots pr-hotspots--3d' });

    const label = el('div', { class: 'pr-label' });
    const modes = el('div', { class: 'pr-modes', role: 'group', 'aria-label': 'Режим 3D-рендера' }, [
      { id: 'photo3d', text: 'Фотореал 3D' },
      { id: 'clay3d', text: 'Глина 3D' },
      { id: 'wire3d', text: 'Сетка 3D' },
      { id: 'scan360', text: 'Скан 360°' },
    ].map((m, i) => `<button type="button" class="pr-mode" data-pr-mode="${m.id}" aria-pressed="${i === 0}">${m.text}</button>`).join(''));

    const zoomBar = el('div', { class: 'pr-zoom-bar', role: 'group', 'aria-label': 'Управление 3D-камерой' }, `
      <button type="button" class="pr-zoom-btn" data-pr-zoom="out" title="Отдалить 3D-камеру" aria-label="Отдалить">−</button>
      <button type="button" class="pr-zoom-btn pr-zoom-val" data-pr-zoom="reset" title="Сбросить 3D-ракурс">3D</button>
      <button type="button" class="pr-zoom-btn" data-pr-zoom="in" title="Приблизить 3D-камеру" aria-label="Приблизить">+</button>
    `);

    const bgSwitcher = el('div', { class: 'pr-bg-modes', role: 'group', 'aria-label': '3D-освещение сцены' },
      Object.entries(BG_PRESETS).map(([key, cfg], i) => `<button type="button" class="pr-bg-btn" data-pr-bg="${key}" aria-pressed="${i === 0}">${escapeHtml(cfg.label)}</button>`).join(''));

    const hotspotCard = el('div', { class: 'pr-hotspot-card', hidden: 'true' });
    const loader = el('div', { class: 'pr-loader', role: 'status' }, '<span class="pr-spinner"></span><span class="pr-loader-text">Построение 3D-сцены…</span>');
    const hint = el('div', { class: 'pr-hint' }, 'Вращайте 3D-сцену мышью · Колесо — зум · Кликайте точки узлов');

    stage.append(canvasHost, hotspotsLayer, label, modes, zoomBar, bgSwitcher, hotspotCard, loader, hint);

    const info = el('div', { class: 'pr-info' });
    container.append(tabs, stage, info);

    const state = {
      active: 0,
      mode: 'photo3d',
      bgPreset: 'atmosphere',
      activeHotspot: -1,
      ready: false,
      visible: true,
      errors: [],
      envReady: false,
      renderer: null,
      frames: 0,
      activeTriangles: 0,
      activeMeshes: 0,
      depthLoaded: {},
      scanLoaded: {},
      scanPending: {},
    };
    container.__photoreal = state;

    function renderInfo(i) {
      const it = items[i];
      const list = it.hotspots || [];
      label.innerHTML = `<b>${escapeHtml(it.course)}</b><span>${escapeHtml(it.title)}</span>`;
      const chipsHtml = list.length ? `
        <div class="pr-parts-block">
          <div class="pr-parts-label">3D-разбор узлов (клик — подлёт камеры)</div>
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
        <div class="pr-info-meta">3D-движок: <a href="${safeHref(it.sourceUrl)}">${escapeHtml(it.source)}</a> · WebGL + Depth 3D + CC0</div>
        <a class="pr-info-cta" href="${safeHref(it.href)}">${escapeHtml(it.cta)} →</a>`;
    }
    renderInfo(0);

    if (!T || !hasWebGL()) {
      loader.innerHTML = 'WebGL недоступен — откройте страницу в современном браузере.';
      state.errors.push('no-webgl');
      return state;
    }

    // ==================== THREE.JS WEBGL 3D ENGINE ====================
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    state.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    canvasHost.appendChild(renderer.domElement);

    const scene = new T.Scene();
    scene.background = new T.Color(0x070b14);

    // Camera configured for true perspective matching the real-life lens (34° vertical FOV)
    const CAM_FOV = 34;
    const CAM_Z_HOME = 3.55;
    const PLANE_H = 2.66;
    const PLANE_W = PLANE_H * (1376 / 768);
    const DEPTH_AMP = 1.04; // Rich, clean 3D relief with crisp foreground silhouettes
    const SEG_X = 224;
    const SEG_Y = 126;

    const camera = new T.PerspectiveCamera(CAM_FOV, 1.72, 0.08, 60);
    camera.position.set(0, 0, CAM_Z_HOME);

    // Studio 3D lighting rig
    const hemiLight = new T.HemisphereLight(0xffffff, 0xdbeafe, 1.55);
    scene.add(hemiLight);

    const keyLight = new T.DirectionalLight(0xffffff, 0.72);
    keyLight.position.set(2.8, 3.6, 4.2);
    scene.add(keyLight);

    const rimLight = new T.DirectionalLight(0x7dd3fc, 0.65);
    rimLight.position.set(-3.4, 2.2, 2.6);
    scene.add(rimLight);

    const cursorLight = new T.PointLight(0x38bdf8, 0.55, 7.5);
    cursorLight.position.set(0, 0.4, 2.3);
    scene.add(cursorLight);

    // Clay-mode dramatic 3-point sculpt lights (raking angles carve crisp ZBrush-style 3D relief!)
    const clayKey = new T.DirectionalLight(0xfff7ed, 0);
    clayKey.position.set(4.8, 3.4, 1.35);
    scene.add(clayKey);
    const clayRim = new T.DirectionalLight(0x38bdf8, 0);
    clayRim.position.set(-4.6, -1.8, 1.25);
    scene.add(clayRim);

    // Subtle 3D volumetric particles floating in XYZ space in front of the 3D scene
    const pCount = 72;
    const pPos = new Float32Array(pCount * 3);
    const pBase = new Float32Array(pCount * 3);
    for (let k = 0; k < pCount; k++) {
      const px = (((k * 73) % 100) / 100 - 0.5) * 4.4;
      const py = (((k * 41) % 100) / 100 - 0.5) * 2.4;
      const pz = 0.25 + (((k * 29) % 100) / 100) * 1.15;
      pPos[k * 3] = px; pPos[k * 3 + 1] = py; pPos[k * 3 + 2] = pz;
      pBase[k * 3] = px; pBase[k * 3 + 1] = py; pBase[k * 3 + 2] = pz;
    }
    const pGeo = new T.BufferGeometry();
    pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3));
    const pMat = new T.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.024,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: T.AdditiveBlending,
    });
    const particles = new T.Points(pGeo, pMat);
    scene.add(particles);

    // HDRI Environment for 360° photogrammetry & glossy reflections
    const pmrem = new T.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    function setFallbackEnv() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 128;
      const g = c.getContext('2d');
      const grad = g.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0, '#9aa3ad'); grad.addColorStop(0.5, '#e7e9ec'); grad.addColorStop(1, '#3a3d42');
      g.fillStyle = grad; g.fillRect(0, 0, 256, 128);
      g.fillStyle = '#ffffff'; g.fillRect(30, 20, 60, 25); g.fillRect(160, 25, 70, 20);
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
      }, undefined, () => setFallbackEnv());
    } else {
      setFallbackEnv();
    }

    // Roots: one for the Neural Depth 3D Scene, one for the 360° Photogrammetry Scan
    const depthRoot = new T.Group();
    scene.add(depthRoot);

    const scanRoot = new T.Group();
    scanRoot.visible = false;
    scene.add(scanRoot);

    const scanPodium = new T.Mesh(
      new T.CylinderGeometry(1.72, 1.86, 0.08, 64),
      new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.28, metalness: 0.72 })
    );
    scanPodium.position.y = -0.04;
    scanRoot.add(scanPodium);

    const scanRingMat = new T.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
    const scanRing = new T.Mesh(new T.TorusGeometry(1.78, 0.014, 12, 96), scanRingMat);
    scanRing.rotation.x = Math.PI / 2;
    scanRing.position.y = 0.006;
    scanRoot.add(scanRing);

    const scanModelHolder = new T.Group();
    scanRoot.add(scanModelHolder);

    // OrbitControls (TRUE 3D camera rotation & zoom!)
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let controls = null;
    let userInteracted = false;
    let idleResumeAt = 0;

    if (T.OrbitControls) {
      controls = new T.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.065;
      controls.rotateSpeed = 0.55;
      controls.zoomSpeed = 0.85;
      controls.enablePan = false;
      controls.addEventListener('start', () => {
        userInteracted = true;
        cancelCameraFly();
      });
      controls.addEventListener('end', () => {
        idleResumeAt = performance.now() + 6500;
      });
    }

    function configureControlsForMode() {
      if (!controls) return;
      if (state.mode === 'scan360') {
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        controls.minPolarAngle = 0.15;
        controls.maxPolarAngle = Math.PI / 2 - 0.03;
        controls.minDistance = 1.45;
        controls.maxDistance = 6.2;
        controls.autoRotate = !reducedMotion;
        controls.autoRotateSpeed = 1.15;
      } else {
        // Depth 3D Relief Scene: dramatic 3D orbit (±18° yaw, ±11° pitch) with zero edge clipping
        controls.minAzimuthAngle = -0.31;
        controls.maxAzimuthAngle = 0.31;
        controls.minPolarAngle = Math.PI / 2 - 0.19;
        controls.maxPolarAngle = Math.PI / 2 + 0.19;
        controls.minDistance = 1.35;
        controls.maxDistance = 3.42;
        controls.autoRotate = false;
      }
      controls.update();
    }

    // Smooth 3D Camera Flight Animator
    let camFly = null;
    function flyCameraTo(targetPos, targetLook, durationMs) {
      camFly = {
        startPos: camera.position.clone(),
        endPos: targetPos.clone(),
        startLook: controls ? controls.target.clone() : new T.Vector3(0, 0, 0),
        endLook: targetLook.clone(),
        startTime: performance.now(),
        duration: durationMs || 720,
      };
    }
    function cancelCameraFly() {
      camFly = null;
    }

    function getDepthHomeDistance() {
      // Auto-fit 3D relief plane cleanly with inset margin so orbiting never exposes edges
      const w = canvasHost.clientWidth || stage.clientWidth || 760;
      const h = canvasHost.clientHeight || stage.clientHeight || 455;
      const aspect = Math.max(0.5, w / Math.max(1, h));
      const vFovRad = (CAM_FOV * Math.PI) / 180;
      const halfTanV = Math.tan(vFovRad / 2);
      const halfTanH = halfTanV * aspect;
      const distV = (PLANE_H * 0.42) / halfTanV;
      const distH = (PLANE_W * 0.42) / halfTanH;
      return clamp(Math.min(distV, distH), 2.15, 3.32);
    }

    function resetView(instant) {
      state.activeHotspot = -1;
      syncHotspotUI();
      if (state.mode === 'scan360') {
        const homePos = state.scanHome ? state.scanHome.pos : new T.Vector3(1.8, 1.1, 2.4);
        const homeLook = state.scanHome ? state.scanHome.target : new T.Vector3(0, 0.5, 0);
        if (instant) {
          camera.position.copy(homePos);
          if (controls) { controls.target.copy(homeLook); controls.update(); }
        } else {
          flyCameraTo(homePos, homeLook, 620);
        }
        return;
      }
      const d = getDepthHomeDistance();
      const homePos = new T.Vector3(0, 0, d);
      const homeLook = new T.Vector3(0, 0, 0.08);
      if (instant) {
        camera.position.copy(homePos);
        if (controls) { controls.target.copy(homeLook); controls.update(); }
      } else {
        flyCameraTo(homePos, homeLook, 640);
      }
      userInteracted = false;
    }

    renderer.domElement.addEventListener('dblclick', () => resetView(false));

    // ==================== NEURAL DEPTH 3D MESH BUILDER ====================
    const clayMat = new T.MeshStandardMaterial({
      color: 0x8fa0b8,
      roughness: 0.78,
      metalness: 0.06,
      envMapIntensity: 0.08,
      vertexColors: true,
    });
    const wireOverlayMat = new T.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const wireBaseMat = new T.MeshStandardMaterial({
      color: 0x071022,
      roughness: 0.88,
      metalness: 0.15,
      envMapIntensity: 0.12,
    });

    async function buildDepthScene(i) {
      if (state.depthLoaded[i]) return state.depthLoaded[i];
      const it = items[i];
      const [colorImg, depthImg] = await Promise.all([
        loadImage(it.photoUrl),
        loadImage(it.depthUrl),
      ]);

      // Sample depth map onto exact grid (SEG_X + 1) x (SEG_Y + 1)
      const gw = SEG_X + 1;
      const gh = SEG_Y + 1;
      const c = document.createElement('canvas');
      c.width = gw;
      c.height = gh;
      const ctx = c.getContext('2d');
      ctx.drawImage(depthImg, 0, 0, gw, gh);
      const raw = ctx.getImageData(0, 0, gw, gh).data;

      // Normalized depth array [0..1] + gentle 1-pass smoothing to prevent jagged vertical cliff spikes
      const d0 = new Float32Array(gw * gh);
      for (let idx = 0; idx < gw * gh; idx++) {
        d0[idx] = raw[idx * 4] / 255.0;
      }
      const depthGrid = new Float32Array(gw * gh);
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          let sum = 0, wSum = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const ny = clamp(y + dy, 0, gh - 1);
            for (let dx = -1; dx <= 1; dx++) {
              const nx = clamp(x + dx, 0, gw - 1);
              const wt = (dx === 0 && dy === 0) ? 4 : (dx === 0 || dy === 0 ? 2 : 1);
              sum += d0[ny * gw + nx] * wt;
              wSum += wt;
            }
          }
          depthGrid[y * gw + x] = sum / wSum;
        }
      }

      // Build Perspective-Unprojected 3D Relief Geometry (56,448 real triangles!) + depth AO vertex colors
      const geo = new T.PlaneGeometry(PLANE_W, PLANE_H, SEG_X, SEG_Y);
      const posAttr = geo.attributes.position;
      const vColors = new Float32Array(posAttr.count * 3);
      const camZRef = CAM_Z_HOME;
      for (let v = 0; v < posAttr.count; v++) {
        const ix = v % gw;
        const iy = Math.floor(v / gw);
        const d = depthGrid[iy * gw + ix];
        const x0 = posAttr.getX(v);
        const y0 = posAttr.getY(v);
        // Subtle panoramic bowl wrap at outer edges enhances immersion when orbiting
        const nx = (ix / SEG_X) * 2 - 1;
        const edgeCurve = -0.09 * (nx * nx);
        const z = (d - 0.45) * DEPTH_AMP + edgeCurve;
        // True perspective unprojection along camera ray from (0, 0, camZRef)
        const rayScale = (camZRef - z) / camZRef;
        posAttr.setXYZ(v, x0 * rayScale, y0 * rayScale, z);
        // Subtle depth-based ambient occlusion shading for ZBrush-like Clay 3D relief
        const ao = 0.34 + 0.66 * Math.pow(d, 0.85);
        vColors[v * 3] = ao;
        vColors[v * 3 + 1] = ao * 1.02;
        vColors[v * 3 + 2] = Math.min(1, ao * 1.07);
      }
      posAttr.needsUpdate = true;
      geo.setAttribute('color', new T.BufferAttribute(vColors, 3));
      geo.computeVertexNormals();

      // High-res color texture (sRGB + anisotropic filtering for razor sharpness at grazing 3D angles!)
      const colorTex = new T.Texture(colorImg);
      colorTex.encoding = T.sRGBEncoding;
      colorTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      colorTex.needsUpdate = true;

      const photoMat = new T.MeshStandardMaterial({
        map: colorTex,
        emissiveMap: colorTex,
        emissive: new T.Color(0xffffff),
        emissiveIntensity: 0.22,
        roughness: 0.78,
        metalness: 0.05,
        envMapIntensity: 0.14,
      });

      const group = new T.Group();
      const mesh = new T.Mesh(geo, photoMat);
      group.add(mesh);

      const wireOverlay = new T.Mesh(geo, wireOverlayMat);
      wireOverlay.position.z = 0.004;
      wireOverlay.visible = false;
      group.add(wireOverlay);

      // Compute exact 3D world position (x, y, z) for any (u%, v%) on the displaced 3D surface!
      function sampleSurface3D(xPct, yPct) {
        const ix = clamp(Math.round((xPct / 100) * SEG_X), 0, SEG_X);
        const iy = clamp(Math.round((yPct / 100) * SEG_Y), 0, SEG_Y);
        const vi = iy * gw + ix;
        return new T.Vector3(posAttr.getX(vi), posAttr.getY(vi), posAttr.getZ(vi) + 0.035);
      }

      const hotspotPoints3D = (it.hotspots || []).map((h) => sampleSurface3D(h.x, h.y));

      const entry = {
        group,
        mesh,
        wireOverlay,
        photoMat,
        hotspotPoints3D,
        triangles: SEG_X * SEG_Y * 2,
      };
      state.depthLoaded[i] = entry;
      return entry;
    }

    // ==================== 360° REAL PHOTOGRAMMETRY GLTF BUILDER ====================
    const gltfLoader = T.GLTFLoader ? new T.GLTFLoader() : null;
    function loadPart(part) {
      return new Promise((resolve, reject) => {
        if (!gltfLoader) { reject(new Error('GLTFLoader missing')); return; }
        gltfLoader.load(part.url, (gltf) => resolve(gltf.scene), undefined, reject);
      });
    }
    function normalizeObj(obj, targetSize) {
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
      if (state.scanLoaded[i]) return state.scanLoaded[i];
      if (state.scanPending[i]) return state.scanPending[i];
      state.scanPending[i] = (async () => {
        const it = items[i];
        const wrap = new T.Group();
        const parts = await Promise.all((it.parts || []).map(loadPart));
        parts.forEach((sceneObj, pi) => {
          const p = it.parts[pi];
          const holder = new T.Group();
          if (p.rotation) sceneObj.rotation.set(...p.rotation);
          holder.add(sceneObj);
          normalizeObj(holder, p.size || 1.75);
          if (p.offset) holder.position.add(new T.Vector3(...p.offset));
          wrap.add(holder);
        });
        normalizeObj(wrap, it.scanSize || 2.15);
        const meshes = [];
        wrap.traverse((o) => {
          if (!o.isMesh) return;
          if (o.material) {
            o.material.envMapIntensity = it.envIntensity || 1.25;
            if (o.material.aoMap && o.geometry && !o.geometry.attributes.uv2 && o.geometry.attributes.uv) {
              o.geometry.setAttribute('uv2', o.geometry.attributes.uv);
            }
            o.material.needsUpdate = true;
          }
          meshes.push(o);
        });
        const entry = { object: wrap, meshes };
        state.scanLoaded[i] = entry;
        delete state.scanPending[i];
        return entry;
      })();
      try {
        return await state.scanPending[i];
      } catch (e) {
        delete state.scanPending[i];
        throw e;
      }
    }

    // ==================== LIGHTING, MODES & HOTSPOTS ====================
    function applyLighting() {
      const p = BG_PRESETS[state.bgPreset] || BG_PRESETS.atmosphere;
      const isClay = state.mode === 'clay3d';
      const isWire = state.mode === 'wire3d';
      scene.background = new T.Color(isWire ? 0x040814 : p.bgHex);
      renderer.toneMappingExposure = isClay ? 1.08 : p.exposure;

      hemiLight.color.setHex(isClay ? 0x94a3b8 : p.hemiSky);
      hemiLight.groundColor.setHex(isClay ? 0x0f172a : p.hemiGround);
      hemiLight.intensity = isClay ? 0.24 : p.hemiInt;

      keyLight.color.setHex(p.keyColor);
      keyLight.intensity = isClay ? 0.15 : p.keyInt;
      rimLight.color.setHex(p.rimColor);
      rimLight.intensity = isClay ? 0.22 : p.rimInt;
      cursorLight.color.setHex(p.cursorColor);
      cursorLight.intensity = isClay ? 0.55 : p.cursorInt;

      clayKey.intensity = isClay ? 1.45 : 0;
      clayRim.intensity = isClay ? 0.92 : 0;

      pMat.color.setHex(p.particleColor);
      scanRingMat.color.setHex(p.cursorColor);

      const entry = state.depthLoaded[state.active];
      if (entry && entry.photoMat) {
        entry.photoMat.emissiveIntensity = p.emissiveInt;
      }
    }

    function applyRenderMode() {
      const isScan = state.mode === 'scan360';
      depthRoot.visible = !isScan;
      scanRoot.visible = isScan;
      particles.visible = !isScan;
      hotspotsLayer.hidden = isScan;

      const entry = state.depthLoaded[state.active];
      if (entry && !isScan) {
        if (state.mode === 'clay3d') {
          entry.mesh.material = clayMat;
          entry.wireOverlay.visible = false;
        } else if (state.mode === 'wire3d') {
          entry.mesh.material = wireBaseMat;
          entry.wireOverlay.visible = true;
        } else {
          entry.mesh.material = entry.photoMat;
          entry.wireOverlay.visible = false;
        }
      }

      const resetBtn = zoomBar.querySelector('[data-pr-zoom="reset"]');
      if (resetBtn) resetBtn.textContent = isScan ? '360°' : '3D';
      hint.textContent = isScan
        ? 'Вращайте 3D-скан на 360° · Колесо — зум · Двойной клик — сброс'
        : 'Вращайте 3D-сцену мышью · Колесо — зум · Кликайте точки узлов';

      applyLighting();
      configureControlsForMode();
    }

    function renderHotspotPins(i) {
      const it = items[i] || {};
      const list = it.hotspots || [];
      hotspotsLayer.innerHTML = list.map((h, idx) => `
        <button type="button"
          class="pr-hotspot pr-hotspot--3d"
          data-pr-hotspot="${idx}"
          aria-pressed="false"
          aria-label="${escapeHtml(h.title)}">
          <span class="pr-hotspot-pulse"></span>
          <span class="pr-hotspot-dot">${idx + 1}</span>
          <span class="pr-hotspot-tip">${escapeHtml(h.title)}</span>
        </button>
      `).join('');
    }

    const _projVec = new T.Vector3();
    function updateProjectedHotspots() {
      if (state.mode === 'scan360') return;
      const entry = state.depthLoaded[state.active];
      if (!entry || !entry.hotspotPoints3D) return;
      const w = canvasHost.clientWidth || stage.clientWidth || 760;
      const h = canvasHost.clientHeight || stage.clientHeight || 455;
      const btns = hotspotsLayer.querySelectorAll('.pr-hotspot');
      entry.hotspotPoints3D.forEach((pt3, idx) => {
        const btn = btns[idx];
        if (!btn) return;
        _projVec.copy(pt3).project(camera);
        const visible = _projVec.z < 1 && _projVec.x > -1.04 && _projVec.x < 1.04 && _projVec.y > -1.04 && _projVec.y < 1.04;
        if (!visible) {
          btn.style.opacity = '0';
          btn.style.pointerEvents = 'none';
          return;
        }
        const sx = (_projVec.x * 0.5 + 0.5) * w;
        const sy = (-_projVec.y * 0.5 + 0.5) * h;
        btn.style.left = `${sx.toFixed(1)}px`;
        btn.style.top = `${sy.toFixed(1)}px`;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      });
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

      if (state.mode !== 'scan360' && state.activeHotspot >= 0 && list[state.activeHotspot]) {
        const h = list[state.activeHotspot];
        hotspotCard.innerHTML = `
          <div class="pr-hc-head">
            <span class="pr-hc-badge">3D-узел ${state.activeHotspot + 1} / ${list.length}${h.spec ? ' · ' + escapeHtml(h.spec) : ''}</span>
            <button type="button" class="pr-hc-close" data-pr-hc="close" aria-label="Сбросить 3D-камеру">×</button>
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

    function focusHotspot(idx) {
      const it = items[state.active];
      const list = (it && it.hotspots) || [];
      if (idx < 0 || idx >= list.length) {
        resetView(false);
        return;
      }
      if (state.mode === 'scan360') setMode('photo3d');
      const entry = state.depthLoaded[state.active];
      if (!entry || !entry.hotspotPoints3D[idx]) return;

      state.activeHotspot = idx;
      userInteracted = true;
      syncHotspotUI();

      // True 3D camera flight straight to the 3D surface point at a dramatic angled 3D perspective!
      const pt = entry.hotspotPoints3D[idx].clone();
      const sideSign = pt.x >= 0 ? -1 : 1;
      const targetLook = new T.Vector3(
        clamp(pt.x * 0.78, -1.25, 1.25),
        clamp(pt.y * 0.75 - 0.08, -0.68, 0.68),
        pt.z * 0.85
      );
      const camPos = new T.Vector3(
        clamp(targetLook.x + sideSign * 0.42, -1.15, 1.15),
        clamp(targetLook.y + 0.14, -0.55, 0.65),
        clamp(pt.z + 1.65, 1.55, 2.35)
      );
      flyCameraTo(camPos, targetLook, 760);
    }

    let loadToken = 0;
    async function show(i) {
      state.active = i;
      const token = ++loadToken;
      tabs.querySelectorAll('[data-pr-tab]').forEach((b) => {
        b.setAttribute('aria-selected', String(Number(b.dataset.prTab) === i));
      });
      renderInfo(i);
      renderHotspotPins(i);
      state.activeHotspot = -1;
      syncHotspotUI();

      loader.innerHTML = '<span class="pr-spinner"></span><span class="pr-loader-text">Построение 3D-рельефа…</span>';
      loader.hidden = false;
      state.ready = false;

      try {
        if (state.mode === 'scan360') {
          await showScan360(i, token);
        } else {
          const entry = await buildDepthScene(i);
          if (token !== loadToken) return;
          while (depthRoot.children.length) depthRoot.remove(depthRoot.children[0]);
          depthRoot.add(entry.group);
          state.activeTriangles = entry.triangles;
          state.activeMeshes = 1;
          applyRenderMode();
          resetView(true);
          state.ready = true;
          loader.hidden = true;
          container.dispatchEvent(new CustomEvent('photoreal:ready', { detail: { index: i } }));
          // Background preload next scene's depth 3D mesh
          const nextIdx = (i + 1) % items.length;
          if (!state.depthLoaded[nextIdx] && 'requestIdleCallback' in window) {
            requestIdleCallback(() => buildDepthScene(nextIdx).catch(() => {}));
          }
        }
      } catch (err) {
        state.errors.push(String(err && err.message || err));
        loader.innerHTML = 'Не удалось загрузить 3D-сцену. Проверьте соединение.';
      }
    }

    async function showScan360(i, token) {
      loader.innerHTML = '<span class="pr-spinner"></span><span class="pr-loader-text">Загрузка 3D-скана 360°…</span>';
      loader.hidden = false;
      const entry = await buildScanItem(i);
      if (token !== loadToken) return;
      while (scanModelHolder.children.length) scanModelHolder.remove(scanModelHolder.children[0]);
      scanModelHolder.add(entry.object);
      const box = new T.Box3().setFromObject(entry.object);
      const size = box.getSize(new T.Vector3());
      const center = box.getCenter(new T.Vector3());
      const dist = Math.max(size.x, size.y * 1.2, size.z) * 1.55 + 0.55;
      state.scanHome = {
        target: center.clone(),
        pos: new T.Vector3(center.x + dist * 0.55, center.y + dist * 0.34, center.z + dist * 0.8),
      };
      state.activeMeshes = entry.meshes.length;
      applyRenderMode();
      resetView(true);
      state.ready = true;
      loader.hidden = true;
    }

    function setMode(nextMode) {
      const prevMode = state.mode;
      state.mode = nextMode;
      modes.querySelectorAll('[data-pr-mode]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.prMode === nextMode));
      });
      if (nextMode === 'scan360') {
        state.activeHotspot = -1;
        syncHotspotUI();
        show(state.active);
      } else if (prevMode === 'scan360') {
        show(state.active);
      } else {
        applyRenderMode();
      }
    }

    // ==================== RESIZE & 60 FPS RENDER LOOP ====================
    function resize() {
      const w = canvasHost.clientWidth || stage.clientWidth || 760;
      const h = canvasHost.clientHeight || stage.clientHeight || 455;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      if (state.mode !== 'scan360' && state.activeHotspot < 0 && !userInteracted) {
        camera.position.z = getDepthHomeDistance();
      }
    }
    const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(stage); else window.addEventListener('resize', resize);

    // Subtle pointer-reactive 3D light tracking
    let ptrNX = 0, ptrNY = 0;
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      ptrNX = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
      ptrNY = -(((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1);
    });

    let rafId = 0;
    const t0 = performance.now();
    function loop() {
      rafId = requestAnimationFrame(loop);
      if (!state.visible || document.hidden) return;
      const now = performance.now();
      const sec = (now - t0) * 0.001;

      // Move cursor 3D light smoothly in front of scene for real 3D surface sheen
      cursorLight.position.x += (ptrNX * 2.1 - cursorLight.position.x) * 0.08;
      cursorLight.position.y += (ptrNY * 1.2 - cursorLight.position.y) * 0.08;

      // Animate floating 3D depth particles
      if (particles.visible) {
        const arr = pGeo.attributes.position.array;
        for (let k = 0; k < pCount; k++) {
          arr[k * 3] = pBase[k * 3] + Math.sin(sec * 0.45 + k) * 0.08;
          arr[k * 3 + 1] = pBase[k * 3 + 1] + Math.cos(sec * 0.38 + k * 1.3) * 0.06;
        }
        pGeo.attributes.position.needsUpdate = true;
      }

      // Smooth 3D camera flight animation
      if (camFly) {
        const u = clamp((now - camFly.startTime) / camFly.duration, 0, 1);
        const ease = 1 - Math.pow(1 - u, 3);
        camera.position.lerpVectors(camFly.startPos, camFly.endPos, ease);
        if (controls) controls.target.lerpVectors(camFly.startLook, camFly.endLook, ease);
        if (u >= 1) camFly = null;
      } else if (!reducedMotion && state.mode !== 'scan360' && state.activeHotspot < 0) {
        // Gentle living 3D idle orbit sway so depth parallax is immediately unmistakable!
        if (userInteracted && idleResumeAt && now > idleResumeAt) {
          userInteracted = false;
        }
        if (!userInteracted && controls) {
          const homeD = getDepthHomeDistance();
          const yaw = Math.sin(sec * 0.55) * 0.21;
          const pitch = Math.sin(sec * 0.36) * 0.075;
          const tx = Math.sin(yaw) * homeD;
          const ty = Math.sin(pitch) * homeD;
          const tz = Math.cos(yaw) * Math.cos(pitch) * homeD;
          camera.position.x += (tx - camera.position.x) * 0.04;
          camera.position.y += (ty - camera.position.y) * 0.04;
          camera.position.z += (tz - camera.position.z) * 0.04;
          controls.target.x += (0 - controls.target.x) * 0.05;
          controls.target.y += (0 - controls.target.y) * 0.05;
          controls.target.z += (0.08 - controls.target.z) * 0.05;
        }
      }

      if (controls) controls.update();
      renderer.render(scene, camera);
      updateProjectedHotspots();
      state.frames++;
    }

    // ==================== UI EVENTS ====================
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
      applyLighting();
    });
    hotspotsLayer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pr-hotspot]');
      if (!btn) return;
      e.stopPropagation();
      const idx = Number(btn.dataset.prHotspot);
      if (idx === state.activeHotspot) resetView(false);
      else focusHotspot(idx);
    });
    info.addEventListener('click', (e) => {
      const btn = e.target.closest('.pr-part-chip[data-pr-hotspot]');
      if (!btn) return;
      const idx = Number(btn.dataset.prHotspot);
      if (idx === state.activeHotspot) resetView(false);
      else focusHotspot(idx);
    });
    hotspotCard.addEventListener('click', (e) => {
      const act = e.target.closest('[data-pr-hc]');
      if (!act) return;
      const list = (items[state.active] && items[state.active].hotspots) || [];
      if (!list.length) return;
      const cmd = act.dataset.prHc;
      if (cmd === 'close') resetView(false);
      else if (cmd === 'next') focusHotspot((state.activeHotspot + 1) % list.length);
      else if (cmd === 'prev') focusHotspot((state.activeHotspot - 1 + list.length) % list.length);
    });
    zoomBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pr-zoom]');
      if (!btn) return;
      const cmd = btn.dataset.prZoom;
      if (cmd === 'reset') { resetView(false); return; }
      if (!controls) return;
      userInteracted = true;
      cancelCameraFly();
      const mult = cmd === 'in' ? 0.82 : 1.22;
      const offset = camera.position.clone().sub(controls.target).multiplyScalar(mult);
      offset.setLength(clamp(offset.length(), controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      controls.update();
    });

    const cleanupListeners = [
      () => document.removeEventListener('amk:theme', applyLighting),
    ];
    if (!ro) cleanupListeners.push(() => window.removeEventListener('resize', resize));
    document.addEventListener('amk:theme', applyLighting);

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
          cleanupListeners,
        });
      } else {
        cleanupListeners.forEach((fn) => { try { fn(); } catch (e) {} });
        if (ro) ro.disconnect();
        try { if (controls) controls.dispose(); } catch (e) {}
        try { renderer.dispose(); } catch (e) {}
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

    resize();
    show(0);
    loop();

    state.show = show;
    state.setMode = setMode;
    state.focusHotspot = focusHotspot;
    state.orbitTo = (yawRad, pitchRad) => {
      userInteracted = true;
      cancelCameraFly();
      const d = getDepthHomeDistance();
      camera.position.set(
        Math.sin(yawRad) * d,
        Math.sin(pitchRad) * d,
        Math.cos(yawRad) * Math.cos(pitchRad) * d
      );
      if (controls) { controls.target.set(0, 0, 0.08); controls.update(); }
    };
    state.dispose = dispose;
    return state;
  }

  return { mount };
})();
