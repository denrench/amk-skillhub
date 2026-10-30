/* ========================================================
   AMK SKILLHUB: CLEAN & ROBUST CONTROLLER (app.js)
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    theme: localStorage.getItem('amk_theme') || 'dark',
    lang: localStorage.getItem('amk_lang') || 'ru',
    activeCategory: 'all',
    salary: 450000
  };

  let radarChartInstance = null;
  let modalChartInstance = null;

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

    const dict = AMK_DATA.i18n[lang] || AMK_DATA.i18n.ru;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    renderSpecialties();
    renderCareers(state.salary);
    renderCharts();
  };

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      applyLanguage(state.lang === 'ru' ? 'kz' : 'ru');
      showToast(state.lang === 'kz' ? 'Тіл қазақшаға ауыстырылды' : 'Язык переключен на русский');
    });
  }

  // 3. Specialties Filtering
  const filterButtons = document.querySelectorAll('.tab-filter');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
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
    let list = AMK_DATA.specialties;
    if (state.activeCategory !== 'all') {
      list = list.filter(s => s.category === state.activeCategory);
    }

    grid.innerHTML = list.map(s => {
      const title = isKz ? s.title_kz : s.title_ru;
      const desc = isKz ? s.desc_kz : s.desc_ru;
      const tags = s.tags.map(t => `<span class="clean-tag">${t}</span>`).join('');

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

  // 4. FIXED SALARY & INCOME CALCULATOR (Гарантированно растет и реагирует)
  const salarySlider = document.getElementById('salarySlider');
  const salaryDisplay = document.getElementById('salaryDisplay');
  const careerGrid = document.getElementById('careerGrid');

  function renderCareers(salaryValue) {
    if (!careerGrid) return;

    if (salaryDisplay) {
      salaryDisplay.textContent = `${salaryValue.toLocaleString('ru-RU')} ₸ / мес`;
    }

    // Determine Career Tier
    let tierBadge = 'Стажер / Начальный уровень';
    let tierColor = '#94a3b8';
    if (salaryValue >= 600000) {
      tierBadge = 'Ведущий специалист / Старший мастер';
      tierColor = '#10b981';
    } else if (salaryValue >= 400000) {
      tierBadge = 'Квалифицированный специалист';
      tierColor = '#0ea5e9';
    }

    careerGrid.innerHTML = AMK_DATA.careers.map(c => {
      // Scale income to reflect the slider
      const estimatedIncome = Math.round(Math.min(c.maxSalary, Math.max(c.baseSalary, salaryValue)));

      return `
        <div class="career-card-item">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div class="c-role">${c.role}</div>
            <span style="font-family: var(--font-mono); font-weight: 900; color: #10b981; font-size: 1.1rem; white-space: nowrap;">
              ~${estimatedIncome.toLocaleString('ru-RU')} ₸
            </span>
          </div>
          <div class="c-spec">${c.specialty}</div>
          <div style="font-size: 0.75rem; color: ${tierColor}; font-weight: 700; margin-bottom: 8px;">
            ${tierBadge}
          </div>
          <div class="c-companies">
            <strong>Компании в Алматы:</strong> ${c.companies}
          </div>
        </div>
      `;
    }).join('');
  }

  if (salarySlider) {
    const handleSliderChange = (e) => {
      state.salary = parseInt(e.target.value, 10);
      renderCareers(state.salary);
    };
    salarySlider.addEventListener('input', handleSliderChange);
    salarySlider.addEventListener('change', handleSliderChange);
  }

  // 5. Radar Chart Rendering
  function renderCharts() {
    const isDark = state.theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    const labels = [
      'IT / Код',
      'Автоэлектрика',
      'Холодильные системы',
      'Дизайн UI',
      'Раскрой мебели',
      'Документооборот'
    ];

    const dataVals = [
      AMK_DATA.student.skills.it,
      AMK_DATA.student.skills.auto,
      AMK_DATA.student.skills.cryo,
      AMK_DATA.student.skills.design,
      AMK_DATA.student.skills.furniture,
      AMK_DATA.student.skills.docs
    ];

    const config = {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Освоение (%)',
          data: dataVals,
          backgroundColor: 'rgba(79, 70, 229, 0.25)',
          borderColor: '#4f46e5',
          borderWidth: 2,
          pointBackgroundColor: '#0ea5e9',
          pointBorderColor: '#fff',
          pointRadius: 4
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
      groupEl.textContent = user.role === 'teacher' ? 'Преподаватель' : user.group_name;

      if (chip) {
        chip.onclick = () => {
          if (user.role === 'teacher') {
            window.location.href = 'teacher.html';
          } else {
            const modal = document.getElementById('diplomaModal');
            if (modal) modal.classList.add('active');
          }
        };
      }

      // Update certificate modal with logged in user data
      const certName = document.querySelector('#diplomaModal strong');
      const certSub = document.querySelector('#diplomaModal span');
      const certId = document.querySelector('#diplomaModal p');
      if (certName) certName.textContent = user.full_name;
      if (certSub) certSub.textContent = `Алматинский многопрофильный колледж • ${user.group_name || 'Студент'}`;
      if (certId && user.student_id) certId.textContent = `ID: ${user.student_id}`;

      // Pull actual grades from backend database
      if (user.id) {
        fetch(`/api/user/profile/${user.id}`)
          .then(r => r.json())
          .then(d => {
            if (d.success && d.grades && d.grades.length > 0) {
              d.grades.forEach(g => {
                if (AMK_DATA.student.skills[g.specialty_slug] !== undefined) {
                  AMK_DATA.student.skills[g.specialty_slug] = g.score;
                }
              });
              renderCharts();
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
        localStorage.removeItem('amk_current_user');
        checkAuthState();
        showToast('Вы вышли из учетной записи');
      };
    }
  }

  checkAuthState();

  // Toast
  window.showToast = function(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  };

  // Initial execution
  applyLanguage(state.lang);
  renderCareers(state.salary);
});
