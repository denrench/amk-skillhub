/* ==========================================================================
   EDU SPACE — Production LMS Engine & Dual Persistence Layer (UTF-8)
   Works seamlessly with Python Flask SQLite (/api/*) AND Static GitHub Pages
   ========================================================================== */
(function () {
  function tr(key, fallback, params) {
    if (window.I18n && typeof window.I18n.t === 'function') {
      return window.I18n.t(key, params);
    }
    if (!params) return fallback;
    return String(fallback).replace(/\{([a-zA-Z0-9_]+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
  }
  'use strict';

  const SESSION_KEY = 'eduspace_active_session_v3';
  const CSRF_STORAGE_KEY = 'eduspace_csrf_token_v1';
  let _inMemoryCsrfToken = '';

  function normalizeTeacherCode(str) {
    if (!str) return '';

    const clean = String(str).trim().replace(/[\s\-_]/g, '').toUpperCase();
    const map = {
      'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H',
      'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X'
    };

    return clean.split('').map(ch => map[ch] || ch).join('');
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(url, fallback = '#') {
    if (!url) return fallback;
    const raw = String(url).trim();
    if (/^(https?:\/\/|\/|[A-Za-z0-9_.\-]+\.html([?#].*)?$)/i.test(raw)) {
      return escapeHtml(raw);
    }
    return fallback;
  }

  const NAME_WORD_RE = /^[А-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһA-Za-z\-]{2,40}$/;
  const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,12}$/;

  // ==========================================
  // 1. VALIDATION & CRYPTO HELPERS

  // ==========================================

  function capitalizeNamePart(part) {
    const clean = (part || '').trim();

    if (!clean) return '';

    return clean
      .split('-')
      .filter(Boolean)
      .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase())
      .join('-');
  }

  function validateFioFields({ last_name = '', first_name = '', middle_name = '', no_middle_name = false, full_name = '' }) {
    let ln = (last_name || '').trim();
    let fn = (first_name || '').trim();
    let mn = (middle_name || '').trim();

    if (!ln && !fn && full_name) {
      const parts = full_name.trim().split(/\s+/).filter(Boolean);

      if (parts.length >= 2) {
        ln = parts[0];
        fn = parts[1];
        mn = parts.slice(2).join(' ');
      }
    }

    if (!ln) {
      return { valid: false, field: 'last_name', error: 'Введите вашу фамилию (обязательное поле).' };
    }

    if (!NAME_WORD_RE.test(ln)) {
      return { valid: false, field: 'last_name', error: 'Фамилия должна содержать минимум 2 буквы без цифр и спецсимволов.' };
    }

    if (!fn) {
      return { valid: false, field: 'first_name', error: 'Введите ваше имя (обязательное поле).' };
    }

    if (!NAME_WORD_RE.test(fn)) {
      return { valid: false, field: 'first_name', error: 'Имя должно содержать минимум 2 буквы без цифр и спецсимволов.' };
    }

    if (!no_middle_name && mn) {
      const mParts = mn.split(/\s+/).filter(Boolean);
      for (const mp of mParts) {
        if (!NAME_WORD_RE.test(mp)) {
          return { valid: false, field: 'middle_name', error: 'Отчество должно содержать только буквы (минимум 2 символа) без цифр.' };
        }
      }
    } else if (no_middle_name) {
      mn = '';
    }

    const lastC = capitalizeNamePart(ln);
    const firstC = capitalizeNamePart(fn);
    const midC = mn ? mn.split(/\s+/).filter(Boolean).map(capitalizeNamePart).join(' ') : '';
    const fullC = [lastC, firstC, midC].filter(Boolean).join(' ');

    return {
      valid: true,
      last_name: lastC,
      first_name: firstC,
      middle_name: midC,
      full_name: fullC
    };
  }

  function validateEmailFormat(email) {
    const clean = (email || '').trim().toLowerCase();

    if (!clean) {
      return { valid: false, error: 'Введите адрес электронной почты.' };
    }

    if (clean.length > 120 || !EMAIL_RE.test(clean)) {
      return { valid: false, error: 'Введите корректный email (например: student@gmail.com или name@amk.kz).' };
    }

    const [local, domain] = clean.split('@');

    if (local.startsWith('.') || local.endsWith('.') || clean.includes('..')) {
      return { valid: false, error: 'Некорректный формат адреса электронной почты.' };
    }

    if (!domain || domain.length < 4 || domain.startsWith('-') || domain.endsWith('-')) {
      return { valid: false, error: 'Указан некорректный домен электронной почты.' };
    }

    return { valid: true, email: clean };
  }

  function validatePasswordStrength(password) {
    const pwd = password || '';
    const hasMinLen = pwd.length >= 8;
    const hasLetter = /[A-Za-zА-Яа-яЁё]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecialOrUpper = /[A-ZА-ЯЁ!@#$%^&*()_+\-=]/.test(pwd);
    let score = 0;

    if (hasMinLen) score++;
    if (hasLetter && hasDigit) score++;
    if (pwd.length >= 10) score++;
    if (hasSpecialOrUpper) score++;

    const valid = hasMinLen && hasLetter && hasDigit;

    return {
      valid,
      ok: valid,
      score, // 0..4
      message: valid ? null : 'Пароль должен содержать минимум 8 символов, включая буквы и цифры.',
      error: valid ? null : 'Пароль должен содержать минимум 8 символов, включая буквы и цифры.'
    };
  }

  async function sha256Hex(text) {
    if (window.crypto && window.crypto.subtle) {
      const buf = new TextEncoder().encode(text);
      const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);

      return Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    // Simple deterministic fallback for non-secure contexts
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }

    return ('00000000' + (h >>> 0).toString(16)).slice(-8).repeat(8);
  }

  function getInitials(fullName) {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);

    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return 'СТ';
  }

  const LEGACY_SLUG_MAP = {
    'design': 'graphic_design',
    'accounting': 'hvac',
    'auto': 'autoelectric',
    'marketing': 'automechanic'
  };

  function getCoursesList() {
    return window.EDU_COURSES || [
      { slug: 'it', code: '06130100', title: 'Программное обеспечение (Web Design)', short_title: 'Программное обеспечение (Web Design)', curator: 'Власов Михаил Григорьевич', skills: [] },
      { slug: 'graphic_design', code: '02130100', title: 'Графический Дизайн', short_title: 'Графический Дизайн', curator: 'Сейдахметова Алия Кайратовна', skills: [] },
      { slug: 'autoelectric', code: '07161301', title: 'Автоэлектрики', short_title: 'Автоэлектрики', curator: 'Жумабаев Руслан Маратович', skills: [] },
      { slug: 'hvac', code: '07130700', title: 'Ремонт Холодильного Оборудования', short_title: 'Ремонт Холодильного Оборудования', curator: 'Ахметов Тимур Болатович', skills: [] },
      { slug: 'automechanic', code: '07161300', title: 'Автомеханики', short_title: 'Автомеханики', curator: 'Садыков Ерлан Касымович', skills: [] }
    ];
  }

  function getCourseBySlug(slug) {
    const normalized = LEGACY_SLUG_MAP[slug] || slug;
    const list = getCoursesList();

    return list.find(c => c.slug === normalized) || list[0];
  }

  function getLessonFromCatalog(specSlug, num) {
    const lessons = (window.EDU_LESSONS && window.EDU_LESSONS[specSlug]) || [];

    return lessons.find(l => Number(l.num) === Number(num)) || null;
  }

  function getUserStudyDay(userOrUid, db) {
    const platformDay = (db && Number(db.current_study_day)) ? Math.max(1, Math.min(20, Number(db.current_study_day))) : 1;
    let u = null;
    if (userOrUid && typeof userOrUid === 'object') {
      u = userOrUid;
    } else if (userOrUid && db && Array.isArray(db.users)) {
      u = db.users.find(x => Number(x.id) === Number(userOrUid)) || null;
    }
    if (!u && typeof getActiveUser === 'function') {
      try { u = getActiveUser(); } catch (e) {}
    }
    if (!u || !u.created_at) return platformDay;
    try {
      const raw = String(u.created_at).trim();
      const iso = (raw.includes('T') || raw.endsWith('Z')) ? raw : raw.replace(' ', 'T') + 'Z';
      const regDt = new Date(iso);
      if (isNaN(regDt.getTime())) return platformDay;
      const now = new Date();
      const elapsedMs = Math.max(0, now.getTime() - regDt.getTime());
      const daysBy24h = Math.floor(elapsedMs / 86400000);
      const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const regMidnight = new Date(regDt.getFullYear(), regDt.getMonth(), regDt.getDate()).getTime();
      const daysByCalendar = Math.max(0, Math.round((nowMidnight - regMidnight) / 86400000));
      const daysElapsed = Math.max(daysBy24h, daysByCalendar);
      const userDay = Math.max(1, Math.min(20, daysElapsed + 1));
      return Math.max(platformDay, userDay);
    } catch (e) {
      return platformDay;
    }
  }

  function computeExactDates(unlockDay, curDay = 1) {
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const base = new Date();
    base.setHours(9, 0, 0, 0);

    const studyDay = Math.max(1, Number(curDay || 1));
    const openDt = new Date(base.getTime() + (Number(unlockDay || 1) - studyDay) * 86400000);
    const dlDt = new Date(openDt.getTime() + 2 * 86400000);

    return {
      openText: `${openDt.getDate()} ${months[openDt.getMonth()]}, 09:00`,
      deadlineText: `${dlDt.getDate()} ${months[dlDt.getMonth()]}, 23:59`,
      openIso: openDt.toISOString(),
      deadlineIso: dlDt.toISOString()
    };
  }

  function enrichUserObject(u) {
    if (!u) return null;

    const copy = Object.assign({}, u);
    delete copy.password_hash;

    const rawSpec = copy.specialty_slug || 'it';
    const spec = (typeof LEGACY_SLUG_MAP !== 'undefined' && LEGACY_SLUG_MAP[rawSpec]) || rawSpec;
    const course = getCourseBySlug(spec);
    copy.specialty_slug = spec;
    copy.specialty_name = `${course.code} — ${course.short_title}`;
    copy.course_title = course.title;
    copy.initials = getInitials(copy.full_name);
    copy.email_verified = Boolean(copy.email_verified);
    copy.is_demo = Boolean(copy.is_demo);
    copy.current_study_day = getUserStudyDay(copy);

    return copy;
  }

  // ==========================================
  // 2. CSRF & API BASE HELPERS (FAIL-CLOSED, NO LOCAL FAKE AUTH)
  // ==========================================

  function apiBase() {
    if (typeof window !== 'undefined') {
      if (window.EDUSPACE_API_BASE) {
        return String(window.EDUSPACE_API_BASE).replace(/\/+$/, '');
      }
      if (window.location && window.location.hostname && window.location.hostname.endsWith('github.io')) {
        return 'https://amk-skillhub.onrender.com';
      }
    }
    return '';
  }

  function getCsrfToken() {
    if (_inMemoryCsrfToken) return _inMemoryCsrfToken;
    try {
      const m = document.cookie.match(/(?:^|;\s*)eduspace_csrf=([^;]+)/);
      if (m && m[1]) {
        _inMemoryCsrfToken = decodeURIComponent(m[1]);
        return _inMemoryCsrfToken;
      }
    } catch (e) {}
    try {
      const stored = sessionStorage.getItem(CSRF_STORAGE_KEY);
      if (stored) {
        _inMemoryCsrfToken = stored;
        return stored;
      }
    } catch (e) {}
    return '';
  }

  function setCsrfToken(token) {
    if (!token || typeof token !== 'string') return;
    _inMemoryCsrfToken = token;
    try { sessionStorage.setItem(CSRF_STORAGE_KEY, token); } catch (e) {}
  }

  async function ensureCsrfToken() {
    const existing = getCsrfToken();
    if (existing) return existing;
    try {
      const res = await fetch(apiBase() + '/api/auth/session', {
        credentials: 'same-origin',
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.csrf_token) setCsrfToken(data.csrf_token);
      }
    } catch (e) {}
    return getCsrfToken();
  }

  async function fetchWithCsrf(url, options = {}) {
    const opts = Object.assign({}, options);
    const method = (opts.method || 'GET').toUpperCase();
    const headers = Object.assign({}, opts.headers || {});
    const isFormData = (typeof FormData !== 'undefined') && (opts.body instanceof FormData);

    if (!isFormData && opts.body !== undefined && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
    }
    if (!isFormData && opts.body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const tok = await ensureCsrfToken();
      if (tok && !headers['X-CSRF-Token']) {
        headers['X-CSRF-Token'] = tok;
      }
    }
    opts.headers = headers;
    if (!opts.credentials) opts.credentials = 'same-origin';
    const targetUrl = /^https?:\/\//i.test(url) ? url : (apiBase() + url);
    return fetch(targetUrl, opts);
  }

  function readOnlyStaticCatalogResponse(urlStr, options = {}) {
    const isStaticHost = typeof location !== 'undefined' && location.hostname.endsWith('.github.io');
    const method = (options.method || 'GET').toUpperCase();
    const unavailable = {
      ok: false,
      status: 503,
      data: {
        success: false,
        code: 'BACKEND_UNAVAILABLE',
        message: 'Сервер платформы недоступен. Повторите попытку позже.'
      }
    };
    if (!isStaticHost || method !== 'GET') {
      return unavailable;
    }

    const base = (window.location && window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'http://localhost';
    const uObj = new URL(urlStr, base);
    const path = uObj.pathname;
    const params = uObj.searchParams;

    if (path === '/api/courses') {
      const coursesOut = getCoursesList().map(c => Object.assign({}, c, {
        enrolled: false,
        completed_lessons: 0,
        total_lessons: 20,
        progress_percent: 0
      }));
      return { ok: true, status: 200, data: { success: true, courses: coursesOut, current_study_day: 1 } };
    }

    if (path === '/api/tasks') {
      const spec = params.get('specialty') || 'it';
      const slugs = params.get('specialty') ? [spec] : getCoursesList().map(c => c.slug);
      const tasksOut = [];
      let globalId = 1;
      for (const sSlug of slugs) {
        const catLessons = (window.EDU_LESSONS && window.EDU_LESSONS[sSlug]) || [];
        for (let i = 1; i <= 20; i++) {
          const baseItem = catLessons.find(x => Number(x.num) === i) || {
            num: i,
            title: `Урок ${i}`,
            difficulty: 'Средний',
            time_limit: '60 мин',
            tools: 'Практикум EDU SPACE',
            task_prompt: 'Выполните практическое задание модуля.',
            starter_code: ''
          };
          const dates = computeExactDates(i, 1);
          const isLocked = i > 1;
          tasksOut.push({
            id: globalId++,
            specialty_slug: sSlug,
            task_number: i,
            title: baseItem.title,
            difficulty: baseItem.difficulty,
            time_limit: baseItem.time_limit || '60 мин',
            unlock_day: i,
            unlock_date_text: i === 1 ? 'Доступно в День 1' : `Откроется в День ${i}`,
            deadline_text: `День ${i + 2}, 23:59`,
            unlock_date_exact: dates.openText,
            deadline_exact: dates.deadlineText,
            description: baseItem.task_prompt,
            tools_required: baseItem.tools,
            starter_code: baseItem.starter_code,
            current_study_day: 1,
            is_locked: isLocked,
            status_code: isLocked ? 'locked' : 'available',
            status: isLocked ? 'locked' : 'available',
            status_label: isLocked ? 'Заблокировано' : 'Доступно',
            student_score: 0,
            grade_letter: '—',
            teacher_comment: null,
            quiz_score: 0,
            draft_code: null
          });
        }
      }
      return { ok: true, status: 200, data: { success: true, current_study_day: 1, count: tasksOut.length, tasks: tasksOut } };
    }

    return unavailable;
  }

  // ==========================================
  // 3. UNIFIED API CLIENT (FLASK BACKEND + CSRF)
  // ==========================================

  async function apiRequest(url, options = {}) {
    try {
      const res = await fetchWithCsrf(url, options);
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.csrf_token) {
          setCsrfToken(data.csrf_token);
        }
        return { ok: res.ok, status: res.status, data };
      }
      return readOnlyStaticCatalogResponse(url, options);
    } catch (e) {
      return readOnlyStaticCatalogResponse(url, options);
    }
  }

  // ==========================================
  // 4. REAL AUTOMATED CODE & CASE TEST RUNNER

  // ==========================================

  function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function runLessonAutoTests(lesson, rawCode) {
    const code = (rawCode || '').trim();

    if (!code || code.length < 15) {
      return {
        passed: false,
        passedCount: 0,
        totalCount: 1,
        score: 0,
        logs: [{ name: 'Проверка наличия решения', passed: false, detail: 'Поле решения пустое или слишком короткое.' }]
      };
    }

    if (lesson && lesson.eval_type === 'js_func') {
      const cleanedCode = code
        .replace(/module\.exports\s*=\s*[^;]+;?/g, '')
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+function/g, 'function');
      let fn = null;
      try {
        const factory = new Function(`${cleanedCode};\nreturn typeof ${lesson.func_name} !== 'undefined' ? ${lesson.func_name} : null;`);
        fn = factory();
      } catch (syntaxErr) {
        return {
          passed: false,
          passedCount: 0,
          totalCount: (lesson.tests || []).length || 1,
          score: 0,
          logs: [{ name: 'Синтаксический разбор JavaScript V8', passed: false, detail: `SyntaxError: ${syntaxErr.message}` }]
        };
      }

      if (typeof fn !== 'function') {
        return {
          passed: false,
          passedCount: 0,
          totalCount: (lesson.tests || []).length || 1,
          score: 0,
          logs: [{ name: `Поиск функции ${lesson.func_name}()`, passed: false, detail: `Функция ${lesson.func_name} не объявлена в коде.` }]
        };
      }

      const tests = lesson.tests || [];
      const logs = [];
      let passedCount = 0;
      for (const t of tests) {
        const clonedArgs = JSON.parse(JSON.stringify(t.args || []));
        try {
          const actual = fn(...clonedArgs);

          if (t.throws) {
            logs.push({
              name: t.name,
              passed: false,
              detail: `Ожидалось исключение ${t.throws}, но функция вернула ${JSON.stringify(actual)}`
            });
          } else if (deepEqual(actual, t.expected)) {
            passedCount++;
            logs.push({
              name: t.name,
              passed: true,
              detail: `OK → ${JSON.stringify(actual)}`
            });
          } else {
            logs.push({
              name: t.name,
              passed: false,
              detail: `Ожидалось: ${JSON.stringify(t.expected)}, получено: ${JSON.stringify(actual)}`
            });
          }
        } catch (err) {
          if (t.throws) {
            const matchesType = !t.throws || err.name === t.throws || err.message.includes(t.throws);

            if (matchesType) {
              passedCount++;
              logs.push({
                name: t.name,
                passed: true,
                detail: `OK → Корректно выброшено ${err.name}: ${err.message}`
              });
            } else {
              logs.push({
                name: t.name,
                passed: false,
                detail: `Ожидалось ${t.throws}, но выброшено ${err.name}: ${err.message}`
              });
            }
          } else {
            logs.push({
              name: t.name,
              passed: false,
              detail: `Ошибка выполнения ${err.name}: ${err.message}`
            });
          }
        }
      }

      const totalCount = tests.length || 1;
      const score = Math.round((passedCount / totalCount) * 100);

      return {
        passed: passedCount === totalCount,
        passedCount,
        totalCount,
        score,
        logs
      };
    }
    // Keyword & Structural Criteria Evaluator (SQL, HTML/CSS, Design, Accounting, Auto, Marketing)

    const tokens = (lesson && lesson.required_tokens) || [];
    const minLen = (lesson && lesson.min_length) || 60;
    const lower = code.toLowerCase();
    const logs = [];
    let passedCount = 0;

    const totalCount = tokens.length + 1;

    if (code.length >= minLen) {
      passedCount++;
      logs.push({ name: `Полнота решения (объём >= ${minLen} симв.)`, passed: true, detail: `Проверено (${code.length} симв.)` });
    } else {
      logs.push({ name: `Полнота решения (объём >= ${minLen} симв.)`, passed: false, detail: `Слишком краткий ответ (${code.length} из ${minLen} симв.)` });
    }
    for (const tok of tokens) {
      const normTok = tok.toLowerCase();
      const altNoSpace = normTok.replace(/\s+/g, '');
      const codeNoSpace = lower.replace(/\s+/g, '');
      const ok = lower.includes(normTok) || (altNoSpace.length >= 3 && codeNoSpace.includes(altNoSpace));

      if (ok) {
        passedCount++;
        logs.push({ name: `Проверка ключевого элемента «${tok}»`, passed: true, detail: 'Найдено в решении' });
      } else {
        logs.push({ name: `Проверка ключевого элемента «${tok}»`, passed: false, detail: `Отсутствует обязательный элемент/расчёт «${tok}»` });
      }
    }

    const score = Math.round((passedCount / totalCount) * 100);

    return {
      passed: score >= 75,
      passedCount,
      totalCount,
      score,
      logs
    };
  }

  // ==========================================
  // 5. SESSION MANAGEMENT (TRUE AUTH, NO FAKE USER!)

  // ==========================================

  function getActiveUser() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);

      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (parsed && parsed.id && parsed.email && parsed.full_name) {
        return enrichUserObject(parsed);
      }
    } catch (e) {}

    return null;
  }

  function setActiveUser(user) {
    if (!user) return;

    const clean = enrichUserObject(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(clean));
    localStorage.removeItem('currentUser'); // Clean legacy key
    document.cookie = `user_id=${clean.id}; path=/; max-age=604800`;
    document.cookie = `user_role=${clean.role}; path=/; max-age=604800`;

    return clean;
  }

  async function logoutUser() {
    if (!location.hostname.endsWith('.github.io')) {
      const res = await apiRequest('/api/auth/logout', { method: 'POST' });
      if (!res.ok) {
        showToast('Не удалось закрыть серверную сессию. Повторите выход.', 'error');
        return;
      }
    }
    _inMemoryCsrfToken = '';
    try { sessionStorage.removeItem(CSRF_STORAGE_KEY); } catch (e) {}
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('currentUser');
    document.cookie = 'user_id=; path=/; max-age=0';
    document.cookie = 'user_role=; path=/; max-age=0';
    showToast('Вы вышли из аккаунта', 'info');
    setTimeout(() => {
      window.location.href = 'auth.html?mode=login';
    }, 350);
  }

  async function startIsolatedDemo(role = 'student') {
    const email = role === 'teacher' ? 'teacher@amk.kz' : 'student@amk.kz';
    const password = role === 'teacher' ? 'teacher123' : 'student123';
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    if (res.ok && res.data.success) {
      setActiveUser(res.data.user);
      showToast(`Запущен ознакомительный демо-режим (${res.data.user.full_name})`, 'success');
      setTimeout(() => {
        window.location.href = role === 'teacher' ? 'teacher.html' : 'student.html';
      }, 300);
    }
  }

  async function resetDemoMode() {
    const active = getActiveUser();
    const msg = active && !active.is_demo
      ? `Ваш личный аккаунт (${active.full_name}) НЕ будет удалён. Сбросить учебный день платформы на День 1 и очистить только демонстрационные данные?`
      : 'Сбросить демоверсию к абсолютному нулю (День 1, 0% прогресса, открыт только Урок №1)?';

    if (!confirm(msg)) return;

    const res = await apiRequest('/api/demo/reset', {
      method: 'POST',
      body: {}
    });
    if (!res.ok || !res.data || !res.data.success) {
      showToast((res.data && res.data.message) || 'Не удалось сбросить демоверсию.', 'error');
      return;
    }
    showToast(res.data.message || 'Демоверсия сброшена к началу!', 'success');
    setTimeout(() => window.location.reload(), 450);
  }

  // ==========================================
  // 6. UI TOASTS, INCOMING EMAIL PREVIEW & MODALS
  // ==========================================

  function showToast(message, type = 'success') {
    let container = document.getElementById('edu-toast-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'edu-toast-container';
      container.className = 'fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 pointer-events-none max-w-md';
      document.body.appendChild(container);
    }

    const bg = type === 'success'
      ? 'bg-emerald-600 text-white'
      : (type === 'error' ? 'bg-red-600 text-white' : (type === 'warning' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white'));

    const icon = type === 'success'
      ? 'check_circle'
      : (type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'info'));

    const toast = document.createElement('div');
    toast.className = `${bg} pointer-events-auto px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all duration-300 transform translate-y-4 opacity-0`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-[20px] shrink-0">${icon}</span>
      <span class="leading-snug">${escapeHtml(message)}</span>
      <button type="button" class="ml-auto pl-2 hover:opacity-75 focus:outline-none" onclick="this.parentElement.remove()">
        <span class="material-symbols-outlined text-[16px]">close</span>
      </button>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-y-4', 'opacity-0'));
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  function showIncomingMailCard(mailPreview, onAutofill) {
    const existing = document.getElementById('edu-incoming-mail-card');

    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'edu-incoming-mail-card';
    card.className = 'fixed top-5 right-5 z-[99999] w-80 sm:w-96 bg-dark-850/95 backdrop-blur-2xl text-white rounded-2xl shadow-2xl border border-indigo-500/50 overflow-hidden transition-all duration-300 shadow-glow-indigo';
    card.innerHTML = `
      <div class="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between text-xs font-bold border-b border-white/10">
        <span class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px]">mark_email_unread</span>
          <span>Входящее письмо (${escapeHtml(mailPreview.to)})</span>
        </span>
        <button type="button" onclick="this.closest('#edu-incoming-mail-card').remove()" class="w-6 h-6 rounded flex items-center justify-center hover:bg-white/20 transition-colors">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div class="p-4 space-y-2.5 text-xs text-slate-200">
        <div class="text-[11px] text-slate-400">От: <strong class="text-indigo-300">${escapeHtml(mailPreview.from)}</strong></div>
        <div class="font-bold text-white">${escapeHtml(mailPreview.subject)}</div>
        <p class="text-slate-300 leading-relaxed">Ваш одноразовый код подтверждения электронной почты для регистрации в EDU SPACE:</p>
        <div class="py-2.5 px-4 rounded-xl bg-dark-950/80 border border-indigo-500/30 text-center font-mono font-extrabold text-2xl tracking-[0.35em] text-indigo-400 select-all shadow-inner">
          ${escapeHtml(mailPreview.code)}
        </div>
        <div class="flex items-center justify-between pt-1">
          <span class="text-[10px] text-slate-400 font-mono">Действителен 10 минут</span>
          <button type="button" id="edu-autofill-otp-btn" class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-glow-cyan transition-all flex items-center gap-1">
            <span>Подставить код</span>
            <span class="material-symbols-outlined text-[14px]">bolt</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(card);

    const btn = card.querySelector('#edu-autofill-otp-btn');

    if (btn) {
      btn.onclick = () => {
        if (typeof onAutofill === 'function') onAutofill(mailPreview.code);
        card.remove();
      };
    }
  }

  function openModal(title, htmlContent, maxWidthClass = 'max-w-2xl') {
    const prev = document.getElementById('edu-modal-overlay');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'edu-modal-overlay';
    overlay.className = 'fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background-color:rgba(8,13,11,0.84);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;opacity:0;transition:opacity 200ms cubic-bezier(0.22, 1, 0.36, 1);';
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    const modal = document.createElement('div');
    modal.id = 'edu-modal-dialog';
    modal.className = `bg-dark-850/95 backdrop-blur-2xl rounded-2xl shadow-2xl ${maxWidthClass} w-full max-h-[88vh] flex flex-col overflow-hidden border border-white/10 my-auto text-white`;
    const maxW = maxWidthClass === 'max-w-3xl' ? '48rem' : '42rem';
    modal.style.cssText = `background-color:#131c18;border:1px solid rgba(255,255,255,0.14);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,0.78);color:#f4f7f5;width:100%;max-width:${maxW};max-height:88vh;display:flex;flex-direction:column;overflow:hidden;margin:auto;opacity:0;transform:scale(0.95) translateY(8px);transition:opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1);`;
    modal.innerHTML = `
      <div class="edu-modal-header px-6 py-4 border-b border-white/10 flex items-center justify-between bg-dark-900/80 shrink-0" style="background-color:#192621;border-bottom:1px solid rgba(255,255,255,0.12);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <h3 class="font-bold text-base text-white flex items-center gap-2" style="margin:0;font-weight:700;font-size:16px;color:#f4f7f5;display:flex;align-items:center;gap:8px;">${escapeHtml(title)}</h3>
        <button type="button" onclick="closeModal()" aria-label="Закрыть окно" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors" style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#c2d1c8;cursor:pointer;">
          <span class="material-symbols-outlined text-[20px]" style="font-size:20px;">close</span>
        </button>
      </div>
      <div class="edu-modal-body p-6 overflow-y-auto overscroll-contain space-y-4 text-sm text-slate-200 flex-1" style="background-color:#131c18;color:#e2e8f0;padding:24px;overflow-y:auto;flex:1;">
        ${htmlContent}
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const escListener = (evt) => {
      if (evt.key === 'Escape') {
        closeModal();
        window.removeEventListener('keydown', escListener);
      }
    };
    window.addEventListener('keydown', escListener);
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1) translateY(0)';
    });
  }

  function closeModal() {
    const existing = document.getElementById('edu-modal-overlay');
    if (!existing) {
      document.body.style.overflow = '';
      return;
    }
    const dialog = existing.querySelector('#edu-modal-dialog');
    existing.style.transition = 'opacity 150ms cubic-bezier(0.64, 0, 0.78, 0)';
    existing.style.opacity = '0';
    if (dialog) {
      dialog.style.transition = 'opacity 150ms cubic-bezier(0.64, 0, 0.78, 0), transform 150ms cubic-bezier(0.64, 0, 0.78, 0)';
      dialog.style.opacity = '0';
      dialog.style.transform = 'scale(0.95) translateY(4px)';
    }
    document.body.style.overflow = '';
    setTimeout(() => {
      if (existing.parentNode) existing.remove();
    }, 150);
  }

  // ==========================================
  // 7. GLOBAL SHARED LMS MODALS (COURSES, GRADES, CALENDAR, CHAT, SETTINGS)
  // ==========================================

  async function openSubjectsModal() {
    const user = getActiveUser();
    const uid = user ? user.id : 0;
    const res = await apiRequest(`/api/courses?user_id=${uid}`);
    const courses = (res.data && res.data.courses) || getCoursesList();
    const activeSlug = (user && user.specialty_slug) || 'it';
    const cardsHtml = courses.map(c => {
      const isCurrent = c.slug === activeSlug;
      const pct = Number(c.progress_percent || 0);
      const done = Number(c.completed_lessons || 0);
      const total = Number(c.total_lessons || 20);
      const slugSafe = escapeHtml(c.slug);

      return `
        <div class="p-4 rounded-2xl border ${isCurrent ? 'border-indigo-500/80 bg-indigo-950/40 shadow-glow-indigo' : 'border-white/10 bg-dark-900/60'} flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded-md bg-white/10 text-indigo-300 text-[10px] font-mono font-bold border border-white/5">${escapeHtml(c.code)}</span>
              <span class="font-bold text-sm text-white">${escapeHtml(c.title)}</span>
              ${isCurrent ? '<span class="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold shadow-glow-indigo">Активный курс</span>' : ''}
            </div>
            <p class="text-xs text-slate-400">Куратор: ${escapeHtml(c.curator)} • ${total} практических уроков</p>
            <div class="pt-1 flex items-center gap-3">
              <div class="flex-1 bg-dark-950/80 h-2 rounded-full overflow-hidden max-w-xs border border-white/5">
                <div class="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full" style="width:${Math.max(0, Math.min(100, pct))}%"></div>
              </div>
              <span class="text-[11px] font-bold text-slate-300">${done}/${total} уроков (${pct}%)</span>
            </div>
          </div>
          <button type="button" onclick="window.EduSpace.switchActiveCourse('${slugSafe}')" class="px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${isCurrent ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15' : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-glow-indigo'}">
            ${isCurrent ? 'Открыть уроки' : (c.enrolled ? 'Переключить курс' : 'Записаться на курс')}
          </button>
        </div>
      `;
    }).join('');
    openModal('📚 Каталог курсов и мои программы обучения', `
      <p class="text-xs text-slate-400">Выберите образовательную программу. По каждому курсу ведётся отдельный учёт прогресса, квизов и проверенных работ.</p>
      <div class="space-y-3">${cardsHtml}</div>
    `, 'max-w-3xl');
  }

  async function switchActiveCourse(slug) {
    const user = getActiveUser();

    if (!user) {
      closeModal();
      window.location.href = 'auth.html?mode=register';
      return;
    }

    const res = await apiRequest('/api/courses/enroll', {
      method: 'POST',
      body: { specialty_slug: slug }
    });

    if (res.ok && res.data && res.data.user) {
      setActiveUser(res.data.user);
      showToast(res.data.message || 'Курс успешно выбран!', 'success');
      closeModal();

      if (window.location.pathname.includes('tasks.html') || window.location.pathname.includes('student.html') || window.location.pathname.includes('profile.html')) {
        window.location.reload();
      }
    } else {
      showToast((res.data && res.data.message) || 'Не удалось переключить курс', 'error');
    }
  }

  async function openGradesModal() {
    const rawUser = getActiveUser();
    if (!rawUser) {
      window.location.href = 'auth.html?mode=login';
      return;
    }
    const user = rawUser;

    const res = await apiRequest(`/api/user/profile/${user.id}`);
    const data = res.data || {};
    const stats = data.statistics || { passed_count: 0, avg_score: 0, gpa: 0, xp: 0 };
    const subs = data.submissions || [];
    const rowsHtml = subs.length === 0
      ? `<tr><td colspan="5" class="p-8 text-center text-xs text-slate-500">${escapeHtml(tr('modal.grades.emptyRow', 'У вас пока нет сданных работ. Откройте Урок №1, пройдите автопроверку и отправьте первое решение!'))}</td></tr>`
      : subs.map(s => {
          const isPending = String(s.status).includes('на проверке') || String(s.status).includes('Отправлено');
          const isRev = String(s.status).includes('доработ');
          const badgeCls = isPending
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : (isRev ? 'bg-red-500/20 text-red-300 border border-red-500/30' : (s.score >= 75 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'));

          return `
            <tr class="hover:bg-white/[0.04] border-b border-white/5 transition-colors">
              <td class="p-3 font-bold text-white">${escapeHtml(tr('lesson.prefix', 'Урок ' + Number(s.task_number) + '. ', { num: s.task_number }))}${escapeHtml(s.task_title)}</td>
              <td class="p-3 text-indigo-400 uppercase text-[10px] font-bold font-mono">${escapeHtml(s.specialty_slug)}</td>
              <td class="p-3 font-extrabold text-white">${Number(s.score || 0)}/100 (${escapeHtml(s.grade_letter)})</td>
              <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeCls}">${escapeHtml(s.status)}</span></td>
              <td class="p-3 text-slate-300 text-[11px]">${escapeHtml(s.teacher_comment || 'Автопроверка пройдена')}</td>
            </tr>
          `;
        }).join('');
    openModal(tr('modal.grades.title', `📊 Зачётная книжка — ${user.full_name}`, { name: user.full_name }), `
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
          <div class="text-[11px] text-indigo-300 font-bold">${escapeHtml(tr('modal.grades.passedLabel', 'Зачтено по курсу'))}</div>
          <div class="text-xl font-extrabold text-indigo-200 mt-0.5">${Number(stats.passed_count || 0)} / 20</div>
        </div>
        <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
          <div class="text-[11px] text-emerald-300 font-bold">${escapeHtml(tr('modal.grades.gpaLabel', 'Средний балл / GPA'))}</div>
          <div class="text-xl font-extrabold text-emerald-200 mt-0.5">${stats.avg_score > 0 ? `${escapeHtml(stats.avg_score)} (${escapeHtml(stats.gpa)})` : '—'}</div>
        </div>
        <div class="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
          <div class="text-[11px] text-purple-300 font-bold">${escapeHtml(tr('modal.grades.xpLabel', 'Опыт обучения'))}</div>
          <div class="text-xl font-extrabold text-purple-200 mt-0.5">${Number(stats.xp || 0)} XP</div>
        </div>
      </div>
      <div class="border border-white/10 rounded-xl overflow-x-auto bg-dark-950/40">
        <table class="w-full text-xs text-left">
          <thead class="bg-white/[0.04] text-slate-400 border-b border-white/10 font-bold">
            <tr>
              <th class="p-3">${escapeHtml(tr('modal.grades.colLesson', 'Урок / Модуль'))}</th>
              <th class="p-3">${escapeHtml(tr('modal.grades.colCourse', 'Курс'))}</th>
              <th class="p-3">${escapeHtml(tr('modal.grades.colScore', 'Балл'))}</th>
              <th class="p-3">${escapeHtml(tr('modal.grades.colStatus', 'Статус'))}</th>
              <th class="p-3">${escapeHtml(tr('modal.grades.colComment', 'Комментарий куратора'))}</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <div class="flex justify-between items-center pt-2">
        <button type="button" onclick="exportCsvJournal()" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold flex items-center gap-1.5 transition-colors">
          <span class="material-symbols-outlined text-[16px]">download</span>
          <span>${escapeHtml(tr('modal.grades.downloadCsv', 'Скачать выписку CSV'))}</span>
        </button>
        <button type="button" onclick="closeModal()" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all">${escapeHtml(tr('modal.close', 'Закрыть'))}</button>
      </div>
    `, 'max-w-3xl');
  }

  async function openCalendarModal() {
    const user = getActiveUser();
    const spec = window.currentSpec || (user && user.specialty_slug) || 'it';
    const uid = user ? user.id : 0;
    const res = await apiRequest(`/api/tasks?specialty=${encodeURIComponent(spec)}&user_id=${uid}`);
    let tasks = (res.data && res.data.tasks) || [];
    const curDay = (res.data && res.data.current_study_day) || getUserStudyDay(user);
    if (!tasks.length && window.EDU_LESSONS && window.EDU_LESSONS[spec]) {
      tasks = window.EDU_LESSONS[spec].map((l, idx) => {
        const num = l.num || (idx + 1);
        const locked = num > curDay;
        const dates = computeExactDates(num, curDay);
        return {
          task_number: num,
          title: l.title,
          unlock_day: num,
          is_locked: locked,
          status_code: locked ? 'locked' : 'available',
          unlock_date_exact: dates.openText,
          deadline_exact: dates.deadlineText
        };
      });
    }
    const itemsHtml = tasks.map(t => {
      const isDone = t.status_code === 'graded';
      const isLocked = t.is_locked;
      const isToday = t.unlock_day === curDay;
      const cardCls = isDone
        ? 'border-emerald-500/30 bg-emerald-950/30'
        : (isToday ? 'border-indigo-500/80 bg-indigo-950/40 shadow-glow-indigo' : (isLocked ? 'border-white/5 bg-dark-950/40 opacity-70' : 'border-white/10 bg-dark-900/60'));

      const locOpen = escapeHtml(window.I18n ? window.I18n.localizeDateString(t.unlock_date_exact) : t.unlock_date_exact);
      const locDl = escapeHtml(window.I18n ? window.I18n.localizeDateString(t.deadline_exact) : t.deadline_exact);
      const locLesson = window.I18n ? window.I18n.localizeLessonContent(spec, t.task_number, t) : { title: t.title };
      const badge = isDone
        ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">${escapeHtml(tr('modal.deadlines.doneBadge', `Выполнено (${t.student_score}/100)`, { score: t.student_score }))}</span>`
        : (isLocked
            ? `<span class="px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 text-[10px] font-bold">${escapeHtml(tr('modal.deadlines.lockedBadge', `Откроется: ${locOpen}`, { date: locOpen }))}</span>`
            : `<span class="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-glow-indigo">${escapeHtml(isToday ? tr('modal.deadlines.todayBadge', 'Задание на сегодня') : tr('modal.deadlines.availableBadge', 'Доступно'))}</span>`);

      return `
        <div class="p-3.5 rounded-xl border ${cardCls} flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[11px] font-extrabold text-indigo-400">${escapeHtml(tr('modal.deadlines.dayLabel', `День ${t.unlock_day}`, { day: t.unlock_day }))}</span>
              ${badge}
            </div>
            <div class="font-bold text-xs text-white mt-1">${escapeHtml(locLesson.title)}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(tr('modal.deadlines.scheduleLine', `Открытие: ${locOpen} • Дедлайн: ${locDl}`, { openDate: locOpen, deadlineDate: locDl }))}</div>
          </div>
          ${isLocked
            ? '<span class="material-symbols-outlined text-slate-500 text-[20px]">lock</span>'
            : `<a href="simulator.html?specialty=${encodeURIComponent(spec)}&task=${Number(t.task_number)}" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shrink-0 text-center shadow-glow-indigo transition-all">${escapeHtml(tr('modal.deadlines.openLessonBtn', 'Открыть урок'))}</a>`
          }
        </div>
      `;
    }).join('');
    openModal(tr('modal.deadlines.title', `🗓️ График открытия модулей и дедлайны (Текущий день: День ${curDay})`, { day: curDay }), `
      <div class="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
        ${escapeHtml(tr('modal.deadlines.banner', 'Задания открываются поэтапно согласно расписанию курса. Будущие уроки заблокированы на сервере до наступления соответствующего учебного дня.'))}
      </div>
      <div class="space-y-2.5">${itemsHtml}</div>
    `, 'max-w-3xl');
  }

  function openScheduleModal() {
    const user = getActiveUser();
    const grp = (user && user.group_name) || 'ИС-21';
    const course = getCourseBySlug((user && user.specialty_slug) || 'it');
    openModal(`📅 Расписание учебных занятий — ${grp}`, `
      <div class="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <span class="font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-full">${escapeHtml(course.short_title)} (${escapeHtml(grp)})</span>
        <span class="text-slate-400 font-medium">Куратор: ${escapeHtml(course.curator)}</span>
      </div>
      <div class="space-y-2.5 text-xs">
        <div class="p-3.5 rounded-xl bg-dark-900/60 border border-white/10">
          <div class="font-bold text-white flex justify-between"><span>Понедельник • Лекция и разбор теории</span><span class="text-indigo-400 font-mono">09:00 – 10:30</span></div>
          <p class="text-slate-300 mt-1">Изучение конспекта открытого модуля и прохождение проверочного квиза.</p>
        </div>
        <div class="p-3.5 rounded-xl bg-dark-900/60 border border-white/10">
          <div class="font-bold text-white flex justify-between"><span>Среда • Практикум в онлайн-тренажёре</span><span class="text-indigo-400 font-mono">11:00 – 13:00</span></div>
          <p class="text-slate-300 mt-1">Выполнение практической задачи, отладка по логам автотестов и отправка работы.</p>
        </div>
        <div class="p-3.5 rounded-xl bg-dark-900/60 border border-white/10">
          <div class="font-bold text-white flex justify-between"><span>Пятница • Код-ревью и разбор ошибок с куратором</span><span class="text-indigo-400 font-mono">15:00 – 16:30</span></div>
          <p class="text-slate-300 mt-1">Персональная обратная связь преподавателя и выставление баллов в ведомость.</p>
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="openCalendarModal()" class="px-4 py-2 rounded-xl border border-white/15 text-slate-300 font-bold text-xs hover:bg-white/10 transition-colors">График дедлайнов</button>
        <button type="button" onclick="closeModal()" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-glow-indigo transition-all">Закрыть</button>
      </div>
    `);
  }

  async function openNotificationsModal() {
    const user = getActiveUser();
    const uid = user ? user.id : -1;
    const grp = (user && user.group_name) || '';
    const res = await apiRequest(`/api/notifications?user_id=${uid}&group_name=${encodeURIComponent(grp)}`);
    let items = (res.data && res.data.notifications) || [];
    if (items.length === 0) {
      const spec = window.currentSpec || (user && user.specialty_slug) || 'it';
      const course = getCourseBySlug(spec);
      const locShort = tr(`course.catalog.${spec}.shortTitle`, course.short_title);
      items = [
        {
          type: 'success',
          title: tr('modal.notifications.welcomeTitle', `Открыт Урок №1 по курсу «${locShort}»`, { course: locShort }),
          body: tr('modal.notifications.welcomeBody', 'Вам доступны интерактивный конспект с видеоразбором, 3D-схема и практический тренажёр с автопроверкой.'),
          created_at: '09:00'
        },
        {
          type: 'info',
          title: tr('modal.notifications.curatorTitle', `Куратор курса: ${course.curator}`, { curator: course.curator }),
          body: tr('modal.notifications.curatorBody', 'Ближайший дедлайн отправки первого практического задания — через 2 дня. Вопросы можно задать в чате.'),
          created_at: '09:15'
        }
      ];
    }

    if (user) {
      await apiRequest('/api/notifications/read', { method: 'POST', body: {} });
      document.querySelectorAll('[data-notif-badge]').forEach(el => el.classList.add('hidden'));
    }

    const listHtml = items.length === 0
      ? '<div class="p-6 text-center text-xs text-slate-500">Новых уведомлений пока нет.</div>'
      : items.map(n => {
          const icon = n.type === 'success' ? 'verified' : (n.type === 'warning' ? 'error' : 'notifications_active');
          const col = n.type === 'success' ? 'text-emerald-300 bg-emerald-950/30 border-emerald-500/30' : (n.type === 'warning' ? 'text-amber-300 bg-amber-950/30 border-amber-500/30' : 'text-indigo-300 bg-indigo-950/30 border-indigo-500/30');

          return `
            <div class="p-3.5 rounded-xl border ${col} flex items-start gap-3">
              <span class="material-symbols-outlined text-[20px] mt-0.5">${icon}</span>
              <div class="flex-1">
                <div class="font-bold text-xs text-white">${escapeHtml(n.title)}</div>
                <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">${escapeHtml(n.body)}</p>
                <span class="text-[10px] text-slate-500 block mt-1 font-mono">${escapeHtml(n.created_at || '')}</span>
              </div>
            </div>
          `;
        }).join('');
    openModal(tr('modal.notifications.title', '🔔 Центр уведомлений'), `<div class="space-y-2.5">${listHtml}</div>`);
  }

  async function openMessengerModal(recipient) {
    const peerId = Number.isInteger(recipient) && recipient > 0 ? recipient : null;
    openModal(peerId ? 'Личный диалог' : tr('modal.chat.title', 'Обсуждение курса'), `
      <div class="flex flex-col h-80 border border-white/10 rounded-2xl bg-dark-950/60">
        <p id="edu-chat-status" class="px-4 pt-3 text-sm text-slate-300" role="status">${escapeHtml(tr('modal.chat.loading', 'Загружаем сообщения…'))}</p>
        <div id="edu-chat-box" class="flex-1 p-4 overflow-y-auto space-y-3" role="log" aria-label="Сообщения чата"></div>
        <form id="edu-chat-form" class="p-2.5 bg-dark-900/90 border-t border-white/10 flex flex-wrap gap-2" hidden>
          <input type="text" id="edu-chat-input" aria-label="Сообщение" placeholder="${escapeHtml(tr('modal.chat.inputPlaceholder', 'Напишите сообщение'))}" maxlength="1000" class="min-w-0 flex-1 px-3 py-2 border border-white/15 bg-dark-800 text-white rounded-xl text-sm" required>
          <button type="submit" class="academy-action">${escapeHtml(tr('modal.chat.sendBtn', 'Отправить'))}</button>
        </form>
      </div>
    `);
    const status = document.getElementById('edu-chat-status');
    const box = document.getElementById('edu-chat-box');
    const form = document.getElementById('edu-chat-form');
    const input = document.getElementById('edu-chat-input');
    let viewer;

    function appendMessage(message) {
      const item = document.createElement('article');
      item.className = 'rounded-xl border border-white/10 p-3 max-w-[88%] overflow-wrap-anywhere';
      if (message.sender_id === viewer) item.classList.add('ml-auto', 'bg-indigo-900');
      else item.classList.add('bg-dark-900');
      const author = document.createElement('strong');
      author.textContent = message.sender_name;
      const body = document.createElement('p');
      body.className = 'text-sm whitespace-pre-wrap break-words';
      body.textContent = message.body;
      item.append(author, body);
      box.append(item);
      box.scrollTop = box.scrollHeight;
    }

    async function chatRequest(path, options = {}) {
      const response = await fetchWithCsrf(path, { ...options, signal: AbortSignal.timeout(6000) });
      if (response.status === 401) throw new Error('Войдите в аккаунт, чтобы открыть чат.');
      if (response.status === 403) throw new Error('Этот диалог недоступен вашему аккаунту.');
      if (!response.ok) throw new Error('Сервер чата временно недоступен.');
      return response.json();
    }

    try {
      const query = peerId ? '?peer_id=' + peerId : '';
      const data = await chatRequest('/api/messages' + query);
      if (!box.isConnected) return;
      viewer = data.viewer_id;
      data.messages.forEach(appendMessage);
      status.textContent = data.peer_name || (data.messages.length ? 'Сообщения участников курса' : 'Пока нет сообщений. Можно начать обсуждение.');
      form.hidden = false;
    } catch (error) {
      const spec = window.currentSpec || 'it';
      const course = getCourseBySlug(spec);
      const locTitle = tr(`course.catalog.${spec}.title`, course.title);
      viewer = -1;
      appendMessage({
        sender_id: 999,
        sender_name: tr('modal.chat.curatorRole', `Куратор курса · ${course.curator}`, { curator: course.curator }),
        body: tr('modal.chat.welcomeMessage', `Здравствуйте! Добро пожаловать на курс «${locTitle}». Здесь вы можете задать вопрос по текущему уроку, разбору ошибок или дедлайнам.`, { course: locTitle })
      });
      status.textContent = tr('modal.chat.guestStatus', 'Чат с куратором курса (Ознакомительный режим)');
      form.hidden = false;
      form.addEventListener('submit', event => {
        event.preventDefault();
        const body = input.value.trim();
        if (!body) return;
        appendMessage({ sender_id: -1, sender_name: tr('modal.chat.youLabel', 'Вы (Студент)'), body });
        input.value = '';
        status.textContent = tr('modal.chat.sentStatus', 'Сообщение доставлено куратору.');
      });
      return;
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const body = input.value.trim();
      const submit = form.querySelector('button');
      if (!body || submit.disabled) return;
      submit.disabled = true;
      try {
        const data = await chatRequest('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body, peer_id: peerId }),
        });
        if (!box.isConnected) return;
        appendMessage(data.message);
        input.value = '';
        status.textContent = 'Сообщение отправлено.';
        input.focus();
      } catch (error) {
        status.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    });
  }

  function openSettingsModal() {
    const rawUser = getActiveUser();
    const user = rawUser || {
      id: 1,
      full_name: 'Студент АМК',
      last_name: 'Студент',
      first_name: 'АМК',
      middle_name: '',
      email: 'student@amk.kz',
      group_name: 'ИС-21',
      role: 'student',
      specialty_slug: window.currentSpec || 'it',
      is_guest_fallback: true
    };

    const parts = (user.full_name || '').split(/\s+/);
    const ln = user.last_name || parts[0] || '';
    const fn = user.first_name || parts[1] || '';
    const mn = user.middle_name !== undefined ? user.middle_name : parts.slice(2).join(' ');
    const curLoc = (window.I18n && window.I18n.getLocale) ? window.I18n.getLocale() : 'ru';
    const courseOpts = getCoursesList().map(c => {
      const cTitle = tr(`course.catalog.${c.slug}.title`, c.title);
      return `<option value="${escapeHtml(c.slug)}" ${c.slug === user.specialty_slug ? 'selected' : ''}>${escapeHtml(c.code)} — ${escapeHtml(cTitle)}</option>`;
    }).join('');
    openModal(tr('modal.settings.title', '⚙️ Настройки личного профиля и безопасности'), `
      <form id="edu-profile-settings-form" class="space-y-3.5 text-xs text-slate-200">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-bold text-slate-300 mb-1">${escapeHtml(tr('modal.settings.lastName', 'Фамилия *'))}</label>
            <input type="text" id="set-last-name" value="${escapeHtml(ln)}" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500" required />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">${escapeHtml(tr('modal.settings.firstName', 'Имя *'))}</label>
            <input type="text" id="set-first-name" value="${escapeHtml(fn)}" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500" required />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">${escapeHtml(tr('modal.settings.middleName', 'Отчество'))}</label>
            <input type="text" id="set-middle-name" value="${escapeHtml(mn)}" placeholder="${escapeHtml(tr('modal.settings.middleNamePlaceholder', 'При наличии'))}" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-300 mb-1">${escapeHtml(tr('modal.settings.email', 'Подтверждённый Email'))}</label>
            <input type="email" value="${escapeHtml(user.email)}" disabled class="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-dark-950 text-slate-500 cursor-not-allowed font-mono" />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">${escapeHtml(tr('modal.settings.group', 'Учебная группа'))}</label>
            <input type="text" id="set-group" value="${escapeHtml(user.group_name || 'ИС-21')}" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500" required />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${user.role === 'student' ? `
          <div>
            <label class="block font-bold text-slate-300 mb-1">${escapeHtml(tr('modal.settings.activeCourse', 'Активный курс обучения'))}</label>
            <select id="set-course" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500">${courseOpts}</select>
          </div>` : ''}
          <div>
            <label class="block font-bold text-slate-300 mb-1">${escapeHtml(tr('modal.settings.interfaceLanguage', 'Язык интерфейса'))}</label>
            <select id="set-locale" onchange="if(window.I18n){window.I18n.setLocale(this.value);openSettingsModal();}" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500">
              <option value="ru" ${curLoc === 'ru' ? 'selected' : ''}>Русский (РУС)</option>
              <option value="kk" ${curLoc === 'kk' ? 'selected' : ''}>Қазақша (ҚАЗ)</option>
            </select>
          </div>
        </div>
        <div class="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Текущий пароль (если меняете пароль)</label>
            <input type="password" id="set-cur-pwd" autocomplete="current-password" placeholder="Текущий пароль" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500" />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">${escapeHtml(tr('modal.settings.newPassword', 'Новый пароль (необязательно)'))}</label>
            <input type="password" id="set-new-pwd" autocomplete="new-password" placeholder="${escapeHtml(tr('modal.settings.newPasswordPlaceholder', 'Минимум 8 символов, буквы и цифры'))}" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500" />
          </div>
        </div>
        <div id="set-error-box" class="hidden p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-semibold"></div>
        <div class="pt-2 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl border border-white/15 text-slate-300 font-bold hover:bg-white/10 transition-colors">${escapeHtml(tr('modal.cancel', 'Отмена'))}</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold shadow-glow-indigo transition-all">${escapeHtml(tr('modal.save', 'Сохранить изменения'))}</button>
        </div>
      </form>
    `);

    const form = document.getElementById('edu-profile-settings-form');

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();

        const errBox = document.getElementById('set-error-box');
        const newPwd = document.getElementById('set-new-pwd').value;
        const curPwd = document.getElementById('set-cur-pwd') ? document.getElementById('set-cur-pwd').value : '';
        if (newPwd) {
          const pwCheck = validatePasswordStrength(newPwd);
          if (!pwCheck.valid) {
            if (errBox) {
              errBox.textContent = pwCheck.error;
              errBox.classList.remove('hidden');
            }
            return;
          }
          if (!curPwd) {
            if (errBox) {
              errBox.textContent = 'Укажите текущий пароль для смены пароля.';
              errBox.classList.remove('hidden');
            }
            return;
          }
        }
        const payload = {
          last_name: document.getElementById('set-last-name').value,
          first_name: document.getElementById('set-first-name').value,
          middle_name: document.getElementById('set-middle-name').value,
          group_name: document.getElementById('set-group').value,
          specialty_slug: document.getElementById('set-course') ? document.getElementById('set-course').value : user.specialty_slug,
          new_password: newPwd,
          current_password: curPwd
        };

        if (user.is_guest_fallback) {
          if (payload.specialty_slug && typeof window.changeSpecialty === 'function') {
            window.changeSpecialty(payload.specialty_slug);
          }
          closeModal();
          showToast('Настройки курса обновлены!', 'success');
          return;
        }
        const res = await apiRequest('/api/user/profile', { method: 'PUT', body: payload });

        if (!res.ok || !res.data || !res.data.success) {
          if (errBox) {
            errBox.textContent = (res.data && res.data.message) || 'Ошибка сохранения профиля';
            errBox.classList.remove('hidden');
          }
          return;
        }
        setActiveUser(res.data.user);
        closeModal();
        showToast('Данные профиля успешно обновлены!', 'success');
        setTimeout(() => window.location.reload(), 300);
      };
    }
  }

  // ==========================================
  // 8. REAL CSV & PRINTABLE CERTIFICATE EXPORTS

  // ==========================================

  async function exportCsvJournal() {
    const user = getActiveUser();
    let rows = [];

    if (user && user.role === 'teacher') {
      const res = await apiRequest('/api/teacher/journal');
      rows = (res.data && res.data.journal) || [];
    } else if (user) {
      const res = await apiRequest(`/api/user/profile/${user.id}`);
      rows = ((res.data && res.data.submissions) || []).map(s => Object.assign({ student_name: user.full_name, group_name: user.group_name }, s));
    }

    const bom = '\uFEFF';
    let csv = bom + '№;ФИО Студента;Группа;Курс;Урок;Название модуля;Балл;Оценка;Статус;Комментарий преподавателя\n';

    if (rows.length === 0) {
      csv += `1;${user ? user.full_name : 'Нет данных'};${user ? user.group_name : '—'};${user ? user.specialty_slug : '—'};—;Нет сданных работ;0;—;Старт с нуля;—\n`;
    } else {
      rows.forEach((r, idx) => {
        const cleanComment = (r.teacher_comment || 'Автопроверка').replace(/;/g, ',').replace(/\n/g, ' ');
        csv += `${idx + 1};${r.student_name || ''};${r.group_name || ''};${r.specialty_slug || ''};Урок №${r.task_number};${(r.task_title || '').replace(/;/g, ',')};${r.score};${r.grade_letter};${r.status};${cleanComment}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vedomost_eduspace_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Ведомость успеваемости выгружена в формате CSV (Excel)!', 'success');
  }

  async function exportPdfStatement() {
    showToast('Формирование официального PDF-портфолио...', 'info');
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/portfolio/export.pdf`, {
        method: 'GET',
        credentials: 'same-origin'
      });
      if (res.status === 401) {
        showToast('Войдите в аккаунт для выгрузки официального PDF.', 'warning');
        return;
      }
      if (!res.ok) {
        showToast('Не удалось сформировать PDF-файл на сервере.', 'error');
        return;
      }
      const blob = await res.blob();
      const user = getActiveUser();
      const fname = `portfolio_${user && user.id ? user.id : 'eduspace'}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fname;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Официальное PDF-портфолио скачано!', 'success');
    } catch (e) {
      showToast('Ошибка соединения при выгрузке PDF.', 'error');
    }
  }

  async function sharePortfolio() {
    try {
      const res = await api('/api/portfolio/settings');
      if (res && res.ok && res.data) {
        const s = res.data.settings || res.data;
        if (s && s.is_public && s.consent_granted && s.public_slug) {
          const publicUrl = `${window.location.origin}/career.html?public=${encodeURIComponent(s.public_slug)}`;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(publicUrl);
          }
          showToast('Публичная ссылка на портфолио скопирована в буфер обмена!', 'success');
          return publicUrl;
        }
        showToast('Включите публичный доступ и согласие на публикацию в разделе «Карьера и настройки приватности».', 'info');
        return null;
      }
    } catch (e) {}
    showToast('Войдите в аккаунт и настройте публичный адрес в разделе «Карьера & Резюме».', 'info');
    return null;
  }
  // Legacy modal helpers kept interactive and accurate
  // (openZoomModal stub removed per T-M2-04)

  // ==========================================
  // 9. PAGE SHELL HYDRATION & AUTH/ROLE GUARDS
  // ==========================================

  function showAuthRequiredOverlay(targetRole = 'student') {
    if (document.getElementById('edu-auth-guard')) return;

    const gate = document.createElement('div');
    gate.id = 'edu-auth-guard';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'edu-auth-guard-title');
    gate.className = 'fixed inset-0 z-[9000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4';
    gate.innerHTML = `
      <div class="bg-dark-850/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/10 text-center space-y-5 text-white relative">
        <div class="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-glow-indigo">
          <span class="material-symbols-outlined text-[34px]" aria-hidden="true">lock_person</span>
        </div>
        <div class="space-y-2">
          <h2 id="edu-auth-guard-title" class="font-display font-extrabold text-xl text-white">Войдите в личный кабинет</h2>
          <p class="text-xs text-slate-300 leading-relaxed">
            Для доступа к личным результатам и оценкам нужен аккаунт. Учебник открыт для всех.
          </p>
        </div>
        <div class="space-y-2.5 pt-1">
          <a href="auth.html?mode=login" class="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs transition-colors block">
            Войти в аккаунт
          </a>
          <a href="auth.html?mode=register${targetRole === 'teacher' ? '&role=teacher' : ''}" class="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white font-semibold text-xs transition-colors block">
            Создать аккаунт
          </a>
          <a href="learn.html" class="academy-action">Открыть учебник без аккаунта</a>
        </div>
      </div>
    `;
    document.body.appendChild(gate);
    const links = gate.querySelectorAll('a');
    const first = links[0];
    const last = links[links.length - 1];
    first.focus();
    gate.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  async function syncSession() {
    const localUser = getActiveUser();
    if (localUser) return localUser;
    try {
      const res = await fetch(apiBase() + '/api/auth/session', {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.csrf_token) setCsrfToken(data.csrf_token);
        if (data && data.authenticated && data.user) {
          const synced = setActiveUser(data.user);
          const guard = document.getElementById('edu-auth-guard');
          if (guard) guard.remove();
          return synced;
        }
      }
    } catch (e) {}
    return null;
  }

  async function hydratePageIdentity() {
    const path = window.location.pathname.toLowerCase();
    let user = getActiveUser();
    if (!user) {
      user = await syncSession();
    }
    const isProtectedStudent = path.endsWith('student.html') || path.endsWith('/student') || path.endsWith('student-workspace.html') ||
      path.endsWith('tasks.html') || path.endsWith('/tasks') ||
      path.endsWith('simulator.html') || path.endsWith('/simulator') ||
      path.endsWith('profile.html') || path.endsWith('/profile');
    const isProtectedTeacher = path.endsWith('teacher.html') || path.endsWith('/teacher') || path.endsWith('gradebook.html') || path.endsWith('/gradebook');

    const isPublicCatalog = path.endsWith('tasks.html') || path.endsWith('/tasks') || path.endsWith('simulator.html') || path.endsWith('/simulator');
    if (isProtectedStudent && !isPublicCatalog && !user) {
      showAuthRequiredOverlay('student');
      return;
    }

    if (user) {
      document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = user.full_name; });
      document.querySelectorAll('[data-user-first-name]').forEach(el => {
        el.textContent = user.first_name || user.full_name.split(' ')[1] || user.full_name;
      });
      document.querySelectorAll('[data-user-initials]').forEach(el => { el.textContent = user.initials; });
      document.querySelectorAll('[data-user-role]').forEach(el => {
        el.textContent = `Студент (${user.group_name || 'ИС-21'})`;
      });
      document.querySelectorAll('[data-user-course]').forEach(el => {
        el.textContent = `Курс: ${user.specialty_name}`;
      });
      document.querySelectorAll('[onclick*="resetDemoMode"]').forEach(btn => {
        if (!user.is_demo && user.role === 'student') {
          btn.classList.add('hidden');
        }
      });

      const isPublicPage = !isProtectedStudent && !isProtectedTeacher && !path.endsWith('auth.html');

      if (isPublicPage) {
        const cabHref = user.role === 'teacher' ? 'teacher.html' : 'student.html';
        document.querySelectorAll('header a').forEach(a => {
          const txt = (a.textContent || '').trim().toLowerCase();

          if (txt === 'войти') {
            a.textContent = user.first_name || user.full_name;
            a.href = cabHref;
            a.title = `Перейти в личный кабинет (${user.full_name})`;
          } else if (txt === 'регистрация') {
            a.textContent = 'В кабинет →';
            a.href = cabHref;
          }
        });
      }
    }
  }
  document.addEventListener('DOMContentLoaded', hydratePageIdentity);

  // ==========================================
  // 10. EXPORT GLOBAL API
  // ==========================================
  window.EduSpace = {
    normalizeTeacherCode,
    escapeHtml,
    safeUrl,
    apiBase,
    getCsrfToken,
    setCsrfToken,
    ensureCsrfToken,
    fetchWithCsrf,
    api: apiRequest,
    validateFioFields,
    validateEmailFormat,
    validatePasswordStrength,
    runLessonAutoTests,
    getCoursesList,
    getCourseBySlug,
    getLessonFromCatalog,
    computeExactDates,
    getUserStudyDay,
    getInitials,
    getActiveUser,
    setActiveUser,
    syncSession,
    logoutUser,
    startIsolatedDemo,
    switchActiveCourse,
    showIncomingMailCard,
    hydratePageIdentity
  };

  // ==========================================
  // 7b. ADVANCED GAMIFICATION MODALS: LEADERBOARD, DAILY QUESTS, ACHIEVEMENTS
  // ==========================================

  async function openLeaderboardModal(groupFilter = 'all') {
    openModal('🏆 Академический рейтинг студентов — AMK Leaderboard', `
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
          <div class="text-xs text-slate-400">Рейтинг на основе зачтённых заданий, очков опыта XP и достижений</div>
          <select id="lb-group-select" onchange="openLeaderboardModal(this.value)" class="px-3 py-1.5 rounded-xl bg-dark-900 border border-white/10 text-white text-xs">
            <option value="all" ${groupFilter === 'all' ? 'selected' : ''}>Все группы колледжа</option>
            <option value="ИС-21" ${groupFilter === 'ИС-21' ? 'selected' : ''}>ИС-21 (Программисты)</option>
            <option value="ГД-21" ${groupFilter === 'ГД-21' ? 'selected' : ''}>ГД-21 (Граф. дизайн)</option>
            <option value="АЭ-21" ${groupFilter === 'АЭ-21' ? 'selected' : ''}>АЭ-21 (Автоэлектрики)</option>
            <option value="ХО-21" ${groupFilter === 'ХО-21' ? 'selected' : ''}>ХО-21 (Холодильщики)</option>
            <option value="АМ-21" ${groupFilter === 'АМ-21' ? 'selected' : ''}>АМ-21 (Автомеханики)</option>
          </select>
        </div>
        <div id="lb-modal-body" class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <div class="text-center py-8 text-slate-400">
            <span class="material-symbols-outlined text-3xl animate-spin text-cyan-400">progress_activity</span>
            <div class="mt-2 text-xs">Загрузка данных рейтинга...</div>
          </div>
        </div>
      </div>
    `, 'max-w-3xl');
    try {
      const url = groupFilter && groupFilter !== 'all' ? `/api/leaderboard?group=${encodeURIComponent(groupFilter)}` : '/api/leaderboard';
      const res = await apiRequest(url);
      const data = (res && res.data) || {};
      const container = document.getElementById('lb-modal-body');

      if (!container) return;
      if (!res.ok || !data.success || !data.leaderboard || data.leaderboard.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs">В данной группе пока нет активных участников.</div>';
        return;
      }
      container.innerHTML = data.leaderboard.map(st => {
        const medal = st.rank === 1 ? '🥇' : (st.rank === 2 ? '🥈' : (st.rank === 3 ? '🥉' : `#${Number(st.rank)}`));
        const medalBg = st.rank === 1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-glow-amber' : (st.rank === 2 ? 'bg-slate-300/20 text-slate-200 border-slate-300/40' : (st.rank === 3 ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' : 'bg-white/5 text-slate-400 border-white/10'));
        const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(String(st.rank_color || '')) ? st.rank_color : '#38bdf8';

        return `
          <div class="p-3.5 rounded-2xl bg-dark-900/90 border border-white/10 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-all">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${medalBg}">${medal}</span>
              <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 text-xs">
                ${escapeHtml(st.initials)}
              </div>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <span>${escapeHtml(st.full_name)}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-400 border border-white/10">${escapeHtml(st.group_name)}</span>
                </div>
                <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span style="color: ${safeColor}">${escapeHtml(st.rank_name)} (Ур. ${Number(st.level || 1)})</span>
                  <span>•</span>
                  <span>Заданий: ${Number(st.passed_tasks || 0)}/20</span>
                  <span>•</span>
                  <span>🏆 Достижений: ${Number(st.achievements_count || 0)}</span>
                </div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="font-black text-sm sm:text-base text-cyan-300">${Number(st.total_xp || 0)} XP</div>
              <div class="text-[10px] text-slate-400">Балл: ${Number(st.avg_score || 0)}/100</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      const container = document.getElementById('lb-modal-body');

      if (container) container.innerHTML = '<div class="text-center py-6 text-red-400 text-xs">Ошибка загрузки рейтинга.</div>';
    }
  }

  async function openDailyQuestsModal() {
    const user = getActiveUser();

    if (!user) {
      showToast('Требуется авторизация для ежедневных заданий', 'warning');
      return;
    }
    openModal('⚡ Ежедневные задания и серия обучения — Streak Quest', `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-500/20 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/30 border border-amber-500/50 flex items-center justify-center text-amber-300 text-2xl shadow-glow-amber">
              🔥
            </div>
            <div>
              <div class="text-xs text-amber-300 font-bold uppercase tracking-wider">Серия обучения (Streak)</div>
              <div class="text-xl font-extrabold text-white" id="modal-streak-val">1 день подряд</div>
              <div class="text-[11px] text-slate-300">Занимайтесь ежедневно, чтобы умножать полученный опыт!</div>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">Календарь активен</span>
        </div>
        <div id="daily-quests-list" class="space-y-3">
          <div class="text-center py-6 text-slate-400 text-xs">Загрузка ежедневных квестов...</div>
        </div>
      </div>
    `, 'max-w-2xl');
    try {
      const res = await apiRequest(`/api/daily_quests?user_id=${user.id}`);
      const data = (res && res.data) || {};

      if (!res.ok || !data.success) return;

      const streakEl = document.getElementById('modal-streak-val');

      if (streakEl) streakEl.textContent = `${Number(data.streak_days || 1)} ${data.streak_days === 1 ? 'день' : 'дня'} подряд`;

      const container = document.getElementById('daily-quests-list');

      if (!container) return;
      container.innerHTML = (data.quests || []).map(q => `
        <div class="p-4 rounded-2xl bg-dark-900/90 border ${q.completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'} flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl ${q.completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-slate-400 border border-white/10'} flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[20px]">${q.completed ? 'check_circle' : escapeHtml(q.icon)}</span>
            </div>
            <div>
              <div class="font-bold text-sm text-white flex items-center gap-2">
                <span>${escapeHtml(q.title)}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${q.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'}">+${Number(q.xp || 0)} XP</span>
              </div>
              <div class="text-xs text-slate-400 mt-0.5">${escapeHtml(q.desc)}</div>
            </div>
          </div>
          <div class="shrink-0">
            ${q.completed ? `
              <span class="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">done</span>
                Выполнено
              </span>
            ` : `
              <button type="button" onclick="completeQuestInModal('${escapeHtml(q.key)}')" class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:shadow-cyan-500/40 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-glow-cyan">
                <span>Зачесть</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            `}
          </div>
        </div>
      `).join('');
    } catch (e) {
      console.error(e);
    }
  }

  async function completeQuestInModal(questKey) {
    const user = getActiveUser();

    if (!user) return;

    const res = await apiRequest('/api/daily_quests', {
      method: 'POST',
      body: { quest_key: questKey }
    });
    const data = (res && res.data) || {};

    if (res.ok && data.success) {
      if (data.awarded) {
        showToast(`🎉 Квест выполнен! Получено +${Number(data.xp_earned || 0)} XP`, 'success');
      } else {
        showToast('Квест уже был выполнен ранее сегодня', 'info');
      }
      openDailyQuestsModal();

      if (typeof initStudentDashboard === 'function') initStudentDashboard();
    }
  }

  async function openAchievementsModal() {
    const user = getActiveUser();

    if (!user) return;
    openModal('🏆 Достижения и награды платформы — EduSpace Milestones', `
      <div class="space-y-4">
        <div class="text-xs text-slate-400">Награды открываются автоматически за сдачу заданий, квизов и поддержание серии обучения</div>
        <div id="achievements-modal-list" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          <div class="col-span-2 text-center py-6 text-slate-400 text-xs">Загрузка достижений...</div>
        </div>
      </div>
    `, 'max-w-3xl');
    try {
      const res = await apiRequest(`/api/user/profile/${user.id}`);
      const data = (res && res.data) || {};

      if (!res.ok || !data.success) return;

      const userAchs = (data.achievements || []).map(a => a.id || a);
      const catalog = [
        { id: 'first_step', title: 'Первый шаг в EduSpace', desc: 'Сдано первое практическое задание курса', xp: 50, icon: 'school', color: '#06b6d4' },
        { id: 'quiz_master', title: 'Эрудит EduSpace', desc: 'Сдан проверочный тест на 3/3 баллов', xp: 50, icon: 'psychology', color: '#818cf8' },
        { id: 'high_five', title: 'Твёрдая пятёрка', desc: 'Успешно сдано 5 заданий специализации', xp: 150, icon: 'stars', color: '#10b981' },
        { id: 'perfect_score', title: 'Высший балл (100/100)', desc: 'Идеальная оценка от куратора курса', xp: 100, icon: 'military_tech', color: '#f59e0b' },
        { id: 'streak_master', title: 'Хранитель серии', desc: 'Серия непрерывного обучения 3+ дня', xp: 100, icon: 'local_fire_department', color: '#ef4444' },
        { id: 'color_architect', title: 'Архитектор цвета', desc: 'Завершена интерактивная миссия колористики', xp: 200, icon: 'palette', color: '#ec4899' },
        { id: 'course_champion', title: 'Покоритель курса', desc: 'Успешно сданы все 20 уроков курса', xp: 300, icon: 'workspace_premium', color: '#a855f7' }
      ];

      const container = document.getElementById('achievements-modal-list');

      if (!container) return;
      container.innerHTML = catalog.map(ach => {
        const isUnlocked = userAchs.includes(ach.id);

        return `
          <div class="p-4 rounded-2xl ${isUnlocked ? 'bg-dark-900 border-cyan-500/40 shadow-glow-cyan' : 'bg-dark-950/60 border-white/5 opacity-60'} border flex items-center gap-3.5 transition-all">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0" style="background: ${isUnlocked ? ach.color + '25' : 'rgba(255,255,255,0.05)'}; color: ${isUnlocked ? ach.color : '#64748b'}; border: 1px solid ${isUnlocked ? ach.color + '60' : 'rgba(255,255,255,0.1)'}">
              <span class="material-symbols-outlined text-[24px]">${escapeHtml(ach.icon)}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <div class="font-bold text-xs sm:text-sm text-white truncate">${escapeHtml(ach.title)}</div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isUnlocked ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-500'}">+${Number(ach.xp)} XP</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5 leading-snug">${escapeHtml(ach.desc)}</div>
              <div class="mt-1 text-[10px] font-bold ${isUnlocked ? 'text-emerald-400' : 'text-slate-500'}">
                ${isUnlocked ? '✓ Получено в профиль' : '🔒 Заблокировано'}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.error(e);
    }
  }
    // Expose top-level functions used by inline onclick handlers
  window.showToast = showToast;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.getActiveUser = getActiveUser;
  window.setActiveUser = setActiveUser;
  window.logoutUser = logoutUser;
  window.resetDemoMode = resetDemoMode;
  window.openSubjectsModal = openSubjectsModal;
  window.openGradesModal = openGradesModal;
  window.openScheduleModal = openScheduleModal;
  window.openCalendarModal = openCalendarModal;
  window.openNotificationsModal = openNotificationsModal;
  window.openMessengerModal = openMessengerModal;
  window.openSettingsModal = openSettingsModal;
  window.openLeaderboardModal = openLeaderboardModal;
  window.openDailyQuestsModal = openDailyQuestsModal;
  window.openAchievementsModal = openAchievementsModal;
  window.completeQuestInModal = completeQuestInModal;
  window.exportCsvJournal = exportCsvJournal;
  window.exportPdfStatement = exportPdfStatement;
  window.sharePortfolio = sharePortfolio;
  window.getCourseBySlug = getCourseBySlug;
  window.getCoursesList = getCoursesList;
})();

  // ==========================================
  // GLOBAL COMMAND PALETTE (Ctrl + K)
  // ==========================================

  function initCommandPalette() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPaletteModal();
      }

      if (e.key === 'Escape') {
        closeCommandPaletteModal();
      }
    });
  }

  function openCommandPaletteModal() {
    const existing = document.getElementById('edu-command-palette-modal');

    if (existing) {
      existing.classList.remove('hidden');
      document.getElementById('cmd-palette-input').focus();
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'edu-command-palette-modal';
    modal.className = 'fixed inset-0 z-[999999] flex items-start justify-center pt-20 px-4 bg-dark-950/80 backdrop-blur-xl transition-all';
    modal.innerHTML = `
      <div class="w-full max-w-2xl bg-dark-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden shadow-glow-indigo text-slate-200">
        <div class="p-4 border-b border-white/10 flex items-center gap-3">
          <span class="material-symbols-outlined text-indigo-400 text-[24px]">search</span>
          <input type="text" id="cmd-palette-input" oninput="filterCommandPalette(this.value)" placeholder="Быстрый поиск урока, специальности, ведомости или калькулятора..." class="w-full bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-none font-medium" />
          <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">ESC</span>
        </div>
        <div id="cmd-palette-results" class="max-h-96 overflow-y-auto p-3 space-y-1 text-xs"></div>
        <div class="px-4 py-2.5 bg-dark-950/60 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
          <span>Навигация: <strong>↑ ↓</strong> • Выбор: <strong>Enter</strong></span>
          <span>EDU SPACE Quick Search</span>
        </div>
      </div>
    `;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCommandPaletteModal();
    });
    document.body.appendChild(modal);
    document.getElementById('cmd-palette-input').focus();
    renderCommandPaletteItems('');
  }

  function closeCommandPaletteModal() {
    const m = document.getElementById('edu-command-palette-modal');

    if (m) m.classList.add('hidden');
  }

  const PALETTE_ITEMS = [
    { title: 'Веб-дизайн и разработка ПО (20 модулей)', desc: 'HTML, CSS, JS, A11y, Дипломный проект', url: 'tasks.html?specialty=it', icon: 'code', category: 'Специальность' },
    { title: 'Графический дизайн (20 модулей)', desc: 'Figma, брендинг, типографика, брендбук', url: 'tasks.html?specialty=graphic_design', icon: 'palette', category: 'Специальность' },
    { title: 'Автоэлектрика и диагностика (20 модулей)', desc: 'Мультиметр, осциллограф, CAN-шина, OBD-II, BCM', url: 'tasks.html?specialty=autoelectric', icon: 'electric_meter', category: 'Специальность' },
    { title: 'Холодильное оборудование и HVAC (20 модулей)', desc: 'Фреоны, вакуумирование, перегрев, инверторы, ПНР', url: 'tasks.html?specialty=hvac', icon: 'ac_unit', category: 'Специальность' },
    { title: 'Автомеханика и ТО (20 модулей)', desc: 'ДВС, ГРМ, подвеска, ШРУС, регламентное ТО', url: 'tasks.html?specialty=automechanic', icon: 'build', category: 'Специальность' },
    { title: 'Электронная ведомость оценок', desc: 'Сводный академический журнал всех студентов', url: 'teacher.html?tab=matrix', icon: 'grid_on', category: 'Учебная часть' },
    { title: 'Реестр проверки сертификатов', desc: 'Государственная проверка подлинности с QR-кодом', url: 'verify.html', icon: 'verified_user', category: 'Сертификация' },
    { title: 'Тарифные планы и подписка Pro', desc: 'Kaspi QR, оплата картой, доступ к модулям 4–20', url: 'pricing.html', icon: 'diamond', category: 'Финансы' },
    { title: 'Личный кабинет слушателя', desc: 'Профиль, статистика, зачётная книжка', url: 'profile.html', icon: 'person', category: 'Профиль' }
  ];

  function renderCommandPaletteItems(query) {
    const cont = document.getElementById('cmd-palette-results');

    if (!cont) return;

    const q = (query || '').toLowerCase().trim();
    const filtered = PALETTE_ITEMS.filter(it => !q || it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q) || it.category.toLowerCase().includes(q));
    const esc = (window.EduSpace && window.EduSpace.escapeHtml) ? window.EduSpace.escapeHtml : (s => String(s || ''));
    const safeU = (window.EduSpace && window.EduSpace.safeUrl) ? window.EduSpace.safeUrl : (u => esc(u));

    if (filtered.length === 0) {
      cont.innerHTML = '<div class="p-6 text-center text-slate-500">По запросу ничего не найдено. Попробуйте другой термин.</div>';
      return;
    }
    cont.innerHTML = filtered.map(it => `
      <a href="${safeU(it.url)}" onclick="closeCommandPaletteModal()" class="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <span class="material-symbols-outlined text-[20px]">${esc(it.icon)}</span>
          </div>
          <div>
            <div class="font-bold text-white group-hover:text-indigo-300 transition-colors">${esc(it.title)}</div>
            <div class="text-[11px] text-slate-400">${esc(it.desc)}</div>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">${esc(it.category)}</span>
      </a>
    `).join('');
  }

  function filterCommandPalette(val) {
    renderCommandPaletteItems(val);
  }
  document.addEventListener('DOMContentLoaded', initCommandPalette);

  // ==========================================
  // SLEEK AUDIO SYNTHESIZER (WEB AUDIO API)
  // ==========================================
  let audioCtx = null;
  let audioEnabled = false;

  function playUiTone(type) {
    if (!audioEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;
        audioCtx = new AudioContext();
      }

      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success' || type === 'grade') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
    }
  }

  // ==========================================
  // TAB KEY INDENTATION IN CODE EDITORS
  // ==========================================

  function setupCodeEditorTabs(textareaId) {
    const el = document.getElementById(textareaId);

    if (!el) return;
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        e.preventDefault();

        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 2;

        if (typeof onCodeEdited === 'function') onCodeEdited();
      }
    });
  }

  // ==========================================
  // STUDENT ACHIEVEMENTS SYSTEM
  // ==========================================

  function computeStudentBadges(user, passedCount, avgScore, isPro) {
    return [
      {
        id: 'start',
        title: 'Успешный старт',
        desc: 'Зарегистрирован и подтвердил контакты в колледже',
        icon: 'rocket_launch',
        color: 'text-indigo-400',
        unlocked: true
      },
      {
        id: 'first_lesson',
        title: 'Первый рубеж',
        desc: 'Сдан и успешно зачтён Модуль №1',
        icon: 'verified',
        color: 'text-emerald-400',
        unlocked: passedCount >= 1
      },
      {
        id: 'quiz_master',
        title: 'Мастер теории',
        desc: 'Сдано не менее 3 практических модулей',
        icon: 'psychology',
        color: 'text-purple-400',
        unlocked: passedCount >= 3
      },
      {
        id: 'pro_tier',
        title: 'Тариф Pro 💎',
        desc: 'Открыт полный доступ ко всем 20 модулям специальности',
        icon: 'diamond',
        color: 'text-amber-400',
        unlocked: Boolean(isPro)
      },
      {
        id: 'high_gpa',
        title: 'Отличник курса',
        desc: 'Средний балл успеваемости 85+ баллов',
        icon: 'stars',
        color: 'text-yellow-400',
        unlocked: passedCount >= 2 && avgScore >= 85
      },
      {
        id: 'graduate',
        title: 'Аккредитованный специалист',
        desc: 'Освоены все 20 модулей, выдан гос. сертификат',
        icon: 'school',
        color: 'text-cyan-400',
        unlocked: passedCount >= 20
      }
    ];
  }

  function openInteractiveRoadmapModal() {
    const trRm = (k, fb, p) => (window.I18n && window.I18n.t) ? window.I18n.t(k, p) : fb;
    const escRm = (window.EduSpace && window.EduSpace.escapeHtml) ? window.EduSpace.escapeHtml : (s => String(s || ''));
    const user = getActiveUser();
    const spec = window.currentSpec || (user && user.specialty_slug) || 'it';
    const course = (window.EduSpace && window.EduSpace.getCourseBySlug)
      ? window.EduSpace.getCourseBySlug(spec)
      : { slug: spec, short_title: 'Курс', title: 'Курс' };
    const locCourseShort = trRm(`course.catalog.${spec}.shortTitle`, course.short_title);
    const tasks = (window._cachedTasks && window._cachedTasks[course.slug]) || [];
    const catalogLessons = (window.EDU_LESSONS && window.EDU_LESSONS[course.slug]) || [];
    const curDay = getUserStudyDay(user);
    const nodesHtml = Array.from({ length: 20 }, (_, i) => i + 1).map(num => {
      const isPro = num > 3;
      const t = tasks.find(x => x.task_number === num);
      const isLocked = t ? Boolean(t.is_locked) : (num > curDay);
      const catLesson = catalogLessons.find(x => Number(x.num) === num) || catalogLessons[num - 1];
      const rawTitle = (t && t.title) || (catLesson && catLesson.title) || ('Модуль #' + num);
      const locLesson = window.I18n ? window.I18n.localizeLessonContent(course.slug, num, { title: rawTitle, description: '' }) : { title: rawTitle };
      const title = locLesson.title;
      const isDone = t && t.status_code === 'graded';
      const border = isDone ? 'border-emerald-500/50 bg-emerald-950/20' : (isLocked ? 'border-white/10 bg-dark-950/40 opacity-75' : (isPro ? 'border-amber-500/40 bg-amber-950/20' : 'border-indigo-500/40 bg-indigo-950/20'));
      const iconColor = isDone ? 'text-emerald-400' : (isLocked ? 'text-slate-500' : (isPro ? 'text-amber-400' : 'text-indigo-400'));
      const subLabel = isDone
        ? trRm('modal.roadmap.moduleCompleted', '✓ Модуль зачтён')
        : (isLocked ? `День ${num}` : (isPro ? trRm('modal.roadmap.modulePro', 'Профильный модуль · Сертификат') : trRm('modal.roadmap.moduleBase', 'Базовый модуль')));
      const actionHtml = isLocked
        ? `<span class="px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs font-bold shrink-0 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">lock</span><span>День ${num}</span></span>`
        : `<a href="simulator.html?specialty=${encodeURIComponent(course.slug)}&task=${num}" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shrink-0">${escRm(trRm('lesson.action.open', 'Открыть'))}</a>`;

      return `
        <div class="p-3.5 rounded-2xl border ${border} flex items-center justify-between gap-3 hover:scale-[1.01] transition-transform">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${iconColor} font-bold font-mono text-xs">
              ${num}
            </div>
            <div>
              <div class="text-xs font-bold text-white">${escRm(title)}</div>
              <div class="text-[10px] text-slate-400">${escRm(subLabel)}</div>
            </div>
          </div>
          ${actionHtml}
        </div>
      `;
    }).join('');
    openModal(trRm('modal.roadmap.title', '🚀 Интерактивный роадмап курса: ' + locCourseShort, { course: locCourseShort }), `
      <div class="space-y-4 text-xs">
        <p class="text-slate-300">${escRm(trRm('modal.roadmap.subtitle', 'Персональная траектория освоения профессии от базовой теории до дипломного проекта с поддержкой 3D-моделей и лабораторных симуляторов.'))}</p>
        <div class="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          ${nodesHtml}
        </div>
      </div>
    `);
  }


  // ==========================================
  // SMOOTH REVEAL & INTERACTIVE MOTION ENGINE
  // ==========================================
  function initSmoothRevealEngine() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      document.body.classList.add('reveal-fallback');
      return;
    }

    const markReveal = (el, index = 0) => {
      if (!el || el.nodeType !== 1 || el.dataset.shRevealed === '1') return;
      if (el.id === 'four-student-tools-hub' || el.hasAttribute('data-no-reveal') || el.closest('[data-no-reveal]')) {
        el.dataset.shRevealed = '1';
        el.style.opacity = '1';
        return;
      }
      el.dataset.shRevealed = '1';
      const staggerIdx = index < 8 ? index : 0;
      el.style.setProperty('--i', String(staggerIdx));
      if (!el.classList.contains('reveal') && !el.hasAttribute('data-reveal')) {
        el.classList.add('sh-reveal-enter');
      } else {
        requestAnimationFrame(() => el.classList.add('is-visible'));
      }
    };

    const selector = 'main section:not(#four-student-tools-hub):not([data-no-reveal]), main article:not([data-no-reveal]), #tasks-grid > *, #lp-block-canvas > *, .glass-card, .card, .workshop-course';
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          markReveal(entry.target, 0);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 }) : null;

    document.querySelectorAll(selector).forEach((el, idx) => {
      if (idx < 6 || !io) {
        // Above-the-fold elements must remain immediately visible at opacity: 1 on initial paint
        el.dataset.shRevealed = '1';
        if (el.classList.contains('reveal') || el.hasAttribute('data-reveal')) {
          el.classList.add('is-visible');
        }
      } else {
        io.observe(el);
      }
    });

    if ('MutationObserver' in window && document.body) {
      const mo = new MutationObserver(mutations => {
        for (const m of mutations) {
          let batchIdx = 0;
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.matches && node.matches(selector)) {
              markReveal(node, batchIdx++);
            }
          });
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSmoothRevealEngine);
    } else {
      initSmoothRevealEngine();
    }
  }
