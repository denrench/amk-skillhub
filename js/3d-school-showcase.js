/**
 * 3D SCHOOL & STUDIO SHOWCASE ENGINE (60 FPS · Three.js + GLTFLoader + Shader Pipeline)
 * Powers:
 * 1. Hero 4-Object Interactive Showcase (Sneaker, Stylized Character/Robot, Isometric Game Island, Tech Gadget/Bottle)
 *    with OrbitControls (drag + inertia + wheel zoom) and live Wireframe / Clay / Final Render shader switching.
 * 2. Curriculum Interactive 3D Viewport (switches 3D asset per selected course module).
 * 3. 3D XYZ Gizmo & Primitive Canvases (replaces flat icons with interactive 3D manipulators).
 */
window.Studio3DShowcase = (() => {
  'use strict';

  const HERO_OBJECTS = {
    sneaker: {
      id: 'sneaker',
      num: '01',
      title: 'Футуристичный кроссовок',
      subtitle: 'Hard-Surface · Симуляция ткани · PBR-кожа и сетка',
      desc: 'Демонстрация сложных многослойных текстур кожи, замши, шнуровки и скульптурной подошвы.',
      glb: 'assets/models/design-color.glb',
      courseUrl: 'tasks.html?specialty=graphic_design',
      lessonUrl: 'lesson_player.html?catalog=1&specialty=graphic_design&task=2'
    },
    character: {
      id: 'character',
      num: '02',
      title: 'Стилизованный персонаж / Робот',
      subtitle: 'Цифровой скульптинг · Ретопология · Скелетный риггинг',
      desc: 'Демонстрация чистой топологии под анимацию, 74 костных узлов рига и процедурных шарниров.',
      glb: 'assets/models/it-dom.glb',
      courseUrl: 'tasks.html?specialty=it',
      lessonUrl: 'lesson_player.html?catalog=1&specialty=it&task=14'
    },
    island: {
      id: 'island',
      num: '03',
      title: 'Изометрический игровой остров',
      subtitle: 'Low-Poly Gamedev · Левел-дизайн · Стилизованное окружение',
      desc: 'Демонстрация модульной сборки игровых локаций, оптимизированной сетки и атмосферного света.',
      glb: 'assets/models/gamedev-island.glb',
      courseUrl: 'tasks.html?specialty=it',
      lessonUrl: 'lesson_player.html?catalog=1&specialty=it&task=18'
    },
    gadget: {
      id: 'gadget',
      num: '04',
      title: 'Технологичный гаджет / Флакон',
      subtitle: 'Product Render · Преломление стекла · Анизотропный металл',
      desc: 'Демонстрация предметной визуализации, студийного света, микро-типографики и PBR-шейдеров.',
      glb: 'assets/models/design-typography.glb',
      courseUrl: 'tasks.html?specialty=graphic_design',
      lessonUrl: 'lesson_player.html?catalog=1&specialty=graphic_design&task=15'
    }
  };

  const CURRICULUM_MODULES = [
    {
      id: 'mod-01',
      num: '01',
      title: 'Hard-Surface и SubD моделирование',
      duration: '3 недели · 5 практических проектов',
      summary: 'Построение сложной технической геометрии без артефактов сглаживания: фаски, булевы операции и чистый квад-пайплайн.',
      glb: 'assets/models/mech-turbo.glb',
      lessonUrl: 'lesson_player.html?catalog=1&specialty=automechanic&task=1',
      polyLabel: '97 Meshes · SubD Ready'
    },
    {
      id: 'mod-02',
      num: '02',
      title: 'Цифровой скульптинг и ретопология',
      duration: '3 недели · Персонажи и органика',
      summary: 'Лепка форм высокой детализации, запекание карт нормалей (High-to-Low Poly) и создание облегчённой сетки.',
      glb: 'assets/models/it-webgl.glb',
      lessonUrl: 'lesson_player.html?catalog=1&specialty=it&task=14',
      polyLabel: 'Normal + Emissive Bake'
    },
    {
      id: 'mod-03',
      num: '03',
      title: 'UV-развёртка и PBR-текстурирование',
      duration: '2 недели · Ткань, кожа, металл',
      summary: 'Раскрой UV-островов без потяжек и создание многослойных фотореалистичных материалов Albedo, Roughness и Metalness.',
      glb: 'assets/models/design-color.glb',
      lessonUrl: 'lesson_player.html?catalog=1&specialty=graphic_design&task=2',
      polyLabel: '4K PBR Texture Set'
    },
    {
      id: 'mod-04',
      num: '04',
      title: 'Low-Poly локации для Gamedev',
      duration: '3 недели · Сцены для Unreal & Unity',
      summary: 'Сборка стилизованных игровых островов и пропсов с жёстким контролем бюджета треугольников и Draw Calls.',
      glb: 'assets/models/gamedev-island.glb',
      lessonUrl: 'lesson_player.html?catalog=1&specialty=it&task=18',
      polyLabel: '24 Props · Game Ready'
    },
    {
      id: 'mod-05',
      num: '05',
      title: 'Риггинг, скиннинг и анимация',
      duration: '2 недели · Кинематика и цикл движения',
      summary: 'Сборка скелета, настройка весов вершин и создание живых циклов движения персонажа и механизмов.',
      glb: 'assets/models/it-dom.glb',
      lessonUrl: 'lesson_player.html?catalog=1&specialty=autoelectric&task=13',
      polyLabel: '74 Rig Nodes · Animated'
    },
    {
      id: 'mod-06',
      num: '06',
      title: 'Студийный свет, стекло и Product Render',
      duration: '2 недели · Финальный шоурил',
      summary: 'Постановка 3-точечного освещения, настройка преломления стекла (IOR), хрома и рендер коммерческого портфолио.',
      glb: 'assets/models/design-packaging.glb',
      lessonUrl: 'lesson_player.html?catalog=1&specialty=graphic_design&task=16',
      polyLabel: 'Studio HDRI · Clearcoat'
    }
  ];

  // Shared GLTF cache so switching between models is instant after first load
  const gltfCache = new Map();

  function applyRenderModeToRoot(T, rootObj, mode) {
    if (!rootObj || !T) return { verts: 0, tris: 0 };
    let totalVerts = 0;
    let totalTris = 0;

    rootObj.traverse((child) => {
      if (!child.isMesh) return;
      const geom = child.geometry;
      if (geom && geom.attributes && geom.attributes.position) {
        const vCount = geom.attributes.position.count || 0;
        totalVerts += vCount;
        if (geom.index) {
          totalTris += Math.round(geom.index.count / 3);
        } else {
          totalTris += Math.round(vCount / 3);
        }
      }

      if (!child.userData.origMaterial) {
        child.userData.origMaterial = child.material;
      }
      if (!child.userData.clayMaterial) {
        child.userData.clayMaterial = new T.MeshStandardMaterial({
          color: 0xd6d1c7,
          roughness: 0.62,
          metalness: 0.06,
          side: T.DoubleSide
        });
      }
      if (!child.userData.wireMaterial) {
        child.userData.wireMaterial = new T.MeshStandardMaterial({
          color: 0xd4ff00,
          emissive: 0x3a4700,
          emissiveIntensity: 0.45,
          roughness: 0.4,
          metalness: 0.2,
          wireframe: true,
          side: T.DoubleSide
        });
      }

      if (mode === 'wireframe') {
        child.material = child.userData.wireMaterial;
      } else if (mode === 'clay') {
        child.material = child.userData.clayMaterial;
      } else {
        child.material = child.userData.origMaterial;
      }
    });

    return { verts: totalVerts, tris: totalTris };
  }

  function createInteractiveStage(containerId, options = {}) {
    const container = document.getElementById(containerId);
    const T = window.THREE;
    if (!container || !T) return null;

    let renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      return null;
    }

    if (renderer.outputEncoding !== undefined && T.sRGBEncoding !== undefined) {
      renderer.outputEncoding = T.sRGBEncoding;
    }
    if (renderer.toneMapping !== undefined && T.ACESFilmicToneMapping !== undefined) {
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.22;
    }

    container.innerHTML = '';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(36, 1, 0.1, 60);

    // Studio Lighting (Ambient + Key Directional + Fill + Warm Rim)
    const ambient = new T.HemisphereLight(0xf2efe9, 0x1c1d21, 1.15);
    const keyLight = new T.DirectionalLight(0xffffff, 2.3);
    keyLight.position.set(4.5, 6.5, 5.2);
    const fillLight = new T.DirectionalLight(0x93c5fd, 1.05);
    fillLight.position.set(-4.8, 3.2, 3.0);
    const rimLight = new T.PointLight(0xd4ff00, 1.1, 18);
    rimLight.position.set(0, 4.2, -4.5);
    scene.add(ambient, keyLight, fillLight, rimLight);

    // Minimalist Studio Pedestal Ring + Reference Axis Cross
    const pedestalGroup = new T.Group();
    const ringGeo = new T.RingGeometry(1.75, 1.78, 64);
    const ringMat = new T.MeshBasicMaterial({ color: 0xd4ff00, side: T.DoubleSide, transparent: true, opacity: 0.35 });
    const ringMesh = new T.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -1.15;
    pedestalGroup.add(ringMesh);

    const discGeo = new T.CircleGeometry(1.75, 64);
    const discMat = new T.MeshStandardMaterial({ color: 0x1c1d21, roughness: 0.85, metalness: 0.1, transparent: true, opacity: 0.7 });
    const discMesh = new T.Mesh(discGeo, discMat);
    discMesh.rotation.x = -Math.PI / 2;
    discMesh.position.y = -1.16;
    pedestalGroup.add(discMesh);
    scene.add(pedestalGroup);

    const modelHolder = new T.Group();
    scene.add(modelHolder);

    // OrbitControls state with smooth damping
    let targetYaw = options.initialYaw ?? 0.55;
    let currentYaw = targetYaw;
    let targetPitch = options.initialPitch ?? 0.32;
    let currentPitch = targetPitch;
    let targetDistance = options.initialDistance ?? 5.1;
    let currentDistance = targetDistance;
    let autoRotate = true;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let renderMode = options.initialMode || 'final';
    let activeMixer = null;
    let currentLoadToken = 0;

    const syncSize = () => {
      const w = Math.max(240, container.clientWidth || 520);
      const h = Math.max(240, container.clientHeight || 440);
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = 'ResizeObserver' in window ? new ResizeObserver(syncSize) : null;
    if (ro) ro.observe(container);
    syncSize();

    container.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      container.style.cursor = 'grabbing';
    });
    window.addEventListener('pointerup', () => {
      dragging = false;
      container.style.cursor = 'grab';
    });
    container.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetYaw -= dx * 0.011;
      targetPitch = Math.max(-0.35, Math.min(1.15, targetPitch + dy * 0.009));
    });
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetDistance = Math.max(2.6, Math.min(8.2, targetDistance + e.deltaY * 0.0032));
    }, { passive: false });
    container.addEventListener('dblclick', () => {
      targetYaw = 0.55;
      targetPitch = 0.32;
      targetDistance = 5.1;
    });

    function mountClonedGltf(gltfData) {
      while (modelHolder.children.length > 0) {
        modelHolder.remove(modelHolder.children[0]);
      }
      activeMixer = null;

      const rawScene = gltfData.scene || (gltfData.scenes && gltfData.scenes[0]);
      if (!rawScene) return;
      const modelScene = rawScene.clone(true);

      // Normalize bounding box to fit studio turntable cleanly
      const box = new T.Box3().setFromObject(modelScene);
      const size = new T.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const scale = 2.65 / maxDim;
      modelScene.scale.setScalar(scale);

      const sBox = new T.Box3().setFromObject(modelScene);
      const sCenter = new T.Vector3();
      sBox.getCenter(sCenter);
      modelScene.position.set(-sCenter.x, -sBox.min.y - 1.12, -sCenter.z);

      modelHolder.add(modelScene);

      if (gltfData.animations && gltfData.animations.length > 0 && T.AnimationMixer) {
        activeMixer = new T.AnimationMixer(modelScene);
        gltfData.animations.forEach((clip) => {
          try { activeMixer.clipAction(clip).play(); } catch (e) {}
        });
      }

      const stats = applyRenderModeToRoot(T, modelScene, renderMode);
      if (typeof options.onStats === 'function') {
        options.onStats({ ...stats, mode: renderMode, status: 'ready' });
      }
    }

    function loadGlb(glbUrl) {
      if (!T.GLTFLoader) return;
      const token = ++currentLoadToken;
      if (typeof options.onStats === 'function') {
        options.onStats({ verts: 0, tris: 0, mode: renderMode, status: 'loading' });
      }
      if (gltfCache.has(glbUrl)) {
        mountClonedGltf(gltfCache.get(glbUrl));
        return;
      }
      const loader = new T.GLTFLoader();
      loader.load(
        glbUrl,
        (gltf) => {
          gltfCache.set(glbUrl, gltf);
          if (token !== currentLoadToken) return;
          mountClonedGltf(gltf);
        },
        undefined,
        () => {
          if (token !== currentLoadToken) return;
          if (typeof options.onStats === 'function') {
            options.onStats({ verts: 512, tris: 1024, mode: renderMode, status: 'fallback' });
          }
        }
      );
    }

    function setRenderMode(mode) {
      renderMode = mode;
      const stats = applyRenderModeToRoot(T, modelHolder, renderMode);
      if (typeof options.onStats === 'function') {
        options.onStats({ ...stats, mode: renderMode, status: 'ready' });
      }
    }

    let lastNow = performance.now();
    function tick(now) {
      requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastNow) * 0.001);
      lastNow = now;

      if (autoRotate && !dragging) {
        targetYaw += 0.0045;
      }
      currentYaw += (targetYaw - currentYaw) * 0.12;
      currentPitch += (targetPitch - currentPitch) * 0.12;
      currentDistance += (targetDistance - currentDistance) * 0.12;

      if (activeMixer) {
        try { activeMixer.update(dt); } catch (e) {}
      }

      const cosP = Math.cos(currentPitch);
      camera.position.set(
        Math.sin(currentYaw) * cosP * currentDistance,
        Math.sin(currentPitch) * currentDistance + 0.15,
        Math.cos(currentYaw) * cosP * currentDistance
      );
      camera.lookAt(0, -0.05, 0);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);

    return {
      loadGlb,
      setRenderMode,
      getRenderMode: () => renderMode,
      resetCamera: () => {
        targetYaw = 0.55;
        targetPitch = 0.32;
        targetDistance = 5.1;
      }
    };
  }

  // Mounts interactive 3D XYZ Gizmos & Primitives inside [data-gizmo-canvas]
  function initGizmoCanvases() {
    const T = window.THREE;
    if (!T) return;
    const nodes = document.querySelectorAll('[data-gizmo-canvas]');
    nodes.forEach((container) => {
      const kind = container.getAttribute('data-gizmo-canvas') || 'axes';
      let renderer;
      try {
        renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      } catch (e) {
        return;
      }
      const w = container.clientWidth || 120;
      const h = container.clientHeight || 120;
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(38, w / h, 0.1, 20);
      camera.position.set(2.4, 2.0, 2.8);
      camera.lookAt(0, 0, 0);

      scene.add(new T.AmbientLight(0xffffff, 1.1));
      const dLight = new T.DirectionalLight(0xffffff, 1.8);
      dLight.position.set(3, 5, 4);
      scene.add(dLight);

      const root = new T.Group();
      scene.add(root);

      // XYZ Axes helper arrows (X = Orange #FF5A1F, Y = Lime #D4FF00, Z = Cyan #38BDF8)
      const makeAxis = (color, rotVec, posVec) => {
        const grp = new T.Group();
        const mat = new T.MeshBasicMaterial({ color });
        const shaft = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1.15, 12), mat);
        shaft.position.y = 0.575;
        const tip = new T.Mesh(new T.ConeGeometry(0.095, 0.24, 14), mat);
        tip.position.y = 1.22;
        grp.add(shaft, tip);
        if (rotVec) grp.rotation.set(...rotVec);
        if (posVec) grp.position.set(...posVec);
        return grp;
      };
      root.add(makeAxis(0xff5a1f, [0, 0, -Math.PI / 2])); // X
      root.add(makeAxis(0xd4ff00, [0, 0, 0]));            // Y
      root.add(makeAxis(0x38bdf8, [Math.PI / 2, 0, 0]));  // Z

      let primMesh = null;
      if (kind === 'transform') {
        primMesh = new T.Mesh(
          new T.BoxGeometry(0.82, 0.82, 0.82),
          new T.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.35, metalness: 0.2 })
        );
      } else if (kind === 'topology') {
        primMesh = new T.Mesh(
          new T.IcosahedronGeometry(0.62, 1),
          new T.MeshStandardMaterial({ color: 0xd4ff00, wireframe: true })
        );
      } else if (kind === 'shader') {
        primMesh = new T.Mesh(
          new T.SphereGeometry(0.58, 28, 24),
          new T.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.85 })
        );
      } else {
        primMesh = new T.Mesh(
          new T.TorusKnotGeometry(0.42, 0.14, 64, 14),
          new T.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.28, metalness: 0.45 })
        );
      }
      root.add(primMesh);

      let rx = 0.2;
      let ry = 0.4;
      let isDragging = false;
      let lx = 0, ly = 0;
      container.addEventListener('pointerdown', (e) => {
        isDragging = true; lx = e.clientX; ly = e.clientY;
      });
      window.addEventListener('pointerup', () => { isDragging = false; });
      container.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        ry += (e.clientX - lx) * 0.015;
        rx += (e.clientY - ly) * 0.015;
        lx = e.clientX; ly = e.clientY;
      });

      function anim() {
        requestAnimationFrame(anim);
        if (!isDragging) ry += 0.008;
        root.rotation.set(rx, ry, 0);
        renderer.render(scene, camera);
      }
      requestAnimationFrame(anim);
    });
  }

  return {
    HERO_OBJECTS,
    CURRICULUM_MODULES,
    createInteractiveStage,
    initGizmoCanvases
  };
})();
