/* ========================================================
   AMK SKILLHUB: INTUITIVE SIMULATOR WORKSTATION
   Clear Step-by-Step Logic & Visual Clarity
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    activeSpec: 'it',
    score: 0,
    timerSeconds: 45 * 60,
    // Auto module step-by-step
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

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  const specParam = params.get('spec');
  if (specParam && ['it', 'auto', 'cryo', 'design', 'furniture'].includes(specParam)) {
    state.activeSpec = specParam;
  }

  // Header Module Navigation
  const modButtons = document.querySelectorAll('.mod-btn');
  modButtons.forEach(btn => {
    btn.addEventListener('click', () => {
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
  }

  // Clear, Human Instructions for each module
  const instructions = {
    it: {
      title: "06130100 — Программное обеспечение",
      steps: [
        {
          num: "Шаг 1: Задача",
          title: "Логика начисления стипендии",
          desc: "В деканате АМК нужно автоматически назначить выплаты. Изучите готовый шаблон функции calculateScholarship в редакторе справа."
        },
        {
          num: "Шаг 2: Условия",
          title: "Критерии оценок",
          desc: "Если балл >= 4.5 и посещаемость >= 90% — Повышенная. Если балл >= 3.5 и посещаемость >= 75% — Обычная. Иначе — Не назначена."
        },
        {
          num: "Шаг 3: Проверка",
          title: "Запуск автоматических тестов",
          desc: "Нажмите синюю кнопку «Запустить тесты» справа. Система прогонит 4 контрольных случая и выставит баллы."
        }
      ]
    },
    auto: {
      title: "07161300 — ТО и ремонт автотранспорта",
      steps: [
        {
          num: "Шаг 1: Сканирование",
          title: "Чтение кодов ошибок",
          desc: "Горит лампа Check Engine. Нажмите кнопку «1. Считать ошибки сканером», чтобы определить код неисправности."
        },
        {
          num: "Шаг 2: Замер",
          title: "Проверка мультиметром",
          desc: "Нажмите «2. Замерить сопротивление катушки». Норма: 1.1 Ом. При обрыве мультиметр покажет O.L."
        },
        {
          num: "Шаг 3: Ремонт и сброс",
          title: "Замена и очистка памяти",
          desc: "Нажмите «3. Заменить катушку 1», затем «4. Сбросить ошибки». Лампа Check Engine погаснет!"
        }
      ]
    },
    cryo: {
      title: "07150900 — Холодильно-компрессорные машины",
      steps: [
        {
          num: "Шаг 1: Анализ",
          title: "Термодинамический контур R134a",
          desc: "Установка охлаждает пищевой склад в Алматы. Нужно настроить компрессор и вентиль ТРВ."
        },
        {
          num: "Шаг 2: Регулировка",
          title: "Целевые параметры давления",
          desc: "Двигайте ползунки: Высокое давление (HP) должно быть 13-15 bar, Низкое давление (LP) — 2.0-2.3 bar."
        },
        {
          num: "Шаг 3: Коэффициент",
          title: "Оптимизация COP",
          desc: "При попадании обоих манометров в зеленую зону холодильный коэффициент COP превысит 3.2."
        }
      ]
    },
    design: {
      title: "02110300 — Графический дизайн",
      steps: [
        {
          num: "Шаг 1: Аудит",
          title: "Поиск ошибок верстки",
          desc: "Перед вами черновой макет страницы колледжа с 4 явными дефектами дизайна."
        },
        {
          num: "Шаг 2: Исправление",
          title: "Кликайте по рамкам",
          desc: "Нажмите по каждой пунктирной рамке на макете (логотип, заголовок, текст, кнопка), чтобы устранить дефект."
        },
        {
          num: "Шаг 3: Итог",
          title: "Соответствие стандартам",
          desc: "После устранения всех 4 дефектов макет преобразится в чистый профессиональный вид."
        }
      ]
    },
    furniture: {
      title: "07221400 — Производство мебели",
      steps: [
        {
          num: "Шаг 1: Спецификация",
          title: "Кухонный шкаф из ЛДСП",
          desc: "Требуется раскроить стандартный полноформатный лист ЛДСП 2800 × 2070 × 16 мм на 7 деталей корпуса."
        },
        {
          num: "Шаг 2: Расчет",
          title: "Минимизация обрезков",
          desc: "Нажмите «Сгенерировать карту раскроя». Алгоритм ЧПУ оптимально разместит заготовки с учетом толщины диска 4.2 мм."
        },
        {
          num: "Шаг 3: Смета",
          title: "Экономическая выгода",
          desc: "Технологический отход составит всего 8.4%, что экономит до 20% себестоимости плиты."
        }
      ]
    }
  };

  function loadInstructions(specKey) {
    const data = instructions[specKey];
    if (!data) return;

    document.getElementById('instTitle').textContent = data.title;
    const scroll = document.getElementById('instScroll');
    scroll.innerHTML = data.steps.map(s => `
      <div class="step-card">
        <span class="step-num">${s.num}</span>
        <h4>${s.title}</h4>
        <p>${s.desc}</p>
      </div>
    `).join('');
  }

  function updateScore(score) {
    state.score = score;
    const badge = document.getElementById('currentScoreBadge');
    if (badge) badge.textContent = `${score} / 100 баллов`;

    if (score >= 80) {
      const saved = JSON.parse(localStorage.getItem('amk_student_data')) || AMK_DATA.student;
      saved.skills[state.activeSpec] = Math.min(100, (saved.skills[state.activeSpec] || 80) + 5);
      localStorage.setItem('amk_student_data', JSON.stringify(saved));
    }
  }

  // ================= MODULE 1: IT CODE TEST RUNNER =================
  const runCodeBtn = document.getElementById('runCodeBtn');
  const itConsole = document.getElementById('itConsole');
  const codeArea = document.getElementById('codeArea');

  if (runCodeBtn && codeArea) {
    runCodeBtn.addEventListener('click', () => {
      itConsole.textContent = 'Запуск юнит-тестов...\n';
      try {
        const fn = new Function(`${codeArea.value}; return calculateScholarship;`)();
        const tests = [
          { args: [4.8, 95], expected: 'Повышенная (45 000 ₸)', name: 'Отличник (4.8, 95%)' },
          { args: [3.9, 80], expected: 'Обычная (35 000 ₸)', name: 'Хорошист (3.9, 80%)' },
          { args: [3.2, 90], expected: 'Не назначена (0 ₸)', name: 'Троечник (3.2, 90%)' },
          { args: [4.9, 50], expected: 'Не назначена (0 ₸)', name: 'Пропуски (4.9, 50%)' }
        ];

        let passed = 0;
        tests.forEach((t, i) => {
          const res = fn(t.args[0], t.args[1]);
          if (res === t.expected) {
            passed++;
            itConsole.textContent += `✓ Тест #${i+1} [${t.name}]: Пройден ("${res}")\n`;
          } else {
            itConsole.textContent += `✗ Тест #${i+1} [${t.name}]: Ожидалось "${t.expected}", получено "${res}"\n`;
          }
        });

        const score = Math.round((passed / tests.length) * 100);
        updateScore(score);
        itConsole.textContent += `\nИтоговый результат: ${score} из 100 баллов. Все требования соблюдены!`;
      } catch (err) {
        itConsole.textContent += `❌ Ошибка в коде: ${err.message}`;
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

  if (btnScan) {
    btnScan.addEventListener('click', () => {
      state.auto.scanned = true;
      autoConsole.textContent = `[OBD-II SCANNER v4.2]:\n` +
        `• Связь с ЭБУ Bosch: УСТАНОВЛЕНА\n` +
        `• Код ошибки: P0301 (Пропуск зажигания в цилиндре 1)\n` +
        `• Статус: Проверьте сопротивление первичной обмотки катушки зажигания.\n`;
      updateScore(25);
    });
  }

  if (btnMeter) {
    btnMeter.addEventListener('click', () => {
      state.auto.meterTested = true;
      if (state.auto.coilReplaced) {
        autoConsole.textContent += `\n[МУЛЬТИМЕТР]: Замер сопротивления катушки 1 = 1.12 Ом (НОРМА, исправна!)\n`;
      } else {
        autoConsole.textContent += `\n[МУЛЬТИМЕТР]: Замер сопротивления катушки 1 = O.L (ОБРЫВ ПЕРВИЧНОЙ ЦЕПИ! Требуется замена)\n`;
      }
      updateScore(50);
    });
  }

  if (btnReplace) {
    btnReplace.addEventListener('click', () => {
      state.auto.coilReplaced = true;
      autoConsole.textContent += `\n[РЕМОНТ]: Установлена новая оригинальная катушка зажигания цилиндра 1.\n`;
      updateScore(75);
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (!state.auto.coilReplaced) {
        autoConsole.textContent += `\n[ОШИБКА СБРОСА]: Неисправность катушки 1 не устранена! Сначала замените деталь.\n`;
      } else {
        state.auto.cleared = true;
        checkStatusBadge.className = 'check-light good';
        checkStatusBadge.textContent = '✓ ДВС исправен (Check Engine выключен)';
        autoConsole.textContent += `\n[ЭБУ ОЧИЩЕН]: Память DTC пуста. Check Engine погашен. Двигатель работает ровно!\n`;
        updateScore(100);
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
      const bugId = bug.getAttribute('data-bug');
      state.design.fixedBugs.add(bugId);
      bug.classList.add('resolved');

      if (bugId === 'logo') {
        bug.querySelector('.bug-content').textContent = 'AMK COLLEGE (Пропорции восстановлены)';
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
      }

      const score = state.design.fixedBugs.size * 25;
      updateScore(score);
    });
  });

  // ================= MODULE 5: FURNITURE CUTTING =================
  const btnRunCut = document.getElementById('btnRunCut');
  const furnitureCanvas = document.getElementById('furnitureCanvas');

  function drawFurniture() {
    if (!furnitureCanvas) return;
    const ctx = furnitureCanvas.getContext('2d');
    furnitureCanvas.width = 540;
    furnitureCanvas.height = 380;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, furnitureCanvas.width, furnitureCanvas.height);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, furnitureCanvas.width - 4, furnitureCanvas.height - 4);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('Лист ЛДСП 2800 × 2070 мм. Нажмите кнопку справа для расчета.', furnitureCanvas.width / 2, furnitureCanvas.height / 2);
  }

  if (btnRunCut) {
    btnRunCut.addEventListener('click', () => {
      const ctx = furnitureCanvas.getContext('2d');
      ctx.clearRect(0, 0, furnitureCanvas.width, furnitureCanvas.height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, furnitureCanvas.width, furnitureCanvas.height);

      const parts = [
        { name: 'Боковина 1', x: 8, y: 8, w: 160, h: 180, c: '#4f46e5' },
        { name: 'Боковина 2', x: 176, y: 8, w: 160, h: 180, c: '#4f46e5' },
        { name: 'Дно', x: 344, y: 8, w: 140, h: 180, c: '#0ea5e9' },
        { name: 'Верх', x: 8, y: 196, w: 140, h: 170, c: '#0ea5e9' },
        { name: 'Полка', x: 156, y: 196, w: 140, h: 170, c: '#10b981' },
        { name: 'Фасады (2 шт)', x: 304, y: 196, w: 180, h: 170, c: '#f59e0b' }
      ];

      parts.forEach(p => {
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.x + p.w / 2, p.y + p.h / 2);
      });

      // Saw cuts
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(0, 192, furnitureCanvas.width, 1);
      ctx.setLineDash([]);

      document.getElementById('fWaste').textContent = '8.4%';
      document.getElementById('fCost').textContent = '24 800 ₸';
      updateScore(100);
    });
  }

  // Timer Countdown
  const timerDisplay = document.getElementById('timerDisplay');
  setInterval(() => {
    if (state.timerSeconds > 0) {
      state.timerSeconds--;
      const m = String(Math.floor(state.timerSeconds / 60)).padStart(2, '0');
      const s = String(state.timerSeconds % 60).padStart(2, '0');
      if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
    }
  }, 1000);

  // Initial boot
  switchModule(state.activeSpec);
  drawFurniture();
});
