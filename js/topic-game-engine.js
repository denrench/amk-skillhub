/**
 * AMK SKILLHUB — SELF-CONTAINED DOMAIN INTERACTIVE TOPIC GAME ENGINE (v2.0)
 * Replaces static video lectures across all 60 lessons (5 specialties x 12 lessons)
 * with bespoke 3-round interactive domain mini-simulators.
 * Self-contained scoped CSS + inline SVGs (works cleanly on academy.css AND Tailwind pages).
 * Mechanics: bench_tuner, defect_inspector, code_or_formula_builder, probe_diagnostic, workshop_quest, triage_radar.
 */
window.TopicGameEngine = (function () {
  'use strict';

  const instances = {};

  function esc(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(str) {
    return esc(str).replace(/'/g, '&#39;');
  }

  function svgIcon(name, size) {
    const s = size || 16;
    const base = `width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="tge-svg"`;
    switch (name) {
      case 'heart_on':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="tge-svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
      case 'heart_off':
        return `<svg ${base}><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"/></svg>`;
      case 'heart_broken':
        return `<svg ${base}><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"/><path d="M12 6l-2 4l4 3l-2 4v3"/></svg>`;
      case 'tune':
        return `<svg ${base}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`;
      case 'troubleshoot':
        return `<svg ${base}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
      case 'construction':
        return `<svg ${base}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`;
      case 'sensors':
        return `<svg ${base}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>`;
      case 'forum':
        return `<svg ${base}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
      case 'bolt':
        return `<svg ${base}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      case 'fire':
        return `<svg ${base}><path d="M12 2c1 4-2 6-2 10a4 4 0 0 0 8 0c0-3-2-5-2-7-1 2-2 2-4-3z"/><path d="M8.5 14.5A3.5 3.5 0 0 0 12 18a3.5 3.5 0 0 0 3.5-3.5"/></svg>`;
      case 'tips':
        return `<svg ${base}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`;
      case 'check':
        return `<svg ${base}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
      case 'error':
        return `<svg ${base}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      case 'cancel':
        return `<svg ${base}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      case 'arrow':
        return `<svg ${base}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
      case 'replay':
        return `<svg ${base}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`;
      case 'play':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="tge-svg"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;
      case 'close':
        return `<svg ${base}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      case 'assignment':
        return `<svg ${base}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
      case 'warning':
        return `<svg ${base}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      case 'star':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="tge-svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      default:
        return `<svg ${base}><circle cx="12" cy="12" r="9"/></svg>`;
    }
  }

  function injectStyles() {
    if (document.getElementById('tge-scoped-css')) return;
    const style = document.createElement('style');
    style.id = 'tge-scoped-css';
    style.textContent = `
      .tge-shell, .tge-shell * { box-sizing: border-box; }
      .tge-svg { display: inline-block; vertical-align: middle; flex-shrink: 0; }
      .tge-shell {
        position: relative;
        overflow: hidden;
        animation: none !important;
        opacity: 1 !important;
        border-radius: 22px;
        border: 1px solid rgba(99, 102, 241, 0.34);
        background: linear-gradient(145deg, #0b1120 0%, #0f172a 55%, #161838 100%);
        color: #f8fafc;
        padding: 20px;
        box-shadow: 0 20px 44px rgba(2, 6, 23, 0.38);
        font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
        min-width: 0;
        text-align: left;
      }
      .tge-shell.tge-compact {
        padding: 16px;
        gap: 12px;
        border-radius: 18px;
        box-shadow: none;
        border-color: rgba(99, 102, 241, 0.28);
      }
      .tge-shell.tge-victory {
        border-color: rgba(16, 185, 129, 0.48);
        background: linear-gradient(145deg, #062820 0%, #0b1120 55%, #0f172a 100%);
        text-align: center;
        align-items: center;
      }
      .tge-header {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .tge-compact .tge-header { padding-bottom: 10px; gap: 8px; }
      .tge-header-meta { min-width: 0; flex: 1 1 260px; display: flex; flex-direction: column; gap: 6px; }
      .tge-badges { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
      .tge-mech-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        border: 1px solid transparent;
      }
      .tge-mech-bench { background: rgba(6, 182, 212, 0.16); color: #67e8f9; border-color: rgba(6, 182, 212, 0.35); }
      .tge-mech-defect { background: rgba(244, 63, 94, 0.16); color: #fda4af; border-color: rgba(244, 63, 94, 0.35); }
      .tge-mech-builder { background: rgba(168, 85, 247, 0.18); color: #d8b4fe; border-color: rgba(168, 85, 247, 0.38); }
      .tge-mech-probe { background: rgba(245, 158, 11, 0.16); color: #fcd34d; border-color: rgba(245, 158, 11, 0.35); }
      .tge-mech-quest { background: rgba(99, 102, 241, 0.18); color: #a5b4fc; border-color: rgba(99, 102, 241, 0.38); }
      .tge-mech-triage { background: rgba(16, 185, 129, 0.16); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.35); }
      .tge-inst-badge {
        display: inline-flex;
        align-items: center;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 10px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-weight: 700;
        background: rgba(255, 255, 255, 0.06);
        color: #cbd5e1;
        border: 1px solid rgba(255, 255, 255, 0.12);
        max-width: 100%;
        overflow-wrap: anywhere;
      }
      .tge-title {
        margin: 0;
        font-size: 17px;
        font-weight: 800;
        color: #ffffff;
        line-height: 1.3;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .tge-compact .tge-title { font-size: 15px; }
      .tge-brief {
        margin: 0;
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
      .tge-hud { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; flex-shrink: 0; }
      .tge-pill {
        padding: 6px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 800;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        line-height: 1;
      }
      .tge-pill-hearts { background: rgba(2, 6, 23, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); }
      .tge-heart-on { color: #fb7185; display: inline-flex; }
      .tge-heart-off { color: #334155; display: inline-flex; }
      .tge-pill-combo { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #fcd34d; }
      .tge-pill-score { background: rgba(99, 102, 241, 0.16); border: 1px solid rgba(99, 102, 241, 0.36); color: #c7d2fe; }
      .tge-progress-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .tge-progress-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .tge-round-label {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #67e8f9;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
      }
      .tge-dots { display: flex; align-items: center; gap: 6px; }
      .tge-dot { height: 7px; border-radius: 999px; transition: all 0.25s ease; width: 14px; background: rgba(255, 255, 255, 0.16); }
      .tge-dot-done { width: 28px; background: #34d399; }
      .tge-dot-active { width: 28px; background: #818cf8; animation: tgePulse 1.6s infinite; }
      @keyframes tgePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      .tge-btn-hint {
        padding: 6px 12px;
        border-radius: 10px;
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid rgba(245, 158, 11, 0.32);
        color: #fcd34d;
        font-size: 11px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: background 0.15s ease;
        font-family: inherit;
      }
      .tge-btn-hint:hover { background: rgba(245, 158, 11, 0.22); }
      .tge-hint-box {
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(245, 158, 11, 0.11);
        border: 1px solid rgba(245, 158, 11, 0.34);
        color: #fef3c7;
        font-size: 12px;
        line-height: 1.5;
      }
      .tge-hint-box strong { color: #fcd34d; }
      .tge-stage { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
      .tge-prompt {
        padding: 14px 16px;
        border-radius: 14px;
        font-size: 13px;
        font-weight: 700;
        color: #ffffff;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .tge-prompt-indigo { background: rgba(99, 102, 241, 0.14); border: 1px solid rgba(99, 102, 241, 0.35); }
      .tge-prompt-rose { background: rgba(244, 63, 94, 0.13); border: 1px solid rgba(244, 63, 94, 0.34); }
      .tge-prompt-purple { background: rgba(168, 85, 247, 0.14); border: 1px solid rgba(168, 85, 247, 0.35); }
      .tge-prompt-amber { background: rgba(245, 158, 11, 0.13); border: 1px solid rgba(245, 158, 11, 0.34); }
      .tge-prompt-emerald {
        background: rgba(16, 185, 129, 0.13);
        border: 1px solid rgba(16, 185, 129, 0.34);
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .tge-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .tge-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .tge-grid-probe { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 14px; }
      .tge-card-dark {
        padding: 14px;
        border-radius: 14px;
        background: rgba(2, 6, 23, 0.84);
        border: 1px solid rgba(255, 255, 255, 0.11);
        min-width: 0;
      }
      .tge-card-soft {
        padding: 14px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.11);
        min-width: 0;
      }
      .tge-btn-primary {
        padding: 10px 18px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(90deg, #4f46e5, #0891b2);
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        font-family: inherit;
        transition: opacity 0.15s ease, transform 0.15s ease;
        text-decoration: none;
      }
      .tge-btn-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
      .tge-btn-primary:disabled { opacity: 0.42; cursor: not-allowed; }
      .tge-btn-emerald {
        padding: 10px 18px;
        border-radius: 12px;
        border: none;
        background: #059669;
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        font-family: inherit;
        flex-shrink: 0;
      }
      .tge-btn-emerald:hover { background: #10b981; }
      .tge-btn-danger {
        padding: 10px 16px;
        border-radius: 12px;
        border: none;
        background: #e11d48;
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        font-family: inherit;
      }
      .tge-btn-danger:hover:not(:disabled) { background: #f43f5e; }
      .tge-btn-danger:disabled { opacity: 0.42; cursor: not-allowed; }
      .tge-btn-ghost {
        padding: 8px 14px;
        border-radius: 11px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(255, 255, 255, 0.06);
        color: #e2e8f0;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: inherit;
        text-decoration: none;
      }
      .tge-btn-ghost:hover { background: rgba(255, 255, 255, 0.13); color: #ffffff; }
      .tge-pill-opt {
        padding: 7px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(255, 255, 255, 0.05);
        color: #cbd5e1;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        max-width: 100%;
        white-space: normal;
        text-align: left;
      }
      .tge-pill-opt:hover:not(:disabled) { background: rgba(255, 255, 255, 0.12); color: #fff; }
      .tge-pill-opt.is-active {
        background: #4f46e5;
        border-color: #818cf8;
        color: #ffffff;
        box-shadow: 0 0 14px rgba(79, 70, 229, 0.45);
      }
      .tge-range {
        width: 100%;
        height: 6px;
        accent-color: #22d3ee;
        cursor: pointer;
      }
      .tge-defect-wrap {
        border-radius: 16px;
        background: rgba(2, 6, 23, 0.72);
        border: 1px solid rgba(255, 255, 255, 0.12);
        overflow: hidden;
      }
      .tge-defect-bar {
        padding: 9px 14px;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 11px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        color: #94a3b8;
      }
      .tge-defect-dots { display: inline-flex; align-items: center; gap: 6px; color: #e2e8f0; font-weight: 700; }
      .tge-dot-w { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
      .tge-defect-list { padding: 12px; display: flex; flex-direction: column; gap: 9px; }
      .tge-defect-row {
        width: 100%;
        text-align: left;
        padding: 12px 14px;
        border-radius: 13px;
        border: 1px solid rgba(255, 255, 255, 0.11);
        background: rgba(15, 23, 42, 0.85);
        color: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        cursor: pointer;
        font-family: inherit;
        transition: border-color 0.15s ease;
      }
      .tge-defect-row:hover:not(:disabled) { border-color: rgba(34, 211, 238, 0.55); }
      .tge-defect-row.is-fixed { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.5); cursor: default; }
      .tge-defect-row.is-norm { background: rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.32); opacity: 0.65; cursor: default; }
      .tge-code-text {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 12px;
        font-weight: 700;
        color: #67e8f9;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .tge-defect-row.is-fixed .tge-code-text { color: #6ee7b7; }
      .tge-sub-label { font-size: 12px; color: #cbd5e1; margin-top: 3px; overflow-wrap: anywhere; }
      .tge-tag {
        padding: 3px 8px;
        border-radius: 7px;
        font-size: 10px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-weight: 700;
        flex-shrink: 0;
        background: rgba(255, 255, 255, 0.06);
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .tge-tag-ok { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.35); }
      .tge-tag-bad { background: rgba(244, 63, 94, 0.18); color: #fda4af; border-color: rgba(244, 63, 94, 0.32); }
      .tge-slot-filled {
        width: 100%;
        padding: 11px 12px;
        border-radius: 11px;
        background: rgba(79, 70, 229, 0.26);
        border: 1px solid rgba(129, 140, 248, 0.55);
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        cursor: pointer;
        text-align: left;
        overflow-wrap: anywhere;
      }
      .tge-slot-empty {
        padding: 11px 12px;
        border-radius: 11px;
        background: rgba(2, 6, 23, 0.55);
        border: 1px dashed rgba(255, 255, 255, 0.22);
        color: #64748b;
        font-size: 12px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tge-chip-btn {
        padding: 8px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.09);
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        cursor: pointer;
        text-align: left;
        max-width: 100%;
        white-space: normal;
        overflow-wrap: anywhere;
      }
      .tge-chip-btn:hover:not(:disabled) { background: rgba(79, 70, 229, 0.32); border-color: #818cf8; }
      .tge-chip-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .tge-probe-point {
        padding: 11px 12px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.11);
        background: rgba(2, 6, 23, 0.84);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-width: 0;
      }
      .tge-probe-point.is-selected { background: rgba(245, 158, 11, 0.14); border-color: rgba(251, 191, 36, 0.55); }
      .tge-probe-point.is-bad { background: rgba(244, 63, 94, 0.09); border-color: rgba(244, 63, 94, 0.3); opacity: 0.62; }
      .tge-probe-point.is-won { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.5); }
      .tge-probe-lcd {
        margin-top: 10px;
        padding: 14px;
        border-radius: 12px;
        background: #071318;
        border: 1px solid rgba(6, 182, 212, 0.42);
        text-align: center;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
      }
      .tge-probe-val { font-size: 24px; font-weight: 900; color: #67e8f9; overflow-wrap: anywhere; }
      .tge-quest-choice {
        width: 100%;
        text-align: left;
        padding: 13px 15px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.05);
        color: #e2e8f0;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s ease;
        overflow-wrap: anywhere;
      }
      .tge-quest-choice:hover:not(:disabled) { background: rgba(79, 70, 229, 0.22); border-color: #818cf8; }
      .tge-quest-choice.is-right { background: rgba(16, 185, 129, 0.18); border-color: rgba(16, 185, 129, 0.5); color: #d1fae5; }
      .tge-quest-choice.is-bad { background: rgba(244, 63, 94, 0.09); border-color: rgba(244, 63, 94, 0.3); color: #94a3b8; opacity: 0.68; }
      .tge-bin {
        padding: 13px;
        border-radius: 14px;
        border: 1px solid rgba(99, 102, 241, 0.42);
        background: rgba(79, 70, 229, 0.18);
        color: #c7d2fe;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        font-family: inherit;
        transition: transform 0.12s ease;
        overflow-wrap: anywhere;
      }
      .tge-bin:hover { transform: translateY(-1px); }
      .tge-bin-emerald { background: rgba(16, 185, 129, 0.18); border-color: rgba(16, 185, 129, 0.42); color: #a7f3d0; }
      .tge-bin-rose { background: rgba(244, 63, 94, 0.18); border-color: rgba(244, 63, 94, 0.42); color: #fecdd3; }
      .tge-bin-cyan { background: rgba(6, 182, 212, 0.18); border-color: rgba(6, 182, 212, 0.42); color: #a5f3fc; }
      .tge-bin-amber { background: rgba(245, 158, 11, 0.18); border-color: rgba(245, 158, 11, 0.42); color: #fde68a; }
      .tge-feedback {
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid transparent;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .tge-feedback-ok { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.42); color: #d1fae5; }
      .tge-feedback-bad { background: rgba(244, 63, 94, 0.15); border-color: rgba(244, 63, 94, 0.42); color: #ffe4e6; }
      .tge-rule-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        max-width: 640px;
        text-align: left;
      }
      .tge-rule-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 11px 13px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.11);
        font-size: 12px;
        color: #e2e8f0;
        line-height: 1.45;
      }
      .tge-rule-num {
        width: 22px;
        height: 22px;
        border-radius: 7px;
        background: rgba(16, 185, 129, 0.22);
        color: #6ee7b7;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      @media (max-width: 720px) {
        .tge-shell { padding: 14px; gap: 12px; border-radius: 16px; }
        .tge-grid-2, .tge-grid-3, .tge-grid-probe { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function playTone(kind) {
    try {
      if (window.EduSpace && typeof window.EduSpace.playUiTone === 'function') {
        window.EduSpace.playUiTone(kind);
      }
    } catch (e) {}
  }

  function buildFallbackGame(title, chunks, summary) {
    const clean = (title || 'Учебная тема').replace(/^Урок\s*\d+\.\s*/i, '');
    const c0 = (chunks && chunks[0]) || { heading: 'Основы темы', text: summary || 'Соблюдайте технологический регламент.', callout: { text: 'Контроль допусков обязателен на каждом шаге.' } };
    const c1 = (chunks && chunks[1]) || { heading: 'Контроль качества', text: 'Проверяйте параметры перед сдачей результата.', callout: { text: 'Сверяйте показатели с отраслевым стандартом.' } };
    return {
      title: `Практикум: ${clean.slice(0, 52)}`,
      instrument: 'SkillHub Lab',
      mechanic: 'workshop_quest',
      badge: 'Интерактивный квест темы',
      brief: `Освойте ключевые принципы «${clean.slice(0, 48)}» через 3 практические ситуации.`,
      rounds: [
        {
          mechanic: 'workshop_quest',
          ticketId: 'STAGE-01',
          speaker: 'Наставник смены',
          telemetry: [{ label: 'Статус', val: 'Изучение базы', bad: false }],
          situation: `${c0.heading}: ${(c0.text || '').slice(0, 140)} Какой подход гарантирует корректный старт?`,
          choices: [
            { id: 'a', text: 'Действовать по нормативу и проверить исходные параметры до запуска', outcome: 'Верно! Подготовка и проверка допусков исключают брак.' },
            { id: 'b', text: 'Пропустить замеры и сразу перейти к финальной сборке наугад', outcome: 'Без сверки с нормами ошибка проявится на итоговой проверке.' },
            { id: 'c', text: 'Игнорировать требования инструментария', outcome: 'Нарушение технологии приводит к отказу системы.' }
          ],
          correctId: 'a',
          hint: (c0.callout && c0.callout.text) || 'Всегда начинайте с проверки исходных условий.',
          winRule: (c0.callout && c0.callout.text) || c0.heading
        },
        {
          mechanic: 'defect_inspector',
          prompt: `Найдите технологическое нарушение по теме «${clean.slice(0, 38)}»:`,
          artifactTitle: 'Чек-лист контроля процесса',
          items: [
            { id: 'i1', code: 'STEP_01: Проверка допуска', label: 'Инструмент откалиброван по норме', status: 'OK' },
            { id: 'i2', code: 'STEP_02: Рабочий режим', label: 'Отказ от соблюдения регламента ради скорости', status: 'ERR' },
            { id: 'i3', code: 'STEP_03: Безопасность', label: 'Защитные меры активированы', status: 'OK' },
            { id: 'i4', code: 'STEP_04: Фиксация', label: 'Результаты замеров записаны в журнал', status: 'OK' }
          ],
          defectId: 'i2',
          fixedCode: 'STEP_02: Строгое следование стандарту качества',
          hint: 'Ищите пункт, где скорость ставится выше технологии.',
          winRule: c1.text ? c1.text.slice(0, 140) : 'Соблюдение регламента обеспечивает надёжный результат.',
          failReasons: {
            i1: 'Калибровка инструмента перед работой — правильный шаг.',
            i3: 'Меры безопасности соблюдены корректно.',
            i4: 'Фиксация результатов замеров обязательна.'
          }
        },
        {
          mechanic: 'workshop_quest',
          ticketId: 'STAGE-03',
          speaker: 'Контроль качества',
          telemetry: [{ label: 'Финал', val: 'Сдача этапа', bad: false }],
          situation: `${c1.heading}: Финальная приёмка работы. Что нужно проверить перед сдачей?`,
          choices: [
            { id: 'x', text: 'Сдать работу без финального теста и без проверки параметров', outcome: 'Работа возвращена на доработку!' },
            { id: 'y', text: 'Провести выходной контроль по критериям качества и подтвердить результат', outcome: 'Отлично! Работа соответствует промышленным стандартам.' }
          ],
          correctId: 'y',
          hint: 'Финальный контроль подтверждает готовность результата.',
          winRule: (c1.callout && c1.callout.text) || 'Выходной контроль гарантирует соответствие всем требованиям ТЗ.'
        }
      ]
    };
  }

  function resolveGameData(spec, taskNum, initialGame, title, chunks, summary) {
    if (initialGame && Array.isArray(initialGame.rounds) && initialGame.rounds.length >= 1) {
      return initialGame;
    }
    const catalog = window.EDU_TOPIC_GAMES || {};
    const specMap = catalog[spec] || catalog[spec === 'design' ? 'graphic_design' : spec];
    if (specMap && specMap[String(taskNum)]) {
      return specMap[String(taskNum)];
    }
    return buildFallbackGame(title, chunks, summary);
  }

  function initRoundState(round, gameMechanic) {
    const mech = round.mechanic || gameMechanic;
    const st = {
      mechanic: mech,
      solved: false,
      feedback: null,
      showHint: false
    };

    if (mech === 'bench_tuner') {
      st.vals = {};
      (round.controls || []).forEach(c => {
        st.vals[c.id] = c.init !== undefined ? c.init : (c.kind === 'range' ? c.min : (c.options ? c.options[0] : ''));
      });
    } else if (mech === 'defect_inspector') {
      st.triedBad = [];
      st.fixed = false;
    } else if (mech === 'code_or_formula_builder') {
      st.slots = [];
    } else if (mech === 'probe_diagnostic') {
      st.probedId = (round.points && round.points[0]) ? round.points[0].id : null;
      st.triedBad = [];
    } else if (mech === 'workshop_quest') {
      st.triedBad = [];
    } else if (mech === 'triage_radar') {
      st.cardIdx = 0;
      st.cardFeedback = null;
      st.cardsSolved = 0;
    }
    return st;
  }

  function getStars(mistakes) {
    if (mistakes === 0) return 3;
    if (mistakes <= 2) return 2;
    return 1;
  }

  function mount(opts) {
    injectStyles();
    const containerId = opts.containerId;
    const container = document.getElementById(containerId);
    if (!container) return null;

    const spec = opts.spec || 'it';
    const taskNum = Number(opts.taskNum) || 1;
    const rawGame = resolveGameData(spec, taskNum, opts.initialGame, opts.title, opts.chunks, opts.summary);
    const singlePreview = Boolean(opts.singleRoundPreview);
    const rounds = singlePreview && rawGame.rounds && rawGame.rounds.length > 0
      ? [rawGame.rounds[0]]
      : (rawGame.rounds || []);
    const game = singlePreview ? Object.assign({}, rawGame, { rounds: rounds }) : rawGame;

    const saved = opts.savedState || {};
    const alreadyDone = Boolean(opts.alreadyCompleted || (saved && (saved.game_completed || saved.gameCompleted)));

    const inst = {
      id: containerId,
      container: container,
      spec: spec,
      taskNum: taskNum,
      game: game,
      singleRoundPreview: singlePreview,
      compact: Boolean(opts.compact || singlePreview),
      fullLessonUrl: opts.fullLessonUrl || '',
      roundIdx: 0,
      lives: 3,
      combo: 1,
      maxCombo: 1,
      score: alreadyDone ? (saved.score || 250) : 0,
      mistakes: alreadyDone ? (saved.mistakes || 0) : 0,
      completed: alreadyDone,
      showingVictory: alreadyDone && !singlePreview,
      learnedRules: rounds.map(r => r.winRule).filter(Boolean),
      onComplete: opts.onComplete || function () {},
      onStateChange: opts.onStateChange || function () {},
      roundState: null
    };

    if (rounds.length > 0) {
      inst.roundState = initRoundState(rounds[0], game.mechanic);
    }

    instances[containerId] = inst;
    render(inst);
    return inst;
  }

  function render(inst) {
    const el = document.getElementById(inst.id);
    if (!el) return;
    inst.container = el;

    const game = inst.game;
    const rounds = game.rounds || [];
    const totalRounds = rounds.length || 1;

    if (inst.showingVictory) {
      el.innerHTML = renderVictoryView(inst);
      return;
    }

    const r = rounds[inst.roundIdx];
    if (!r) return;
    const rSt = inst.roundState;
    const mech = rSt.mechanic;

    const heartsHtml = [0, 1, 2].map(i => `
      <span class="${i < inst.lives ? 'tge-heart-on' : 'tge-heart-off'}">${svgIcon(i < inst.lives ? 'heart_on' : 'heart_off', 16)}</span>
    `).join('');

    const roundDotsHtml = rounds.map((_, idx) => {
      const done = idx < inst.roundIdx || (idx === inst.roundIdx && rSt.solved);
      const active = idx === inst.roundIdx && !rSt.solved;
      return `<div class="tge-dot ${done ? 'tge-dot-done' : (active ? 'tge-dot-active' : '')}"></div>`;
    }).join('');

    const mechLabels = {
      bench_tuner: { name: 'Стенд настройки', icon: 'tune', cls: 'tge-mech-bench' },
      defect_inspector: { name: 'Поиск дефекта', icon: 'troubleshoot', cls: 'tge-mech-defect' },
      code_or_formula_builder: { name: 'Сборка узла', icon: 'construction', cls: 'tge-mech-builder' },
      probe_diagnostic: { name: 'Приборный замер', icon: 'sensors', cls: 'tge-mech-probe' },
      workshop_quest: { name: 'Кейс на смене', icon: 'forum', cls: 'tge-mech-quest' },
      triage_radar: { name: 'Блиц-сортировка', icon: 'bolt', cls: 'tge-mech-triage' }
    };
    const ml = mechLabels[mech] || mechLabels.workshop_quest;

    let stageHtml = '';
    if (inst.lives <= 0 && !rSt.solved) {
      stageHtml = `
        <div class="tge-card-dark" style="text-align:center;border-color:rgba(244,63,94,0.45);background:rgba(76,5,25,0.45);display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px;">
          <div style="width:48px;height:48px;border-radius:14px;background:rgba(244,63,94,0.2);border:1px solid rgba(244,63,94,0.4);display:flex;align-items:center;justify-content:center;color:#fb7185;">
            ${svgIcon('heart_broken', 26)}
          </div>
          <div>
            <h4 style="margin:0;font-size:16px;font-weight:800;color:#fff;">Жизни в раунде закончились!</h4>
            <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1;">Не страшно — симулятор нужен для практики. Запомните подсказку и попробуйте ещё раз:</p>
          </div>
          ${r.hint ? `<div class="tge-hint-box" style="width:100%;max-width:480px;"><strong>Подсказка:</strong> ${esc(r.hint)}</div>` : ''}
          <button type="button" onclick="TopicGameEngine.retryRound('${escAttr(inst.id)}')" class="tge-btn-danger">
            ${svgIcon('replay', 16)}
            <span>Восстановить и повторить раунд</span>
          </button>
        </div>
      `;
    } else if (mech === 'bench_tuner') {
      stageHtml = renderBenchTuner(inst, r, rSt);
    } else if (mech === 'defect_inspector') {
      stageHtml = renderDefectInspector(inst, r, rSt);
    } else if (mech === 'code_or_formula_builder') {
      stageHtml = renderBuilder(inst, r, rSt);
    } else if (mech === 'probe_diagnostic') {
      stageHtml = renderProbeDiagnostic(inst, r, rSt);
    } else if (mech === 'workshop_quest') {
      stageHtml = renderWorkshopQuest(inst, r, rSt);
    } else if (mech === 'triage_radar') {
      stageHtml = renderTriageRadar(inst, r, rSt);
    }

    const fb = rSt.feedback;
    const feedbackHtml = fb ? `
      <div class="tge-feedback ${fb.ok ? 'tge-feedback-ok' : 'tge-feedback-bad'}">
        <div style="flex:1 1 220px;min-width:0;">
          <div style="font-size:13px;font-weight:800;display:flex;align-items:center;gap:6px;color:${fb.ok ? '#6ee7b7' : '#fda4af'};">
            ${svgIcon(fb.ok ? 'check' : 'error', 17)}
            <span>${esc(fb.title)}</span>
          </div>
          <p style="margin:5px 0 0;font-size:12px;line-height:1.45;overflow-wrap:anywhere;">${esc(fb.body)}</p>
        </div>
        ${rSt.solved ? `
          <button type="button" id="tge-next-round-btn" onclick="TopicGameEngine.advanceRound('${escAttr(inst.id)}')" class="tge-btn-emerald">
            <span>${inst.roundIdx < totalRounds - 1 ? `Раунд ${inst.roundIdx + 2}/${totalRounds}` : 'Завершить игру'}</span>
            ${svgIcon('arrow', 15)}
          </button>
        ` : ''}
      </div>
    ` : '';

    const roundLabelText = inst.singleRoundPreview
      ? `Демо-раунд 1 (всего 3 раунда в уроке)`
      : `Раунд ${inst.roundIdx + 1} из ${totalRounds}`;

    el.innerHTML = `
      <div class="tge-shell ${inst.compact ? 'tge-compact' : ''}">
        <div class="tge-header">
          <div class="tge-header-meta">
            <div class="tge-badges">
              <span class="tge-mech-badge ${ml.cls}">${svgIcon(ml.icon, 13)} <span>${ml.name}</span></span>
              <span class="tge-inst-badge">${esc(game.instrument || 'Симулятор темы')}</span>
            </div>
            <div class="tge-title">${esc(game.title)}</div>
            ${game.brief ? `<p class="tge-brief">${esc(game.brief)}</p>` : ''}
          </div>
          <div class="tge-hud">
            <div class="tge-pill tge-pill-hearts" title="Жизни в раунде">${heartsHtml}</div>
            <div class="tge-pill tge-pill-combo" id="tge-combo-pill">${svgIcon('fire', 14)} <span>x${inst.combo}</span></div>
            <div class="tge-pill tge-pill-score" id="tge-score-pill">${inst.score} PTS</div>
          </div>
        </div>

        <div class="tge-progress-row">
          <div class="tge-progress-left">
            <span class="tge-round-label" id="tge-round-label">${roundLabelText}</span>
            <div class="tge-dots">${roundDotsHtml}</div>
          </div>
          ${r.hint && !rSt.solved ? `
            <button type="button" onclick="TopicGameEngine.toggleHint('${escAttr(inst.id)}')" class="tge-btn-hint">
              ${svgIcon('tips', 14)}
              <span>${rSt.showHint ? 'Скрыть подсказку' : 'Подсказка'}</span>
            </button>
          ` : ''}
        </div>

        ${rSt.showHint && r.hint ? `
          <div class="tge-hint-box"><strong>Совет наставника:</strong> ${esc(r.hint)}</div>
        ` : ''}

        <div class="tge-stage" id="tge-stage-area">${stageHtml}</div>

        ${feedbackHtml}
      </div>
    `;
  }

  // =========================================================================
  // MECHANIC 1: BENCH TUNER
  // =========================================================================
  function renderBenchPreview(r, vals) {
    const type = r.previewType || 'generic';

    if (type === 'banner_export') {
      const ppi = Number(vals.ppi || 72);
      const fmt = String(vals.fmt || 'WebP');
      const w = Number(vals.width || 1200);
      const estKb = Math.round((w / 1200) * Math.pow(ppi / 72, 2) * (fmt === 'BMP' ? 2100 : (fmt === 'WebP' ? 145 : (fmt === 'PNG' ? 230 : 280))));
      const isHeavy = estKb > 350;
      return `
        <div class="tge-card-dark" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;min-width:0;">
            <div style="width:58px;height:44px;border-radius:10px;background:linear-gradient(135deg,#4f46e5,#06b6d4);display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:11px;font-weight:900;color:#fff;flex-shrink:0;">${w}px</div>
            <div style="min-width:0;">
              <div style="font-weight:700;font-size:13px;color:#fff;overflow-wrap:anywhere;">banner-hero.${fmt.toLowerCase().replace(/[^a-z0-9]/g, '')}</div>
              <div style="font-size:11px;color:#94a3b8;">Плотность: <strong style="color:#67e8f9;font-family:monospace;">${ppi} ppi</strong> • Альфа: ${fmt.includes('PNG') || fmt === 'WebP' ? 'Да' : 'Нет'}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Вес файла</div>
            <div style="font-size:18px;font-weight:900;font-family:monospace;color:${isHeavy ? '#fb7185' : '#34d399'};">${estKb > 1000 ? (estKb / 1024).toFixed(1) + ' MB' : estKb + ' KB'}</div>
          </div>
        </div>
      `;
    }

    if (type === 'flexbox') {
      const disp = vals.display || 'block';
      const just = vals.justify || 'flex-start';
      const align = vals.align || 'stretch';
      const gap = Number(vals.gap !== undefined ? vals.gap : 8);
      return `
        <div class="tge-card-dark" style="display:flex;flex-direction:column;gap:10px;border-color:rgba(99,102,241,0.34);">
          <div style="font-family:monospace;font-size:11px;color:#67e8f9;background:rgba(0,0,0,0.45);padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);overflow-x:auto;">
            header { display: ${esc(disp)}; justify-content: ${esc(just)}; align-items: ${esc(align)}; gap: ${gap}px; }
          </div>
          <div style="min-height:68px;padding:10px;border-radius:10px;background:#0f172a;border:1px dashed rgba(129,140,248,0.5);display:${esc(disp)};justify-content:${esc(just)};align-items:${esc(align)};gap:${gap}px;">
            <div style="padding:6px 10px;border-radius:7px;background:#4f46e5;color:#fff;font-weight:800;font-size:11px;">LOGO</div>
            <div style="padding:6px 10px;border-radius:7px;background:#334155;color:#e2e8f0;font-weight:700;font-size:11px;">Курсы</div>
            <div style="padding:6px 10px;border-radius:7px;background:#059669;color:#fff;font-weight:700;font-size:11px;">Войти</div>
          </div>
        </div>
      `;
    }

    if (type === 'ohm_wire') {
      const power = Number(vals.power || 180);
      const sec = Number(vals.section || 0.75);
      const curr = power / 12;
      const drop = (curr * 2 * 0.0175 * 4) / Math.max(0.25, sec);
      const overheat = sec < (curr / 10);
      return `
        <div class="tge-grid-3">
          <div class="tge-card-dark" style="text-align:center;">
            <div style="font-size:10px;color:#94a3b8;">Ток (I = P/U)</div>
            <div style="font-size:18px;font-weight:900;font-family:monospace;color:#fcd34d;margin-top:4px;">${curr.toFixed(1)} A</div>
          </div>
          <div class="tge-card-dark" style="text-align:center;">
            <div style="font-size:10px;color:#94a3b8;">Падение dU на 4м</div>
            <div style="font-size:18px;font-weight:900;font-family:monospace;color:${drop > 0.5 ? '#fb7185' : '#34d399'};margin-top:4px;">${drop.toFixed(2)} V</div>
          </div>
          <div class="tge-card-dark" style="text-align:center;">
            <div style="font-size:10px;color:#94a3b8;">Жила ${sec} мм²</div>
            <div style="font-size:12px;font-weight:900;color:${overheat ? '#fb7185' : '#34d399'};margin-top:7px;">${overheat ? 'ПЕРЕГРЕВ!' : 'НОРМА'}</div>
          </div>
        </div>
      `;
    }

    const keys = Object.keys(vals);
    return `
      <div class="tge-card-dark" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px;">
        ${keys.map(k => {
          const ctrl = (r.controls || []).find(c => c.id === k);
          return `
            <div style="padding:9px 11px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;">
              <span style="font-size:11px;color:#94a3b8;font-weight:600;overflow-wrap:anywhere;">${esc(ctrl ? ctrl.label : k)}</span>
              <span style="font-size:13px;font-weight:900;font-family:monospace;color:#67e8f9;flex-shrink:0;">${esc(vals[k])}${esc(ctrl && ctrl.unit ? ctrl.unit : '')}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderBenchTuner(inst, r, rSt) {
    const controls = r.controls || [];
    const controlsHtml = controls.map(c => {
      const curVal = rSt.vals[c.id];
      if (c.kind === 'pills') {
        const btns = (c.options || []).map(opt => {
          const active = String(curVal) === String(opt);
          return `<button type="button" ${rSt.solved ? 'disabled' : ''} onclick="TopicGameEngine.setBenchVal('${escAttr(inst.id)}','${escAttr(c.id)}','${escAttr(opt)}')" class="tge-pill-opt ${active ? 'is-active' : ''}">${esc(opt)}</button>`;
        }).join('');
        return `
          <div class="tge-card-soft" style="display:flex;flex-direction:column;gap:9px;">
            <div style="font-size:12px;font-weight:700;color:#e2e8f0;">${esc(c.label)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:7px;">${btns}</div>
          </div>
        `;
      }
      return `
        <div class="tge-card-soft" style="display:flex;flex-direction:column;gap:9px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;">
            <span style="font-weight:700;color:#e2e8f0;">${esc(c.label)}</span>
            <span style="font-family:monospace;font-weight:900;color:#67e8f9;font-size:14px;" id="tge-range-lbl-${esc(c.id)}">${esc(curVal)}${esc(c.unit || '')}</span>
          </div>
          <input type="range" aria-label="${escAttr(c.label)}" ${rSt.solved ? 'disabled' : ''} min="${c.min}" max="${c.max}" step="${c.step || 1}" value="${curVal}" oninput="TopicGameEngine.setBenchRange('${escAttr(inst.id)}','${escAttr(c.id)}',this.value)" class="tge-range" />
        </div>
      `;
    }).join('');

    return `
      <div class="tge-prompt tge-prompt-indigo">${esc(r.prompt)}</div>
      <div id="tge-bench-preview">${renderBenchPreview(r, rSt.vals)}</div>
      <div class="tge-grid-2">${controlsHtml}</div>
      ${!rSt.solved ? `
        <div style="display:flex;justify-content:flex-end;">
          <button type="button" id="tge-bench-submit" onclick="TopicGameEngine.checkBench('${escAttr(inst.id)}')" class="tge-btn-primary">
            ${svgIcon('check', 16)}
            <span>Применить настройку</span>
          </button>
        </div>
      ` : ''}
    `;
  }

  // =========================================================================
  // MECHANIC 2: DEFECT INSPECTOR
  // =========================================================================
  function renderDefectInspector(inst, r, rSt) {
    const itemsHtml = (r.items || []).map(it => {
      const isBadTried = rSt.triedBad.includes(it.id);
      const isFixedTarget = rSt.fixed && it.id === r.defectId;
      let cls = '';
      let tag = '<span class="tge-tag">Проверить</span>';
      if (isFixedTarget) {
        cls = 'is-fixed';
        tag = '<span class="tge-tag tge-tag-ok">ИСПРАВЛЕНО ✓</span>';
      } else if (isBadTried) {
        cls = 'is-norm';
        tag = '<span class="tge-tag tge-tag-bad">НОРМА</span>';
      }

      return `
        <button type="button" ${rSt.solved || isBadTried ? 'disabled' : ''} onclick="TopicGameEngine.inspectItem('${escAttr(inst.id)}','${escAttr(it.id)}')" class="tge-defect-row ${cls}">
          <div style="min-width:0;flex:1;">
            <div class="tge-code-text">${isFixedTarget && r.fixedCode ? esc(r.fixedCode) : esc(it.code)}</div>
            <div class="tge-sub-label">${esc(it.label)}</div>
          </div>
          ${tag}
        </button>
      `;
    }).join('');

    return `
      <div class="tge-prompt tge-prompt-rose">${esc(r.prompt)}</div>
      <div class="tge-defect-wrap">
        <div class="tge-defect-bar">
          <span class="tge-defect-dots">
            <span class="tge-dot-w" style="background:#f43f5e;"></span>
            <span class="tge-dot-w" style="background:#f59e0b;"></span>
            <span class="tge-dot-w" style="background:#10b981;"></span>
            <span style="margin-left:4px;">${esc(r.artifactTitle || 'Объект инспекции')}</span>
          </span>
          <span>Нажмите на строку с ошибкой</span>
        </div>
        <div class="tge-defect-list">${itemsHtml}</div>
      </div>
    `;
  }

  // =========================================================================
  // MECHANIC 3: INTERACTIVE BUILDER
  // =========================================================================
  function renderBuilder(inst, r, rSt) {
    const slotsCount = (r.correctOrder || []).length || 3;
    const chips = r.chips || [];

    const slotsHtml = Array.from({ length: slotsCount }).map((_, idx) => {
      const chipId = rSt.slots[idx];
      const chip = chips.find(c => c.id === chipId);
      if (chip) {
        return `
          <button type="button" ${rSt.solved ? 'disabled' : ''} onclick="TopicGameEngine.removeBuilderSlot('${escAttr(inst.id)}',${idx})" class="tge-slot-filled">
            <span style="color:#a5b4fc;flex-shrink:0;">#${idx + 1}</span>
            <span style="flex:1;">${esc(chip.text)}</span>
            ${!rSt.solved ? svgIcon('close', 14) : ''}
          </button>
        `;
      }
      return `
        <div class="tge-slot-empty">
          <span>#${idx + 1}</span>
          <span>Нажмите на блок справа...</span>
        </div>
      `;
    }).join('');

    const availableHtml = chips.map(ch => {
      const used = rSt.slots.includes(ch.id);
      return `
        <button type="button" ${used || rSt.solved ? 'disabled' : ''} onclick="TopicGameEngine.addBuilderChip('${escAttr(inst.id)}','${escAttr(ch.id)}')" class="tge-chip-btn">
          + ${esc(ch.text)}
        </button>
      `;
    }).join('');

    const allFilled = rSt.slots.length === slotsCount;

    return `
      <div class="tge-prompt tge-prompt-purple">${esc(r.prompt)}</div>
      <div class="tge-grid-2">
        <div class="tge-card-dark" style="display:flex;flex-direction:column;gap:9px;">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#a5b4fc;display:flex;justify-content:space-between;">
            <span>Собранная последовательность</span>
            <span style="font-family:monospace;">${rSt.slots.length}/${slotsCount}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">${slotsHtml}</div>
        </div>
        <div class="tge-card-soft" style="display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
          <div>
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#cbd5e1;margin-bottom:9px;">Доступные шаги / модули:</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">${availableHtml}</div>
          </div>
          ${!rSt.solved ? `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);">
              <button type="button" onclick="TopicGameEngine.clearBuilder('${escAttr(inst.id)}')" class="tge-btn-ghost">Сбросить</button>
              <button type="button" id="tge-builder-submit" ${allFilled ? '' : 'disabled'} onclick="TopicGameEngine.checkBuilder('${escAttr(inst.id)}')" class="tge-btn-primary">
                ${svgIcon('play', 14)}
                <span>Проверить сборку</span>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // MECHANIC 4: PROBE DIAGNOSTIC
  // =========================================================================
  function renderProbeDiagnostic(inst, r, rSt) {
    const pts = r.points || [];
    const activePt = pts.find(p => p.id === rSt.probedId) || pts[0];

    const ptsHtml = pts.map(p => {
      const isSelected = activePt && activePt.id === p.id;
      const isBad = rSt.triedBad.includes(p.id);
      const isWon = rSt.solved && p.id === r.faultId;
      const stCls = isWon ? 'is-won' : (isBad ? 'is-bad' : (isSelected ? 'is-selected' : ''));
      return `
        <div class="tge-probe-point ${stCls}">
          <div style="min-width:0;flex:1;">
            <div style="font-size:12px;font-weight:700;color:#fff;overflow-wrap:anywhere;">${esc(p.name || p.label)}</div>
            <div style="font-size:10px;font-family:monospace;color:#94a3b8;">${esc(p.pin || p.id)}</div>
          </div>
          <button type="button" onclick="TopicGameEngine.probePoint('${escAttr(inst.id)}','${escAttr(p.id)}')" class="tge-pill-opt ${isSelected ? 'is-active' : ''}" style="${isSelected ? 'background:#f59e0b;border-color:#fbbf24;color:#0f172a;' : ''}">
            ${isSelected ? 'Щуп тут' : 'Замерить'}
          </button>
        </div>
      `;
    }).join('');

    return `
      <div class="tge-prompt tge-prompt-amber">${esc(r.prompt)}</div>
      <div class="tge-grid-probe">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0;">${ptsHtml}</div>
        <div class="tge-card-dark" style="border-color:rgba(6,182,212,0.34);display:flex;flex-direction:column;justify-content:space-between;gap:14px;">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px;font-family:monospace;font-weight:700;color:#94a3b8;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);">
              <span>${esc(r.meterName || r.circuitTitle || 'DIGITAL PROBE')}</span>
              <span style="color:#34d399;">LIVE</span>
            </div>
            <div class="tge-probe-lcd">
              <div style="font-size:10px;color:rgba(103,232,249,0.85);margin-bottom:4px;overflow-wrap:anywhere;">${activePt ? esc(activePt.name || activePt.label) : 'Выберите точку'}</div>
              <div class="tge-probe-val" id="tge-meter-val">${activePt ? esc(activePt.reading + (activePt.unit ? ' ' + activePt.unit : '')) : '---'}</div>
              <div style="font-size:10px;color:#94a3b8;margin-top:6px;">${esc(r.normalSpec || '')}</div>
            </div>
            ${activePt && activePt.meterNote ? `<div style="margin-top:10px;font-size:11px;color:#cbd5e1;line-height:1.4;background:rgba(255,255,255,0.05);padding:9px 11px;border-radius:10px;">${esc(activePt.meterNote)}</div>` : ''}
          </div>
          ${!rSt.solved && activePt ? `
            <button type="button" id="tge-probe-condemn-btn" ${rSt.triedBad.includes(activePt.id) ? 'disabled' : ''} onclick="TopicGameEngine.condemnPoint('${escAttr(inst.id)}','${escAttr(activePt.id)}')" class="tge-btn-danger" style="width:100%;">
              ${svgIcon('warning', 15)}
              <span>Неисправен этот узел!</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // MECHANIC 5: WORKSHOP QUEST
  // =========================================================================
  function renderWorkshopQuest(inst, r, rSt) {
    const teleHtml = (r.telemetry || []).map(t => `
      <span style="padding:3px 9px;border-radius:8px;font-size:11px;font-family:monospace;font-weight:700;border:1px solid ${t.bad ? 'rgba(244,63,94,0.38)' : 'rgba(16,185,129,0.38)'};background:${t.bad ? 'rgba(244,63,94,0.14)' : 'rgba(16,185,129,0.14)'};color:${t.bad ? '#fda4af' : '#6ee7b7'};">
        ${esc(t.label)}: ${esc(t.val)}
      </span>
    `).join('');

    const choicesHtml = (r.choices || []).map(ch => {
      const triedBad = rSt.triedBad.includes(ch.id);
      const isRight = rSt.solved && ch.id === r.correctId;
      const stCls = isRight ? 'is-right' : (triedBad ? 'is-bad' : '');
      const iconName = isRight ? 'check' : (triedBad ? 'cancel' : 'arrow');
      return `
        <button type="button" ${rSt.solved || triedBad ? 'disabled' : ''} onclick="TopicGameEngine.pickQuestChoice('${escAttr(inst.id)}','${escAttr(ch.id)}')" class="tge-quest-choice ${stCls}">
          <span style="min-width:0;">${esc(ch.text || ch.label)}</span>
          <span style="color:${isRight ? '#34d399' : (triedBad ? '#fb7185' : '#818cf8')};display:inline-flex;flex-shrink:0;">${svgIcon(iconName, 17)}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="tge-card-dark" style="border-color:rgba(99,102,241,0.34);display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;">
          <div style="display:flex;align-items:center;gap:7px;font-size:12px;font-weight:800;color:#a5b4fc;">
            ${svgIcon('assignment', 16)}
            <span>${esc(r.ticketId || 'ЗАДАНИЕ')} • ${esc(r.speaker || 'Мастер')}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">${teleHtml}</div>
        </div>
        <p style="margin:0;font-size:13px;font-weight:700;color:#fff;line-height:1.5;overflow-wrap:anywhere;">${esc(r.situation)}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px;">${choicesHtml}</div>
    `;
  }

  // =========================================================================
  // MECHANIC 6: TRIAGE RADAR
  // =========================================================================
  function renderTriageRadar(inst, r, rSt) {
    const cards = r.cards || [];
    const cur = cards[rSt.cardIdx];
    const bins = r.bins || [
      { id: 'ok', label: '✓ В норме / Стандарт', color: 'emerald' },
      { id: 'bad', label: '✗ Брак / Исправить', color: 'rose' }
    ];

    if (rSt.solved || !cur) {
      return `
        <div class="tge-card-dark" style="background:rgba(16,185,129,0.14);border-color:rgba(16,185,129,0.36);text-align:center;">
          <div style="color:#6ee7b7;font-weight:800;font-size:14px;">Все ${cards.length} образца волны рассортированы!</div>
        </div>
      `;
    }

    const binsHtml = bins.map(b => {
      const clsMap = { emerald: 'tge-bin-emerald', rose: 'tge-bin-rose', cyan: 'tge-bin-cyan', amber: 'tge-bin-amber' };
      return `
        <button type="button" onclick="TopicGameEngine.sortTriageCard('${escAttr(inst.id)}','${escAttr(b.id)}')" class="tge-bin ${clsMap[b.color] || ''}">
          ${esc(b.label)}
        </button>
      `;
    }).join('');

    return `
      <div class="tge-prompt tge-prompt-emerald">
        <span>${esc(r.prompt)}</span>
        <span style="padding:4px 9px;border-radius:8px;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.12);font-family:monospace;font-size:11px;color:#67e8f9;">Карточка ${rSt.cardIdx + 1}/${cards.length}</span>
      </div>
      <div class="tge-card-dark" style="text-align:center;padding:20px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;color:#a5b4fc;">${esc(cur.tag || 'Образец')}</div>
        <div style="font-size:16px;font-weight:800;color:#fff;font-family:monospace;margin-top:7px;overflow-wrap:anywhere;">${esc(cur.specimen)}</div>
        ${cur.context ? `<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">${esc(cur.context)}</p>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;">${binsHtml}</div>
      ${rSt.cardFeedback ? `
        <div class="tge-feedback ${rSt.cardFeedback.ok ? 'tge-feedback-ok' : 'tge-feedback-bad'}" style="padding:10px 13px;font-size:12px;">
          <span><strong>${rSt.cardFeedback.ok ? '✓ Точно!' : '✗ Промах!'}</strong> ${esc(rSt.cardFeedback.rule)}</span>
        </div>
      ` : ''}
    `;
  }

  // =========================================================================
  // VICTORY VIEW
  // =========================================================================
  function renderVictoryView(inst) {
    const stars = getStars(inst.mistakes);
    const starsHtml = [1, 2, 3].map(s => `
      <span style="color:${s <= stars ? '#fbbf24' : '#334155'};display:inline-flex;">${svgIcon('star', 28)}</span>
    `).join('');

    const takeawaysHtml = (inst.learnedRules || []).map((rule, idx) => `
      <li class="tge-rule-item">
        <span class="tge-rule-num">${idx + 1}</span>
        <span>${esc(rule)}</span>
      </li>
    `).join('');

    const fullCta = inst.singleRoundPreview && inst.fullLessonUrl
      ? `<a href="${escAttr(inst.fullLessonUrl)}" class="tge-btn-primary">Открыть все 3 раунда урока →</a>`
      : '';

    return `
      <div class="tge-shell tge-victory ${inst.compact ? 'tge-compact' : ''}">
        <div style="display:flex;align-items:center;justify-content:center;gap:4px;">${starsHtml}</div>
        <div>
          <span class="tge-mech-badge tge-mech-triage">
            ${inst.singleRoundPreview ? 'Демо-раунд пройден ✓' : 'Тема освоена в симуляторе ✓'}
          </span>
          <div class="tge-title" style="font-size:20px;margin-top:10px;">${esc(inst.game.title)}</div>
          <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1;">Набрано <strong style="color:#67e8f9;font-family:monospace;">${inst.score} PTS</strong> • Макс. комбо <strong style="color:#fcd34d;font-family:monospace;">x${inst.maxCombo}</strong> • Награда <strong style="color:#6ee7b7;font-family:monospace;">+25 XP</strong></p>
        </div>
        ${takeawaysHtml ? `
          <div style="width:100%;max-width:640px;text-align:left;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:8px;">Закреплённые правила темы:</div>
            <ul class="tge-rule-list">${takeawaysHtml}</ul>
          </div>
        ` : ''}
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;padding-top:4px;">
          ${fullCta}
          <button type="button" onclick="TopicGameEngine.replayGame('${escAttr(inst.id)}')" class="tge-btn-ghost">
            ${svgIcon('replay', 15)}
            <span>Переиграть заново</span>
          </button>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // GAMEPLAY HANDLERS
  // =========================================================================
  function awardWin(inst, r, basePts) {
    const rSt = inst.roundState;
    rSt.solved = true;
    const gained = (basePts || 75) * inst.combo;
    inst.score += gained;
    inst.combo = Math.min(3, inst.combo + 1);
    inst.maxCombo = Math.max(inst.maxCombo, inst.combo);
    rSt.feedback = {
      ok: true,
      title: `Раунд пройден! +${gained} PTS`,
      body: r.winRule || 'Отличное знание производственного стандарта.'
    };
    playTone('success');
    inst.onStateChange({ score: inst.score, roundIdx: inst.roundIdx, completed: inst.completed });
  }

  function penalize(inst, title, reasonBody) {
    inst.lives = Math.max(0, inst.lives - 1);
    inst.combo = 1;
    inst.mistakes += 1;
    inst.roundState.feedback = {
      ok: false,
      title: title || 'Несоответствие стандарту (-1 ♥)',
      body: reasonBody || 'Проверьте допуски или откройте подсказку наставника.'
    };
    playTone('error');
  }

  return {
    mount: mount,

    getState: function (id) {
      return instances[id] || null;
    },

    toggleHint: function (id) {
      const inst = instances[id];
      if (!inst) return;
      inst.roundState.showHint = !inst.roundState.showHint;
      render(inst);
    },

    retryRound: function (id) {
      const inst = instances[id];
      if (!inst) return;
      inst.lives = 3;
      inst.combo = 1;
      inst.roundState = initRoundState(inst.game.rounds[inst.roundIdx], inst.game.mechanic);
      render(inst);
    },

    replayGame: function (id) {
      const inst = instances[id];
      if (!inst) return;
      inst.roundIdx = 0;
      inst.lives = 3;
      inst.combo = 1;
      inst.maxCombo = 1;
      inst.score = 0;
      inst.mistakes = 0;
      inst.showingVictory = false;
      inst.roundState = initRoundState(inst.game.rounds[0], inst.game.mechanic);
      render(inst);
    },

    advanceRound: function (id) {
      const inst = instances[id];
      if (!inst) return;
      const rounds = inst.game.rounds || [];
      if (inst.roundIdx < rounds.length - 1) {
        inst.roundIdx += 1;
        inst.lives = 3;
        inst.roundState = initRoundState(rounds[inst.roundIdx], inst.game.mechanic);
        render(inst);
      } else {
        inst.completed = true;
        inst.showingVictory = true;
        render(inst);
        inst.onComplete({
          game_completed: true,
          score: inst.score,
          stars: getStars(inst.mistakes),
          maxCombo: inst.maxCombo,
          mistakes: inst.mistakes
        });
      }
    },

    setBenchVal: function (id, ctrlId, val) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      inst.roundState.vals[ctrlId] = val;
      render(inst);
    },

    setBenchRange: function (id, ctrlId, val) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      inst.roundState.vals[ctrlId] = Number(val);
      const r = inst.game.rounds[inst.roundIdx];
      const ctrl = (r.controls || []).find(c => c.id === ctrlId);
      const lbl = document.getElementById(`tge-range-lbl-${ctrlId}`);
      if (lbl) lbl.textContent = val + (ctrl && ctrl.unit ? ctrl.unit : '');
      const prev = document.getElementById('tge-bench-preview');
      if (prev) prev.innerHTML = renderBenchPreview(r, inst.roundState.vals);
    },

    checkBench: function (id) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      const r = inst.game.rounds[inst.roundIdx];
      const vals = inst.roundState.vals;
      const badParams = [];

      (r.controls || []).forEach(c => {
        const v = vals[c.id];
        if (c.kind === 'pills') {
          if (String(v) !== String(c.targetVal)) {
            badParams.push(`${c.label}: выбрано «${v}»`);
          }
        } else {
          const num = Number(v);
          const minT = c.targetMin !== undefined ? Number(c.targetMin) : Number(c.targetVal);
          const maxT = c.targetMax !== undefined ? Number(c.targetMax) : Number(c.targetVal);
          if (num < minT || num > maxT) {
            badParams.push(`${c.label} = ${num}${c.unit || ''} (нужно ${minT === maxT ? minT : minT + '..' + maxT}${c.unit || ''})`);
          }
        }
      });

      if (badParams.length === 0) {
        awardWin(inst, r, 75);
      } else {
        penalize(inst, 'Параметры вне допуска (-1 ♥)', `${badParams[0]}. ${r.failRule || ''}`);
      }
      render(inst);
    },

    inspectItem: function (id, itemId) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      const r = inst.game.rounds[inst.roundIdx];
      if (itemId === r.defectId) {
        inst.roundState.fixed = true;
        awardWin(inst, r, 80);
      } else {
        inst.roundState.triedBad.push(itemId);
        const reason = (r.failReasons && r.failReasons[itemId]) || 'Этот узел исправен и соответствует стандарту.';
        penalize(inst, 'Ложная тревога (-1 ♥)', reason);
      }
      render(inst);
    },

    addBuilderChip: function (id, chipId) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      const r = inst.game.rounds[inst.roundIdx];
      const maxLen = (r.correctOrder || []).length || 3;
      if (inst.roundState.slots.length < maxLen && !inst.roundState.slots.includes(chipId)) {
        inst.roundState.slots.push(chipId);
        playTone('click');
        render(inst);
      }
    },

    removeBuilderSlot: function (id, slotIdx) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      inst.roundState.slots.splice(slotIdx, 1);
      render(inst);
    },

    clearBuilder: function (id) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      inst.roundState.slots = [];
      render(inst);
    },

    checkBuilder: function (id) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      const r = inst.game.rounds[inst.roundIdx];
      const exp = r.correctOrder || [];
      const cur = inst.roundState.slots;
      if (cur.length === exp.length && cur.every((v, idx) => v === exp[idx])) {
        awardWin(inst, r, 85);
      } else {
        penalize(inst, 'Сборка не сработала (-1 ♥)', r.failRule || 'Нарушен порядок шагов или выбран неверный модуль.');
      }
      render(inst);
    },

    probePoint: function (id, pointId) {
      const inst = instances[id];
      if (!inst) return;
      inst.roundState.probedId = pointId;
      playTone('click');
      render(inst);
    },

    condemnPoint: function (id, pointId) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      const r = inst.game.rounds[inst.roundIdx];
      if (pointId === r.faultId) {
        awardWin(inst, r, 85);
      } else {
        inst.roundState.triedBad.push(pointId);
        const failReason = (r.failReasons && r.failReasons[pointId]) || r.failRule || 'Показания этой точки укладываются в рабочий допуск.';
        penalize(inst, 'Ошибочный диагноз (-1 ♥)', failReason);
      }
      render(inst);
    },

    pickQuestChoice: function (id, choiceId) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      const r = inst.game.rounds[inst.roundIdx];
      const choice = (r.choices || []).find(c => c.id === choiceId);
      if (choiceId === r.correctId) {
        awardWin(inst, { winRule: `${choice ? choice.outcome + ' ' : ''}${r.winRule || ''}`.trim() }, 80);
      } else {
        inst.roundState.triedBad.push(choiceId);
        penalize(inst, 'Неверное решение (-1 ♥)', choice ? choice.outcome : 'Такое действие приведёт к браку.');
      }
      render(inst);
    },

    sortTriageCard: function (id, binId) {
      const inst = instances[id];
      if (!inst || inst.roundState.solved) return;
      const r = inst.game.rounds[inst.roundIdx];
      const cards = r.cards || [];
      const cur = cards[inst.roundState.cardIdx];
      if (!cur) return;

      if (binId === cur.targetBin) {
        inst.score += 35 * inst.combo;
        inst.combo = Math.min(3, inst.combo + 1);
        inst.maxCombo = Math.max(inst.maxCombo, inst.combo);
        inst.roundState.cardFeedback = { ok: true, rule: cur.rule || 'Верная классификация.' };
        playTone('success');

        if (inst.roundState.cardIdx < cards.length - 1) {
          inst.roundState.cardIdx += 1;
        } else {
          awardWin(inst, r, 50);
        }
      } else {
        inst.roundState.cardFeedback = { ok: false, rule: cur.rule || 'Неверная категория.' };
        penalize(inst, 'Неверная сортировка (-1 ♥)', cur.rule || 'Перепроверьте параметры образца.');
      }
      render(inst);
    }
  };
})();
