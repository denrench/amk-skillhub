/**
 * AMK SkillHub · 3D Live Interactive Preview Engine for ALL 100 Lesson Games
 * Replaces 2D SVG/HTML boxes in TopicGameEngine with a persistent, drag-rotatable
 * Three.js WebGL 3D stage that reacts at 60 FPS to every slider & button.
 */
window.TGE3DPreview = (function () {
  'use strict';

  const stages = new WeakMap();

  function makeArtboardTex(T, cfg) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 512, 256);
    g.addColorStop(0, '#0f172a');
    g.addColorStop(0.5, '#1e3a8a');
    g.addColorStop(1, '#0ea5e9');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = cfg.accent || '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 244);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.title || 'NYVOR STUDIO EXPORT', 256, 118);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(cfg.sub || '1200px · WebP · 72 ppi', 256, 152);
    if (cfg.overload) {
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(310, 18, 182, 34);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('PRINT OVERLOAD', 401, 41);
    }
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createStage(host) {
    const T = window.THREE;
    if (!T) return null;
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      return null;
    }
    const w = Math.max(host.clientWidth || 320, 220);
    const h = 176;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;

    host.innerHTML = '';
    host.style.touchAction = 'none';
    host.style.cursor = 'grab';
    renderer.domElement.style.cssText = 'width:100%;height:176px;display:block;';
    host.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(36, w / h, 0.1, 50);
    camera.position.set(0, 1.15, 3.35);
    camera.lookAt(0, 0.25, 0);

    scene.add(new T.HemisphereLight(0xe0f2fe, 0x0f172a, 1.15));
    const key = new T.DirectionalLight(0xffffff, 1.8);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new T.PointLight(0x38bdf8, 1.4, 15);
    rim.position.set(-3, 2.5, -2);
    scene.add(rim);

    const grid = new T.GridHelper(4.8, 12, 0x38bdf8, 0x1e293b);
    grid.position.y = -0.35;
    if (grid.material) { grid.material.transparent = true; grid.material.opacity = 0.28; }
    scene.add(grid);

    const root = new T.Group();
    scene.add(root);

    let rotY = 0.28, rotX = 0.08, dragging = false, lx = 0, ly = 0;
    const onDown = (e) => { dragging = true; lx = e.clientX; ly = e.clientY; host.style.cursor = 'grabbing'; };
    const onUp = () => { dragging = false; host.style.cursor = 'grab'; };
    const onMove = (e) => {
      if (!dragging) return;
      rotY += (e.clientX - lx) * 0.012;
      rotX = Math.max(-0.4, Math.min(0.6, rotX + (e.clientY - ly) * 0.01));
      lx = e.clientX; ly = e.clientY;
    };
    host.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    host.addEventListener('pointermove', onMove);

    const st = {
      T, renderer, scene, camera, root, host,
      modeKey: '',
      animFn: null,
      t: 0,
      raf: null,
    };

    const loop = () => {
      if (!document.body.contains(host)) {
        cancelAnimationFrame(st.raf);
        window.removeEventListener('pointerup', onUp);
        try { renderer.dispose(); } catch (e) {}
        return;
      }
      st.raf = requestAnimationFrame(loop);
      st.t += 0.016;
      root.rotation.y = rotY;
      root.rotation.x = rotX;
      if (st.animFn) st.animFn(st.t);
      const nw = host.clientWidth || 320;
      if (nw > 60 && Math.abs(nw - renderer.domElement.width / renderer.getPixelRatio()) > 4) {
        renderer.setSize(nw, h, false);
        camera.aspect = nw / h;
        camera.updateProjectionMatrix();
      }
      renderer.render(scene, camera);
    };
    st.raf = requestAnimationFrame(loop);
    stages.set(host, st);
    return st;
  }

  function buildScene(st, ctx) {
    const T = st.T;
    while (st.root.children.length) st.root.remove(st.root.children[0]);
    const g = st.root;
    const type = ctx.previewType || 'generic';
    const spec = ctx.spec || 'it';
    const vals = ctx.vals || {};
    const pct = ctx.normPct !== undefined ? ctx.normPct : 55;
    const statusHex = ctx.solved ? 0x34d399 : 0x38bdf8;

    const darkMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.4 });
    const aluMat = new T.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.28, metalness: 0.85 });
    const glowMat = new T.MeshStandardMaterial({ color: statusHex, emissive: statusHex, emissiveIntensity: 1.5 });

    if (type === 'banner_export') {
      const w = Number(vals.width || 1200);
      const ppi = Number(vals.ppi || 72);
      const fmt = String(vals.fmt || 'WebP');
      const overload = ppi >= 300 || fmt === 'BMP';
      const accent = overload ? '#fb7185' : '#34d399';
      const bw = Math.max(1.2, Math.min(2.4, (w / 1200) * 1.45));
      const slab = new T.Mesh(
        new T.BoxGeometry(bw, 0.95, 0.12),
        new T.MeshStandardMaterial({ color: overload ? 0x881337 : 0x1e293b, roughness: 0.35, metalness: 0.3 })
      );
      slab.position.y = 0.25;
      g.add(slab);
      const tex = makeArtboardTex(T, {
        title: fmt === 'WebP' ? 'NYVOR × AMK · FINTECH' : 'ALMATY SUMMIT POSTER',
        sub: `${w}px · ${fmt} · ${ppi} ppi`,
        accent,
        overload,
      });
      const face = new T.Mesh(
        new T.PlaneGeometry(bw - 0.08, 0.86),
        new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new T.Color(0xffffff), emissiveIntensity: 0.8 })
      );
      face.position.set(0, 0.25, 0.066);
      g.add(face);
      st.animFn = (t) => { slab.position.y = 0.25 + Math.sin(t * 1.6) * 0.04; face.position.y = slab.position.y; };
      return;
    }

    if (type === 'flexbox') {
      const disp = vals.display || 'block';
      const isFlex = disp === 'flex' || disp === 'grid';
      const gap = Number(vals.gap !== undefined ? vals.gap : 8);
      const frame = new T.Mesh(new T.BoxGeometry(2.6, 0.12, 1.1), darkMat);
      frame.position.y = -0.22;
      g.add(frame);
      const cols = [0x4f46e5, 0x38bdf8, 0x10b981];
      const sp = isFlex ? (0.58 + (gap / 24) * 0.25) : 0;
      cols.forEach((c, i) => {
        const blk = new T.Mesh(new T.BoxGeometry(0.46, 0.44, 0.38), new T.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.25 }));
        blk.position.set(isFlex ? (i - 1) * sp : -0.6, isFlex ? 0.22 : (0.05 + i * 0.42), 0);
        g.add(blk);
      });
      st.animFn = null;
      return;
    }

    if (type === 'ohm_wire') {
      const sec = Number(vals.section || 0.75);
      const power = Number(vals.power || 180);
      const curr = power / 12;
      const overheat = sec < (curr / 10);
      const wCol = overheat ? 0xfb7185 : 0x34d399;
      const bat = new T.Mesh(new T.BoxGeometry(0.55, 0.48, 0.42), darkMat);
      bat.position.set(-1.05, 0.15, 0); g.add(bat);
      const wireR = Math.max(0.025, Math.min(0.09, sec * 0.032));
      const wire = new T.Mesh(
        new T.CylinderGeometry(wireR, wireR, 1.85, 16),
        new T.MeshStandardMaterial({ color: wCol, emissive: wCol, emissiveIntensity: overheat ? 1.6 : 0.6 })
      );
      wire.rotation.z = Math.PI / 2; wire.position.set(0, 0.22, 0); g.add(wire);
      const load = new T.Mesh(new T.SphereGeometry(0.26, 20, 20), new T.MeshStandardMaterial({ color: wCol, emissive: wCol, emissiveIntensity: 1.2 }));
      load.position.set(1.05, 0.22, 0); g.add(load);
      const electron = new T.Mesh(new T.SphereGeometry(0.06, 12, 12), glowMat);
      g.add(electron);
      st.animFn = (t) => { electron.position.set(-0.85 + ((t * (0.5 + curr * 0.04)) % 1) * 1.7, 0.22, 0); };
      return;
    }

    // Specialty 3D Stage for ALL 100 lessons (bench + defect + builder + probe + quest + triage)
    if (spec === 'automechanic') {
      const gear = new T.Group(); gear.position.y = 0.28;
      gear.add(new T.Mesh(new T.CylinderGeometry(0.58, 0.58, 0.18, 24), aluMat));
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const tth = new T.Mesh(new T.BoxGeometry(0.12, 0.20, 0.12), glowMat);
        tth.position.set(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62); tth.rotation.y = -a;
        gear.add(tth);
      }
      gear.rotation.x = Math.PI / 2;
      g.add(gear);
      st.animFn = (t) => { gear.rotation.z = t * (0.8 + pct * 0.03); };
    } else if (spec === 'autoelectric') {
      const ecu = new T.Mesh(new T.BoxGeometry(1.1, 0.22, 0.72), aluMat);
      ecu.position.set(-0.2, 0.1, 0); g.add(ecu);
      const rotor = new T.Mesh(new T.TorusGeometry(0.32, 0.08, 12, 24), new T.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.9 }));
      rotor.position.set(0.75, 0.35, 0); g.add(rotor);
      const sig = new T.Mesh(new T.SphereGeometry(0.07, 12, 12), glowMat); g.add(sig);
      st.animFn = (t) => { rotor.rotation.z = t * 2.5; sig.position.set(-0.6 + ((t * 0.8) % 1) * 1.3, 0.28, 0.2); };
    } else if (spec === 'hvac') {
      const comp = new T.Mesh(new T.CylinderGeometry(0.28, 0.30, 0.72, 22), darkMat);
      comp.position.set(-0.65, 0.2, 0); g.add(comp);
      const coil = new T.Mesh(new T.TorusKnotGeometry(0.32, 0.06, 48, 12), glowMat);
      coil.position.set(0.45, 0.32, 0); g.add(coil);
      st.animFn = (t) => { coil.rotation.y = t * (0.6 + pct * 0.02); };
    } else if (spec === 'graphic_design') {
      const prism = new T.Mesh(new T.OctahedronGeometry(0.45, 0), new T.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.2, metalness: 0.4 }));
      prism.position.y = 0.35; g.add(prism);
      const ring = new T.Mesh(new T.TorusGeometry(0.68, 0.04, 12, 32), glowMat);
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.2; g.add(ring);
      st.animFn = (t) => { prism.rotation.y = t * 1.1; prism.rotation.x = Math.sin(t) * 0.2; };
    } else {
      for (let i = 0; i < 3; i++) {
        const layer = new T.Mesh(new T.BoxGeometry(1.4 - i * 0.28, 0.11, 0.88 - i * 0.16), i === 2 ? glowMat : (i === 1 ? aluMat : darkMat));
        layer.position.y = 0.05 + i * 0.26;
        g.add(layer);
      }
      const orb = new T.Mesh(new T.SphereGeometry(0.09, 14, 14), glowMat);
      g.add(orb);
      st.animFn = (t) => { orb.position.set(Math.cos(t * 2) * 0.9, 0.45, Math.sin(t * 2) * 0.55); };
    }
  }

  function sync(container, ctx) {
    if (!container || !window.THREE) return;
    const host = container.querySelector('.tge-3d-host');
    if (!host) return;
    let st = stages.get(host);
    if (!st) st = createStage(host);
    if (!st) return;
    buildScene(st, ctx || {});
  }

  return { sync };
})();
