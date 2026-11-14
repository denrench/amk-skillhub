/**
 * EduSpace 3.0 — Motion, Scroll-Reveal, 3D Card Tilt & Micro-Interactions Engine
 * Respects prefers-reduced-motion. Zero external dependencies.
 */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initScrollReveal() {
    const selectors = [
      '[data-reveal]',
      '.course-card',
      '.bento-card',
      '.stat-card',
      '.lesson-card',
      '.feature-card',
      '.pricing-card',
      '.review-card',
      '.timeline-item',
      '.starter-panel'
    ];
    const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
    if (!nodes.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach((el) => el.classList.add('reveal-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    nodes.forEach((el, idx) => {
      if (el.classList.contains('reveal-visible')) return;
      el.classList.add('reveal-hidden');
      el.style.transitionDelay = `${Math.min((idx % 6) * 55, 280)}ms`;
      observer.observe(el);
    });
  }

  function initCardTilt() {
    if (reduceMotion) return;
    const cards = document.querySelectorAll('.course-card, .bento-card, .pricing-card, .feature-card, [data-tilt]');
    cards.forEach((card) => {
      card.classList.add('edu-tilt-card');
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotY = (x - 0.5) * 8;
        const rotX = (0.5 - y) * 8;
        card.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px)`;
        card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  function initCounters() {
    const els = document.querySelectorAll('[data-count-to]');
    if (!els.length) return;
    const animate = (el) => {
      const target = Number(el.dataset.countTo || 0);
      const suffix = el.dataset.countSuffix || '';
      if (reduceMotion || !target) {
        el.textContent = target + suffix;
        return;
      }
      const duration = 900;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      els.forEach(animate);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animate(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });
    els.forEach((el) => obs.observe(el));
  }

  function initRipples() {
    if (reduceMotion) return;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, .btn, .starter-button, a[class*="rounded"]');
      if (!btn || btn.disabled) return;
      const rect = btn.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 16) return;
      const ripple = document.createElement('span');
      ripple.className = 'edu-ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      if (getComputedStyle(btn).position === 'static') {
        btn.style.position = 'relative';
      }
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 550);
    });
  }

  function init() {
    initScrollReveal();
    initCardTilt();
    initCounters();
    initRipples();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.EduSpaceAnimations = { init, initScrollReveal, initCardTilt, initCounters };
})();
