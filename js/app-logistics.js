/* ==========================================================================
   EDU SPACE — Production LMS Engine & Dual Persistence Layer (UTF-8)
   Works seamlessly with Python Flask SQLite (/api/*) AND Static GitHub Pages
   ========================================================================== */

(function () {
  'use strict';

  const SESSION_KEY = 'eduspace_active_session_v3';
  const LOCAL_DB_KEY = 'eduspace_lms_db_v4';
  const TEACHER_CODES = ['AMK2026', 'TEACHER2026', 'EDU2026', 'AMK', 'TEACHER', 'EDU', '2026', 'AMKCOLLEGE', 'ПРЕПОДАВАТЕЛЬ', 'ПРЕПОД'];

  function normalizeTeacherCode(str) {
    if (!str) return '';
    const clean = String(str).trim().replace(/[\s\-_]/g, '').toUpperCase();
    const map = {
      'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H',
      'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X'
    };
    return clean.split('').map(ch => map[ch] || ch).join('');
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
    const hasMinLen = pwd.length >= 6;
    const hasLetter = /[A-Za-zА-Яа-яЁё]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecialOrUpper = /[A-ZА-ЯЁ!@#$%^&*()_+\-=]/.test(pwd);

    let score = 0;
    if (hasMinLen) score++;
    if (hasLetter && hasDigit) score++;
    if (pwd.length >= 8) score++;
    if (hasSpecialOrUpper) score++;

    const valid = hasMinLen && hasLetter && hasDigit;
    return {
      valid,
      score, // 0..4
      error: valid ? null : 'Пароль должен содержать минимум 6 символов, включая буквы и цифры.'
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

  function computeExactDates(unlockDay) {
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const base = new Date();
    base.setHours(9, 0, 0, 0);
    const openDt = new Date(base.getTime() + Math.max(0, unlockDay - 1) * 86400000);
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
    return copy;
  }

  // ==========================================
  // 2. LOCAL RELATIONAL DB FALLBACK (GITHUB PAGES)
  // ==========================================

  async function loadLocalDB() {
    let db = null;
    try {
      const raw = localStorage.getItem(LOCAL_DB_KEY);
      if (raw) db = JSON.parse(raw);
    } catch (e) {}

    if (!db || !Array.isArray(db.users)) {
      const studentHash = await sha256Hex('student123');
      const teacherHash = await sha256Hex('teacher123');
      db = {
        current_study_day: 1,
        next_user_id: 4,
        next_sub_id: 1,
        next_notif_id: 2,
        next_msg_id: 2,
        users: [
          {
            id: 1,
            email: 'student@amk.kz',
            password_hash: studentHash,
            full_name: 'Оспанов Адилет Серикович',
            last_name: 'Оспанов',
            first_name: 'Адилет',
            middle_name: 'Серикович',
            role: 'student',
            group_name: 'ИС-21',
            specialty_slug: 'it',
            department: '',
            student_id: 'KZ-AMK-2026-10001',
            email_verified: true,
            is_demo: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            email: 'voronov@student.amk.kz',
            password_hash: studentHash,
            full_name: 'Воронов Константин Сергеевич',
            last_name: 'Воронов',
            first_name: 'Константин',
            middle_name: 'Сергеевич',
            role: 'student',
            group_name: 'ИС-21',
            specialty_slug: 'it',
            department: '',
            student_id: 'KZ-AMK-2026-98421',
            email_verified: true,
            is_demo: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            email: 'teacher@amk.kz',
            password_hash: teacherHash,
            full_name: 'Иванов Сергей Павлович',
            last_name: 'Иванов',
            first_name: 'Сергей',
            middle_name: 'Павлович',
            role: 'teacher',
            group_name: 'Кафедра ИТ',
            specialty_slug: 'it',
            department: 'Кафедра информационных технологий',
            student_id: null,
            email_verified: true,
            is_demo: true,
            created_at: new Date().toISOString()
          },
          {
            id: 95,
            email: 'real_student_alpha@amk.kz',
            password_hash: studentHash,
            full_name: 'Касымов Алихан Батырович',
            last_name: 'Касымов',
            first_name: 'Алихан',
            middle_name: 'Батырович',
            role: 'student',
            group_name: 'ИС-21',
            specialty_slug: 'it',
            department: '',
            student_id: 'KZ-AMK-2026-10095',
            email_verified: true,
            is_demo: false,
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 96,
            email: 'real_student_beta@amk.kz',
            password_hash: studentHash,
            full_name: 'Садыкова Дильназ Ерлановна',
            last_name: 'Садыкова',
            first_name: 'Дильназ',
            middle_name: 'Ерлановна',
            role: 'student',
            group_name: 'ГД-22',
            specialty_slug: 'graphic_design',
            department: '',
            student_id: 'KZ-AMK-2026-10096',
            email_verified: true,
            is_demo: false,
            created_at: new Date(Date.now() - 1800000).toISOString()
          }
        ],
        verifications: {},
        enrollments: [
          { user_id: 1, specialty_slug: 'it' },
          { user_id: 2, specialty_slug: 'it' },
          { user_id: 95, specialty_slug: 'it' },
          { user_id: 96, specialty_slug: 'graphic_design' }
        ],
        progress: {},
        custom_tasks: {},
        submissions: [],
        notifications: [
          {
            id: 1,
            user_id: null,
            target_group: '',
            title: 'Добро пожаловать на образовательную платформу EDU SPACE!',
            body: 'Обучение начинается с Урока №1. Изучите теоретический конспект, ответьте на 3 проверочных вопроса и выполните практику в тренажёре.',
            type: 'info',
            is_read: false,
            created_at: new Date().toLocaleString('ru-RU')
          }
        ],
        messages: [
          {
            id: 1,
            sender_id: 3,
            sender_name: 'Куратор курса',
            sender_role: 'teacher',
            recipient_key: 'general',
            body: 'Здравствуйте! Если возникнут вопросы по теории или автотестам урока — пишите в этот чат, я на связи.',
            created_at: 'Сегодня, 09:05'
          }
        ]
      };
      saveLocalDB(db);
    }
    return db;
  }

  function saveLocalDB(db) {
    try {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
    } catch (e) {}
  }

  async function handleLocalApi(urlStr, options = {}) {
    const db = await loadLocalDB();
    const base = (window.location && window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'http://localhost';
    const uObj = new URL(urlStr, base);
    const path = uObj.pathname;
    const params = uObj.searchParams;
    const method = (options.method || 'GET').toUpperCase();
    let body = {};
    if (options.body) {
      try { body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body; } catch (e) {}
    }

    const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, data });

    // 1. Send email verification code
    if (path === '/api/auth/send_code' && method === 'POST') {
      const emCheck = validateEmailFormat(body.email);
      if (!emCheck.valid) return reply(400, { success: false, message: emCheck.error });
      const email = emCheck.email;
      if (db.users.some(u => u.email === email)) {
        return reply(409, { success: false, message: 'Пользователь с таким email уже зарегистрирован. Перейдите на вкладку «Вход».' });
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      db.verifications[email] = {
        code,
        expires_at: Date.now() + 600000,
        verified: false
      };
      saveLocalDB(db);
      return reply(200, {
        success: true,
        message: `6-значный код подтверждения отправлен на ${email}`,
        expires_in_seconds: 600,
        mail_preview: {
          to: email,
          from: 'noreply@eduspace.amk.kz',
          subject: 'Подтверждение электронной почты EDU SPACE',
          code
        }
      });
    }

    // 2. Verify email code
    if (path === '/api/auth/verify_code' && method === 'POST') {
      const email = (body.email || '').trim().toLowerCase();
      const code = String(body.code || '').trim();
      const rec = db.verifications[email];
      if (!rec) return reply(400, { success: false, message: 'Сначала запросите код подтверждения на почту.' });
      if (Date.now() > rec.expires_at) return reply(400, { success: false, message: 'Срок действия кода истёк. Запросите новый код.' });
      if (rec.code !== code) return reply(400, { success: false, message: 'Неверный 6-значный код подтверждения. Проверьте письмо.' });
      rec.verified = true;
      saveLocalDB(db);
      return reply(200, { success: true, verified: true, message: 'Электронная почта успешно подтверждена!' });
    }

    // 3. Register
    if (path === '/api/auth/register' && method === 'POST') {
      const role = (body.role || 'student').trim().toLowerCase();
      if (!['student', 'teacher'].includes(role)) {
        return reply(400, { success: false, message: 'Недопустимая роль пользователя.' });
      }
      const fio = validateFioFields(body);
      if (!fio.valid) return reply(400, { success: false, message: fio.error });

      const emCheck = validateEmailFormat(body.email);
      if (!emCheck.valid) return reply(400, { success: false, message: emCheck.error });
      const email = emCheck.email;

      const pwdCheck = validatePasswordStrength(body.password);
      if (!pwdCheck.valid) return reply(400, { success: false, message: pwdCheck.error });

      if (role === 'teacher') {
        const rawCode = (body.teacher_code || '').trim();
        const normCode = normalizeTeacherCode(rawCode);
        const isValid = !rawCode || TEACHER_CODES.includes(normCode) || normCode.includes('AMK') || normCode.includes('TEACHER') || normCode.includes('ПРЕПОД') || normCode.startsWith('AMK') || normCode === '2026' || normCode.includes('2026');
        if (!isValid) {
          return reply(403, { success: false, message: 'Неверный служебный код преподавателя. Код кафедры: AMK2026 (можно вводить русскими или латинскими буквами).' });
        }
      }

      if (db.users.some(u => u.email === email)) {
        return reply(409, { success: false, message: 'Пользователь с таким email уже зарегистрирован.' });
      }

      const verRec = db.verifications[email];
      const vCode = String(body.verification_code || '').trim();
      if (!verRec) {
        return reply(400, { success: false, require_verification: true, message: 'Сначала подтвердите электронную почту 6-значным кодом.' });
      }
      if (!verRec.verified) {
        if (vCode && verRec.code === vCode && Date.now() <= verRec.expires_at) {
          verRec.verified = true;
        } else {
          return reply(400, { success: false, require_verification: true, message: 'Электронная почта не подтверждена или введён неверный код.' });
        }
      }

      const uid = db.next_user_id++;
      const specSlug = getCourseBySlug(body.specialty_slug || 'it').slug;
      const dept = (body.department || 'Кафедра профильных дисциплин АМК').trim();
      const groupName = role === 'teacher' ? dept : ((body.group_name || 'ИС-21').trim());
      const pwdHash = await sha256Hex(body.password);

      const newUser = {
        id: uid,
        email,
        password_hash: pwdHash,
        full_name: fio.full_name,
        last_name: fio.last_name,
        first_name: fio.first_name,
        middle_name: fio.middle_name,
        role,
        group_name: groupName,
        specialty_slug: specSlug,
        department: role === 'teacher' ? dept : '',
        student_id: role === 'student' ? `KZ-AMK-2026-${10000 + uid}` : null,
        email_verified: true,
        is_demo: false,
        created_at: new Date().toISOString()
      };
      db.users.push(newUser);
      if (role === 'student') {
        db.enrollments.push({ user_id: uid, specialty_slug: specSlug });
        const courseObj = getCourseBySlug(specSlug);
        db.notifications.unshift({
          id: db.next_notif_id++,
          user_id: uid,
          target_group: '',
          title: `Вы зачислены на курс «${courseObj.short_title}»!`,
          body: `${fio.first_name}, ваш аккаунт и почта ${email} подтверждены. Прогресс 0% — приступайте к Уроку №1.`,
          type: 'success',
          is_read: false,
          created_at: new Date().toLocaleString('ru-RU')
        });
      }
      saveLocalDB(db);
      return reply(201, {
        success: true,
        message: `Регистрация успешно завершена! Добро пожаловать, ${fio.first_name}!`,
        user: enrichUserObject(newUser)
      });
    }

    // 4. Login
    if (path === '/api/auth/login' && method === 'POST') {
      const email = (body.email || '').trim().toLowerCase();
      const password = (body.password || '').trim();
      if (!email || !password) return reply(400, { success: false, message: 'Введите email и пароль.' });
      const pwdHash = await sha256Hex(password);
      const found = db.users.find(u => u.email === email && u.password_hash === pwdHash);
      if (!found) {
        return reply(401, { success: false, message: 'Неверный email или пароль. Проверьте введённые данные.' });
      }
      const uOut = enrichUserObject(found);
      return reply(200, { success: true, message: `Добро пожаловать, ${uOut.full_name}!`, user: uOut });
    }

    // 5. Courses list & Enroll
    if (path === '/api/courses' && method === 'GET') {
      const uid = Number(params.get('user_id') || 0);
      const enrolledSet = new Set(db.enrollments.filter(e => e.user_id === uid).map(e => e.specialty_slug));
      const coursesOut = getCoursesList().map(c => {
        const passed = new Set(
          db.submissions
            .filter(s => s.user_id === uid && s.specialty_slug === c.slug && s.score >= 60)
            .map(s => s.task_number)
        ).size;
        return Object.assign({}, c, {
          enrolled: enrolledSet.has(c.slug),
          completed_lessons: passed,
          total_lessons: 10,
          progress_percent: Math.min(100, Math.round((passed / 10) * 100))
        });
      });
      return reply(200, { success: true, courses: coursesOut, current_study_day: db.current_study_day });
    }

    if (path === '/api/courses/enroll' && method === 'POST') {
      const uid = Number(body.user_id);
      const slug = getCourseBySlug(body.specialty_slug || 'it').slug;
      const u = db.users.find(x => x.id === uid);
      if (!u) return reply(404, { success: false, message: 'Пользователь не найден.' });
      if (!db.enrollments.some(e => e.user_id === uid && e.specialty_slug === slug)) {
        db.enrollments.push({ user_id: uid, specialty_slug: slug });
      }
      u.specialty_slug = slug;
      saveLocalDB(db);
      return reply(200, {
        success: true,
        message: `Вы переключились на курс «${getCourseBySlug(slug).title}»!`,
        user: enrichUserObject(u)
      });
    }

    // 6. User Profile GET & PUT
    if (path.startsWith('/api/user/profile/') && method === 'GET') {
      const uid = Number(path.split('/').pop());
      const u = db.users.find(x => x.id === uid);
      if (!u) return reply(404, { success: false, message: 'Пользователь не найден.' });
      const uOut = enrichUserObject(u);
      const specSlug = params.get('specialty') || uOut.specialty_slug || 'it';
      const courseMeta = getCourseBySlug(specSlug);

      const userSubs = db.submissions.filter(s => s.user_id === uid);
      const specSubs = userSubs.filter(s => s.specialty_slug === specSlug);
      const passedNums = new Set(specSubs.filter(s => s.score >= 60).map(s => s.task_number));
      const validScores = specSubs.filter(s => s.score > 0).map(s => s.score);
      const avgScore = validScores.length ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)) : 0;
      const gpa = validScores.length ? Number(((avgScore / 100) * 4).toFixed(2)) : 0;
      const xp = userSubs.filter(s => s.score >= 60).reduce((acc, s) => acc + s.score * 3, 0);
      const level = 1 + Math.floor(xp / 500);

      const skillsOut = (courseMeta.skills || []).map(sk => {
        const tList = sk.tasks || [];
        const doneCnt = tList.filter(tn => passedNums.has(tn)).length;
        const minUnlock = tList.length ? Math.min(...tList) : 1;
        return {
          key: sk.key,
          name: sk.name,
          tasks: tList,
          completed: doneCnt,
          total: tList.length,
          percent: tList.length ? Math.round((doneCnt / tList.length) * 100) : 0,
          unlocked: db.current_study_day >= minUnlock,
          unlock_day: minUnlock
        };
      });

      const enrolledSlugs = db.enrollments.filter(e => e.user_id === uid).map(e => e.specialty_slug);

      return reply(200, {
        success: true,
        profile: uOut,
        active_course: courseMeta,
        enrolled_courses: enrolledSlugs,
        current_study_day: db.current_study_day,
        statistics: {
          total_submitted: specSubs.length,
          passed_count: passedNums.size,
          progress_percent: Math.min(100, Math.round((passedNums.size / 10) * 100)),
          avg_score: avgScore,
          gpa,
          xp,
          level
        },
        skills: skillsOut,
        submissions: userSubs.slice().reverse()
      });
    }

    if (path === '/api/user/profile' && method === 'PUT') {
      const uid = Number(body.user_id);
      const u = db.users.find(x => x.id === uid);
      if (!u) return reply(404, { success: false, message: 'Пользователь не найден.' });
      const fio = validateFioFields(body);
      if (!fio.valid) return reply(400, { success: false, message: fio.error });

      if (body.new_password) {
        const pc = validatePasswordStrength(body.new_password);
        if (!pc.valid) return reply(400, { success: false, message: pc.error });
        u.password_hash = await sha256Hex(body.new_password);
      }

      u.full_name = fio.full_name;
      u.last_name = fio.last_name;
      u.first_name = fio.first_name;
      u.middle_name = fio.middle_name;
      if (body.group_name) u.group_name = body.group_name.trim();
      if (body.specialty_slug) {
        u.specialty_slug = getCourseBySlug(body.specialty_slug).slug;
        if (!db.enrollments.some(e => e.user_id === uid && e.specialty_slug === u.specialty_slug)) {
          db.enrollments.push({ user_id: uid, specialty_slug: u.specialty_slug });
        }
      }
      saveLocalDB(db);
      return reply(200, { success: true, message: 'Профиль успешно сохранён!', user: enrichUserObject(u) });
    }

    // 7. Tasks list, Progress & Submit (with strict Drip-Feed Lock)
    if (path === '/api/tasks' && method === 'GET') {
      const spec = params.get('specialty') || 'it';
      const uid = Number(params.get('user_id') || 0);
      const curDay = db.current_study_day;
      const slugs = params.get('specialty') ? [spec] : getCoursesList().map(c => c.slug);

      const tasksOut = [];
      let globalId = 1;
      for (const sSlug of slugs) {
        const catLessons = (window.EDU_LESSONS && window.EDU_LESSONS[sSlug]) || [];
        for (let i = 1; i <= 10; i++) {
          const customKey = `${sSlug}:${i}`;
          const custom = db.custom_tasks[customKey];
          const base = catLessons.find(x => Number(x.num) === i) || {
            num: i,
            title: `Урок ${i}`,
            difficulty: 'Средний',
            time_limit: '60 мин',
            tools: 'Практикум EDU SPACE',
            task_prompt: 'Выполните практическое задание модуля.',
            starter_code: ''
          };
          const unlockDay = custom ? Number(custom.unlock_day || i) : i;
          const isLocked = unlockDay > curDay;
          const sub = uid ? db.submissions.find(s => s.user_id === uid && s.specialty_slug === sSlug && s.task_number === i) : null;
          const prog = uid ? db.progress[`${uid}:${sSlug}:${i}`] : null;
          const dates = computeExactDates(unlockDay);

          let statusCode = 'available';
          let statusLabel = 'Доступно';
          let score = 0;
          let gradeLetter = '—';

          if (isLocked) {
            statusCode = 'locked';
            statusLabel = 'Заблокировано';
          } else if (sub) {
            score = sub.score;
            gradeLetter = sub.grade_letter;
            const stLow = (sub.status || '').toLowerCase();
            if (stLow.includes('на проверке') || stLow === 'submitted') {
              statusCode = 'submitted';
              statusLabel = 'Отправлено на проверку';
            } else if (stLow.includes('доработ') || score < 60) {
              statusCode = 'revision';
              statusLabel = 'На доработке';
            } else {
              statusCode = 'graded';
              statusLabel = sub.status;
            }
          } else if (prog) {
            statusCode = 'in_progress';
            statusLabel = 'В процессе';
          }

          tasksOut.push({
            id: globalId++,
            specialty_slug: sSlug,
            task_number: i,
            title: custom ? custom.title : base.title,
            difficulty: custom ? custom.difficulty : base.difficulty,
            time_limit: base.time_limit || '60 мин',
            unlock_day: unlockDay,
            unlock_date_text: unlockDay === 1 ? 'Доступно в День 1' : `Откроется в День ${unlockDay}`,
            deadline_text: `День ${unlockDay + 2}, 23:59`,
            unlock_date_exact: dates.openText,
            deadline_exact: dates.deadlineText,
            description: custom ? custom.description : base.task_prompt,
            tools_required: custom ? custom.tools_required : base.tools,
            starter_code: custom ? custom.starter_code : base.starter_code,
            current_study_day: curDay,
            is_locked: isLocked,
            status_code: statusCode,
            status: statusCode === 'available' || statusCode === 'locked' ? statusCode : statusLabel,
            status_label: statusLabel,
            student_score: score,
            grade_letter: gradeLetter,
            teacher_comment: sub ? sub.teacher_comment : null,
            quiz_score: (sub && sub.quiz_score) || (prog && prog.quiz_score) || 0,
            draft_code: prog ? prog.draft_code : null
          });
        }
      }

      return reply(200, {
        success: true,
        current_study_day: curDay,
        count: tasksOut.length,
        tasks: tasksOut
      });
    }

    if (path === '/api/tasks/progress' && method === 'POST') {
      const uid = Number(body.user_id);
      const spec = (body.specialty_slug || 'it').trim().toLowerCase();
      const num = Number(body.task_number || 1);
      if (!uid) return reply(401, { success: false, message: 'Требуется авторизация.' });
      if (num > db.current_study_day) {
        return reply(403, { success: false, is_locked: true, error: `Урок №${num} заблокирован до Дня ${num}.` });
      }
      const key = `${uid}:${spec}:${num}`;
      const prev = db.progress[key] || { quiz_score: 0, draft_code: '' };
      db.progress[key] = {
        quiz_score: body.quiz_score !== undefined ? Number(body.quiz_score) : prev.quiz_score,
        draft_code: body.draft_code !== undefined ? body.draft_code : prev.draft_code,
        updated_at: new Date().toISOString()
      };
      saveLocalDB(db);
      return reply(200, { success: true, message: 'Прогресс сохранён.', quiz_score: db.progress[key].quiz_score });
    }

    if (path === '/api/tasks/submit' && method === 'POST') {
      const uid = Number(body.user_id || 1);
      const spec = (body.specialty_slug || 'it').trim().toLowerCase();
      const num = Number(body.task_number || 1);
      const custom = db.custom_tasks[`${spec}:${num}`];
      const unlockDay = custom ? Number(custom.unlock_day || num) : num;

      if (unlockDay > db.current_study_day) {
        return reply(403, {
          success: false,
          is_locked: true,
          error: `Нельзя отправить заблокированное задание! Оно откроется в День ${unlockDay}.`
        });
      }

      const u = db.users.find(x => x.id === uid);
      const studentName = u ? u.full_name : (body.student_name || 'Студент');
      const groupName = (u && u.group_name) || body.group_name || 'ИС-21';
      const studentId = (u && u.student_id) || body.student_id || `KZ-AMK-2026-${10000 + uid}`;
      const score = Math.max(0, Math.min(100, Number(body.score ?? 100)));
      const awaitTeacher = Boolean(body.await_teacher);

      const lessonObj = getLessonFromCatalog(spec, num);
      const taskTitle = (custom && custom.title) || (lessonObj && lessonObj.title) || body.task_title || `Урок №${num}`;

      let gradeLetter = '—';
      let status = 'Отправлено на проверку';
      if (!awaitTeacher) {
        if (score >= 90) { gradeLetter = 'A'; status = 'Проверено (Отлично)'; }
        else if (score >= 75) { gradeLetter = 'B'; status = 'Проверено (Хорошо)'; }
        else if (score >= 60) { gradeLetter = 'C'; status = 'Проверено (Зачтено)'; }
        else { gradeLetter = 'F'; status = 'На доработке'; }
      }

      let sub = db.submissions.find(s => s.user_id === uid && s.specialty_slug === spec && s.task_number === num);
      if (sub) {
        Object.assign(sub, {
          student_name: studentName,
          group_name: groupName,
          task_title: taskTitle,
          score,
          grade_letter: gradeLetter,
          status,
          submitted_code: body.submitted_code || '',
          repo_url: body.repo_url || '',
          student_comment: body.student_comment || '',
          autotest_passed: Number(body.autotest_passed || 0),
          autotest_total: Number(body.autotest_total || 0),
          quiz_score: Number(body.quiz_score || 0),
          updated_at: new Date().toLocaleString('ru-RU')
        });
      } else {
        sub = {
          id: db.next_sub_id++,
          user_id: uid,
          student_id: studentId,
          student_name: studentName,
          group_name: groupName,
          specialty_slug: spec,
          task_number: num,
          task_title: taskTitle,
          score,
          grade_letter: gradeLetter,
          status,
          submitted_code: body.submitted_code || '',
          repo_url: body.repo_url || '',
          student_comment: body.student_comment || '',
          autotest_passed: Number(body.autotest_passed || 0),
          autotest_total: Number(body.autotest_total || 0),
          quiz_score: Number(body.quiz_score || 0),
          teacher_comment: null,
          created_at: new Date().toLocaleString('ru-RU'),
          updated_at: new Date().toLocaleString('ru-RU')
        };
        db.submissions.push(sub);
      }

      saveLocalDB(db);
      return reply(200, {
        success: true,
        message: awaitTeacher
          ? `Работа отправлена преподавателю на проверку (результат автотестов: ${score}/100)!`
          : `Работа успешно проверена! Ваш балл: ${score}/100 (${gradeLetter}).`,
        result: { score, grade_letter: gradeLetter, status, task_title: taskTitle, submission_id: sub.id }
      });
    }

    // 8. Demo Status & Isolated Reset
    if (path === '/api/demo/status' && method === 'GET') {
      const uid = Number(params.get('user_id') || 1);
      const spec = params.get('specialty') || 'it';
      const subs = db.submissions.filter(s => s.user_id === uid && s.specialty_slug === spec && s.score >= 60);
      const done = new Set(subs.map(s => s.task_number)).size;
      const avg = subs.length ? Number((subs.reduce((a, b) => a + b.score, 0) / subs.length).toFixed(1)) : 0;
      return reply(200, {
        success: true,
        current_study_day: db.current_study_day,
        progress_percent: Math.min(100, Math.round((done / 10) * 100)),
        completed_count: done,
        avg_score: avg,
        tasks_available: Math.min(10, db.current_study_day),
        tasks_locked: Math.max(0, 10 - db.current_study_day),
        is_fresh_start: done === 0 && db.current_study_day === 1
      });
    }

    if (path === '/api/demo/reset' && method === 'POST') {
      const demoIds = new Set(db.users.filter(u => u.is_demo).map(u => u.id));
      db.submissions = db.submissions.filter(s => !demoIds.has(s.user_id));
      Object.keys(db.progress).forEach(k => {
        const uid = Number(k.split(':')[0]);
        if (demoIds.has(uid)) delete db.progress[k];
      });
      db.current_study_day = 1;
      saveLocalDB(db);
      return reply(200, {
        success: true,
        message: 'Демоверсия сброшена к началу: День 1, 0% прогресса, открыт только Урок №1. Реальные аккаунты сохранены.',
        status: { progress_percent: 0, completed_count: 0, current_study_day: 1 }
      });
    }

    // 9. Teacher Studio Endpoints
    if (path === '/api/teacher/advance_day' && method === 'POST') {
      const target = body.day !== undefined ? Number(body.day) : db.current_study_day + 1;
      db.current_study_day = Math.max(1, Math.min(10, target));
      saveLocalDB(db);
      return reply(200, {
        success: true,
        message: `График обучения переключён на День ${db.current_study_day}. Разблокированы уроки с 1 по ${db.current_study_day}.`,
        current_study_day: db.current_study_day
      });
    }

    if (path === '/api/teacher/stats' && method === 'GET') {
      const students = db.users.filter(u => u.role === 'student').length;
      const totalSubs = db.submissions.length;
      const pending = db.submissions.filter(s => s.status === 'Отправлено на проверку').length;
      const scored = db.submissions.filter(s => s.score > 0);
      const avg = scored.length ? Number((scored.reduce((a, b) => a + b.score, 0) / scored.length).toFixed(1)) : 0;
      return reply(200, {
        success: true,
        stats: {
          total_students: students,
          total_submissions: totalSubs,
          pending_submissions: pending,
          average_score: avg,
          current_study_day: db.current_study_day
        }
      });
    }

    // 9.1 Teacher Students List
    if (path === '/api/teacher/students' && method === 'GET') {
      const spec = params.get('specialty');
      const groupFilter = params.get('group');
      let students = db.users.filter(u => u.role === 'student');
      if (spec) students = students.filter(u => u.specialty_slug === spec);
      if (groupFilter) students = students.filter(u => u.group_name === groupFilter);

      students.sort((a, b) => Number(a.is_demo) - Number(b.is_demo) || (new Date(b.created_at || 0) - new Date(a.created_at || 0)));

      const out = students.map(st => {
        const enriched = enrichUserObject(st);
        const userSubs = db.submissions.filter(s => s.user_id === st.id);
        const passedSubs = userSubs.filter(s => s.score >= 60);
        const scoredSubs = userSubs.filter(s => s.score > 0);
        const avg = scoredSubs.length ? Number((scoredSubs.reduce((a, b) => a + b.score, 0) / scoredSubs.length).toFixed(1)) : 0;
        const lastAct = userSubs.length ? (userSubs[userSubs.length - 1].updated_at || userSubs[userSubs.length - 1].created_at) : (st.created_at || 'Недавно');

        enriched.submitted_count = userSubs.length;
        enriched.passed_count = new Set(passedSubs.map(s => s.task_number)).size;
        enriched.avg_score = avg;
        enriched.last_activity = lastAct;
        return enriched;
      });

      return reply(200, { success: true, count: out.length, students: out, current_study_day: db.current_study_day });
    }

    // 9.2 Teacher Sync User from Flask or static
    if (path === '/api/teacher/sync_user' && method === 'POST') {
      const email = (body.email || '').trim().toLowerCase();
      if (!email) return reply(400, { success: false, message: 'Email обязателен' });
      let existing = db.users.find(u => u.email === email);
      if (!existing) {
        const uid = db.next_user_id++;
        const newUser = {
          id: uid,
          email,
          password_hash: body.password_hash || 'placeholder',
          full_name: body.full_name || 'Студент',
          last_name: body.last_name || '',
          first_name: body.first_name || '',
          middle_name: body.middle_name || '',
          role: body.role || 'student',
          group_name: body.group_name || 'ИС-21',
          specialty_slug: body.specialty_slug || 'it',
          department: body.department || '',
          student_id: body.student_id || `KZ-AMK-2026-${10000 + uid}`,
          email_verified: true,
          is_demo: Boolean(body.is_demo),
          created_at: body.created_at || new Date().toISOString()
        };
        db.users.push(newUser);
        saveLocalDB(db);
        return reply(200, { success: true, message: 'Пользователь сохранён в localStorage', user: enrichUserObject(newUser) });
      }
      return reply(200, { success: true, message: 'Пользователь уже есть в localStorage', user: enrichUserObject(existing) });
    }

    // 9.3 Simulate Student Submission for Instant Review
    if (path === '/api/teacher/simulate_submission' && method === 'POST') {
      const uid = body.user_id ? Number(body.user_id) : null;
      let targetStudent = null;
      if (uid) {
        targetStudent = db.users.find(u => u.id === uid && u.role === 'student');
      } else {
        targetStudent = db.users.find(u => u.role === 'student' && !u.is_demo) || db.users.find(u => u.role === 'student');
      }
      if (!targetStudent) return reply(404, { success: false, message: 'Студенты не найдены' });

      const spec = body.specialty_slug || targetStudent.specialty_slug || 'it';
      const taskNum = Number(body.task_number || 1);
      const lesson = getLessonFromCatalog(spec, taskNum);
      const taskTitle = lesson ? lesson.title : `Практический урок №${taskNum}`;

      const existingIndex = db.submissions.findIndex(s => s.user_id === targetStudent.id && s.specialty_slug === spec && s.task_number === taskNum);
      const subObj = {
        id: existingIndex >= 0 ? db.submissions[existingIndex].id : db.next_sub_id++,
        user_id: targetStudent.id,
        student_id: targetStudent.student_id || `KZ-AMK-2026-${10000 + targetStudent.id}`,
        student_name: targetStudent.full_name,
        group_name: targetStudent.group_name || 'ИС-21',
        task_id: taskNum,
        specialty_slug: spec,
        task_number: taskNum,
        task_title: taskTitle,
        score: 90,
        grade_letter: '—',
        status: 'Отправлено на проверку',
        time_spent_seconds: 1200,
        submitted_code: '<!DOCTYPE html>\n<html lang="ru">\n<head>\n  <title>Макет карточки студента</title>\n  <style>\n    .card { padding: 20px; border-radius: 12px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h2>Выполненное практическое задание</h2>\n    <p>Решение сдано на проверку куратору. Все критерии выполнены.</p>\n  </div>\n</body>\n</html>',
        repo_url: 'https://github.com/amk-student/project-demo',
        student_comment: `Здравствуйте, Сергей Павлович! Выполнил практическое задание №${taskNum}. Проверьте, пожалуйста, соответствие критериям и чистоту кода.`,
        autotest_passed: 3,
        autotest_total: 3,
        quiz_score: 3,
        teacher_comment: '',
        created_at: new Date().toLocaleString('ru-RU'),
        updated_at: new Date().toLocaleString('ru-RU')
      };

      if (existingIndex >= 0) {
        db.submissions[existingIndex] = subObj;
      } else {
        db.submissions.unshift(subObj);
      }
      saveLocalDB(db);
      return reply(200, {
        success: true,
        message: `Тестовая работа от студента ${targetStudent.full_name} (Урок №${taskNum}) успешно отправлена в очередь на проверку!`,
        submission_id: subObj.id
      });
    }

    if ((path === '/api/teacher/journal' || path === '/api/teacher/submissions') && method === 'GET') {
      const spec = params.get('specialty');
      let list = db.submissions.slice().reverse();
      if (spec) list = list.filter(s => s.specialty_slug === spec);
      return reply(200, { success: true, count: list.length, current_study_day: db.current_study_day, journal: list });
    }

    if (path === '/api/teacher/matrix' && method === 'GET') {
      const spec = params.get('specialty') || 'it';
      const students = db.users
        .filter(u => u.role === 'student')
        .sort((a, b) => Number(a.is_demo) - Number(b.is_demo) || a.full_name.localeCompare(b.full_name))
        .map(enrichUserObject);

      const rows = students.map(st => {
        const cells = {};
        const scores = [];
        for (let n = 1; n <= 10; n++) {
          const s = db.submissions.find(x => x.user_id === st.id && x.specialty_slug === spec && x.task_number === n);
          if (s) {
            cells[String(n)] = s;
            if (s.score > 0) scores.push(s.score);
          }
        }
        return {
          student: st,
          cells,
          completed_count: Object.values(cells).filter(v => v.score >= 60).length,
          avg_score: scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0
        };
      });

      return reply(200, { success: true, specialty: spec, current_study_day: db.current_study_day, rows });
    }

    if (path === '/api/teacher/grade_submission' && method === 'POST') {
      const subId = Number(body.submission_id);
      const grade = Math.max(0, Math.min(100, Number(body.grade ?? 95)));
      const feedback = (body.feedback || 'Работа проверена преподавателем.').trim();
      const action = (body.action || 'approve').trim().toLowerCase();

      const sub = db.submissions.find(s => s.id === subId);
      if (!sub) return reply(404, { success: false, message: 'Работа не найдена.' });

      if (action === 'revision' || grade < 60) {
        sub.grade_letter = grade < 60 ? 'F' : 'C';
        sub.status = 'На доработке';
      } else {
        sub.grade_letter = grade >= 90 ? 'A' : (grade >= 75 ? 'B' : 'C');
        sub.status = `Проверено (${grade}/100)`;
      }
      sub.score = grade;
      sub.teacher_comment = feedback;
      sub.updated_at = new Date().toLocaleString('ru-RU');

      db.notifications.unshift({
        id: db.next_notif_id++,
        user_id: sub.user_id,
        target_group: '',
        title: sub.status === 'На доработке'
          ? `Урок №${sub.task_number} отправлен на доработку`
          : `Выставлена оценка ${grade}/100 за Урок №${sub.task_number}`,
        body: `Рецензия преподавателя: ${feedback}`,
        type: sub.status === 'На доработке' ? 'warning' : 'success',
        is_read: false,
        created_at: new Date().toLocaleString('ru-RU')
      });

      saveLocalDB(db);
      return reply(200, {
        success: true,
        message: sub.status === 'На доработке'
          ? 'Работа возвращена студенту на доработку!'
          : `Оценка ${grade}/100 сохранена в электронном журнале!`
      });
    }

    if (path === '/api/teacher/create_task' && method === 'POST') {
      const spec = (body.specialty_slug || 'it').trim().toLowerCase();
      const num = Math.max(1, Math.min(10, Number(body.task_number || 1)));
      if (!body.title || !body.description) {
        return reply(400, { success: false, message: 'Заполните название и описание задания.' });
      }
      db.custom_tasks[`${spec}:${num}`] = {
        title: body.title.trim(),
        description: body.description.trim(),
        difficulty: body.difficulty || 'Средний',
        unlock_day: Math.max(1, Math.min(10, Number(body.unlock_day || num))),
        tools_required: body.tools_required || 'Практикум EDU SPACE',
        starter_code: body.starter_code || '// Введите решение\n'
      };
      saveLocalDB(db);
      return reply(200, { success: true, message: `Задание №${num} успешно обновлено в программе курса!` });
    }

    if (path === '/api/teacher/broadcast' && method === 'POST') {
      if (!body.title || !body.body) {
        return reply(400, { success: false, message: 'Введите тему и текст объявления.' });
      }
      db.notifications.unshift({
        id: db.next_notif_id++,
        user_id: null,
        target_group: (body.target_group || '').trim(),
        title: body.title.trim(),
        body: body.body.trim(),
        type: 'info',
        is_read: false,
        created_at: new Date().toLocaleString('ru-RU')
      });
      saveLocalDB(db);
      return reply(200, { success: true, message: 'Объявление доставлено студентам!' });
    }

    // 10. Notifications & Messages
    if (path === '/api/notifications' && method === 'GET') {
      const uid = Number(params.get('user_id') || -1);
      const grp = params.get('group_name') || '';
      const list = db.notifications.filter(n =>
        n.user_id === uid || (n.user_id === null && (!n.target_group || n.target_group === grp))
      );
      return reply(200, {
        success: true,
        unread_count: list.filter(x => !x.is_read).length,
        notifications: list
      });
    }

    if (path === '/api/notifications/read' && method === 'POST') {
      const uid = Number(body.user_id || -1);
      db.notifications.forEach(n => {
        if (n.user_id === uid || n.user_id === null) n.is_read = true;
      });
      saveLocalDB(db);
      return reply(200, { success: true });
    }

    if (path === '/api/messages' && method === 'GET') {
      const ch = params.get('channel') || 'general';
      return reply(200, { success: true, messages: db.messages.filter(m => m.recipient_key === ch) });
    }

    if (path === '/api/messages/send' && method === 'POST') {
      const text = (body.body || '').trim();
      if (!text) return reply(400, { success: false, message: 'Введите текст сообщения.' });
      db.messages.push({
        id: db.next_msg_id++,
        sender_id: body.sender_id || null,
        sender_name: body.sender_name || 'Пользователь',
        sender_role: body.sender_role || 'student',
        recipient_key: body.channel || 'general',
        body: text,
        created_at: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      });
      saveLocalDB(db);
      return reply(200, { success: true });
    }

    return reply(200, { success: true });
  }

  // ==========================================
  // 3. UNIFIED API CLIENT (FLASK FIRST -> LOCAL FALLBACK)
  // ==========================================

  let backendMode = null; // 'flask' | 'local'

  async function apiRequest(url, options = {}) {
    const fetchOpts = Object.assign({}, options);
    fetchOpts.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (fetchOpts.body && typeof fetchOpts.body !== 'string') {
      fetchOpts.body = JSON.stringify(fetchOpts.body);
    }

    if (backendMode !== 'local') {
      try {
        const res = await fetch(url, fetchOpts);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          backendMode = 'flask';
          const data = await res.json();

          // Bi-directional sync between Flask and localStorage
          if (url.includes('/api/auth/register') && data.success && data.user) {
            try {
              const db = await loadLocalDB();
              if (!db.users.some(u => u.email === data.user.email)) {
                db.users.push(data.user);
                saveLocalDB(db);
              }
            } catch (e) {}
          }

          if (url.includes('/api/teacher/students') && data.success && Array.isArray(data.students)) {
            try {
              const db = await loadLocalDB();
              let updated = false;
              data.students.forEach(st => {
                if (!db.users.some(u => u.email === st.email)) {
                  db.users.push(st);
                  updated = true;
                }
              });
              // Push any local real students to Flask if Flask is missing them
              db.users.filter(u => u.role === 'student' && !u.is_demo).forEach(lu => {
                if (!data.students.some(s => s.email === lu.email)) {
                  fetch('/api/teacher/sync_user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(lu)
                  }).catch(() => {});
                }
              });
              if (updated) saveLocalDB(db);
            } catch (e) {}
          }

          return { ok: res.ok, status: res.status, data };
        }
        // Static server (like GitHub Pages) returned 404/405 HTML
        backendMode = 'local';
      } catch (e) {
        backendMode = 'local';
      }
    }

    return handleLocalApi(url, options);
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

  function logoutUser() {
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
      body: { user_id: active ? active.id : null }
    });
    showToast((res.data && res.data.message) || 'Демоверсия сброшена к началу!', 'success');
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
      <span class="leading-snug">${message}</span>
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
          <span>Входящее письмо (${mailPreview.to})</span>
        </span>
        <button type="button" onclick="this.closest('#edu-incoming-mail-card').remove()" class="w-6 h-6 rounded flex items-center justify-center hover:bg-white/20 transition-colors">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div class="p-4 space-y-2.5 text-xs text-slate-200">
        <div class="text-[11px] text-slate-400">От: <strong class="text-indigo-300">${mailPreview.from}</strong></div>
        <div class="font-bold text-white">${mailPreview.subject}</div>
        <p class="text-slate-300 leading-relaxed">Ваш одноразовый код подтверждения электронной почты для регистрации в EDU SPACE:</p>
        <div class="py-2.5 px-4 rounded-xl bg-dark-950/80 border border-indigo-500/30 text-center font-mono font-extrabold text-2xl tracking-[0.35em] text-indigo-400 select-all shadow-inner">
          ${mailPreview.code}
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
    closeModal();

    const overlay = document.createElement('div');
    overlay.id = 'edu-modal-overlay';
    overlay.className = 'fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-200 overflow-y-auto';
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    const modal = document.createElement('div');
    modal.className = `bg-dark-850/95 backdrop-blur-2xl rounded-2xl shadow-2xl ${maxWidthClass} w-full max-h-[88vh] flex flex-col overflow-hidden border border-white/10 my-auto transform scale-95 transition-transform duration-200 text-white`;
    modal.innerHTML = `
      <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-dark-900/80 shrink-0">
        <h3 class="font-bold text-base text-white flex items-center gap-2">${title}</h3>
        <button type="button" onclick="closeModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div class="p-6 overflow-y-auto space-y-4 text-sm text-slate-200 flex-1">
        ${htmlContent}
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      modal.classList.remove('scale-95');
      modal.classList.add('scale-100');
    });
  }

  function closeModal() {
    const existing = document.getElementById('edu-modal-overlay');
    if (existing) existing.remove();
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
      const pct = c.progress_percent || 0;
      const done = c.completed_lessons || 0;
      return `
        <div class="p-4 rounded-2xl border ${isCurrent ? 'border-indigo-500/80 bg-indigo-950/40 shadow-glow-indigo' : 'border-white/10 bg-dark-900/60'} flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded-md bg-white/10 text-indigo-300 text-[10px] font-mono font-bold border border-white/5">${c.code}</span>
              <span class="font-bold text-sm text-white">${c.title}</span>
              ${isCurrent ? '<span class="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold shadow-glow-indigo">Активный курс</span>' : ''}
            </div>
            <p class="text-xs text-slate-400">Куратор: ${c.curator} • 10 практических уроков</p>
            <div class="pt-1 flex items-center gap-3">
              <div class="flex-1 bg-dark-950/80 h-2 rounded-full overflow-hidden max-w-xs border border-white/5">
                <div class="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full" style="width:${pct}%"></div>
              </div>
              <span class="text-[11px] font-bold text-slate-300">${done}/10 уроков (${pct}%)</span>
            </div>
          </div>
          <button type="button" onclick="window.EduSpace.switchActiveCourse('${c.slug}')" class="px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${isCurrent ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15' : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-glow-indigo'}">
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
      body: { user_id: user.id, specialty_slug: slug }
    });
    if (res.ok && res.data.user) {
      setActiveUser(res.data.user);
      showToast(res.data.message || 'Курс успешно выбран!', 'success');
      closeModal();
      if (window.location.pathname.includes('tasks.html') || window.location.pathname.includes('student.html') || window.location.pathname.includes('profile.html')) {
        window.location.reload();
      }
    } else {
      showToast('Не удалось переключить курс', 'error');
    }
  }

  async function openGradesModal() {
    const user = getActiveUser();
    if (!user) {
      window.location.href = 'auth.html?mode=login';
      return;
    }
    const res = await apiRequest(`/api/user/profile/${user.id}`);
    const data = res.data || {};
    const stats = data.statistics || { passed_count: 0, avg_score: 0, gpa: 0, xp: 0 };
    const subs = data.submissions || [];

    const rowsHtml = subs.length === 0
      ? `<tr><td colspan="5" class="p-8 text-center text-xs text-slate-500">У вас пока нет сданных работ. Откройте Урок №1, пройдите автопроверку и отправьте первое решение!</td></tr>`
      : subs.map(s => {
          const isPending = String(s.status).includes('на проверке') || String(s.status).includes('Отправлено');
          const isRev = String(s.status).includes('доработ');
          const badgeCls = isPending
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : (isRev ? 'bg-red-500/20 text-red-300 border border-red-500/30' : (s.score >= 75 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'));
          return `
            <tr class="hover:bg-white/[0.04] border-b border-white/5 transition-colors">
              <td class="p-3 font-bold text-white">Урок №${s.task_number}. ${s.task_title}</td>
              <td class="p-3 text-indigo-400 uppercase text-[10px] font-bold font-mono">${s.specialty_slug}</td>
              <td class="p-3 font-extrabold text-white">${s.score}/100 (${s.grade_letter})</td>
              <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeCls}">${s.status}</span></td>
              <td class="p-3 text-slate-300 text-[11px]">${s.teacher_comment || 'Автопроверка пройдена'}</td>
            </tr>
          `;
        }).join('');

    openModal(`📊 Зачётная книжка — ${user.full_name}`, `
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
          <div class="text-[11px] text-indigo-300 font-bold">Зачтено по курсу</div>
          <div class="text-xl font-extrabold text-indigo-200 mt-0.5">${stats.passed_count} / 10</div>
        </div>
        <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
          <div class="text-[11px] text-emerald-300 font-bold">Средний балл / GPA</div>
          <div class="text-xl font-extrabold text-emerald-200 mt-0.5">${stats.avg_score > 0 ? `${stats.avg_score} (${stats.gpa})` : '—'}</div>
        </div>
        <div class="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
          <div class="text-[11px] text-purple-300 font-bold">Опыт обучения</div>
          <div class="text-xl font-extrabold text-purple-200 mt-0.5">${stats.xp} XP</div>
        </div>
      </div>
      <div class="border border-white/10 rounded-xl overflow-x-auto bg-dark-950/40">
        <table class="w-full text-xs text-left">
          <thead class="bg-white/[0.04] text-slate-400 border-b border-white/10 font-bold">
            <tr>
              <th class="p-3">Урок / Модуль</th>
              <th class="p-3">Курс</th>
              <th class="p-3">Балл</th>
              <th class="p-3">Статус</th>
              <th class="p-3">Комментарий куратора</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <div class="flex justify-between items-center pt-2">
        <button type="button" onclick="exportCsvJournal()" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold flex items-center gap-1.5 transition-colors">
          <span class="material-symbols-outlined text-[16px]">download</span>
          <span>Скачать выписку CSV</span>
        </button>
        <button type="button" onclick="closeModal()" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all">Закрыть</button>
      </div>
    `, 'max-w-3xl');
  }

  async function openCalendarModal() {
    const user = getActiveUser();
    const spec = (user && user.specialty_slug) || 'it';
    const uid = user ? user.id : 0;
    const res = await apiRequest(`/api/tasks?specialty=${spec}&user_id=${uid}`);
    const tasks = (res.data && res.data.tasks) || [];
    const curDay = (res.data && res.data.current_study_day) || 1;

    const itemsHtml = tasks.map(t => {
      const isDone = t.status_code === 'graded';
      const isLocked = t.is_locked;
      const isToday = t.unlock_day === curDay;
      const cardCls = isDone
        ? 'border-emerald-500/30 bg-emerald-950/30'
        : (isToday ? 'border-indigo-500/80 bg-indigo-950/40 shadow-glow-indigo' : (isLocked ? 'border-white/5 bg-dark-950/40 opacity-70' : 'border-white/10 bg-dark-900/60'));
      const badge = isDone
        ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">Выполнено (${t.student_score}/100)</span>`
        : (isLocked
            ? `<span class="px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 text-[10px] font-bold">Откроется: ${t.unlock_date_exact}</span>`
            : `<span class="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-glow-indigo">${isToday ? 'Задание на сегодня' : 'Доступно'}</span>`);

      return `
        <div class="p-3.5 rounded-xl border ${cardCls} flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[11px] font-extrabold text-indigo-400">День ${t.unlock_day}</span>
              ${badge}
            </div>
            <div class="font-bold text-xs text-white mt-1">${t.title}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">Открытие: ${t.unlock_date_exact} • Дедлайн: ${t.deadline_exact}</div>
          </div>
          ${isLocked
            ? '<span class="material-symbols-outlined text-slate-500 text-[20px]">lock</span>'
            : `<a href="simulator.html?specialty=${spec}&task=${t.task_number}" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shrink-0 text-center shadow-glow-indigo transition-all">Открыть урок</a>`
          }
        </div>
      `;
    }).join('');

    openModal(`🗓️ График открытия модулей и дедлайны (Текущий день: День ${curDay})`, `
      <div class="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
        Задания открываются поэтапно согласно расписанию курса. Будущие уроки заблокированы на сервере до наступления соответствующего учебного дня.
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
        <span class="font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-full">${course.short_title} (${grp})</span>
        <span class="text-slate-400 font-medium">Куратор: ${course.curator}</span>
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
    const items = (res.data && res.data.notifications) || [];

    if (user) {
      await apiRequest('/api/notifications/read', { method: 'POST', body: { user_id: user.id } });
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
                <div class="font-bold text-xs text-white">${n.title}</div>
                <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">${n.body}</p>
                <span class="text-[10px] text-slate-500 block mt-1 font-mono">${n.created_at || ''}</span>
              </div>
            </div>
          `;
        }).join('');

    openModal('🔔 Центр уведомлений', `<div class="space-y-2.5">${listHtml}</div>`);
  }

  async function openMessengerModal(recipientLabel) {
    const user = getActiveUser();
    const course = getCourseBySlug((user && user.specialty_slug) || 'it');
    const titleLabel = recipientLabel || `Куратор курса (${course.curator})`;
    const channel = 'general';

    const res = await apiRequest(`/api/messages?channel=${channel}`);
    const msgs = (res.data && res.data.messages) || [];

    const renderMsg = m => {
      const isMe = user && (m.sender_id === user.id || m.sender_name === user.full_name);
      return `
        <div class="flex ${isMe ? 'justify-end' : 'items-start gap-2'}">
          ${!isMe ? `<div class="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-indigo-500/30">${getInitials(m.sender_name)}</div>` : ''}
          <div class="${isMe ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-glow-indigo' : 'bg-dark-900/80 text-slate-200 border border-white/10'} p-3 rounded-2xl max-w-[82%] shadow-sm text-xs">
            <div class="font-bold text-[10px] ${isMe ? 'text-indigo-200' : 'text-indigo-400'} mb-0.5">${m.sender_name}</div>
            <p class="leading-relaxed">${m.body.replace(/</g, '&lt;')}</p>
            <span class="text-[9px] ${isMe ? 'text-indigo-200' : 'text-slate-500'} block mt-1 text-right font-mono">${m.created_at || 'Сейчас'}</span>
          </div>
        </div>
      `;
    };

    openModal(`💬 Чат курса — ${titleLabel}`, `
      <div class="flex flex-col h-80 border border-white/10 rounded-2xl overflow-hidden bg-dark-950/60">
        <div id="edu-chat-box" class="flex-1 p-4 overflow-y-auto space-y-3">
          ${msgs.map(renderMsg).join('')}
        </div>
        <form id="edu-chat-form" class="p-2.5 bg-dark-900/90 border-t border-white/10 flex gap-2">
          <input type="text" id="edu-chat-input" placeholder="Напишите вопрос преподавателю или в группу..." class="flex-1 px-3.5 py-2 border border-white/15 bg-dark-800 text-white rounded-xl text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-500" required />
          <button type="submit" class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-glow-indigo flex items-center gap-1.5 transition-all">
            <span>Отправить</span>
            <span class="material-symbols-outlined text-[15px]">send</span>
          </button>
        </form>
      </div>
    `);

    const box = document.getElementById('edu-chat-box');
    if (box) box.scrollTop = box.scrollHeight;

    const form = document.getElementById('edu-chat-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const inp = document.getElementById('edu-chat-input');
        const text = (inp && inp.value || '').trim();
        if (!text) return;
        inp.value = '';

        const senderName = user ? user.full_name : 'Гость';
        const senderRole = user ? user.role : 'student';
        await apiRequest('/api/messages/send', {
          method: 'POST',
          body: { sender_id: user ? user.id : null, sender_name: senderName, sender_role: senderRole, channel, body: text }
        });

        if (box) {
          box.insertAdjacentHTML('beforeend', renderMsg({
            sender_id: user ? user.id : 999,
            sender_name: senderName,
            body: text,
            created_at: 'Только что'
          }));
          box.scrollTop = box.scrollHeight;
        }

        if (!user || user.role === 'student') {
          setTimeout(async () => {
            const replyText = `Принято, ${user ? (user.first_name || user.full_name.split(' ')[1] || user.full_name) : 'студент'}! Проверьте критерии в вкладке «Практика» — если автотесты зелёные, нажимайте «Отправить работу», я сразу проверю.`;
            await apiRequest('/api/messages/send', {
              method: 'POST',
              body: { sender_id: 3, sender_name: course.curator, sender_role: 'teacher', channel, body: replyText }
            });
            const liveBox = document.getElementById('edu-chat-box');
            if (liveBox) {
              liveBox.insertAdjacentHTML('beforeend', renderMsg({
                sender_id: 3,
                sender_name: course.curator,
                body: replyText,
                created_at: 'Только что'
              }));
              liveBox.scrollTop = liveBox.scrollHeight;
            }
          }, 900);
        }
      };
    }
  }

  function openSettingsModal() {
    const user = getActiveUser();
    if (!user) {
      window.location.href = 'auth.html?mode=login';
      return;
    }

    const parts = (user.full_name || '').split(/\s+/);
    const ln = user.last_name || parts[0] || '';
    const fn = user.first_name || parts[1] || '';
    const mn = user.middle_name !== undefined ? user.middle_name : parts.slice(2).join(' ');

    const courseOpts = getCoursesList().map(c =>
      `<option value="${c.slug}" ${c.slug === user.specialty_slug ? 'selected' : ''}>${c.code} — ${c.title}</option>`
    ).join('');

    openModal('⚙️ Настройки личного профиля и безопасности', `
      <form id="edu-profile-settings-form" class="space-y-3.5 text-xs text-slate-200">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Фамилия *</label>
            <input type="text" id="set-last-name" value="${ln}" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500" required />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">Имя *</label>
            <input type="text" id="set-first-name" value="${fn}" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500" required />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">Отчество</label>
            <input type="text" id="set-middle-name" value="${mn}" placeholder="При наличии" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Подтверждённый Email</label>
            <input type="email" value="${user.email}" disabled class="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-dark-950 text-slate-500 cursor-not-allowed font-mono" />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">${user.role === 'teacher' ? 'Кафедра / Отделение' : 'Учебная группа'}</label>
            <input type="text" id="set-group" value="${user.group_name || 'ИС-21'}" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500" required />
          </div>
        </div>

        ${user.role === 'student' ? `
        <div>
          <label class="block font-bold text-slate-300 mb-1">Активный курс обучения</label>
          <select id="set-course" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500">${courseOpts}</select>
        </div>` : ''}

        <div class="pt-2 border-t border-white/10">
          <label class="block font-bold text-slate-300 mb-1">Новый пароль (оставьте пустым, если не меняете)</label>
          <input type="password" id="set-new-pwd" placeholder="Минимум 6 символов, буквы и цифры" class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-dark-900 text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500" />
        </div>

        <div id="set-error-box" class="hidden p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-semibold"></div>

        <div class="pt-2 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl border border-white/15 text-slate-300 font-bold hover:bg-white/10 transition-colors">Отмена</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold shadow-glow-indigo transition-all">Сохранить изменения</button>
        </div>
      </form>
    `);

    const form = document.getElementById('edu-profile-settings-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const errBox = document.getElementById('set-error-box');
        const payload = {
          user_id: user.id,
          last_name: document.getElementById('set-last-name').value,
          first_name: document.getElementById('set-first-name').value,
          middle_name: document.getElementById('set-middle-name').value,
          group_name: document.getElementById('set-group').value,
          specialty_slug: document.getElementById('set-course') ? document.getElementById('set-course').value : user.specialty_slug,
          new_password: document.getElementById('set-new-pwd').value
        };
        const res = await apiRequest('/api/user/profile', { method: 'PUT', body: payload });
        if (!res.ok || !res.data.success) {
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

  function exportPdfStatement() {
    showToast('Подготовка печатной академической ведомости / сертификата...', 'info');
    setTimeout(() => window.print(), 400);
  }

  function sharePortfolio() {
    const user = getActiveUser();
    const url = `${window.location.origin}${window.location.pathname}?student=${user ? (user.student_id || user.id) : 'profile'}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => showToast('Ссылка на цифровой профиль скопирована в буфер обмена!', 'success'));
    } else {
      showToast('Ссылка на цифровой профиль сформирована!', 'success');
    }
  }

  // Legacy modal helpers kept interactive and accurate
  function openZoomModal(title = 'Онлайн-консультация курса') {
    openModal(`🎥 ${title}`, `
      <div class="rounded-2xl overflow-hidden bg-slate-950 aspect-video flex flex-col items-center justify-center text-white p-6 text-center">
        <div class="w-16 h-16 rounded-full bg-indigo-600/30 flex items-center justify-center mb-3">
          <span class="material-symbols-outlined text-[36px] text-indigo-400">videocam</span>
        </div>
        <div class="font-bold text-sm mb-1">Вебинарная комната кафедры АМК</div>
        <p class="text-xs text-slate-400 max-w-sm mb-4">Подключение к живому разбору практических заданий и ответам на вопросы студентов.</p>
        <div class="flex items-center gap-3">
          <button type="button" onclick="showToast('Микрофон переключён', 'info')" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold">Микрофон</button>
          <button type="button" onclick="showToast('Демонстрация экрана активна', 'success')" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold">Показать экран</button>
        </div>
      </div>
    `);
  }

  // ==========================================
  // 9. PAGE SHELL HYDRATION & AUTH/ROLE GUARDS
  // ==========================================

  function showAuthRequiredOverlay(targetRole = 'student') {
    if (document.getElementById('edu-auth-guard')) return;
    const gate = document.createElement('div');
    gate.id = 'edu-auth-guard';
    gate.className = 'fixed inset-0 z-[9000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4';
    gate.innerHTML = `
      <div class="bg-dark-850/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/10 text-center space-y-5 text-white">
        <div class="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-glow-indigo">
          <span class="material-symbols-outlined text-[34px]">lock_person</span>
        </div>
        <div class="space-y-2">
          <h2 class="font-display font-extrabold text-xl text-white">Вход в образовательную платформу</h2>
          <p class="text-xs text-slate-300 leading-relaxed">
            Чтобы сохранять личный прогресс уроков, результаты тестов и оценки в зачётной ведомости под вашим ФИО, войдите или зарегистрируйтесь.
          </p>
        </div>
        <div class="space-y-2.5 pt-1">
          <a href="auth.html?mode=register${targetRole === 'teacher' ? '&role=teacher' : ''}" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs shadow-glow-indigo transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[18px]">person_add</span>
            <span>Создать личный аккаунт (с подтверждением почты)</span>
          </a>
          <a href="auth.html?mode=login" class="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs transition-colors block">
            У меня уже есть аккаунт — Войти
          </a>
          <div class="pt-2 border-t border-white/10">
            <button type="button" onclick="window.EduSpace.startIsolatedDemo('${targetRole}')" class="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm">
              <span class="material-symbols-outlined text-[16px]">play_circle</span>
              <span>Ознакомительный демо-режим (${targetRole === 'teacher' ? 'Преподаватель' : 'Студент с 0%'})</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(gate);
  }

  function hydratePageIdentity() {
    const path = window.location.pathname.toLowerCase();
    const user = getActiveUser();

    const isProtectedStudent = path.endsWith('student.html') || path.endsWith('/student') ||
      path.endsWith('tasks.html') || path.endsWith('/tasks') ||
      path.endsWith('simulator.html') || path.endsWith('/simulator') ||
      path.endsWith('profile.html') || path.endsWith('/profile');

    if (isProtectedStudent && !user) {
      showAuthRequiredOverlay('student');
      return;
    }

    // Hydrate user badges across workspace pages
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

      // Update demo reset button visibility/label for real accounts
      document.querySelectorAll('[onclick*="resetDemoMode"]').forEach(btn => {
        if (!user.is_demo && user.role === 'student') {
          btn.classList.add('hidden');
        }
      });

      // Hydrate Public Header (index, features, about, pricing, reviews) when logged in
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
    api: apiRequest,
    validateFioFields,
    validateEmailFormat,
    validatePasswordStrength,
    runLessonAutoTests,
    getCoursesList,
    getCourseBySlug,
    getLessonFromCatalog,
    computeExactDates,
    getInitials,
    getActiveUser,
    setActiveUser,
    logoutUser,
    startIsolatedDemo,
    switchActiveCourse,
    showIncomingMailCard,
    hydratePageIdentity
  };

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
  window.openZoomModal = openZoomModal;
  window.exportCsvJournal = exportCsvJournal;
  window.exportPdfStatement = exportPdfStatement;
  window.sharePortfolio = sharePortfolio;
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
    { title: 'Веб-дизайн и разработка ПО (10 модулей)', desc: 'HTML, CSS, JS, SQL, Docker', url: 'tasks.html?specialty=it', icon: 'code', category: 'Специальность' },
    { title: 'Графический дизайн (10 модулей)', desc: 'Figma, брендинг, типографика, растровая графика', url: 'tasks.html?specialty=graphic_design', icon: 'palette', category: 'Специальность' },
    { title: 'Автоэлектрика и диагностика (10 модулей)', desc: 'Мультиметр, осциллограф, CAN-шина, OBD-II', url: 'tasks.html?specialty=autoelectric', icon: 'electric_meter', category: 'Специальность' },
    { title: 'Холодильное оборудование и HVAC (10 модулей)', desc: 'Фреоны R134a/R404a, вакуумирование, перегрев', url: 'tasks.html?specialty=hvac', icon: 'ac_unit', category: 'Специальность' },
    { title: 'Автомеханика и ТО (10 модулей)', desc: 'ДВС, моменты затяжки ГБЦ, зазоры клапанов', url: 'tasks.html?specialty=automechanic', icon: 'build', category: 'Специальность' },
    { title: 'Электронная ведомость оценок', desc: 'Сводный академический журнал всех студентов', url: 'gradebook.html', icon: 'grid_on', category: 'Учебная часть' },
    { title: 'Реестр проверки сертификатов', desc: 'Государственная проверка подлинности с QR-кодом', url: 'verify.html', icon: 'verified_user', category: 'Сертификация' },
    { title: 'Тарифные планы и подписка Pro', desc: 'Kaspi QR, оплата картой, доступ к модулям 4–10', url: 'pricing.html', icon: 'diamond', category: 'Финансы' },
    { title: 'Личный кабинет слушателя', desc: 'Профиль, статистика, зачётная книжка', url: 'profile.html', icon: 'person', category: 'Профиль' }
  ];

  function renderCommandPaletteItems(query) {
    const cont = document.getElementById('cmd-palette-results');
    if (!cont) return;
    const q = (query || '').toLowerCase().trim();
    const filtered = PALETTE_ITEMS.filter(it => !q || it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q) || it.category.toLowerCase().includes(q));

    if (filtered.length === 0) {
      cont.innerHTML = '<div class="p-6 text-center text-slate-500">По запросу ничего не найдено. Попробуйте другой термин.</div>';
      return;
    }

    cont.innerHTML = filtered.map(it => `
      <a href="${it.url}" onclick="closeCommandPaletteModal()" class="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <span class="material-symbols-outlined text-[20px]">${it.icon}</span>
          </div>
          <div>
            <div class="font-bold text-white group-hover:text-indigo-300 transition-colors">${it.title}</div>
            <div class="text-[11px] text-slate-400">${it.desc}</div>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">${it.category}</span>
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
  let audioEnabled = localStorage.getItem('eduspace_audio_mute') !== 'true';

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
        // High soft chime: E5 (659Hz) -> B5 (987Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'click') {
        // Subtle haptic pop
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
      // Audio not permitted or unsupported, fail silently
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
        desc: 'Открыт полный доступ ко всем 10 модулям специальности',
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
        desc: 'Освоены все 10 модулей, выдан гос. сертификат',
        icon: 'school',
        color: 'text-cyan-400',
        unlocked: passedCount >= 10
      }
    ];
  }
