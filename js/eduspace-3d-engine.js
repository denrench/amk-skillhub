/**
 * EDUSPACE 3.0 THREE.JS & 3D INTERACTIVE WORKBENCHES ENGINE
 * Professional WebGL visualizers for all 5 technical & creative disciplines:
 * 1. Web: 3D Holographic Server Rack, Load Balancer & Network Nodes
 * 2. Design: 3D Spectral Torus Knot, RGB/CMYK Cube & Studio Lighting Rig
 * 3. Autoelectric: 3D CAN-Bus Differential Harness with Oscillating Signal Pulses
 * 4. HVAC: 3D Thermodynamic Carnot Refrigeration Cycle Loop with Phase Particles
 * 5. Automechanics: 3D 4-Stroke Engine Cylinder with Moving Piston, Conrod & Spark
 */

window.EduSpace3D = (function () {
  'use strict';

  const activeScenes = {};

  function cleanupScene(containerId) {
    const prev = activeScenes[containerId];
    if (!prev) return;
    if (prev.animId) cancelAnimationFrame(prev.animId);
    if (prev.resizeObs) prev.resizeObs.disconnect();
    if (prev.renderer) {
      try { prev.renderer.dispose(); } catch (e) {}
    }
    delete activeScenes[containerId];
  }

  function enhanceWorkbench(containerId, container, scene, camera, group, onTick, glbUrl) {
    cleanupScene(containerId);
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const w = container.clientWidth || 500;
    const h = container.clientHeight || 300;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding !== undefined) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    if (renderer.toneMapping !== undefined && THREE.ACESFilmicToneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
    }
    try {
      const envCanvas = document.createElement('canvas');
      envCanvas.width = 256;
      envCanvas.height = 128;
      const ectx = envCanvas.getContext('2d');
      const bgGrad = ectx.createLinearGradient(0, 0, 0, 128);
      bgGrad.addColorStop(0.0, '#1e293b');
      bgGrad.addColorStop(0.45, '#475569');
      bgGrad.addColorStop(0.55, '#0f172a');
      bgGrad.addColorStop(1.0, '#090d16');
      ectx.fillStyle = bgGrad;
      ectx.fillRect(0, 0, 256, 128);
      ectx.fillStyle = '#ffffff';
      ectx.fillRect(28, 12, 68, 22);
      ectx.fillStyle = '#e0f2fe';
      ectx.fillRect(148, 16, 76, 18);
      ectx.fillStyle = '#93c5fd';
      ectx.fillRect(92, 48, 52, 8);
      const rawEnvTex = new THREE.CanvasTexture(envCanvas);
      rawEnvTex.mapping = THREE.EquirectangularReflectionMapping;
      if (THREE.sRGBEncoding !== undefined) rawEnvTex.encoding = THREE.sRGBEncoding;
      if (typeof THREE.PMREMGenerator === 'function') {
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        scene.environment = pmrem.fromEquirectangular(rawEnvTex).texture;
        rawEnvTex.dispose();
        pmrem.dispose();
      } else {
        scene.environment = rawEnvTex;
      }
    } catch (e) {}
    container.style.position = container.style.position || 'relative';
    container.style.cursor = 'grab';
    container.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    let mixer = null;
    if (glbUrl && window.THREE && THREE.GLTFLoader) {
      const loader = new THREE.GLTFLoader();
      loader.load(
        glbUrl,
        (gltf) => {
          const modelScene = gltf.scene || (gltf.scenes && gltf.scenes[0]);
          if (!modelScene) return;
          const box = new THREE.Box3().setFromObject(modelScene);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z, 0.001);
          modelScene.scale.setScalar(3.2 / maxDim);
          const sBox = new THREE.Box3().setFromObject(modelScene);
          const sCenter = new THREE.Vector3();
          sBox.getCenter(sCenter);
          modelScene.position.set(-sCenter.x, -sCenter.y, -sCenter.z);
          while (group.children.length > 0) {
            group.remove(group.children[0]);
          }
          group.add(modelScene);
          if (gltf.animations && gltf.animations.length > 0 && THREE.AnimationMixer) {
            mixer = new THREE.AnimationMixer(modelScene);
            gltf.animations.forEach((clip) => {
              try { mixer.clipAction(clip).play(); } catch (e) {}
            });
          }
        },
        undefined,
        () => {}
      );
    }

    // Subtle holographic floor grid
    const grid = new THREE.GridHelper(9, 18, 0x38bdf8, 0x1e293b);
    grid.position.y = -1.75;
    if (grid.material) {
      grid.material.transparent = true;
      grid.material.opacity = 0.25;
    }
    scene.add(grid);

    // Ambient floating dust/telemetry particles
    const pCount = 45;
    const pGeom = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.055, transparent: true, opacity: 0.55 });
    const particles = new THREE.Points(pGeom, pMat);
    scene.add(particles);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let rotY = 0;
    let rotX = 0.12;
    let zoom = camera.position.length() || 5.8;

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
      rotY += dx * 0.009;
      rotX = Math.max(-0.55, Math.min(0.85, rotX + dy * 0.008));
    });
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoom = Math.max(3.2, Math.min(9.5, zoom + e.deltaY * 0.003));
    }, { passive: false });

    const resizeObs = 'ResizeObserver' in window ? new ResizeObserver(() => {
      const nw = container.clientWidth || 500;
      const nh = container.clientHeight || 300;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }) : null;
    if (resizeObs) resizeObs.observe(container);

    const state = { renderer, resizeObs, animId: null };
    activeScenes[containerId] = state;

    let t = 0;
    function animate() {
      state.animId = requestAnimationFrame(animate);
      t += 0.016;
      if (!dragging) {
        rotY += 0.0055;
      }
      group.rotation.y = rotY;
      group.rotation.x = rotX;
      particles.rotation.y = -t * 0.08;

      camera.position.set(0, Math.sin(rotX) * zoom * 0.45 + 1.2, zoom);
      camera.lookAt(0, 0, 0);

      if (mixer) {
        try { mixer.update(0.016); } catch (e) {}
      }
      if (onTick) onTick(t);
      renderer.render(scene, camera);
    }
    animate();
    return { scene, camera, renderer, group };
  }

  function initHeroCanvas(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    cleanupScene(containerId);
    while (container.firstChild) container.removeChild(container.firstChild);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const pointLight = new THREE.PointLight(0x6366f1, 2.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 2, 50);
    cyanLight.position.set(-5, -3, 3);
    scene.add(cyanLight);

    const group = new THREE.Group();
    const meshOuter = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.2, 1),
      new THREE.MeshStandardMaterial({ color: 0x4f46e5, wireframe: true, emissive: 0x312e81, emissiveIntensity: 0.5 })
    );
    group.add(meshOuter);

    const meshInner = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2, emissive: 0x0891b2, emissiveIntensity: 0.6 })
    );
    group.add(meshInner);

    const satellites = [];
    for (let i = 0; i < 18; i++) {
      const sat = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshBasicMaterial({ color: (i % 2 === 0) ? 0x38bdf8 : 0xa855f7 })
      );
      const angle = (i / 18) * Math.PI * 2;
      sat.position.set(Math.cos(angle) * 3.2, Math.sin(i * 1.5) * 0.8, Math.sin(angle) * 3.2);
      sat.userData = { angle, speed: 0.015 + i * 0.001, radius: 3.2 };
      group.add(sat);
      satellites.push(sat);
    }
    scene.add(group);

    let mouseX = 0, mouseY = 0;
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
    });

    const state = { renderer, animId: null };
    activeScenes[containerId] = state;

    function animate() {
      state.animId = requestAnimationFrame(animate);
      group.rotation.y += 0.006;
      group.rotation.x += 0.003;
      meshInner.rotation.y -= 0.012;
      meshInner.rotation.z += 0.008;
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 1.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      satellites.forEach((s) => {
        s.userData.angle += s.userData.speed;
        s.position.x = Math.cos(s.userData.angle) * s.userData.radius;
        s.position.z = Math.sin(s.userData.angle) * s.userData.radius;
      });
      renderer.render(scene, camera);
    }
    animate();
    return { scene, camera, renderer, group };
  }

  // 1. IT: 3D Server Node Cluster + Data Ring
  function renderIt3d(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 100);
    camera.position.set(0, 1.5, 5.6);

    const light = new THREE.DirectionalLight(0xffffff, 1.35);
    light.position.set(5, 10, 7);
    scene.add(light, new THREE.AmbientLight(0x64748b, 1.4));

    const group = new THREE.Group();
    const leds = [];
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.42, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.22 })
      );
      blade.position.y = (i - 1) * 0.72;
      group.add(blade);

      for (let l = 0; l < 5; l++) {
        const ledMat = new THREE.MeshBasicMaterial({ color: (l % 2 === 0) ? 0x10b981 : 0x38bdf8 });
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.06), ledMat);
        led.position.set(-0.85 + l * 0.34, (i - 1) * 0.72, 0.82);
        group.add(led);
        leds.push({ mesh: led, phase: i * 1.3 + l });
      }
    }

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.03, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0x6366f1 })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    scene.add(group);

    return enhanceWorkbench(containerId, container, scene, camera, group, (t) => {
      ring.rotation.z = t * 0.8;
      leds.forEach((item) => {
        const on = Math.sin(t * 5 + item.phase) > 0;
        item.mesh.material.color.setHex(on ? 0x10b981 : 0x38bdf8);
      });
    }, 'assets/models/it-webgl.glb');
  }

  // 2. DESIGN: 3D Color Space Spectrum & Orbiting Rings
  function renderDesign3d(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 100);
    camera.position.set(0, 1.2, 5.6);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const pl = new THREE.PointLight(0xf472b6, 1.8, 50);
    pl.position.set(4, 5, 4);
    scene.add(pl);

    const group = new THREE.Group();
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.15, 0.34, 110, 18),
      new THREE.MeshNormalMaterial({ wireframe: false })
    );
    group.add(knot);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.035, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xf472b6 })
    );
    group.add(halo);
    scene.add(group);

    return enhanceWorkbench(containerId, container, scene, camera, group, (t) => {
      knot.rotation.x = t * 0.6;
      knot.rotation.z = t * 0.4;
      halo.rotation.y = -t * 0.9;
    }, 'assets/models/design-color.glb');
  }

  // 3. AUTOELECTRIC: 3D CAN-Bus Harness with Live Signal Pulses
  function renderAutoelectric3d(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 100);
    camera.position.set(0, 1.6, 6.0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const light = new THREE.PointLight(0x06b6d4, 2.2, 25);
    light.position.set(0, 4, 3);
    scene.add(light);

    const group = new THREE.Group();
    const ecuMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2, emissive: 0x1e3a8a, emissiveIntensity: 0.35 });
    const ecu1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), ecuMat);
    ecu1.position.set(-2.2, 0, 0);
    const ecu2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), ecuMat);
    ecu2.position.set(2.2, 0, 0);
    group.add(ecu1, ecu2);

    const wireH = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 4.4, 16), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    wireH.rotation.z = Math.PI / 2;
    wireH.position.set(0, 0.22, 0);
    const wireL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 4.4, 16), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    wireL.rotation.z = Math.PI / 2;
    wireL.position.set(0, -0.22, 0);
    group.add(wireH, wireL);

    const pulseH = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    const pulseL = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
    group.add(pulseH, pulseL);
    scene.add(group);

    return enhanceWorkbench(containerId, container, scene, camera, group, (t) => {
      pulseH.position.set(Math.sin(t * 2.6) * 1.9, 0.22, 0);
      pulseL.position.set(-Math.sin(t * 2.6) * 1.9, -0.22, 0);
    }, 'assets/models/autoel-charging.glb');
  }

  // 4. HVAC: 3D Thermodynamic Carnot Loop
  function renderHvac3d(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 100);
    camera.position.set(0, 1.3, 5.8);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const group = new THREE.Group();

    const hotPipe = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.18, 18, 50, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.5, roughness: 0.3 })
    );
    const coldPipe = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.18, 18, 50, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x155e75, emissiveIntensity: 0.5, roughness: 0.3 })
    );
    coldPipe.rotation.z = Math.PI;
    group.add(hotPipe, coldPipe);

    const comp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.9, 24),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.25 })
    );
    comp.position.set(1.55, 0, 0);
    const txv = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.6, roughness: 0.3 })
    );
    txv.position.set(-1.55, 0, 0);
    group.add(comp, txv);
    scene.add(group);

    return enhanceWorkbench(containerId, container, scene, camera, group, (t) => {
      group.rotation.z = t * 0.45;
    }, 'assets/models/hvac-cycle.glb');
  }

  // 5. AUTOMECHANIC: 3D 4-Stroke Engine Cylinder & Piston
  function renderAutomechanic3d(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 100);
    camera.position.set(0, 1.1, 5.5);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const light = new THREE.DirectionalLight(0xffedd5, 1.5);
    light.position.set(3, 5, 4);
    scene.add(light);

    const group = new THREE.Group();
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 3.1, 28, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x64748b, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
    );
    group.add(sleeve);

    const piston = new THREE.Mesh(
      new THREE.CylinderGeometry(1.14, 1.14, 0.8, 28),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.88, roughness: 0.15, emissive: 0x78350f, emissiveIntensity: 0.22 })
    );
    group.add(piston);

    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), sparkMat);
    spark.position.set(0, 1.58, 0);
    group.add(spark);
    scene.add(group);

    return enhanceWorkbench(containerId, container, scene, camera, group, (t) => {
      const y = Math.sin(t * 3.4) * 0.95;
      piston.position.y = y;
      sparkMat.color.setHex(y > 0.88 ? 0xfacc15 : 0x38bdf8);
    }, 'assets/models/mech-turbo.glb');
  }

  return {
    initHeroCanvas,
    renderIt3d,
    renderDesign3d,
    renderAutoelectric3d,
    renderHvac3d,
    renderAutomechanic3d
  };
})();
