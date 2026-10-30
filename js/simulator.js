/* ========================================================
   AMK SKILLHUB: PROFESSIONAL SIMULATOR WORKSTATION (simulator.js)
   Realistic Engineering Logic, Auto-Sync & Audiovisuals
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    activeSpec: 'it',
    score: 0,
    timerSeconds: 45 * 60,
    timerInterval: null,
    // Auto module
    auto: {
      scanned: false,
      meterTested: false,
      coilReplaced: false,
      cleared: false
    },
    // Cryo module
    cryo: {
      rpm: 1400,
      txv: 45
    },
    // Design
    design: {
      fixedBugs: new Set()
    },
    // Furniture
    furniture: {
      calculated: false
    }
  };

  // 1. User Auth State & Display in Header
  const rawUser = localStorage.getItem('amk_current_user');
  const currentUser = rawUser ? JSON.parse(rawUser) : null;
  const simUserName = document.getElementById('simUserName');
  const simUserGroup = document.getElementById('simUserGroup');
  const simAuthLink = document.getElementById('simAuthLink');
  const syncText = document.getElementById('syncText');

  if (currentUser) {
    if (simUserName) simUserName.textContent = currentUser.full_name;
    if (simUserGroup) simUserGroup.textContent = currentUser.role === 'teacher' ? 'Преподаватель' : (currentUser.group_name || 'Студент');
    if (simAuthLink) simAuthLink.style.display = 'none';
  } else {
    if (simUserName) simUserName.textContent = 'Гостевой режим';
    if (simUserGroup) simUserGroup.textContent = '(демо-сдача)';
    if (simAuthLink) simAuthLink.style.display = 'inline-flex';
  }

  // Sound Toggle Button
  const btnSoundToggle = document.getElementById('btnSoundToggle');
  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      if (window.soundEngine) {
        const unmuted = window.soundEngine.toggleMute();
        btnSoundToggle.textContent = unmuted ? '🔊' : '🔇';
        btnSoundToggle.title = unmuted ? 'Звук включен' : 'Звук выключен';
        if (unmuted) window.soundEngine.playClick();
      }
    });
  }

  // 2. Timer Countdown
  const timerDisplay = document.getElementById('timerDisplay');
  function startTimer() {
    state.timerInterval = setInterval(() => {
      if (state.timerSeconds > 0) {
        state.timerSeconds--;
        const m = Math.floor(state.timerSeconds / 60).toString().padStart(2, '0');
        const s = (state.timerSeconds % 60).toString().padStart(2, '0');
        if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
      } else {
        clearInterval(state.timerInterval);
        alert('Время, отведенное на практический экзамен, завершилось!');
      }
    }, 1000);
  }
  startTimer();

  // 3. Module Tabs Navigation
  const params = new URLSearchParams(window.location.search);
  const specParam = params.get('spec');
  if (specParam && ['it', 'auto', 'cryo', 'design', 'furniture'].includes(specParam)) {
    state.activeSpec = specParam;
  }

  const modButtons = document.querySelectorAll('.mod-btn');
  modButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      switchModule(btn.getAttribute('data-spec'));
    });
  });

  function switchModule(specKey) {
    state.activeSpec = specKey;
    modButtons.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-spec') === specKey);
    });

    document.querySelectorAll('.stage-module').forEach(m => m.classList.remove('active'));
    const targetStage = document.getElementById(`module-${specKey}`);
    if (targetStage) targetStage.classList.add('active');

    loadInstructions(specKey);
    state.score = 0;
    updateScore(0);

    if (specKey === 'auto') drawOscilloscope();
    if (specKey === 'furniture') drawFurnitureSheet();
  }

  // Detailed Step-by-Step Instructions
  const instructions = {
    it: {
      code: "06130100 — ПРОГРАММНОЕ ОБЕСПЕЧЕНИЕ",
      title: "Начисление академической стипендии",
      steps: [
        {
          num: "Шаг 1",
          title: "Анализ алгоритмической задачи",
          desc: "В деканате АМК автоматизируется начисление выплат. Изучите функцию calculateScholarship в онлайн-редакторе справа."
        },
        {
          num: "Шаг 2",
          title: "Проверка граничных условий",
          desc: "Повышенная: балл >= 4.5 и посещаемость >= 90%. Обычная: балл >= 3.5 и посещаемость >= 75%. Иначе — Не назначена."
        },
        {
          num: "Шаг 3",
          title: "Запуск автоматических юнит-тестов",
          desc: "Нажмите «Запустить автопроверку тестами». Движок протестирует функцию на 4 контрольных выборках и выставит итоговый балл."
        }
      ]
    },
    auto: {
      code: "07161300 — ТО И РЕМОНТ АВТОТРАНСПОРТА",
      title: "Компьютерная диагностика и автоэлектрика",
      steps: [
        {
          num: "Шаг 1",
          title: "Считывание кодов DTC сканером",
          desc: "Горит индикатор Check Engine. Нажмите «1. Считать коды ошибок сканером» для связи с блоком управления по CAN-шине."
        },
        {
          num: "Шаг 2",
          title: "Инструментальный замер мультиметром",
          desc: "Нажмите «2. Замерить сопротивление катушки 1». Норма: 1.1 Ом. При внутреннем обрыве прибор покажет O.L."
        },
        {
          num: "Шаг 3",
          title: "Установка новой детали и сброс ЭБУ",
          desc: "Замените катушку цилиндра 1, затем очистите память ошибок. Осциллограф зафиксирует нормальный импульс зажигания."
        }
      ]
    },
    cryo: {
      code: "07150900 — ХОЛОДИЛЬНЫЕ МАШИНЫ",
      title: "Балансировка термодинамического контура R134a",
      steps: [
        {
          num: "Шаг 1",
          title: "Контроль давления нагнетания и всасывания",
          desc: "Установка охлаждает продуктовый склад в Алматы. Регулируйте обороты компрессора и открытие вентиля ТРВ."
        },
        {
          num: "Шаг 2",
          title: "Вывод в зеленую рабочую зону",
          desc: "Высокое давление (HP) должно быть 13.0 — 15.0 bar, Низкое давление (LP) — 2.0 — 2.3 bar."
        },
        {
          num: "Шаг 3",
          title: "Максимизация коэффициента COP",
          desc: "При попадании обоих параметров в зеленый диапазон энергоэффективность COP превысит 3.20."
        }
      ]
    },
    design: {
      code: "02110300 — ГРАФИЧЕСКИЙ ДИЗАЙН",
      title: "Профессиональный UI/UX аудит макета",
      steps: [
        {
          num: "Шаг 1",
          title: "Поиск ошибок доступности (WCAG 2.1)",
          desc: "Перед вами черновой макет интерфейса колледжа с 4 грубыми нарушениями эргономики и читаемости."
        },
        {
          num: "Шаг 2",
          title: "Интерактивное устранение дефектов",
          desc: "Кликайте прямо по пунктирным рамкам на макете (логотип, заголовок, шрифт, кнопка). Каждое исправление дает +25 баллов."
        },
        {
          num: "Шаг 3",
          title: "Итоговая приемка по стандартам",
          desc: "После устранения всех 4 дефектов макет примет чистый, высококонтрастный премиальный вид."
        }
      ]
    },
    furniture: {
      code: "07221400 — ПРОИЗВОДСТВО МЕБЕЛИ (ЧПУ)",
      title: "Оптимизация карт 2D раскроя ЛДСП",
      steps: [
        {
          num: "Шаг 1",
          title: "Спецификация деталей кухонного гарнитура",
          desc: "Полноформатный лист ЛДСП 2800 × 2070 × 16 мм необходимо раскроить на 7 деталей корпуса с учетом режущего диска 4.2 мм."
        },
        {
          num: "Шаг 2",
          title: "Генерация карты раскроя станка ЧПУ",
          desc: "Нажмите «Рассчитать карту раскроя». Алгоритм минимизирует технологический отход и отобразит визуальную карту распила."
        },
        {
          num: "Шаг 3",
          title: "Экономическая оценка выгоды",
          desc: "Отход составит всего 8.4%, что сохраняет до 20% бюджета материала на мебельной фабрике в Алматы."
        }
      ]
    }
  };

  function loadInstructions(specKey) {
    const data = instructions[specKey];
    if (!data) return;

    const instCode = document.getElementById('instCode');
    const instTitle = document.getElementById('instTitle');
    const scroll = document.getElementById('instScroll');

    if (instCode) instCode.textContent = data.code;
    if (instTitle) instTitle.textContent = data.title;

    if (scroll) {
      scroll.innerHTML = data.steps.map((s, idx) => `
        <div class="step-card" id="stepCard-${idx}">
          <div class="step-card-top">
            <span class="step-num">${s.num}</span>
            <span class="step-status-icon">⚪</span>
          </div>
          <h4>${s.title}</h4>
          <p>${s.desc}</p>
        </div>
      `).join('');
    }
  }

  // 4. Update Score & SQLite3 Sync
  function updateScore(score) {
    state.score = score;
    const badge = document.getElementById('currentScoreBadge');
    if (badge) badge.textContent = `${score} / 100 баллов`;

    // Mark steps completed visually
    if (score >= 25) markStepDone(0);
    if (score >= 50) markStepDone(1);
    if (score >= 100) {
      markStepDone(2);
      if (window.soundEngine) window.soundEngine.playSuccess();
    }

    // 1. Local fallback storage
    const saved = JSON.parse(localStorage.getItem('amk_student_data')) || (window.AMK_DATA ? window.AMK_DATA.student : { skills: {} });
    saved.skills = saved.skills || {};
    saved.skills[state.activeSpec] = Math.max(saved.skills[state.activeSpec] || 0, score);
    localStorage.setItem('amk_student_data', JSON.stringify(saved));

    // 2. SQLite3 Database Sync
    if (score > 0) {
      const studentId = currentUser ? (currentUser.student_id || currentUser.id) : (saved.id || 'KZ-AMK-2026-98421');
      const userId = currentUser ? currentUser.id : null;

      if (syncText) syncText.textContent = 'Синхронизация...';

      fetch('/api/grades/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          student_id: studentId,
          specialty_slug: state.activeSpec,
          specialty_name: instructions[state.activeSpec] ? instructions[state.activeSpec].title : state.activeSpec,
          score: score
        })
      })
      .then(r => r.json())
      .then(d => {
        if (d.success && syncText) {
          syncText.textContent = `БД: ${score} б. сохранено ✓`;
        }
      })
      .catch(() => {
        if (syncText) syncText.textContent = `Сессия: ${score} б. записано`;
      });
    }
  }

  function markStepDone(stepIdx) {
    const card = document.getElementById(`stepCard-${stepIdx}`);
    if (card) {
      card.classList.add('completed');
      const icon = card.querySelector('.step-status-icon');
      if (icon) icon.textContent = '✓';
    }
  }

  // ================= MODULE 1: IT CODE TEST RUNNER =================
  const runCodeBtn = document.getElementById('runCodeBtn');
  const itConsole = document.getElementById('itConsole');
  const codeArea = document.getElementById('codeArea');

  if (runCodeBtn && codeArea) {
    runCodeBtn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      itConsole.textContent = '⚡ Запуск автоматических юнит-тестов...\n\n';

      try {
        const fn = new Function(`${codeArea.value}; return calculateScholarship;`)();
        const tests = [
          { args: [4.8, 95], expected: 'Повышенная (45 000 ₸)', name: 'Студент-отличник (балл 4.8, 95%)' },
          { args: [3.9, 80], expected: 'Обычная (35 000 ₸)', name: 'Студент-хорошист (балл 3.9, 80%)' },
          { args: [3.2, 90], expected: 'Не назначена (0 ₸)', name: 'Удовлетворительно (балл 3.2, 90%)' },
          { args: [4.9, 50], expected: 'Не назначена (0 ₸)', name: 'Высокий балл, но пропуски (4.9, 50%)' }
        ];

        let passed = 0;
        tests.forEach((t, i) => {
          const startTime = performance.now();
          const res = fn(t.args[0], t.args[1]);
          const elapsed = (performance.now() - startTime).toFixed(2);

          if (res === t.expected) {
            passed++;
            itConsole.textContent += `✓ [ТЕСТ #${i+1} PASSED] (${elapsed}ms): ${t.name}\n   Результат: "${res}"\n\n`;
          } else {
            itConsole.textContent += `✗ [ТЕСТ #${i+1} FAILED]: ${t.name}\n   Ожидалось: "${t.expected}"\n   Получено:   "${res}"\n\n`;
          }
        });

        const score = Math.round((passed / tests.length) * 100);
        updateScore(score);
        itConsole.textContent += `═══════════════════════════════════════════════\n`;
        itConsole.textContent += `📊 ИТОГ АВТОПРОВЕРКИ: Сдано ${passed} из ${tests.length} тестов (${score}%)\n`;
        if (score === 100) {
          itConsole.textContent += `🏆 Квалификационный экзамен по ПО успешно сдан на отлично!`;
        }
      } catch (err) {
        if (window.soundEngine) window.soundEngine.playError();
        itConsole.textContent += `❌ СИНТАКСИЧЕСКАЯ ОШИБКА: ${err.message}\nПроверьте расстановку скобок и точек с запятой.`;
        updateScore(15);
      }
    });
  }

  // ================= MODULE 2: AUTO DIAGNOSTICS =================
  const autoConsole = document.getElementById('autoConsole');
  const checkStatusBadge = document.getElementById('checkStatusBadge');
  const btnScan = document.getElementById('btnAutoScan');
  const btnMeter = document.getElementById('btnAutoMeter');
  const btnReplace = document.getElementById('btnAutoReplace');
  const btnClear = document.getElementById('btnAutoClear');

  function drawOscilloscope() {
    const canvas = document.getElementById('autoWaveCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth || 320;
    canvas.height = 90;

    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw waveform
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = state.auto.coilReplaced ? '#10b981' : '#ef4444';

    const midY = canvas.height / 2;
    ctx.moveTo(0, midY);

    for (let x = 0; x < canvas.width; x++) {
      let y = midY;
      if (state.auto.coilReplaced) {
        // Healthy spark waveform with primary ionization peak
        const cycle = (x % 70);
        if (cycle < 10) y = midY;
        else if (cycle === 15) y = midY - 35; // Spark spike
        else if (cycle < 35) y = midY - 10 + Math.sin(x) * 4; // Burn line
        else if (cycle < 45) y = midY + Math.sin(x * 0.8) * 8; // Coil oscillation
        else y = midY;
      } else {
        // Broken coil: flat dead signal with occasional stray noise
        y = midY + (Math.random() - 0.5) * 4;
      }
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  if (btnScan) {
    btnScan.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      state.auto.scanned = true;
      autoConsole.textContent = `[OBD-II SCANNER v4.2]:\n` +
        `• Связь с ЭБУ Bosch ME17: УСТАНОВЛЕНА\n` +
        `• DTC: P0301 (Пропуск воспламенения в цилиндре #1)\n` +
        `• Freeze Frame: Об. двигателя 820 об/мин, Темп. ОЖ 88°C\n` +
        `• РЕКОМЕНДАЦИЯ: Замерьте сопротивление первичной обмотки катушки #1.\n`;
      updateScore(25);
      drawOscilloscope();
    });
  }

  if (btnMeter) {
    btnMeter.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      state.auto.meterTested = true;
      if (state.auto.coilReplaced) {
        autoConsole.textContent += `\n[МУЛЬТИМЕТР Fluke 87V]:\n• Замер сопротивления катушки 1 = 1.12 Ом\n• СТАТУС: Сопротивление в пределах заводского допуска (1.05 - 1.25 Ом).\n`;
      } else {
        autoConsole.textContent += `\n[МУЛЬТИМЕТР Fluke 87V]:\n• Замер сопротивления катушки 1 = O.L (Обрыв первичной цепи!)\n• СТАТУС: Внутренний пробой изолятора. Катушка подлежит обязательной замене.\n`;
      }
      updateScore(50);
      drawOscilloscope();
    });
  }

  if (btnReplace) {
    btnReplace.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      state.auto.coilReplaced = true;
      autoConsole.textContent += `\n[РЕМОНТНЫЙ УЧАСТОК]:\n• Демонтирована неисправная катушка #1.\n• Установлен оригинальный модуль зажигания NGK/Bosch.\n• Разъем защелкнут, момент затяжки 10 Н·м.\n`;
      updateScore(75);
      drawOscilloscope();
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      if (!state.auto.coilReplaced) {
        if (window.soundEngine) window.soundEngine.playError();
        autoConsole.textContent += `\n⚠️ [ОТКАЗ СБРОСА]: Аппаратная ошибка не устранена! Сначала замените неисправную катушку.\n`;
      } else {
        state.auto.cleared = true;
        checkStatusBadge.className = 'check-light good';
        checkStatusBadge.textContent = '✓ ДВС исправен (Check Engine выключен)';
        autoConsole.textContent += `\n[ОЧИСТКА ЭБУ ЗАВЕРШЕНА]:\n• Память кодов DTC чиста.\n• Контрольная лампа Check Engine погашена.\n• Двигатель работает ровно на всех режимах.\n`;
        updateScore(100);
        drawOscilloscope();
      }
    });
  }

  // ================= MODULE 3: CRYO REFRIGERATION =================
  const compSlider = document.getElementById('compSlider');
  const txvSlider = document.getElementById('txvSlider');
  const hpDisplay = document.getElementById('hpDisplay');
  const lpDisplay = document.getElementById('lpDisplay');
  const copDisplay = document.getElementById('copDisplay');

  function updateCryo() {
    const rpm = parseInt(compSlider.value, 10);
    const txv = parseInt(txvSlider.value, 10);

    const hp = (10 + (rpm / 350) + (txv * 0.04)).toFixed(1);
    const lp = (1.2 + (txv * 0.028) - (rpm * 0.0004)).toFixed(1);
    const cop = (3.85 - Math.abs(hp - 14.0) * 0.22 - Math.abs(lp - 2.1) * 0.35).toFixed(2);

    if (hpDisplay) hpDisplay.textContent = `${hp} bar`;
    if (lpDisplay) lpDisplay.textContent = `${lp} bar`;
    if (copDisplay) copDisplay.textContent = Math.max(1.8, cop);

    const hpOk = hp >= 13.0 && hp <= 15.0;
    const lpOk = lp >= 2.0 && lp <= 2.3;

    if (hpOk && lpOk) {
      updateScore(100);
    } else {
      updateScore(hpOk || lpOk ? 50 : 20);
    }
  }

  if (compSlider && txvSlider) {
    compSlider.addEventListener('input', updateCryo);
    txvSlider.addEventListener('input', updateCryo);
  }

  // ================= MODULE 4: DESIGN AUDIT =================
  document.querySelectorAll('.clickable-bug').forEach(bug => {
    bug.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      const bugId = bug.getAttribute('data-bug');
      state.design.fixedBugs.add(bugId);
      bug.classList.add('resolved');

      if (bugId === 'logo') {
        bug.querySelector('.bug-content').textContent = 'АМК КОЛЛЕДЖ (Пропорции восстановлены)';
        bug.querySelector('.bug-content').style.transform = 'none';
        bug.querySelector('.bug-content').style.letterSpacing = 'normal';
      } else if (bugId === 'title') {
        bug.querySelector('.bug-content').style.color = '#0f172a';
      } else if (bugId === 'font') {
        bug.querySelector('.bug-content').style.fontFamily = "'Plus Jakarta Sans', sans-serif";
      } else if (bugId === 'btn') {
        bug.querySelector('button').style.padding = '10px 20px';
        bug.querySelector('button').style.fontSize = '14px';
        bug.querySelector('button').style.background = '#4f46e5';
        bug.querySelector('button').style.border = 'none';
        bug.querySelector('button').style.borderRadius = '6px';
        bug.querySelector('button').textContent = 'Подать документы онлайн ✓';
      }

      const score = state.design.fixedBugs.size * 25;
      updateScore(score);
    });
  });

  // ================= MODULE 5: FURNITURE SHEET CUTTING =================
  const btnRunCut = document.getElementById('btnRunCut');
  const fWaste = document.getElementById('fWaste');
  const fCost = document.getElementById('fCost');

  function drawFurnitureSheet(isCut = false) {
    const canvas = document.getElementById('furnitureCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 460;
    canvas.height = 320;

    // Background sheet (2800 x 2070 mm)
    ctx.fillStyle = '#b45309'; // Wood brown
    ctx.fillRect(20, 20, 420, 280);

    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 420, 280);

    // Dimension labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('2800 mm', 200, 15);
    ctx.fillText('2070 mm', 425, 160);

    if (isCut) {
      // Cut parts
      const parts = [
        { x: 25, y: 25, w: 120, h: 220, label: 'Боковина 1' },
        { x: 150, y: 25, w: 120, h: 220, label: 'Боковина 2' },
        { x: 275, y: 25, w: 155, h: 105, label: 'Крышка' },
        { x: 275, y: 135, w: 155, h: 105, label: 'Дно' },
        { x: 25, y: 250, w: 190, h: 45, label: 'Полка #1' },
        { x: 220, y: 250, w: 190, h: 45, label: 'Полка #2' }
      ];

      parts.forEach(p => {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Plus Jakarta Sans';
        ctx.fillText(p.label, p.x + 8, p.y + 20);
      });

      // Kerf sawdust lines
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText('✓ ЧПУ РАСКРОЙ ВЫПОЛНЕН', 30, 312);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px Plus Jakarta Sans';
      ctx.fillText('Лист ЛДСП готов к расчету карт раскроя', 90, 160);
    }
  }

  if (btnRunCut) {
    btnRunCut.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      drawFurnitureSheet(true);
      if (fWaste) fWaste.textContent = '8.4 %';
      if (fCost) fCost.textContent = '14 200 ₸ (Экономия 3 400 ₸)';
      updateScore(100);
    });
  }

  // Initial load
  switchModule(state.activeSpec);
});
