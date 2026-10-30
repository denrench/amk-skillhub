/* ========================================================
   AMK SKILLHUB: MAIN APP LOGIC (app.js)
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize App State
  const state = {
    theme: localStorage.getItem('amk_theme') || 'dark',
    lang: localStorage.getItem('amk_lang') || 'ru',
    student: JSON.parse(localStorage.getItem('amk_student_data')) || AMK_DATA.student
  };

  // Cache Chart Instances
  let heroChartInstance = null;
  let modalChartInstance = null;

  // 1. Theme Management
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('amk_theme', theme);
    state.theme = theme;
    updateChartTheme();
  };

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }
  applyTheme(state.theme);

  // 2. Language Management (RU / KZ)
  const langToggle = document.getElementById('langToggle');
  const currentLangLabel = document.getElementById('currentLangLabel');

  const setLanguage = (lang) => {
    state.lang = lang;
    localStorage.setItem('amk_lang', lang);
    if (currentLangLabel) {
      currentLangLabel.textContent = lang === 'ru' ? 'KZ' : 'RU';
    }

    // Update all elements with data-i18n
    const dict = AMK_DATA.i18n[lang] || AMK_DATA.i18n.ru;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Re-render specialties in current language
    renderSpecialties();
    // Re-render charts
    renderRadarCharts();
  };

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const nextLang = state.lang === 'ru' ? 'kz' : 'ru';
      setLanguage(nextLang);
      showToast(nextLang === 'kz' ? 'Тіл қазақшаға ауыстырылды' : 'Язык переключен на русский');
    });
  }

  // 3. Render Specialties Grid from AMK Data
  function renderSpecialties() {
    const container = document.getElementById('specialtiesContainer');
    if (!container) return;

    const isKz = state.lang === 'kz';
    container.innerHTML = AMK_DATA.specialties.map(spec => {
      const title = isKz ? spec.title_kz : spec.title_ru;
      const desc = isKz ? spec.desc_kz : spec.desc_ru;
      const tagsHtml = spec.tags.map(t => `<span class="spec-tag">${t}</span>`).join('');

      return `
        <div class="spec-card">
          <div class="spec-top">
            <div class="spec-icon-box">${spec.icon}</div>
            <span class="spec-code">${spec.code}</span>
          </div>
          <h3>${title}</h3>
          <p>${desc}</p>
          <div class="spec-tags">${tagsHtml}</div>
          <div class="spec-action">
            <span class="level-badge">Кейсов: ${spec.casesCount}</span>
            <a href="simulator.html?spec=${spec.slug}" class="btn-open-sim">
              ${isKz ? 'Симуляторды ашу' : 'Открыть трек'} &rarr;
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Interactive Radar Chart (Skill Matrix)
  function getChartConfig(labels, dataValues) {
    const isDark = state.theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    return {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: state.lang === 'kz' ? 'Дағды деңгейі (%)' : 'Уровень освоения (%)',
          data: dataValues,
          backgroundColor: 'rgba(99, 102, 241, 0.25)',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#06b6d4',
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
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11,
                weight: '600'
              }
            },
            ticks: {
              display: false,
              backdropColor: 'transparent',
              stepSize: 20
            },
            min: 0,
            max: 100
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#161e31' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` ${ctx.raw}% из 100%`
            }
          }
        }
      }
    };
  }

  function renderRadarCharts() {
    const isKz = state.lang === 'kz';
    const labels = isKz ? [
      'IT / БҚ',
      'Автодиагностика',
      'Тоңазыту жүйелері',
      'Графикалық дизайн',
      'Жиһаз өндірісі',
      'Құжаттама'
    ] : [
      'IT / Разработка',
      'Автодиагностика',
      'Холодильные машины',
      'Графдизайн',
      'Мебель / Раскрой',
      'Документооборот'
    ];

    const dataValues = [
      state.student.skills.it,
      state.student.skills.auto,
      state.student.skills.cryo,
      state.student.skills.design,
      state.student.skills.furniture,
      state.student.skills.docs
    ];

    // Main Hero Chart
    const heroCanvas = document.getElementById('heroRadarChart');
    if (heroCanvas) {
      if (heroChartInstance) heroChartInstance.destroy();
      heroChartInstance = new Chart(heroCanvas, getChartConfig(labels, dataValues));
    }

    // Modal Passport Chart
    const modalCanvas = document.getElementById('modalRadarChart');
    if (modalCanvas) {
      if (modalChartInstance) modalChartInstance.destroy();
      modalChartInstance = new Chart(modalCanvas, getChartConfig(labels, dataValues));
    }
  }

  function updateChartTheme() {
    if (heroChartInstance || modalChartInstance) {
      renderRadarCharts();
    }
  }

  // 5. Sync Progress Button (Simulation of live skill growth)
  const syncBtn = document.getElementById('syncProgressBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      // Simulate real-time progress update
      state.student.skills.it = Math.min(100, state.student.skills.it + 2);
      state.student.skills.auto = Math.min(100, state.student.skills.auto + 3);
      state.student.skills.cryo = Math.min(100, state.student.skills.cryo + 1);
      state.student.skillPoints += 25;
      localStorage.setItem('amk_student_data', JSON.stringify(state.student));
      renderRadarCharts();
      showToast('Синхронизировано: получено +25 SkillPoints!');
    });
  }

  // 6. Digital Passport Modal
  const openPassportBtn = document.getElementById('openPassportBtn');
  const closePassportBtn = document.getElementById('closePassportBtn');
  const passportModal = document.getElementById('passportModal');
  const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');

  if (openPassportBtn && passportModal) {
    openPassportBtn.addEventListener('click', () => {
      passportModal.classList.add('active');
      setTimeout(renderRadarCharts, 50);
    });
  }

  if (closePassportBtn && passportModal) {
    closePassportBtn.addEventListener('click', () => {
      passportModal.classList.remove('active');
    });
  }

  if (passportModal) {
    passportModal.addEventListener('click', (e) => {
      if (e.target === passportModal) passportModal.classList.remove('active');
    });
  }

  if (copyShareLinkBtn) {
    copyShareLinkBtn.addEventListener('click', () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?id=${state.student.id}`;
      navigator.clipboard?.writeText(shareUrl).then(() => {
        showToast('Ссылка на цифровой сертификат скопирована!');
      }).catch(() => {
        showToast(`Сертификат ID: ${state.student.id}`);
      });
    });
  }

  // 7. Toast Helper
  window.showToast = function(msg) {
    let toast = document.getElementById('toast');
    if (!toast) toast = document.getElementById('simToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  };

  // Initial Boot
  setLanguage(state.lang);
});
