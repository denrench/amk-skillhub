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

  function mountCourseInteractiveHub(containerEl) {
    if (containerEl) {
      containerEl.innerHTML = '';
      containerEl.hidden = true;
    }
    disposeActiveModel?.();
    disposeActiveModel = null;
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
    const [title, concept, example] = lesson;
    const key = `${slug}:${requested}`;
    const next = requested < data[slug].length ? href(slug, requested + 1) : href(slug);
    const catList = (window.EDU_LESSONS && window.EDU_LESSONS[slug]) || [];
    const catItem = catList.find(x => Number(x.num) === requested) || catList[requested - 1] || null;
    const toolsText = (catItem && catItem.tools) || 'Профильные стандарты специальности';
    const rawTheoryHtml = (catItem && catItem.theory) ? String(catItem.theory) : '';
    const theoryPlain = rawTheoryHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const safety = ['autoelectric', 'automechanic', 'hvac'].includes(slug)
      ? '<p class="muted" style="margin-top:0.75rem;">⚠️ Техника безопасности: любые работы с реальным оборудованием выполняются по регламенту производителя под контролем мастера производственного обучения.</p>'
      : '';
    let passed = completed.includes(key);
    document.title = `${title} · Учебник AMK SkillHub`;
    root.innerHTML = `
      <div class="lesson-head"><div class="container stack">
        <a href="${href(slug)}">← Все главы учебника курса</a>
        <p class="eyebrow">${course[0]} / Глава ${String(requested).padStart(2, '0')} из ${data[slug].length} · Теоретический справочник</p>
        <h1>${title}</h1>
        <div class="lesson-progress-chips" aria-label="Разделы главы">
          <span class="lesson-step-chip" data-done="true">01 · Суть и теория</span>
          <span class="lesson-step-chip" data-done="true">02 · Разбор на практике</span>
          <span class="lesson-step-chip" id="chip-quiz-step" data-done="${passed ? 'true' : 'false'}">03 · Готовность к практикуму</span>
          <button type="button" class="button" id="lesson-voice-btn" style="min-height:32px;padding:0.2rem 0.75rem;font-size:0.78rem;">🔊 Прослушать главу</button>
          <button type="button" class="button lesson-bookmark-btn" id="lesson-bookmark-btn" aria-pressed="${bookmarks.includes(key) ? 'true' : 'false'}" style="min-height:32px;padding:0.2rem 0.7rem;font-size:0.78rem;">${bookmarks.includes(key) ? '★ В закладках' : '☆ В закладки'}</button>
        </div>
      </div></div>
      <div class="container lesson-layout">
        <nav class="catalog-menu lesson-nav" aria-label="Разделы главы">
          <a href="#explanation">1. Теоретическая основа</a>
          <a href="#example">2. Применение в работе</a>
          <a href="#deep-dive">3. Технологические нюансы</a>
          <a href="#practice-cta">4. Переход в практикум</a>
        </nav>
        <article>
          <section id="explanation" class="card">
            <p class="eyebrow">01 / Теоретическая основа</p>
            <h2>Как это устроено</h2>
            <p data-concept style="font-size:1.02rem;line-height:1.7;"></p>
            <p class="muted" style="margin-top:0.75rem;font-size:0.86rem;">Ключевые инструменты направления: <strong>${toolsText}</strong></p>
          </section>

          <section id="example" class="card example">
            <p class="eyebrow">02 / Применение в реальной работе</p>
            <h2>Инженерный контекст и разбор ситуации</h2>
            <p data-example style="line-height:1.7;"></p>
            ${safety}
          </section>

          <section id="deep-dive" class="card">
            <p class="eyebrow">03 / Углублённая теория</p>
            <h2>На что обращает внимание специалист</h2>
            <div style="line-height:1.7;" data-deep-theory></div>
            <p class="muted" style="margin-top:0.9rem;font-size:0.84rem;">💡 В учебнике даётся фундаментальное понимание темы без готовых ответов на контрольные задания — проверьте свои знания самостоятельно в интерактивном практикуме!</p>
          </section>

          <section id="practice-cta" class="card">
            <p class="eyebrow">04 / Закрепление и оценка ИИ</p>
            <h2>Готовы применить знания на живом стенде?</h2>
            <p class="muted">Откройте интерактивный урок с живым симулятором, напишите самостоятельное решение и получите оценку с подробным разбором от Gemini AI.</p>
            <div class="actions" style="margin-top:0.85rem;display:flex;flex-wrap:wrap;gap:10px;">
              <a class="button primary" href="lesson_player.html?catalog=1&amp;specialty=${slug}&amp;task=${requested}">Открыть интерактивный урок и практикум →</a>
              <button type="button" class="button" id="mark-chapter-read-btn">${passed ? '✓ Глава изучена' : 'Отметить главу изученной'}</button>
              <a class="button" href="${next}">${requested < data[slug].length ? 'Следующая глава →' : 'К оглавлению курса'}</a>
            </div>
            <p data-sync class="muted" role="status" style="margin-top:0.5rem;"></p>
          </section>
          ${course[2] ? `<p class="muted"><a href="${course[2]}">Справочный материал по направлению</a></p>` : ''}
        </article>
      </div>`;

    root.querySelector('[data-concept]').textContent = concept;
    root.querySelector('[data-example]').textContent = example;
    const deepEl = root.querySelector('[data-deep-theory]');
    if (deepEl) {
      if (rawTheoryHtml) {
        deepEl.innerHTML = rawTheoryHtml;
      } else {
        deepEl.textContent = 'Понимание базовых физических и программных закономерностей позволяет находить причины ошибок системно, не прибегая к методу проб и ошибок.';
      }
    }

    let speaking = false;
    const voiceBtn = root.querySelector('#lesson-voice-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        if (!window.speechSynthesis) return;
        if (speaking) {
          window.speechSynthesis.cancel();
          speaking = false;
          voiceBtn.textContent = '🔊 Прослушать главу';
          return;
        }
        window.speechSynthesis.cancel();
        const textToRead = `${title}. ${concept} ${example} ${theoryPlain.slice(0, 500)}`;
        const utt = new SpeechSynthesisUtterance(textToRead);
        utt.lang = 'ru-RU';
        utt.rate = 1.02;
        utt.onend = () => { speaking = false; voiceBtn.textContent = '🔊 Прослушать главу'; };
        speaking = true;
        voiceBtn.textContent = '⏹ Остановить озвучку';
        window.speechSynthesis.speak(utt);
      });
    }

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
      });
    }

    const readBtn = root.querySelector('#mark-chapter-read-btn');
    const quizChip = root.querySelector('#chip-quiz-step');
    if (readBtn) {
      readBtn.addEventListener('click', () => {
        if (!passed) {
          passed = true;
          completed.push(key);
          try {
            localStorage.setItem(storeKey, JSON.stringify(completed));
          } catch {}
          if (quizChip) quizChip.dataset.done = 'true';
          readBtn.textContent = '✓ Глава изучена';
          const syncEl = root.querySelector('[data-sync]');
          if (syncEl) syncEl.textContent = 'Прогресс чтения учебника сохранён.';
          saveAccountProgress();
        }
      });
    }
  }

  if (lesson) renderLesson();
  else catalog();
  readAccountProgress();
})();
