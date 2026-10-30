/* ========================================================
   AMK SKILLHUB: WORKSTATION / SIMULATOR ENGINE (simulator.js)
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // State
  const simState = {
    currentSpec: 'it',
    lang: localStorage.getItem('amk_lang') || 'ru',
    score: 0,
    examTimer: 45 * 60, // 45 minutes
    timerInterval: null,
    // Auto Module State
    auto: {
      selectedNode: 'cyl1',
      multimeterMode: 'ohm', // 'v' or 'ohm'
      coilReplaced: false,
      codesCleared: false
    },
    // Cryo Module State
    cryo: {
      rpm: 1400,
      txv: 45
    },
    // Design Module State
    design: {
      foundFlaws: new Set()
    }
  };

  // URL Params Check (e.g. ?spec=auto or ?mode=exam)
  const urlParams = new URLSearchParams(window.location.search);
  const specParam = urlParams.get('spec');
  if (specParam && ['it', 'auto', 'cryo', 'design'].includes(specParam)) {
    simState.currentSpec = specParam;
  }
  const isExamMode = urlParams.get('mode') === 'exam';

  // 1. Theme and Lang Toggle
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('amk_theme', theme);
  };
  const themeToggle = document.getElementById('simThemeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
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
    });
  }

  // 2. Specialty Selector
  const specialtySelect = document.getElementById('specialtySelect');
  if (specialtySelect) {
    specialtySelect.value = simState.currentSpec;
    specialtySelect.addEventListener('change', (e) => {
      switchSpecialty(e.target.value);
    });
  }

  function switchSpecialty(specKey) {
    simState.currentSpec = specKey;
    if (specialtySelect) specialtySelect.value = specKey;

    // Toggle modules
    document.querySelectorAll('.sim-module').forEach(mod => mod.classList.remove('active'));
    const targetModule = document.getElementById(`module-${specKey}`);
    if (targetModule) targetModule.classList.add('active');

    updateTitles();
    loadSidebarContent();
    resetScore();
  }

  function updateTitles() {
    const caseData = AMK_DATA.cases[simState.currentSpec];
    if (!caseData) return;
    const isKz = simState.lang === 'kz';
    document.getElementById('currentSpecCode').textContent = caseData.code;
    document.getElementById('currentSpecTitle').textContent = isKz ? caseData.title_kz : caseData.title_ru;
  }

  // 3. Sidebar Tabs & Content
  let activeTab = 'brief';
  document.querySelectorAll('.sidebar-tabs .s-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tabs .s-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.getAttribute('data-tab');
      loadSidebarContent();
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

  // 4. Timer Logic
  const timerDisplay = document.getElementById('timerDisplay');
  function startTimer() {
    simState.timerInterval = setInterval(() => {
      if (simState.examTimer <= 0) {
        clearInterval(simState.timerInterval);
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

  // 5. Universal Check Solution Button
  const runCheckBtn = document.getElementById('runCheckBtn');
  if (runCheckBtn) {
    runCheckBtn.addEventListener('click', () => {
      if (simState.currentSpec === 'it') {
        runItTests();
      } else if (simState.currentSpec === 'auto') {
        evaluateAuto();
      } else if (simState.currentSpec === 'cryo') {
        evaluateCryo();
      } else if (simState.currentSpec === 'design') {
        evaluateDesign();
      }
    });
  }

  function setScore(score, max = 100) {
    simState.score = score;
    const scoreEl = document.getElementById('currentScore');
    if (scoreEl) scoreEl.textContent = `${score} / ${max}`;

    // Update student progress in localStorage
    const saved = JSON.parse(localStorage.getItem('amk_student_data')) || AMK_DATA.student;
    if (score >= 80) {
      saved.skills[simState.currentSpec] = Math.min(100, (saved.skills[simState.currentSpec] || 80) + 5);
      saved.skillPoints += 50;
      localStorage.setItem('amk_student_data', JSON.stringify(saved));
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

  if (resetCodeBtn && codeEditor) {
    resetCodeBtn.addEventListener('click', () => {
      codeEditor.value = `function calculateScholarship(gradeAvg, attendanceRate) {
  // Напишите ваш код:
  if (gradeAvg >= 4.5 && attendanceRate >= 90) {
    return "Повышенная (45 000 ₸)";
  } else if (gradeAvg >= 3.5 && attendanceRate >= 75) {
    return "Обычная (35 000 ₸)";
  } else {
    return "Не назначена (0 ₸)";
  }
}`;
      showToast('Код сброшен к исходному шаблону');
    });
  }

  function runItTests() {
    const userCode = codeEditor.value;
    consoleOutput.innerHTML = '<span style="color: #94a3b8;">Компиляция и запуск юнит-тестов...</span>\n\n';

    let fn;
    try {
      // Safely evaluate function definition
      const evalWrapper = new Function(`${userCode}; return calculateScholarship;`);
      fn = evalWrapper();
      if (typeof fn !== 'function') {
        throw new Error('Функция calculateScholarship не найдена.');
      }
    } catch (err) {
      testResultBadge.className = 'console-badge';
      testResultBadge.style.color = '#f43f5e';
      testResultBadge.textContent = 'Ошибка синтаксиса';
      consoleOutput.innerHTML += `<span style="color: #f43f5e;">❌ Ошибка: ${err.message}</span>`;
      setScore(10);
      return;
    }

    // Test Cases
    const tests = [
      { args: [4.8, 95], expected: 'Повышенная (45 000 ₸)', desc: 'Отличник (4.8, 95% посещаемости)' },
      { args: [3.9, 80], expected: 'Обычная (35 000 ₸)', desc: 'Хорошист (3.9, 80% посещаемости)' },
      { args: [3.2, 95], expected: 'Не назначена (0 ₸)', desc: 'Троечник при высокой посещаемости (3.2, 95%)' },
      { args: [4.9, 50], expected: 'Не назначена (0 ₸)', desc: 'Отличник с прогулами (4.9, 50%)' }
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

    const calculatedScore = Math.round((passed / tests.length) * 100);
    setScore(calculatedScore);

    if (passed === tests.length) {
      testResultBadge.className = 'console-badge pass';
      testResultBadge.textContent = '100% Все тесты пройдены';
      consoleOutput.innerHTML += `\n<strong style="color: #10b981;">🎉 Отлично! Кейс защищен на ${calculatedScore} баллов.</strong>`;
      showToast('Модуль IT успешно сдан!');
    } else {
      testResultBadge.className = 'console-badge';
      testResultBadge.textContent = `${passed}/${tests.length} тестов`;
      consoleOutput.innerHTML += `\n<strong style="color: #f59e0b;">Пройдено тестов: ${passed} из ${tests.length}. Исправьте условия.</strong>`;
    }
  }

  /* ========================================================
     MODULE 2: AUTO DIAGNOSTIC ENGINE
     ======================================================== */
  const multimeterVal = document.getElementById('multimeterValue');
  const multimeterUnit = document.getElementById('multimeterUnit');
  const multimeterStatus = document.getElementById('multimeterStatus');
  const engineStatusBadge = document.getElementById('engineStatusBadge');
  const obdDisplay = document.getElementById('obdDisplay');

  // Hotspots click
  document.querySelectorAll('.sensor-node').forEach(node => {
    node.addEventListener('click', () => {
      document.querySelectorAll('.sensor-node').forEach(n => n.classList.remove('selected'));
      node.classList.add('selected');
      simState.auto.selectedNode = node.getAttribute('data-node');
      updateMultimeter();
    });
  });

  // Multimeter mode buttons
  document.querySelectorAll('.meter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.meter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simState.auto.multimeterMode = btn.getAttribute('data-mode');
      updateMultimeter();
    });
  });

  function updateMultimeter() {
    const node = simState.auto.selectedNode;
    const mode = simState.auto.multimeterMode;
    multimeterStatus.textContent = `Узел: [${node.toUpperCase()}]`;

    if (mode === 'v') {
      multimeterUnit.textContent = 'V';
      if (node.startsWith('cyl')) {
        multimeterVal.textContent = '13.82';
      } else if (node === 'maf') {
        multimeterVal.textContent = '1.02';
      } else {
        multimeterVal.textContent = '0.45';
      }
    } else {
      // Resistance Mode (Ohm)
      multimeterUnit.textContent = 'Ω';
      if (node === 'cyl1') {
        if (simState.auto.coilReplaced) {
          multimeterVal.textContent = '1.15'; // Repaired!
        } else {
          multimeterVal.textContent = 'O.L'; // Open Loop (Broken coil!)
          multimeterStatus.textContent += ' — ОБРЫВ ЦЕПИ КАТУШКИ!';
        }
      } else if (node.startsWith('cyl')) {
        multimeterVal.textContent = '1.18'; // Normal coil
      } else if (node === 'maf') {
        multimeterVal.textContent = '2.40';
      } else {
        multimeterVal.textContent = '8.90';
      }
    }
  }

  // OBD Buttons
  const obdReadBtn = document.getElementById('obdReadBtn');
  const obdReplaceCoilBtn = document.getElementById('obdReplaceCoilBtn');
  const obdClearBtn = document.getElementById('obdClearBtn');

  if (obdReadBtn) {
    obdReadBtn.addEventListener('click', () => {
      if (simState.auto.codesCleared) {
        obdDisplay.innerHTML = `
          <p class="obd-line" style="color: #10b981;">ОШИБОК НЕ ОБНАРУЖЕНО [DTC: 0]</p>
          <p class="obd-line">Обороты: 750 об/мин (стабильно)</p>
          <p class="obd-line">Система зажигания: ВСЕ ЦИЛИНДРЫ В НОРМЕ</p>
        `;
      } else {
        obdDisplay.innerHTML = `
          <p class="obd-line red">ОШИБКА: P0301 — Пропуск зажигания в цилиндре 1</p>
          <p class="obd-line">Статус: Постоянная неисправность первичной цепи</p>
          <p class="obd-line yellow">Рекомендация: Проверить катушку мультиметром на обрыв.</p>
        `;
      }
      showToast('Коды ЭБУ считаны');
    });
  }

  if (obdReplaceCoilBtn) {
    obdReplaceCoilBtn.addEventListener('click', () => {
      simState.auto.coilReplaced = true;
      updateMultimeter();
      obdDisplay.innerHTML += `\n<p class="obd-line" style="color: #06b6d4;">🛠 Установлена новая оригинальная катушка зажигания цилиндра 1.</p>`;
      showToast('Катушка 1 заменена. Теперь сбросьте ошибки ЭБУ.');
    });
  }

  if (obdClearBtn) {
    obdClearBtn.addEventListener('click', () => {
      if (!simState.auto.coilReplaced) {
        obdDisplay.innerHTML += `\n<p class="obd-line red">Ошибка не сброшена: физическая неисправность катушки 1 не устранена!</p>`;
        showToast('Сначала устраните обрыв катушки!');
      } else {
        simState.auto.codesCleared = true;
        engineStatusBadge.className = 'engine-state-badge ok';
        engineStatusBadge.textContent = '✓ ДВС в норме (Check Engine выключен)';
        obdDisplay.innerHTML = `
          <p class="obd-line" style="color: #10b981;">Память ЭБУ очищена.</p>
          <p class="obd-line" style="color: #10b981;">Check Engine погашен. Двигатель работает ровно.</p>
        `;
        setScore(100);
        showToast('Неисправность успешно устранена! 100 баллов.');
      }
    });
  }

  function evaluateAuto() {
    if (simState.auto.coilReplaced && simState.auto.codesCleared) {
      setScore(100);
      showToast('Кейс «Автодиагностика» полностью решен!');
    } else {
      setScore(40);
      showToast('Диагностика не завершена. Проверьте замену детали и сброс ЭБУ.');
    }
  }

  /* ========================================================
     MODULE 3: CRYO / REFRIGERATION ENGINE
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
  const txvOpening = document.getElementById('txvOpening');

  function updateCryoThermodynamics() {
    const rpm = parseInt(compRpmSlider.value, 10);
    const txv = parseInt(txvSlider.value, 10);

    compRpmVal.textContent = rpm;
    txvVal.textContent = txv;
    if (txvOpening) txvOpening.textContent = `${txv}%`;

    // Thermodynamic Math Model for R134a
    // High Pressure depends mainly on RPM / Condenser load
    const hp = (10 + (rpm / 350) + (txv * 0.04)).toFixed(1);
    // Low pressure depends mainly on TXV expansion and inversely on RPM
    const lp = (1.2 + (txv * 0.028) - (rpm * 0.0004)).toFixed(1);

    // Amperage
    const amp = (2.2 + (rpm / 600)).toFixed(1);
    if (compAmp) compAmp.textContent = `${amp} A`;

    // Temperatures
    const tCond = Math.round(25 + hp * 1.3);
    const tEvap = Math.round(-25 + lp * 7);
    if (condTemp) condTemp.textContent = `+${tCond} °C`;
    if (evapTemp) evapTemp.textContent = `${tEvap} °C`;

    // Gauges display
    if (hpGauge) hpGauge.textContent = `${hp} bar`;
    if (lpGauge) lpGauge.textContent = `${lp} bar`;

    // COP calculation
    const cop = (3.8 - Math.abs(hp - 14.0) * 0.2 - Math.abs(lp - 2.1) * 0.3).toFixed(2);
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

  function evaluateCryo() {
    updateCryoThermodynamics();
    const hpOk = simState.cryo.hp >= 13.0 && simState.cryo.hp <= 15.0;
    const lpOk = simState.cryo.lp >= 2.0 && simState.cryo.lp <= 2.3;

    if (hpOk && lpOk) {
      setScore(100);
      showToast('Идеальная настройка холодильного контура! 100 баллов.');
    } else {
      let partial = 40;
      if (hpOk) partial += 30;
      if (lpOk) partial += 30;
      setScore(partial);
      showToast(`Параметры не в оптимальной зоне. Баллы: ${partial}/100`);
    }
  }

  /* ========================================================
     MODULE 4: DESIGN AUDIT ENGINE
     ======================================================== */
  const bugsFoundCount = document.getElementById('bugsFoundCount');
  const designFeedback = document.getElementById('designFeedback');

  const flawDescriptions = {
    '1': 'Ошибка #1 найдена: Логотип растянут и искажен (нарушение пропорций брендбука).',
    '2': 'Ошибка #2 найдена: Критически низкая контрастность текста (нарушение стандартов доступности WCAG).',
    '3': 'Ошибка #3 найдена: Неуместный шуточный шрифт (Comic Sans) в официальном образовательном портале.',
    '4': 'Ошибка #4 найдена: Кнопка CTA сломана: отсутствие внутренних отступов (padding) и кричащий несогласованный стиль.'
  };

  document.querySelectorAll('.mock-flaw').forEach(flaw => {
    flaw.addEventListener('click', () => {
      const flawId = flaw.getAttribute('data-flaw');
      if (!simState.design.foundFlaws.has(flawId)) {
        simState.design.foundFlaws.add(flawId);
        flaw.classList.add('found');
        if (bugsFoundCount) bugsFoundCount.textContent = simState.design.foundFlaws.size;
        if (designFeedback) designFeedback.textContent = flawDescriptions[flawId];
        showToast(`Найдена ошибка ${simState.design.foundFlaws.size} из 4!`);

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
      showToast('Все 4 дефекта дизайна успешно обнаружены! 100 баллов.');
    } else {
      showToast(`Найдено ошибок: ${found} из 4. Ищите дальше на макете.`);
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
