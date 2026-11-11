(() => {
  if (window.PrismFX) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.14);
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now); osc.stop(now + 0.23);
      } else if (kind === 'good') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now); osc.stop(now + 0.13);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now); osc.stop(now + 0.055);
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
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 680);
  }

  // Fixed-pool precision ripples & micro-sparks (Zero GC, zero boxy confetti)
  const MAX_PARTS = 40;
  const pool = [];
  for (let i = 0; i < MAX_PARTS; i++) {
    pool.push({ active: false, ring: false, x: 0, y: 0, vx: 0, vy: 0, r: 4, life: 0, maxLife: 1, color: '#4f46e5' });
  }
  let pCur = 0;
  const ACCENTS = ['#4f46e5', '#0284c7', '#10b981', '#38bdf8'];

  function addPart(ring, x, y, vx, vy, r, color, life) {
    const p = pool[pCur];
    pCur = (pCur + 1) % MAX_PARTS;
    p.active = true; p.ring = ring;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.r = r; p.color = color;
    p.life = life; p.maxLife = life;
  }

  function burst(x, y, count = 12) {
    if (reduceMotion) return;
    addPart(true, x, y, 0, 0, 10, '#4f46e5', 28);
    const n = Math.min(16, count);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const spd = 1.6 + Math.random() * 2.8;
      addPart(false, x, y, Math.cos(ang) * spd, Math.sin(ang) * spd, 2.2 + Math.random() * 1.4, ACCENTS[i % ACCENTS.length], 24 + Math.random() * 10);
    }
  }

  function initCanvas() {
    if (document.getElementById('global-3d-canvas')) return;
    let fxCanvas = document.getElementById('prism-fx-canvas');
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
    let ptrX = 0, ptrY = 0, sPtrX = 0, sPtrY = 0, phase = 0;
    function resize() {
      w = fxCanvas.width = window.innerWidth;
      h = fxCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', (e) => {
      ptrX = (e.clientX / Math.max(1, w) - 0.5) * 2;
      ptrY = (e.clientY / Math.max(1, h) - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('click', (e) => {
      if (e.target.closest('button, a, input, select')) return;
      addPart(true, e.clientX, e.clientY, 0, 0, 6, 'rgba(79,70,229,0.55)', 24);
    }, { passive: true });

    function draw() {
      if (document.hidden) {
        if (!reduceMotion) requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      sPtrX += (ptrX - sPtrX) * 0.08;
      sPtrY += (ptrY - sPtrY) * 0.08;
      if (!reduceMotion) phase += 0.012;

      // Subtle Silk Topographic Mesh Manifold (5 depth-faded perspective waves)
      const baseH = h * 0.72 - sPtrY * 18;
      for (let r = 0; r < 5; r++) {
        const depth = r / 4;
        ctx.beginPath();
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = r % 2 === 0
          ? 'rgba(79, 70, 229, ' + (0.045 + (1 - depth) * 0.065).toFixed(3) + ')'
          : 'rgba(14, 165, 233, ' + (0.04 + (1 - depth) * 0.055).toFixed(3) + ')';
        for (let step = 0; step <= 32; step++) {
          const u = step / 32;
          const x = u * w;
          const elevation = Math.sin(u * 5.2 + phase + r * 0.55 + sPtrX * 0.7) * (24 + r * 4)
                          + Math.cos(u * 2.7 - phase * 0.65 + r * 0.9) * 14;
          const y = baseH + r * 26 + elevation;
          if (step === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Precision ripples & particles
      for (let i = 0; i < MAX_PARTS; i++) {
        const p = pool[i];
        if (!p.active) continue;
        p.life -= 1;
        if (p.life <= 0) { p.active = false; continue; }
        const a = p.life / p.maxLife;
        ctx.globalAlpha = a * 0.7;
        if (p.ring) {
          p.r += 2.6 * a + 0.8;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
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
          card.style.setProperty('--rx', ((0.5 - py) * 2.2).toFixed(2) + 'deg');
          card.style.setProperty('--ry', ((px - 0.5) * 2.8).toFixed(2) + 'deg');
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
