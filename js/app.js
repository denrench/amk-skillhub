/* ========================================================
   AMK SKILLHUB: GOOGLE STITCH CONTROLLER (app.js)
   Google Sans, Material Symbols, Obsidian Dark Canvas & SQLite3 Sync
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    theme: localStorage.getItem('amk_theme') || 'dark',
    lang: localStorage.getItem('amk_lang') || 'ru',
    activeCategory: 'all',
    salary: 450000,
    currentUser: null,
    soundEnabled: localStorage.getItem('amk_sound') !== 'false'
  };

  // 1. Theme Management
  const themeToggle = document.getElementById('themeToggle');
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('amk_theme', theme);
    state.theme = theme;
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      if (window.soundEngine && state.soundEnabled) window.soundEngine.playClick();
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      showToast(state.theme === 'dark' ? 'Включена темная тема' : 'Включена светлая тема');
    });
  }
  applyTheme(state.theme);

  // 2. Sound Toggle
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  if (soundToggleBtn && soundIcon) {
    soundIcon.textContent = state.soundEnabled ? 'volume_up' : 'volume_off';
    soundToggleBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('amk_sound', state.soundEnabled);
      soundIcon.textContent = state.soundEnabled ? 'volume_up' : 'volume_off';
      if (state.soundEnabled && window.soundEngine) window.soundEngine.playSuccess();
      showToast(state.soundEnabled ? 'Звуковые эффекты включены' : 'Звук отключен');
    });
  }

  // 3. Live Backend Health Status Ping
  function checkBackendHealth() {
    const pill = document.getElementById('backendStatusPill');
    if (!pill) return;

    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'online') {
          pill.className = 'api-status-pill';
          pill.innerHTML = `
            <span class="pulse-dot"></span>
            <span>SQLite3 Онлайн (${data.tasks_total || 50} задач)</span>
          `;
          pill.title = `Сервер АМК Онлайн • ${data.design_system || 'Google Stitch'}`;
        } else {
          pill.className = 'api-status-pill offline';
          pill.innerHTML = `<span>●</span> <span>Оффлайн</span>`;
        }
      })
      .catch(() => {
        pill.className = 'api-status-pill offline';
        pill.innerHTML = `<span>●</span> <span>Оффлайн режим</span>`;
        pill.title = 'Сервер Python Flask не запущен. Для полной функциональности запустите server.py';
      });
  }
  checkBackendHealth();
  setInterval(checkBackendHealth, 30000);

  // 4. Specialties Filtering & Rendering
  const filterButtons = document.querySelectorAll('.tab-filter');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.soundEngine && state.soundEnabled) window.soundEngine.playClick();
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
      const tasks = (AMK_DATA.tasks && AMK_DATA.tasks[s.slug]) ? AMK_DATA.tasks[s.slug] : [];
      const sampleTasks = tasks.slice(0, 3);

      const previewHtml = sampleTasks.map(t => `
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; padding: 6px 10px; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 4px;">
          <span style="color: #e2e8f0;"><strong style="color: #60a5fa;">#${t.num}</strong> ${t.title}</span>
          <span class="badge ${t.diff === 'Hard' ? 'badge-red' : (t.diff === 'Medium' ? 'badge-amber' : 'badge-green')}" style="padding: 2px 6px; font-size: 0.7rem;">${t.diff}</span>
        </div>
      `).join('');

      return `
        <div class="spec-card">
          <div>
            <div class="spec-card-top">
              <div class="spec-icon-box" style="background: ${s.color}15; border-color: ${s.color}40; color: ${s.color};">
                <span class="material-symbols-outlined" style="font-size: 26px;">${s.material_icon || 'terminal'}</span>
              </div>
              <span class="spec-code-chip">${s.code}</span>
            </div>

            <h3 class="spec-title" style="margin-top: 14px;">${title}</h3>
            <p class="spec-desc">${desc}</p>

            <div style="margin: 16px 0;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px;">
                Практические модули (10 кейсов):
              </span>
              ${previewHtml}
            </div>

            <div class="spec-tags">
              ${(s.tags || []).map(t => `<span class="spec-tag">${t}</span>`).join('')}
            </div>
          </div>

          <div class="spec-bottom">
            <span class="spec-tasks-badge">
              <span class="material-symbols-outlined" style="font-size: 18px;">task_alt</span>
              <span>10 заданий с автопроверкой</span>
            </span>
            <a href="simulator.html?spec=${s.slug}" class="btn btn-primary" style="padding: 6px 16px; font-size: 0.82rem;">
              <span>Открыть тренажер</span>
              <span class="material-symbols-outlined" style="font-size: 16px;">arrow_forward</span>
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  // 5. Reactive Salary Income Calculator
  const salarySlider = document.getElementById('salarySlider');
  const salaryDisplay = document.getElementById('salaryDisplay');
  const salaryLevelTag = document.getElementById('salaryLevelTag');

  function renderCareers(targetSalary) {
    if (salaryDisplay) {
      salaryDisplay.innerHTML = `${targetSalary.toLocaleString('ru-RU')} ₸ <small style="font-size: 1.1rem; color: var(--text-muted);">/ мес</small>`;
    }

    if (salaryLevelTag) {
      if (targetSalary >= 800000) {
        salaryLevelTag.textContent = 'Ведущий инженер / Тимлид направления';
        salaryLevelTag.style.color = 'var(--google-green)';
      } else if (targetSalary >= 600000) {
        salaryLevelTag.textContent = 'Старший мастер / Старший разработчик';
        salaryLevelTag.style.color = '#60a5fa';
      } else if (targetSalary >= 400000) {
        salaryLevelTag.textContent = 'Квалифицированный специалист (Middle)';
        salaryLevelTag.style.color = 'var(--google-yellow)';
      } else {
        salaryLevelTag.textContent = 'Начинающий техник / Младший специалист';
        salaryLevelTag.style.color = '#94a3b8';
      }
    }

    const grid = document.getElementById('careerGrid');
    if (!grid) return;

    const careers = AMK_DATA.careers || [];
    grid.innerHTML = careers.map(c => {
      const minS = c.baseSalary || 250000;
      const maxS = c.maxSalary || 950000;
      const ratio = Math.max(0, Math.min(1, (targetSalary - 250000) / 700000));
      const calculatedSalary = Math.round((minS + (maxS - minS) * ratio) / 5000) * 5000;

      let levelBadge = 'Специалист';
      let badgeClass = 'badge-blue';
      if (calculatedSalary >= 700000) {
        levelBadge = 'Ведущий мастер / Тимлид';
        badgeClass = 'badge-green';
      } else if (calculatedSalary <= 320000) {
        levelBadge = 'Начинающий техник';
        badgeClass = 'badge-amber';
      }

      return `
        <div class="spec-card" style="padding: 22px;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <span class="spec-code-chip">${c.specialty}</span>
              <span class="badge ${badgeClass}">${levelBadge}</span>
            </div>
            <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 10px;">${c.role}</h4>
            
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; margin: 12px 0;">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Прогнозный доход выпускника:</span>
              <span style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #4ade80;">
                ${calculatedSalary.toLocaleString('ru-RU')} ₸
              </span>
            </div>

            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 8px;">
              <strong style="color: #e2e8f0;">Работодатели в Алматы:</strong> ${c.companies}
            </div>
          </div>

          <div style="padding-top: 12px; border-top: 1px solid var(--border-color); font-size: 0.78rem; color: var(--text-muted);">
            Ключевые навыки: <span style="color: #93c5fd;">${c.skills}</span>
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
          if (window.soundEngine && state.soundEnabled) window.soundEngine.playClick();
          if (user.role === 'teacher') {
            window.location.href = 'teacher.html';
          } else {
            openStudentDiplomaModal(user);
          }
        };
      }

      updateDiplomaModalData(user);

      // Fetch student profile from backend SQLite3
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
        if (window.soundEngine && state.soundEnabled) window.soundEngine.playClick();
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
    if (diplomaModal) diplomaModal.style.display = 'flex';
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
    if (certId) certId.textContent = u.student_id ? `Билет: ${u.student_id}` : 'KZ-AMK-2026-98421';

    if (certAvatar && u.full_name) {
      const parts = u.full_name.split(' ');
      certAvatar.textContent = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }
  }

  if (openDiplomaBtn) {
    openDiplomaBtn.addEventListener('click', () => {
      if (window.soundEngine && state.soundEnabled) window.soundEngine.playClick();
      openStudentDiplomaModal();
    });
  }

  if (closeDiplomaBtn) {
    closeDiplomaBtn.addEventListener('click', () => {
      if (diplomaModal) diplomaModal.style.display = 'none';
    });
  }

  if (diplomaModal) {
    diplomaModal.addEventListener('click', (e) => {
      if (e.target === diplomaModal) diplomaModal.style.display = 'none';
    });
  }

  // 8. Toast Helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : (type === 'error' ? 'toast-error' : '')}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 18px; color: ${type === 'error' ? 'var(--google-red)' : '#60a5fa'};">
        ${type === 'error' ? 'error' : (type === 'success' ? 'check_circle' : 'info')}
      </span>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }
  window.showToast = showToast;

  // Initialize
  renderSpecialties();
  renderCareers(state.salary);
  checkAuthState();
});
