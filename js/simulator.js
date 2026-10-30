/* ========================================================
   AMK SKILLHUB: WORKSTATION / SIMULATOR ENGINE (simulator.js)
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Simulator State
  const simState = {
    currentSpec: 'it',
    lang: localStorage.getItem('amk_lang') || 'ru',
    score: 0,
    examTimer: 45 * 60,
    timerInterval: null,
    // Auto module
    auto: {
      selectedNode: 'cyl1',
      multimeterMode: 'ohm',
      coilReplaced: false,
      codesCleared: false,
      rpm: 820
    },
    // Cryo module
    cryo: {
      rpm: 1400,
      txv: 45,
      animId: null
    },
    // Design module
    design: {
      foundFlaws: new Set()
    },
    // Furniture module (07221400)
    furniture: {
      sheetWidth: 2800,
      sheetHeight: 2070,
      kerf: 4.2, // Saw blade width
      generated: false
    }
  };

  // URL Params Check
  const urlParams = new URLSearchParams(window.location.search);
  const specParam = urlParams.get('spec');
  if (specParam && ['it', 'auto', 'cryo', 'design', 'furniture'].includes(specParam)) {
    simState.currentSpec = specParam;
  }

  // Theme & Lang
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('amk_theme', theme);
  };
  const themeToggle = document.getElementById('simThemeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
      AMK_AUDIO.playClick();
    });
  }

  const langToggle = document.getElementById('simLangToggle');
  const langLabel = document.getElementById('simLangLabel');
  const setLanguage = (lang) => {
    simState.lang = lang;
    localStorage.setItem('amk_lang', lang);
    if (langLabel) langLabel.textContent = lang === 'ru' ? 'KZ' : 'RU';
    loadSidebarContent();
    updateTitles();
  };
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      setLanguage(simState.lang === 'ru' ? 'kz' : 'ru');
      AMK_AUDIO.playClick();
    });
  }

  // Specialty Switcher
  const specialtySelect = document.getElementById('specialtySelect');
  if (specialtySelect) {
    specialtySelect.value = simState.currentSpec;
    specialtySelect.addEventListener('change', (e) => {
      switchSpecialty(e.target.value);
      AMK_AUDIO.playClick();
    });
  }

  function switchSpecialty(specKey) {
    simState.currentSpec = specKey;
    if (specialtySelect) specialtySelect.value = specKey;

    document.querySelectorAll('.sim-module').forEach(mod => mod.classList.remove('active'));
    const targetModule = document.getElementById(`module-${specKey}`);
    if (targetModule) targetModule.classList.add('active');

    updateTitles();
    loadSidebarContent();
    resetScore();

    // Trigger canvas initializations
    if (specKey === 'cryo') initCryoCanvas();
    if (specKey === 'furniture') initFurnitureCanvas();
  }

  function updateTitles() {
    const caseData = AMK_DATA.cases[simState.currentSpec];
    if (!caseData) return;
    const isKz = simState.lang === 'kz';
    document.getElementById('currentSpecCode').textContent = caseData.code;
    document.getElementById('currentSpecTitle').textContent = isKz ? caseData.title_kz : caseData.title_ru;
  }

  // Sidebar Tabs
  let activeTab = 'brief';
  document.querySelectorAll('.sidebar-tabs .s-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tabs .s-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.getAttribute('data-tab');
      loadSidebarContent();
      AMK_AUDIO.playClick();
    });
  });

  function loadSidebarContent() {
    const container = document.getElementById('sidebarContent');
    const caseData = AMK_DATA.cases[simState.currentSpec];
    if (!container || !caseData) return;

    const isKz = simState.lang === 'kz';
    if (activeTab === 'brief') {
      container.innerHTML = isKz ? caseData.brief_kz : caseData.brief_ru;
    } else if (activeTab === 'criteria') {
      container.innerHTML = isKz ? caseData.criteria_kz : caseData.criteria_ru;
    } else if (activeTab === 'hints') {
      container.innerHTML = isKz ? caseData.hints_kz : caseData.hints_ru;
    }
  }

  // Timer
  const timerDisplay = document.getElementById('timerDisplay');
  function startTimer() {
    simState.timerInterval = setInterval(() => {
      if (simState.examTimer <= 0) {
        clearInterval(simState.timerInterval);
        AMK_AUDIO.playError();
        alert('Время выполнения демонстрационного экзамена истекло!');
        return;
      }
      simState.examTimer--;
      const mins = String(Math.floor(simState.examTimer / 60)).padStart(2, '0');
      const secs = String(simState.examTimer % 60).padStart(2, '0');
      if (timerDisplay) timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
  }
  startTimer();

  // Universal Verify Button
  const runCheckBtn = document.getElementById('runCheckBtn');
  if (runCheckBtn) {
    runCheckBtn.addEventListener('click', () => {
      AMK_AUDIO.playClick();
      if (simState.currentSpec === 'it') runItTests();
      else if (simState.currentSpec === 'auto') evaluateAuto();
      else if (simState.currentSpec === 'cryo') evaluateCryo();
      else if (simState.currentSpec === 'design') evaluateDesign();
      else if (simState.currentSpec === 'furniture') evaluateFurniture();
    });
  }

  function setScore(score, max = 100) {
    simState.score = score;
    const scoreEl = document.getElementById('currentScore');
    if (scoreEl) scoreEl.textContent = `${score} / ${max}`;

    const saved = JSON.parse(localStorage.getItem('amk_student_data')) || AMK_DATA.student;
    if (score >= 75) {
      saved.skills[simState.currentSpec] = Math.min(100, (saved.skills[simState.currentSpec] || 80) + 5);
      saved.skillPoints += 50;
      localStorage.setItem('amk_student_data', JSON.stringify(saved));
      AMK_AUDIO.playSuccess();
    } else {
      AMK_AUDIO.playError();
    }
  }

  function resetScore() {
    setScore(0);
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = 'Готов к выполнению';
  }

  /* ========================================================
     MODULE 1: IT CODE RUNNER ENGINE
     ======================================================== */
  const codeEditor = document.getElementById('codeEditor');
  const consoleOutput = document.getElementById('consoleOutput');
  const testResultBadge = document.getElementById('testResultBadge');
  const resetCodeBtn = document.getElementById('resetCodeBtn');
  const execTimeBadge = document.getElementById('execTimeBadge');

  if (resetCodeBtn && codeEditor) {
    resetCodeBtn.addEventListener('click', () => {
      codeEditor.value = `function calculateScholarship(gradeAvg, attendanceRate) {
  // Напишите ваш алгоритм:
  if (gradeAvg >= 4.5 && attendanceRate >= 90) {
    return "Повышенная (45 000 ₸)";
  } else if (gradeAvg >= 3.5 && attendanceRate >= 75) {
    return "Обычная (35 000 ₸)";
  } else {
    return "Не назначена (0 ₸)";
  }
}`;
      showToast('Код сброшен к исходному шаблону');
      AMK_AUDIO.playClick();
    });
  }

  function runItTests() {
    const userCode = codeEditor.value;
    consoleOutput.innerHTML = '<span style="color: #94a3b8;">Компиляция JavaScript V8 и запуск тестового стенда...</span>\n\n';
    const startTime = performance.now();

    let fn;
    try {
      const evalWrapper = new Function(`${userCode}; return calculateScholarship;`);
      fn = evalWrapper();
      if (typeof fn !== 'function') throw new Error('Функция calculateScholarship не найдена.');
    } catch (err) {
      testResultBadge.className = 'console-badge';
      testResultBadge.style.color = '#f43f5e';
      testResultBadge.textContent = 'Syntax Error';
      consoleOutput.innerHTML += `<span style="color: #f43f5e;">❌ Ошибка компиляции: ${err.message}</span>`;
      setScore(10);
      return;
    }

    const tests = [
      { args: [4.8, 95], expected: 'Повышенная (45 000 ₸)', desc: 'Отличник (4.8, 95% посещаемости)' },
      { args: [3.9, 80], expected: 'Обычная (35 000 ₸)', desc: 'Хорошист (3.9, 80% посещаемости)' },
      { args: [3.2, 95], expected: 'Не назначена (0 ₸)', desc: 'Троечник при 95% посещаемости' },
      { args: [4.9, 50], expected: 'Не назначена (0 ₸)', desc: 'Отличник с прогулами (50%)' }
    ];

    let passed = 0;
    tests.forEach((t, idx) => {
      try {
        const result = fn(t.args[0], t.args[1]);
        if (result === t.expected) {
          passed++;
          consoleOutput.innerHTML += `<span style="color: #10b981;">✓ Тест #${idx + 1} пройден:</span> ${t.desc} &rarr; "${result}"\n`;
        } else {
          consoleOutput.innerHTML += `<span style="color: #f43f5e;">✗ Тест #${idx + 1} провален:</span> ${t.desc} | Ожидалось: "${t.expected}", Получено: "${result}"\n`;
        }
      } catch (e) {
        consoleOutput.innerHTML += `<span style="color: #f43f5e;">✗ Тест #${idx + 1} вызвал исключение:</span> ${e.message}\n`;
      }
    });

    const elapsed = (performance.now() - startTime).toFixed(1);
    if (execTimeBadge) execTimeBadge.textContent = `${elapsed} ms`;

    const finalScore = Math.round((passed / tests.length) * 100);
    setScore(finalScore);

    if (passed === tests.length) {
      testResultBadge.className = 'console-badge pass';
      testResultBadge.textContent = '100% Все тесты пройдены';
      consoleOutput.innerHTML += `\n<strong style="color: #10b981;">🎉 Все юнит-тесты успешно пройдены! Оценка: 100 баллов.</strong>`;
      showToast('Модуль IT успешно сдан!');
    } else {
      testResultBadge.className = 'console-badge';
      testResultBadge.textContent = `${passed}/${tests.length} тестов`;
      consoleOutput.innerHTML += `\n<strong style="color: #f59e0b;">Пройдено: ${passed} из ${tests.length}. Проверьте граничные условия.</strong>`;
    }
  }

  /* ========================================================
     MODULE 2: AUTO DIAGNOSTICS & INSTRUMENT CLUSTER
     ======================================================== */
  const multimeterVal = document.getElementById('multimeterValue');
  const multimeterUnit = document.getElementById('multimeterUnit');
  const multimeterStatus = document.getElementById('multimeterStatus');
  const clusterRpmNeedle = document.getElementById('clusterRpmNeedle');
  const clusterRpmValue = document.getElementById('clusterRpmValue');
  const warnCheckEngine = document.getElementById('warnCheckEngine');
  const obdDisplay = document.getElementById('obdDisplay');

  // Hotspots click
  document.querySelectorAll('.sensor-node').forEach(node => {
    node.addEventListener('click', () => {
      document.querySelectorAll('.sensor-node').forEach(n => n.classList.remove('selected'));
      node.classList.add('selected');
      simState.auto.selectedNode = node.getAttribute('data-node');
      updateMultimeter();
      AMK_AUDIO.playClick();
    });
  });

  // Multimeter mode buttons
  document.querySelectorAll('.meter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.meter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simState.auto.multimeterMode = btn.getAttribute('data-mode');
      updateMultimeter();
      AMK_AUDIO.playClick();
    });
  });

  function updateMultimeter() {
    const node = simState.auto.selectedNode;
    const mode = simState.auto.multimeterMode;
    multimeterStatus.textContent = `Узел: [${node.toUpperCase()}]`;

    if (mode === 'v') {
      multimeterUnit.textContent = 'V';
      if (node.startsWith('cyl')) multimeterVal.textContent = '13.82';
      else if (node === 'maf') multimeterVal.textContent = '1.04';
      else multimeterVal.textContent = '0.45';
    } else {
      multimeterUnit.textContent = 'Ω';
      if (node === 'cyl1') {
        if (simState.auto.coilReplaced) {
          multimeterVal.textContent = '1.14';
        } else {
          multimeterVal.textContent = 'O.L';
          multimeterStatus.textContent += ' — ОБРЫВ ЦЕПИ КАТУШКИ!';
        }
      } else if (node.startsWith('cyl')) {
        multimeterVal.textContent = '1.16';
      } else if (node === 'maf') {
        multimeterVal.textContent = '2.40';
      } else {
        multimeterVal.textContent = '8.90';
      }
    }
  }

  // Update virtual cluster tachometer
  function updateCluster() {
    if (clusterRpmValue) clusterRpmValue.textContent = simState.auto.rpm;
    if (clusterRpmNeedle) {
      // 0 RPM = -120deg, 6000 RPM = 120deg
      const angle = -120 + (simState.auto.rpm / 6000) * 240;
      clusterRpmNeedle.style.transform = `rotate(${angle}deg)`;
    }
  }
  updateCluster();

  const obdReadBtn = document.getElementById('obdReadBtn');
  const obdReplaceCoilBtn = document.getElementById('obdReplaceCoilBtn');
  const obdClearBtn = document.getElementById('obdClearBtn');

  if (obdReadBtn) {
    obdReadBtn.addEventListener('click', () => {
      AMK_AUDIO.playClick();
      if (simState.auto.codesCleared) {
        obdDisplay.innerHTML = `
          <p class="obd-line" style="color: #10b981;">[CAN-BUS]: ОШИБОК НЕ ОБНАРУЖЕНО</p>
          <p class="obd-line">Обороты холостого хода: 750 об/мин (стабильно)</p>
          <p class="obd-line">Углы опережения зажигания: 8.5° BTDC</p>
        `;
      } else {
        obdDisplay.innerHTML = `
          <p class="obd-line red">ОШИБКА: P0301 — Пропуск зажигания в цилиндре 1</p>
          <p class="obd-line">Статус: Постоянный обрыв первичной цепи катушки</p>
          <p class="obd-line yellow">Рекомендация: Проверить сопротивление катушки 1 (норма: 1.1 Ом).</p>
        `;
      }
      showToast('Коды ЭБУ считаны');
    });
  }

  if (obdReplaceCoilBtn) {
    obdReplaceCoilBtn.addEventListener('click', () => {
      simState.auto.coilReplaced = true;
      updateMultimeter();
      obdDisplay.innerHTML += `\n<p class="obd-line" style="color: #06b6d4;">🛠 Катушка зажигания цилиндра 1 заменена на исправную.</p>`;
      showToast('Катушка 1 заменена. Сбросьте ошибки ЭБУ.');
      AMK_AUDIO.playClick();
    });
  }

  if (obdClearBtn) {
    obdClearBtn.addEventListener('click', () => {
      if (!simState.auto.coilReplaced) {
        obdDisplay.innerHTML += `\n<p class="obd-line red">Сброс отклонен: обрыв катушки 1 не устранен!</p>`;
        showToast('Сначала замените поврежденную катушку!');
        AMK_AUDIO.playError();
      } else {
        simState.auto.codesCleared = true;
        simState.auto.rpm = 750;
        updateCluster();
        if (warnCheckEngine) {
          warnCheckEngine.classList.remove('active');
          warnCheckEngine.classList.add('fixed');
        }
        obdDisplay.innerHTML = `
          <p class="obd-line" style="color: #10b981;">[ЭБУ ОЧИЩЕН]: Check Engine погашен.</p>
          <p class="obd-line" style="color: #10b981;">Двигатель работает ровно. Все цилиндры активны.</p>
        `;
        setScore(100);
        showToast('Диагностика и ремонт завершены на 100 баллов!');
      }
    });
  }

  function evaluateAuto() {
    if (simState.auto.coilReplaced && simState.auto.codesCleared) {
      setScore(100);
      showToast('Кейс «Автодиагностика» полностью решен!');
    } else {
      setScore(45);
      showToast('Диагностика не завершена. Замените деталь и сбросьте память ЭБУ.');
    }
  }

  /* ========================================================
     MODULE 3: CRYO / REFRIGERATION ANIMATED SCHEMATIC
     ======================================================== */
  const compRpmSlider = document.getElementById('compRpmSlider');
  const compRpmVal = document.getElementById('compRpmVal');
  const txvSlider = document.getElementById('txvSlider');
  const txvVal = document.getElementById('txvVal');

  const hpGauge = document.getElementById('hpGauge');
  const lpGauge = document.getElementById('lpGauge');
  const copValue = document.getElementById('copValue');
  const compAmp = document.getElementById('compAmp');
  const condTemp = document.getElementById('condTemp');
  const evapTemp = document.getElementById('evapTemp');

  function updateCryoThermodynamics() {
    const rpm = parseInt(compRpmSlider.value, 10);
    const txv = parseInt(txvSlider.value, 10);

    compRpmVal.textContent = rpm;
    txvVal.textContent = txv;

    // Thermodynamic Math for R134a
    const hp = (10 + (rpm / 350) + (txv * 0.04)).toFixed(1);
    const lp = (1.2 + (txv * 0.028) - (rpm * 0.0004)).toFixed(1);
    const amp = (2.2 + (rpm / 600)).toFixed(1);

    if (compAmp) compAmp.textContent = `${amp} A`;
    const tCond = Math.round(25 + hp * 1.3);
    const tEvap = Math.round(-25 + lp * 7);

    if (condTemp) condTemp.textContent = `+${tCond} °C`;
    if (evapTemp) evapTemp.textContent = `${tEvap} °C`;

    if (hpGauge) hpGauge.textContent = `${hp} bar`;
    if (lpGauge) lpGauge.textContent = `${lp} bar`;

    const cop = (3.85 - Math.abs(hp - 14.0) * 0.22 - Math.abs(lp - 2.1) * 0.35).toFixed(2);
    if (copValue) copValue.textContent = Math.max(1.8, cop);

    simState.cryo.hp = parseFloat(hp);
    simState.cryo.lp = parseFloat(lp);
    simState.cryo.cop = parseFloat(cop);
  }

  if (compRpmSlider && txvSlider) {
    compRpmSlider.addEventListener('input', updateCryoThermodynamics);
    txvSlider.addEventListener('input', updateCryoThermodynamics);
    updateCryoThermodynamics();
  }

  // Cryo Animated Canvas Particle Flow
  function initCryoCanvas() {
    const canvas = document.getElementById('cryoCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        t: Math.random(),
        speed: 0.003 + Math.random() * 0.002
      });
    }

    function renderLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Draw Piping Loop
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(40, 40, w - 80, h - 80, 20);
      ctx.stroke();

      // Animate flowing refrigerant particles
      particles.forEach(p => {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;

        let x, y;
        const perimeter = 2 * (w - 80 + h - 80);
        const dist = p.t * perimeter;

        const topLen = w - 80;
        const rightLen = h - 80;
        const botLen = w - 80;

        let isHot = true;
        if (dist < topLen) {
          x = 40 + dist;
          y = 40;
          isHot = true; // High pressure gas (Hot red)
        } else if (dist < topLen + rightLen) {
          x = w - 40;
          y = 40 + (dist - topLen);
          isHot = true;
        } else if (dist < topLen + rightLen + botLen) {
          x = w - 40 - (dist - topLen - rightLen);
          y = h - 40;
          isHot = false; // Low pressure liquid (Cold cyan)
        } else {
          x = 40;
          y = h - 40 - (dist - topLen - rightLen - botLen);
          isHot = false;
        }

        ctx.fillStyle = isHot ? '#f43f5e' : '#06b6d4';
        ctx.shadowColor = isHot ? '#f43f5e' : '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      simState.cryo.animId = requestAnimationFrame(renderLoop);
    }

    if (simState.cryo.animId) cancelAnimationFrame(simState.cryo.animId);
    renderLoop();
  }

  function evaluateCryo() {
    updateCryoThermodynamics();
    const hpOk = simState.cryo.hp >= 13.0 && simState.cryo.hp <= 15.0;
    const lpOk = simState.cryo.lp >= 2.0 && simState.cryo.lp <= 2.3;

    if (hpOk && lpOk) {
      setScore(100);
      showToast('Идеальная настройка холодильного контура! 100 баллов.');
    } else {
      let partial = 45;
      if (hpOk) partial += 25;
      if (lpOk) partial += 25;
      setScore(partial);
      showToast(`Параметры не в норме. Текущие баллы: ${partial}/100`);
    }
  }

  /* ========================================================
     MODULE 4: FIGMA-STYLE DESIGN AUDIT
     ======================================================== */
  const bugsFoundCount = document.getElementById('bugsFoundCount');
  const flawDescriptions = {
    '1': 'Ошибка #1: Логотип растянут и деформирован (нарушение брендбука).',
    '2': 'Ошибка #2: Нечитаемый заголовок (коэффициент контрастности 1.2:1 < WCAG AA 4.5:1).',
    '3': 'Ошибка #3: Неуместный шуточный шрифт Comic Sans.',
    '4': 'Ошибка #4: Сломанная кнопка CTA (отсутствие отступов padding).'
  };

  document.querySelectorAll('.mock-flaw').forEach(flaw => {
    flaw.addEventListener('click', () => {
      const flawId = flaw.getAttribute('data-flaw');
      if (!simState.design.foundFlaws.has(flawId)) {
        simState.design.foundFlaws.add(flawId);
        flaw.classList.add('found');
        if (bugsFoundCount) bugsFoundCount.textContent = simState.design.foundFlaws.size;
        showToast(`Найдена ошибка ${simState.design.foundFlaws.size} из 4!`);
        AMK_AUDIO.playSuccess();

        const currentScore = simState.design.foundFlaws.size * 25;
        setScore(currentScore);
      }
    });
  });

  function evaluateDesign() {
    const found = simState.design.foundFlaws.size;
    const finalScore = found * 25;
    setScore(finalScore);
    if (found === 4) {
      showToast('Все 4 дефекта дизайна найдены! 100 баллов.');
    } else {
      showToast(`Найдено ошибок: ${found} из 4. Изучите холст.`);
    }
  }

  /* ========================================================
     MODULE 5: FURNITURE SHEET CUTTING ENGINE (07221400)
     ======================================================== */
  function initFurnitureCanvas() {
    const canvas = document.getElementById('sheetCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 620;
    canvas.height = 460;

    // Draw raw full-size MDF board
    ctx.fillStyle = '#1c2438';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Initial label
    ctx.fillStyle = '#64748b';
    ctx.font = '14px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('Полноформатная плита ЛДСП 2800 × 2070 × 16 мм', canvas.width / 2, canvas.height / 2);
  }

  const runCutBtn = document.getElementById('runCutBtn');
  if (runCutBtn) {
    runCutBtn.addEventListener('click', () => {
      generateFurnitureCut();
      AMK_AUDIO.playSuccess();
    });
  }

  function generateFurnitureCut() {
    const canvas = document.getElementById('sheetCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cabinet Panels to place
    const panels = [
      { name: 'Боковина 1 (720×560)', x: 10, y: 10, w: 180, h: 230, color: '#6366f1' },
      { name: 'Боковина 2 (720×560)', x: 200, y: 10, w: 180, h: 230, color: '#6366f1' },
      { name: 'Дно (568×560)', x: 390, y: 10, w: 150, h: 230, color: '#06b6d4' },
      { name: 'Верх (568×560)', x: 10, y: 250, w: 150, h: 190, color: '#06b6d4' },
      { name: 'Полка (568×540)', x: 170, y: 250, w: 150, h: 190, color: '#10b981' },
      { name: 'Фасад 1 (716×296)', x: 330, y: 250, w: 110, h: 190, color: '#f59e0b' },
      { name: 'Фасад 2 (716×296)', x: 450, y: 250, w: 110, h: 190, color: '#f59e0b' }
    ];

    panels.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, p.x + p.w / 2, p.y + p.h / 2);
    });

    // Cutting Blade Paths (Saw Kerf 4.2mm)
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, 245);
    ctx.lineTo(canvas.width, 245);
    ctx.moveTo(195, 0);
    ctx.lineTo(195, 245);
    ctx.moveTo(385, 0);
    ctx.lineTo(385, 245);
    ctx.stroke();
    ctx.setLineDash([]);

    simState.furniture.generated = true;
    document.getElementById('cutWasteVal').textContent = '8.4%';
    document.getElementById('cutLengthVal').textContent = '14.8 м';
    document.getElementById('cutCostVal').textContent = '24 800 ₸';
    setScore(100);
    showToast('Карта раскроя ЛДСП построена с отходом всего 8.4%! 100 баллов.');
  }

  function evaluateFurniture() {
    if (simState.furniture.generated) {
      setScore(100);
      showToast('Модуль «Производство мебели» сдан на 100 баллов!');
    } else {
      setScore(30);
      showToast('Нажмите «Сгенерировать карту раскроя» для расчета.');
    }
  }

  // Toast Helper
  function showToast(msg) {
    const toast = document.getElementById('simToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // Initial Boot
  switchSpecialty(simState.currentSpec);
  setLanguage(simState.lang);
});
