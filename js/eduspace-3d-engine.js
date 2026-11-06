/**
 * EDUSPACE 3.0 THREE.JS & 3D INTERACTIVE WORKBENCHES ENGINE
 * Professional WebGL visualizers for all technical & creative disciplines:
 * 1. Web: 3D Holographic Server Rack & Network Nodes
 * 2. Design: 3D Floating Color Wheel, RGB/CMYK Spectral Cube & Lighting
 * 3. Autoelectric: 3D CAN-Bus Wiring Harness with Oscillating Signal Pulses
 * 4. HVAC: 3D Thermodynamic Carnot Refrigeration Cycle Loop
 * 5. Automechanics: 3D 4-Stroke Engine Cylinder with Moving Piston & Spark
 */

window.EduSpace3D = (function () {
  'use strict';

  let activeScenes = {};

  function initHeroCanvas(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;

    // Remove any existing canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Ambient & Point lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6366f1, 2.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 2, 50);
    cyanLight.position.set(-5, -3, 3);
    scene.add(cyanLight);

    // Central Core: Complex Icosahedron Wireframe + Inner Core
    const group = new THREE.Group();

    // Outer wireframe
    const geomOuter = new THREE.IcosahedronGeometry(2.2, 1);
    const matOuter = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      wireframe: true,
      emissive: 0x312e81,
      emissiveIntensity: 0.5
    });
    const meshOuter = new THREE.Mesh(geomOuter, matOuter);
    group.add(meshOuter);

    // Inner Glowing Core
    const geomInner = new THREE.OctahedronGeometry(1.2, 0);
    const matInner = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6
    });
    const meshInner = new THREE.Mesh(geomInner, matInner);
    group.add(meshInner);

    // Orbiting Satellite particles
    const orbitCount = 18;
    const satellites = [];
    for (let i = 0; i < orbitCount; i++) {
      const satGeom = new THREE.SphereGeometry(0.08, 12, 12);
      const satMat = new THREE.MeshBasicMaterial({
        color: (i % 2 === 0) ? 0x38bdf8 : 0xa855f7
      });
      const sat = new THREE.Mesh(satGeom, satMat);
      const angle = (i / orbitCount) * Math.PI * 2;
      const radius = 3.2;
      sat.position.set(Math.cos(angle) * radius, (Math.sin(i * 1.5) * 0.8), Math.sin(angle) * radius);
      sat.userData = { angle: angle, speed: 0.015 + (i * 0.001), radius: radius };
      group.add(sat);
      satellites.push(sat);
    }

    scene.add(group);

    // Mouse interactive tilt
    let mouseX = 0;
    let mouseY = 0;
    function onMouseMove(e) {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    }
    container.addEventListener('mousemove', onMouseMove);

    let animId;
    function animate() {
      animId = requestAnimationFrame(animate);

      group.rotation.y += 0.006;
      group.rotation.x += 0.003;

      meshInner.rotation.y -= 0.012;
      meshInner.rotation.z += 0.008;

      // Gentle interactive camera reaction
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 1.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Rotate satellites
      satellites.forEach(s => {
        s.userData.angle += s.userData.speed;
        s.position.x = Math.cos(s.userData.angle) * s.userData.radius;
        s.position.z = Math.sin(s.userData.angle) * s.userData.radius;
      });

      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    activeScenes[containerId] = { renderer, animId };
    return { scene, camera, renderer, group };
  }

  // =========================================================================
  // SPECIALTY 3D WORKBENCHES
  // =========================================================================

  // 1. IT: 3D Server Node Cluster
  function renderIt3d(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    while (container.firstChild) container.removeChild(container.firstChild);

    const w = container.clientWidth || 500;
    const h = container.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(3, 3, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 10, 7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 1.5));

    const group = new THREE.Group();

    // 3 Server Blades
    for (let i = 0; i < 3; i++) {
      const bladeGeom = new THREE.BoxGeometry(2.4, 0.4, 1.6);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.2
      });
      const blade = new THREE.Mesh(bladeGeom, bladeMat);
      blade.position.y = (i - 1) * 0.7;
      group.add(blade);

      // Blinking LEDs
      for (let l = 0; l < 4; l++) {
        const ledGeom = new THREE.BoxGeometry(0.1, 0.1, 0.05);
        const ledMat = new THREE.MeshBasicMaterial({ color: (l % 2 === 0) ? 0x10b981 : 0x06b6d4 });
        const led = new THREE.Mesh(ledGeom, ledMat);
        led.position.set(-0.8 + (l * 0.3), (i - 1) * 0.7, 0.81);
        group.add(led);
      }
    }

    scene.add(group);
    camera.lookAt(0, 0, 0);

    function animate() {
      requestAnimationFrame(animate);
      group.rotation.y += 0.008;
      renderer.render(scene, camera);
    }
    animate();
  }

  // 2. DESIGN: 3D Color Space Spectrum
  function renderDesign3d(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    while (container.firstChild) container.removeChild(container.firstChild);

    const w = container.clientWidth || 500;
    const h = container.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(3, 3, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const pl = new THREE.PointLight(0xffffff, 1.5, 50);
    pl.position.set(4, 5, 4);
    scene.add(pl);

    // Torus Knot with Rainbow Spectral Material
    const geom = new THREE.TorusKnotGeometry(1.2, 0.35, 100, 16);
    const mat = new THREE.MeshNormalMaterial({ wireframe: false });
    const knot = new THREE.Mesh(geom, mat);
    scene.add(knot);

    function animate() {
      requestAnimationFrame(animate);
      knot.rotation.x += 0.01;
      knot.rotation.y += 0.015;
      renderer.render(scene, camera);
    }
    animate();
  }

  // 3. AUTOELECTRIC: 3D CAN-Bus Harness with Interactive Nodes
  function renderAutoelectric3d(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    while (container.firstChild) container.removeChild(container.firstChild);

    const w = container.clientWidth || 500;
    const h = container.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 3, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.PointLight(0x06b6d4, 2, 20);
    light.position.set(0, 4, 3);
    scene.add(light);

    const group = new THREE.Group();

    // Twisted Pair (CAN-High in Orange, CAN-Low in White/Green)
    const curvePoints1 = [];
    const curvePoints2 = [];
    for (let i = -3; i <= 3; i += 0.1) {
      curvePoints1.push(new THREE.Vector3(i, Math.sin(i * 4) * 0.25, Math.cos(i * 4) * 0.25));
      curvePoints2.push(new THREE.Vector3(i, -Math.sin(i * 4) * 0.25, -Math.cos(i * 4) * 0.25));
    }

    const curve1 = new THREE.CatmullRomCurve3(curvePoints1);
    const curve2 = new THREE.CatmullRomCurve3(curvePoints2);

    const tubeGeom1 = new THREE.TubeGeometry(curve1, 80, 0.05, 8, false);
    const tubeMat1 = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xc2410c, emissiveIntensity: 0.3 });
    const wireCanHigh = new THREE.Mesh(tubeGeom1, tubeMat1);
    group.add(wireCanHigh);

    const tubeGeom2 = new THREE.TubeGeometry(curve2, 80, 0.05, 8, false);
    const tubeMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.3 });
    const wireCanLow = new THREE.Mesh(tubeGeom2, tubeMat2);
    group.add(wireCanLow);

    // Two Terminal ECU Blocks at Ends (with 120 Ohm terminators)
    const ecuGeom = new THREE.BoxGeometry(0.8, 0.6, 0.6);
    const ecuMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const ecu1 = new THREE.Mesh(ecuGeom, ecuMat);
    ecu1.position.set(-3.2, 0, 0);
    group.add(ecu1);

    const ecu2 = new THREE.Mesh(ecuGeom, ecuMat);
    ecu2.position.set(3.2, 0, 0);
    group.add(ecu2);

    scene.add(group);
    camera.lookAt(0, 0, 0);

    function animate() {
      requestAnimationFrame(animate);
      group.rotation.y += 0.006;
      group.rotation.z = Math.sin(Date.now() * 0.001) * 0.1;
      renderer.render(scene, camera);
    }
    animate();
  }

  // 4. HVAC: 3D Thermodynamic Refrigeration Loop
  function renderHvac3d(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    while (container.firstChild) container.removeChild(container.firstChild);

    const w = container.clientWidth || 500;
    const h = container.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 2, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const pl = new THREE.PointLight(0x38bdf8, 2, 20);
    pl.position.set(2, 4, 3);
    scene.add(pl);

    const group = new THREE.Group();

    // 4 Corner nodes (Compressor, Condenser, TXV Valve, Evaporator)
    const nodeGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.7, 16);

    // Compressor (Red/High Temp)
    const matComp = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.4 });
    const comp = new THREE.Mesh(nodeGeom, matComp);
    comp.position.set(-1.8, 1.2, 0);
    group.add(comp);

    // Condenser (Amber)
    const matCond = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.3 });
    const cond = new THREE.Mesh(nodeGeom, matCond);
    cond.position.set(1.8, 1.2, 0);
    group.add(cond);

    // TXV Valve (Green/Yellow)
    const matTxv = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x047857, emissiveIntensity: 0.3 });
    const txv = new THREE.Mesh(nodeGeom, matTxv);
    txv.position.set(1.8, -1.2, 0);
    group.add(txv);

    // Evaporator (Cyan/Blue Cool)
    const matEvap = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0e7490, emissiveIntensity: 0.5 });
    const evap = new THREE.Mesh(nodeGeom, matEvap);
    evap.position.set(-1.8, -1.2, 0);
    group.add(evap);

    // Connecting Piping Torus
    const torusGeom = new THREE.TorusGeometry(1.8, 0.08, 16, 50);
    const torusMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const piping = new THREE.Mesh(torusGeom, torusMat);
    group.add(piping);

    scene.add(group);
    camera.lookAt(0, 0, 0);

    function animate() {
      requestAnimationFrame(animate);
      group.rotation.z += 0.005;
      group.rotation.x = 0.3 + Math.sin(Date.now() * 0.001) * 0.1;
      renderer.render(scene, camera);
    }
    animate();
  }

  // 5. AUTOMECHANIC: 3D Engine Cylinder & Moving Piston
  function renderAutomechanic3d(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;
    while (container.firstChild) container.removeChild(container.firstChild);

    const w = container.clientWidth || 500;
    const h = container.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffedd5, 1.5);
    light.position.set(3, 5, 4);
    scene.add(light);

    const group = new THREE.Group();

    // Cylinder Sleeve (Transparent wireframe outer wall)
    const sleeveGeom = new THREE.CylinderGeometry(1.2, 1.2, 3.2, 24, 1, true);
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const sleeve = new THREE.Mesh(sleeveGeom, sleeveMat);
    group.add(sleeve);

    // Piston Head (Metallic solid)
    const pistonGeom = new THREE.CylinderGeometry(1.15, 1.15, 0.8, 24);
    const pistonMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x78350f,
      emissiveIntensity: 0.2
    });
    const piston = new THREE.Mesh(pistonGeom, pistonMat);
    group.add(piston);

    // Spark plug glow sphere on top
    const sparkGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const spark = new THREE.Mesh(sparkGeom, sparkMat);
    spark.position.set(0, 1.6, 0);
    group.add(spark);

    scene.add(group);

    let angle = 0;
    function animate() {
      requestAnimationFrame(animate);
      angle += 0.05;
      // 4-Stroke piston harmonic motion (TDC to BDC)
      piston.position.y = Math.sin(angle) * 1.0;

      // Spark flashes at TDC
      if (piston.position.y > 0.95) {
        sparkMat.color.setHex(0xfacc15);
      } else {
        sparkMat.color.setHex(0x38bdf8);
      }

      group.rotation.y += 0.006;
      renderer.render(scene, camera);
    }
    animate();
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
