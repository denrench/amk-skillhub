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
  const models = new Set(['it:7', 'graphic_design:8', 'autoelectric:3', 'autoelectric:8', 'hvac:1', 'automechanic:1']);
  const params = new URLSearchParams(location.search);
  const selected = params.get('course');
  const slug = Object.hasOwn(courses, selected) ? selected : 'it';
  const course = courses[slug];
  const requested = Number(params.get('lesson'));
  const lesson = Number.isInteger(requested) && requested > 0 ? data[slug][requested - 1] : null;

  const storeKey = 'skillhub.academy.completed.v1';
  const serverProgress = !location.hostname.endsWith('.github.io');
  let accountProgress = new Set();
  let completed = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey) || '[]');
    if (Array.isArray(saved)) completed = saved;
  } catch {}

  function href(target, number) {
    return `learn.html?course=${target}${number ? `&lesson=${number}` : ''}`;
  }

  async function readAccountProgress() {
    if (!serverProgress) return;
    try {
      const response = await fetch('/api/academy/progress', {signal: AbortSignal.timeout(4500)});
      if (!response.ok) return;
      const progData = await response.json();
      accountProgress = new Set(progData.completed || []);
      const unlockedDay = Number(progData.current_study_day || 12);
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
      const response = await fetch('/api/academy/progress', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({specialty: slug, lesson: requested}), signal: AbortSignal.timeout(4500),
      });
      if (response.ok) {
        accountProgress.add(`${slug}:${requested}`);
        root.querySelector('[data-sync]').textContent = 'Прогресс сохранён в аккаунте.';
      }
    } catch {}
  }

  function catalog() {
    const list = data[slug];
    const rows = list.map(([title], index) => {
      const number = index + 1;
      const done = completed.includes(`${slug}:${number}`);
      return `<a class="lesson-row" style="--reveal-delay:${index * 28}ms" href="${href(slug, number)}"><span class="course-num">${String(number).padStart(2, '0')}</span>
        <strong>${title}</strong><small data-lesson-key="${slug}:${number}">${done ? 'Пройдено' : 'Текст и практика'}</small></a>`;
    }).join('');
    root.innerHTML = `
      <div class="container catalog-head stack"><p class="eyebrow">5 специальностей / 60 уроков</p><h1>Учебник</h1>
      <p class="muted">Выберите направление. В каждом уроке есть объяснение, разобранный пример и задача с обратной связью.</p></div>
      <div class="container section catalog-layout">
        <nav class="catalog-menu" aria-label="Специальности">${Object.entries(courses).map(([id, entry]) =>
          `<a href="${href(id)}"${id === slug ? ' aria-current="page"' : ''}>${entry[0]}</a>`).join('')}</nav>
        <section class="card"><p class="eyebrow">Программа курса</p><h2>${course[0]}</h2><p class="muted">${course[1]}</p>
        <div>${rows}</div></section>
      </div>`;
  }

  function renderLesson() {
    const [title, concept, example, question, correct, incorrect, explanation] = lesson;
    const key = `${slug}:${requested}`;
    const choices = requested % 2 ? [incorrect, correct] : [correct, incorrect];
    const hasModel = models.has(key);
    const next = requested < data[slug].length ? href(slug, requested + 1) : href(slug);
    const mediaBase = key === 'autoelectric:3'
      ? { mp4: 'assets/starter-lesson/overview.mp4', jpg: 'assets/starter-lesson/poster.jpg', vtt: 'assets/starter-lesson/captions-ru.vtt' }
      : { mp4: `assets/lesson-intros/${slug}-${requested}.mp4`, jpg: `assets/lesson-intros/${slug}-${requested}.jpg`, vtt: `assets/lesson-intros/${slug}-${requested}.vtt` };
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
          <span class="lesson-step-chip" data-done="true">01 · Видео-схема 10 сек</span>
          <span class="lesson-step-chip" data-done="true">02 · Объяснение и пример</span>
          <span class="lesson-step-chip" id="chip-quiz-step" data-done="false">03 · Проверка знаний</span>
        </div>
      </div></div>
      <div class="container lesson-layout">
        <nav class="catalog-menu lesson-nav" aria-label="Разделы урока">
          <a href="#visual">0. Видео-схема 10 сек</a><a href="#explanation">1. Объяснение</a><a href="#example">2. Пример</a><a href="#exercise">3. Задание</a>
          ${hasModel ? '<a href="#model">4. 3D-модель</a>' : ''}
        </nav>
        <article>
          <section id="visual" class="lesson-visual-card">
            <div class="lesson-visual-head">
              <span class="eyebrow">10-секундная визуальная схема темы</span>
              <span class="lesson-visual-meta">ПРОБЛЕМА «ДО» → МЕХАНИКА → ЭТАЛОН «ПОСЛЕ»</span>
            </div>
            <video class="academy-media" controls muted playsinline preload="metadata" poster="${mediaBase.jpg}" src="${mediaBase.mp4}" aria-label="Видео-разбор темы урока">
              <track kind="captions" src="${mediaBase.vtt}" srclang="ru" label="Русские субтитры" default>
            </video>
            <div class="actions">
              <a class="button primary" href="lesson_player.html?catalog=1&amp;specialty=${slug}&amp;lesson=${requested}">Открыть интерактивный тренажёр урока →</a>
            </div>
          </section>
          <section id="explanation" class="card"><p class="eyebrow">01 / Разберитесь</p><h2>Главная идея</h2><p data-concept></p></section>
          <section id="example" class="card example"><p class="eyebrow">02 / Посмотрите решение</p><h2>Разбор примера</h2><p data-example></p>${safety}</section>
          <section id="exercise" class="card"><p class="eyebrow">03 / Примените знания</p><h2>Проверьте себя</h2><p data-question></p>
            <div class="stack" data-choices></div>
            <p class="answer-result" role="status" hidden></p>
            <p data-sync class="muted" role="status"></p>
            <div class="actions" data-next hidden><a class="button dark" href="${next}">${requested < data[slug].length ? 'Следующий урок →' : 'Вернуться к программе'}</a></div>
          </section>
          ${hasModel ? `<section id="model" class="card"><h2>Исследуйте модель</h2><p class="muted">Выберите детали, чтобы увидеть их назначение в учебной схеме.</p>
          <div><a class="button" href="lesson_player.html?catalog=1&amp;specialty=${slug}&amp;task=${requested}&amp;view=model">Открыть интерактивный стенд</a></div></section>` : ''}
          ${course[2] ? `<p class="muted"><a href="${course[2]}">Справочный материал по направлению</a></p>` : ''}
        </article>
      </div>`;
    root.querySelector('[data-concept]').textContent = concept;
    root.querySelector('[data-example]').textContent = example;
    root.querySelector('[data-question]').textContent = question;
    const options = root.querySelector('[data-choices]');
    const result = root.querySelector('.answer-result');
    const nextAction = root.querySelector('[data-next]');
    let passed = completed.includes(key);
    const quizChip = root.querySelector('#chip-quiz-step');
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
