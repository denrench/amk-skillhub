/* ==========================================================================
   EDU SPACE PRO — 5-Specialty Interactive Mission Curriculum Registry
   Supports: graphic_design, it, autoelectric, hvac, automechanic (tasks 1..20)
   Stage 4 Labs powered deterministically by window.EduPhysics.*
   ========================================================================== */
(function () {
  'use strict';

  const SPECIALTY_META = {
    graphic_design: {
      slug: 'graphic_design',
      icon: 'palette',
      subtitle: 'Графический дизайн (02130100)',
      headerTitle: 'Архитектор цвета',
      badge: 'ИНТЕРАКТИВНАЯ МИССИЯ • ГРАФИЧЕСКИЙ ДИЗАЙН',
      titleMain: 'АРХИТЕКТОР',
      titleAccent: 'ЦВЕТА',
      curator: 'Сейдахметова А. К.',
      desc: 'Освойте геометрию цветового круга, пройдите 4 тактических испытания, соберите палитру по стандарту WCAG 2.1 в Цветовой лаборатории и защитите дизайн-проект перед преподавателем.'
    },
    it: {
      slug: 'it',
      icon: 'code',
      subtitle: 'Веб-разработка (06130100)',
      headerTitle: 'Архитектор Веб-UI',
      badge: 'ИНТЕРАКТИВНАЯ МИССИЯ • ВЕБ-РАЗРАБОТКА (IT)',
      titleMain: 'АРХИТЕКТОР',
      titleAccent: 'ВЕБ-UI',
      curator: 'Власов М. Г.',
      desc: 'Практическая инженерная миссия по современной фронтенд-разработке: семантический HTML5, адаптивные сетки Flexbox/Grid, контрастность WCAG, защита от XSS и лабораторная верификация макета.'
    },
    autoelectric: {
      slug: 'autoelectric',
      icon: 'bolt',
      subtitle: 'Автоэлектрика (07161301)',
      headerTitle: 'Диагност бортовой сети 12В',
      badge: 'ИНТЕРАКТИВНАЯ МИССИЯ • АВТОЭЛЕКТРИКА',
      titleMain: 'ИНЖЕНЕР',
      titleAccent: 'БОРТОСЕТИ',
      curator: 'Жумабаев Р. М.',
      desc: 'Практическая миссия по диагностике бортовых цепей 12В и CAN-шины: закон Ома и падение напряжения, клеммы DIN 72552, терминаторы 60 Ом, коды OBD-II и лабораторный расчёт цепей.'
    },
    hvac: {
      slug: 'hvac',
      icon: 'ac_unit',
      subtitle: 'Холодильное оборудование (07130700)',
      headerTitle: 'Инженер термоцикла HVAC',
      badge: 'ИНТЕРАКТИВНАЯ МИССИЯ • HVAC И ХОЛОД',
      titleMain: 'МАСТЕР',
      titleAccent: 'ТЕРМОЦИКЛА',
      curator: 'Ахметов Т. Б.',
      desc: 'Практическая миссия по обслуживанию холодильных установок: парокомпрессионный цикл, кривые насыщения P-T, расчёт перегрева (Superheat) и переохлаждения, вакуумирование до 500 микрон.'
    },
    automechanic: {
      slug: 'automechanic',
      icon: 'build',
      subtitle: 'Автомеханика (07161300)',
      headerTitle: 'Диагност ДВС и ГБЦ',
      badge: 'ИНТЕРАКТИВНАЯ МИССИЯ • АВТОМЕХАНИКА',
      titleMain: 'ДИАГНОСТ',
      titleAccent: 'ДВИГАТЕЛЯ',
      curator: 'Садыков Е. К.',
      desc: 'Практическая миссия по ремонту и диагностике ДВС: фазы ГРМ, граф зависимостей разборки ГБЦ, спиральная протяжка 10 болтов, доворот на угол и регулировка клапанных зазоров.'
    }
  };

  const MISSION_CURRICULUM = {
    it: {
      stage2Title: 'Архитектура Веб-UI, сетки и безопасность',
      stage2Desc: 'Изучите все 5 интерактивных инженерных модулей фронтенд-разработки, чтобы открыть тренировочный полигон (+75 XP).',
      theoryNodes: [
        {
          id: 1,
          title: 'Семантика HTML5 и ориентиры доступности',
          body: 'Используйте <header>, <nav>, <main>, <section> и единственное дерево заголовков h1–h3 вместо анонимных <div>, чтобы скринридеры и поисковые роботы понимали структуру документа.',
          actionLabel: 'Проверить DOM-структуру',
          telemetry: 'Landmarks: <header>, <main id="academy-main">, <nav> — структура валидна.'
        },
        {
          id: 2,
          title: 'CSS Flexbox и Grid: модель выравнивания',
          body: 'Flexbox управляет одномерным потоком (justify-content по главной оси, align-items по поперечной), а Grid строит двумерную сетку с gap без хаков через margin.',
          actionLabel: 'Протестировать Flexbox',
          telemetry: 'display: flex; justify-content: space-between; align-items: center; gap: 16px;'
        },
        {
          id: 3,
          title: 'Контрастность WCAG 2.1 (AA / AAA)',
          body: 'Обычный текст требует коэффициента контрастности не ниже 4.5:1 (AA) и 7.0:1 (AAA). Низкий контраст нарушает доступность интерфейса при ярком освещении.',
          actionLabel: 'Вычислить WCAG в ядре',
          telemetryFn: () => {
            if (window.EduPhysics && window.EduPhysics.design) {
              const r = window.EduPhysics.design.contrastRatio('#F4F7FF', '#11182A');
              return `Контраст #F4F7FF на #11182A = ${r.ratio}:1 (${r.aaaNormal ? 'AAA PASS' : 'AA'})`;
            }
            return 'Контраст #F4F7FF на #11182A >= 14:1 (AAA)';
          }
        },
        {
          id: 4,
          title: 'Жизненный цикл Fetch API и защита CSRF',
          body: 'Все изменяющие запросы (POST/PUT/DELETE) отправляются с credentials: "same-origin" и заголовком X-CSRF-Token, проверяемым сервером перед записью в БД.',
          actionLabel: 'Симулировать CSRF-запрос',
          telemetry: 'POST /api/mission/save_stage • Header: X-CSRF-Token: <verified> • Status: 200 OK'
        },
        {
          id: 5,
          title: 'Защита от DOM XSS и безопасное экранирование',
          body: 'Любой пользовательский ввод перед вставкой в HTML-шаблон должен проходить через escapeHtml() (< > & " \'), либо вставляться через textContent.',
          actionLabel: 'Проверить санитайзер XSS',
          telemetry: 'Input "<img onerror=alert(1)>" -> Escaped "&lt;img onerror=alert(1)&gt;" (Безопасно)'
        }
      ],
      challenges: {
        ch1: {
          title: '1. Выберите семантически корректную карточку урока',
          prompt: 'Какой фрагмент HTML5 обеспечивает лучшую доступность и семантику?',
          options: [
            { key: 'A', title: 'Вариант А', code: '<div onclick="go()"><b>Урок 1</b><font color="gray">Описание</font></div>' },
            { key: 'B', title: 'Вариант Б', code: '<article><h3>Урок 1</h3><p>Описание модуля</p><button type="button">Открыть</button></article>' },
            { key: 'C', title: 'Вариант В', code: '<span><h1>Урок 1</h1><br><a href="javascript:void(0)">Открыть</a></span>' }
          ],
          correct: 'B',
          okMsg: 'Верно! Теги <article>, <h3>, <p> и <button type="button"> обеспечивают клавиатурную навигацию и семантику.',
          errMsg: 'Неверно. Избегайте кликабельных <div> без роли и устаревших <font>.'
        },
        ch2: {
          title: '2. Расчёт адаптивной сетки с отступом 16px',
          prompt: 'Какое правило CSS выровняет карточки по горизонтали по краям с отступом 16px?',
          options: [
            { key: 'opt1', label: 'display: block; float: left; margin: 4px;' },
            { key: 'opt2', label: 'display: flex; justify-content: space-between; align-items: center; gap: 16px;' },
            { key: 'opt3', label: 'position: absolute; top: 0; left: 50%;' },
            { key: 'opt4', label: 'display: inline; vertical-align: top;' }
          ],
          correct: 'opt2',
          okMsg: 'Точно! Flexbox с justify-content: space-between и gap: 16px задаёт равномерное распределение.',
          errMsg: 'Ошибка. Используйте Flexbox-контейнер с justify-content: space-between и gap: 16px.'
        },
        ch3: {
          title: '3. Сопоставьте веб-технологию и её назначение',
          pairs: [
            { id: 1, label: '1. X-CSRF-Token', correct: 'csrf' },
            { id: 2, label: '2. escapeHtml()', correct: 'xss' },
            { id: 3, label: '3. WCAG 4.5:1', correct: 'a11y' },
            { id: 4, label: '4. display: grid', correct: 'layout' }
          ],
          options: [
            { value: 'csrf', label: 'Защита POST/PUT-запросов от подделки межсайтовых запросов' },
            { value: 'xss', label: 'Нейтрализация HTML-инъекций при рендеринге' },
            { value: 'a11y', label: 'Минимальный коэффициент контрастности текста AA' },
            { value: 'layout', label: 'Двумерная адаптивная раскладка компонентов' }
          ]
        },
        ch4: {
          title: '4. Распределите веб-токены по категориям архитектуры',
          zones: [
            { key: 'semantic', label: '1. Семантика HTML5' },
            { key: 'layout', label: '2. Сетка и CSS' },
            { key: 'security', label: '3. Безопасность' }
          ],
          chips: [
            { id: 'c1', label: '<main> / <nav>', category: 'semantic' },
            { id: 'c2', label: 'aria-label', category: 'semantic' },
            { id: 'c3', label: 'justify-content', category: 'layout' },
            { id: 'c4', label: 'grid-template-columns', category: 'layout' },
            { id: 'c5', label: 'X-CSRF-Token', category: 'security' },
            { id: 'c6', label: 'escapeHtml()', category: 'security' }
          ]
        }
      }
    },

    autoelectric: {
      stage2Title: 'Бортовая сеть 12В, CAN-шина и диагностика OBD-II',
      stage2Desc: 'Изучите все 5 диагностических модулей автоэлектрика, чтобы разблокировать тренировочный полигон (+75 XP).',
      theoryNodes: [
        {
          id: 1,
          title: 'Закон Ома и падение напряжения под нагрузкой',
          body: 'Падение напряжения на переходном сопротивлении контакта вычисляется как ΔU = I × R. При токе стартера 150 А даже 0.02 Ом окисленной клеммы крадут 3.0 В.',
          actionLabel: 'Рассчитать цепь через EduPhysics',
          telemetryFn: () => {
            if (window.EduPhysics && window.EduPhysics.autoelectric) {
              const s = window.EduPhysics.autoelectric.solveCircuit(['bat', 'fuse', 'load', 'gnd'], [{ from: 'bat', to: 'fuse', r: 0.2 }, { from: 'fuse', to: 'load', r: 4.0 }, { from: 'load', to: 'gnd', r: 0.1 }], 12.6, null);
              return `I_total = ${s.totalCurrent} A, R_total = ${s.totalResistance} Ω, V_fuse = ${s.nodeVoltages.fuse} V`;
            }
            return 'I = 12.6 / 4.3 = 2.93 A';
          }
        },
        {
          id: 2,
          title: 'Стандарт клемм DIN 72552 (15, 30, 31, 85, 86, 87)',
          body: '30 — постоянный «+» АКБ; 15 — «+» после замка зажигания; 31 — масса (GND); 85/86 — обмотка управления реле; 87 — силовой выход контакта реле.',
          actionLabel: 'Проверить распиновку реле',
          telemetry: 'Клемма 30 (+12.6V) -> 87 (Нагрузка) при подаче +12V на 86 и массы на 85.'
        },
        {
          id: 3,
          title: 'Шина CAN-High / CAN-Low и резисторы 120 Ом',
          body: 'Два согласующих резистора 120 Ом на концах шины включены параллельно и дают суммарное сопротивление 60 Ом между пинами 6 и 14 OBD-II при отключённой АКБ.',
          actionLabel: 'Измерить терминаторы CAN',
          telemetry: 'R(CAN-H ↔ CAN-L) = 120 Ω || 120 Ω = 60.0 Ω (НОРМА). 120 Ω = обрыв одного блока.'
        },
        {
          id: 4,
          title: 'Структура диагностических кодов OBD-II (DTC)',
          body: 'Префикс определяет систему: P (Powertrain — ДВС/АКПП), C (Chassis — ABS/ESP), B (Body — кузов/SRS), U (Network — шина CAN). Вторая цифра 0 — стандарт SAE.',
          actionLabel: 'Расшифровать P0171 и U0100',
          telemetry: 'P0171 = Бедная смесь (Банк 1) • U0100 = Потеря связи с ЭБУ двигателя (ECM)'
        },
        {
          id: 5,
          title: 'Ток утечки покоя (Parasitic Draw)',
          body: 'После засыпания блоков CAN (через 15–30 минут) ток утечки исправного автомобиля не должен превышать 30–50 мА (0.05 А).',
          actionLabel: 'Проверить порог утечки',
          telemetry: 'Измерено: 0.032 A (32 мА) <= 50 мА • АКБ защищена от разряда.'
        }
      ],
      challenges: {
        ch1: {
          title: '1. Диагностика сопротивления шины CAN (контакты 6 и 14 OBD-II)',
          prompt: 'При отключённой АКБ омметр показал 120 Ом вместо 60 Ом. Что неисправно?',
          options: [
            { key: 'A', title: 'Вариант А', code: 'Короткое замыкание CAN-High на массу (0 Ом)' },
            { key: 'B', title: 'Вариант Б', code: 'Обрыв одного из двух терминальных резисторов 120 Ом или ветки шины' },
            { key: 'C', title: 'Вариант В', code: 'Нормальное состояние при работающем генераторе' }
          ],
          correct: 'B',
          okMsg: 'Верно! Два параллельных резистора 120 Ом дают 60 Ом; если остался один, прибор показывает 120 Ом.',
          errMsg: 'Неверно. Вспомните формулу параллельного соединения двух резисторов по 120 Ом.'
        },
        ch2: {
          title: '2. Расчёт падения напряжения на окисленной клемме',
          prompt: 'Через силовой провод течёт ток 180 А, сопротивление окисленной клеммы 0.015 Ом. Какое падение напряжения ΔU?',
          options: [
            { key: 'opt1', label: '0.27 В' },
            { key: 'opt2', label: '2.70 В' },
            { key: 'opt3', label: '12.0 В' },
            { key: 'opt4', label: '0.015 В' }
          ],
          correct: 'opt2',
          okMsg: 'Точно! ΔU = 180 A × 0.015 Ω = 2.70 В — это критическая потеря для стартера!',
          errMsg: 'Ошибка расчёта. Примените закон Ома: ΔU = I × R = 180 × 0.015.'
        },
        ch3: {
          title: '3. Сопоставьте клеммы DIN 72552 с их функцией',
          pairs: [
            { id: 1, label: '1. Клемма 30', correct: 'bat' },
            { id: 2, label: '2. Клемма 15', correct: 'ign' },
            { id: 3, label: '3. Клемма 31', correct: 'gnd' },
            { id: 4, label: '4. Клемма 87', correct: 'load' }
          ],
          options: [
            { value: 'bat', label: 'Постоянный плюс от АКБ (+12В)' },
            { value: 'ign', label: 'Плюс при включённом зажигании' },
            { value: 'gnd', label: 'Масса кузова / минус АКБ' },
            { value: 'load', label: 'Силовой выход нормально разомкнутого реле' }
          ]
        },
        ch4: {
          title: '4. Распределите понятия по диагностическим группам',
          zones: [
            { key: 'power', label: '1. Питание и масса' },
            { key: 'can', label: '2. Шина данных CAN' },
            { key: 'dtc', label: '3. Коды и защита' }
          ],
          chips: [
            { id: 'c1', label: 'Клемма 30 (+12В)', category: 'power' },
            { id: 'c2', label: 'Клемма 31 (GND)', category: 'power' },
            { id: 'c3', label: 'CAN-High (Pin 6)', category: 'can' },
            { id: 'c4', label: 'Терминатор 60 Ом', category: 'can' },
            { id: 'c5', label: 'Предохранитель EFI 15A', category: 'dtc' },
            { id: 'c6', label: 'Код U0100 (Сеть)', category: 'dtc' }
          ]
        }
      }
    },

    hvac: {
      stage2Title: 'Парокомпрессионный цикл, P-T и перегрев (Superheat)',
      stage2Desc: 'Изучите все 5 термодинамических модулей HVAC, чтобы разблокировать тренировочный полигон (+75 XP).',
      theoryNodes: [
        {
          id: 1,
          title: 'Четыре компонента парокомпрессионного цикла',
          body: 'Компрессор сжимает пар высокого давления; конденсатор отводит тепло и превращает пар в жидкость; ТРВ дросселирует давление; испаритель кипит и забирает тепло.',
          actionLabel: 'Проверить контур высокого/низкого давления',
          telemetry: 'High Side: Компрессор → Конденсатор | Low Side: ТРВ → Испаритель'
        },
        {
          id: 2,
          title: 'Диаграмма насыщения P-T (R134a, R410A, R32, R600a)',
          body: 'Для каждого хладагента манометрическое давление однозначно определяет температуру кипения T_sat. У R410A рабочие давления существенно выше, чем у R134a.',
          actionLabel: 'Рассчитать T_sat в ядре EduPhysics',
          telemetryFn: () => {
            if (window.EduPhysics && window.EduPhysics.hvac) {
              const m = window.EduPhysics.hvac.cycleMetrics('R134a', 2.0, 12.0, 2.0, 36.0);
              return `R134a при 2.0 bar: T_sat_low = ${m.tSatLow} °C, SH = ${m.superheatK} K, COP = ${m.copEstimate}`;
            }
            return 'R134a 2.0 bar -> T_sat ≈ -5 °C';
          }
        },
        {
          id: 3,
          title: 'Перегрев всасывания (Superheat = T_suction - T_sat_low)',
          body: 'Перегрев показывает, насколько пары на выходе испарителя теплее температуры кипения. Норма 5–8 K: <3 K грозит гидроударом, >12 K — нехваткой фреона.',
          actionLabel: 'Проверить пороги Superheat',
          telemetry: 'Целевой диапазон Superheat: 4–10 K (оптимум 5–8 K).'
        },
        {
          id: 4,
          title: 'Переохлаждение жидкости (Subcooling = T_sat_high - T_liquid)',
          body: 'Переохлаждение на выходе конденсатора гарантирует, что в ТРВ поступает чистая жидкость без пузырьков пара. При перезаправке Subcooling превышает 12 K.',
          actionLabel: 'Вычислить Subcooling',
          telemetry: 'T_sat_high = +46 °C, T_liquid = +38 °C -> Subcooling = 8.0 K (НОРМА)'
        },
        {
          id: 5,
          title: 'Опрессовка сухим азотом и глубокий вакуум 500 микрон',
          body: 'Перед заправкой контур проверяют сухим азотом (никогда не кислородом!), затем вакуумируют до ≤ 500 микрон для удаления влаги и неконденсируемых газов.',
          actionLabel: 'Проверить регламент вакуумирования',
          telemetry: 'Азот 15 bar (15 мин без падения) -> Вакуум < 500 мкм -> Весовая заправка.'
        }
      ],
      challenges: {
        ch1: {
          title: '1. Диагностика контура по высокому перегреву',
          prompt: 'Манометр показал низкое давление всасывания, а расчёт дал Superheat = 16.5 K при низком Subcooling. Причина?',
          options: [
            { key: 'A', title: 'Вариант А', code: 'Недостаток хладагента (утечка) или засор капилляра/фильтра' },
            { key: 'B', title: 'Вариант Б', code: 'Сильная перезаправка контура фреоном' },
            { key: 'C', title: 'Вариант В', code: 'Остановка вентилятора конденсатора без утечки' }
          ],
          correct: 'A',
          okMsg: 'Верно! Когда фреона мало, он выкипает слишком рано и пар сильно перегревается (>12 K).',
          errMsg: 'Неверно. Высокий перегрев и низкое давление — классический признак нехватки хладагента.'
        },
        ch2: {
          title: '2. Расчёт перегрева (Superheat) по измерениям',
          prompt: 'Температура кипения по манометру T_sat_low = -4 °C, температура трубки всасывания T_suction = +3 °C. Чему равен перегрев?',
          options: [
            { key: 'opt1', label: '1.0 K' },
            { key: 'opt2', label: '7.0 K' },
            { key: 'opt3', label: '-7.0 K' },
            { key: 'opt4', label: '12.0 K' }
          ],
          correct: 'opt2',
          okMsg: 'Точно! Superheat = (+3) - (-4) = 7.0 K — идеальный рабочий режим!',
          errMsg: 'Ошибка знака! Используйте формулу: SH = T_suction - T_sat_low = 3 - (-4).'
        },
        ch3: {
          title: '3. Сопоставьте узел холодильной машины с его задачей',
          pairs: [
            { id: 1, label: '1. Компрессор', correct: 'comp' },
            { id: 2, label: '2. Конденсатор', correct: 'cond' },
            { id: 3, label: '3. ТРВ', correct: 'txv' },
            { id: 4, label: '4. Испаритель', correct: 'evap' }
          ],
          options: [
            { value: 'comp', label: 'Сжимает пары хладагента и повышает давление' },
            { value: 'cond', label: 'Отводит тепло в окружающую среду и конденсирует пар' },
            { value: 'txv', label: 'Дросселирует давление и регулирует перегрев' },
            { value: 'evap', label: 'Поглощает тепло из охлаждаемой камеры при кипении' }
          ]
        },
        ch4: {
          title: '4. Распределите операции и узлы по сторонам цикла',
          zones: [
            { key: 'high', label: '1. Сторона высокого давления' },
            { key: 'low', label: '2. Сторона низкого давления' },
            { key: 'service', label: '3. Сервис и ПНР' }
          ],
          chips: [
            { id: 'c1', label: 'Конденсатор (+45 °C)', category: 'high' },
            { id: 'c2', label: 'Subcooling (Переохл.)', category: 'high' },
            { id: 'c3', label: 'Испаритель (-5 °C)', category: 'low' },
            { id: 'c4', label: 'Superheat (Перегрев)', category: 'low' },
            { id: 'c5', label: 'Опрессовка азотом', category: 'service' },
            { id: 'c6', label: 'Вакуум 500 микрон', category: 'service' }
          ]
        }
      }
    },

    automechanic: {
      stage2Title: 'Конструкция ДВС, порядок разборки и момент затяжки ГБЦ',
      stage2Desc: 'Изучите все 5 технологических карт ремонта ДВС, чтобы разблокировать тренировочный полигон (+75 XP).',
      theoryNodes: [
        {
          id: 1,
          title: '4-тактный цикл ДВС и метки ГРМ (ВМТ)',
          body: 'Перед снятием ремня/цепи ГРМ коленвал устанавливается в ВМТ 1-го цилиндра с совмещением меток шкивов распредвалов, чтобы избежать встречи клапанов с поршнями.',
          actionLabel: 'Проверить фазы ВМТ',
          telemetry: 'Впуск → Сжатие → Рабочий ход → Выпуск • Метки ВМТ совмещены.'
        },
        {
          id: 2,
          title: 'Технологический граф разборки ГБЦ (Prerequisites)',
          body: 'Снятие головки блока невозможно без предварительного демонтажа клапанной крышки (valve_cover) и распределительных валов (camshaft_intake/exhaust).',
          actionLabel: 'Проверить порядок разборки',
          telemetry: 'Порядок: valve_cover → camshaft_intake & exhaust → cylinder_head → piston_1.'
        },
        {
          id: 3,
          title: 'Спиральная протяжка 10 болтов ГБЦ от центра к краям',
          body: 'Чтобы не повести привалочную плоскость алюминиевой ГБЦ, болты затягиваются от центра к периферии по спирали (например, 6-5-7-4-8-3-9-2-10-1 или строгая схема карты).',
          actionLabel: 'Проверить схему в EduPhysics',
          telemetryFn: () => {
            if (window.EduPhysics && window.EduPhysics.automechanic) {
              const evs = [6,5,7,4,8,3,9,2,10,1].map(b => ({ bolt: b, stage: 1, value: 35 }));
              const r = window.EduPhysics.automechanic.evaluateTorqueSequence(evs, 'head_16v');
              return `Спиральная схема [6..1]: validOrder=${r.validOrder}, passed=${r.passed}`;
            }
            return 'Спиральная схема от центра к краям активна.';
          }
        },
        {
          id: 4,
          title: 'Многоэтапная затяжка и пластический доворот (+90°)',
          body: 'Современные болты ГБЦ тянутся в 3 прохода: предварительный (35 Н·м), основной (60 Н·м) и доворот угломером (+90°). Превышение момента (>130 Н·м) грозит срывом резьбы.',
          actionLabel: 'Проверить допуски момента',
          telemetry: 'Этап 1: 35 Н·м • Этап 2: 60 Н·м • Этап 3: +90° (Предел текучести <= 130 Н·м)'
        },
        {
          id: 5,
          title: 'Контроль тепловых зазоров клапанов щупом',
          body: 'На остывшем двигателе (+20 °C) щупом измеряют зазор между кулачком и толкателем: впуск ~0.25 мм, выпуск ~0.30 мм.',
          actionLabel: 'Проверить калибр щупа',
          telemetry: 'feeler_gauge: Впуск 0.25 мм / Выпуск 0.30 мм при 20 °C.'
        }
      ],
      challenges: {
        ch1: {
          title: '1. Выявление ошибки в порядке разборки ГБЦ',
          prompt: 'Механик попытался открутить головку блока (cylinder_head) до снятия клапанной крышки (valve_cover). Что зафиксирует система?',
          options: [
            { key: 'A', title: 'Вариант А', code: 'WRONG_DISASSEMBLY_ORDER — нарушен технологический граф узла' },
            { key: 'B', title: 'Вариант Б', code: 'Успешная ускоренная разборка без потери качества' },
            { key: 'C', title: 'Вариант В', code: 'Ошибка датчика давления хладагента' }
          ],
          correct: 'A',
          okMsg: 'Верно! Снятие cylinder_head требует предварительного демонтажа valve_cover и распредвалов.',
          errMsg: 'Неверно. Нельзя демонтировать ГБЦ поверх закрытой клапанной крышки и распредвалов.'
        },
        ch2: {
          title: '2. Направление протяжки болтов головки блока',
          prompt: 'В какой последовательности затягивают 10 болтов ГБЦ при сборке двигателя?',
          options: [
            { key: 'opt1', label: 'От левого края к правому (линейно)' },
            { key: 'opt2', label: 'От центра к краям по спирали в несколько проходов' },
            { key: 'opt3', label: 'В произвольном порядке ударным гайковёртом' },
            { key: 'opt4', label: 'Сначала угловые болты до 120 Н·м, затем центр' }
          ],
          correct: 'opt2',
          okMsg: 'Точно! Равномерная спиральная протяжка от центра к краям исключает деформацию прокладки и плоскости ГБЦ.',
          errMsg: 'Ошибка! Затяжка от краёв или гайковёртом коробит головку блока.'
        },
        ch3: {
          title: '3. Сопоставьте специнструмент с технологической операцией',
          pairs: [
            { id: 1, label: '1. Набор головок (socket_set)', correct: 'sock' },
            { id: 2, label: '2. Динамометрический ключ (torque_wrench)', correct: 'torq' },
            { id: 3, label: '3. Щуп измерительный (feeler_gauge)', correct: 'feel' },
            { id: 4, label: '4. Инспекционная лампа (inspect_lamp)', correct: 'lamp' }
          ],
          options: [
            { value: 'sock', label: 'Откручивание болтов клапанной крышки и крепежа' },
            { value: 'torq', label: 'Контролируемая протяжка болтов ГБЦ по моменту Н·м' },
            { value: 'feel', label: 'Замер теплового зазора клапанов и плоскости ГБЦ' },
            { value: 'lamp', label: 'Визуальная дефектовка зеркала цилиндра и поршней' }
          ]
        },
        ch4: {
          title: '4. Распределите детали и инструменты по узлам ДВС',
          zones: [
            { key: 'head', label: '1. Верхний узел ГБЦ' },
            { key: 'block', label: '2. ЦПГ и блок' },
            { key: 'tools', label: '3. Инструмент и контроль' }
          ],
          chips: [
            { id: 'c1', label: 'valve_cover', category: 'head' },
            { id: 'c2', label: 'camshaft_intake', category: 'head' },
            { id: 'c3', label: 'piston_1', category: 'block' },
            { id: 'c4', label: 'gasket_head', category: 'block' },
            { id: 'c5', label: 'torque_wrench', category: 'tools' },
            { id: 'c6', label: 'feeler_gauge', category: 'tools' }
          ]
        }
      }
    }
  };

  function normalizeSpecialty(slug) {
    const raw = String(slug || '').trim().toLowerCase();
    const map = { design: 'graphic_design', accounting: 'hvac', auto: 'autoelectric', marketing: 'automechanic' };
    const c = map[raw] || raw;
    return SPECIALTY_META[c] ? c : 'graphic_design';
  }

  function getTaskMeta(specialty, taskNumber) {
    const spec = normalizeSpecialty(specialty);
    const num = Math.max(1, Math.min(20, Number(taskNumber) || 1));
    const lessons = (window.EDU_LESSONS && window.EDU_LESSONS[spec]) || [];
    const lesson = lessons.find(l => Number(l.num) === num) || lessons[num - 1] || null;
    const base = SPECIALTY_META[spec];
    return {
      specialty: spec,
      taskNumber: num,
      base: base,
      title: lesson ? lesson.title : `${base.headerTitle} — Миссия #${num}`,
      description: lesson ? lesson.description : base.desc
    };
  }

  window.MISSION_CURRICULUM = MISSION_CURRICULUM;
  window.MissionRegistry = {
    SPECIALTY_META,
    MISSION_CURRICULUM,
    normalizeSpecialty,
    getTaskMeta
  };
})();
