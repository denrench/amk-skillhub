/* ========================================================
   AMK SKILLHUB: MAIN APPLICATION CONTROLLER (app.js)
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // State
  const state = {
    theme: localStorage.getItem('amk_theme') || 'dark',
    lang: localStorage.getItem('amk_lang') || 'ru',
    student: JSON.parse(localStorage.getItem('amk_student_data')) || AMK_DATA.student,
    activeCategory: 'all',
    searchQuery: '',
    targetSalary: 450000
  };

  let heroChartInstance = null;
  let modalChartInstance = null;

  // 1. Interactive Cursor Spotlight Glow
  const spotlight = document.getElementById('cursorSpotlight');
  if (spotlight) {
    window.addEventListener('pointermove', (e) => {
      spotlight.style.left = `${e.clientX}px`;
      spotlight.style.top = `${e.clientY}px`;
    });
  }

  // 2. Sound Effects Engine & Navbar Toggle
  const soundToggle = document.getElementById('soundToggle');
  const soundIcon = document.getElementById('soundIcon');
  if (soundToggle) {
    if (AMK_AUDIO.isMuted) soundToggle.classList.add('muted');
    soundToggle.addEventListener('click', () => {
      AMK_AUDIO.isMuted = !AMK_AUDIO.isMuted;
      localStorage.setItem('amk_sound_muted', AMK_AUDIO.isMuted);
      soundToggle.classList.toggle('muted', AMK_AUDIO.isMuted);
      if (!AMK_AUDIO.isMuted) {
        AMK_AUDIO.playClick();
        showToast('Звуковые эффекты включены');
      } else {
        showToast('Звуковые эффекты отключены');
      }
    });
  }

  // Attach sound to clickable elements
  document.querySelectorAll('button, .btn, .nav-link, .filter-pill').forEach(el => {
    el.addEventListener('click', () => AMK_AUDIO.playClick());
  });

  // 3. Theme Management
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

  // 4. Language Switcher (RU / KZ)
  const langToggle = document.getElementById('langToggle');
  const currentLangLabel = document.getElementById('currentLangLabel');

  const setLanguage = (lang) => {
    state.lang = lang;
    localStorage.setItem('amk_lang', lang);
    if (currentLangLabel) currentLangLabel.textContent = lang === 'ru' ? 'KZ' : 'RU';

    const dict = AMK_DATA.i18n[lang] || AMK_DATA.i18n.ru;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    renderSpecialties();
    renderCareerMatches();
    renderRadarCharts();
  };

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      setLanguage(state.lang === 'ru' ? 'kz' : 'ru');
      showToast(state.lang === 'kz' ? 'Тіл қазақшаға ауыстырылды' : 'Язык переключен на русский');
    });
  }

  // 5. Specialty Filters & Live Search
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeCategory = pill.getAttribute('data-category');
      renderSpecialties();
    });
  });

  const searchInput = document.getElementById('specSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderSpecialties();
    });
  }

  function renderSpecialties() {
    const container = document.getElementById('specialtiesContainer');
    if (!container) return;

    const isKz = state.lang === 'kz';
    let filtered = AMK_DATA.specialties;

    // Filter by Category
    if (state.activeCategory !== 'all') {
      filtered = filtered.filter(s => s.category === state.activeCategory);
    }

    // Filter by Search Query
    if (state.searchQuery) {
      filtered = filtered.filter(s => 
        s.code.includes(state.searchQuery) ||
        s.title_ru.toLowerCase().includes(state.searchQuery) ||
        s.title_kz.toLowerCase().includes(state.searchQuery) ||
        s.tags.some(t => t.toLowerCase().includes(state.searchQuery))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-dim);">
          <p style="font-size: 1.1rem;">Ничего не найдено по запросу «${state.searchQuery}»</p>
          <button class="btn btn-secondary" style="margin-top: 14px;" onclick="document.getElementById('specSearchInput').value=''; state.searchQuery=''; renderSpecialties();">Сбросить фильтр</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(spec => {
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
          <div class="spec-progress-wrap">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-dim); font-weight: 700;">
              <span>Готовность к Демоэкзамену:</span>
              <span style="color: var(--accent-green); font-family: var(--font-mono);">${spec.readyPercent}%</span>
            </div>
            <div class="spec-progress-bar">
              <div class="spec-progress-fill" style="width: ${spec.readyPercent}%"></div>
            </div>
          </div>
          <div class="spec-action">
            <span class="level-badge">${spec.casesCount} кейсов</span>
            <a href="simulator.html?spec=${spec.slug}" class="btn-open-sim">
              ${isKz ? 'Симуляторды ашу' : 'Открыть трек'} &rarr;
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  // 6. Career Salary Navigator Widget
  const salarySlider = document.getElementById('salarySlider');
  const salaryDisplay = document.getElementById('salaryDisplay');

  function renderCareerMatches() {
    const list = document.getElementById('careerMatchesList');
    if (!list) return;

    const salary = state.targetSalary;
    if (salaryDisplay) {
      salaryDisplay.textContent = `${salary.toLocaleString('ru-RU')} ₸ / мес`;
    }

    const matches = AMK_DATA.careerTracks.filter(track => track.maxSalary >= salary);
    if (matches.length === 0) {
      list.innerHTML = `<div style="color: var(--text-dim); padding: 10px;">Для данной планки зарплаты требуется дополнительный опыт или квалификация Senior.</div>`;
      return;
    }

    list.innerHTML = matches.map(m => `
      <div class="career-match-item">
        <div>
          <div class="match-role">${m.roles[0]}</div>
          <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 2px;">
            ${m.specialty} • ${m.topCompanies.slice(0, 2).join(', ')}
          </div>
        </div>
        <span class="match-badge">${(m.maxSalary / 1000).toFixed(0)}k ₸</span>
      </div>
    `).join('');
  }

  if (salarySlider) {
    salarySlider.addEventListener('input', (e) => {
      state.targetSalary = parseInt(e.target.value, 10);
      renderCareerMatches();
    });
  }

  // 7. Interactive Radar Chart (Skill Matrix)
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
          backgroundColor: 'rgba(99, 102, 241, 0.28)',
          borderColor: '#6366f1',
          borderWidth: 2.5,
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#06b6d4',
          pointRadius: 4.5
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
                weight: '700'
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
            backgroundColor: isDark ? '#131b2e' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderWidth: 1.5,
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

    const heroCanvas = document.getElementById('heroRadarChart');
    if (heroCanvas) {
      if (heroChartInstance) heroChartInstance.destroy();
      heroChartInstance = new Chart(heroCanvas, getChartConfig(labels, dataValues));
    }

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

  // 8. Sync Progress Button
  const syncBtn = document.getElementById('syncProgressBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      state.student.skills.it = Math.min(100, state.student.skills.it + 2);
      state.student.skills.auto = Math.min(100, state.student.skills.auto + 3);
      state.student.skills.cryo = Math.min(100, state.student.skills.cryo + 1);
      state.student.skillPoints += 50;
      localStorage.setItem('amk_student_data', JSON.stringify(state.student));
      renderRadarCharts();
      AMK_AUDIO.playSuccess();
      showToast('🎉 Прогресс синхронизирован: получено +50 SkillPoints!');
    });
  }

  // 9. Digital Passport Modal
  const openPassportBtn = document.getElementById('openPassportBtn');
  const closePassportBtn = document.getElementById('closePassportBtn');
  const passportModal = document.getElementById('passportModal');
  const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');

  if (openPassportBtn && passportModal) {
    openPassportBtn.addEventListener('click', () => {
      passportModal.classList.add('active');
      setTimeout(renderRadarCharts, 60);
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
        AMK_AUDIO.playSuccess();
        showToast('Ссылка на диплом скопирована в буфер обмена!');
      }).catch(() => {
        showToast(`Сертификат ID: ${state.student.id}`);
      });
    });
  }

  // Toast Helper
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
  renderCareerMatches();
});
