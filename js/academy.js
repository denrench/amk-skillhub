(() => {
  const data = window.AcademyLessons;
  const root = document.getElementById('academy');
  const courses = {
    it: ['Веб-дизайн', 'Макет, вёрстка и интерактивность', 'https://developer.mozilla.org/en-US/docs/Web'],
    graphic_design: ['Графический дизайн', 'Композиция, айдентика и печать', 'https://helpx.adobe.com/indesign/desktop/print/print-production-and-file-creation/produce-print-ready-pdf-files.html'],
    autoelectric: ['Автоэлектрика', 'Цепи, измерения и сигналы', 'https://www.denso-am.eu/news/starter-troubleshooting'],
    hvac: ['Холодильное оборудование', 'Контуры, диагностика и сервис', null],
    automechanic: ['Автомеханика', 'Двигатель, ходовая часть и ТО', null],
  };
  const params = new URLSearchParams(location.search);
  const selected = params.get('course');
  const slug = Object.hasOwn(courses, selected) ? selected : 'it';
  const course = courses[slug];
  const requested = Number(params.get('lesson'));
  const lesson = Number.isInteger(requested) && requested > 0 ? data[slug][requested - 1] : null;
  let disposeActiveModel = null;

  const storeKey = 'skillhub.academy.completed.v1';
  const markKey = 'skillhub.academy.bookmarks.v1';
  const serverProgress = !location.hostname.endsWith('.github.io');
  let accountProgress = new Set();
  let completed = [];
  let bookmarks = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey) || '[]');
    if (Array.isArray(saved)) completed = saved;
    const savedMarks = JSON.parse(localStorage.getItem(markKey) || '[]');
    if (Array.isArray(savedMarks)) bookmarks = savedMarks;
  } catch {}

  function href(target, number) {
    return `learn.html?course=${target}${number ? `&lesson=${number}` : ''}`;
  }

  let csrfToken = '';

  async function readAccountProgress() {
    if (!serverProgress) return;
    try {
      const sessResp = await fetch('/api/auth/session', { credentials: 'same-origin', signal: AbortSignal.timeout(4500) });
      if (!sessResp.ok) return;
      const sessData = await sessResp.json();
      if (sessData && sessData.csrf_token) {
        csrfToken = sessData.csrf_token;
        window.EduSpace?.setCsrfToken?.(csrfToken);
      }
      if (!sessData || !sessData.authenticated) return;

      const response = await fetch('/api/academy/progress', { credentials: 'same-origin', signal: AbortSignal.timeout(4500) });
      if (!response.ok) return;
      const progData = await response.json();
      accountProgress = new Set(progData.completed || []);
      const unlockedDay = Number(progData.current_study_day || 20);
      root.querySelectorAll('[data-lesson-key]').forEach(marker => {
        const key = marker.dataset.lessonKey || '';
        const num = Number(key.split(':')[1] || 1);
        if (num > unlockedDay) {
          marker.textContent = num === unlockedDay + 1 ? 'Откроется завтра' : `Откроется на ${num}-й день`;
          const row = marker.closest('a.lesson-row');
          if (row) {
            row.removeAttribute('href');
            row.setAttribute('aria-disabled', 'true');
            row.style.opacity = '0.6';
            row.style.cursor = 'not-allowed';
          }
        } else if (accountProgress.has(key)) {
          marker.textContent = 'Пройдено';
        }
      });
      if (lesson && requested > unlockedDay) {
        const waitText = requested === unlockedDay + 1 ? 'завтра' : `на ${requested}-й день после регистрации`;
        root.innerHTML = `
          <div class="lesson-head"><div class="container stack">
            <a href="${href(slug)}">← Все уроки курса</a>
            <p class="eyebrow">${course[0]} / Урок ${String(requested).padStart(2, '0')} из ${data[slug].length}</p>
            <h1>Урок откроется ${waitText}</h1>
            <p class="muted">Первый урок открывается сразу после регистрации, второй — на следующий день и так далее по одному уроку в день.</p>
            <div class="actions"><a class="button dark" href="${href(slug)}">Вернуться к программе курса</a></div>
          </div></div>`;
        return;
      }
      if (lesson && requested + 1 > unlockedDay && requested < data[slug].length) {
        const nextLink = root.querySelector('[data-next] a');
        if (nextLink) {
          nextLink.href = href(slug);
          nextLink.textContent = `Урок ${requested + 1} откроется завтра · К программе`;
        }
      }
      if (accountProgress.has(`${slug}:${requested}`)) {
        const next = root.querySelector('[data-next]');
        if (next) next.hidden = false;
      }
    } catch {}
  }

  async function saveAccountProgress() {
    if (!serverProgress || accountProgress.has(`${slug}:${requested}`)) return;
    try {
      const tok = csrfToken || window.EduSpace?.getCsrfToken?.() || '';
      const headers = { 'Content-Type': 'application/json' };
      if (tok) headers['X-CSRF-Token'] = tok;
      const response = await fetch('/api/academy/progress', {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify({ specialty: slug, lesson: requested }),
        signal: AbortSignal.timeout(4500),
      });
      if (response.ok) {
        accountProgress.add(`${slug}:${requested}`);
        root.querySelector('[data-sync]').textContent = 'Прогресс сохранён в аккаунте.';
      }
    } catch {}
  }

  function mountCourseInteractiveHub(containerEl, activeSpec, defaultLessonNum = 1) {
    if (!containerEl) return;
    disposeActiveModel?.();
    disposeActiveModel = null;

    containerEl.innerHTML = `
      <div style="margin:1.1rem 0 1.4rem;padding:1.1rem;border-radius:18px;background:#0f172a;color:#f8fafc;border:1px solid rgba(56,189,248,0.28);box-shadow:0 16px 36px rgba(15,23,42,0.18);">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
          <div>
            <span style="font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#38bdf8;">Цифровой двойник и интерактив направления · ${course[0]}</span>
            <h3 style="margin:3px 0 0;font-size:1.15rem;color:#ffffff;">Интерактивный 3D-стенд и тренажёр по теме курса</h3>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;" role="group" aria-label="Режим стенда курса">
            <button type="button" id="acad-hub-tab-3d" class="button primary" style="min-height:34px;padding:0.3rem 0.85rem;font-size:0.8rem;">🧊 3D-модели профессии (5 узлов)</button>
            <button type="button" id="acad-hub-tab-lab" class="button" style="min-height:34px;padding:0.3rem 0.85rem;font-size:0.8rem;background:rgba(255,255,255,0.08);color:#e2e8f0;border-color:rgba(255,255,255,0.18);">🔬 Интерактивный тренажёр курса</button>
          </div>
        </div>
        <div id="acad-hub-3d-stage"></div>
        <div id="acad-hub-lab-stage" hidden></div>
      </div>
    `;

    const stage3d = containerEl.querySelector('#acad-hub-3d-stage');
    const stageLab = containerEl.querySelector('#acad-hub-lab-stage');
    const btn3d = containerEl.querySelector('#acad-hub-tab-3d');
    const btnLab = containerEl.querySelector('#acad-hub-tab-lab');

    if (window.WorkshopModels && stage3d) {
      const def = window.WorkshopModels.forLesson({ course_slug: activeSpec, order_num: defaultLessonNum }) || window.WorkshopModels.forCourse(activeSpec, 0);
      disposeActiveModel = window.WorkshopModels.show(stage3d, def, { courseSlug: activeSpec, allowModelSwitch: true });
    }

    if (window.LessonInteractives && stageLab) {
      window.LessonInteractives.renderTopicLab(
        stageLab,
        { course_slug: activeSpec, order_num: defaultLessonNum, title: course[0] },
        {},
        () => {}
      );
    }

    btn3d?.addEventListener('click', () => {
      stage3d.hidden = false;
      stageLab.hidden = true;
      btn3d.className = 'button primary';
      btnLab.className = 'button';
    });
    btnLab?.addEventListener('click', () => {
      stage3d.hidden = true;
      stageLab.hidden = false;
      btnLab.className = 'button primary';
      btn3d.className = 'button';
    });
  }

  function catalog() {
    const list = data[slug];
    let doneCount = 0;
    let firstPending = 1;
    let foundPending = false;
    const rows = list.map(([title], index) => {
      const number = index + 1;
      const key = `${slug}:${number}`;
      const done = completed.includes(key);
      const marked = bookmarks.includes(key);
      if (done) doneCount += 1;
      else if (!foundPending) { firstPending = number; foundPending = true; }
      return `<a class="lesson-row" style="--reveal-delay:${index * 28}ms" href="${href(slug, number)}"><span class="course-num">${String(number).padStart(2, '0')}</span>
        <strong>${marked ? '★ ' : ''}${title}</strong><small data-lesson-key="${key}">${done ? 'Пройдено' : '3D + Игра + Практика'}</small></a>`;
    }).join('');
    const pct = Math.round((doneCount / Math.max(1, list.length)) * 100);
    root.innerHTML = `
      <div class="container catalog-head stack"><p class="eyebrow">5 специальностей / 100 уроков / 25 3D-моделей</p><h1>Учебник</h1>
      <p class="muted">Выберите направление. Для каждого курса автоматически загружается профильный 3D-стенд и интерактивный тренажёр профессии, а каждый урок включает игру на 3 раунда, 3D-модель, разбор и практику.</p></div>
      <div class="container section catalog-layout">
        <nav class="catalog-menu" aria-label="Специальности">${Object.entries(courses).map(([id, entry]) =>
          `<a href="${href(id)}"${id === slug ? ' aria-current="page"' : ''}>${entry[0]}</a>`).join('')}</nav>
        <section class="card"><p class="eyebrow">Программа курса</p><h2>${course[0]}</h2><p class="muted">${course[1]}</p>
        <div class="course-meter-box" id="academy-course-meter">
          <div style="flex:1 1 220px;min-width:0;">
            <div style="display:flex;justify-content:space-between;font-size:0.86rem;font-weight:700;color:#1e293b;">
              <span>Прогресс по направлению</span>
              <span>${doneCount} / ${list.length} (${pct}%)</span>
            </div>
            <div class="course-meter-track"><div class="course-meter-fill" style="width:${pct}%;"></div></div>
          </div>
          <a class="button primary" href="${href(slug, firstPending)}">${doneCount ? `Продолжить с урока ${firstPending} →` : 'Начать с урока 1 →'}</a>
        </div>
        <div id="academy-course-3d-hub"></div>
        <div>${rows}</div></section>
      </div>`;
    mountCourseInteractiveHub(document.getElementById('academy-course-3d-hub'), slug, firstPending);
  }

  function renderLesson() {
    const [title, concept, example, question, correct, incorrect, explanation] = lesson;
    const key = `${slug}:${requested}`;
    const choices = requested % 2 ? [incorrect, correct] : [correct, incorrect];
    const hasModel = true;
    const next = requested < data[slug].length ? href(slug, requested + 1) : href(slug);
    const gameStoreKey = `eduspace_academy_game_${slug}_${requested}`;
    let savedGameState = {};
    try {
      savedGameState = JSON.parse(localStorage.getItem(gameStoreKey) || '{}') || {};
    } catch {}
    const gameDone = Boolean(savedGameState && (savedGameState.game_completed || savedGameState.gameCompleted));
    const safety = ['autoelectric', 'automechanic', 'hvac'].includes(slug)
      ? '<p class="muted">Учебный пример для разбора. Действия на оборудовании выполняют по инструкции производителя под руководством преподавателя.</p>'
      : '';
    document.title = `${title} · AMK SkillHub`;
    root.innerHTML = `
      <div class="lesson-head"><div class="container stack">
        <a href="${href(slug)}">← Все уроки курса</a>
        <p class="eyebrow">${course[0]} / Урок ${String(requested).padStart(2, '0')} из ${data[slug].length}</p>
        <h1>${title}</h1>
        <div class="lesson-progress-chips" aria-label="Этапы урока">
          <span class="lesson-step-chip" id="chip-game-step" data-done="${gameDone ? 'true' : 'false'}">01 · Интерактивная игра-тема</span>
          <span class="lesson-step-chip" data-done="true">02 · Объяснение и пример</span>
          <span class="lesson-step-chip" data-done="true">03 · 3D-модель и тренажёр</span>
          <span class="lesson-step-chip" id="chip-quiz-step" data-done="false">04 · Проверка знаний</span>
          <button type="button" class="button lesson-bookmark-btn" id="lesson-bookmark-btn" aria-pressed="${bookmarks.includes(key) ? 'true' : 'false'}" style="min-height:32px;padding:0.2rem 0.7rem;font-size:0.78rem;">${bookmarks.includes(key) ? '★ В закладках' : '☆ В закладки'}</button>
        </div>
      </div></div>
      <div class="container lesson-layout">
        <nav class="catalog-menu lesson-nav" aria-label="Разделы урока">
          <a href="#visual">0. Игра по теме</a><a href="#explanation">1. Объяснение</a><a href="#example">2. Пример</a><a href="#model">3. 3D-модель и тренажёр</a><a href="#exercise">4. Задание</a>
        </nav>
        <article>
          <section id="visual" class="lesson-visual-card">
            <div class="lesson-visual-head">
              <span class="eyebrow">01 · Интерактивное освоение темы</span>
              <span class="lesson-visual-meta">3 УНИКАЛЬНЫХ РАУНДА · СИТУАЦИЯ → МЕХАНИКА → ПРАВИЛО</span>
            </div>
            <div id="academy-topic-game-mount"></div>
            <div class="actions">
              <a class="button primary" href="lesson_player.html?catalog=1&amp;specialty=${slug}&amp;task=${requested}">Открыть полный 8-этапный урок →</a>
            </div>
          </section>
          <section id="explanation" class="card"><p class="eyebrow">01 / Разберитесь</p><h2>Главная идея</h2><p data-concept></p></section>
          <section id="example" class="card example"><p class="eyebrow">02 / Посмотрите решение</p><h2>Разбор примера</h2><p data-example></p>${safety}</section>
          ${hasModel ? `<section id="model" class="card">
            <p class="eyebrow">03 / Интерактивный 3D-стенд и симулятор профессии</p>
            <h2>3D-модель узла и практический тренажёр по теме</h2>
            <p class="muted">Вращайте 3D-модель, включайте взрыв-схему, меняйте рабочие параметры на слайдере телеметрии и отработайте навык в тренажёре.</p>
            <div id="academy-lesson-3d-hub"></div>
            <div class="actions" style="margin-top:0.75rem;">
              <a class="button" href="lesson_player.html?catalog=1&amp;specialty=${slug}&amp;task=${requested}&amp;view=model">Открыть на весь экран в 8-этапном плеере →</a>
            </div>
          </section>` : ''}
          <section id="exercise" class="card"><p class="eyebrow">04 / Примените знания</p><h2>Проверьте себя</h2><p data-question></p>
            <div class="stack" data-choices></div>
            <p class="answer-result" role="status" hidden></p>
            <p data-sync class="muted" role="status"></p>
            <div class="actions" data-next hidden><a class="button dark" href="${next}">${requested < data[slug].length ? 'Следующий урок →' : 'Вернуться к программе'}</a></div>
          </section>
          ${course[2] ? `<p class="muted"><a href="${course[2]}">Справочный материал по направлению</a></p>` : ''}
        </article>
      </div>`;
    mountCourseInteractiveHub(document.getElementById('academy-lesson-3d-hub'), slug, requested);
    const gameChip = root.querySelector('#chip-game-step');
    if (window.TopicGameEngine && document.getElementById('academy-topic-game-mount')) {
      window.TopicGameEngine.mount({
        containerId: 'academy-topic-game-mount',
        spec: slug,
        taskNum: requested,
        title: title,
        summary: concept,
        chunks: [
          { heading: 'Главная идея', text: concept, callout: { text: explanation } },
          { heading: 'Разбор примера', text: example, callout: { text: correct } }
        ],
        savedState: savedGameState,
        alreadyCompleted: gameDone,
        onComplete: (res) => {
          try {
            localStorage.setItem(gameStoreKey, JSON.stringify(res || { game_completed: true }));
          } catch {}
          if (gameChip) gameChip.dataset.done = 'true';
          if (window.PrismFX) {
            window.PrismFX.play('good');
            const mountEl = document.getElementById('academy-topic-game-mount');
            if (mountEl) {
              const r = mountEl.getBoundingClientRect();
              window.PrismFX.burst(r.left + r.width * 0.5, r.top + 80, 24, true);
              window.PrismFX.spawnFloat(r.left + r.width * 0.5, r.top + 60, '+25 XP ✓', true);
            }
          }
        }
      });
    }
    root.querySelector('[data-concept]').textContent = concept;
    root.querySelector('[data-example]').textContent = example;
    root.querySelector('[data-question]').textContent = question;
    const options = root.querySelector('[data-choices]');
    const result = root.querySelector('.answer-result');
    const nextAction = root.querySelector('[data-next]');
    let passed = completed.includes(key);
    const quizChip = root.querySelector('#chip-quiz-step');
    const markBtn = root.querySelector('#lesson-bookmark-btn');
    if (markBtn) {
      markBtn.addEventListener('click', () => {
        const idx = bookmarks.indexOf(key);
        if (idx === -1) bookmarks.push(key);
        else bookmarks.splice(idx, 1);
        const on = idx === -1;
        markBtn.setAttribute('aria-pressed', String(on));
        markBtn.textContent = on ? '★ В закладках' : '☆ В закладки';
        try { localStorage.setItem(markKey, JSON.stringify(bookmarks)); } catch {}
        if (on && window.PrismFX) window.PrismFX.play('good');
      });
    }
    if (passed) {
      nextAction.hidden = false;
      if (quizChip) quizChip.dataset.done = 'true';
    }

    for (const [idx, choice] of choices.entries()) {
      const button = document.createElement('button');
      button.className = 'button answer reveal-item';
      button.style.setProperty('--reveal-delay', `${idx * 60}ms`);
      button.type = 'button';
      button.textContent = choice;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        for (const option of options.children) option.setAttribute('aria-pressed', String(option === button));
        const right = choice === correct;
        result.hidden = false;
        result.dataset.correct = String(right);
        result.textContent = right ? `Верно. ${explanation}` : 'Попробуйте ещё раз. Сравните варианты с разобранным примером выше.';
        if (right) {
          if (quizChip) quizChip.dataset.done = 'true';
          if (window.PrismFX) {
            const rect = button.getBoundingClientRect();
            const cx = rect.left + rect.width * 0.5;
            const cy = rect.top + rect.height * 0.5;
            window.PrismFX.burst(cx, cy, 24, true);
            window.PrismFX.spawnFloat(cx, rect.top - 8, '+25 XP ✓', true);
          }
          if (!passed) {
            passed = true;
            completed.push(key);
            try {
              localStorage.setItem(storeKey, JSON.stringify(completed));
              root.querySelector('[data-sync]').textContent = 'Прогресс сохранён в этом браузере.';
            } catch {}
            nextAction.hidden = false;
          }
          saveAccountProgress();
        }
      });
      options.append(button);
    }
  }

  if (lesson) renderLesson();
  else catalog();
  readAccountProgress();
})();
