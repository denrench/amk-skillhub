/**
 * AMK SkillHub · Pro 3D Workshop Models (Three.js r128)
 * Детализированные анимированные PBR 3D-сборки для симулятора и уроков (Автомеханика и Автоэлектрика).
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
    ctx.font = 'bold 42px monospace';
    ctx.fillText(title, 28, 110);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(sub || '', 28, 175);
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
      redCaliper: new T.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.24, metalness: 0.35, clearcoat: 0.8 }),
      hvOrange: new T.MeshStandardMaterial({ color: 0xf97316, roughness: 0.32, metalness: 0.22 }),
      cyanGlow: new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.8 }),
      greenGlow: new T.MeshStandardMaterial({ color: 0x34d399, emissive: 0x34d399, emissiveIntensity: 1.6 }),
      glass: new T.MeshPhysicalMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.05 }),
    };
  }

  function buildMechTurbo(T, m) {
    const g = new T.Group();
    // Intercooler core + end tanks
    const ic = rBox(T, 1.8, 0.56, 0.26, 0.04, m.alu);
    ic.position.set(0, 0.35, 0.75);
    g.add(ic);
    for (let i = -5; i <= 5; i++) {
      const fin = new T.Mesh(new T.BoxGeometry(1.5, 0.02, 0.28), m.darkSteel);
      fin.position.set(0, 0.35 + i * 0.042, 0.75);
      g.add(fin);
    }
    // Cold Compressor Housing (Alu) + Hot Turbine Housing (Bronze)
    const cold = new T.Mesh(new T.TorusGeometry(0.42, 0.18, 20, 36), m.chrome);
    cold.position.set(-0.42, 1.05, 0);
    cold.rotation.y = Math.PI / 2;
    g.add(cold);
    const hot = new T.Mesh(new T.TorusGeometry(0.40, 0.17, 20, 36), m.exhaustBronze);
    hot.position.set(0.42, 1.05, 0);
    hot.rotation.y = Math.PI / 2;
    g.add(hot);
    // CHRA Center Cartridge + Oil Feed
    const chra = new T.Mesh(new T.CylinderGeometry(0.20, 0.20, 0.65, 24), m.darkSteel);
    chra.rotation.z = Math.PI / 2;
    chra.position.set(0, 1.05, 0);
    g.add(chra);
    // Spinning Impeller Wheel
    const wheel = new T.Group();
    wheel.position.set(-0.56, 1.05, 0);
    for (let b = 0; b < 8; b++) {
      const a = (b / 8) * Math.PI * 2;
      const blade = new T.Mesh(new T.BoxGeometry(0.03, 0.28, 0.06), m.cyanGlow);
      blade.position.set(0, Math.cos(a) * 0.12, Math.sin(a) * 0.12);
      blade.rotation.x = a;
      wheel.add(blade);
    }
    g.add(wheel);
    // Charge Pipe from Cold to Intercooler
    const pipeCurve = new T.CatmullRomCurve3([
      new T.Vector3(-0.42, 1.45, 0),
      new T.Vector3(-0.75, 1.25, 0.45),
      new T.Vector3(-0.85, 0.55, 0.75),
    ]);
    g.add(new T.Mesh(new T.TubeGeometry(pipeCurve, 28, 0.08, 14, false), m.alu));
    return { group: g, tick: (t, spd) => { wheel.rotation.x = t * 6.0 * spd; } };
  }

  function buildMechCylinder(T, m) {
    const g = new T.Group();
    // Cutaway Block
    const block = rBox(T, 1.5, 0.95, 0.9, 0.05, m.glass);
    block.position.set(0, 0.85, 0);
    g.add(block);
    // Crankshaft
    const crank = new T.Group();
    crank.position.set(0, 0.35, 0);
    const shaft = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 1.7, 20), m.chrome);
    shaft.rotation.z = Math.PI / 2;
    crank.add(shaft);
    g.add(crank);
    // 2 Moving Pistons + Conrods
    const pistons = [];
    [-0.36, 0.36].forEach((px, idx) => {
      const sleeve = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.85, 24, 1, true), m.darkSteel);
      sleeve.position.set(px, 0.95, 0);
      g.add(sleeve);
      const piston = new T.Group();
      piston.position.set(px, 0.95, 0);
      const crown = new T.Mesh(new T.CylinderGeometry(0.23, 0.23, 0.24, 24), m.alu);
      piston.add(crown);
      const ring = new T.Mesh(new T.TorusGeometry(0.235, 0.015, 8, 24), m.copper);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.06;
      piston.add(ring);
      g.add(piston);
      pistons.push({ mesh: piston, phase: idx * Math.PI });
    });
    // DOHC Camshafts on top
    [-0.22, 0.22].forEach((cz) => {
      const cam = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.55, 16), m.copper);
      cam.rotation.z = Math.PI / 2;
      cam.position.set(0, 1.55, cz);
      g.add(cam);
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
    housing.position.set(0, 0.15, 0);
    g.add(housing);
    const gears = [];
    [[-0.65, 0.85, 0.34, m.alu], [-0.15, 0.85, 0.26, m.copper], [0.35, 0.85, 0.32, m.chrome], [0.85, 0.85, 0.42, m.alu]].forEach(([gx, gy, rad, mat], i) => {
      const gr = new T.Group();
      gr.position.set(gx, gy, 0);
      const disc = new T.Mesh(new T.CylinderGeometry(rad, rad, 0.18, 24), mat);
      disc.rotation.z = Math.PI / 2;
      gr.add(disc);
      for (let t = 0; t < 12; t++) {
        const a = (t / 12) * Math.PI * 2;
        const tooth = new T.Mesh(new T.BoxGeometry(0.18, 0.06, 0.06), mat);
        tooth.position.set(0, Math.cos(a) * (rad + 0.02), Math.sin(a) * (rad + 0.02));
        tooth.rotation.x = a;
        gr.add(tooth);
      }
      g.add(gr);
      gears.push({ mesh: gr, dir: i % 2 === 0 ? 1 : -1 });
    });
    const shaft = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.2, 18), m.chrome);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.set(0.1, 0.85, 0);
    g.add(shaft);
    return { group: g, tick: (t, spd) => { gears.forEach((gr) => { gr.mesh.rotation.x = t * 2.5 * spd * gr.dir; }); } };
  }

  function buildMechSuspension(T, m) {
    const g = new T.Group();
    const controlArm = rBox(T, 1.4, 0.12, 0.55, 0.04, m.darkSteel);
    controlArm.position.set(-0.2, 0.25, 0);
    g.add(controlArm);
    // Strut + Coil Spring
    const strut = new T.Mesh(new T.CylinderGeometry(0.09, 0.11, 1.35, 20), m.chrome);
    strut.position.set(0.25, 0.95, 0);
    strut.rotation.z = 0.15;
    g.add(strut);
    for (let c = 0; c < 6; c++) {
      const coil = new T.Mesh(new T.TorusGeometry(0.18, 0.032, 10, 24), m.redCaliper);
      coil.position.set(0.22 + c * 0.015, 0.65 + c * 0.11, 0);
      coil.rotation.x = Math.PI / 2;
      g.add(coil);
    }
    const hub = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.22, 24), m.alu);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0.45, 0.42, 0);
    g.add(hub);
    return { group: g, tick: (t, spd) => { strut.position.y = 0.95 + Math.sin(t * 2.2 * spd) * 0.06; } };
  }

  function buildMechBrakes(T, m) {
    const g = new T.Group();
    const rotor = new T.Group();
    rotor.position.set(0, 0.85, 0);
    const disc = new T.Mesh(new T.CylinderGeometry(0.68, 0.68, 0.09, 36), m.chrome);
    disc.rotation.x = Math.PI / 2;
    rotor.add(disc);
    const hat = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.15, 24), m.darkSteel);
    hat.rotation.x = Math.PI / 2;
    rotor.add(hat);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const hole = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.11, 8), m.rubber);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0);
      rotor.add(hole);
    }
    g.add(rotor);
    // 6-Piston Red Caliper
    const caliper = rBox(T, 0.38, 0.56, 0.24, 0.06, m.redCaliper);
    caliper.position.set(0.55, 0.98, 0);
    caliper.rotation.z = -0.35;
    g.add(caliper);
    return { group: g, tick: (t, spd) => { rotor.rotation.z = -t * 2.8 * spd; } };
  }

  function buildAutoElGeneric(T, m, kind) {
    const g = new T.Group();
    const bench = rBox(T, 2.2, 0.10, 1.25, 0.04, m.darkSteel);
    bench.position.y = 0.10;
    g.add(bench);

    let animFn = () => {};

    if (kind === 'autoel-charging') {
      const alt = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.44, 24), m.alu);
      alt.rotation.x = Math.PI / 2;
      alt.position.set(-0.35, 0.58, 0);
      g.add(alt);
      const stator = new T.Mesh(new T.CylinderGeometry(0.31, 0.31, 0.14, 24), m.copper);
      stator.rotation.x = Math.PI / 2;
      stator.position.set(-0.35, 0.58, 0);
      g.add(stator);
      const pulley = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.14, 20), m.rubber);
      pulley.rotation.x = Math.PI / 2;
      pulley.position.set(-0.35, 0.58, 0.30);
      g.add(pulley);
      const bat = rBox(T, 0.65, 0.46, 0.42, 0.03, m.rubber);
      bat.position.set(0.55, 0.40, 0);
      g.add(bat);
      animFn = (t, spd) => { pulley.rotation.z = t * 5.0 * spd; };
    } else if (kind === 'autoel-can') {
      const scope = rBox(T, 0.95, 0.58, 0.30, 0.04, m.alu);
      scope.position.set(0.35, 0.52, -0.22);
      g.add(scope);
      const scr = new T.Mesh(new T.PlaneGeometry(0.74, 0.42), new T.MeshStandardMaterial({
        map: makeLabelTex(T, 'CAN-BUS 500k', '60 Ohm · H/L OK', '#06121c', '#34d399'),
        emissiveMap: makeLabelTex(T, 'CAN-BUS 500k', '60 Ohm · H/L OK', '#06121c', '#34d399'),
        emissive: new T.Color(0xffffff), emissiveIntensity: 0.9,
      }));
      scr.position.set(0.35, 0.52, -0.055);
      g.add(scr);
      const ecu = rBox(T, 0.58, 0.12, 0.42, 0.03, m.alu);
      ecu.position.set(-0.52, 0.25, 0.20);
      g.add(ecu);
      const pulse = new T.Mesh(new T.SphereGeometry(0.05, 12, 12), m.cyanGlow);
      g.add(pulse);
      animFn = (t, spd) => { pulse.position.set(-0.52 + ((t * spd) % 1) * 0.9, 0.28, 0.20); };
    } else if (kind === 'autoel-ignition') {
      for (let i = 0; i < 4; i++) {
        const px = -0.6 + i * 0.4;
        const coil = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.52, 16), m.redCaliper);
        coil.position.set(px, 0.55, 0);
        g.add(coil);
        const spark = new T.Mesh(new T.SphereGeometry(0.045, 10, 10), m.cyanGlow);
        spark.position.set(px, 0.24, 0);
        spark.userData.idx = i;
        g.add(spark);
      }
      animFn = (t, spd) => {
        const active = Math.floor(t * 4 * spd) % 4;
        g.children.forEach((c) => { if (c.userData.idx !== undefined) c.visible = c.userData.idx === active; });
      };
    } else if (kind === 'autoel-sensors') {
      const wheel = new T.Group();
      wheel.position.set(-0.2, 0.68, 0);
      const disc = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.08, 32), m.chrome);
      disc.rotation.x = Math.PI / 2;
      wheel.add(disc);
      for (let i = 0; i < 18; i++) {
        if (i === 0) continue; // 60-2 gap
        const a = (i / 18) * Math.PI * 2;
        const tth = new T.Mesh(new T.BoxGeometry(0.04, 0.08, 0.08), m.alu);
        tth.position.set(Math.cos(a) * 0.44, Math.sin(a) * 0.44, 0);
        tth.rotation.z = a;
        wheel.add(tth);
      }
      g.add(wheel);
      const sensor = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.28, 16), m.copper);
      sensor.rotation.z = Math.PI / 2;
      sensor.position.set(0.45, 0.68, 0);
      g.add(sensor);
      animFn = (t, spd) => { wheel.rotation.z = t * 3.5 * spd; };
    } else {
      // autoel-hv: 400V HV Battery Pack + Inverter
      const pack = rBox(T, 1.35, 0.34, 0.85, 0.04, m.darkSteel);
      pack.position.set(0, 0.34, 0);
      g.add(pack);
      for (let c = -2; c <= 2; c++) {
        const cell = rBox(T, 0.20, 0.22, 0.68, 0.02, m.hvOrange);
        cell.position.set(c * 0.24, 0.54, 0);
        g.add(cell);
      }
      const inv = rBox(T, 0.55, 0.24, 0.42, 0.03, m.alu);
      inv.position.set(0, 0.78, 0);
      g.add(inv);
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
    if (key && key.indexOf('autoel-') === 0) return buildAutoElGeneric(T, m, key);
    return null;
  }

  return { build };
})();
