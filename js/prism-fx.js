(() => {
  if (window.PrismFX) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PALETTE = ['#4f46e5', '#0284c7', '#10b981', '#f59e0b', '#ec4899', '#38bdf8'];
  let sfxEnabled = false;
  let audioCtx = null;

  function play(kind) {
    if (!sfxEnabled) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (kind === 'bonus' || kind === 'party') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(783.99, now + 0.06);
        osc.frequency.setValueAtTime(1046.5, now + 0.13);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now); osc.stop(now + 0.29);
      } else if (kind === 'good') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.09);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now); osc.stop(now + 0.15);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
        osc.start(now); osc.stop(now + 0.06);
      }
    } catch {}
  }

  function spawnFloat(x, y, text, isBonus) {
    const el = document.createElement('span');
    el.className = 'prism-xp-float' + (isBonus ? ' is-bonus' : '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 760);
  }

  // Allocation-free 3D Polyhedra + Particle/Confetti Pool on #prism-fx-canvas
  let fxCanvas = document.getElementById('global-3d-canvas') || document.getElementById('prism-fx-canvas');
  const MAX_PARTS = 72;
  const pool = [];
  for (let i = 0; i < MAX_PARTS; i++) {
    pool.push({ active: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, size: 4, color: PALETTE[0], life: 0, maxLife: 1, rot: 0, vr: 0 });
  }
  let pCursor = 0;

  function addPart(kind, x, y, vx, vy, size, color, life) {
    const p = pool[pCursor];
    pCursor = (pCursor + 1) % MAX_PARTS;
    p.active = true; p.kind = kind;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.size = size; p.color = color;
    p.life = life; p.maxLife = life;
    p.rot = Math.random() * Math.PI * 2;
    p.vr = (Math.random() - 0.5) * 0.24;
  }

  function burst(x, y, count = 20, confetti = true) {
    if (reduceMotion) return;
    addPart(2, x, y, 0, 0, 7, PALETTE[Math.floor(Math.random() * PALETTE.length)], 24);
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.35;
      const spd = 2 + Math.random() * 4.6;
      addPart(
        confetti ? 1 : 0,
        x, y,
        Math.cos(ang) * spd,
        Math.sin(ang) * spd - (confetti ? 2.0 : 0.4),
        confetti ? 4.5 + Math.random() * 3.5 : 2.2 + Math.random() * 2,
        PALETTE[i % PALETTE.length],
        confetti ? 40 + Math.random() * 18 : 22 + Math.random() * 12
      );
    }
  }

  function initCanvas() {
    if (document.getElementById('global-3d-canvas')) return; // index.html owns its flagship canvas
    if (!fxCanvas) {
      fxCanvas = document.createElement('canvas');
      fxCanvas.id = 'prism-fx-canvas';
      fxCanvas.className = 'prism-fx-canvas';
      fxCanvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(fxCanvas);
    }
    const ctx = fxCanvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = window.innerWidth, h = window.innerHeight;
    let ptrX = 0, ptrY = 0, phase = 0, lastTrail = 0;
    function resize() {
      w = fxCanvas.width = window.innerWidth;
      h = fxCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', (e) => {
      ptrX = (e.clientX / Math.max(1, w) - 0.5) * 2;
      ptrY = (e.clientY / Math.max(1, h) - 0.5) * 2;
      const now = performance.now();
      if (!reduceMotion && now - lastTrail > 45) {
        lastTrail = now;
        addPart(0, e.clientX, e.clientY, (Math.random() - 0.5), -0.6 - Math.random() * 0.7, 2.2, PALETTE[Math.floor(Math.random() * PALETTE.length)], 20);
      }
    }, { passive: true });

    window.addEventListener('click', (e) => {
      if (e.target.closest('button, a, input, select')) return;
      burst(e.clientX, e.clientY, 10, false);
    }, { passive: true });

    const octVerts = [[0,-1.25,0],[1.1,0,0],[0,0,1.1],[-1.1,0,0],[0,0,-1.1],[0,1.25,0]];
    const octEdges = [[0,1],[0,2],[0,3],[0,4],[5,1],[5,2],[5,3],[5,4],[1,2],[2,3],[3,4],[4,1]];
    const shapes = [];
    const sColors = ['rgba(79,70,229,0.16)', 'rgba(2,132,199,0.16)', 'rgba(16,185,129,0.14)'];
    for (let i = 0; i < 6; i++) {
      shapes.push({
        x: (i < 3 ? 0.06 + i * 0.04 : 0.86 + (i - 3) * 0.04),
        y: ((i * 37 + 19) % 100) / 100,
        z: 2.2 + (i % 3) * 0.8,
        size: 22 + (i % 3) * 11,
        rx: i * 0.7, ry: i * 1.1,
        vx: 0.005 + (i % 3) * 0.002,
        vy: 0.008 + (i % 2) * 0.003,
        color: sColors[i % sColors.length]
      });
    }
    const tmp = [0, 0, 0];
    const proj = octVerts.map(() => [0, 0]);

    function rotInto(x, y, z, ax, ay, out) {
      const cx = Math.cos(ax), sx = Math.sin(ax);
      const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
      const cy = Math.cos(ay), sy = Math.sin(ay);
      out[0] = x * cy + z1 * sy;
      out[1] = y1;
      out[2] = -x * sy + z1 * cy;
    }

    function draw() {
      if (document.hidden) {
        if (!reduceMotion) requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      if (!reduceMotion) phase += 0.015;

      // Subtle 3D horizon wave
      const hy = h * 0.74 - ptrY * 10;
      ctx.lineWidth = 1.1;
      for (let row = 0; row < 2; row++) {
        ctx.beginPath();
        ctx.strokeStyle = row === 0 ? 'rgba(79,70,229,0.1)' : 'rgba(2,132,199,0.09)';
        for (let step = 0; step <= 24; step++) {
          const t = step / 24;
          const px = t * w;
          const py = hy + row * 34 + Math.sin(t * 6 + phase + row) * 26;
          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Floating margin polyhedra
      const scrollShift = (window.scrollY || 0) * 0.05;
      for (let si = 0; si < shapes.length; si++) {
        const s = shapes[si];
        if (!reduceMotion) { s.rx += s.vx; s.ry += s.vy; }
        const cx = s.x * w - ptrX * (22 / s.z);
        const cy = ((s.y * h - scrollShift / s.z) % (h + 100) + h + 100) % (h + 100) - 50 - ptrY * (16 / s.z);
        for (let vi = 0; vi < octVerts.length; vi++) {
          const v = octVerts[vi];
          rotInto(v[0], v[1], v[2], s.rx, s.ry, tmp);
          const d = 4.2 / (4.2 + tmp[2]);
          proj[vi][0] = cx + tmp[0] * s.size * d;
          proj[vi][1] = cy + tmp[1] * s.size * d;
        }
        ctx.strokeStyle = s.color;
        ctx.beginPath();
        for (let ei = 0; ei < octEdges.length; ei++) {
          const e = octEdges[ei];
          ctx.moveTo(proj[e[0]][0], proj[e[0]][1]);
          ctx.lineTo(proj[e[1]][0], proj[e[1]][1]);
        }
        ctx.stroke();
      }

      // Render active sparks/confetti
      for (let i = 0; i < MAX_PARTS; i++) {
        const p = pool[i];
        if (!p.active) continue;
        p.life -= 1;
        if (p.life <= 0) { p.active = false; continue; }
        const a = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = a;
        if (p.kind === 2) {
          p.size += 3.0;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.kind === 1) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.vx *= 0.985; p.rot += p.vr;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size * 0.6, -p.size * 0.35, p.size * 1.2, p.size * 0.7);
          ctx.restore();
        } else {
          p.x += p.vx; p.y += p.vy;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (!reduceMotion) requestAnimationFrame(draw);
    }
    draw();
  }

  function initTiltsAndReveals() {
    if (reduceMotion) return;
    document.querySelectorAll('.card:not(.tilt-3d), .lesson-visual-card:not(.tilt-3d), .dashboard-primary:not(.tilt-3d), .dashboard-panel:not(.tilt-3d)').forEach((card) => {
      card.classList.add('tilt-3d');
      let rect = null, pending = false, lastEv = null;
      card.addEventListener('pointerenter', () => {
        rect = card.getBoundingClientRect();
        card.classList.add('is-tilting');
      });
      card.addEventListener('pointermove', (ev) => {
        lastEv = ev;
        if (pending || !rect) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          if (!lastEv || !rect) return;
          const lx = lastEv.clientX - rect.left;
          const ly = lastEv.clientY - rect.top;
          const px = lx / Math.max(1, rect.width);
          const py = ly / Math.max(1, rect.height);
          card.style.setProperty('--mx', lx.toFixed(0) + 'px');
          card.style.setProperty('--my', ly.toFixed(0) + 'px');
          card.style.setProperty('--rx', ((0.5 - py) * 3.5).toFixed(2) + 'deg');
          card.style.setProperty('--ry', ((px - 0.5) * 4.5).toFixed(2) + 'deg');
        });
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        rect = null;
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  function bootstrap() {
    initCanvas();
    initTiltsAndReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  window.PrismFX = {
    burst,
    play,
    spawnFloat,
    setSfx(v) { sfxEnabled = !!v; }
  };
})();
