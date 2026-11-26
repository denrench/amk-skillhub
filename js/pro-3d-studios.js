/**
 * AMK SkillHub · Modern 360° PBR 3D Studios (Three.js r128)
 * Современные детализированные 360° 3D-сборки для IT, Автоэлектрики, HVAC и Графдизайна
 * (Автомеханика использует оригинальный Ferrari GT GLB).
 */
window.AMKProStudios = (function () {
  'use strict';

  function roundedRectShape(w, h, r) {
    const s = new window.THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function makeRoundedBox(T, w, h, d, r, mat) {
    const shape = roundedRectShape(w, h, Math.min(r, w * 0.4, h * 0.4));
    const geo = new T.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelThickness: Math.min(0.012, d * 0.22),
      bevelSize: Math.min(0.01, r * 0.45),
      bevelSegments: 3,
      curveSegments: 8,
    });
    geo.center();
    return new T.Mesh(geo, mat);
  }

  function makeScreenCanvas(T, kind) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext('2d');

    if (kind === 'ide') {
      const g = ctx.createLinearGradient(0, 0, 1024, 512);
      g.addColorStop(0, '#070b16');
      g.addColorStop(1, '#0f172a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 210, 512);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('AMK IDE · 3D', 24, 46);
      const treeCols = ['#60a5fa', '#34d399', '#c084fc', '#fbbf24', '#94a3b8'];
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = treeCols[i % treeCols.length];
        ctx.fillRect(26, 78 + i * 32, 90 + ((i * 29) % 65), 11);
      }
      ctx.fillStyle = '#162032';
      ctx.fillRect(230, 20, 770, 320);
      ctx.fillRect(230, 356, 770, 136);
      const codeCols = ['#38bdf8', '#f472b6', '#34d399', '#fbbf24', '#a78bfa'];
      for (let r = 0; r < 12; r++) {
        ctx.fillStyle = '#475569';
        ctx.font = '18px monospace';
        ctx.fillText(String(r + 1).padStart(2, '0'), 246, 52 + r * 24);
        ctx.fillStyle = codeCols[r % codeCols.length];
        ctx.fillRect(290 + (r % 3) * 28, 39 + r * 24, 140 + ((r * 83) % 390), 12);
      }
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('> vite build · 60 FPS WebGL OK', 252, 408);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('> Three.js PBR + Grid / Flexbox Ready', 252, 448);
    } else if (kind === 'vertical') {
      ctx.fillStyle = '#090f1d';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = '#162032';
      ctx.fillRect(30, 30, 964, 452);
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 34px monospace';
      ctx.fillText('DEVTOOLS · CONSOLE', 64, 95);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#34d399' : '#818cf8';
        ctx.fillRect(64, 140 + i * 36, 360 + ((i * 113) % 450), 14);
      }
    } else if (kind === 'scope') {
      ctx.fillStyle = '#05101a';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.strokeStyle = 'rgba(56,189,248,0.18)';
      ctx.lineWidth = 2;
      for (let x = 0; x <= 1024; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke(); }
      for (let y = 0; y <= 512; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 8;
      ctx.beginPath();
      for (let x = 0; x <= 1024; x += 16) {
        const y = 175 + ((Math.floor(x / 48) % 2 === 0) ? -55 : 55);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 8;
      ctx.beginPath();
      for (let x = 0; x <= 1024; x += 16) {
        const y = 345 + ((Math.floor(x / 48) % 2 === 0) ? 50 : -50);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('CAN-BUS 500 kbps · 60 Ohm OK', 34, 48);
    } else if (kind === 'fluke') {
      ctx.fillStyle = '#0f291e';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 170px monospace';
      ctx.fillText('12.64 V', 120, 310);
      ctx.font = 'bold 42px monospace';
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText('DC AUTO · AGM OK', 125, 420);
    } else if (kind === 'cintiq') {
      const g = ctx.createLinearGradient(0, 0, 1024, 512);
      g.addColorStop(0, '#111827');
      g.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 110, 512);
      ctx.fillRect(830, 0, 194, 512);
      const artG = ctx.createLinearGradient(220, 70, 760, 440);
      artG.addColorStop(0, '#06b6d4');
      artG.addColorStop(0.5, '#6366f1');
      artG.addColorStop(1, '#ec4899');
      ctx.fillStyle = artG;
      ctx.beginPath();
      ctx.arc(470, 256, 165, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(220, 370);
      ctx.bezierCurveTo(360, 110, 560, 410, 720, 130);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('AMK VECTOR 3D', 335, 268);
    } else if (kind === 'poster') {
      const g = ctx.createLinearGradient(0, 0, 1024, 512);
      g.addColorStop(0, '#06b6d4');
      g.addColorStop(0.5, '#8b5cf6');
      g.addColorStop(1, '#f43f5e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = 'rgba(15,23,42,0.28)';
      ctx.fillRect(50, 50, 924, 412);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 74px sans-serif';
      ctx.fillText('AMK × NYVOR', 235, 235);
      ctx.font = 'bold 34px monospace';
      ctx.fillText('CMYK 300 DPI · BLEED 3MM', 260, 315);
    } else if (kind === 'scale') {
      ctx.fillStyle = '#061520';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 170px monospace';
      ctx.fillText('6.85 kg', 120, 320);
    }

    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function buildGamingIT(T) {
    const group = new T.Group();
    const animators = [];

    const darkCarbon = new T.MeshStandardMaterial({ color: 0x0b101b, roughness: 0.52, metalness: 0.25 });
    const matteBlack = new T.MeshStandardMaterial({ color: 0x060911, roughness: 0.62, metalness: 0.15 });
    const brushedAlu = new T.MeshStandardMaterial({ color: 0x64748b, roughness: 0.34, metalness: 0.72 });
    const oakSlats = new T.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.68, metalness: 0.05 });
    const glassMat = new T.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.24,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.5,
    });
    const rgbCyan = new T.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 2.2 });
    const rgbViolet = new T.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 2.2 });

    // 0. Acoustic Wood-Slat Backdrop Wall + Hex RGB Panels (gives instant studio depth)
    const backWall = makeRoundedBox(T, 2.38, 1.35, 0.06, 0.02, matteBlack);
    backWall.position.set(0, 0.85, -0.58);
    group.add(backWall);
    for (let s = -10; s <= 10; s++) {
      const slat = new T.Mesh(new T.BoxGeometry(0.045, 1.26, 0.022), oakSlats);
      slat.position.set(s * 0.105, 0.85, -0.535);
      group.add(slat);
    }
    [[-0.55, 1.24], [-0.36, 1.33], [-0.17, 1.24], [0.22, 1.32], [0.41, 1.23]].forEach(([hx, hy], idx) => {
      const hex = new T.Mesh(new T.CylinderGeometry(0.085, 0.085, 0.02, 6), idx % 2 === 0 ? rgbCyan : rgbViolet);
      hex.rotation.x = Math.PI / 2;
      hex.position.set(hx, hy, -0.515);
      group.add(hex);
    });

    // 1. Carbon Gaming Desk with Cyan RGB Edge
    const deskTop = makeRoundedBox(T, 2.35, 0.055, 1.04, 0.035, darkCarbon);
    deskTop.position.set(0, 0.74, -0.02);
    group.add(deskTop);
    const deskRgb = new T.Mesh(new T.BoxGeometry(2.28, 0.016, 0.018), rgbCyan);
    deskRgb.position.set(0, 0.74, 0.515);
    group.add(deskRgb);
    [[-1.06, -0.45], [1.06, -0.45], [-1.06, 0.40], [1.06, 0.40]].forEach(([lx, lz]) => {
      const leg = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.72, 16), brushedAlu);
      leg.position.set(lx, 0.36, lz);
      group.add(leg);
    });

    const deskMat = new T.Mesh(new T.BoxGeometry(1.18, 0.008, 0.48), matteBlack);
    deskMat.position.set(-0.20, 0.785, 0.16);
    group.add(deskMat);

    // 2. Curved 34" Ultrawide Gaming Monitor (DoubleSide so inner screen faces +Z!)
    const uwCurve = new T.CylinderGeometry(1.45, 1.45, 0.46, 36, 1, true, Math.PI - 0.38, 0.76);
    const uwScreenMat = new T.MeshStandardMaterial({
      map: makeScreenCanvas(T, 'ide'),
      emissiveMap: makeScreenCanvas(T, 'ide'),
      emissive: new T.Color(0xffffff),
      emissiveIntensity: 0.95,
      roughness: 0.2,
      side: T.DoubleSide,
    });
    const uwScreen = new T.Mesh(uwCurve, uwScreenMat);
    uwScreen.position.set(-0.16, 1.12, 1.14);
    group.add(uwScreen);

    const uwBack = new T.Mesh(
      new T.CylinderGeometry(1.47, 1.47, 0.48, 36, 1, true, Math.PI - 0.39, 0.78),
      darkCarbon
    );
    uwBack.position.set(-0.16, 1.12, 1.135);
    group.add(uwBack);

    const standNeck = new T.Mesh(new T.BoxGeometry(0.06, 0.36, 0.05), brushedAlu);
    standNeck.position.set(-0.16, 0.94, -0.34);
    group.add(standNeck);
    const standBase = makeRoundedBox(T, 0.34, 0.02, 0.22, 0.02, brushedAlu);
    standBase.position.set(-0.16, 0.79, -0.28);
    group.add(standBase);

    // 3. Left Vertical Code Monitor (screen placed cleanly in front of bezel!)
    const vertGroup = new T.Group();
    vertGroup.position.set(-0.88, 1.12, -0.14);
    vertGroup.rotation.y = 0.42;
    group.add(vertGroup);
    vertGroup.add(makeRoundedBox(T, 0.32, 0.56, 0.03, 0.02, darkCarbon));
    const vertScreen = new T.Mesh(
      new T.PlaneGeometry(0.29, 0.52),
      new T.MeshStandardMaterial({
        map: makeScreenCanvas(T, 'vertical'),
        emissiveMap: makeScreenCanvas(T, 'vertical'),
        emissive: new T.Color(0xffffff),
        emissiveIntensity: 0.92,
      })
    );
    vertScreen.position.z = 0.026;
    vertGroup.add(vertScreen);

    // 4. Tempered-Glass Aquarium Gaming PC Tower with 3 Spinning ARGB Fans + GPU
    const pcGroup = new T.Group();
    pcGroup.position.set(0.76, 1.04, -0.08);
    pcGroup.rotation.y = -0.24;
    group.add(pcGroup);

    const pcBack = new T.Mesh(new T.BoxGeometry(0.24, 0.50, 0.48), matteBlack);
    pcBack.position.set(0.01, 0, -0.01);
    pcGroup.add(pcBack);
    const gpu = new T.Mesh(new T.BoxGeometry(0.05, 0.11, 0.30), brushedAlu);
    gpu.position.set(-0.02, -0.04, 0.02);
    pcGroup.add(gpu);
    const gpuStrip = new T.Mesh(new T.BoxGeometry(0.055, 0.016, 0.26), rgbViolet);
    gpuStrip.position.set(-0.02, 0.01, 0.02);
    pcGroup.add(gpuStrip);

    const fans = [];
    for (let f = 0; f < 3; f++) {
      const fy = -0.15 + f * 0.15;
      const ring = new T.Mesh(new T.TorusGeometry(0.058, 0.009, 10, 28), f % 2 === 0 ? rgbCyan : rgbViolet);
      ring.position.set(-0.01, fy, 0.238);
      pcGroup.add(ring);

      const hub = new T.Group();
      hub.position.set(-0.01, fy, 0.238);
      for (let b = 0; b < 5; b++) {
        const blade = new T.Mesh(new T.BoxGeometry(0.018, 0.046, 0.006), rgbCyan);
        const ang = (b / 5) * Math.PI * 2;
        blade.position.set(Math.cos(ang) * 0.026, Math.sin(ang) * 0.026, 0);
        blade.rotation.z = ang;
        hub.add(blade);
      }
      pcGroup.add(hub);
      fans.push(hub);
    }
    const glassSide = new T.Mesh(new T.BoxGeometry(0.012, 0.48, 0.46), glassMat);
    glassSide.position.set(-0.125, 0, 0);
    pcGroup.add(glassSide);

    // 5. Mechanical RGB Keyboard + Mouse + Speakers + Boom Mic + Headphones
    const kb = makeRoundedBox(T, 0.44, 0.022, 0.15, 0.015, matteBlack);
    kb.position.set(-0.22, 0.80, 0.18);
    group.add(kb);
    const kbGlow = new T.Mesh(new T.BoxGeometry(0.40, 0.008, 0.12), rgbViolet);
    kbGlow.position.set(-0.22, 0.822, 0.18);
    group.add(kbGlow);

    const mouse = makeRoundedBox(T, 0.068, 0.032, 0.11, 0.025, darkCarbon);
    mouse.position.set(0.15, 0.805, 0.18);
    group.add(mouse);

    [-0.60, 0.30].forEach((sx) => {
      const spk = makeRoundedBox(T, 0.13, 0.21, 0.15, 0.02, matteBlack);
      spk.position.set(sx, 0.89, -0.22);
      group.add(spk);
      const cone = new T.Mesh(new T.TorusGeometry(0.042, 0.007, 10, 24), rgbCyan);
      cone.position.set(sx, 0.86, -0.132);
      group.add(cone);
    });

    const micArm = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.34, 10), brushedAlu);
    micArm.position.set(-0.56, 0.96, 0.04);
    micArm.rotation.z = -0.55;
    group.add(micArm);
    const micBody = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.11, 16), matteBlack);
    micBody.position.set(-0.44, 1.07, 0.10);
    micBody.rotation.z = 0.4;
    group.add(micBody);

    const hpStand = new T.Mesh(new T.CylinderGeometry(0.008, 0.045, 0.24, 16), brushedAlu);
    hpStand.position.set(-0.88, 0.90, 0.28);
    group.add(hpStand);
    const hpArc = new T.Mesh(new T.TorusGeometry(0.075, 0.012, 10, 24, Math.PI), darkCarbon);
    hpArc.position.set(-0.88, 1.02, 0.28);
    group.add(hpArc);

    // 6. Gaming Chair placed angled beside/behind-right so it doesn't block the monitors!
    const chair = new T.Group();
    chair.position.set(0.56, 0, 0.82);
    chair.rotation.y = Math.PI - 0.55;
    group.add(chair);

    const chairLeather = new T.MeshStandardMaterial({ color: 0x0b101b, roughness: 0.45, metalness: 0.18 });
    const chairAccent = new T.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.38, metalness: 0.22 });

    for (let c = 0; c < 5; c++) {
      const a = (c / 5) * Math.PI * 2;
      const arm = makeRoundedBox(T, 0.045, 0.03, 0.30, 0.01, brushedAlu);
      arm.position.set(Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15);
      arm.rotation.y = a;
      chair.add(arm);
      const wheel = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.024, 14), matteBlack);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(Math.sin(a) * 0.28, 0.028, Math.cos(a) * 0.28);
      chair.add(wheel);
    }
    const gasLift = new T.Mesh(new T.CylinderGeometry(0.026, 0.03, 0.36, 16), brushedAlu);
    gasLift.position.y = 0.24;
    chair.add(gasLift);
    const seat = makeRoundedBox(T, 0.48, 0.09, 0.46, 0.05, chairLeather);
    seat.position.set(0, 0.44, 0);
    chair.add(seat);
    const backrest = makeRoundedBox(T, 0.44, 0.76, 0.09, 0.08, chairLeather);
    backrest.position.set(0, 0.84, -0.21);
    backrest.rotation.x = -0.14;
    chair.add(backrest);
    const stripe = makeRoundedBox(T, 0.20, 0.66, 0.025, 0.03, chairAccent);
    stripe.position.set(0, 0.85, -0.155);
    stripe.rotation.x = -0.14;
    chair.add(stripe);
    const pillow = makeRoundedBox(T, 0.22, 0.11, 0.06, 0.04, chairAccent);
    pillow.position.set(0, 1.13, -0.12);
    chair.add(pillow);

    [-0.26, 0.26].forEach((ax) => {
      const armPillar = new T.Mesh(new T.BoxGeometry(0.035, 0.20, 0.04), brushedAlu);
      armPillar.position.set(ax, 0.54, 0.02);
      chair.add(armPillar);
      const armPad = makeRoundedBox(T, 0.075, 0.025, 0.24, 0.015, chairLeather);
      armPad.position.set(ax, 0.64, 0.04);
      chair.add(armPad);
    });

    animators.push((t) => {
      fans.forEach((f, idx) => { f.rotation.z = t * (4.5 + idx * 0.4); });
      chair.rotation.y = Math.PI - 0.55 + Math.sin(t * 0.65) * 0.10;
    });

    return { group, animators };
  }

  function buildAutoElectric(T) {
    const group = new T.Group();
    const animators = [];

    const benchMat = new T.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.62, metalness: 0.18 });
    const esdMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.72, metalness: 0.08 });
    const flukeYellow = new T.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.36, metalness: 0.08 });
    const darkRubber = new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.68, metalness: 0.12 });
    const aluMat = new T.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.32, metalness: 0.82 });
    const copperMat = new T.MeshStandardMaterial({ color: 0xd97706, roughness: 0.28, metalness: 0.88 });
    const cyanGlow = new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.0 });

    // ESD Workbench Slab + Cyan Edge Trim
    const bench = makeRoundedBox(T, 2.25, 0.07, 1.28, 0.03, benchMat);
    bench.position.y = 0.035;
    group.add(bench);
    const esdPad = makeRoundedBox(T, 1.95, 0.015, 0.98, 0.02, esdMat);
    esdPad.position.y = 0.082;
    group.add(esdPad);

    // 1. Modern Digital Oscilloscope (Screen cleanly in front of bezel!)
    const scopeGroup = new T.Group();
    scopeGroup.position.set(0.28, 0.30, -0.28);
    group.add(scopeGroup);
    scopeGroup.add(makeRoundedBox(T, 0.82, 0.44, 0.24, 0.03, new T.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.3 })));
    const scopeScreen = new T.Mesh(
      new T.PlaneGeometry(0.48, 0.32),
      new T.MeshStandardMaterial({
        map: makeScreenCanvas(T, 'scope'),
        emissiveMap: makeScreenCanvas(T, 'scope'),
        emissive: new T.Color(0xffffff),
        emissiveIntensity: 0.95,
      })
    );
    scopeScreen.position.set(-0.12, 0.01, 0.136);
    scopeGroup.add(scopeScreen);
    for (let k = 0; k < 4; k++) {
      const knob = new T.Mesh(new T.CylinderGeometry(0.024, 0.024, 0.032, 16), aluMat);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(0.22 + (k % 2) * 0.10, 0.08 - Math.floor(k / 2) * 0.12, 0.136);
      scopeGroup.add(knob);
    }

    // 2. Modern Digital Fluke Multimeter (Screen & dial cleanly in front!)
    const meterGroup = new T.Group();
    meterGroup.position.set(0.84, 0.28, 0.18);
    meterGroup.rotation.set(-0.34, -0.35, 0);
    group.add(meterGroup);
    meterGroup.add(makeRoundedBox(T, 0.25, 0.44, 0.075, 0.03, flukeYellow));
    const meterScreen = new T.Mesh(
      new T.PlaneGeometry(0.18, 0.11),
      new T.MeshStandardMaterial({
        map: makeScreenCanvas(T, 'fluke'),
        emissiveMap: makeScreenCanvas(T, 'fluke'),
        emissive: new T.Color(0xffffff),
        emissiveIntensity: 0.65,
      })
    );
    meterScreen.position.set(0, 0.115, 0.056);
    meterGroup.add(meterScreen);
    const dial = new T.Mesh(new T.CylinderGeometry(0.058, 0.058, 0.026, 24), darkRubber);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, -0.035, 0.054);
    meterGroup.add(dial);

    // 3. 12V AGM Battery with Red/Black Terminals & Top Label
    const bat = makeRoundedBox(T, 0.56, 0.38, 0.34, 0.025, darkRubber);
    bat.position.set(-0.76, 0.28, -0.18);
    group.add(bat);
    const batCap = new T.Mesh(new T.BoxGeometry(0.52, 0.03, 0.30), new T.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }));
    batCap.position.set(-0.76, 0.48, -0.18);
    group.add(batCap);
    const posTerm = new T.Mesh(new T.CylinderGeometry(0.024, 0.026, 0.055, 16), new T.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }));
    posTerm.position.set(-0.60, 0.51, -0.12);
    group.add(posTerm);
    const negTerm = new T.Mesh(new T.CylinderGeometry(0.024, 0.026, 0.055, 16), aluMat);
    negTerm.position.set(-0.90, 0.51, -0.12);
    group.add(negTerm);

    // 4. 3-Phase Alternator with Copper Stator Windings & Spinning Pulley
    const altGroup = new T.Group();
    altGroup.position.set(-0.26, 0.26, -0.16);
    group.add(altGroup);
    const altShell = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.22, 24), aluMat);
    altShell.rotation.x = Math.PI / 2;
    altGroup.add(altShell);
    const copperBand = new T.Mesh(new T.CylinderGeometry(0.155, 0.155, 0.075, 24), copperMat);
    copperBand.rotation.x = Math.PI / 2;
    altGroup.add(copperBand);
    const pulley = new T.Mesh(new T.CylinderGeometry(0.068, 0.068, 0.075, 20), darkRubber);
    pulley.rotation.x = Math.PI / 2;
    pulley.position.z = 0.155;
    altGroup.add(pulley);

    // 5. Finned Aluminum ECU + Relay/Fuse Box
    const ecu = makeRoundedBox(T, 0.42, 0.06, 0.30, 0.02, aluMat);
    ecu.position.set(-0.18, 0.12, 0.28);
    group.add(ecu);
    for (let f = -4; f <= 4; f++) {
      const fin = new T.Mesh(new T.BoxGeometry(0.36, 0.025, 0.012), aluMat);
      fin.position.set(-0.18, 0.165, 0.28 + f * 0.028);
      group.add(fin);
    }

    // Mini Relay & Fuse Block (Colored fuses)
    const fuseBox = makeRoundedBox(T, 0.26, 0.08, 0.20, 0.015, darkRubber);
    fuseBox.position.set(0.38, 0.13, 0.28);
    group.add(fuseBox);
    [0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e].forEach((fc, fi) => {
      const fuse = new T.Mesh(new T.BoxGeometry(0.028, 0.025, 0.04), new T.MeshStandardMaterial({ color: fc, roughness: 0.3 }));
      fuse.position.set(0.30 + fi * 0.05, 0.185, 0.28);
      group.add(fuse);
    });

    // CAN-Bus Harness Tube + Signal Pulse
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(-0.60, 0.50, -0.12),
      new T.Vector3(-0.56, 0.15, 0.28),
      new T.Vector3(-0.18, 0.13, 0.45),
      new T.Vector3(0.38, 0.15, 0.40),
      new T.Vector3(0.76, 0.19, 0.22),
    ]);
    const harness = new T.Mesh(new T.TubeGeometry(curve, 48, 0.022, 12, false), darkRubber);
    group.add(harness);
    const pulse = new T.Mesh(new T.SphereGeometry(0.034, 12, 12), cyanGlow);
    group.add(pulse);

    animators.push((t) => {
      pulley.rotation.z = t * 5.0;
      const p = curve.getPointAt((t * 0.38) % 1);
      pulse.position.copy(p);
    });

    return { group, animators };
  }

  function buildHvacSplit(T) {
    const group = new T.Group();
    const animators = [];

    const whiteGloss = new T.MeshPhysicalMaterial({ color: 0xf1f5f9, roughness: 0.22, metalness: 0.05, clearcoat: 0.75 });
    const wallMat = new T.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.05 });
    const copperMat = new T.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.88 });
    const insulMat = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.78, metalness: 0.08 });
    const pinkTank = new T.MeshPhysicalMaterial({ color: 0xec4899, roughness: 0.28, metalness: 0.25, clearcoat: 0.5 });
    const darkMetal = new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.65 });

    // Cutaway Floor & Architectural Partition Wall (both sides clearly visible from +Z!)
    const floor = makeRoundedBox(T, 2.38, 0.07, 1.18, 0.03, darkMetal);
    floor.position.y = 0.035;
    group.add(floor);
    const wall = makeRoundedBox(T, 0.16, 1.38, 1.05, 0.02, wallMat);
    wall.position.set(-0.08, 0.72, -0.04);
    group.add(wall);

    // 1. Sleek Modern Indoor Split AC Unit (Mounted cleanly on left room side of wall, facing +Z)
    const indoor = makeRoundedBox(T, 0.82, 0.30, 0.22, 0.055, whiteGloss);
    indoor.position.set(-0.62, 0.98, 0.08);
    group.add(indoor);
    const ledDisplay = new T.Mesh(
      new T.PlaneGeometry(0.14, 0.055),
      new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.2 })
    );
    ledDisplay.position.set(-0.36, 0.99, 0.205);
    group.add(ledDisplay);
    const louver = new T.Mesh(new T.BoxGeometry(0.72, 0.025, 0.04), darkMetal);
    louver.position.set(-0.62, 0.85, 0.18);
    louver.rotation.x = 0.35;
    group.add(louver);

    // 2. Clean Modern Inverter Outdoor Condenser (Right) with Fan Grille Bars & Brass Valves
    const outdoor = makeRoundedBox(T, 0.82, 0.68, 0.34, 0.04, whiteGloss);
    outdoor.position.set(0.56, 0.44, -0.02);
    group.add(outdoor);
    const fanRim = new T.Mesh(new T.TorusGeometry(0.24, 0.018, 12, 36), darkMetal);
    fanRim.position.set(0.50, 0.46, 0.165);
    group.add(fanRim);
    // Protective horizontal grille bars
    for (let g = -3; g <= 3; g++) {
      const bar = new T.Mesh(new T.BoxGeometry(0.46, 0.01, 0.01), darkMetal);
      bar.position.set(0.50, 0.46 + g * 0.065, 0.172);
      group.add(bar);
    }
    const fanHub = new T.Group();
    fanHub.position.set(0.50, 0.46, 0.145);
    for (let b = 0; b < 3; b++) {
      const blade = new T.Mesh(new T.BoxGeometry(0.08, 0.20, 0.012), new T.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 }));
      const a = (b / 3) * Math.PI * 2;
      blade.position.set(Math.cos(a) * 0.10, Math.sin(a) * 0.10, 0);
      blade.rotation.z = a + 0.35;
      fanHub.add(blade);
    }
    group.add(fanHub);

    // 3. Insulated Copper Line Set Passing Through Wall
    [0.02, -0.06].forEach((py, idx) => {
      const pipeCurve = new T.CatmullRomCurve3([
        new T.Vector3(-0.22, 0.92 + py, 0.02),
        new T.Vector3(0.08, 0.92 + py, 0.02),
        new T.Vector3(0.14, 0.44 + py, 0.02),
        new T.Vector3(0.14, 0.30 + py, 0.08),
      ]);
      const mat = idx === 0 ? insulMat : copperMat;
      const tube = new T.Mesh(new T.TubeGeometry(pipeCurve, 32, idx === 0 ? 0.028 : 0.016, 12, false), mat);
      group.add(tube);
    });

    // 4. R410A Cylinder on Digital Scale (with LCD) + Manifold Gauge Set
    const scale = makeRoundedBox(T, 0.34, 0.055, 0.34, 0.02, darkMetal);
    scale.position.set(0.95, 0.095, 0.32);
    group.add(scale);
    const scaleLcd = new T.Mesh(
      new T.PlaneGeometry(0.16, 0.055),
      new T.MeshStandardMaterial({
        map: makeScreenCanvas(T, 'scale'),
        emissiveMap: makeScreenCanvas(T, 'scale'),
        emissive: new T.Color(0xffffff),
        emissiveIntensity: 0.75,
      })
    );
    scaleLcd.position.set(0.95, 0.10, 0.50);
    scaleLcd.rotation.x = -0.3;
    group.add(scaleLcd);

    const tank = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.36, 24), pinkTank);
    tank.position.set(0.95, 0.30, 0.30);
    group.add(tank);
    const tankTop = new T.Mesh(new T.SphereGeometry(0.12, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), pinkTank);
    tankTop.position.set(0.95, 0.48, 0.30);
    group.add(tankTop);
    const valve = new T.Mesh(new T.CylinderGeometry(0.032, 0.032, 0.04, 14), copperMat);
    valve.position.set(0.95, 0.62, 0.30);
    group.add(valve);

    // Manifold Gauges (LP Blue + HP Red) with Brass Body
    const manifoldBar = new T.Mesh(new T.BoxGeometry(0.24, 0.05, 0.04), copperMat);
    manifoldBar.position.set(0.88, 0.88, 0.14);
    group.add(manifoldBar);
    const lpGauge = new T.Mesh(new T.CylinderGeometry(0.065, 0.065, 0.032, 20), new T.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3 }));
    lpGauge.rotation.x = Math.PI / 2;
    lpGauge.position.set(0.80, 0.96, 0.15);
    group.add(lpGauge);
    const hpGauge = new T.Mesh(new T.CylinderGeometry(0.065, 0.065, 0.032, 20), new T.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }));
    hpGauge.rotation.x = Math.PI / 2;
    hpGauge.position.set(0.96, 0.96, 0.15);
    group.add(hpGauge);

    animators.push((t) => {
      fanHub.rotation.z = -t * 7.5;
    });

    return { group, animators };
  }

  function buildDesignStudio(T) {
    const group = new T.Group();
    const animators = [];

    const oakMat = new T.MeshStandardMaterial({ color: 0x9c6b3f, roughness: 0.58, metalness: 0.04 });
    const matteBlack = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.52, metalness: 0.22 });
    const aluMat = new T.MeshStandardMaterial({ color: 0x64748b, roughness: 0.32, metalness: 0.78 });
    const wallMat = new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.82, metalness: 0.05 });

    // 0. Loft Gallery Wall with Framed Bauhaus Posters
    const backWall = makeRoundedBox(T, 2.15, 1.32, 0.06, 0.02, wallMat);
    backWall.position.set(-0.18, 0.84, -0.56);
    group.add(backWall);
    [-0.65, -0.05].forEach((px, idx) => {
      const frame = makeRoundedBox(T, 0.42, 0.54, 0.025, 0.015, matteBlack);
      frame.position.set(px, 1.15, -0.52);
      group.add(frame);
      const art = new T.Mesh(
        new T.PlaneGeometry(0.36, 0.48),
        new T.MeshStandardMaterial({
          map: makeScreenCanvas(T, idx === 0 ? 'poster' : 'cintiq'),
          emissiveMap: makeScreenCanvas(T, idx === 0 ? 'poster' : 'cintiq'),
          emissive: new T.Color(0xffffff),
          emissiveIntensity: 0.35,
        })
      );
      art.position.set(px, 1.15, -0.50);
      group.add(art);
    });

    // 1. Solid Oak Designer Desk
    const desk = makeRoundedBox(T, 1.85, 0.055, 0.94, 0.03, oakMat);
    desk.position.set(-0.22, 0.72, 0);
    group.add(desk);
    [[-1.05, -0.38], [0.60, -0.38], [-1.05, 0.38], [0.60, 0.38]].forEach(([lx, lz]) => {
      const leg = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.70, 14), matteBlack);
      leg.position.set(lx, 0.35, lz);
      group.add(leg);
    });

    // 2. Wacom Cintiq Pen Display (screen cleanly in front of bezel!)
    const cintiqGroup = new T.Group();
    cintiqGroup.position.set(-0.18, 0.94, -0.05);
    cintiqGroup.rotation.x = -0.45;
    group.add(cintiqGroup);
    cintiqGroup.add(makeRoundedBox(T, 0.70, 0.45, 0.03, 0.025, matteBlack));
    const cintiqScreen = new T.Mesh(
      new T.PlaneGeometry(0.62, 0.38),
      new T.MeshStandardMaterial({
        map: makeScreenCanvas(T, 'cintiq'),
        emissiveMap: makeScreenCanvas(T, 'cintiq'),
        emissive: new T.Color(0xffffff),
        emissiveIntensity: 0.88,
      })
    );
    cintiqScreen.position.z = 0.026;
    cintiqGroup.add(cintiqScreen);

    // 3. Fanned Pantone Swatch Book + 3D Packaging Box + Cup
    const pantoneCols = [0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899, 0xf43f5e, 0xf59e0b, 0x10b981];
    pantoneCols.forEach((col, i) => {
      const card = new T.Mesh(
        new T.BoxGeometry(0.06, 0.008, 0.18),
        new T.MeshStandardMaterial({ color: col, roughness: 0.28 })
      );
      card.position.set(-0.74, 0.76 + i * 0.003, 0.24);
      card.rotation.y = -0.6 + i * 0.22;
      group.add(card);
    });

    const pkgBox = makeRoundedBox(T, 0.18, 0.26, 0.18, 0.015, new T.MeshStandardMaterial({ color: 0x3730a3, roughness: 0.38, metalness: 0.2 }));
    pkgBox.position.set(-0.74, 0.88, -0.14);
    pkgBox.rotation.y = 0.32;
    group.add(pkgBox);
    const cup = new T.Mesh(new T.CylinderGeometry(0.055, 0.042, 0.16, 20), new T.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }));
    cup.position.set(-0.52, 0.83, -0.08);
    group.add(cup);

    // 4. Wide-Format CMYK Print Plotter (Right) with Live Rolling Poster
    const plotter = makeRoundedBox(T, 0.86, 0.24, 0.36, 0.03, matteBlack);
    plotter.position.set(0.96, 0.96, -0.10);
    plotter.rotation.y = -0.35;
    group.add(plotter);
    [0.62, 1.24].forEach((px) => {
      const leg = new T.Mesh(new T.CylinderGeometry(0.024, 0.024, 0.90, 12), aluMat);
      leg.position.set(px, 0.45, -0.10);
      group.add(leg);
    });
    const posterSheet = new T.Mesh(
      new T.PlaneGeometry(0.62, 0.44),
      new T.MeshStandardMaterial({
        map: makeScreenCanvas(T, 'poster'),
        emissiveMap: makeScreenCanvas(T, 'poster'),
        emissive: new T.Color(0xffffff),
        emissiveIntensity: 0.55,
        side: T.DoubleSide,
      })
    );
    posterSheet.position.set(0.91, 0.68, 0.12);
    posterSheet.rotation.set(0.28, -0.35, 0);
    group.add(posterSheet);

    // 5. Studio Softbox Light on Tripod (Left)
    const tripod = new T.Mesh(new T.CylinderGeometry(0.016, 0.02, 1.25, 12), aluMat);
    tripod.position.set(-1.12, 0.62, 0.26);
    group.add(tripod);
    const softGroup = new T.Group();
    softGroup.position.set(-1.10, 1.32, 0.26);
    softGroup.rotation.y = 0.72;
    group.add(softGroup);
    softGroup.add(makeRoundedBox(T, 0.38, 0.48, 0.16, 0.03, matteBlack));
    const diffuser = new T.Mesh(
      new T.PlaneGeometry(0.34, 0.44),
      new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffbeb, emissiveIntensity: 1.5 })
    );
    diffuser.position.z = 0.095;
    softGroup.add(diffuser);

    animators.push((t) => {
      posterSheet.position.y = 0.68 + Math.sin(t * 1.4) * 0.025;
    });

    return { group, animators };
  }

  function build(T, studioType) {
    if (studioType === 'gaming_room_rig') return buildGamingIT(T);
    if (studioType === 'autoelectric_lab') return buildAutoElectric(T);
    if (studioType === 'hvac_rooftop') return buildHvacSplit(T);
    if (studioType === 'design_studio') return buildDesignStudio(T);
    return { group: new T.Group(), animators: [] };
  }

  return { build };
})();
