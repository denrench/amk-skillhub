/* ========================================================
   AMK SKILLHUB: PROFESSIONAL PRODUCTION CONTROLLER (app.js)
   Clean, Resilient, Reactive & User-Centric
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    theme: localStorage.getItem('amk_theme') || 'dark',
    lang: localStorage.getItem('amk_lang') || 'ru',
    activeCategory: 'all',
    salary: 450000,
    currentUser: null
  };

  let radarChartInstance = null;

  // 1. Theme Management
  const themeToggle = document.getElementById('themeToggle');
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('amk_theme', theme);
    state.theme = theme;
    if (radarChartInstance) renderCharts();
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });
  }
  applyTheme(state.theme);

  // 2. Language Management
  const langToggle = document.getElementById('langToggle');
  const langLabel = document.getElementById('langLabel');
  const applyLanguage = (lang) => {
    state.lang = lang;
    localStorage.setItem('amk_lang', lang);
    if (langLabel) langLabel.textContent = lang === 'ru' ? 'ҚАЗ' : 'РУС';

    const dict = (AMK_DATA.i18n && AMK_DATA.i18n[lang]) ? AMK_DATA.i18n[lang] : (AMK_DATA.i18n ? AMK_DATA.i18n.ru : {});
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict && dict[key]) el.textContent = dict[key];
    });

    renderSpecialties();
    renderCareers(state.salary);
    renderCharts();
  };

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      applyLanguage(state.lang === 'ru' ? 'kz' : 'ru');
      showToast(state.lang === 'kz' ? 'Тіл қазақшаға ауыстырылды' : 'Язык переключен на русский');
    });
  }

  // 3. Specialties Filtering
  const filterButtons = document.querySelectorAll('.tab-filter');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCategory = btn.getAttribute('data-cat');
      renderSpecialties();
    });
  });

  function renderSpecialties() {
    const grid = document.getElementById('specialtiesGrid');
    if (!grid) return;

    const isKz = state.lang === 'kz';
    let list = AMK_DATA.specialties || [];
    if (state.activeCategory !== 'all') {
      list = list.filter(s => s.category === state.activeCategory);
    }

    grid.innerHTML = list.map(s => {
      const title = isKz ? s.title_kz : s.title_ru;
      const desc = isKz ? s.desc_kz : s.desc_ru;
      const tags = (s.tags || []).map(t => `<span class="clean-tag">${t}</span>`).join('');

      return `
        <div class="spec-clean-card">
          <div class="spec-card-head">
            <div class="spec-icon-clean">${s.icon}</div>
            <div>
              <span class="spec-code-clean">${s.code}</span>
              <h3>${title}</h3>
            </div>
          </div>
          <p>${desc}</p>
          <div class="spec-tags-clean">${tags}</div>
          <a href="simulator.html?spec=${s.slug}" class="btn-open-track">
            <span>${isKz ? 'Симуляторды ашу' : 'Открыть симулятор'}</span>
            <span>&rarr;</span>
          </a>
        </div>
      `;
    }).join('');
  }

  // 4. Reactive Career Income Calculator
  const salarySlider = document.getElementById('salarySlider');
  const salaryDisplay = document.getElementById('salaryDisplay');

  function renderCareers(targetSalary) {
    if (salaryDisplay) {
      salaryDisplay.innerHTML = `${targetSalary.toLocaleString('ru-RU')} ₸ <small>/ ай (мес)</small>`;
    }

    const grid = document.getElementById('careerGrid');
    if (!grid) return;

    const careers = AMK_DATA.careers || [];
    grid.innerHTML = careers.map(c => {
      // Calculate realistic scaled salary based on slider position
      const minS = c.baseSalary || 250000;
      const maxS = c.maxSalary || 950000;
      const ratio = Math.max(0, Math.min(1, (targetSalary - 250000) / 700000));
      const calculatedSalary = Math.round((minS + (maxS - minS) * ratio) / 5000) * 5000;

      let levelBadge = 'Специалист';
      let badgeColor = 'var(--accent-cyan)';
      if (calculatedSalary >= 700000) {
        levelBadge = 'Ведущий мастер / Тимлид';
        badgeColor = 'var(--accent-emerald)';
      } else if (calculatedSalary <= 320000) {
        levelBadge = 'Начинающий техник';
        badgeColor = 'var(--accent-amber)';
      }

      return `
        <div class="career-match-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <span class="career-spec-code">${c.specialty}</span>
              <span style="font-size: 0.72rem; font-weight: 800; color: ${badgeColor}; background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 4px;">
                ${levelBadge}
              </span>
            </div>
            <h4 class="career-role-title">${c.role}</h4>
          </div>

          <div style="margin: 16px 0;">
            <div class="career-salary-box">
              <span class="career-salary-label">Прогнозный доход:</span>
              <span class="career-salary-num">${calculatedSalary.toLocaleString('ru-RU')} ₸</span>
            </div>
            <div class="career-companies-tag">
              <strong>Работодатели в Алматы:</strong>
              ${c.companies}
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 12px; font-size: 0.78rem; color: var(--text-muted);">
            Ключевые навыки: <span style="color: var(--text-secondary);">${c.skills}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  if (salarySlider) {
    salarySlider.addEventListener('input', (e) => {
      state.salary = parseInt(e.target.value, 10);
      renderCareers(state.salary);
    });
  }

  // 5. Radar Chart of Competencies
  function renderCharts() {
    const isDark = state.theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    // Retrieve active student skills
    const saved = JSON.parse(localStorage.getItem('amk_student_data')) || AMK_DATA.student;
    const skills = saved.skills || { it: 90, auto: 85, cryo: 80, design: 85, furniture: 80 };

    const labels = state.lang === 'kz'
      ? ['IT БҚ', 'Автодиагностика', 'Холод. жүйелер', 'UI Дизайн', 'ЧПУ Жиһаз']
      : ['IT-разработка', 'Автодиагностика', 'Холод. машины', 'Граф. дизайн', 'ЧПУ Мебель'];

    const dataValues = [
      skills.it || 0,
      skills.auto || 0,
      skills.cryo || 0,
      skills.design || 0,
      skills.furniture || 0
    ];

    const config = {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Оценка WorldSkills',
          data: dataValues,
          backgroundColor: 'rgba(79, 70, 229, 0.25)',
          borderColor: '#4f46e5',
          borderWidth: 2,
          pointBackgroundColor: '#0ea5e9',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: gridColor },
            grid: { color: gridColor },
            pointLabels: {
              color: textColor,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '700' }
            },
            ticks: { display: false, stepSize: 20 },
            min: 0,
            max: 100
          }
        },
        plugins: { legend: { display: false } }
      }
    };

    const canvas = document.getElementById('heroRadarCanvas');
    if (canvas) {
      if (radarChartInstance) radarChartInstance.destroy();
      radarChartInstance = new Chart(canvas, config);
    }
  }

  // 6. User Authentication State & Dynamic Navbar
  function checkAuthState() {
    const raw = localStorage.getItem('amk_current_user');
    const user = raw ? JSON.parse(raw) : null;
    state.currentUser = user;

    const btnLogin = document.getElementById('btnNavLogin');
    const userBadge = document.getElementById('navUserBadge');
    const nameEl = document.getElementById('navUserName');
    const groupEl = document.getElementById('navUserGroup');
    const logoutBtn = document.getElementById('btnNavLogout');
    const chip = document.getElementById('userProfileChip');

    if (user && nameEl && groupEl) {
      if (btnLogin) btnLogin.style.display = 'none';
      if (userBadge) userBadge.style.display = 'flex';

      nameEl.textContent = user.full_name;
      groupEl.textContent = user.role === 'teacher' ? 'Преподаватель' : (user.group_name || 'Студент');

      if (chip) {
        chip.onclick = () => {
          if (window.soundEngine) window.soundEngine.playClick();
          if (user.role === 'teacher') {
            window.location.href = 'teacher.html';
          } else {
            openStudentDiplomaModal(user);
          }
        };
      }

      // Update certificate modal with logged in user data
      updateDiplomaModalData(user);

      // Pull actual grades from backend SQLite3 database if server is active
      if (user.id) {
        fetch(`/api/user/profile/${user.id}`)
          .then(r => r.json())
          .then(d => {
            if (d.success && d.grades && d.grades.length > 0) {
              const saved = JSON.parse(localStorage.getItem('amk_student_data')) || AMK_DATA.student;
              saved.skills = saved.skills || {};
              d.grades.forEach(g => {
                saved.skills[g.specialty_slug] = g.score;
              });
              localStorage.setItem('amk_student_data', JSON.stringify(saved));
              renderCharts();
              updateDiplomaModalData(user);
            }
          })
          .catch(() => {});
      }
    } else {
      if (btnLogin) btnLogin.style.display = 'inline-flex';
      if (userBadge) userBadge.style.display = 'none';
    }

    if (logoutBtn) {
      logoutBtn.onclick = () => {
        if (window.soundEngine) window.soundEngine.playClick();
        localStorage.removeItem('amk_current_user');
        checkAuthState();
        showToast('Вы вышли из учетной записи');
      };
    }
  }

  // 7. Student Diploma / Competency Passport Modal
  const diplomaModal = document.getElementById('diplomaModal');
  const openDiplomaBtn = document.getElementById('openDiplomaBtn');
  const closeDiplomaBtn = document.getElementById('closeDiplomaBtn');

  function openStudentDiplomaModal(user) {
    updateDiplomaModalData(user || state.currentUser);
    if (diplomaModal) diplomaModal.classList.add('active');
  }

  function updateDiplomaModalData(user) {
    const certName = document.getElementById('certStudentName');
    const certSub = document.getElementById('certStudentGroup');
    const certId = document.getElementById('certStudentId');
    const certAvatar = document.getElementById('certStudentAvatar');

    const u = user || state.currentUser || {
      full_name: "Асылхан Бауыржанұлы",
      group_name: "ПО-22",
      student_id: "KZ-AMK-2026-98421"
    };

    if (certName) certName.textContent = u.full_name;
    if (certSub) certSub.textContent = `Алматинский многопрофильный колледж • ${u.role === 'teacher' ? 'Преподаватель' : (u.group_name || 'Студент')}`;
    if (certId) certId.textContent = u.student_id ? `Билет: ${u.student_id}` : 'ID: KZ-AMK-2026-98421';
    if (certAvatar) {
      const initials = u.full_name ? u.full_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'АБ';
      certAvatar.textContent = initials;
    }

    // Populate the 5 skills progress bars
    const saved = JSON.parse(localStorage.getItem('amk_student_data')) || AMK_DATA.student;
    const skills = saved.skills || { it: 94, auto: 88, cryo: 91, design: 85, furniture: 80 };

    const bars = [
      { id: 'progIt', valId: 'valIt', score: skills.it || 0 },
      { id: 'progAuto', valId: 'valAuto', score: skills.auto || 0 },
      { id: 'progCryo', valId: 'valCryo', score: skills.cryo || 0 },
      { id: 'progDesign', valId: 'valDesign', score: skills.design || 0 },
      { id: 'progFurn', valId: 'valFurn', score: skills.furniture || 0 }
    ];

    bars.forEach(b => {
      const barEl = document.getElementById(b.id);
      const valEl = document.getElementById(b.valId);
      if (barEl) barEl.style.width = `${b.score}%`;
      if (valEl) valEl.textContent = `${b.score} / 100`;
    });
  }

  if (openDiplomaBtn) {
    openDiplomaBtn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      openStudentDiplomaModal();
    });
  }

  if (closeDiplomaBtn) {
    closeDiplomaBtn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      if (diplomaModal) diplomaModal.classList.remove('active');
    });
  }

  // Close modal when clicking outside backdrop
  if (diplomaModal) {
    diplomaModal.addEventListener('click', (e) => {
      if (e.target === diplomaModal) {
        diplomaModal.classList.remove('active');
      }
    });
  }

  // Toast Notification
  window.showToast = function(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  };

  // Run initial state
  checkAuthState();
  applyLanguage(state.lang);
  renderCareers(state.salary);
});
