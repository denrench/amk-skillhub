/* AMK SkillHub · Инструменты студента: Live Search · GPA · Task Hub */
(function () {
  'use strict';

  const COURSES = {
    all: 'Все',
    it: 'IT',
    graphic_design: 'Графдизайн',
    autoelectric: 'Автоэлектрика',
    hvac: 'HVAC',
    automechanic: 'Автомеханика',
  };
  const TYPES = { cheat: 'Шпаргалка', guide: 'Гайд', checklist: 'Чек-лист', norm: 'Норматив' };

  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* quota / private mode */ }
    },
  };

  // =====================================================================
  // 1. LIVE SEARCH
  // =====================================================================
  function initSearch(root) {
    const kb = window.AMK_KB || [];
    const input = root.querySelector('[data-kb-input]');
    const chips = root.querySelector('[data-kb-chips]');
    const types = root.querySelector('[data-kb-types]');
    const list = root.querySelector('[data-kb-list]');
    const count = root.querySelector('[data-kb-count]');
    let course = 'all';
    let type = 'all';

    chips.innerHTML = Object.entries(COURSES).map(([k, v]) =>
      `<button type="button" class="tool-chip" data-kb-course="${k}" aria-pressed="${k === 'all'}">${v}</button>`).join('');
    types.innerHTML = [['all', 'Все типы']].concat(Object.entries(TYPES)).map(([k, v]) =>
      `<button type="button" class="tool-chip tool-chip--ghost" data-kb-type="${k}" aria-pressed="${k === 'all'}">${v}</button>`).join('');

    const norm = (s) => s.toLowerCase().replace(/ё/g, 'е');
    function highlight(text, terms) {
      let out = esc(text);
      terms.forEach((t) => {
        if (t.length < 2) return;
        const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        out = out.replace(re, '<mark>$1</mark>');
      });
      return out;
    }

    function render() {
      const q = norm(input.value.trim());
      const terms = q.split(/\s+/).filter(Boolean);
      const res = kb.filter((it) => {
        if (course !== 'all' && it.c !== course) return false;
        if (type !== 'all' && it.t !== type) return false;
        if (!terms.length) return true;
        const hay = norm(it.title + ' ' + it.text + ' ' + it.tags + ' ' + COURSES[it.c] + ' ' + TYPES[it.t]);
        return terms.every((t) => hay.includes(t));
      });
      count.textContent = `Найдено: ${res.length} из ${kb.length}`;
      list.innerHTML = res.length ? res.map((it) => `
        <a class="kb-card" href="${esc(it.href)}" data-kb-item data-kb-c="${it.c}">
          <span class="kb-card-meta"><span class="kb-badge kb-badge--${it.c}">${COURSES[it.c]}</span><span>${TYPES[it.t]}</span></span>
          <strong class="kb-card-title">${highlight(it.title, terms)}</strong>
          <span class="kb-card-text">${highlight(it.text, terms)}</span>
        </a>`).join('')
        : '<p class="kb-empty">Ничего не найдено. Попробуйте другой запрос или снимите фильтр.</p>';
    }

    let timer = 0;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 120); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { input.value = ''; render(); } });
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('[data-kb-course]');
      if (!b) return;
      course = b.dataset.kbCourse;
      chips.querySelectorAll('[data-kb-course]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    });
    types.addEventListener('click', (e) => {
      const b = e.target.closest('[data-kb-type]');
      if (!b) return;
      type = b.dataset.kbType;
      types.querySelectorAll('[data-kb-type]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    });
    render();
  }

  // =====================================================================
  // 2. PRACTICUM GRADEBOOK & GPA CALCULATOR (AUTO-SYNCED WITH PASSED TESTS)
  // =====================================================================
  const PRACTICUM_GRADES_KEY = 'amk_practicum_grades_v1';
  const GPA_SIM_KEY = 'amk.gpa.sim.v1';
  const GRADE_TO_4 = { 5: 4.0, 4: 3.0, 3: 2.0, 2: 0.0 };
  const SPEC_SHORT = {
    it: 'IT / Web',
    graphic_design: 'Графдизайн',
    autoelectric: 'Автоэлектрика',
    hvac: 'HVAC',
    automechanic: 'Автомеханика'
  };

  function scoreToGrade5(score) {
    const s = Number(score || 0);
    if (s <= 5 && s >= 2) return Math.round(s);
    if (s >= 88) return 5;
    if (s >= 70) return 4;
    if (s >= 50) return 3;
    return 2;
  }

  function initGpa(root) {
    const rowsEl = root.querySelector('[data-gpa-rows]');
    const out5 = root.querySelector('[data-gpa-5]');
    const out4 = root.querySelector('[data-gpa-4]');
    const outCredits = root.querySelector('[data-gpa-credits]');
    const verdict = root.querySelector('[data-gpa-verdict]');
    const meter = root.querySelector('[data-gpa-meter]');

    function loadRealGrades() {
      const stored = store.get(PRACTICUM_GRADES_KEY, []);
      if (Array.isArray(stored) && stored.length) {
        return stored.map((g) => ({
          id: g.id || `${g.specialty || 'it'}:${g.lesson_num || 1}`,
          name: `Урок ${g.lesson_num || 1}. ${g.title || 'Практический тест'}`,
          spec: SPEC_SHORT[g.specialty] || g.specialty || 'Практикум',
          grade: scoreToGrade5(g.grade_5 || g.score_100),
          score100: Number(g.score_100 || 0),
          source: 'real'
        }));
      }
      return [];
    }

    let rows = loadRealGrades();
    const simSaved = store.get(GPA_SIM_KEY, []);
    if (!rows.length && Array.isArray(simSaved) && simSaved.length) {
      rows = simSaved;
    }

    // Best-effort sync real graded submissions from backend API
    (async function syncFromBackend() {
      try {
        const base = (window.location && window.location.hostname && window.location.hostname.endsWith('github.io'))
          ? 'https://amk-skillhub.onrender.com'
          : '';
        const res = await fetch(base + '/api/tasks?specialty=it', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        const graded = tasks.filter(t => t && (t.status_code === 'graded' || Number(t.score || 0) > 0));
        if (graded.length) {
          const existingIds = new Set(rows.map(r => r.id));
          graded.forEach((t) => {
            const id = `it:${t.task_number}`;
            if (!existingIds.has(id)) {
              rows.push({
                id,
                name: `Урок ${t.task_number}. ${String(t.title || '').replace(/^Урок\s*\d+\.\s*/i, '')}`,
                spec: 'Практикум',
                grade: scoreToGrade5(t.score),
                score100: Number(t.score || 0),
                source: 'real'
              });
            }
          });
          draw();
        }
      } catch (e) {}
    })();

    function gradeColor(g) {
      if (g >= 5) return '#34d399';
      if (g === 4) return '#38bdf8';
      if (g === 3) return '#fbbf24';
      return '#fb7185';
    }

    function draw() {
      if (!rows.length) {
        rowsEl.innerHTML = `
          <div style="padding:14px;border-radius:12px;background:var(--bg);border:1px dashed var(--line);font-size:0.84rem;color:var(--muted);line-height:1.5;">
            Вы ещё не сдали уроки в практикуме. Как только пройдёте тест или проверку ИИ в любом уроке, оценки появятся здесь автоматически в формате <strong>«Урок 1 · Тема — Оценка 5»</strong>.<br>
            <a href="tasks.html" style="color:var(--accent);font-weight:700;text-decoration:underline;display:inline-block;margin-top:6px;">Открыть практикум →</a>
          </div>`;
        calc();
        return;
      }

      rowsEl.innerHTML = rows.map((r, i) => `
        <div class="gpa-row" data-gpa-row="${i}" style="grid-template-columns:minmax(0,1fr) auto 64px 32px;">
          <div style="min-width:0;display:flex;flex-direction:column;gap:2px;">
            <input class="tool-input" type="text" value="${esc(r.name)}" data-gpa-field="name" aria-label="Урок ${i + 1}" placeholder="Урок и тема" style="padding:7px 10px;font-size:0.84rem;font-weight:600;">
          </div>
          <span style="font-size:10px;font-weight:800;padding:3px 7px;border-radius:999px;background:var(--bg-elev);color:${r.source === 'real' ? '#34d399' : 'var(--muted)'};white-space:nowrap;">${r.source === 'real' ? '✓ Практикум' : 'Прогноз'}</span>
          <select class="tool-input tool-input--num" data-gpa-field="grade" aria-label="Оценка за урок ${i + 1}" style="font-weight:900;color:${gradeColor(Number(r.grade))};">
            ${[5, 4, 3, 2].map((g) => `<option value="${g}"${g === Number(r.grade) ? ' selected' : ''}>${g}</option>`).join('')}
          </select>
          <button type="button" class="tool-icon-btn" data-gpa-del="${i}" aria-label="Удалить строку ${i + 1}">✕</button>
        </div>`).join('');
      calc();
    }

    function calc() {
      let count = rows.length;
      let sum5 = 0, sum4 = 0;
      rows.forEach((r) => {
        const g = Math.max(2, Math.min(5, Number(r.grade) || 4));
        sum5 += g;
        sum4 += (GRADE_TO_4[g] ?? 0);
      });
      const g5 = count ? sum5 / count : 0;
      const g4 = count ? sum4 / count : 0;
      out5.textContent = count ? g5.toFixed(2) : '—';
      out4.textContent = count ? g4.toFixed(2) : '—';
      outCredits.textContent = String(count);
      meter.style.width = count ? Math.min(100, (g5 / 5) * 100).toFixed(1) + '%' : '0%';
      const level = !count
        ? 'Сдайте первый урок в практикуме — средний балл рассчитается автоматически'
        : g5 >= 4.6 ? 'Отлично — красный уровень, повышенная стипендия'
        : g5 >= 3.8 ? 'Хорошо — уверенное освоение практикума'
        : g5 >= 3.0 ? 'Удовлетворительно — подтяните оценки по сложным темам'
        : 'Нужно пересдать практические тесты для зачёта';
      verdict.textContent = level;
      root.dataset.gpaLevel = !count ? 'none' : g5 >= 4.6 ? 'high' : g5 >= 3.8 ? 'good' : g5 >= 3.0 ? 'mid' : 'low';
      if (rows.every(r => r.source !== 'real')) {
        store.set(GPA_SIM_KEY, rows);
      }
    }

    rowsEl.addEventListener('input', (e) => {
      const row = e.target.closest('[data-gpa-row]');
      const field = e.target.dataset.gpaField;
      if (!row || !field) return;
      const r = rows[Number(row.dataset.gpaRow)];
      r[field] = field === 'name' ? e.target.value : Number(e.target.value);
      calc();
    });
    rowsEl.addEventListener('change', (e) => {
      if (e.target.dataset.gpaField === 'grade') {
        const idx = Number(e.target.closest('[data-gpa-row]').dataset.gpaRow);
        rows[idx].grade = Number(e.target.value);
        draw();
      }
    });
    rowsEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-gpa-del]');
      if (!b) return;
      rows.splice(Number(b.dataset.gpaDel), 1);
      draw();
    });
    root.querySelector('[data-gpa-add]').addEventListener('click', () => {
      rows.push({ id: `sim:${Date.now()}`, name: `Урок ${rows.length + 1}. Прогноз по теме`, spec: 'Прогноз', grade: 5, source: 'sim' });
      draw();
      const last = rowsEl.querySelector('.gpa-row:last-child input');
      if (last) last.focus();
    });
    root.querySelector('[data-gpa-reset]').addEventListener('click', () => {
      rows = loadRealGrades();
      if (!rows.length) store.set(GPA_SIM_KEY, []);
      draw();
    });
    draw();
  }

  // =====================================================================
  // 3. TASK HUB
  // =====================================================================
  const TASK_KEY = 'amk.tasks.v1';
  const uid = () => Math.random().toString(36).slice(2, 9);

  function initTasks(root) {
    const projSel = root.querySelector('[data-task-project]');
    const listEl = root.querySelector('[data-task-list]');
    const form = root.querySelector('[data-task-form]');
    const titleIn = root.querySelector('[data-task-title]');
    const dueIn = root.querySelector('[data-task-due]');
    const prioIn = root.querySelector('[data-task-prio]');
    const bar = root.querySelector('[data-task-bar]');
    const pct = root.querySelector('[data-task-pct]');
    const filters = root.querySelector('[data-task-filters]');
    let filter = 'all';

    let data = store.get(TASK_KEY, null) || {
      active: 'p1',
      projects: [
        { id: 'p1', name: 'Курсовой проект', tasks: [
          { id: uid(), title: 'Согласовать тему с руководителем', done: true, due: '', prio: 'mid' },
          { id: uid(), title: 'Собрать источники и нормативы', done: false, due: '', prio: 'mid' },
          { id: uid(), title: 'Практическая часть: расчёты и схемы', done: false, due: '', prio: 'high' },
        ] },
        { id: 'p2', name: 'Дипломный проект', tasks: [] },
      ],
    };
    const save = () => store.set(TASK_KEY, data);
    const active = () => data.projects.find((p) => p.id === data.active) || data.projects[0];

    function drawProjects() {
      projSel.innerHTML = data.projects.map((p) => {
        const done = p.tasks.filter((t) => t.done).length;
        return `<option value="${p.id}"${p.id === data.active ? ' selected' : ''}>${esc(p.name)} (${done}/${p.tasks.length})</option>`;
      }).join('');
    }

    function draw() {
      const p = active();
      if (!p) return;
      drawProjects();
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.done).length;
      const percent = total ? Math.round((done / total) * 100) : 0;
      bar.style.width = percent + '%';
      bar.parentElement.setAttribute('aria-valuenow', String(percent));
      pct.textContent = `${percent}% · ${done} из ${total}`;
      const today = new Date().toISOString().slice(0, 10);
      const shown = p.tasks.filter((t) => filter === 'all' || (filter === 'open' ? !t.done : t.done));
      listEl.innerHTML = shown.length ? shown.map((t) => {
        const overdue = t.due && !t.done && t.due < today;
        return `
        <li class="task-item${t.done ? ' is-done' : ''}" data-task-id="${t.id}">
          <label class="task-check">
            <input type="checkbox" ${t.done ? 'checked' : ''} data-task-toggle aria-label="Готово: ${esc(t.title)}">
            <span class="task-title">${esc(t.title)}</span>
          </label>
          <span class="task-meta">
            <span class="task-prio task-prio--${t.prio}">${t.prio === 'high' ? 'Высокий' : t.prio === 'low' ? 'Низкий' : 'Средний'}</span>
            ${t.due ? `<span class="task-due${overdue ? ' is-overdue' : ''}">${overdue ? 'Просрочено · ' : 'до '}${t.due.split('-').reverse().join('.')}</span>` : ''}
          </span>
          <button type="button" class="tool-icon-btn" data-task-del aria-label="Удалить задачу">✕</button>
        </li>`;
      }).join('') : `<li class="task-empty">${filter === 'done' ? 'Пока нет выполненных задач.' : 'Задач нет — добавьте первую.'}</li>`;
      save();
    }

    projSel.addEventListener('change', () => { data.active = projSel.value; draw(); });
    root.querySelector('[data-task-newproj]').addEventListener('click', () => {
      const name = (window.prompt('Название проекта', 'Новый проект') || '').trim();
      if (!name) return;
      const id = 'p' + uid();
      data.projects.push({ id, name, tasks: [] });
      data.active = id;
      draw();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleIn.value.trim();
      if (!title) { titleIn.focus(); return; }
      active().tasks.push({ id: uid(), title, done: false, due: dueIn.value, prio: prioIn.value });
      titleIn.value = '';
      dueIn.value = '';
      draw();
      titleIn.focus();
    });
    listEl.addEventListener('change', (e) => {
      if (!e.target.matches('[data-task-toggle]')) return;
      const id = e.target.closest('[data-task-id]').dataset.taskId;
      const t = active().tasks.find((x) => x.id === id);
      if (t) t.done = e.target.checked;
      draw();
    });
    listEl.addEventListener('click', (e) => {
      if (!e.target.closest('[data-task-del]')) return;
      const id = e.target.closest('[data-task-id]').dataset.taskId;
      const p = active();
      p.tasks = p.tasks.filter((x) => x.id !== id);
      draw();
    });
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('[data-task-filter]');
      if (!b) return;
      filter = b.dataset.taskFilter;
      filters.querySelectorAll('[data-task-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw();
    });
    root.querySelector('[data-task-export]').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'amk-task-hub.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    const importIn = root.querySelector('[data-task-import]');
    importIn.addEventListener('change', () => {
      const f = importIn.files && importIn.files[0];
      if (!f) return;
      f.text().then((txt) => {
        const parsed = JSON.parse(txt);
        if (!parsed || !Array.isArray(parsed.projects)) throw new Error('bad');
        data = parsed;
        draw();
      }).catch(() => window.alert('Файл не похож на экспорт Task Hub.'));
      importIn.value = '';
    });
    draw();
  }

  function boot() {
    const s = document.querySelector('[data-tool="search"]');
    const g = document.querySelector('[data-tool="gpa"]');
    const t = document.querySelector('[data-tool="tasks"]');
    if (s) initSearch(s);
    if (g) initGpa(g);
    if (t) initTasks(t);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
