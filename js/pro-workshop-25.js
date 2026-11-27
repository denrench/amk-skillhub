/**
 * AMK SkillHub · Pro 3D Workshop Models (Three.js r128)
 * Все 25 детализированных анимированных PBR 3D-сборок для симулятора и уроков
 * (Автомеханика 5, Автоэлектрика 5, HVAC 5, Графдизайн 5, IT/Веб-дизайн 5).
 */
window.AMKProWorkshop25 = (function () {
  'use strict';

  function rBox(T, w, h, d, r, mat) {
    const s = new T.Shape();
    const x = -w / 2, y = -h / 2, rad = Math.min(r, w * 0.38, h * 0.38);
    s.moveTo(x + rad, y);
    s.lineTo(x + w - rad, y);
    s.quadraticCurveTo(x + w, y, x + w, y + rad);
    s.lineTo(x + w, y + h - rad);
    s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    s.lineTo(x + rad, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - rad);
    s.lineTo(x, y + rad);
    s.quadraticCurveTo(x, y, x + rad, y);
    const geo = new T.ExtrudeGeometry(s, {
      depth: d,
      bevelEnabled: true,
      bevelThickness: Math.min(0.015, d * 0.2),
      bevelSize: Math.min(0.012, rad * 0.4),
      bevelSegments: 2,
      curveSegments: 6,
    });
    geo.center();
    return new T.Mesh(geo, mat);
  }

  function makeLabelTex(T, title, sub, bg, fg) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg || '#06121c';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = fg || '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 240);
    ctx.fillStyle = fg || '#38bdf8';
    ctx.font = 'bold 40px monospace';
    ctx.fillText(title, 28, 108);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(sub || '', 28, 172);
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function mats(T) {
    return {
      alu: new T.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.30, metalness: 0.85 }),
      darkSteel: new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.72 }),
      chrome: new T.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.14, metalness: 0.95 }),
      copper: new T.MeshStandardMaterial({ color: 0xd97706, roughness: 0.28, metalness: 0.90 }),
      exhaustBronze: new T.MeshStandardMaterial({ color: 0xb45309, roughness: 0.38, metalness: 0.78 }),
      rubber: new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.78, metalness: 0.08 }),
      whiteGloss: new T.MeshPhysicalMaterial({ color: 0xf1f5f9, roughness: 0.20, metalness: 0.05, clearcoat: 0.8 }),
      redCaliper: new T.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.24, metalness: 0.35, clearcoat: 0.8 }),
      hvOrange: new T.MeshStandardMaterial({ color: 0xf97316, roughness: 0.32, metalness: 0.22 }),
      pinkTank: new T.MeshPhysicalMaterial({ color: 0xec4899, roughness: 0.26, metalness: 0.25, clearcoat: 0.6 }),
      indigoMat: new T.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.32, metalness: 0.35 }),
      cyanGlow: new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.8 }),
      greenGlow: new T.MeshStandardMaterial({ color: 0x34d399, emissive: 0x34d399, emissiveIntensity: 1.6 }),
      amberGlow: new T.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 1.4 }),
      glass: new T.MeshPhysicalMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.05 }),
    };
  }

  // ==================== 1. АВТОМЕХАНИКА (5) ====================
  function buildMechTurbo(T, m) {
    const g = new T.Group();
    const ic = rBox(T, 1.8, 0.56, 0.26, 0.04, m.alu);
    ic.position.set(0, 0.35, 0.75);
    g.add(ic);
    for (let i = -5; i <= 5; i++) {
      const fin = new T.Mesh(new T.BoxGeometry(1.5, 0.02, 0.28), m.darkSteel);
      fin.position.set(0, 0.35 + i * 0.042, 0.75);
      g.add(fin);
    }
    const cold = new T.Mesh(new T.TorusGeometry(0.42, 0.18, 20, 36), m.chrome);
    cold.position.set(-0.42, 1.05, 0); cold.rotation.y = Math.PI / 2; g.add(cold);
    const hot = new T.Mesh(new T.TorusGeometry(0.40, 0.17, 20, 36), m.exhaustBronze);
    hot.position.set(0.42, 1.05, 0); hot.rotation.y = Math.PI / 2; g.add(hot);
    const chra = new T.Mesh(new T.CylinderGeometry(0.20, 0.20, 0.65, 24), m.darkSteel);
    chra.rotation.z = Math.PI / 2; chra.position.set(0, 1.05, 0); g.add(chra);
    const wheel = new T.Group(); wheel.position.set(-0.56, 1.05, 0);
    for (let b = 0; b < 8; b++) {
      const a = (b / 8) * Math.PI * 2;
      const blade = new T.Mesh(new T.BoxGeometry(0.03, 0.28, 0.06), m.cyanGlow);
      blade.position.set(0, Math.cos(a) * 0.12, Math.sin(a) * 0.12);
      blade.rotation.x = a; wheel.add(blade);
    }
    g.add(wheel);
    const pipeCurve = new T.CatmullRomCurve3([
      new T.Vector3(-0.42, 1.45, 0), new T.Vector3(-0.75, 1.25, 0.45), new T.Vector3(-0.85, 0.55, 0.75),
    ]);
    g.add(new T.Mesh(new T.TubeGeometry(pipeCurve, 28, 0.08, 14, false), m.alu));
    return { group: g, tick: (t, spd) => { wheel.rotation.x = t * 6.0 * spd; } };
  }

  function buildMechCylinder(T, m) {
    const g = new T.Group();
    const block = rBox(T, 1.5, 0.95, 0.9, 0.05, m.glass);
    block.position.set(0, 0.85, 0); g.add(block);
    const crank = new T.Group(); crank.position.set(0, 0.35, 0);
    const shaft = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 1.7, 20), m.chrome);
    shaft.rotation.z = Math.PI / 2; crank.add(shaft); g.add(crank);
    const pistons = [];
    [-0.36, 0.36].forEach((px, idx) => {
      const sleeve = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.85, 24, 1, true), m.darkSteel);
      sleeve.position.set(px, 0.95, 0); g.add(sleeve);
      const piston = new T.Group(); piston.position.set(px, 0.95, 0);
      piston.add(new T.Mesh(new T.CylinderGeometry(0.23, 0.23, 0.24, 24), m.alu));
      const ring = new T.Mesh(new T.TorusGeometry(0.235, 0.015, 8, 24), m.copper);
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.06; piston.add(ring);
      g.add(piston);
      pistons.push({ mesh: piston, phase: idx * Math.PI });
    });
    [-0.22, 0.22].forEach((cz) => {
      const cam = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.55, 16), m.copper);
      cam.rotation.z = Math.PI / 2; cam.position.set(0, 1.55, cz); g.add(cam);
    });
    return {
      group: g,
      tick: (t, spd) => {
        crank.rotation.x = t * 4.0 * spd;
        pistons.forEach((p) => { p.mesh.position.y = 0.92 + Math.sin(t * 4.0 * spd + p.phase) * 0.22; });
      },
    };
  }

  function buildMechTransmission(T, m) {
    const g = new T.Group();
    const housing = rBox(T, 2.0, 0.22, 1.1, 0.04, m.darkSteel);
    housing.position.set(0, 0.15, 0); g.add(housing);
    const gears = [];
    [[-0.65, 0.85, 0.34, m.alu], [-0.15, 0.85, 0.26, m.copper], [0.35, 0.85, 0.32, m.chrome], [0.85, 0.85, 0.42, m.alu]].forEach(([gx, gy, rad, mat], i) => {
      const gr = new T.Group(); gr.position.set(gx, gy, 0);
      const disc = new T.Mesh(new T.CylinderGeometry(rad, rad, 0.18, 24), mat);
      disc.rotation.z = Math.PI / 2; gr.add(disc);
      for (let t = 0; t < 12; t++) {
        const a = (t / 12) * Math.PI * 2;
        const tooth = new T.Mesh(new T.BoxGeometry(0.18, 0.06, 0.06), mat);
        tooth.position.set(0, Math.cos(a) * (rad + 0.02), Math.sin(a) * (rad + 0.02));
        tooth.rotation.x = a; gr.add(tooth);
      }
      g.add(gr);
      gears.push({ mesh: gr, dir: i % 2 === 0 ? 1 : -1 });
    });
    const shaft = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.2, 18), m.chrome);
    shaft.rotation.z = Math.PI / 2; shaft.position.set(0.1, 0.85, 0); g.add(shaft);
    return { group: g, tick: (t, spd) => { gears.forEach((gr) => { gr.mesh.rotation.x = t * 2.5 * spd * gr.dir; }); } };
  }

  function buildMechSuspension(T, m) {
    const g = new T.Group();
    const controlArm = rBox(T, 1.4, 0.12, 0.55, 0.04, m.darkSteel);
    controlArm.position.set(-0.2, 0.25, 0); g.add(controlArm);
    const strut = new T.Mesh(new T.CylinderGeometry(0.09, 0.11, 1.35, 20), m.chrome);
    strut.position.set(0.25, 0.95, 0); strut.rotation.z = 0.15; g.add(strut);
    for (let c = 0; c < 6; c++) {
      const coil = new T.Mesh(new T.TorusGeometry(0.18, 0.032, 10, 24), m.redCaliper);
      coil.position.set(0.22 + c * 0.015, 0.65 + c * 0.11, 0);
      coil.rotation.x = Math.PI / 2; g.add(coil);
    }
    const hub = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.22, 24), m.alu);
    hub.rotation.x = Math.PI / 2; hub.position.set(0.45, 0.42, 0); g.add(hub);
    return { group: g, tick: (t, spd) => { strut.position.y = 0.95 + Math.sin(t * 2.2 * spd) * 0.06; } };
  }

  function buildMechBrakes(T, m) {
    const g = new T.Group();
    const rotor = new T.Group(); rotor.position.set(0, 0.85, 0);
    const disc = new T.Mesh(new T.CylinderGeometry(0.68, 0.68, 0.09, 36), m.chrome);
    disc.rotation.x = Math.PI / 2; rotor.add(disc);
    const hat = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.15, 24), m.darkSteel);
    hat.rotation.x = Math.PI / 2; rotor.add(hat);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const hole = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.11, 8), m.rubber);
      hole.rotation.x = Math.PI / 2; hole.position.set(Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0); rotor.add(hole);
    }
    g.add(rotor);
    const caliper = rBox(T, 0.38, 0.56, 0.24, 0.06, m.redCaliper);
    caliper.position.set(0.55, 0.98, 0); caliper.rotation.z = -0.35; g.add(caliper);
    return { group: g, tick: (t, spd) => { rotor.rotation.z = -t * 2.8 * spd; } };
  }

  // ==================== 2. АВТОЭЛЕКТРИКА (5) ====================
  function buildAutoEl(T, m, kind) {
    const g = new T.Group();
    const bench = rBox(T, 2.2, 0.10, 1.25, 0.04, m.darkSteel);
    bench.position.y = 0.10; g.add(bench);
    let animFn = () => {};

    if (kind === 'autoel-charging') {
      const alt = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.44, 24), m.alu);
      alt.rotation.x = Math.PI / 2; alt.position.set(-0.35, 0.58, 0); g.add(alt);
      const stator = new T.Mesh(new T.CylinderGeometry(0.31, 0.31, 0.14, 24), m.copper);
      stator.rotation.x = Math.PI / 2; stator.position.set(-0.35, 0.58, 0); g.add(stator);
      const pulley = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.14, 20), m.rubber);
      pulley.rotation.x = Math.PI / 2; pulley.position.set(-0.35, 0.58, 0.30); g.add(pulley);
      const bat = rBox(T, 0.65, 0.46, 0.42, 0.03, m.rubber);
      bat.position.set(0.55, 0.40, 0); g.add(bat);
      animFn = (t, spd) => { pulley.rotation.z = t * 5.0 * spd; };
    } else if (kind === 'autoel-can') {
      const scope = rBox(T, 0.95, 0.58, 0.30, 0.04, m.alu);
      scope.position.set(0.35, 0.52, -0.22); g.add(scope);
      const tex = makeLabelTex(T, 'CAN-BUS 500k', '60 Ohm · H/L OK', '#06121c', '#34d399');
      const scr = new T.Mesh(new T.PlaneGeometry(0.74, 0.42), new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new T.Color(0xffffff), emissiveIntensity: 0.9 }));
      scr.position.set(0.35, 0.52, -0.055); g.add(scr);
      const ecu = rBox(T, 0.58, 0.12, 0.42, 0.03, m.alu);
      ecu.position.set(-0.52, 0.25, 0.20); g.add(ecu);
      const pulse = new T.Mesh(new T.SphereGeometry(0.05, 12, 12), m.cyanGlow); g.add(pulse);
      animFn = (t, spd) => { pulse.position.set(-0.52 + ((t * spd) % 1) * 0.9, 0.28, 0.20); };
    } else if (kind === 'autoel-ignition') {
      for (let i = 0; i < 4; i++) {
        const px = -0.6 + i * 0.4;
        const coil = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.52, 16), m.redCaliper);
        coil.position.set(px, 0.55, 0); g.add(coil);
        const spark = new T.Mesh(new T.SphereGeometry(0.045, 10, 10), m.cyanGlow);
        spark.position.set(px, 0.24, 0); spark.userData.idx = i; g.add(spark);
      }
      animFn = (t, spd) => {
        const active = Math.floor(t * 4 * spd) % 4;
        g.children.forEach((c) => { if (c.userData.idx !== undefined) c.visible = c.userData.idx === active; });
      };
    } else if (kind === 'autoel-sensors') {
      const wheel = new T.Group(); wheel.position.set(-0.2, 0.68, 0);
      const disc = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.08, 32), m.chrome);
      disc.rotation.x = Math.PI / 2; wheel.add(disc);
      for (let i = 0; i < 18; i++) {
        if (i === 0) continue;
        const a = (i / 18) * Math.PI * 2;
        const tth = new T.Mesh(new T.BoxGeometry(0.04, 0.08, 0.08), m.alu);
        tth.position.set(Math.cos(a) * 0.44, Math.sin(a) * 0.44, 0); tth.rotation.z = a; wheel.add(tth);
      }
      g.add(wheel);
      const sensor = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.28, 16), m.copper);
      sensor.rotation.z = Math.PI / 2; sensor.position.set(0.45, 0.68, 0); g.add(sensor);
      animFn = (t, spd) => { wheel.rotation.z = t * 3.5 * spd; };
    } else {
      const pack = rBox(T, 1.35, 0.34, 0.85, 0.04, m.darkSteel);
      pack.position.set(0, 0.34, 0); g.add(pack);
      for (let c = -2; c <= 2; c++) {
        const cell = rBox(T, 0.20, 0.22, 0.68, 0.02, m.hvOrange);
        cell.position.set(c * 0.24, 0.54, 0); g.add(cell);
      }
      const inv = rBox(T, 0.55, 0.24, 0.42, 0.03, m.alu);
      inv.position.set(0, 0.78, 0); g.add(inv);
    }
    return { group: g, tick: animFn };
  }

  // ==================== 3. ХОЛОДИЛЬНОЕ ОБОРУДОВАНИЕ / HVAC (5) ====================
  function buildHvac(T, m, kind) {
    const g = new T.Group();
    const base = rBox(T, 2.3, 0.09, 1.25, 0.04, m.darkSteel);
    base.position.y = 0.045; g.add(base);
    let animFn = () => {};

    if (kind === 'hvac-cycle') {
      const comp = new T.Mesh(new T.CylinderGeometry(0.24, 0.26, 0.62, 24), m.rubber);
      comp.position.set(-0.72, 0.40, 0.15); g.add(comp);
      const cond = rBox(T, 0.62, 0.72, 0.18, 0.02, m.alu);
      cond.position.set(-0.15, 0.46, -0.25); g.add(cond);
      const evap = rBox(T, 0.62, 0.72, 0.18, 0.02, m.glass);
      evap.position.set(0.68, 0.46, -0.20); g.add(evap);
      const txv = new T.Mesh(new T.ConeGeometry(0.09, 0.18, 14), m.copper);
      txv.position.set(0.26, 0.65, 0.05); g.add(txv);
      const tex = makeLabelTex(T, '-18.4 C', 'LP 2.2 · HP 14.0 bar', '#04121e', '#38bdf8');
      const disp = rBox(T, 0.65, 0.34, 0.12, 0.02, m.darkSteel);
      disp.position.set(0.32, 0.28, 0.36); g.add(disp);
      const scr = new T.Mesh(new T.PlaneGeometry(0.56, 0.24), new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new T.Color(0xffffff), emissiveIntensity: 0.9 }));
      scr.position.set(0.32, 0.28, 0.43); g.add(scr);
      const loopCurve = new T.CatmullRomCurve3([
        new T.Vector3(-0.72, 0.72, 0.15), new T.Vector3(-0.15, 0.78, -0.25),
        new T.Vector3(0.26, 0.65, 0.05), new T.Vector3(0.68, 0.72, -0.20),
        new T.Vector3(0.0, 0.22, 0.15),
      ], true);
      g.add(new T.Mesh(new T.TubeGeometry(loopCurve, 48, 0.024, 10, true), m.copper));
      const p = new T.Mesh(new T.SphereGeometry(0.048, 12, 12), m.cyanGlow); g.add(p);
      animFn = (t, spd) => { p.position.copy(loopCurve.getPointAt((t * 0.28 * spd) % 1)); };
    } else if (kind === 'hvac-chiller') {
      const shell = rBox(T, 1.4, 0.85, 0.8, 0.06, m.glass);
      shell.position.set(0, 0.56, 0); g.add(shell);
      const crank = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 1.1, 20), m.chrome);
      crank.rotation.z = Math.PI / 2; crank.position.set(0, 0.36, 0); g.add(crank);
      const pist = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.26, 24), m.alu);
      pist.position.set(0, 0.68, 0); g.add(pist);
      const valve = rBox(T, 0.68, 0.07, 0.52, 0.02, m.copper);
      valve.position.set(0, 0.98, 0); g.add(valve);
      animFn = (t, spd) => {
        crank.rotation.x = t * 4.2 * spd;
        pist.position.y = 0.66 + Math.sin(t * 4.2 * spd) * 0.16;
      };
    } else if (kind === 'hvac-inverter') {
      const unit = rBox(T, 1.15, 0.88, 0.44, 0.04, m.whiteGloss);
      unit.position.set(-0.2, 0.54, 0); g.add(unit);
      const rim = new T.Mesh(new T.TorusGeometry(0.30, 0.022, 12, 32), m.darkSteel);
      rim.position.set(-0.28, 0.54, 0.235); g.add(rim);
      const fan = new T.Group(); fan.position.set(-0.28, 0.54, 0.21);
      for (let b = 0; b < 3; b++) {
        const a = (b / 3) * Math.PI * 2;
        const bl = new T.Mesh(new T.BoxGeometry(0.09, 0.24, 0.014), m.cyanGlow);
        bl.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0); bl.rotation.z = a + 0.3; fan.add(bl);
      }
      g.add(fan);
      const ipm = rBox(T, 0.48, 0.36, 0.06, 0.02, m.greenGlow);
      ipm.position.set(0.68, 0.48, 0.05); g.add(ipm);
      animFn = (t, spd) => { fan.rotation.z = -t * 6.5 * spd; };
    } else if (kind === 'hvac-vrf') {
      const trunk = new T.CatmullRomCurve3([new T.Vector3(-0.95, 0.32, 0), new T.Vector3(0, 0.32, 0)]);
      g.add(new T.Mesh(new T.TubeGeometry(trunk, 20, 0.04, 12, false), m.copper));
      const b1 = new T.CatmullRomCurve3([new T.Vector3(0, 0.32, 0), new T.Vector3(0.85, 0.72, -0.28)]);
      const b2 = new T.CatmullRomCurve3([new T.Vector3(0, 0.32, 0), new T.Vector3(0.85, 0.25, 0.28)]);
      g.add(new T.Mesh(new T.TubeGeometry(b1, 20, 0.028, 10, false), m.copper));
      g.add(new T.Mesh(new T.TubeGeometry(b2, 20, 0.028, 10, false), m.copper));
      const u1 = rBox(T, 0.55, 0.26, 0.22, 0.04, m.whiteGloss); u1.position.set(0.85, 0.72, -0.28); g.add(u1);
      const u2 = rBox(T, 0.55, 0.26, 0.22, 0.04, m.whiteGloss); u2.position.set(0.85, 0.25, 0.28); g.add(u2);
      const p1 = new T.Mesh(new T.SphereGeometry(0.04, 10, 10), m.cyanGlow); g.add(p1);
      animFn = (t, spd) => { p1.position.copy(b1.getPointAt((t * 0.45 * spd) % 1)); };
    } else {
      const pump = rBox(T, 0.52, 0.36, 0.32, 0.04, m.indigoMat);
      pump.position.set(-0.68, 0.27, 0); g.add(pump);
      const lp = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.05, 20), m.cyanGlow);
      lp.rotation.x = Math.PI / 2; lp.position.set(-0.15, 0.75, 0); g.add(lp);
      const hp = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.05, 20), m.redCaliper);
      hp.rotation.x = Math.PI / 2; hp.position.set(0.15, 0.75, 0); g.add(hp);
      const scale = rBox(T, 0.45, 0.07, 0.45, 0.02, m.darkSteel);
      scale.position.set(0.68, 0.12, 0.15); g.add(scale);
      const tank = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.46, 24), m.pinkTank);
      tank.position.set(0.68, 0.39, 0.15); g.add(tank);
      const cap = new T.Mesh(new T.SphereGeometry(0.16, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), m.pinkTank);
      cap.position.set(0.68, 0.62, 0.15); g.add(cap);
    }
    return { group: g, tick: animFn };
  }

  // ==================== 4. ГРАФИЧЕСКИЙ ДИЗАЙН (5) ====================
  function buildDesign(T, m, kind) {
    const g = new T.Group();
    const desk = rBox(T, 2.2, 0.08, 1.2, 0.04, m.darkSteel);
    desk.position.y = 0.04; g.add(desk);
    let animFn = () => {};

    if (kind === 'design-packaging') {
      const box = rBox(T, 0.52, 0.78, 0.52, 0.03, m.indigoMat);
      box.position.set(-0.36, 0.48, -0.08); box.rotation.y = 0.3; g.add(box);
      const bottle = new T.Mesh(new T.CylinderGeometry(0.18, 0.20, 0.62, 28), m.whiteGloss);
      bottle.position.set(0.38, 0.40, 0.12); g.add(bottle);
      const pump = new T.Mesh(new T.CylinderGeometry(0.05, 0.07, 0.16, 18), m.chrome);
      pump.position.set(0.38, 0.78, 0.12); g.add(pump);
      const nozzle = new T.Mesh(new T.BoxGeometry(0.14, 0.04, 0.05), m.chrome);
      nozzle.position.set(0.45, 0.84, 0.12); g.add(nozzle);
    } else if (kind === 'design-color') {
      const wheel = new T.Group(); wheel.position.set(0, 0.65, 0);
      const cols = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899];
      cols.forEach((c, i) => {
        const a = (i / cols.length) * Math.PI * 2;
        const seg = rBox(T, 0.24, 0.24, 0.08, 0.03, new T.MeshStandardMaterial({ color: c, roughness: 0.25 }));
        seg.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0);
        seg.rotation.z = a; wheel.add(seg);
      });
      g.add(wheel);
      animFn = (t, spd) => { wheel.rotation.z = t * 0.55 * spd; };
    } else if (kind === 'design-lighting') {
      const subject = new T.Mesh(new T.TorusKnotGeometry(0.24, 0.08, 64, 16), m.chrome);
      subject.position.set(0, 0.56, 0); g.add(subject);
      [[-0.85, 0.95, 0.45, m.amberGlow], [0.85, 0.75, 0.45, m.cyanGlow], [0, 1.05, -0.55, m.whiteGloss]].forEach(([lx, ly, lz, lm]) => {
        const lamp = rBox(T, 0.34, 0.28, 0.12, 0.02, lm);
        lamp.position.set(lx, ly, lz); lamp.lookAt(0, 0.56, 0); g.add(lamp);
      });
      animFn = (t, spd) => { subject.rotation.y = t * 0.8 * spd; };
    } else if (kind === 'design-typography') {
      const board = rBox(T, 1.05, 1.25, 0.06, 0.03, m.whiteGloss);
      board.position.set(0, 0.74, -0.05); board.rotation.x = -0.18; g.add(board);
      const tex = makeLabelTex(T, 'BLEED 3MM', 'CMYK 300 DPI · GRID', '#0f172a', '#22d3ee');
      const print = new T.Mesh(new T.PlaneGeometry(0.92, 1.10), new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new T.Color(0xffffff), emissiveIntensity: 0.55 }));
      print.position.set(0, 0.75, -0.005); print.rotation.x = -0.18; g.add(print);
    } else {
      const book = rBox(T, 1.1, 0.09, 0.75, 0.02, m.whiteGloss);
      book.position.set(-0.15, 0.16, 0.1); g.add(book);
      const mono = new T.Mesh(new T.OctahedronGeometry(0.32, 0), m.indigoMat);
      mono.position.set(0.25, 0.65, -0.1); g.add(mono);
      animFn = (t, spd) => { mono.rotation.y = t * 1.1 * spd; };
    }
    return { group: g, tick: animFn };
  }

  // ==================== 5. IT / ВЕБ-ДИЗАЙН (5) ====================
  function buildIt(T, m, kind) {
    const g = new T.Group();
    const base = rBox(T, 2.2, 0.08, 1.2, 0.04, m.darkSteel);
    base.position.y = 0.04; g.add(base);
    let animFn = () => {};

    if (kind === 'it-grid') {
      const layers = [
        [1.75, 1.05, 0.14, m.indigoMat, 'MARGIN'],
        [1.42, 0.82, 0.30, m.cyanGlow, 'BORDER'],
        [1.12, 0.64, 0.46, m.greenGlow, 'PADDING'],
        [0.82, 0.46, 0.62, m.whiteGloss, 'CONTENT'],
      ];
      layers.forEach(([w, d, y, mat]) => {
        const box = rBox(T, w, 0.07, d, 0.03, mat);
        box.position.y = y; g.add(box);
      });
    } else if (kind === 'it-dom') {
      const mon = rBox(T, 1.25, 0.72, 0.06, 0.03, m.darkSteel);
      mon.position.set(-0.22, 0.62, -0.12); g.add(mon);
      const tex = makeLabelTex(T, 'DOM + FLEX', 'Desktop 1440px OK', '#070b16', '#38bdf8');
      const scr = new T.Mesh(new T.PlaneGeometry(1.14, 0.62), new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new T.Color(0xffffff), emissiveIntensity: 0.9 }));
      scr.position.set(-0.22, 0.62, -0.075); g.add(scr);
      const phone = rBox(T, 0.34, 0.62, 0.05, 0.04, m.darkSteel);
      phone.position.set(0.68, 0.48, 0.12); phone.rotation.y = -0.3; g.add(phone);
      const pScr = new T.Mesh(new T.PlaneGeometry(0.28, 0.52), new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new T.Color(0xffffff), emissiveIntensity: 0.9 }));
      pScr.position.set(0.665, 0.48, 0.15); pScr.rotation.y = -0.3; g.add(pScr);
    } else if (kind === 'it-server') {
      const rack = rBox(T, 0.82, 1.28, 0.62, 0.04, m.darkSteel);
      rack.position.set(-0.35, 0.72, 0); g.add(rack);
      for (let u = 0; u < 5; u++) {
        const blade = new T.Mesh(new T.BoxGeometry(0.68, 0.05, 0.04), u % 2 === 0 ? m.cyanGlow : m.greenGlow);
        blade.position.set(-0.35, 0.32 + u * 0.20, 0.32); g.add(blade);
      }
      const db = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.72, 24), m.indigoMat);
      db.position.set(0.55, 0.44, 0); g.add(db);
      const pkt = new T.Mesh(new T.SphereGeometry(0.055, 12, 12), m.amberGlow); g.add(pkt);
      animFn = (t, spd) => { pkt.position.set(-0.35 + ((t * 0.7 * spd) % 1) * 0.9, 0.62, 0.36); };
    } else if (kind === 'it-webgl') {
      const mesh = new T.Mesh(new T.TorusKnotGeometry(0.32, 0.10, 64, 16), m.indigoMat);
      mesh.position.set(0, 0.64, 0); g.add(mesh);
      const cam = rBox(T, 0.26, 0.18, 0.32, 0.03, m.alu);
      cam.position.set(0.75, 0.55, 0.45); cam.lookAt(0, 0.64, 0); g.add(cam);
      animFn = (t, spd) => { mesh.rotation.y = t * 1.2 * spd; mesh.rotation.x = t * 0.5 * spd; };
    } else {
      // it-security: WAF Shield + Lock + Packet
      const shield = new T.Mesh(new T.CylinderGeometry(0.52, 0.36, 0.12, 6), m.cyanGlow);
      shield.rotation.x = Math.PI / 2; shield.position.set(0, 0.68, 0); g.add(shield);
      const lock = rBox(T, 0.36, 0.32, 0.16, 0.04, m.amberGlow);
      lock.position.set(0, 0.68, 0.14); g.add(lock);
      const arc = new T.Mesh(new T.TorusGeometry(0.11, 0.025, 10, 20, Math.PI), m.chrome);
      arc.position.set(0, 0.86, 0.14); g.add(arc);
      animFn = (t, spd) => { shield.rotation.z = Math.sin(t * spd) * 0.15; };
    }
    return { group: g, tick: animFn };
  }

  function build(T, key) {
    const m = mats(T);
    if (key === 'mech-turbo') return buildMechTurbo(T, m);
    if (key === 'mech-cylinder') return buildMechCylinder(T, m);
    if (key === 'mech-transmission') return buildMechTransmission(T, m);
    if (key === 'mech-suspension') return buildMechSuspension(T, m);
    if (key === 'mech-brakes') return buildMechBrakes(T, m);
    if (key && key.indexOf('autoel-') === 0) return buildAutoEl(T, m, key);
    if (key && key.indexOf('hvac-') === 0) return buildHvac(T, m, key);
    if (key && key.indexOf('design-') === 0) return buildDesign(T, m, key);
    if (key && key.indexOf('it-') === 0) return buildIt(T, m, key);
    return null;
  }

  return { build };
})();
