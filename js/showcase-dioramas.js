/**
 * AMK SkillHub 3D Studio — 5 High-Detail Interactive Architectural Dioramas (Three.js r128)
 *  1. sport_wheel_garage : Full GT Sports Car on 2-Post Hydraulic Lift in Auto Workshop
 *  2. gaming_room_rig    : Full Cyber Esports Room with Dual Monitors, Laptop, RGB PC, Full Audio/Mic Gear & Gaming Chair
 *  3. autoelectric_lab   : Full Auto-Diagnostics Bay with Engine Harness, ECU, Alternator, Battery, Oscilloscope & Fluke
 *  4. hvac_rooftop       : Full Split-System Cutaway — Indoor AC Unit + Insulated Wall + Copper Pipes + Outdoor Inverter + Manifold & Vacuum Pump
 *  5. design_studio      : Full Creative Art & Print Studio — Gallery Posters, Pen Display, Packaging Mockups, Wide-Format Plotter & Softbox Light
 */
window.AMKDioramas = (function () {
  'use strict';

  function makeCanvasTex(T, w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    return tex;
  }

  function addPodium(T, group, radius, accentHex, floorColorHex, floorTex) {
    const mat = floorTex
      ? new T.MeshStandardMaterial({ map: floorTex, roughness: 0.36, metalness: 0.28 })
      : new T.MeshStandardMaterial({ color: floorColorHex, roughness: 0.32, metalness: 0.55 });
    const base = new T.Mesh(new T.CylinderGeometry(radius, radius + 0.12, 0.11, 56), mat);
    base.position.y = -0.055;
    group.add(base);

    const trim = new T.Mesh(
      new T.TorusGeometry(radius + 0.02, 0.018, 12, 72),
      new T.MeshStandardMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 2.1 })
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 0.004;
    group.add(trim);
  }

  // =========================================================================
  // 1. AUTOMECHANIC: FULL GT SPORTS CAR ON 2-POST HYDRAULIC LIFT IN WORKSHOP
  // =========================================================================
  function buildAutoWorkshop(T, group, animators) {
    const floorTex = makeCanvasTex(T, 512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#1b202b';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 48) {
        for (let x = 0; x < w; x += 48) {
          ctx.fillStyle = ((x / 48 + y / 48) % 2 === 0) ? '#232a38' : '#181d27';
          ctx.fillRect(x, y, 46, 46);
        }
      }
      // Yellow/black safety bay markings
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.strokeRect(72, 96, 368, 320);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fillRect(78, 102, 356, 308);
    });
    addPodium(T, group, 2.35, 0xf97316, 0x1a1f2b, floorTex);

    const steelDark = new T.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.82 });
    const chrome = new T.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.12, metalness: 0.96 });
    const liftBlue = new T.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.38, metalness: 0.45 });
    const redPaint = new T.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.32, metalness: 0.35 });
    const carBodyMat = new T.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.22, metalness: 0.32 });
    const carbonMat = new T.MeshStandardMaterial({ color: 0x14171f, roughness: 0.42, metalness: 0.45 });
    const glassMat = new T.MeshStandardMaterial({ color: 0x0b1528, roughness: 0.08, metalness: 0.92, transparent: true, opacity: 0.86 });
    const tireMat = new T.MeshStandardMaterial({ color: 0x12141a, roughness: 0.84, metalness: 0.08 });

    // --- TWO-POST HYDRAULIC LIFT ---
    const liftY = 0.52;
    [-1.12, 1.12].forEach((lx) => {
      // Base plate bolted to floor
      const plate = new T.Mesh(new T.BoxGeometry(0.30, 0.03, 0.38), steelDark);
      plate.position.set(lx, 0.015, 0);
      group.add(plate);
      // Main vertical column
      const col = new T.Mesh(new T.BoxGeometry(0.16, 2.02, 0.18), liftBlue);
      col.position.set(lx, 1.01, 0);
      group.add(col);
      // Lifting carriage slider
      const carriage = new T.Mesh(new T.BoxGeometry(0.20, 0.32, 0.22), steelDark);
      carriage.position.set(lx * 0.96, liftY, 0);
      group.add(carriage);
      // Two telescopic swing arms per column reaching under car sills
      [-0.58, 0.58].forEach((az) => {
        const dir = lx > 0 ? -1 : 1;
        const arm = new T.Mesh(new T.BoxGeometry(0.56, 0.055, 0.075), liftBlue);
        arm.position.set(lx + dir * 0.32, liftY - 0.02, az * 0.48);
        arm.rotation.y = dir * (az > 0 ? -0.46 : 0.46);
        group.add(arm);
        const pad = new T.Mesh(new T.CylinderGeometry(0.065, 0.07, 0.04, 16), steelDark);
        pad.position.set(lx + dir * 0.55, liftY + 0.02, az);
        group.add(pad);
      });
    });
    // Overhead safety crossbar + LED work lamp
    const topBar = new T.Mesh(new T.BoxGeometry(2.40, 0.10, 0.14), liftBlue);
    topBar.position.set(0, 2.02, 0);
    group.add(topBar);
    const overheadLed = new T.Mesh(
      new T.BoxGeometry(1.75, 0.035, 0.05),
      new T.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfde68a, emissiveIntensity: 2.2 })
    );
    overheadLed.position.set(0, 1.95, 0);
    group.add(overheadLed);
    // Hydraulic motor unit mounted on right column
    const pump = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.28, 16), steelDark);
    pump.position.set(1.28, 1.25, 0.04);
    group.add(pump);

    // --- FULL GT SPORTS CAR ELEVATED ON LIFT ---
    const car = new T.Group();
    car.position.set(0, liftY + 0.05, 0); // Chassis rests directly on lift pads!
    group.add(car);

    // Underbody pan + exhaust system (visible underneath!)
    const underTray = new T.Mesh(new T.BoxGeometry(1.14, 0.06, 2.38), carbonMat);
    underTray.position.set(0, 0.05, 0);
    car.add(underTray);
    // Exhaust pipe & muffler under car
    const exhaustPipe = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 1.75, 12), chrome);
    exhaustPipe.rotation.x = Math.PI / 2;
    exhaustPipe.position.set(0.12, 0.01, -0.15);
    car.add(exhaustPipe);
    const muffler = new T.Mesh(new T.BoxGeometry(0.32, 0.09, 0.22), chrome);
    muffler.position.set(0, 0.02, -0.95);
    car.add(muffler);
    // Twin exhaust tips at rear
    [-0.24, -0.15, 0.15, 0.24].forEach((tx) => {
      const tip = new T.Mesh(new T.CylinderGeometry(0.026, 0.026, 0.14, 14), chrome);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(tx, 0.08, -1.24);
      car.add(tip);
    });

    // Sculpted Lower Body Shell (Front Bumper -> Fenders -> Rear Bumper)
    const lowerBody = new T.Mesh(new T.BoxGeometry(1.22, 0.30, 2.46), carBodyMat);
    lowerBody.position.set(0, 0.22, 0);
    car.add(lowerBody);
    // Tapered Front Hood Nose
    const frontHood = new T.Mesh(new T.BoxGeometry(1.18, 0.12, 0.88), carBodyMat);
    frontHood.position.set(0, 0.37, 0.72);
    frontHood.rotation.x = 0.12;
    car.add(frontHood);
    // Carbon Hood Vent
    const hoodVent = new T.Mesh(new T.BoxGeometry(0.46, 0.03, 0.24), carbonMat);
    hoodVent.position.set(0, 0.43, 0.68);
    hoodVent.rotation.x = 0.12;
    car.add(hoodVent);
    // Front Carbon Splitter & Grille
    const splitter = new T.Mesh(new T.BoxGeometry(1.28, 0.04, 0.24), carbonMat);
    splitter.position.set(0, 0.08, 1.18);
    car.add(splitter);
    const grille = new T.Mesh(new T.BoxGeometry(0.76, 0.12, 0.05), carbonMat);
    grille.position.set(0, 0.17, 1.22);
    car.add(grille);
    // Side Skirts
    [-0.63, 0.63].forEach((sx) => {
      const skirt = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 1.48), carbonMat);
      skirt.position.set(sx, 0.09, 0);
      car.add(skirt);
    });
    // Rear Diffuser
    const diffuser = new T.Mesh(new T.BoxGeometry(1.16, 0.12, 0.12), carbonMat);
    diffuser.position.set(0, 0.11, -1.20);
    car.add(diffuser);

    // Greenhouse / Cabin Roof + Sloped Windshield & Rear Glass
    const cabin = new T.Mesh(new T.BoxGeometry(1.02, 0.28, 1.06), glassMat);
    cabin.position.set(0, 0.50, -0.08);
    car.add(cabin);
    const roofCap = new T.Mesh(new T.BoxGeometry(0.96, 0.045, 0.88), carbonMat);
    roofCap.position.set(0, 0.65, -0.10);
    car.add(roofCap);
    // Sloped Front Windshield
    const windshield = new T.Mesh(new T.BoxGeometry(1.00, 0.04, 0.52), glassMat);
    windshield.position.set(0, 0.51, 0.46);
    windshield.rotation.x = 0.54;
    car.add(windshield);
    // Sloped Fastback Rear Window
    const rearGlass = new T.Mesh(new T.BoxGeometry(0.98, 0.04, 0.58), glassMat);
    rearGlass.position.set(0, 0.51, -0.64);
    rearGlass.rotation.x = -0.46;
    car.add(rearGlass);
    // Side Mirrors
    [-0.66, 0.66].forEach((mx) => {
      const mir = new T.Mesh(new T.BoxGeometry(0.11, 0.06, 0.09), carBodyMat);
      mir.position.set(mx, 0.42, 0.34);
      car.add(mir);
    });
    // GT Carbon Rear Wing Spoiler
    const wing = new T.Mesh(new T.BoxGeometry(1.24, 0.035, 0.18), carbonMat);
    wing.position.set(0, 0.54, -1.12);
    wing.rotation.x = 0.08;
    car.add(wing);
    [-0.36, 0.36].forEach((px) => {
      const strut = new T.Mesh(new T.BoxGeometry(0.03, 0.19, 0.09), carbonMat);
      strut.position.set(px, 0.44, -1.10);
      car.add(strut);
    });
    // Side Wing Endplates
    [-0.62, 0.62].forEach((ex) => {
      const ep = new T.Mesh(new T.BoxGeometry(0.02, 0.12, 0.22), carBodyMat);
      ep.position.set(ex, 0.54, -1.12);
      car.add(ep);
    });

    // Bright LED Headlights (Front) & Full-Width LED Taillight Bar (Rear)
    const headLedMat = new T.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x38bdf8, emissiveIntensity: 2.8 });
    [-0.42, 0.42].forEach((hx) => {
      const hl = new T.Mesh(new T.BoxGeometry(0.24, 0.065, 0.05), headLedMat);
      hl.position.set(hx, 0.27, 1.22);
      car.add(hl);
    });
    const tailLedMat = new T.MeshStandardMaterial({ color: 0xffcdd2, emissive: 0xef4444, emissiveIntensity: 2.8 });
    const tailBar = new T.Mesh(new T.BoxGeometry(1.12, 0.055, 0.045), tailLedMat);
    tailBar.position.set(0, 0.31, -1.23);
    car.add(tailBar);

    // 4 Detailed Forged Wheels + Ventilated Brake Rotors + Red Brembo Calipers
    const spinningWheels = [];
    const wheelCoords = [
      [-0.64, 0.12, 0.76, -1],
      [0.64, 0.12, 0.76, 1],
      [-0.64, 0.12, -0.76, -1],
      [0.64, 0.12, -0.76, 1],
    ];
    wheelCoords.forEach(([wx, wy, wz, side]) => {
      const wHolder = new T.Group();
      wHolder.position.set(wx, wy, wz);
      car.add(wHolder);

      // Fixed Brembo Caliper
      const cal = new T.Mesh(new T.BoxGeometry(0.06, 0.13, 0.07), new T.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25, metalness: 0.45 }));
      cal.position.set(-side * 0.03, 0.03, -0.10);
      wHolder.add(cal);

      const spin = new T.Group();
      wHolder.add(spin);
      const tMesh = new T.Mesh(new T.TorusGeometry(0.18, 0.07, 18, 36), tireMat);
      tMesh.rotation.y = Math.PI / 2;
      spin.add(tMesh);
      const rim = new T.Mesh(new T.CylinderGeometry(0.145, 0.145, 0.12, 24), chrome);
      rim.rotation.z = Math.PI / 2;
      spin.add(rim);
      const hub = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.145, 16), steelDark);
      hub.rotation.z = Math.PI / 2;
      spin.add(hub);
      for (let sp = 0; sp < 5; sp++) {
        const a = (sp / 5) * Math.PI * 2;
        const spoke = new T.Mesh(new T.BoxGeometry(0.025, 0.25, 0.024), steelDark);
        spoke.position.set(side * 0.062, 0, 0);
        spoke.rotation.x = a;
        spin.add(spoke);
      }
      spinningWheels.push(spin);
    });

    // --- WORKSHOP PROPS AROUND THE LIFT ---
    // Red 5-Drawer Rolling Tool Chest (Left Rear)
    const chest = new T.Group();
    chest.position.set(-1.62, 0, -0.62);
    chest.rotation.y = 0.48;
    group.add(chest);
    const chestBody = new T.Mesh(new T.BoxGeometry(0.64, 0.72, 0.38), redPaint);
    chestBody.position.y = 0.40;
    chest.add(chestBody);
    const chestTop = new T.Mesh(new T.BoxGeometry(0.66, 0.03, 0.40), steelDark);
    chestTop.position.y = 0.775;
    chest.add(chestTop);
    for (let d = 0; d < 5; d++) {
      const h = new T.Mesh(new T.BoxGeometry(0.48, 0.022, 0.024), chrome);
      h.position.set(0, 0.14 + d * 0.12, 0.20);
      chest.add(h);
    }
    [[-0.24, -0.13], [0.24, -0.13], [-0.24, 0.13], [0.24, 0.13]].forEach(([cx, cz]) => {
      const caster = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.025, 12), tireMat);
      caster.rotation.z = Math.PI / 2;
      caster.position.set(cx, 0.035, cz);
      chest.add(caster);
    });

    // Diagnostic Rolling Cart with Live Telemetry Monitor (Right Front)
    const diagCart = new T.Group();
    diagCart.position.set(1.58, 0, 0.62);
    diagCart.rotation.y = -0.62;
    group.add(diagCart);
    const cartBase = new T.Mesh(new T.BoxGeometry(0.44, 0.06, 0.36), steelDark);
    cartBase.position.y = 0.06;
    diagCart.add(cartBase);
    const cartPole = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.96, 12), steelDark);
    cartPole.position.set(0, 0.54, -0.06);
    diagCart.add(cartPole);
    const cartShelf = new T.Mesh(new T.BoxGeometry(0.42, 0.04, 0.30), liftBlue);
    cartShelf.position.set(0, 0.72, 0.02);
    diagCart.add(cartShelf);
    const diagTex = makeCanvasTex(T, 256, 160, (ctx, w, h) => {
      ctx.fillStyle = '#091122'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 18px monospace'; ctx.fillText('AMK 3D ALIGN', 14, 28);
      ctx.fillStyle = '#34d399'; ctx.fillRect(16, 46, 100, 14); ctx.fillRect(16, 72, 160, 14);
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(16, 98, 128, 14);
      ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 16px monospace'; ctx.fillText('TOE +0.1°  OK', 16, 140);
    });
    const diagMon = new T.Mesh(new T.BoxGeometry(0.46, 0.30, 0.035), steelDark);
    diagMon.position.set(0, 1.06, -0.05);
    diagCart.add(diagMon);
    const diagScr = new T.Mesh(new T.PlaneGeometry(0.42, 0.25), new T.MeshStandardMaterial({ map: diagTex, emissiveMap: diagTex, emissive: 0xffffff, emissiveIntensity: 0.95 }));
    diagScr.position.set(0, 1.06, -0.03);
    diagCart.add(diagScr);

    // Spare Tire Rack (Left Front)
    const spare = new T.Mesh(new T.TorusGeometry(0.20, 0.075, 16, 32), tireMat);
    spare.position.set(-1.55, 0.27, 0.72);
    spare.rotation.y = 0.6;
    group.add(spare);
    const spareRim = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.10, 20), chrome);
    spareRim.rotation.z = Math.PI / 2;
    spareRim.rotation.y = 0.6;
    spareRim.position.set(-1.55, 0.27, 0.72);
    group.add(spareRim);

    const wLight = new T.PointLight(0xf97316, 2.4, 6);
    wLight.position.set(0, 1.8, 1.4);
    group.add(wLight);

    animators.push((t) => {
      spinningWheels.forEach((w) => { w.rotation.x = t * 1.4; });
    });
  }

  // =========================================================================
  // 2. IT / WEB DESIGN: FULL CYBER ESPORTS ROOM + DUAL MONITORS + FULL GEAR + GAMING CHAIR
  // =========================================================================
  function buildGamingRoom(T, group, animators) {
    const floorTex = makeCanvasTex(T, 512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#0e1324';
      ctx.fillRect(0, 0, w, h);
      // Dark wood plank lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // Cyber rug under chair
      ctx.fillStyle = '#171c36';
      ctx.fillRect(110, 140, 290, 260);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(116, 146, 278, 248);
    });
    addPodium(T, group, 2.25, 0x22d3ee, 0x0d1222, floorTex);

    const wallMat = new T.MeshStandardMaterial({ color: 0x0b1020, roughness: 0.9, metalness: 0.05 });
    const darkMetal = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.28, metalness: 0.82 });
    const carbonDesk = new T.MeshStandardMaterial({ color: 0x161b2a, roughness: 0.34, metalness: 0.45 });
    const chrome = new T.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.92 });
    const rgbMats = [];

    // --- OPEN 2-WALL ISOMETRIC CYBER ROOM CUTAWAY (BACK + LEFT WALLS) ---
    const backWall = new T.Mesh(new T.BoxGeometry(2.85, 1.85, 0.08), wallMat);
    backWall.position.set(0.02, 0.925, -1.18);
    group.add(backWall);
    const leftWall = new T.Mesh(new T.BoxGeometry(0.08, 1.85, 2.35), wallMat);
    leftWall.position.set(-1.38, 0.925, -0.04);
    group.add(leftWall);

    // Baseboard RGB LED strips along walls
    const baseLed1 = new T.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 2.3 });
    rgbMats.push(baseLed1);
    const stripBack = new T.Mesh(new T.BoxGeometry(2.76, 0.028, 0.025), baseLed1);
    stripBack.position.set(0.02, 0.06, -1.13);
    group.add(stripBack);
    const stripLeft = new T.Mesh(new T.BoxGeometry(0.025, 0.028, 2.26), baseLed1);
    stripLeft.position.set(-1.33, 0.06, -0.04);
    group.add(stripLeft);

    // Glowing Nanoleaf RGB Hexagon Tiles on Back Wall
    [
      [-0.76, 1.48, 0x38bdf8], [-0.46, 1.56, 0x818cf8], [-0.16, 1.48, 0xc084fc],
      [0.14, 1.56, 0xec4899], [0.44, 1.48, 0x22d3ee], [0.74, 1.56, 0x34d399],
    ].forEach(([hx, hy, col]) => {
      const m = new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2.0 });
      rgbMats.push(m);
      const hex = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.025, 6), m);
      hex.rotation.x = Math.PI / 2;
      hex.position.set(hx, hy, -1.13);
      group.add(hex);
    });

    // Floating Wall Shelf on Left Wall with Neon Logo & Books
    const shelf = new T.Mesh(new T.BoxGeometry(0.24, 0.04, 1.15), carbonDesk);
    shelf.position.set(-1.24, 1.24, -0.18);
    group.add(shelf);
    [0x38bdf8, 0xa855f7, 0xec4899, 0x34d399].forEach((bcol, bi) => {
      const book = new T.Mesh(new T.BoxGeometry(0.14, 0.20 + (bi % 2) * 0.04, 0.055), new T.MeshStandardMaterial({ color: bcol, roughness: 0.45 }));
      book.position.set(-1.24, 1.36, -0.52 + bi * 0.08);
      group.add(book);
    });
    // Acoustic Foam Panels on Left Wall
    for (let a = 0; a < 4; a++) {
      const pad = new T.Mesh(new T.BoxGeometry(0.035, 0.24, 0.24), new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }));
      pad.position.set(-1.33, 0.85, -0.52 + a * 0.30);
      group.add(pad);
    }

    // --- CARBON GAMING DESK ---
    const deskTop = new T.Mesh(new T.BoxGeometry(2.38, 0.065, 1.02), carbonDesk);
    deskTop.position.set(0.05, 0.72, -0.56);
    group.add(deskTop);
    const deskLedMat = new T.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 2.4 });
    rgbMats.push(deskLedMat);
    const deskEdge = new T.Mesh(new T.BoxGeometry(2.40, 0.02, 0.02), deskLedMat);
    deskEdge.position.set(0.05, 0.71, -0.045);
    group.add(deskEdge);
    // Z-shaped Gaming Desk Legs
    [-1.02, 1.12].forEach((lx) => {
      const leg = new T.Mesh(new T.BoxGeometry(0.065, 0.72, 0.075), darkMetal);
      leg.position.set(lx, 0.36, -0.56);
      group.add(leg);
      const foot = new T.Mesh(new T.BoxGeometry(0.08, 0.04, 0.84), darkMetal);
      foot.position.set(lx, 0.02, -0.56);
      group.add(foot);
    });
    // XXL RGB Deskmat
    const deskMat = new T.Mesh(new T.BoxGeometry(1.38, 0.008, 0.48), new T.MeshStandardMaterial({ color: 0x090e1c, roughness: 0.9 }));
    deskMat.position.set(-0.10, 0.758, -0.34);
    group.add(deskMat);

    // --- DUAL MONITORS (ULTRAWIDE + VERTICAL SIDE CODE MONITOR) ---
    const ideTex = makeCanvasTex(T, 512, 256, (ctx, w, h) => {
      ctx.fillStyle = '#090e1d'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#111b33'; ctx.fillRect(14, 14, 118, 228);
      ctx.fillStyle = '#0d1528'; ctx.fillRect(144, 14, 354, 228);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 18px monospace'; ctx.fillText('AMK IDE 3.0', 22, 42);
      const cols = ['#38bdf8', '#c084fc', '#34d399', '#fbbf24', '#f472b6'];
      for (let r = 0; r < 10; r++) {
        ctx.fillStyle = cols[r % cols.length];
        ctx.fillRect(160 + (r % 3) * 16, 32 + r * 20, 70 + ((r * 47) % 180), 9);
      }
    });
    const vertTex = makeCanvasTex(T, 256, 420, (ctx, w, h) => {
      ctx.fillStyle = '#070c18'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#34d399'; ctx.font = 'bold 18px monospace'; ctx.fillText('> npm run dev', 14, 34);
      for (let r = 0; r < 15; r++) {
        ctx.fillStyle = r % 3 === 0 ? '#38bdf8' : '#94a3b8';
        ctx.fillRect(16, 56 + r * 22, 90 + ((r * 31) % 120), 8);
      }
    });

    // Main Ultrawide Monitor
    const mStand = new T.Mesh(new T.BoxGeometry(0.08, 0.28, 0.06), darkMetal);
    mStand.position.set(-0.08, 0.89, -0.94);
    group.add(mStand);
    const mFrame = new T.Mesh(new T.BoxGeometry(1.12, 0.46, 0.032), darkMetal);
    mFrame.position.set(-0.08, 1.15, -0.90);
    group.add(mFrame);
    const mScr = new T.Mesh(new T.PlaneGeometry(1.07, 0.41), new T.MeshStandardMaterial({ map: ideTex, emissiveMap: ideTex, emissive: 0xffffff, emissiveIntensity: 0.95 }));
    mScr.position.set(-0.08, 1.15, -0.882);
    group.add(mScr);

    // Vertical Side Monitor (Left angled toward user)
    const vMon = new T.Group();
    vMon.position.set(-0.82, 1.13, -0.78);
    vMon.rotation.y = 0.36;
    group.add(vMon);
    const vFrame = new T.Mesh(new T.BoxGeometry(0.36, 0.56, 0.028), darkMetal);
    vMon.add(vFrame);
    const vScr = new T.Mesh(new T.PlaneGeometry(0.32, 0.52), new T.MeshStandardMaterial({ map: vertTex, emissiveMap: vertTex, emissive: 0xffffff, emissiveIntensity: 0.9 }));
    vScr.position.z = 0.016;
    vMon.add(vScr);
    const vStand = new T.Mesh(new T.BoxGeometry(0.06, 0.30, 0.05), darkMetal);
    vStand.position.set(0, -0.25, -0.02);
    vMon.add(vStand);

    // --- FULL PERIPHERAL SUITE: RGB KEYBOARD, MOUSE, STUDIO MIC ON BOOM ARM, HEADSET ON STAND, SPEAKERS ---
    // Mechanical RGB Keyboard
    const kbBody = new T.Mesh(new T.BoxGeometry(0.46, 0.026, 0.16), darkMetal);
    kbBody.position.set(-0.16, 0.775, -0.32);
    group.add(kbBody);
    const kbGlowMat = new T.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x818cf8, emissiveIntensity: 1.6 });
    rgbMats.push(kbGlowMat);
    const kbKeys = new T.Mesh(new T.BoxGeometry(0.42, 0.012, 0.13), kbGlowMat);
    kbKeys.position.set(-0.16, 0.79, -0.32);
    group.add(kbKeys);

    // RGB Wireless Gaming Mouse
    const mouse = new T.Mesh(new T.BoxGeometry(0.085, 0.036, 0.135), darkMetal);
    mouse.position.set(0.24, 0.78, -0.30);
    group.add(mouse);
    const mouseLed = new T.Mesh(new T.BoxGeometry(0.02, 0.01, 0.05), deskLedMat);
    mouseLed.position.set(0.24, 0.80, -0.30);
    group.add(mouseLed);

    // Studio Condenser Microphone on Boom Arm (Left edge of desk)
    const boomBase = new T.Mesh(new T.CylinderGeometry(0.03, 0.035, 0.08, 12), darkMetal);
    boomBase.position.set(-1.02, 0.79, -0.28);
    group.add(boomBase);
    const arm1 = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.42, 10), darkMetal);
    arm1.position.set(-0.90, 0.96, -0.26);
    arm1.rotation.z = -0.62;
    group.add(arm1);
    const arm2 = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.34, 10), darkMetal);
    arm2.position.set(-0.62, 1.06, -0.24);
    arm2.rotation.z = 1.25;
    group.add(arm2);
    const micCap = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.11, 16), darkMetal);
    micCap.position.set(-0.46, 0.96, -0.22);
    group.add(micCap);
    const micRing = new T.Mesh(new T.TorusGeometry(0.036, 0.006, 8, 20), new T.MeshStandardMaterial({ color: 0x34d399, emissive: 0x34d399, emissiveIntensity: 2.2 }));
    micRing.rotation.x = Math.PI / 2;
    micRing.position.set(-0.46, 0.99, -0.22);
    group.add(micRing);

    // RGB Gaming Headset on Stand (Right of Monitor)
    const hsStand = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, 0.02, 16), darkMetal);
    hsStand.position.set(0.52, 0.765, -0.68);
    group.add(hsStand);
    const hsPole = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.28, 10), chrome);
    hsPole.position.set(0.52, 0.90, -0.68);
    group.add(hsPole);
    const hsArch = new T.Mesh(new T.TorusGeometry(0.085, 0.016, 10, 24, Math.PI), darkMetal);
    hsArch.position.set(0.52, 0.98, -0.68);
    group.add(hsArch);
    [-0.085, 0.085].forEach((ex) => {
      const cup = new T.Mesh(new T.CylinderGeometry(0.048, 0.048, 0.038, 16), darkMetal);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(0.52 + ex, 0.92, -0.68);
      group.add(cup);
      const cupGlow = new T.Mesh(new T.TorusGeometry(0.036, 0.006, 8, 20), deskLedMat);
      cupGlow.rotation.y = Math.PI / 2;
      cupGlow.position.set(0.52 + ex + (ex > 0 ? 0.02 : -0.02), 0.92, -0.68);
      group.add(cupGlow);
    });

    // Studio Monitor Speakers (Left & Right)
    [[-1.08, -0.78, 0.35], [0.54, -0.88, -0.22]].forEach(([sx, sz, rot]) => {
      const spk = new T.Group();
      spk.position.set(sx, 0.88, sz);
      spk.rotation.y = rot;
      group.add(spk);
      spk.add(new T.Mesh(new T.BoxGeometry(0.15, 0.24, 0.16), darkMetal));
      const woofer = new T.Mesh(new T.CylinderGeometry(0.046, 0.046, 0.015, 18), new T.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }));
      woofer.rotation.x = Math.PI / 2;
      woofer.position.set(0, -0.03, 0.082);
      spk.add(woofer);
    });

    // --- TEMPERED GLASS RGB GAMING PC TOWER (RIGHT OF DESK) ---
    const pc = new T.Group();
    pc.position.set(0.92, 1.04, -0.58);
    pc.rotation.y = -0.18;
    group.add(pc);
    pc.add(new T.Mesh(new T.BoxGeometry(0.36, 0.60, 0.58), darkMetal));
    const glass = new T.Mesh(
      new T.PlaneGeometry(0.50, 0.52),
      new T.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, roughness: 0.06, metalness: 0.9 })
    );
    glass.rotation.y = -Math.PI / 2;
    glass.position.x = -0.182;
    pc.add(glass);
    // Glowing GPU inside case
    const gpuLed = new T.Mesh(new T.BoxGeometry(0.04, 0.05, 0.34), kbGlowMat);
    gpuLed.position.set(-0.06, -0.05, -0.02);
    pc.add(gpuLed);

    const fans = [];
    for (let f = 0; f < 3; f++) {
      const fMat = new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.3 });
      rgbMats.push(fMat);
      const ring = new T.Mesh(new T.TorusGeometry(0.072, 0.012, 12, 28), fMat);
      ring.position.set(0, -0.17 + f * 0.17, 0.295);
      pc.add(ring);
      const hub = new T.Mesh(new T.BoxGeometry(0.11, 0.022, 0.012), chrome);
      hub.position.set(0, -0.17 + f * 0.17, 0.294);
      pc.add(hub);
      fans.push(hub);
    }

    // --- ERGONOMIC RACING GAMING CHAIR (FRONT CENTER) ---
    const chair = new T.Group();
    chair.position.set(-0.10, 0, 0.42);
    chair.rotation.y = 0.28;
    group.add(chair);
    const chairBlack = new T.MeshStandardMaterial({ color: 0x111522, roughness: 0.65, metalness: 0.15 });
    const chairAccent = new T.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.52, metalness: 0.2 });

    // 5-Star Base + Casters + Gas Lift
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spoke = new T.Mesh(new T.BoxGeometry(0.04, 0.035, 0.28), darkMetal);
      spoke.position.set(Math.sin(a) * 0.14, 0.065, Math.cos(a) * 0.14);
      spoke.rotation.y = a;
      chair.add(spoke);
      const wheel = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.024, 12), darkMetal);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(Math.sin(a) * 0.26, 0.028, Math.cos(a) * 0.26);
      chair.add(wheel);
    }
    const piston = new T.Mesh(new T.CylinderGeometry(0.032, 0.038, 0.38, 16), chrome);
    piston.position.y = 0.25;
    chair.add(piston);

    // Upper Swivel Assembly
    const chairTop = new T.Group();
    chairTop.position.y = 0.46;
    chair.add(chairTop);
    const seat = new T.Mesh(new T.BoxGeometry(0.50, 0.09, 0.48), chairBlack);
    chairTop.add(seat);
    [-0.25, 0.25].forEach((bx) => {
      const bolster = new T.Mesh(new T.BoxGeometry(0.06, 0.12, 0.46), chairAccent);
      bolster.position.set(bx, 0.03, 0);
      chairTop.add(bolster);
      // Armrests
      const armPost = new T.Mesh(new T.BoxGeometry(0.035, 0.22, 0.045), darkMetal);
      armPost.position.set(bx * 1.15, 0.11, 0.02);
      chairTop.add(armPost);
      const armPad = new T.Mesh(new T.BoxGeometry(0.075, 0.032, 0.26), darkMetal);
      armPad.position.set(bx * 1.15, 0.23, 0.02);
      chairTop.add(armPad);
    });
    // High Racing Backrest + Head Pillow
    const backrest = new T.Mesh(new T.BoxGeometry(0.46, 0.78, 0.09), chairBlack);
    backrest.position.set(0, 0.40, 0.23);
    backrest.rotation.x = 0.14;
    chairTop.add(backrest);
    [-0.23, 0.23].forEach((bx) => {
      const wing = new T.Mesh(new T.BoxGeometry(0.065, 0.74, 0.11), chairAccent);
      wing.position.set(bx, 0.40, 0.21);
      wing.rotation.x = 0.14;
      chairTop.add(wing);
    });
    const pillow = new T.Mesh(new T.BoxGeometry(0.24, 0.11, 0.065), chairAccent);
    pillow.position.set(0, 0.68, 0.20);
    chairTop.add(pillow);

    const nl1 = new T.PointLight(0x22d3ee, 2.8, 6);
    nl1.position.set(-0.9, 1.5, 0.4);
    group.add(nl1);
    const nl2 = new T.PointLight(0xc084fc, 2.6, 6);
    nl2.position.set(1.1, 1.4, 0.5);
    group.add(nl2);

    animators.push((t) => {
      const hue = (t * 0.07) % 1;
      rgbMats.forEach((m, idx) => {
        const c = new T.Color().setHSL((hue + idx * 0.09) % 1, 0.92, 0.58);
        m.emissive.copy(c);
        m.color.copy(c);
      });
      fans.forEach((f) => { f.rotation.z = t * 5.2; });
      chairTop.rotation.y = Math.sin(t * 0.65) * 0.14;
    });
  }

  // =========================================================================
  // 3. AUTOELECTRIC: FULL DIAGNOSTIC BAY WITH ENGINE HARNESS, ECU, ALTERNATOR, BATTERY, OSCILLOSCOPE & FLUKE
  // =========================================================================
  function buildAutoElectricLab(T, group, animators) {
    const floorTex = makeCanvasTex(T, 512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#0b1622'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.14)'; ctx.lineWidth = 2;
      for (let i = 0; i < w; i += 48) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }
    });
    addPodium(T, group, 2.15, 0x34d399, 0x0b1520, floorTex);

    const darkMetal = new T.MeshStandardMaterial({ color: 0x111827, roughness: 0.32, metalness: 0.8 });
    const chrome = new T.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.16, metalness: 0.92 });
    const esdMat = new T.MeshStandardMaterial({ color: 0x0c2d48, roughness: 0.52, metalness: 0.25 });

    // --- ESD WORKBENCH WITH BACK PEGBOARD & OVERHEAD LIGHT ---
    const bench = new T.Mesh(new T.BoxGeometry(2.36, 0.075, 1.18), esdMat);
    bench.position.set(0, 0.66, -0.05);
    group.add(bench);
    [[-1.08, -0.54], [1.08, -0.54], [-1.08, 0.44], [1.08, 0.44]].forEach(([lx, lz]) => {
      const leg = new T.Mesh(new T.BoxGeometry(0.065, 0.66, 0.065), darkMetal);
      leg.position.set(lx, 0.33, lz);
      group.add(leg);
    });
    // Back Instrument Pegboard + Overhead Lamp
    const pegboard = new T.Mesh(new T.BoxGeometry(2.30, 0.72, 0.05), new T.MeshStandardMaterial({ color: 0x17253a, roughness: 0.6, metalness: 0.4 }));
    pegboard.position.set(0, 1.06, -0.60);
    group.add(pegboard);
    const benchLamp = new T.Mesh(new T.BoxGeometry(1.75, 0.035, 0.07), new T.MeshStandardMaterial({ color: 0xd1fae5, emissive: 0x34d399, emissiveIntensity: 2.2 }));
    benchLamp.position.set(0, 1.44, -0.52);
    group.add(benchLamp);

    // --- 12V BATTERY + ALTERNATOR + ECU + RELAY FUSE BOX CONNECTED BY 3D WIRE HARNESS ---
    // 12V AGM Battery (Left)
    const bat = new T.Mesh(new T.BoxGeometry(0.42, 0.28, 0.26), darkMetal);
    bat.position.set(-0.84, 0.84, 0.16);
    group.add(bat);
    const batTop = new T.Mesh(new T.BoxGeometry(0.43, 0.035, 0.27), new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
    batTop.position.set(-0.84, 0.99, 0.16);
    group.add(batTop);
    const posPost = new T.Mesh(new T.CylinderGeometry(0.022, 0.025, 0.05, 16), new T.MeshStandardMaterial({ color: 0xef4444 }));
    posPost.position.set(-0.71, 1.02, 0.16); group.add(posPost);
    const negPost = new T.Mesh(new T.CylinderGeometry(0.022, 0.025, 0.05, 16), new T.MeshStandardMaterial({ color: 0x3b82f6 }));
    negPost.position.set(-0.97, 1.02, 0.16); group.add(negPost);

    // 3-Phase Automotive Alternator with Spinning Pulley (Center-Left)
    const altGrp = new T.Group();
    altGrp.position.set(-0.34, 0.86, 0.16);
    group.add(altGrp);
    const altHousing = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.22, 24), chrome);
    altHousing.rotation.x = Math.PI / 2;
    altGrp.add(altHousing);
    const altPulley = new T.Group();
    altPulley.position.z = 0.14;
    altGrp.add(altPulley);
    const pulleyWheel = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.05, 20), darkMetal);
    pulleyWheel.rotation.x = Math.PI / 2;
    altPulley.add(pulleyWheel);
    const pulleyMark = new T.Mesh(new T.BoxGeometry(0.11, 0.018, 0.056), new T.MeshStandardMaterial({ color: 0xfbbf24 }));
    altPulley.add(pulleyMark);

    // Finned Aluminum ECU + 4 DIN 72552 Relays (Center-Right)
    const ecu = new T.Mesh(new T.BoxGeometry(0.32, 0.06, 0.24), chrome);
    ecu.position.set(0.16, 0.73, 0.18);
    group.add(ecu);
    for (let r = 0; r < 4; r++) {
      const rel = new T.Mesh(new T.BoxGeometry(0.06, 0.075, 0.06), new T.MeshStandardMaterial({ color: r % 2 === 0 ? 0x0f172a : 0x1d4ed8, roughness: 0.4 }));
      rel.position.set(0.04 + r * 0.085, 0.735, -0.02);
      group.add(rel);
    }

    // 3D Colored Wiring Harness Cables (Red +12V, Blue Ground, Green/Yellow CAN-Bus)
    const wires = [
      { pts: [[-0.71, 1.03, 0.16], [-0.52, 0.96, 0.28], [-0.34, 0.96, 0.16], [0.06, 0.76, 0.18]], color: 0xef4444 },
      { pts: [[-0.97, 1.03, 0.16], [-0.82, 0.75, 0.34], [-0.15, 0.72, 0.34], [0.16, 0.74, 0.28]], color: 0x3b82f6 },
      { pts: [[0.28, 0.75, 0.18], [0.46, 0.78, 0.26], [0.68, 0.80, 0.22]], color: 0x34d399 },
    ];
    wires.forEach((w) => {
      const curve = new T.CatmullRomCurve3(w.pts.map((p) => new T.Vector3(...p)));
      group.add(new T.Mesh(new T.TubeGeometry(curve, 22, 0.012, 8, false), new T.MeshStandardMaterial({ color: w.color, roughness: 0.45 })));
    });

    // --- DIGITAL OSCILLOSCOPE + FLUKE MULTIMETER + OBD-II SCANNER ---
    const scope = new T.Mesh(new T.BoxGeometry(0.92, 0.54, 0.24), new T.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.32 }));
    scope.position.set(-0.22, 0.97, -0.34);
    group.add(scope);
    const scopeTex = makeCanvasTex(T, 384, 224, (ctx, w, h) => {
      ctx.fillStyle = '#06121b'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(56,189,248,0.16)';
      for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 4; ctx.beginPath();
      for (let x = 10; x < w - 10; x += 4) {
        const y = 96 + Math.sin(x * 0.08) * 38;
        if (x === 10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.beginPath();
      for (let x = 10; x < w - 10; x += 4) {
        const y = 166 + (Math.floor(x / 28) % 2 === 0 ? -24 : 24);
        if (x === 10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#34d399'; ctx.font = 'bold 18px monospace'; ctx.fillText('CAN 60Ω · 14.2V OK', 16, 28);
    });
    const scopeScr = new T.Mesh(new T.PlaneGeometry(0.62, 0.38), new T.MeshStandardMaterial({ map: scopeTex, emissiveMap: scopeTex, emissive: 0xffffff, emissiveIntensity: 1.0 }));
    scopeScr.position.set(-0.34, 0.99, -0.218);
    group.add(scopeScr);
    for (let k = 0; k < 4; k++) {
      const kn = new T.Mesh(new T.CylinderGeometry(0.028, 0.032, 0.04, 16), chrome);
      kn.rotation.x = Math.PI / 2;
      kn.position.set(0.11, 0.80 + k * 0.11, -0.215);
      group.add(kn);
    }

    // Fluke 87V Multimeter (Right)
    const multiGrp = new T.Group();
    multiGrp.position.set(0.76, 0.90, 0.12);
    multiGrp.rotation.y = -0.35;
    multiGrp.rotation.x = -0.26;
    group.add(multiGrp);
    multiGrp.add(new T.Mesh(new T.BoxGeometry(0.28, 0.46, 0.09), new T.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.38 })));
    const mFace = new T.Mesh(new T.BoxGeometry(0.22, 0.39, 0.015), darkMetal);
    mFace.position.z = 0.045;
    multiGrp.add(mFace);
    const flukeTex = makeCanvasTex(T, 160, 96, (ctx, w, h) => {
      ctx.fillStyle = '#0e2a38'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 34px monospace'; ctx.fillText('14.20V', 14, 58);
      ctx.fillStyle = '#34d399'; ctx.font = 'bold 14px monospace'; ctx.fillText('DC AUTO · OK', 16, 82);
    });
    const mLcd = new T.Mesh(new T.PlaneGeometry(0.19, 0.11), new T.MeshStandardMaterial({ map: flukeTex, emissiveMap: flukeTex, emissive: 0xffffff, emissiveIntensity: 0.9 }));
    mLcd.position.set(0, 0.10, 0.056);
    multiGrp.add(mLcd);
    const mDial = new T.Mesh(new T.CylinderGeometry(0.06, 0.065, 0.028, 20), chrome);
    mDial.rotation.x = Math.PI / 2;
    mDial.position.set(0, -0.05, 0.058);
    multiGrp.add(mDial);

    // Glowing Signal Pulse Bead traveling along CAN cable
    const pulseSphere = new T.Mesh(new T.SphereGeometry(0.025, 12, 12), new T.MeshStandardMaterial({ color: 0x34d399, emissive: 0x34d399, emissiveIntensity: 3.0 }));
    group.add(pulseSphere);
    const canCurve = new T.CatmullRomCurve3(wires[2].pts.map((p) => new T.Vector3(...p)));

    animators.push((t) => {
      altPulley.rotation.z = -t * 4.5;
      const u = (t * 0.45) % 1;
      pulseSphere.position.copy(canCurve.getPoint(u));
    });
  }

  // =========================================================================
  // 4. HVAC: FULL SPLIT-SYSTEM CUTAWAY (INDOOR AC UNIT + WALL + COPPER PIPES + OUTDOOR INVERTER + MANIFOLD + VACUUM PUMP)
  // =========================================================================
  function buildHvacSplitSystem(T, group, animators) {
    const floorTex = makeCanvasTex(T, 512, 512, (ctx, w, h) => {
      // Left half: warm indoor parquet; Right half: outdoor technical rooftop concrete
      ctx.fillStyle = '#252130'; ctx.fillRect(0, 0, w / 2, h);
      ctx.fillStyle = '#18212e'; ctx.fillRect(w / 2, 0, w / 2, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
      for (let i = 0; i < h; i += 36) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w / 2, i); ctx.stroke(); }
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(w / 2 - 4, 0, 8, h);
    });
    addPodium(T, group, 2.25, 0x38bdf8, 0x0d1726, floorTex);

    function makeGaugeDialTex(label, color, needleAngle) {
      return makeCanvasTex(T, 256, 256, (ctx) => {
        ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(128, 128, 122, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 14;
        ctx.beginPath(); ctx.arc(128, 128, 114, Math.PI * 0.78, Math.PI * 2.22); ctx.stroke();
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 4;
        for (let i = 0; i <= 10; i++) {
          const a = Math.PI * 0.8 + (i / 10) * Math.PI * 1.4;
          ctx.beginPath();
          ctx.moveTo(128 + Math.cos(a) * 84, 128 + Math.sin(a) * 84);
          ctx.lineTo(128 + Math.cos(a) * 102, 128 + Math.sin(a) * 102);
          ctx.stroke();
        }
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center';
        ctx.fillText(label, 128, 198);
        ctx.save(); ctx.translate(128, 128); ctx.rotate(needleAngle);
        ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(84, 0); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(128, 128, 14, 0, Math.PI * 2); ctx.fill();
      });
    }

    const metalWhite = new T.MeshStandardMaterial({ color: 0xe8edf5, roughness: 0.28, metalness: 0.35 });
    const darkMetal = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.34, metalness: 0.78 });
    const steelMat = new T.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.28, metalness: 0.82 });
    const copperMat = new T.MeshStandardMaterial({ color: 0xd97706, metalness: 0.92, roughness: 0.2 });
    const insulMat = new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.82, metalness: 0.1 });

    // --- ARCHITECTURAL CUTAWAY WALL SEPARATING INDOOR ROOM (LEFT) & OUTDOOR UNIT (RIGHT) ---
    const wall = new T.Mesh(
      new T.BoxGeometry(0.14, 1.85, 1.52),
      new T.MeshStandardMaterial({ color: 0x334155, roughness: 0.72, metalness: 0.12 })
    );
    wall.position.set(-0.08, 0.925, -0.15);
    group.add(wall);
    // Clean indoor white drywall finish on left face of cutaway wall
    const indoorFace = new T.Mesh(new T.BoxGeometry(0.02, 1.82, 1.48), new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 }));
    indoorFace.position.set(-0.155, 0.925, -0.15);
    group.add(indoorFace);

    // --- LEFT SIDE (INDOOR): WALL-MOUNTED INDOOR SPLIT AC EVAPORATOR UNIT ---
    const indoorUnit = new T.Group();
    indoorUnit.position.set(-0.29, 1.46, -0.08);
    group.add(indoorUnit);
    // Sleek curved modern white indoor body
    const inBody = new T.Mesh(new T.BoxGeometry(0.24, 0.30, 1.06), metalWhite);
    indoorUnit.add(inBody);
    // Dark airflow louver slot + tilting vane
    const inSlot = new T.Mesh(new T.BoxGeometry(0.04, 0.06, 0.92), darkMetal);
    inSlot.position.set(-0.11, -0.10, 0);
    indoorUnit.add(inSlot);
    const louver = new T.Mesh(new T.BoxGeometry(0.018, 0.055, 0.90), metalWhite);
    louver.position.set(-0.13, -0.11, 0);
    louver.rotation.z = 0.45;
    indoorUnit.add(louver);
    // Glowing Digital LED Temp Display (18°C)
    const ledTex = makeCanvasTex(T, 160, 80, (ctx, w, h) => {
      ctx.fillStyle = '#091220'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 44px monospace'; ctx.textAlign = 'center';
      ctx.fillText('18°C', 80, 56);
    });
    const tempPanel = new T.Mesh(new T.PlaneGeometry(0.20, 0.09), new T.MeshStandardMaterial({ map: ledTex, emissiveMap: ledTex, emissive: 0xffffff, emissiveIntensity: 1.1 }));
    tempPanel.rotation.y = -Math.PI / 2;
    tempPanel.position.set(-0.122, 0.02, 0.24);
    indoorUnit.add(tempPanel);

    // Animated Cool Air Ribbons Flowing Down from Indoor Unit!
    const airStreams = [];
    for (let s = 0; s < 4; s++) {
      const streamMat = new T.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.45 });
      const ribbon = new T.Mesh(new T.BoxGeometry(0.26, 0.012, 0.07), streamMat);
      ribbon.position.set(-0.48 - s * 0.14, 1.24 - s * 0.16, -0.32 + s * 0.18);
      ribbon.rotation.z = 0.65;
      group.add(ribbon);
      airStreams.push({ mesh: ribbon, baseX: -0.46, baseY: 1.28, z: -0.32 + s * 0.18, phase: s * 0.25 });
    }

    // Indoor Side Table with AC Remote Control below indoor unit
    const table = new T.Mesh(new T.BoxGeometry(0.46, 0.52, 0.46), new T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
    table.position.set(-0.88, 0.26, 0.05);
    group.add(table);
    const remote = new T.Mesh(new T.BoxGeometry(0.08, 0.022, 0.18), metalWhite);
    remote.position.set(-0.88, 0.535, 0.05);
    remote.rotation.y = 0.35;
    group.add(remote);

    // --- INSULATED COPPER REFRIGERANT LINE SET PASSING THROUGH THE WALL ---
    // Suction (thick insulated) & Liquid (copper visible near flare nuts) lines from indoor -> through wall -> outdoor valves
    const suctionCurve = new T.CatmullRomCurve3([
      new T.Vector3(-0.20, 1.38, 0.22),
      new T.Vector3(0.06, 1.36, 0.26),
      new T.Vector3(0.22, 1.05, 0.32),
      new T.Vector3(0.46, 0.65, 0.32),
      new T.Vector3(0.86, 0.36, 0.22),
    ]);
    group.add(new T.Mesh(new T.TubeGeometry(suctionCurve, 32, 0.024, 12, false), insulMat));
    const liquidCurve = new T.CatmullRomCurve3([
      new T.Vector3(-0.20, 1.32, 0.28),
      new T.Vector3(0.08, 1.29, 0.33),
      new T.Vector3(0.26, 0.98, 0.38),
      new T.Vector3(0.50, 0.58, 0.36),
      new T.Vector3(0.86, 0.24, 0.22),
    ]);
    group.add(new T.Mesh(new T.TubeGeometry(liquidCurve, 32, 0.015, 12, false), copperMat));

    // --- RIGHT SIDE (OUTDOOR): PRO INVERTER CONDENSER UNIT (ZERO FAN CLIPPING) ---
    const ox = 0.72, oz = -0.18;
    [-0.36, 0.36].forEach((fx) => {
      const foot = new T.Mesh(new T.BoxGeometry(0.14, 0.08, 0.58), darkMetal);
      foot.position.set(ox + fx, 0.04, oz);
      group.add(foot);
    });
    const housing = new T.Mesh(new T.BoxGeometry(1.18, 0.88, 0.52), metalWhite);
    housing.position.set(ox, 0.52, oz);
    group.add(housing);
    const topCap = new T.Mesh(new T.BoxGeometry(1.22, 0.045, 0.56), steelMat);
    topCap.position.set(ox, 0.98, oz);
    group.add(topCap);
    // Rear Finned Condenser Coil
    for (let r = 0; r < 10; r++) {
      const fin = new T.Mesh(new T.BoxGeometry(1.06, 0.022, 0.022), steelMat);
      fin.position.set(ox, 0.18 + r * 0.07, oz - 0.268);
      group.add(fin);
    }
    // Deep Fan Cavity + 5-Blade Rotating Fan + Wire Grille (safely in front of housing!)
    const fCx = ox - 0.18, fCy = 0.53;
    const cavity = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.04, 40), new T.MeshStandardMaterial({ color: 0x060a14, roughness: 0.9 }));
    cavity.rotation.x = Math.PI / 2;
    cavity.position.set(fCx, fCy, oz + 0.265);
    group.add(cavity);
    const shroud = new T.Mesh(new T.TorusGeometry(0.33, 0.024, 14, 44), darkMetal);
    shroud.position.set(fCx, fCy, oz + 0.292);
    group.add(shroud);
    const fan = new T.Group();
    fan.position.set(fCx, fCy, oz + 0.302);
    group.add(fan);
    const fHub = new T.Mesh(new T.CylinderGeometry(0.075, 0.085, 0.036, 20), darkMetal);
    fHub.rotation.x = Math.PI / 2;
    fan.add(fHub);
    const bladeMat = new T.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.55, roughness: 0.26 });
    for (let b = 0; b < 5; b++) {
      const piv = new T.Group();
      piv.rotation.z = (b / 5) * Math.PI * 2;
      const bl = new T.Mesh(new T.BoxGeometry(0.085, 0.21, 0.011), bladeMat);
      bl.position.set(0, 0.165, 0);
      bl.rotation.y = 0.22;
      piv.add(bl);
      fan.add(piv);
    }
    const grille = new T.Group();
    grille.position.set(fCx, fCy, oz + 0.33);
    group.add(grille);
    [0.10, 0.18, 0.25, 0.32].forEach((rad) => grille.add(new T.Mesh(new T.TorusGeometry(rad, 0.006, 8, 36), darkMetal)));
    for (let s = 0; s < 4; s++) {
      const st = new T.Mesh(new T.BoxGeometry(0.65, 0.01, 0.01), darkMetal);
      st.rotation.z = (s * Math.PI) / 4;
      grille.add(st);
    }

    // --- SERVICE MANIFOLD GAUGE STAND + HOSES + R410A TANK ON ELECTRONIC SCALE (FRONT RIGHT) ---
    const mx = 1.24, mz = 0.72;
    const sBase = new T.Mesh(new T.CylinderGeometry(0.14, 0.17, 0.035, 20), darkMetal);
    sBase.position.set(mx, 0.018, mz); group.add(sBase);
    const sPole = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.64, 12), steelMat);
    sPole.position.set(mx, 0.34, mz); group.add(sPole);
    const mBlock = new T.Mesh(new T.BoxGeometry(0.38, 0.09, 0.08), steelMat);
    mBlock.position.set(mx, 0.66, mz); group.add(mBlock);
    const lpTex = makeGaugeDialTex('LP bar', '#0284c7', -0.6);
    const hpTex = makeGaugeDialTex('HP bar', '#e11d48', 0.45);
    [{ dx: -0.12, c: 0x0284c7, t: lpTex }, { dx: 0.12, c: 0xe11d48, t: hpTex }].forEach((g) => {
      const stem = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.08, 10), copperMat);
      stem.position.set(mx + g.dx, 0.74, mz); group.add(stem);
      const bez = new T.Mesh(new T.CylinderGeometry(0.105, 0.105, 0.05, 24), new T.MeshStandardMaterial({ color: g.c, metalness: 0.5, roughness: 0.28 }));
      bez.rotation.x = Math.PI / 2; bez.position.set(mx + g.dx, 0.87, mz); group.add(bez);
      const dial = new T.Mesh(new T.CircleGeometry(0.09, 24), new T.MeshStandardMaterial({ map: g.t, roughness: 0.2 }));
      dial.position.set(mx + g.dx, 0.87, mz + 0.028); group.add(dial);
    });
    // Service hoses from manifold to outdoor unit valves
    const bHose = new T.CatmullRomCurve3([new T.Vector3(mx - 0.12, 0.61, mz), new T.Vector3(1.12, 0.38, 0.46), new T.Vector3(0.92, 0.34, 0.16)]);
    group.add(new T.Mesh(new T.TubeGeometry(bHose, 20, 0.012, 8, false), new T.MeshStandardMaterial({ color: 0x0284c7 })));
    const rHose = new T.CatmullRomCurve3([new T.Vector3(mx + 0.12, 0.61, mz), new T.Vector3(1.25, 0.32, 0.36), new T.Vector3(0.92, 0.24, 0.16)]);
    group.add(new T.Mesh(new T.TubeGeometry(rHose, 20, 0.012, 8, false), new T.MeshStandardMaterial({ color: 0xe11d48 })));

    // Electronic Scale + R410A Refrigerant Cylinder
    const scale = new T.Mesh(new T.BoxGeometry(0.32, 0.045, 0.32), darkMetal);
    scale.position.set(0.56, 0.022, 0.84); group.add(scale);
    const tank = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.34, 24), new T.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, metalness: 0.35 }));
    tank.position.set(0.56, 0.22, 0.84); group.add(tank);
    const dome = new T.Mesh(new T.SphereGeometry(0.12, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, metalness: 0.35 }));
    dome.position.set(0.56, 0.39, 0.84); group.add(dome);
    const tValve = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.055, 12), copperMat);
    tValve.position.set(0.56, 0.53, 0.84); group.add(tValve);

    // Rotate HVAC cutaway so BOTH Indoor AC Unit (18°C + airflow) AND Outdoor Inverter + Pipes are clearly visible!
    group.rotation.y = 0.62;

    animators.push((t) => {
      fan.rotation.z = -t * 4.2;
      louver.rotation.z = 0.45 + Math.sin(t * 1.4) * 0.18;
      airStreams.forEach((a) => {
        const u = (t * 0.45 + a.phase) % 1;
        a.mesh.position.set(a.baseX - u * 0.55, a.baseY - u * 0.55, a.z);
        a.mesh.material.opacity = Math.sin(u * Math.PI) * 0.55;
      });
    });
  }

  // =========================================================================
  // 5. GRAPHIC DESIGN: FULL CREATIVE ART & PRINT STUDIO (GALLERY WALL + PEN DISPLAY + PACKAGING MOCKUPS + PLOTTER + SOFTBOX)
  // =========================================================================
  function buildDesignStudio(T, group, animators) {
    const floorTex = makeCanvasTex(T, 512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#141026'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.1)'; ctx.lineWidth = 2;
      for (let i = 0; i < w; i += 44) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }
    });
    addPodium(T, group, 2.25, 0xf472b6, 0x120d22, floorTex);

    const wallMat = new T.MeshStandardMaterial({ color: 0x140f29, roughness: 0.88, metalness: 0.05 });
    const darkMetal = new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.28, metalness: 0.82 });
    const woodMat = new T.MeshStandardMaterial({ color: 0x3b261d, roughness: 0.42, metalness: 0.12 });
    const chrome = new T.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.92 });

    // --- OPEN 2-WALL ART GALLERY STUDIO ---
    const backWall = new T.Mesh(new T.BoxGeometry(2.75, 1.82, 0.08), wallMat);
    backWall.position.set(0, 0.91, -1.12);
    group.add(backWall);
    const leftWall = new T.Mesh(new T.BoxGeometry(0.08, 1.82, 2.20), wallMat);
    leftWall.position.set(-1.34, 0.91, -0.04);
    group.add(leftWall);

    // 3 Framed Graphic Design Posters on Back Gallery Wall (Bauhaus / Typography / CMYK)
    const posterConfigs = [
      { x: -0.78, bg: '#1e1b4b', c1: '#f43f5e', c2: '#facc15', title: 'BAUHAUS' },
      { x: 0.0, bg: '#0f172a', c1: '#06b6d4', c2: '#ec4899', title: 'CMYK 300' },
      { x: 0.78, bg: '#1e1b4b', c1: '#a855f7', c2: '#34d399', title: 'GRID 8PX' },
    ];
    posterConfigs.forEach((pc) => {
      const pTex = makeCanvasTex(T, 220, 280, (ctx, w, h) => {
        ctx.fillStyle = pc.bg; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = pc.c1; ctx.beginPath(); ctx.arc(110, 115, 62, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = pc.c2; ctx.fillRect(46, 128, 128, 52);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(pc.title, 110, 242);
      });
      const frame = new T.Mesh(new T.BoxGeometry(0.56, 0.70, 0.03), darkMetal);
      frame.position.set(pc.x, 1.32, -1.06);
      group.add(frame);
      const art = new T.Mesh(new T.PlaneGeometry(0.49, 0.63), new T.MeshStandardMaterial({ map: pTex, emissiveMap: pTex, emissive: 0xffffff, emissiveIntensity: 0.25 }));
      art.position.set(pc.x, 1.32, -1.042);
      group.add(art);
    });

    // --- DESIGNER WORKBENCH + PEN DISPLAY + PACKAGING MOCKUPS + PANTONE FAN ---
    const desk = new T.Mesh(new T.BoxGeometry(1.75, 0.07, 0.96), woodMat);
    desk.position.set(-0.34, 0.66, -0.32);
    group.add(desk);
    [[-1.12, -0.72], [0.44, -0.72], [-1.12, 0.08], [0.44, 0.08]].forEach(([lx, lz]) => {
      const leg = new T.Mesh(new T.CylinderGeometry(0.026, 0.022, 0.66, 14), darkMetal);
      leg.position.set(lx, 0.33, lz);
      group.add(leg);
    });

    // Pen Display (Wacom Cintiq) on Adjustable Aluminum Stand
    const tStand = new T.Mesh(new T.BoxGeometry(0.38, 0.30, 0.05), chrome);
    tStand.position.set(-0.48, 0.83, -0.46);
    tStand.rotation.x = 0.26;
    group.add(tStand);
    const tablet = new T.Group();
    tablet.position.set(-0.48, 0.94, -0.34);
    tablet.rotation.x = -0.36;
    group.add(tablet);
    tablet.add(new T.Mesh(new T.BoxGeometry(0.96, 0.58, 0.03), darkMetal));
    const dTex = makeCanvasTex(T, 512, 288, (ctx) => {
      ctx.fillStyle = '#0c1024'; ctx.fillRect(0, 0, 512, 288);
      const rg = ctx.createRadialGradient(256, 138, 12, 256, 138, 118);
      rg.addColorStop(0, '#f43f5e'); rg.addColorStop(0.5, '#8b5cf6'); rg.addColorStop(1, '#06b6d4');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(256, 138, 92, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.strokeRect(108, 36, 296, 200);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px monospace'; ctx.fillText('CMYK · 300 DPI · BLEED 3MM', 102, 268);
    });
    const scr = new T.Mesh(new T.PlaneGeometry(0.88, 0.50), new T.MeshStandardMaterial({ map: dTex, emissiveMap: dTex, emissive: 0xffffff, emissiveIntensity: 0.92 }));
    scr.position.z = 0.018;
    tablet.add(scr);

    // Physical 3D Brand Packaging Mockups on Right Side of Desk (Box + Coffee Cup + Pantone Fan)
    const pkgTex = makeCanvasTex(T, 160, 160, (ctx, w, h) => {
      ctx.fillStyle = '#6366f1'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f472b6'; ctx.fillRect(0, 108, w, 52);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('AMK', 44, 72);
    });
    const pkgBox = new T.Mesh(new T.BoxGeometry(0.24, 0.30, 0.18), new T.MeshStandardMaterial({ map: pkgTex, roughness: 0.35 }));
    pkgBox.position.set(0.22, 0.845, -0.44);
    pkgBox.rotation.y = -0.38;
    group.add(pkgBox);
    const cup = new T.Mesh(new T.CylinderGeometry(0.052, 0.04, 0.14, 20), new T.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
    cup.position.set(0.18, 0.765, -0.14);
    group.add(cup);
    const cupSleeve = new T.Mesh(new T.CylinderGeometry(0.050, 0.045, 0.055, 20), new T.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 }));
    cupSleeve.position.set(0.18, 0.765, -0.14);
    group.add(cupSleeve);
    // Pantone Swatches
    [0x06b6d4, 0xec4899, 0xfacc15, 0x8b5cf6].forEach((col, idx) => {
      const sw = new T.Mesh(new T.BoxGeometry(0.11, 0.28, 0.012), new T.MeshStandardMaterial({ color: col, roughness: 0.32 }));
      sw.position.set(-0.08, 0.705 + idx * 0.005, -0.02);
      sw.rotation.x = -Math.PI / 2;
      sw.rotation.z = -0.38 + idx * 0.25;
      group.add(sw);
    });

    // --- WIDE-FORMAT PRINT PLOTTER ON RIGHT WITH ANIMATED PRINTED POSTER ROLL ---
    const plotter = new T.Group();
    plotter.position.set(1.06, 0, -0.20);
    plotter.rotation.y = -0.42;
    group.add(plotter);
    // Plotter Stand Legs
    [-0.44, 0.44].forEach((lx) => {
      const leg = new T.Mesh(new T.BoxGeometry(0.05, 0.82, 0.06), darkMetal);
      leg.position.set(lx, 0.41, 0);
      plotter.add(leg);
      const foot = new T.Mesh(new T.BoxGeometry(0.06, 0.04, 0.54), darkMetal);
      foot.position.set(lx, 0.02, 0);
      plotter.add(foot);
    });
    // Plotter Head Unit
    const pHead = new T.Mesh(new T.BoxGeometry(1.08, 0.24, 0.36), new T.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.35 }));
    pHead.position.set(0, 0.86, 0);
    plotter.add(pHead);
    const pAccent = new T.Mesh(new T.BoxGeometry(1.09, 0.045, 0.37), new T.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 }));
    pAccent.position.set(0, 0.94, 0);
    plotter.add(pAccent);
    // Moving Print Carriage LED
    const carriage = new T.Mesh(new T.BoxGeometry(0.14, 0.06, 0.06), new T.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.2 }));
    carriage.position.set(0, 0.84, 0.18);
    plotter.add(carriage);
    // Bright Printed CMYK Poster Emerging Out the Front!
    const printTex = makeCanvasTex(T, 256, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#06b6d4'); g.addColorStop(0.5, '#a855f7'); g.addColorStop(1, '#f43f5e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('AMK DESIGN', 128, 118);
      ctx.font = 'bold 20px monospace'; ctx.fillText('PDF/X-1a · PRINT', 128, 162);
    });
    const sheet = new T.Mesh(new T.PlaneGeometry(0.76, 0.52), new T.MeshStandardMaterial({ map: printTex, side: T.DoubleSide, roughness: 0.35 }));
    sheet.position.set(0, 0.58, 0.24);
    sheet.rotation.x = -0.32;
    plotter.add(sheet);

    // --- STUDIO SOFTBOX LIGHT ON TRIPOD (LEFT FRONT) ---
    const softbox = new T.Group();
    softbox.position.set(-1.12, 0, 0.82);
    softbox.rotation.y = 0.72;
    group.add(softbox);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const tLeg = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.52, 8), darkMetal);
      tLeg.position.set(Math.sin(a) * 0.14, 0.20, Math.cos(a) * 0.14);
      tLeg.rotation.z = -Math.sin(a) * 0.52;
      tLeg.rotation.x = Math.cos(a) * 0.52;
      softbox.add(tLeg);
    }
    const sPole = new T.Mesh(new T.CylinderGeometry(0.016, 0.02, 1.24, 10), darkMetal);
    sPole.position.y = 0.76;
    softbox.add(sPole);
    const hood = new T.Mesh(new T.BoxGeometry(0.42, 0.42, 0.24), darkMetal);
    hood.position.set(0, 1.38, 0);
    hood.rotation.x = 0.28;
    softbox.add(hood);
    const diffuser = new T.Mesh(new T.PlaneGeometry(0.38, 0.38), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef3c7, emissiveIntensity: 2.0 }));
    diffuser.position.set(0, 1.34, 0.125);
    diffuser.rotation.x = 0.28;
    softbox.add(diffuser);

    // Designer Swivel Stool in front of desk
    const stool = new T.Group();
    stool.position.set(-0.38, 0, 0.42);
    group.add(stool);
    stool.add(new T.Mesh(new T.CylinderGeometry(0.18, 0.20, 0.03, 20), chrome));
    const stPole = new T.Mesh(new T.CylinderGeometry(0.024, 0.024, 0.42, 12), chrome);
    stPole.position.y = 0.22; stool.add(stPole);
    const stSeat = new T.Mesh(new T.CylinderGeometry(0.20, 0.18, 0.07, 24), new T.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 }));
    stSeat.position.y = 0.45; stool.add(stSeat);

    const studioGlow = new T.PointLight(0xf472b6, 2.2, 6);
    studioGlow.position.set(-0.6, 1.5, 0.8);
    group.add(studioGlow);

    animators.push((t) => {
      carriage.position.x = Math.sin(t * 2.2) * 0.36;
    });
  }

  function build(T, sceneType) {
    const group = new T.Group();
    const animators = [];
    if (sceneType === 'sport_wheel_garage') buildAutoWorkshop(T, group, animators);
    else if (sceneType === 'gaming_room_rig') buildGamingRoom(T, group, animators);
    else if (sceneType === 'autoelectric_lab') buildAutoElectricLab(T, group, animators);
    else if (sceneType === 'hvac_rooftop') buildHvacSplitSystem(T, group, animators);
    else buildDesignStudio(T, group, animators);
    return { group, animators };
  }

  return { build };
})();
