(() => {
  const element = selector => document.querySelector(selector);
  const gate = element('[data-gate]');
  const gateStatus = element('[data-gate-status]');
  const dashboard = element('[data-dashboard]');
  const logout = element('[data-logout]');
  const staticHost = location.hostname.endsWith('.github.io');

  async function request(path, options = {}) {
    const response = await fetch(path, {
      ...options, cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function addListItem(list, title, subtitle, href, index = 0) {
    const item = document.createElement('li');
    item.style.setProperty('--reveal-delay', `${index * 45}ms`);
    const heading = document.createElement(href ? 'a' : 'strong');
    if (href) heading.href = href;
    heading.textContent = title;
    const text = document.createElement('p');
    text.className = 'muted';
    text.textContent = subtitle;
    item.append(heading, text);
    list.append(item);
    return item;
  }

  async function showReading(slug, course) {
    const status = element('[data-reading-status]');
    const link = element('[data-continue]');
    link.href = `learn.html?course=${slug}`;
    try {
      const lessons = window.AcademyLessons[slug];
      const data = await request('/api/academy/progress');
      const completed = new Set(data.completed);
      const available = lessons.findIndex((_, index) => !completed.has(`${slug}:${index + 1}`));
      const count = lessons.filter((_, index) => completed.has(`${slug}:${index + 1}`)).length;
      element('[data-lesson-title]').textContent = available < 0 ? course : lessons[available][0];
      element('[data-count]').textContent = `${count} / ${lessons.length}`;
      const progress = element('[data-progress]');
      progress.max = lessons.length;
      progress.value = count;
      progress.hidden = false;
      if (available < 0) {
        status.textContent = 'Все уроки направления пройдены. Можно вернуться к программе и повторить темы.';
        link.textContent = 'Повторить материал';
      } else {
        status.textContent = `Урок ${available + 1} · ${course}`;
        link.href += `&lesson=${available + 1}`;
        link.textContent = 'Продолжить урок';
      }
    } catch {
      status.textContent = 'Прогресс не загрузился. Учебник остаётся доступен.';
    }
  }

  async function showPractice(slug, id) {
    const status = element('[data-practice-status]');
    const list = element('[data-practice-list]');
    const query = new URLSearchParams({specialty: slug, user_id: id});
    element('[data-practice-link]').href = `tasks.html?specialty=${slug}`;
    try {
      const data = await request(`/api/tasks?${query}`);
      const tasks = data.tasks.filter(task => !task.is_locked && !task.is_pro_locked);
      const outstanding = tasks.filter(task => task.status_code !== 'graded');
      status.textContent = !tasks.length ? 'По графику пока нет открытых заданий.' :
        outstanding.length ? 'Открытые задания и работы на проверке.' : 'Все открытые задания зачтены.';
      for (const [idx, task] of outstanding.slice(0, 4).entries()) {
        const href = task.status_code === 'submitted' ? `tasks.html?specialty=${slug}` :
          `simulator.html?specialty=${slug}&task=${Number(task.task_number)}`;
        addListItem(list, task.title, task.status_label || 'Открыто', href, idx);
      }
    } catch {
      status.textContent = 'Не удалось загрузить задания. Откройте список практикума или обновите страницу.';
    }
  }

  async function showNotices() {
    const status = element('[data-notice-status]');
    const list = element('[data-notice-list]');
    const mark = element('[data-read-notices]');
    try {
      const data = await request('/api/notifications');
      list.replaceChildren();
      const notices = data.notifications;
      status.textContent = !notices.length ? 'Пока нет объявлений.' :
        data.unread_count ? `Непрочитано: ${data.unread_count}` : 'Все объявления прочитаны.';
      for (const [idx, notice] of notices.slice(0, 5).entries()) {
        const item = addListItem(list, notice.title, notice.body, null, idx);
        if (!notice.is_read) item.dataset.unread = 'true';
      }
      mark.hidden = !data.unread_count;
    } catch {
      status.textContent = 'Не удалось загрузить объявления.';
    }
  }

  function showSignIn() {
    gateStatus.textContent = staticHost
      ? 'Кабинет доступен на сервере аккаунтов. Учебник можно читать без входа.'
      : 'Войдите, чтобы увидеть свой прогресс и задания.';
    element('[data-gate-actions]').hidden = false;
  }

  async function start() {
    if (staticHost) return showSignIn();
    try {
      const data = await request('/api/auth/session');
      if (!data.authenticated) return showSignIn();
      const user = data.user;
      if (user.role !== 'student') {
        location.replace(user.role === 'admin' ? 'admin.html' : 'teacher.html');
        return;
      }
      const slug = Object.hasOwn(window.AcademyLessons, user.specialty_slug) ? user.specialty_slug : 'it';
      const course = window.EDU_COURSES.find(item => item.slug === slug);
      const title = course?.short_title || 'Текущий курс';
      element('[data-greeting]').textContent = `Здравствуйте, ${user.full_name}!`;
      element('[data-context]').textContent = [title, user.group_name].filter(Boolean).join(' · ');
      gate.hidden = true;
      dashboard.hidden = false;
      logout.hidden = false;
      await Promise.all([showReading(slug, title), showPractice(slug, user.id), showNotices()]);
    } catch {
      gateStatus.textContent = 'Сервер аккаунтов временно недоступен.';
      element('[data-reload]').hidden = false;
    }
  }

  element('[data-reload]').addEventListener('click', () => location.reload());
  element('[data-read-notices]').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await request('/api/notifications/read', {method:'POST'});
      await showNotices();
    } catch {
      element('[data-notice-status]').textContent = 'Не удалось отметить объявления. Попробуйте снова.';
    } finally {
      button.disabled = false;
    }
  });
  logout.addEventListener('click', async () => {
    logout.disabled = true;
    try {
      await request('/api/auth/logout', {method:'POST'});
    } catch {
      element('[data-dashboard-status]').textContent = 'Не удалось завершить сессию. Попробуйте ещё раз.';
      logout.disabled = false;
      return;
    }
    try {
      localStorage.removeItem('eduspace_active_session_v3');
      localStorage.removeItem('currentUser');
      document.cookie = 'user_id=; path=/; max-age=0';
      document.cookie = 'user_role=; path=/; max-age=0';
    } catch {}
    location.replace('auth.html?mode=login');
  });
  start();
})();
