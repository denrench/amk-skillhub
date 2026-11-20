/* ==========================================================================
   EDU SPACE PRO — Live Student Portfolio, Privacy Settings & PDF Export
   Wired to:
     - GET  /api/portfolio/me
     - GET  /api/portfolio/settings
     - PUT  /api/portfolio/settings
     - GET  /api/portfolio/public/<slug>
     - GET  /api/portfolio/export.pdf
   ========================================================================== */
(function () {
  'use strict';

  const SPECIALTY_META = {
    it: {
      role: 'Web-разработчик / Программист',
      degree: '06130100 — «Программное обеспечение (Web Design и разработка)»'
    },
    graphic_design: {
      role: 'Графический и UI/UX дизайнер',
      degree: '02130100 — «Графический и мультимедийный дизайн»'
    },
    autoelectric: {
      role: 'Автоэлектрик-диагност компьютерных систем',
      degree: '07161301 — «Техническое обслуживание и диагностика автоэлектроники»'
    },
    hvac: {
      role: 'Техник систем кондиционирования и холода (HVAC)',
      degree: '07130700 — «Монтаж и эксплуатация холодильно-компрессорных установок»'
    },
    automechanic: {
      role: 'Автомеханик-моторист',
      degree: '07161300 — «Техническое обслуживание и ремонт автотранспорта»'
    }
  };

  // Partner vacancy listings in Almaty (career board only — never student grades/skills)
  const VACANCIES_BY_SPECIALTY = {
    it: [
      { company: 'Kaspi.kz', title: 'Junior Frontend Developer', salary: '380 000 – 480 000 ₸', city: 'Алматы, БЦ Нурлы-Тау' },
      { company: 'Chocofamily Holding', title: 'Web Developer (Intern/Junior)', salary: '300 000 – 420 000 ₸', city: 'Алматы, пр. Аль-Фараби' },
      { company: 'ТОО «KazInterSoft»', title: 'Младший разработчик веб-сервисов', salary: '320 000 – 450 000 ₸', city: 'Алматы, ул. Жандосова' }
    ],
    graphic_design: [
      { company: 'ТОО «Kolesa Group»', title: 'Junior UI/UX Designer', salary: '350 000 – 450 000 ₸', city: 'Алматы, ул. Шевченко' },
      { company: 'Рекламное агентство «GForce / Grey»', title: 'Графический дизайнер', salary: '280 000 – 400 000 ₸', city: 'Алматы, Медеуский р-н' },
      { company: 'ТОО «Magnum E-Commerce»', title: 'Digital Designer', salary: '320 000 – 430 000 ₸', city: 'Алматы, пр. Абая' }
    ],
    autoelectric: [
      { company: 'ТОО «Astana Motors»', title: 'Автоэлектрик-диагност', salary: '450 000 – 650 000 ₸', city: 'Алматы, пр. Суюнбая' },
      { company: 'ТОО «Allur Auto»', title: 'Диагност электронных систем', salary: '400 000 – 600 000 ₸', city: 'Алматы, ул. Майлина' },
      { company: 'Автоцентр «Bavaria Almaty»', title: 'Младший автоэлектрик', salary: '350 000 – 500 000 ₸', city: 'Алматы, пр. Аль-Фараби' }
    ],
    hvac: [
      { company: 'ТОО «Air Astana» (Наземный сервис)', title: 'Техник по климатическим установкам', salary: '420 000 – 580 000 ₸', city: 'Алматы, Аэропорт' },
      { company: 'ТОО «Technodom Service»', title: 'Мастер по ремонту климатического оборудования', salary: '350 000 – 550 000 ₸', city: 'Алматы, ул. Толе би' },
      { company: 'Хладокомбинат №1 г. Алматы', title: 'Холодильщик промышленных камер', salary: '400 000 – 600 000 ₸', city: 'Алматы, пр. Райымбека' }
    ],
    automechanic: [
      { company: 'ТОО «Astana Motors»', title: 'Слесарь по ремонту ДВС', salary: '400 000 – 620 000 ₸', city: 'Алматы, Кульджинский тракт' },
      { company: 'Сеть автосервисов «SCT Service»', title: 'Автомеханик-универсал', salary: '380 000 – 520 000 ₸', city: 'Алматы, ул. Жандосова' },
      { company: 'ТОО «Вираж Сервис Казахстан»', title: 'Моторист', salary: '360 000 – 500 000 ₸', city: 'Алматы, пр. Райымбека' }
    ]
  };

  let state = {
    isPublicView: false,
    publicSlug: '',
    activeVacancySpec: 'it',
    portfolio: null,
    settings: {
      is_public: false,
      consent_granted: false,
      show_grades: true,
      show_certificates: true,
      public_slug: ''
    }
  };

  function esc(val) {
    if (window.EduSpace && typeof window.EduSpace.escapeHtml === 'function') {
      return window.EduSpace.escapeHtml(val);
    }
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeSpec(slug) {
    const raw = String(slug || '').trim().toLowerCase();
    const map = { design: 'graphic_design', accounting: 'hvac', auto: 'autoelectric', marketing: 'automechanic' };
    const canonical = map[raw] || raw;
    return SPECIALTY_META[canonical] ? canonical : 'it';
  }

  function notify(msg, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type || 'info');
    }
  }

  function setStatusText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function computeInitials(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return 'СТ';
  }

  function buildPublicPortfolioUrl(slug) {
    const clean = encodeURIComponent(String(slug || '').trim());
    return `${window.location.origin}/career.html?public=${clean}`;
  }

  function renderVacancies(specSlug) {
    const canonical = normalizeSpec(specSlug);
    state.activeVacancySpec = canonical;

    document.querySelectorAll('.resume-tab').forEach(btn => {
      btn.className = 'resume-tab px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs whitespace-nowrap border border-white/10 transition-all flex items-center gap-2';
    });
    const activeBtn = document.getElementById('tab-' + canonical);
    if (activeBtn) {
      activeBtn.className = 'resume-tab px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs whitespace-nowrap shadow-glow-indigo transition-all flex items-center gap-2';
    }

    const grid = document.getElementById('vacancies-grid');
    if (!grid) return;
    const items = VACANCIES_BY_SPECIALTY[canonical] || VACANCIES_BY_SPECIALTY.it;
    const meta = SPECIALTY_META[canonical] || SPECIALTY_META.it;
    const shareUrl = state.settings.is_public && state.settings.consent_granted && state.settings.public_slug
      ? buildPublicPortfolioUrl(state.settings.public_slug)
      : window.location.origin + '/career.html';

    grid.innerHTML = items.map(v => `
      <div class="p-5 rounded-3xl bg-dark-900 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between text-xs mb-2">
            <span class="font-extrabold text-indigo-400 uppercase tracking-wider">${esc(v.company)}</span>
            <span class="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-400">${esc(v.city)}</span>
          </div>
          <h4 class="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">${esc(v.title)}</h4>
          <div class="text-lg font-black text-emerald-400 mt-2">${esc(v.salary)}</div>
        </div>
        <div class="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <a href="mailto:support@amk.kz?subject=${encodeURIComponent('Отклик на вакансию: ' + v.title + ' (' + v.company + ')')}&body=${encodeURIComponent('Специальность: ' + meta.role + '\nПортфолио: ' + shareUrl)}" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
            <span class="material-symbols-outlined text-[16px]">send</span>Откликнуться через АМК
          </a>
        </div>
      </div>
    `).join('');
  }

  function renderPortfolio(payload, opts) {
    const isPublic = Boolean(opts && opts.isPublic);
    state.portfolio = payload;

    const sheet = document.getElementById('cv-sheet');
    if (sheet) sheet.classList.remove('hidden');

    const st = payload.student || {};
    const specSlug = normalizeSpec(st.specialty_slug);
    const meta = SPECIALTY_META[specSlug] || SPECIALTY_META.it;
    const showGrades = payload.show_grades !== false;
    const showCerts = payload.show_certificates !== false;

    const fullName = st.full_name || 'Студент АМК';
    setStatusText('cv-candidate-name', fullName);
    setStatusText('cv-avatar-initials', computeInitials(fullName));
    setStatusText('cv-candidate-role', st.specialty_title || meta.role);
    setStatusText('cv-specialty-degree', 'Специальность: ' + (st.specialty_title ? `${st.specialty_title} (${meta.degree.split('—')[0].trim()})` : meta.degree));
    setStatusText('cv-candidate-group', `Группа: ${st.group_name || 'ИС-21'}${st.student_id ? ' • ID: ' + st.student_id : ''}`);

    const emailRow = document.getElementById('cv-email-row');
    const emailEl = document.getElementById('cv-candidate-email');
    if (isPublic || !st.email) {
      if (emailRow) emailRow.classList.add('hidden');
    } else {
      if (emailRow) emailRow.classList.remove('hidden');
      if (emailEl) {
        emailEl.textContent = st.email;
        emailEl.href = 'mailto:' + st.email;
      }
    }

    const phoneRow = document.getElementById('cv-phone-row');
    if (phoneRow) phoneRow.classList.add('hidden');

    const projects = Array.isArray(payload.projects) ? payload.projects : [];
    const grades = Array.isArray(payload.grades) ? payload.grades : [];
    const missions = Array.isArray(payload.missions) ? payload.missions : [];
    const exams = Array.isArray(payload.exams) ? payload.exams : [];
    const skills = Array.isArray(payload.skills) ? payload.skills : [];
    const certs = Array.isArray(payload.certificates) ? payload.certificates : [];

    // 1. GPA Metric
    const avgScore = Number(payload.average_score);
    if (!showGrades) {
      setStatusText('cv-metric-gpa', 'Скрыто');
      setStatusText('cv-metric-gpa-sub', 'Скрыто настройками приватности');
    } else if (Number.isFinite(avgScore) && avgScore > 0) {
      const gpa4 = ((avgScore / 100) * 4).toFixed(2);
      setStatusText('cv-metric-gpa', `${gpa4} / 4.0`);
      setStatusText('cv-metric-gpa-sub', `Средний балл: ${avgScore} / 100`);
    } else {
      setStatusText('cv-metric-gpa', '—');
      setStatusText('cv-metric-gpa-sub', 'Оценённых работ пока нет');
    }

    // 2. Modules Metric
    const passedCount = showGrades
      ? projects.filter(p => Number(p.score || 0) >= 60).length
      : projects.length;
    setStatusText('cv-metric-modules', `${passedCount} / 20`);
    setStatusText('cv-metric-modules-sub', passedCount > 0 ? `${Math.round((passedCount / 20) * 100)}% программы освоено` : 'Ожидает выполнения модулей');

    // 3. Missions & Exams Metric
    const passedExams = exams.filter(e => Boolean(e.passed)).length;
    setStatusText('cv-metric-exams', `${missions.length} мисс. • ${exams.length} экз.`);
    setStatusText('cv-metric-exams-sub', exams.length > 0 ? `Сдано 3D-экзаменов: ${passedExams}` : 'Практические экзамены и миссии');

    // 4. Certificate Metric & Verify Link
    const certObj = certs[0] || null;
    const certLinkEl = document.getElementById('cv-cert-verify-link');
    if (!showCerts) {
      setStatusText('cv-metric-cert-status', 'Скрыт настройками');
      setStatusText('cv-metric-cert-sub', 'Публикация сертификата отключена');
      if (certLinkEl) certLinkEl.classList.add('hidden');
    } else if (certObj) {
      const isValid = certObj.status === 'VALID';
      setStatusText('cv-metric-cert-status', isValid ? 'Подтверждён (VALID)' : 'В процессе (IN_PROGRESS)');
      setStatusText('cv-metric-cert-sub', certObj.certificate_number || 'Реестр АМК');
      if (certLinkEl) {
        certLinkEl.classList.remove('hidden');
        certLinkEl.href = certObj.verify_url || ('verify.html?cert=' + encodeURIComponent(certObj.certificate_number || ''));
      }
    } else {
      setStatusText('cv-metric-cert-status', 'В процессе');
      setStatusText('cv-metric-cert-sub', 'Сертификат формируется по итогам 20 модулей');
      if (certLinkEl) certLinkEl.classList.add('hidden');
    }

    // Skills Grid
    const skillsCont = document.getElementById('cv-skills-grid');
    if (skillsCont) {
      if (skills.length === 0) {
        skillsCont.innerHTML = `
          <div class="md:col-span-2 p-4 rounded-2xl bg-dark-850 cv-card border border-white/10 text-xs text-slate-400">
            Профессиональные компетенции будут отображаться здесь по мере сдачи практических модулей.
          </div>
        `;
      } else {
        skillsCont.innerHTML = skills.map(s => {
          const pct = Math.max(0, Math.min(100, Number(s.percent) || 0));
          const tag = pct >= 80 ? 'Освоено' : (pct > 0 ? 'В процессе' : 'Не начато');
          return `
            <div class="p-3.5 rounded-2xl bg-dark-850 cv-card border border-white/10 space-y-1.5">
              <div class="flex items-center justify-between text-xs gap-2">
                <span class="font-bold text-white">${esc(s.name)}</span>
                <span class="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold cv-badge shrink-0">${esc(tag)} (${Number(s.completed) || 0}/${Number(s.total) || 0})</span>
              </div>
              <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Projects, Missions & Exams List
    const projCont = document.getElementById('cv-projects-list');
    if (projCont) {
      const workItems = showGrades ? (grades.length ? grades : projects) : projects;
      if (workItems.length === 0 && missions.length === 0 && exams.length === 0) {
        projCont.innerHTML = `
          <div class="p-5 rounded-2xl bg-dark-850 cv-card border border-white/10 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Выполненных и оценённых работ пока нет — перейдите к заданиям или миссиям, чтобы наполнить портфолио.</span>
            <a href="tasks.html?specialty=${encodeURIComponent(specSlug)}" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 text-center">Перейти к заданиям →</a>
          </div>
        `;
      } else {
        const projHtml = workItems.map(p => {
          const scoreBadge = showGrades
            ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">${Number(p.score) || 0}/100 (${esc(p.grade_letter || '—')})</span>`
            : `<span class="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 text-[10px] font-bold border border-white/10">Оценка скрыта приватностью</span>`;
          return `
            <div class="p-4 rounded-2xl bg-dark-850 cv-card border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="space-y-1">
                <div class="text-xs font-bold text-white flex flex-wrap items-center gap-2">
                  <span>Модуль №${Number(p.task_number) || 1}: ${esc(p.task_title || 'Практическая работа')}</span>
                  ${scoreBadge}
                </div>
                <div class="text-[11px] text-slate-400 cv-text-muted">Статус: ${esc(p.status || 'Отправлено')} • Специальность: ${esc(p.specialty_slug || specSlug)}</div>
              </div>
            </div>
          `;
        }).join('');

        const missionHtml = missions.map(m => `
          <div class="p-4 rounded-2xl bg-dark-850 cv-card border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="space-y-1">
              <div class="text-xs font-bold text-white flex flex-wrap items-center gap-2">
                <span>Интерактивная миссия: ${esc(m.mission_id || (m.specialty_slug + '_m' + m.task_number))}</span>
                <span class="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">+${Number(m.mission_xp) || 0} XP</span>
              </div>
              <div class="text-[11px] text-slate-400 cv-text-muted">Этап: ${Number(m.current_stage) || 1}/7 • Статус: ${esc(m.status || 'in_progress')}</div>
            </div>
          </div>
        `).join('');

        const examHtml = exams.map(ex => {
          const scoreTxt = showGrades ? `${Number(ex.score) || 0}/100` : 'Скрыто';
          const passBadge = ex.passed
            ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">Сдан</span>'
            : '<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">Не сдан</span>';
          return `
            <div class="p-4 rounded-2xl bg-dark-850 cv-card border border-purple-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="space-y-1">
                <div class="text-xs font-bold text-white flex flex-wrap items-center gap-2">
                  <span>Практический 3D-экзамен #${Number(ex.id)} (${esc(ex.specialty_slug)})</span>
                  ${passBadge}
                  <span class="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">${scoreTxt}</span>
                </div>
                <div class="text-[11px] text-slate-400 cv-text-muted">Проверка куратора: ${esc(ex.teacher_status || 'pending')}${ex.teacher_comment ? ' • ' + esc(ex.teacher_comment) : ''}</div>
              </div>
            </div>
          `;
        }).join('');

        projCont.innerHTML = projHtml + missionHtml + examHtml;
      }
    }

    renderVacancies(new URLSearchParams(window.location.search).get('specialty') || specSlug);
  }

  function populatePrivacyControls(settings) {
    const s = settings || {};
    state.settings = {
      is_public: Boolean(s.is_public),
      consent_granted: Boolean(s.consent_granted),
      show_grades: s.show_grades !== undefined ? Boolean(s.show_grades) : true,
      show_certificates: s.show_certificates !== undefined ? Boolean(s.show_certificates) : true,
      public_slug: String(s.public_slug || '')
    };

    const elPub = document.getElementById('prt-is-public');
    const elConsent = document.getElementById('prt-consent-granted');
    const elGrades = document.getElementById('prt-show-grades');
    const elCerts = document.getElementById('prt-show-certificates');
    const elSlug = document.getElementById('prt-public-slug');

    if (elPub) elPub.checked = state.settings.is_public;
    if (elConsent) elConsent.checked = state.settings.consent_granted;
    if (elGrades) elGrades.checked = state.settings.show_grades;
    if (elCerts) elCerts.checked = state.settings.show_certificates;
    if (elSlug) elSlug.value = state.settings.public_slug;

    updatePublicUrlPreview();
  }

  function updatePublicUrlPreview() {
    const elSlug = document.getElementById('prt-public-slug');
    const elPub = document.getElementById('prt-is-public');
    const elConsent = document.getElementById('prt-consent-granted');
    const previewEl = document.getElementById('prt-public-url-preview');
    const copyBtn = document.getElementById('btn-copy-public-portfolio');

    const slug = (elSlug && elSlug.value.trim()) || state.settings.public_slug || '';
    const isPublic = elPub ? elPub.checked : state.settings.is_public;
    const hasConsent = elConsent ? elConsent.checked : state.settings.consent_granted;
    const enabled = Boolean(isPublic && hasConsent && slug);

    if (previewEl) {
      previewEl.textContent = slug ? buildPublicPortfolioUrl(slug) : 'Укажите публичный slug для формирования ссылки';
    }
    if (copyBtn) {
      copyBtn.disabled = !enabled;
      copyBtn.classList.toggle('opacity-50', !enabled);
      copyBtn.classList.toggle('cursor-not-allowed', !enabled);
    }
  }

  async function saveSettings() {
    const elPub = document.getElementById('prt-is-public');
    const elConsent = document.getElementById('prt-consent-granted');
    const elGrades = document.getElementById('prt-show-grades');
    const elCerts = document.getElementById('prt-show-certificates');
    const elSlug = document.getElementById('prt-public-slug');
    const statusEl = document.getElementById('prt-settings-status');

    const payload = {
      is_public: Boolean(elPub && elPub.checked),
      consent_granted: Boolean(elConsent && elConsent.checked),
      show_grades: Boolean(elGrades && elGrades.checked),
      show_certificates: Boolean(elCerts && elCerts.checked),
      public_slug: (elSlug && elSlug.value.trim()) || ''
    };

    if (payload.is_public && !payload.consent_granted) {
      if (statusEl) {
        statusEl.className = 'text-xs font-semibold text-amber-300';
        statusEl.textContent = 'Внимание: для открытия публичной ссылки необходимо отметить согласие на публикацию данных.';
      }
    }

    const res = await window.EduSpace.api('/api/portfolio/settings', {
      method: 'PUT',
      body: payload
    });
    const data = (res && res.data) || {};
    if (res.ok && data.success) {
      populatePrivacyControls(data);
      if (statusEl) {
        statusEl.className = 'text-xs font-semibold text-emerald-400';
        statusEl.textContent = data.is_public && data.consent_granted
          ? `Настройки сохранены. Публичная ссылка активна: ${buildPublicPortfolioUrl(data.public_slug)}`
          : 'Настройки приватности сохранены (публичный доступ отключён).';
      }
      notify('Настройки приватности портфолио сохранены!', 'success');
    } else {
      const msg = data.message || 'Не удалось сохранить настройки приватности.';
      if (statusEl) {
        statusEl.className = 'text-xs font-semibold text-red-400';
        statusEl.textContent = msg;
      }
      notify(msg, 'error');
    }
  }

  async function copyPublicLink() {
    const slug = (document.getElementById('prt-public-slug')?.value || state.settings.public_slug || '').trim();
    if (!slug) {
      notify('Сначала укажите и сохраните публичный адрес (slug).', 'warning');
      return;
    }
    const url = buildPublicPortfolioUrl(slug);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      }
      notify('Публичная ссылка на портфолио скопирована!', 'success');
      const statusEl = document.getElementById('prt-settings-status');
      if (statusEl) {
        statusEl.className = 'text-xs font-semibold text-cyan-300';
        statusEl.textContent = `Ссылка скопирована: ${url}`;
      }
    } catch (e) {
      notify(url, 'info');
    }
  }

  async function downloadPdf() {
    if (state.isPublicView) {
      notify('Официальный PDF доступен для скачивания владельцу аккаунта; используйте кнопку печати листа.', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/portfolio/export.pdf', { credentials: 'same-origin' });
      if (res.status === 401) {
        notify('Войдите в аккаунт для скачивания официального PDF-портфолио.', 'warning');
        return;
      }
      if (!res.ok) {
        notify('Ошибка формирования PDF-документа.', 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const uid = (state.portfolio && state.portfolio.student && state.portfolio.student.id) || 'student';
      a.href = url;
      a.download = `portfolio_${uid}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Официальный PDF-файл портфолио сформирован и загружен!', 'success');
    } catch (e) {
      notify('Сетевая ошибка при экспорте PDF.', 'error');
    }
  }

  async function loadPublicPortfolio(slug) {
    state.isPublicView = true;
    state.publicSlug = slug;

    const privacyPanel = document.getElementById('portfolio-privacy-panel');
    const selector = document.getElementById('career-selector');
    const pdfBtn = document.getElementById('btn-download-pdf');
    const authGate = document.getElementById('portfolio-auth-gate');
    const privateBanner = document.getElementById('portfolio-private-banner');
    const privateMsg = document.getElementById('portfolio-private-message');
    const sheet = document.getElementById('cv-sheet');

    if (privacyPanel) privacyPanel.classList.add('hidden');
    if (selector) selector.classList.add('hidden');
    if (pdfBtn) pdfBtn.classList.add('hidden');
    if (authGate) authGate.classList.add('hidden');

    try {
      const res = await fetch('/api/portfolio/public/' + encodeURIComponent(slug), { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        if (sheet) sheet.classList.add('hidden');
        if (privateBanner) privateBanner.classList.remove('hidden');
        if (privateMsg) {
          privateMsg.textContent = data.message || (res.status === 403
            ? 'Доступ к портфолио закрыт настройками приватности студента.'
            : 'Публичное портфолио по указанному адресу не найдено.');
        }
        return;
      }
      if (privateBanner) privateBanner.classList.add('hidden');
      renderPortfolio(data, { isPublic: true });
    } catch (e) {
      if (sheet) sheet.classList.add('hidden');
      if (privateBanner) privateBanner.classList.remove('hidden');
    }
  }

  async function loadMyPortfolio() {
    const authGate = document.getElementById('portfolio-auth-gate');
    const sheet = document.getElementById('cv-sheet');
    const privacyPanel = document.getElementById('portfolio-privacy-panel');

    try {
      const sessResp = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' });
      const sess = sessResp.ok ? await sessResp.json() : null;
      if (sess && sess.csrf_token && window.EduSpace && window.EduSpace.setCsrfToken) {
        window.EduSpace.setCsrfToken(sess.csrf_token);
      }
      if (!sess || !sess.authenticated || !sess.user) {
        if (sheet) sheet.classList.add('hidden');
        if (privacyPanel) privacyPanel.classList.add('hidden');
        if (authGate) authGate.classList.remove('hidden');
        const qpSpec = new URLSearchParams(window.location.search).get('specialty');
        renderVacancies(qpSpec || 'it');
        return;
      }

      if (authGate) authGate.classList.add('hidden');
      if (privacyPanel) privacyPanel.classList.remove('hidden');

      const navName = document.getElementById('nav-profile-name');
      if (navName && sess.user.full_name) {
        navName.textContent = sess.user.first_name || sess.user.full_name.split(' ')[0];
      }

      const [meRes, setRes] = await Promise.all([
        window.EduSpace.api('/api/portfolio/me'),
        window.EduSpace.api('/api/portfolio/settings')
      ]);

      if (meRes.ok && meRes.data && meRes.data.success) {
        renderPortfolio(meRes.data, { isPublic: false });
        const settingsObj = (setRes.ok && setRes.data && setRes.data.success)
          ? setRes.data
          : (meRes.data.settings || {});
        populatePrivacyControls(settingsObj);
      }
    } catch (e) {
      console.error('Portfolio load failed:', e);
    }
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const publicSlug = params.get('public') || params.get('slug');

    ['prt-is-public', 'prt-consent-granted', 'prt-public-slug'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updatePublicUrlPreview);
        el.addEventListener('change', updatePublicUrlPreview);
      }
    });

    if (publicSlug) {
      await loadPublicPortfolio(publicSlug);
    } else {
      await loadMyPortfolio();
    }
  }

  window.PortfolioApp = {
    init,
    loadMyPortfolio,
    loadPublicPortfolio,
    saveSettings,
    copyPublicLink,
    downloadPdf,
    switchVacancyTrack: renderVacancies
  };
  window.switchResumeSpecialty = renderVacancies;
})();
