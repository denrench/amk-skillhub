/**
 * AMK SkillHub — Academic Integrity & Anti-Cheat Proctoring Engine
 * Applies universally to all 100 lessons across all 5 specialties.
 *
 * Capabilities:
 *  1. Anti-Copy / Anti-Selection on lesson theory, task prompts, criteria, and quiz options.
 *  2. Hard Anti-Paste / Anti-Drop / Anti-Injection on student answer editors (#practical-code-input, #solution-code).
 *  3. Tab-Switch & Window-Blur Proctoring with exact away-time tracking (seconds).
 *  4. DevTools & View-Source shortcut guard (F12, Ctrl+Shift+I/J/C, Ctrl+U) + contextmenu guard.
 *  5. Keystroke biometrics (real keystrokes vs text length, instant burst rollback).
 *  6. Live HUD trust badge (#lp-integrity-badge) + toast alerts + detailed JSON report for Gemini AI Examiner.
 */
(function () {
  'use strict';

  const DEFAULT_STATE = () => ({
    lessonKey: 'default',
    startedAt: Date.now(),
    tabSwitches: 0,
    awaySeconds: 0,
    pasteAttempts: 0,
    copyAttempts: 0,
    devtoolsAttempts: 0,
    instantInjections: 0,
    keystrokes: 0,
    typedChars: 0,
    events: [],
    active: false,
    leftAt: null,
    lastBlurAt: 0,
    warnedStrictModal: false,
  });

  let state = DEFAULT_STATE();
  let boundInputs = new WeakSet();
  let globalListenersInstalled = false;
  let toastTimer = null;

  function computeTrustScore() {
    let score = 100;
    score -= state.pasteAttempts * 15;
    score -= state.instantInjections * 20;
    score -= state.tabSwitches * 12;
    score -= Math.floor(state.awaySeconds / 30) * 5;
    score -= state.copyAttempts * 6;
    score -= state.devtoolsAttempts * 10;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function getStatusMeta(score) {
    if (score >= 85) {
      return {
        code: 'verified',
        label: 'Чистое выполнение',
        color: '#34d399',
        bg: 'rgba(16, 185, 129, 0.14)',
        border: 'rgba(16, 185, 129, 0.38)',
        icon: 'verified_user',
      };
    }
    if (score >= 60) {
      return {
        code: 'warning',
        label: 'Есть замечания',
        color: '#fbbf24',
        bg: 'rgba(245, 158, 11, 0.16)',
        border: 'rgba(245, 158, 11, 0.42)',
        icon: 'gpp_maybe',
      };
    }
    return {
      code: 'flagged',
      label: 'Риск списывания',
      color: '#fb7185',
      bg: 'rgba(244, 63, 94, 0.18)',
      border: 'rgba(244, 63, 94, 0.48)',
      icon: 'gpp_bad',
    };
  }

  function playAlertSfx() {
    try {
      if (window.AMKTheme && typeof window.AMKTheme.playSfx === 'function') {
        window.AMKTheme.playSfx('error');
      }
    } catch (_) {}
  }

  function pushEvent(type, detail) {
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.events.push({ type, detail, time: timeStr });
    if (state.events.length > 40) state.events.shift();
    updateHudBadge();
  }

  function ensureToastContainer() {
    let el = document.getElementById('amk-ac-toast');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'amk-ac-toast';
    el.setAttribute('role', 'alert');
    el.style.cssText = [
      'position:fixed',
      'top:76px',
      'right:18px',
      'z-index:9999',
      'max-width:380px',
      'padding:14px 16px',
      'border-radius:16px',
      'background:rgba(15, 23, 42, 0.96)',
      'border:1.5px solid rgba(244, 63, 94, 0.55)',
      'box-shadow:0 20px 50px -15px rgba(244, 63, 94, 0.45), 0 0 0 1px rgba(255,255,255,0.06)',
      'color:#f8fafc',
      'font-size:12px',
      'line-height:1.45',
      'backdrop-filter:blur(16px)',
      'display:none',
      'align-items:flex-start',
      'gap:10px',
      'transition:all 200ms ease',
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  function showWarningToast(title, message, severity) {
    if (!document.body) return;
    const el = ensureToastContainer();
    const isSevere = severity === 'severe';
    el.style.borderColor = isSevere ? 'rgba(244, 63, 94, 0.72)' : 'rgba(245, 158, 11, 0.65)';
    const iconColor = isSevere ? '#fb7185' : '#fbbf24';
    const score = computeTrustScore();
    el.innerHTML = `
      <span class="material-symbols-outlined" style="color:${iconColor};font-size:22px;flex-shrink:0;margin-top:1px;">${isSevere ? 'gpp_bad' : 'warning'}</span>
      <div style="min-width:0;flex:1;">
        <div style="font-weight:800;font-size:12px;color:${iconColor};letter-spacing:0.02em;">${escapeText(title)}</div>
        <div style="color:#e2e8f0;margin-top:3px;">${escapeText(message)}</div>
        <div style="margin-top:6px;font-family:monospace;font-size:10px;color:#94a3b8;">
          Индекс самостоятельности: <strong style="color:${getStatusMeta(score).color};">${score}%</strong> · Фиксируется для ИИ-проверки
        </div>
      </div>
    `;
    el.style.display = 'flex';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.display = 'none';
    }, 5200);
  }

  function showStrictWarningModal() {
    if (state.warnedStrictModal || !document.body) return;
    state.warnedStrictModal = true;
    const existing = document.getElementById('amk-ac-strict-modal');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'amk-ac-strict-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(2,6,23,0.78);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;';
    const score = computeTrustScore();
    overlay.innerHTML = `
      <div style="max-width:440px;width:100%;background:#0f172a;border:1.5px solid rgba(244,63,94,0.6);border-radius:24px;padding:24px;color:#f8fafc;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:44px;height:44px;border-radius:14px;background:rgba(244,63,94,0.18);border:1px solid rgba(244,63,94,0.45);display:flex;align-items:center;justify-content:center;color:#fb7185;flex-shrink:0;">
            <span class="material-symbols-outlined" style="font-size:26px;">gpp_bad</span>
          </div>
          <div>
            <div style="font-size:11px;font-family:monospace;color:#fb7185;font-weight:800;text-transform:uppercase;">AMK Anti-Cheat Proctoring</div>
            <h3 style="margin:2px 0 0;font-size:16px;font-weight:800;color:#fff;">Зафиксированы частые уходы со вкладки</h3>
          </div>
        </div>
        <p style="font-size:13px;color:#cbd5e1;line-height:1.55;margin:0 0 14px;">
          Вы покидали страницу урока уже <strong>${state.tabSwitches} раз(а)</strong> (всего вне урока: <strong>${state.awaySeconds} сек</strong>).
          Текущий индекс честности снижен до <strong style="color:#fb7185;">${score}%</strong>.
        </p>
        <p style="font-size:12px;color:#94a3b8;line-height:1.5;margin:0 0 18px;padding:10px 12px;border-radius:12px;background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.22);">
          При низком индексе самостоятельности ИИ-экзаменатор автоматически ограничивает итоговую оценку и передаёт пометку преподавателю. Пожалуйста, выполняйте урок самостоятельно в этой вкладке.
        </p>
        <button type="button" id="amk-ac-strict-ok" style="width:100%;padding:11px 16px;border-radius:12px;border:none;background:linear-gradient(90deg,#e11d48,#f43f5e);color:#fff;font-weight:800;font-size:13px;cursor:pointer;">
          Понятно, продолжаю самостоятельно
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#amk-ac-strict-ok')?.addEventListener('click', () => overlay.remove());
  }

  function openProctorLogModal() {
    if (!document.body) return;
    const existing = document.getElementById('amk-ac-log-modal');
    if (existing) existing.remove();
    const score = computeTrustScore();
    const meta = getStatusMeta(score);
    const evRows = state.events.length
      ? state.events.slice(-10).reverse().map(ev => `
          <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);font-size:11px;">
            <span style="color:#e2e8f0;">${escapeText(ev.detail)}</span>
            <span style="font-family:monospace;color:#94a3b8;shrink:0;">${escapeText(ev.time)}</span>
          </div>
        `).join('')
      : '<div style="font-size:12px;color:#34d399;padding:10px;border-radius:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);">✓ Нарушений не зафиксировано. Вы проходите урок честно и самостоятельно!</div>';

    const overlay = document.createElement('div');
    overlay.id = 'amk-ac-log-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(2,6,23,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = `
      <div style="max-width:460px;width:100%;background:#0f172a;border:1px solid ${meta.border};border-radius:24px;padding:22px;color:#f8fafc;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="material-symbols-outlined" style="color:${meta.color};font-size:24px;">${meta.icon}</span>
            <div>
              <div style="font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;font-weight:700;">AMK Anti-Cheat Proctoring</div>
              <div style="font-size:15px;font-weight:800;color:#fff;">Индекс честности: <span style="color:${meta.color};">${score}%</span></div>
            </div>
          </div>
          <button type="button" id="amk-ac-log-close" style="background:rgba(255,255,255,0.08);border:none;color:#cbd5e1;width:32px;height:32px;border-radius:10px;cursor:pointer;font-weight:800;">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:14px;font-size:11px;">
          <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
            <div style="color:#94a3b8;">Уходов со вкладки</div>
            <div style="font-family:monospace;font-size:15px;font-weight:800;color:${state.tabSwitches ? '#fbbf24' : '#34d399'};">${state.tabSwitches} (${state.awaySeconds}с)</div>
          </div>
          <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
            <div style="color:#94a3b8;">Попыток вставки</div>
            <div style="font-family:monospace;font-size:15px;font-weight:800;color:${state.pasteAttempts ? '#fb7185' : '#34d399'};">${state.pasteAttempts}</div>
          </div>
          <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
            <div style="color:#94a3b8;">Копирований / DevTools</div>
            <div style="font-family:monospace;font-size:15px;font-weight:800;color:${(state.copyAttempts + state.devtoolsAttempts) ? '#fbbf24' : '#34d399'};">${state.copyAttempts} / ${state.devtoolsAttempts}</div>
          </div>
          <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
            <div style="color:#94a3b8;">Ручной набор клавиш</div>
            <div style="font-family:monospace;font-size:15px;font-weight:800;color:#38bdf8;">${state.keystrokes}</div>
          </div>
        </div>
        <div style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px;">Журнал контроля</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:170px;overflow-y:auto;">${evRows}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#amk-ac-log-close')?.addEventListener('click', () => overlay.remove());
  }

  function escapeText(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function updateHudBadge() {
    const score = computeTrustScore();
    const meta = getStatusMeta(score);
    document.querySelectorAll('[data-amk-integrity-badge]').forEach(el => {
      el.style.color = meta.color;
      el.style.background = meta.bg;
      el.style.borderColor = meta.border;
      const valEl = el.querySelector('[data-amk-integrity-score]');
      if (valEl) valEl.textContent = `${score}%`;
      const iconEl = el.querySelector('[data-amk-integrity-icon]');
      if (iconEl) iconEl.textContent = meta.icon;
      el.title = `AMK Контроль честности: ${score}% (${meta.label}) · Уходов: ${state.tabSwitches}, попыток вставки: ${state.pasteAttempts}. Нажмите для отчёта.`;
    });
  }

  function flashInputReject(el) {
    if (!el) return;
    el.style.boxShadow = '0 0 0 2px rgba(244, 63, 94, 0.85)';
    setTimeout(() => {
      el.style.boxShadow = '';
    }, 650);
  }

  function isEditableTarget(target) {
    if (!target || !target.tagName) return false;
    const tag = target.tagName.toUpperCase();
    return tag === 'TEXTAREA' || tag === 'INPUT' || target.isContentEditable;
  }

  function isProtectedEditor(target) {
    if (!target || !target.matches) return false;
    return target.matches('#practical-code-input, #solution-code, [data-amk-no-paste="true"]');
  }

  function bindInput(el) {
    if (!el || boundInputs.has(el)) return;
    boundInputs.add(el);
    el.setAttribute('data-amk-no-paste', 'true');
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('spellcheck', 'false');

    let lastValidVal = el.value || '';
    let recentKeystrokeTimes = [];

    el.addEventListener('keydown', e => {
      if (!state.active) return;
      const key = (e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === 'v' || key === 'c' || key === 'x')) {
        e.preventDefault();
        if (key === 'v') {
          state.pasteAttempts += 1;
          pushEvent('paste', 'Заблокирована вставка (Ctrl+V / Cmd+V)');
          playAlertSfx();
          flashInputReject(el);
          showWarningToast('Вставка текста запрещена', 'Ответ нужно писать самостоятельно без копипаста (Ctrl+V отключён).', 'severe');
        } else {
          state.copyAttempts += 1;
          pushEvent('copy', 'Заблокировано копирование текста ответа');
          showWarningToast('Копирование отключено', 'В режиме контроля самостоятельности копирование недоступно.', 'warn');
        }
        return;
      }
      if (e.shiftKey && key === 'insert') {
        e.preventDefault();
        state.pasteAttempts += 1;
        pushEvent('paste', 'Заблокирована вставка (Shift+Insert)');
        playAlertSfx();
        flashInputReject(el);
        showWarningToast('Вставка текста запрещена', 'Комбинация Shift+Insert заблокирована системой контроля.', 'severe');
        return;
      }
      // Track genuine manual typing
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        state.keystrokes += 1;
        if (e.key && e.key.length === 1) state.typedChars += 1;
        const now = Date.now();
        recentKeystrokeTimes.push(now);
        recentKeystrokeTimes = recentKeystrokeTimes.filter(t => now - t < 1500);
      }
    });

    el.addEventListener('paste', e => {
      if (!state.active) return;
      e.preventDefault();
      state.pasteAttempts += 1;
      pushEvent('paste', 'Попытка вставки текста из буфера обмена');
      playAlertSfx();
      flashInputReject(el);
      showWarningToast('Вставка из буфера заблокирована!', 'Списывание запрещено: введите решение с клавиатуры самостоятельно.', 'severe');
    });

    el.addEventListener('drop', e => {
      if (!state.active) return;
      e.preventDefault();
      state.pasteAttempts += 1;
      pushEvent('drop', 'Попытка перетаскивания текста в поле ответа');
      playAlertSfx();
      flashInputReject(el);
      showWarningToast('Перетаскивание текста запрещено', 'Набирайте решение самостоятельно в поле ввода.', 'severe');
    });

    el.addEventListener('beforeinput', e => {
      if (!state.active) return;
      const t = e.inputType || '';
      if (t === 'insertFromPaste' || t === 'insertFromDrop' || t === 'insertFromPasteAsQuotation') {
        e.preventDefault();
        state.pasteAttempts += 1;
        pushEvent('paste', `Заблокирован системный ввод (${t})`);
        playAlertSfx();
        flashInputReject(el);
        showWarningToast('Вставка текста заблокирована', 'Используйте ручной ввод с клавиатуры.', 'severe');
      }
    });

    el.addEventListener('input', () => {
      if (!state.active) {
        lastValidVal = el.value;
        return;
      }
      const now = Date.now();
      recentKeystrokeTimes = recentKeystrokeTimes.filter(t => now - t < 1500);
      const delta = el.value.length - lastValidVal.length;
      // Detect programmatic bulk text injection (e.g., browser extensions / scripts pasting > 20 chars at once without keystrokes)
      if (delta > 20 && recentKeystrokeTimes.length < 4) {
        state.instantInjections += 1;
        el.value = lastValidVal;
        pushEvent('injection', `Отклонён мгновенный вброс +${delta} симв. без ручного набора`);
        playAlertSfx();
        flashInputReject(el);
        showWarningToast('Обнаружена автоподстановка текста!', 'Мгновенная вставка большого фрагмента без набора клавиш заблокирована.', 'severe');
        return;
      }
      lastValidVal = el.value;
      updateHudBadge();
    });
  }

  function recordLeave(reason) {
    if (!state.active) return;
    if (state.leftAt !== null) return; // already away
    state.leftAt = Date.now();
    state.lastBlurAt = state.leftAt;
    state._leaveReason = reason;
  }

  function recordReturn() {
    if (!state.active || state.leftAt === null) return;
    const elapsedMs = Date.now() - state.leftAt;
    const reason = state._leaveReason || 'tab';
    state.leftAt = null;
    // Ignore tiny < 450ms focus glitches (e.g. clicking inside native select/alert)
    if (elapsedMs < 450) return;
    const sec = Math.max(1, Math.round(elapsedMs / 1000));
    state.tabSwitches += 1;
    state.awaySeconds += sec;
    pushEvent('tab_switch', `Уход со страницы урока (${reason === 'hidden' ? 'смена вкладки' : 'переключение окна'}) — ${sec} сек`);
    playAlertSfx();
    showWarningToast(
      `Зафиксирован уход со страницы (#${state.tabSwitches})`,
      `Вы отсутствовали ${sec} сек. Частые переключения вкладок снижают итоговую оценку при ИИ-проверке.`,
      state.tabSwitches >= 2 ? 'severe' : 'warn'
    );
    if (state.tabSwitches >= 3) {
      showStrictWarningModal();
    }
  }

  function installGlobalListeners() {
    if (globalListenersInstalled) return;
    globalListenersInstalled = true;

    // 1. Visibility change (switching tabs / minimizing browser)
    document.addEventListener('visibilitychange', () => {
      if (!state.active) return;
      if (document.hidden) {
        recordLeave('hidden');
      } else {
        recordReturn();
      }
    });

    // 2. Window blur / focus (switching to another app / split screen AI chat)
    window.addEventListener('blur', () => {
      if (!state.active) return;
      // Ignore blur if focus moved to an iframe inside our own page
      setTimeout(() => {
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') return;
        if (!document.hasFocus()) {
          recordLeave('blur');
        }
      }, 120);
    });
    window.addEventListener('focus', () => {
      if (!state.active) return;
      recordReturn();
    });

    // 3. Block copying lesson task prompts, theory & quiz questions
    document.addEventListener('copy', e => {
      if (!state.active) return;
      // Allow copying inside AI Tutor chat if needed? No — block copying in lesson area completely!
      if (e.target && e.target.closest && e.target.closest('#lp-block-canvas, #academy-main, .sim-problem-panel')) {
        e.preventDefault();
        state.copyAttempts += 1;
        pushEvent('copy', 'Попытка скопировать текст задания или теории');
        showWarningToast('Копирование задания отключено', 'Условие урока защищено от копирования во внешние сервисы.', 'warn');
      }
    });

    document.addEventListener('cut', e => {
      if (!state.active) return;
      if (e.target && e.target.closest && e.target.closest('#lp-block-canvas, #academy-main')) {
        if (!isProtectedEditor(e.target)) {
          e.preventDefault();
        }
      }
    });

    // 4. Context menu guard in lesson content & protected editors
    document.addEventListener('contextmenu', e => {
      if (!state.active) return;
      if (e.target && e.target.closest && e.target.closest('#lp-block-canvas, #practical-code-input, #solution-code')) {
        e.preventDefault();
      }
    });

    // 5. DevTools / View-Source shortcut guard
    document.addEventListener('keydown', e => {
      if (!state.active) return;
      const k = (e.key || '').toLowerCase();
      const isF12 = e.key === 'F12';
      const isDevShortcut = (e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'j' || k === 'c');
      const isViewSource = (e.ctrlKey || e.metaKey) && !e.shiftKey && k === 'u';
      if (isF12 || isDevShortcut || isViewSource) {
        e.preventDefault();
        state.devtoolsAttempts += 1;
        pushEvent('devtools', `Попытка открыть инструменты разработчика (${e.key})`);
        playAlertSfx();
        showWarningToast('Инструменты разработчика ограничены', 'Во время прохождения урока просмотр исходного кода фиксируется системой контроля.', 'severe');
      }
    });

    // 6. Auto-bind dynamically rendered protected textareas via MutationObserver
    const obs = new MutationObserver(() => {
      if (!state.active) return;
      const editors = document.querySelectorAll('#practical-code-input, #solution-code, [data-amk-no-paste="true"]');
      editors.forEach(bindInput);
    });
    if (document.documentElement) {
      obs.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  function start(lessonKey) {
    state = DEFAULT_STATE();
    state.lessonKey = String(lessonKey || 'lesson');
    state.active = true;
    installGlobalListeners();
    document.body && document.body.classList.add('amk-proctor-active');
    document.querySelectorAll('#practical-code-input, #solution-code, [data-amk-no-paste="true"]').forEach(bindInput);
    updateHudBadge();
  }

  function stop() {
    state.active = false;
    state.leftAt = null;
    document.body && document.body.classList.remove('amk-proctor-active');
  }

  function getReport() {
    const score = computeTrustScore();
    const meta = getStatusMeta(score);
    return {
      lesson_key: state.lessonKey,
      trust_score: score,
      status: meta.code,
      status_label: meta.label,
      tab_switches: state.tabSwitches,
      away_seconds: state.awaySeconds,
      paste_attempts: state.pasteAttempts,
      copy_attempts: state.copyAttempts,
      devtools_attempts: state.devtoolsAttempts,
      instant_injections: state.instantInjections,
      keystrokes: state.keystrokes,
      typed_chars: state.typedChars,
      events_count: state.events.length,
    };
  }

  window.AMKAntiCheat = {
    start,
    stop,
    bindInput,
    getReport,
    computeTrustScore,
    openProctorLogModal,
    updateHudBadge,
  };
})();
