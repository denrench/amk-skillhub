window.WorkshopModels = (() => {
  // 25 детальных 3D-моделей (по 5 на каждую из 5 профессий), привязанных ко всем 100 урокам + .glb ассеты
  const models = {
    // ================= IT / WEB DESIGN (5 моделей) =================
    'it-grid': {
      key: 'it-grid',
      course: 'it',
      title: 'Слои CSS-блока (Box Model & 8px Grid)',
      controlLabel: 'Разнос слоёв Box Model',
      controlUnit: '%',
      controlMin: 20,
      controlMax: 220,
      controlDefault: 100,
      telemetryFn: (v) => `Отступы: Padding ${Math.round(v * 0.16)}px · Margin ${Math.round(v * 0.24)}px · Сетка 8px синхронизирована`,
      parts: [
        ['Контент (Content)', 'Внутренняя область текста, изображений или видео (width × height).', 'box', [1.65, 0.22, 0.95], [0, 1.05, 0], 0xffd275],
        ['Внутренний отступ (Padding)', 'Прозрачный буфер между контентом и рамкой блока.', 'box', [2.4, 0.18, 1.5], [0, 0.72, 0], 0x86c6a5],
        ['Граница (Border)', 'Видимое или невидимое обрамление элемента (box-sizing: border-box).', 'box', [2.85, 0.16, 1.85], [0, 0.40, 0], 0x75adc3],
        ['Внешний отступ (Margin)', 'Дистанция снаружи границы до соседних элементов макета.', 'box', [3.5, 0.10, 2.3], [0, 0.10, 0], 0x8b8db9],
      ],
    },
    'it-server': {
      key: 'it-server',
      course: 'it',
      title: 'Стек клиент-серверной архитектуры (REST API + DB)',
      controlLabel: 'Нагрузка запросов (RPS)',
      controlUnit: ' RPS',
      controlMin: 50,
      controlMax: 1500,
      controlDefault: 450,
      telemetryFn: (v) => `Трафик: ${v} req/s · Латентность: ${Math.max(4, Math.round(45 - v * 0.02))} мс · HTTP 200 OK`,
      parts: [
        ['Клиент (Browser / Fetch)', 'Отправляет асинхронные HTTP-запросы и рендерит DOM.', 'box', [1.4, 0.85, 0.16], [-1.55, 0.85, 0], 0x38bdf8],
        ['API-шлюз (Flask / REST)', 'Проверяет сессию, RBAC-права и валидирует JSON.', 'cylinder', [0.44, 1.15], [0, 0.85, 0], 0x818cf8],
        ['База данных (SQLite / PG)', 'Хранит таблицы пользователей, уроков и XP-транзакций.', 'cylinder', [0.56, 0.98], [1.55, 0.75, 0], 0x10b981],
        ['Шина JSON-ответа', 'Передаёт параметризованные данные с кодами 200/403.', 'wave', [1], [0, 0.25, 0], 0xf59e0b],
      ],
      loop: true,
    },
    'it-dom': {
      key: 'it-dom',
      course: 'it',
      title: 'Дерево DOM и цикл событий JavaScript (Event Loop)',
      controlLabel: 'Частота событий UI',
      controlUnit: ' Гц',
      controlMin: 15,
      controlMax: 144,
      controlDefault: 60,
      telemetryFn: (v) => `Кадровая частота: ${v} FPS · Время кадра: ${(1000 / v).toFixed(1)} мс · Event Loop активен`,
      parts: [
        ['Document Root (<html>)', 'Корневой узел объектной модели документа.', 'sphere', [0.44], [0, 1.48, 0], 0x6366f1],
        ['Элемент Header (<nav>)', 'Навигационный узел с обработчиками событий.', 'box', [1.15, 0.30, 0.58], [-1.15, 0.78, 0], 0x22d3ee],
        ['Контейнер Main (<main>)', 'Динамическая зона рендеринга карточек Grid.', 'box', [1.22, 0.36, 0.68], [1.15, 0.78, 0], 0x10b981],
        ['Event Loop / Callback', 'Асинхронная очередь задач промисов и fetch().', 'torus', [0.58, 0.12], [0, 0.24, 0], 0xf472b6],
      ],
    },
    'it-webgl': {
      key: 'it-webgl',
      course: 'it',
      title: 'Конвейер WebGL / Three.js сцены и шейдеров',
      controlLabel: 'Интенсивность PBR-света',
      controlUnit: '%',
      controlMin: 30,
      controlMax: 220,
      controlDefault: 120,
      telemetryFn: (v) => `Свет сцены: ${v}% · Draw Calls: 12 · Шейдер PBR MeshStandardMaterial`,
      parts: [
        ['PerspectiveCamera', 'Точка обзора сцены с углом FOV и матрицей проекции.', 'cone', [0.42, 0.78], [-1.45, 0.95, 0], 0xfbbf24],
        ['Mesh (Geometry + PBR)', 'Трёхмерная сетка с материалом MeshStandardMaterial.', 'sphere', [0.56], [0, 0.88, 0], 0x38bdf8],
        ['Directional + Rim Light', 'Источники света, формирующие тени и блики.', 'sphere', [0.26], [1.35, 1.38, 0.6], 0xfef08a],
        ['WebGLRenderer Canvas', 'Буфер кадров с частотой 60 FPS через requestAnimationFrame.', 'box', [3.2, 0.12, 1.9], [0, 0.08, 0], 0x6366f1],
      ],
    },
    'it-security': {
      key: 'it-security',
      course: 'it',
      title: 'Эшелонированная защита Web-приложения (OWASP)',
      controlLabel: 'Интенсивность фильтрации WAF',
      controlUnit: '%',
      controlMin: 50,
      controlMax: 200,
      controlDefault: 100,
      telemetryFn: (v) => `Уровень защиты: ${v}% · CSRF + HttpOnly активны · XSS/SQLi заблокированы`,
      parts: [
        ['HttpOnly Session Cookie', 'Защищает токен сессии от чтения через document.cookie.', 'torus', [0.52, 0.14], [-1.35, 0.82, 0], 0x10b981],
        ['RBAC & Guard', 'Проверяет роль пользователя из БД на каждом маршруте.', 'box', [0.88, 1.18, 0.48], [0, 0.82, 0], 0x6366f1],
        ['escapeHtml() Sanitizer', 'Нейтрализует Stored XSS-теги перед вставкой в DOM.', 'box', [0.88, 0.88, 0.48], [1.35, 0.72, 0], 0x22d3ee],
        ['Parameterized SQL (?)', 'Блокирует SQL-инъекции на уровне драйвера БД.', 'cylinder', [0.48, 0.34], [0, 0.18, 0.95], 0xf59e0b],
      ],
    },

    // ================= GRAPHIC DESIGN (5 моделей) =================
    'design-packaging': {
      key: 'design-packaging',
      course: 'graphic_design',
      title: 'Конструктив и развёртка упаковки (Dieline 3D)',
      controlLabel: 'Раскрытие клапанов коробки',
      controlUnit: '%',
      controlMin: 0,
      controlMax: 180,
      controlDefault: 60,
      telemetryFn: (v) => `Раскрытие: ${v}% · Вылеты Bleed: 3 мм · Линии биговки и реза проверены`,
      parts: [
        ['Лицевая грань (Front)', 'Ключевая зона для логотипа, УТП и главного визуала.', 'box', [1.55, 1.42, 0.08], [0, 0.75, 0.58], 0xfbd275],
        ['Боковые грани (Sides)', 'Технический текст, штрихкод и проверка стыковки на сгибе.', 'box', [0.08, 1.42, 1.15], [0.78, 0.75, 0], 0x86c6a5],
        ['Верхний клапан (Flap)', 'Закрывающий элемент с линией биговки и замком.', 'box', [1.55, 0.08, 1.18], [0, 1.48, 0], 0x75adc3],
        ['Каркас коробки (Body)', 'Внутренний объём для проверки вылетов под обрез (Bleed).', 'box', [1.48, 1.38, 1.07], [0, 0.74, 0], 0x607a6b],
      ],
    },
    'design-color': {
      key: 'design-color',
      course: 'graphic_design',
      title: 'Цветовые пространства RGB и CMYK + Контраст',
      controlLabel: 'Спектральный баланс CMYK / RGB',
      controlUnit: '%',
      controlMin: 25,
      controlMax: 200,
      controlDefault: 100,
      telemetryFn: (v) => `Профиль: FOGRA39 (300 dpi) · TIL ≤ ${Math.min(300, Math.round(220 + v * 0.4))}% · Контраст WCAG AAA`,
      parts: [
        ['Спектральный куб RGB', 'Аддитивная модель для экранов (0–255, sRGB).', 'box', [0.88, 0.88, 0.88], [-1.18, 0.82, 0], 0x38bdf8],
        ['Печатный блок CMYK', 'Субтрактивная модель из 4 триадных красок (300 dpi).', 'box', [0.88, 0.88, 0.88], [1.18, 0.82, 0], 0xec4899],
        ['Цветовой круг Иттена', 'Гармония комплементарных и триадных сочетаний.', 'torus', [0.64, 0.15], [0, 0.86, 0], 0xfbbf24],
        ['Контраст WCAG AA', 'Опорная база читаемости с коэффициентом >= 4.5:1.', 'box', [3.1, 0.12, 1.6], [0, 0.1, 0], 0x334155],
      ],
    },
    'design-lighting': {
      key: 'design-lighting',
      course: 'graphic_design',
      title: 'Студийная схема трёхточечного 3D-освещения',
      controlLabel: 'Яркость рисующего света (Key Light)',
      controlUnit: '%',
      controlMin: 30,
      controlMax: 240,
      controlDefault: 120,
      telemetryFn: (v) => `Key Light: ${v}% · Fill Light: ${Math.round(v * 0.5)}% · Rim Light: ${Math.round(v * 0.75)}%`,
      parts: [
        ['Key Light (Рисующий)', 'Основной направленный свет, задающий объём и тени.', 'cone', [0.36, 0.68], [-1.5, 1.35, 0.9], 0xfef08a],
        ['Fill Light (Заполняющий)', 'Мягко высветляет глубокие тени на теневой стороне.', 'cone', [0.32, 0.56], [1.5, 0.95, 0.9], 0x93c5fd],
        ['Rim Light (Контровой)', 'Создаёт яркую световую кромку, отделяя силуэт от фона.', 'cone', [0.3, 0.56], [0, 1.55, -1.3], 0xc084fc],
        ['Объект съёмки (PBR)', 'Центральный 3D-объект с настроенным Roughness/Metalness.', 'sphere', [0.60], [0, 0.68, 0], 0xf472b6],
      ],
    },
    'design-typography': {
      key: 'design-typography',
      course: 'graphic_design',
      title: 'Модульная сетка и иерархия типографики',
      controlLabel: 'Интерлиньяж (Line-Height)',
      controlUnit: '%',
      controlMin: 100,
      controlMax: 200,
      controlDefault: 145,
      telemetryFn: (v) => `Интерлиньяж: ${(v / 100).toFixed(2)} · Модульный ритм 8px · Длина строки 60 симв.`,
      parts: [
        ['Заголовок H1 (Display)', 'Крупный акцидентный якорь, задающий фокус внимания.', 'box', [2.5, 0.34, 0.36], [0, 1.45, 0], 0xf59e0b],
        ['Подзаголовок H2', 'Направляющий уровень для быстрого сканирования.', 'box', [1.9, 0.22, 0.36], [-0.3, 1.0, 0], 0x38bdf8],
        ['Наборный текст (Body)', 'Комфортный интерлиньяж 1.4–1.6 и длина строки 60 симв.', 'box', [2.2, 0.45, 0.36], [0, 0.48, 0], 0x94a3b8],
        ['Модульный шаг 8px', 'Базовая линейка выравнивания отступов и интервалов.', 'box', [3.2, 0.08, 1.5], [0, 0.06, 0], 0x6366f1],
      ],
    },
    'design-brand': {
      key: 'design-brand',
      course: 'graphic_design',
      title: 'Экосистема брендбука и дизайн-токенов',
      controlLabel: 'Охранное поле логотипа (X)',
      controlUnit: '%',
      controlMin: 50,
      controlMax: 200,
      controlDefault: 100,
      telemetryFn: (v) => `Охранное поле: ${(v / 100).toFixed(1)}X · SVG-масштабируемость 100% · Брендбук синхронизирован`,
      parts: [
        ['Мастер-логотип (SVG)', 'Векторный знак с охранным полем (Clear Space).', 'torus', [0.50, 0.16], [0, 1.25, 0], 0x6366f1],
        ['UI-Токены (Variables)', 'Семантические цвета и радиусы для Figma и веба.', 'box', [0.95, 0.75, 0.28], [-1.35, 0.65, 0], 0x22d3ee],
        ['Носитель / Мокап', 'Реалистичная презентация айдентики через Smart Object.', 'cylinder', [0.42, 0.95], [1.35, 0.65, 0], 0x10b981],
        ['Фирменный паттерн', 'Объединяющая графическая подложка всех носителей.', 'box', [3.2, 0.1, 1.7], [0, 0.08, 0], 0xec4899],
      ],
    },

    // ================= AUTOELECTRIC (5 моделей) =================
    'autoel-can': {
      key: 'autoel-can',
      course: 'autoelectric',
      title: 'Дифференциальная шина CAN-Bus (High / Low)',
      controlLabel: 'Скорость обмена пакета CAN',
      controlUnit: ' кбит/с',
      controlMin: 125,
      controlMax: 1000,
      controlDefault: 500,
      telemetryFn: (v) => `CAN High: 3.5В · CAN Low: 1.5В · Сопротивление цепи: 60 Ом · Скорость ${v} кбит/с`,
      parts: [
        ['Узел ЭБУ двигателя (ECU)', 'Ведущий контроллер впрыска, зажигания и датчиков.', 'box', [0.80, 0.68, 0.80], [-1.65, 0.52, 0], 0x86c6a5],
        ['Линия CAN High', 'Витой провод (2.5В -> 3.5В в доминанте).', 'wave', [1], [0, 0.68, 0.16], 0xfbd275],
        ['Линия CAN Low', 'Зеркальный витой провод (2.5В -> 1.5В в доминанте).', 'wave', [-1], [0, 0.42, -0.16], 0x75adc3],
        ['Блок ABS / BCM + Терминатор', 'Согласующий резистор 120 Ом (суммарно 60 Ом в цепи).', 'box', [0.80, 0.68, 0.80], [1.65, 0.52, 0], 0x38bdf8],
      ],
      loop: true,
    },
    'autoel-ignition': {
      key: 'autoel-ignition',
      course: 'autoelectric',
      title: 'Индивидуальная катушка зажигания (COP) и свеча',
      controlLabel: 'Время накопления (Dwell Time)',
      controlUnit: 'дес. мс',
      controlMin: 15,
      controlMax: 45,
      controlDefault: 28,
      telemetryFn: (v) => `Накопление: ${(v / 10).toFixed(1)} мс · Пробивное напряжение: ${Math.round(14 + v * 0.45)} кВ · Искра стабильна`,
      parts: [
        ['Силовой ключ IGBT / Разъём', 'Принимает управляющий импульс от ЭБУ (+12В / GND / SIG).', 'box', [0.78, 0.36, 0.78], [0, 1.55, 0], 0x6366f1],
        ['Первичная и вторичная обмотка', 'Повышающий трансформатор до 25–35 кВ.', 'cylinder', [0.30, 0.78], [0, 1.0, 0], 0xf59e0b],
        ['Высоковольтный изолятор', 'Защищает наконечник от пробоя на корпус колодца.', 'cylinder', [0.21, 0.52], [0, 0.42, 0], 0xe2e8f0],
        ['Свеча зажигания и зазор', 'Формирует искровой разряд длительностью 1.0–1.8 мс.', 'cone', [0.17, 0.34], [0, 0.08, 0], 0x38bdf8],
      ],
    },
    'autoel-sensors': {
      key: 'autoel-sensors',
      course: 'autoelectric',
      title: 'Синхронизация ДПКВ (Индуктивный) и ДПРВ (Холла)',
      controlLabel: 'Частота вращения шкива 60-2',
      controlUnit: ' об/мин',
      controlMin: 600,
      controlMax: 4500,
      controlDefault: 1200,
      telemetryFn: (v) => `Обороты: ${v} об/мин · Амплитуда ДПКВ: ${(3.5 + v * 0.0025).toFixed(1)} В AC · Меандр ДПРВ: 0–5.0 В`,
      parts: [
        ['Задающий диск 60-2', 'Маховик с пропуском 2 зубьев для отсчёта ВМТ.', 'torus', [0.68, 0.16], [-1.0, 0.75, 0], 0x94a3b8],
        ['Индуктивный ДПКВ', 'Генерирует переменный синусоидальный сигнал (AC).', 'cylinder', [0.18, 0.65], [-1.0, 0.75, 0.82], 0xf59e0b],
        ['Датчик Холла (ДПРВ)', 'Выдаёт чёткий прямоугольный меандр 0–5 В по фазе ГРМ.', 'box', [0.55, 0.45, 0.45], [1.15, 0.85, 0], 0x22d3ee],
        ['Линия осциллографа', 'Сравнивает совпадение фронтов двух каналов в реальном времени.', 'wave', [1.2], [0, 0.22, 0], 0x10b981],
      ],
    },
    'autoel-charging': {
      key: 'autoel-charging',
      course: 'autoelectric',
      title: 'Цепь генератора, АКБ и стартера (12.6В / 14.4В)',
      controlLabel: 'Ток отдачи генератора',
      controlUnit: ' А',
      controlMin: 15,
      controlMax: 120,
      controlDefault: 55,
      telemetryFn: (v) => `Ток заряда: ${v} А · Напряжение B+: ${(14.45 - v * 0.004).toFixed(2)} В · Падение напряжения: 0.08 В`,
      parts: [
        ['Аккумуляторная батарея (АКБ)', 'Источник 12.6В в покое и буфер бортовой сети.', 'box', [0.95, 0.75, 0.68], [-1.5, 0.48, 0], 0x334155],
        ['Генератор с регулятором', 'Вырабатывает 13.8–14.5В для питания и заряда.', 'cylinder', [0.46, 0.62], [0, 0.65, 0], 0x38bdf8],
        ['Стартер с втягивающим реле', 'Потребляет высокий пусковой ток от клеммы 30 и 50.', 'cylinder', [0.34, 0.85], [1.5, 0.48, 0], 0xfbbf24],
        ['Силовая шина B+ и масса', 'Главный силовой контур; норма падения < 0.2 В.', 'wave', [0.8], [0, 0.15, 0.6], 0xef4444],
      ],
      loop: true,
    },
    'autoel-hv': {
      key: 'autoel-hv',
      course: 'autoelectric',
      title: 'Высоковольтный контур электромобиля (400V HV)',
      controlLabel: 'Частота ШИМ инвертора IGBT',
      controlUnit: ' кГц',
      controlMin: 4,
      controlMax: 20,
      controlDefault: 10,
      telemetryFn: (v) => `Шина HV: 396 В DC · Частота IGBT: ${v} кГц · Сопротивление изоляции > 500 МОм`,
      parts: [
        ['Тяговая батарея (ВВБ 400В)', 'Содержит чеку безопасности Service Plug.', 'box', [1.45, 0.44, 0.95], [-1.15, 0.35, 0], 0xf97316],
        ['Инвертор (DC -> 3-Phase AC)', 'Управляет тяговым электродвигателем через IGBT-ключи.', 'box', [0.95, 0.65, 0.75], [0.4, 0.65, 0], 0x6366f1],
        ['DC-DC преобразователь', 'Понижает 400В в 14В для зарядки обычной АКБ.', 'box', [0.7, 0.45, 0.6], [1.55, 0.45, 0], 0x22d3ee],
        ['Оранжевый HV-жгут', 'Стандартизованная маркировка цепей высокого напряжения.', 'wave', [1.1], [0, 0.95, 0], 0xf97316],
      ],
    },

    // ================= HVAC (5 моделей) =================
    'hvac-cycle': {
      key: 'hvac-cycle',
      course: 'hvac',
      title: 'Термодинамический контур холодильной машины',
      controlLabel: 'Производительность компрессора',
      controlUnit: '%',
      controlMin: 30,
      controlMax: 160,
      controlDefault: 100,
      telemetryFn: (v) => `Всасывание LP: ${(1.9 + v * 0.003).toFixed(1)} бар · Нагнетание HP: ${(11.5 + v * 0.025).toFixed(1)} бар · Superheat ΔT = 6.2 K`,
      parts: [
        ['Компрессор', 'Сжимает пары хладагента, повышая давление и температуру.', 'cylinder', [0.38, 0.74], [-1.3, 0.48, 0.75], 0xfbd275],
        ['Конденсатор', 'Отводит тепло в окружающую среду, газ переходит в жидкость.', 'box', [0.70, 0.76, 0.84], [-1.3, 0.48, -0.75], 0xe48a72],
        ['Дроссель (ТРВ / ЭРВ)', 'Резко снижает давление перед входом в испаритель.', 'cylinder', [0.20, 0.38], [1.3, 0.35, -0.75], 0x86c6a5],
        ['Испаритель', 'Хладагент кипит при низкой температуре, забирая тепло.', 'box', [0.72, 0.64, 0.84], [1.3, 0.48, 0.75], 0x75adc3],
      ],
      loop: true,
    },
    'hvac-inverter': {
      key: 'hvac-inverter',
      course: 'hvac',
      title: 'Инверторный BLDC-компрессор и плата IPM',
      controlLabel: 'Частота вращения инвертора',
      controlUnit: ' Гц',
      controlMin: 25,
      controlMax: 120,
      controlDefault: 65,
      telemetryFn: (v) => `Частота BLDC: ${v} Гц · Обмотки U-V-W: 1.8 Ом (симметрия) · Ток IPM: ${(2.1 + v * 0.04).toFixed(1)} А`,
      parts: [
        ['Клеммная коробка (U, V, W)', 'Три симметричные фазные обмотки статора.', 'box', [0.75, 0.3, 0.75], [0, 1.38, 0], 0x38bdf8],
        ['Спиральный блок (Scroll)', 'Сжимает хладагент без пульсаций и высокого пускового тока.', 'cylinder', [0.54, 0.95], [0, 0.75, 0], 0x818cf8],
        ['Силовой модуль IPM', 'Преобразует постоянный ток в регулируемую частоту 3 фаз.', 'box', [0.95, 0.25, 0.65], [-1.35, 0.45, 0], 0x10b981],
        ['Фильтр-осушитель и докипатель', 'Задерживает влагу и жидкий фреон на линии всасывания.', 'cylinder', [0.28, 0.68], [1.35, 0.55, 0], 0xf59e0b],
      ],
    },
    'hvac-vrf': {
      key: 'hvac-vrf',
      course: 'hvac',
      title: 'Трасса VRF / VRV с рефнетом и маслоподъёмом',
      controlLabel: 'Открытие вентиля ЭРВ',
      controlUnit: ' имп.',
      controlMin: 60,
      controlMax: 480,
      controlDefault: 240,
      telemetryFn: (v) => `Позиция ЭРВ: ${v} pls · Возврат масла стабилен · Баланс рефнета 50/50`,
      parts: [
        ['Наружный блок VRF', 'Инверторный агрегат переменной производительности.', 'box', [1.1, 1.2, 0.75], [-1.5, 0.65, 0], 0x64748b],
        ['Медный рефнет (Y-тройник)', 'Устанавливается горизонтально для деления потока.', 'cone', [0.28, 0.58], [0, 0.68, 0], 0xf59e0b],
        ['Внутренние блоки (Fancoil)', 'Поддерживают заданную температуру в каждой зоне.', 'box', [0.9, 0.42, 0.55], [1.45, 1.05, -0.5], 0x38bdf8],
        ['Маслоподъёмная петля', 'Возвращает компрессорное масло с вертикального стояка.', 'torus', [0.36, 0.08], [0, 0.25, 0.75], 0x10b981],
      ],
      loop: true,
    },
    'hvac-chiller': {
      key: 'hvac-chiller',
      course: 'hvac',
      title: 'Чиллер и пластинчатый теплообменник (Гликоль)',
      controlLabel: 'Скорость протока теплоносителя',
      controlUnit: ' м³/ч',
      controlMin: 2,
      controlMax: 18,
      controlDefault: 8,
      telemetryFn: (v) => `Проток: ${v} м³/ч · Вход/Выход воды: +12°C / +7°C · Реле протока замкнуто (ОК)`,
      parts: [
        ['Пластинчатый теплообменник', 'Разделяет фреоновый и водяной контуры; боится заморозки.', 'box', [0.95, 0.95, 0.65], [0, 0.68, 0], 0x38bdf8],
        ['Реле протока (Flow Switch)', 'Аварийная защита: запрещает пуск без циркуляции воды.', 'cylinder', [0.22, 0.55], [-1.3, 0.65, 0], 0xef4444],
        ['Циркуляционный насос', 'Прокачивает раствор этилен-/пропиленгликоля.', 'sphere', [0.42], [1.3, 0.55, 0], 0x10b981],
        ['Расширительный мембранный бак', 'Компенсирует тепловое расширение теплоносителя.', 'cylinder', [0.34, 0.62], [1.3, 0.55, -0.95], 0xf59e0b],
      ],
    },
    'hvac-service': {
      key: 'hvac-service',
      course: 'hvac',
      title: 'Вакуумный пост, манометрия и станция рекуперации',
      controlLabel: 'Глубина вакуумирования',
      controlUnit: '%',
      controlMin: 20,
      controlMax: 200,
      controlDefault: 120,
      telemetryFn: (v) => `Вакуум: ${Math.max(180, Math.round(950 - v * 3.8))} микрон · Масса на весах: ${(v * 1.2).toFixed(0)} г · Контур герметичен`,
      parts: [
        ['Манометрический коллектор', 'Контроль высокого (HP) и низкого (LP) давления в бар/psi.', 'box', [0.95, 0.55, 0.3], [0, 1.15, 0], 0xef4444],
        ['Вакуумный насос + Вакуумметр', 'Удаляет воздух и влагу до уровня < 500 микрон.', 'cylinder', [0.42, 0.65], [-1.35, 0.48, 0], 0x38bdf8],
        ['Баллон хладагента на весах', 'Заправка по весам (и сбор не более 80% объёма).', 'cylinder', [0.38, 0.85], [1.35, 0.55, 0], 0x10b981],
        ['Электронные весы (точность 5г)', 'Контролируют массу заправленного или собранного фреона.', 'box', [0.95, 0.14, 0.95], [1.35, 0.08, 0], 0x94a3b8],
      ],
    },

    // ================= AUTOMECHANIC (5 моделей) =================
    'mech-cylinder': {
      key: 'mech-cylinder',
      course: 'automechanic',
      title: 'Разрез цилиндра 4-тактного ДВС и механизм ГРМ',
      controlLabel: 'Обороты коленвала ДВС',
      controlUnit: ' об/мин',
      controlMin: 750,
      controlMax: 5500,
      controlDefault: 1800,
      telemetryFn: (v) => `Обороты: ${v} об/мин · Компрессия: 13.4 бар · Тепловой зазор клапанов: 0.25 мм`,
      parts: [
        ['Стенка цилиндра (с хоном)', 'Рабочая гильза; сетка хона удерживает масляную плёнку.', 'cut', [0.75, 1.65], [0, 0.95, 0], 0x75adc3],
        ['Поршень с кольцами', 'Совершает возвратно-поступательное движение от ВМТ к НМТ.', 'cylinder', [0.58, 0.32], [0, 0.68, 0], 0xfbd275],
        ['Впускной клапан', 'Подаёт воздух/смесь в цилиндр на такте впуска.', 'cylinder', [0.13, 0.46], [-0.30, 1.75, 0], 0x86c6a5],
        ['Выпускной клапан', 'Выводит отработавшие газы на такте выпуска.', 'cylinder', [0.13, 0.46], [0.30, 1.75, 0], 0xe48a72],
      ],
    },
    'mech-turbo': {
      key: 'mech-turbo',
      course: 'automechanic',
      title: 'Турбокомпрессор и контур интеркулера',
      controlLabel: 'Обороты ротора турбины',
      controlUnit: ' тыс. об',
      controlMin: 20,
      controlMax: 160,
      controlDefault: 95,
      telemetryFn: (v) => `Ротор CHRA: ${v} 000 об/мин · Давление наддува: ${(0.4 + v * 0.01).toFixed(2)} бар · Осевой люфт: 0.00 мм`,
      parts: [
        ['Горячая улитка (Турбина)', 'Раскручивается выхлопными газами до 150 000 об/мин.', 'torus', [0.46, 0.22], [-0.95, 0.85, 0], 0xef4444],
        ['Картридж и вал (CHRA)', 'Смазывается под давлением масла; осевой люфт недопустим.', 'cylinder', [0.22, 0.85], [0, 0.85, 0], 0xfbbf24],
        ['Холодная улитка (Компрессор)', 'Сжимает свежий воздух и подаёт его в интеркулер.', 'torus', [0.48, 0.22], [0.95, 0.85, 0], 0x38bdf8],
        ['Интеркулер (Радиатор наддува)', 'Охлаждает сжатый воздух для повышения плотности.', 'box', [1.85, 0.52, 0.32], [0, 0.25, 0.85], 0x94a3b8],
      ],
      loop: true,
    },
    'mech-transmission': {
      key: 'mech-transmission',
      course: 'automechanic',
      title: 'Трансмиссия: гидротрансформатор, планетарка и сцепление',
      controlLabel: 'Передаточное отношение / Момент',
      controlUnit: '%',
      controlMin: 30,
      controlMax: 200,
      controlDefault: 100,
      telemetryFn: (v) => `Давление ATF: ${(4.2 + v * 0.02).toFixed(1)} бар · Температура ATF: +42°C · Блокировка ГДТ замкнута`,
      parts: [
        ['Гидротрансформатор / Сцепление', 'Передаёт крутящий момент от маховика ДВС.', 'cylinder', [0.62, 0.38], [-1.35, 0.72, 0], 0xf59e0b],
        ['Планетарный редуктор', 'Меняет передаточные числа с помощью пакетов фрикционов.', 'torus', [0.55, 0.18], [0, 0.72, 0], 0x38bdf8],
        ['Поддон с магнитами ATF', 'Улавливает металлическую пыль; уровень меряется при +40°C.', 'box', [1.6, 0.22, 1.0], [0, 0.14, 0], 0x64748b],
        ['Дифференциал и полуоси', 'Распределяет момент между ведущими колёсами.', 'sphere', [0.44], [1.35, 0.72, 0], 0x10b981],
      ],
    },
    'mech-suspension': {
      key: 'mech-suspension',
      course: 'automechanic',
      title: 'Подвеска МакФерсон и углы установки колёс (УУК)',
      controlLabel: 'Ход сжатия стойки подвески',
      controlUnit: ' мм',
      controlMin: 10,
      controlMax: 120,
      controlDefault: 45,
      telemetryFn: (v) => `Ход стойки: ${v} мм · Развал (Camber): -0°30' · Схождение (Toe): +0°08' (Норма)`,
      parts: [
        ['Амортизаторная стойка + Пружина', 'Задаёт продольный угол наклона оси поворота (Кастер).', 'cylinder', [0.22, 1.35], [0, 0.92, 0], 0x38bdf8],
        ['Поворотный кулак и ступица', 'Узел крепления колеса, тормозного диска и подшипника.', 'box', [0.55, 0.55, 0.55], [0.55, 0.52, 0], 0x94a3b8],
        ['Колесо (Развал / Схождение)', 'Углы Camber и Toe определяют износ протектора.', 'torus', [0.55, 0.18], [1.25, 0.58, 0], 0x334155],
        ['Нижний рычаг и шаровая опора', 'Проверяется на люфт до установки 3D-мишеней УУК.', 'box', [1.3, 0.14, 0.35], [-0.45, 0.22, 0], 0x10b981],
      ],
    },
    'mech-brakes': {
      key: 'mech-brakes',
      course: 'automechanic',
      title: 'Тормозная система: вентилируемый диск и суппорт',
      controlLabel: 'Давление в контуре DOT-4',
      controlUnit: ' бар',
      controlMin: 10,
      controlMax: 140,
      controlDefault: 65,
      telemetryFn: (v) => `Давление торможения: ${v} бар · Остаток диска: 24.2 мм · Биение: 0.02 мм (В допуске)`,
      parts: [
        ['Вентилируемый тормозной диск', 'Проверяется микрометром на толщину и биение.', 'cylinder', [0.78, 0.14], [0, 0.75, 0], 0x94a3b8],
        ['Тормозной суппорт и поршень', 'Направляющие пальцы смазываются высокотемпературной смазкой.', 'box', [0.48, 0.65, 0.45], [0.65, 0.85, 0], 0xef4444],
        ['Тормозные колодки', 'Фрикционные накладки с индикатором износа.', 'box', [0.35, 0.52, 0.22], [0.28, 0.85, 0], 0xfbbf24],
        ['Магистраль DOT-4 + ABS', 'Прокачивается при замене, проверяется на содержание влаги.', 'wave', [0.9], [-0.95, 0.55, 0], 0x22d3ee],
      ],
    },
  };

  const COURSE_MODEL_KEYS = {
    it: ['it-grid', 'it-server', 'it-dom', 'it-webgl', 'it-security'],
    graphic_design: ['design-packaging', 'design-color', 'design-lighting', 'design-typography', 'design-brand'],
    autoelectric: ['autoel-can', 'autoel-ignition', 'autoel-sensors', 'autoel-charging', 'autoel-hv'],
    hvac: ['hvac-cycle', 'hvac-inverter', 'hvac-vrf', 'hvac-chiller', 'hvac-service'],
    automechanic: ['mech-cylinder', 'mech-turbo', 'mech-transmission', 'mech-suspension', 'mech-brakes'],
  };

  function resolveModelKey(slug, orderNum) {
    const n = Number(orderNum) || 1;
    if (slug === 'it') {
      if (n <= 5 || n === 7 || n === 13) return 'it-grid';
      if (n === 6 || n === 8 || n === 9 || n === 15) return 'it-dom';
      if (n === 14 || n === 18) return 'it-webgl';
      if (n === 17) return 'it-security';
      return 'it-server';
    }
    if (slug === 'graphic_design') {
      if (n === 8 || n === 17) return 'design-packaging';
      if (n === 2 || n === 7 || n === 19) return 'design-color';
      if (n === 15 || n === 16) return 'design-lighting';
      if (n === 1 || n === 3 || n === 6 || n === 14) return 'design-typography';
      return 'design-brand';
    }
    if (slug === 'autoelectric') {
      if (n === 8 || n === 15 || n === 20) return 'autoel-can';
      if (n === 6 || n === 14) return 'autoel-ignition';
      if (n === 4 || n === 7 || n === 13 || n === 16) return 'autoel-sensors';
      if (n === 19) return 'autoel-hv';
      return 'autoel-charging';
    }
    if (slug === 'hvac') {
      if (n <= 4 || n === 15 || n === 17) return 'hvac-cycle';
      if (n === 13) return 'hvac-vrf';
      if (n === 14 || n === 18) return 'hvac-inverter';
      if (n === 16) return 'hvac-chiller';
      return 'hvac-service';
    }
    if (slug === 'automechanic') {
      if (n <= 4 || n === 17 || n === 18 || n === 20) return 'mech-cylinder';
      if (n === 13 || n === 14 || n === 19) return 'mech-turbo';
      if (n === 5 || n === 6 || n === 15) return 'mech-transmission';
      if (n === 7 || n === 8 || n === 11 || n === 16) return 'mech-suspension';
      return 'mech-brakes';
    }
    return 'it-grid';
  }

  function geometry(T, shape, params) {
    if (shape === 'box') return new T.BoxGeometry(...params);
    if (shape === 'cylinder') return new T.CylinderGeometry(params[0], params[0], params[1], 32);
    if (shape === 'cut') return new T.CylinderGeometry(params[0], params[0], params[1], 32, 1, true, Math.PI / 2, Math.PI);
    if (shape === 'sphere') return new T.SphereGeometry(params[0], 28, 24);
    if (shape === 'torus') return new T.TorusGeometry(params[0], params[1], 18, 48);
    if (shape === 'cone') return new T.ConeGeometry(params[0], params[1], 28);
    if (shape === 'ring') return new T.RingGeometry(params[0], params[1], 32);
    const amp = params[0] || 1;
    const curve = new T.CatmullRomCurve3(Array.from({ length: 40 }, (_, i) =>
      new T.Vector3(-1.35 + i * 0.07, Math.sin(i * 0.48) * 0.16 * amp, Math.cos(i * 0.48) * 0.16 * amp)));
    return new T.TubeGeometry(curve, 48, 0.048, 10, false);
  }

  // Создаёт процедурную техническую текстуру с сеткой, маркировкой и бликами
  function createPartTexture(T, label, hexColor, idx) {
    try {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      const r = (hexColor >> 16) & 255;
      const g = (hexColor >> 8) & 255;
      const b = hexColor & 255;
      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, `rgb(${Math.min(255, r + 28)}, ${Math.min(255, g + 28)}, ${Math.min(255, b + 28)})`);
      grad.addColorStop(1, `rgb(${Math.max(15, r - 35)}, ${Math.max(15, g - 35)}, ${Math.max(15, b - 35)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Инженерная микро-сетка и технологические полосы
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 256; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(256, x); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(15,23,42,0.35)';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 240, 240);

      // Номер узла на грани
      ctx.fillStyle = 'rgba(15,23,42,0.55)';
      ctx.fillRect(16, 16, 62, 30);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`#0${idx + 1}`, 26, 37);

      const tex = new T.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    } catch {
      return null;
    }
  }

  // Создаёт 3D-спрайт выноски с номером и названием узла
  function createCalloutSprite(T, idx, label, hexColor) {
    try {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 68;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
      ctx.strokeStyle = '#' + hexColor.toString(16).padStart(6, '0');
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(4, 4, 312, 60, 14);
      else ctx.rect(4, 4, 312, 60);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#' + hexColor.toString(16).padStart(6, '0');
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`${idx + 1}.`, 18, 41);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 19px sans-serif';
      const shortText = label.length > 21 ? label.slice(0, 20) + '…' : label;
      ctx.fillText(shortText, 50, 41);

      const tex = new T.CanvasTexture(c);
      const mat = new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
      const sprite = new T.Sprite(mat);
      sprite.scale.set(1.35, 0.29, 1);
      return sprite;
    } catch {
      return null;
    }
  }

  // Добавляет детализирующие суб-элементы к каждой детали, чтобы модель выглядела как реальный инженерный узел
  function attachSubAssemblyDetail(T, parentGroup, label, shape, params, hexColor) {
    const accentMat = new T.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.75,
      roughness: 0.22
    });
    const glowMat = new T.MeshBasicMaterial({ color: hexColor });

    if (shape === 'cylinder') {
      const r = params[0] || 0.35;
      const h = params[1] || 0.7;
      for (let i = -1; i <= 1; i += 2) {
        const ring = new T.Mesh(new T.TorusGeometry(r * 1.04, Math.max(0.018, r * 0.06), 12, 28), accentMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = i * (h * 0.36);
        parentGroup.add(ring);
      }
    } else if (shape === 'box') {
      const [w, h, d] = params;
      const frame = new T.Mesh(
        new T.BoxGeometry(w * 1.02, h * 1.02, d * 1.02),
        new T.MeshBasicMaterial({ color: hexColor, wireframe: true, transparent: true, opacity: 0.28 })
      );
      parentGroup.add(frame);
      // Светодиодные индикаторы / крепёжные болты по углам
      const ledGeo = new T.SphereGeometry(Math.min(0.045, Math.min(w, h) * 0.12), 10, 10);
      [[-1, 1], [1, 1]].forEach(([sx, sy]) => {
        const pin = new T.Mesh(ledGeo, glowMat);
        pin.position.set(sx * (w * 0.42), sy * (h * 0.32), d * 0.52);
        parentGroup.add(pin);
      });
    } else if (shape === 'sphere') {
      const r = params[0] || 0.45;
      const orbit = new T.Mesh(new T.TorusGeometry(r * 1.28, 0.018, 12, 36), glowMat);
      orbit.rotation.x = Math.PI / 3;
      parentGroup.add(orbit);
    }
  }

  function show(canvas, definition, options = {}) {
    if (!definition || !canvas) return undefined;
    let activeDef = definition;
    const courseSlug = options.courseSlug || activeDef.course || 'it';
    const courseKeys = COURSE_MODEL_KEYS[courseSlug] || [];
    const allowModelSwitch = Boolean(options.allowModelSwitch && courseKeys.length > 1);

    let innerCleanup = null;

    function mountModel(def) {
      if (innerCleanup) {
        try { innerCleanup(); } catch {}
        innerCleanup = null;
      }
      activeDef = def;
      const { title, parts } = def;
      const modelKey = def.key || 'it-grid';
      const ctrlLabel = def.controlLabel || 'Интенсивность режима';
      const ctrlUnit = def.controlUnit || '%';
      const ctrlMin = def.controlMin ?? 20;
      const ctrlMax = def.controlMax ?? 200;
      const ctrlDef = def.controlDefault ?? 100;

      const switcherHtml = allowModelSwitch ? `
        <div class="wm-model-switcher" role="group" aria-label="Выбор 3D-модели курса" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
          ${courseKeys.map((k, idx) => {
            const m = models[k];
            const isAct = k === modelKey;
            return `<button type="button" class="starter-button" data-switch-model="${k}" aria-pressed="${isAct}" style="font-size:11px;padding:5px 10px;">3D #${idx + 1}: ${m.title.split(':')[0].slice(0, 26)}</button>`;
          }).join('')}
        </div>
      ` : '';

      canvas.innerHTML = `
        <section class="starter-panel workshop-model-panel">
          <div class="starter-heading">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <span>ИНТЕРАКТИВНАЯ 3D-МОДЕЛЬ УЗЛА · WEBGL + GLTF 2.0</span>
              <a href="assets/models/${modelKey}.glb" download="${modelKey}.glb" class="starter-button" style="text-decoration:none;font-size:11px;padding:4px 10px;display:inline-flex;align-items:center;gap:4px;">⬇ Скачать 3D (.glb)</a>
            </div>
            <h2>${title}</h2>
            <p>Вращайте мышью на 360°, масштабируйте колесом, управляйте телеметрией узла или выбирайте деталь из списка.</p>
            ${switcherHtml}
          </div>
          <div class="starter-grid">
            <div>
              <div class="workshop-visual" aria-label="${title}" style="cursor:grab; touch-action:none; position:relative;" hidden></div>
              <div class="starter-view" role="group" aria-label="Управление 3D-видом" hidden>
                <button type="button" class="starter-button" data-angle="-1">⟲ Влево</button>
                <button type="button" class="starter-button" data-angle="1">⟳ Вправо</button>
                <button type="button" class="starter-button" data-cam="top">Сверху</button>
                <button type="button" class="starter-button" data-action="explode" aria-pressed="false">Взрыв-схема</button>
                <button type="button" class="starter-button" data-action="wireframe" aria-pressed="false">Рентген</button>
                <button type="button" class="starter-button" data-action="labels" aria-pressed="true">3D-Метки</button>
                <button type="button" class="starter-button" data-action="autorotate" aria-pressed="true">Авто</button>
                <button type="button" class="starter-button" data-angle="0">Сброс</button>
              </div>
              <div class="wm-telemetry-bar" style="margin-top:10px;padding:10px 14px;border-radius:14px;background:rgba(15,23,42,0.75);border:1px solid rgba(56,189,248,0.25);display:flex;flex-direction:column;gap:6px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;">
                  <label for="wm-sim-range" style="font-weight:700;color:#e2e8f0;">🎛️ ${ctrlLabel}:</label>
                  <strong id="wm-sim-val" style="color:#38bdf8;font-family:monospace;">${ctrlDef}${ctrlUnit}</strong>
                </div>
                <input id="wm-sim-range" type="range" min="${ctrlMin}" max="${ctrlMax}" value="${ctrlDef}" style="width:100%;accent-color:#38bdf8;cursor:pointer;">
                <div id="wm-telemetry-readout" style="font-size:11px;color:#a5f3fc;font-family:monospace;">⚡ ${def.telemetryFn ? def.telemetryFn(ctrlDef) : 'Телеметрия в норме'}</div>
              </div>
            </div>
            <aside class="starter-sidebar" aria-label="Элементы модели">
              ${parts.map(([label], i) => `<button type="button" class="starter-button" data-part="${i}" aria-pressed="false">${i + 1}. ${label}</button>`).join('')}
              <p role="status">Выберите элемент из списка или кликните прямо по 3D-детали на сцене, чтобы изучить её назначение.</p>
            </aside>
          </div>
        </section>`;

      if (allowModelSwitch) {
        canvas.querySelectorAll('[data-switch-model]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const targetKey = btn.getAttribute('data-switch-model');
            if (models[targetKey] && targetKey !== modelKey) {
              mountModel(models[targetKey]);
            }
          });
        });
      }

      const stage = canvas.querySelector('.workshop-visual');
      const toolbar = canvas.querySelector('.starter-view');
      const status = canvas.querySelector('[role="status"]');
      const buttons = canvas.querySelectorAll('[data-part]');
      const simRange = canvas.querySelector('#wm-sim-range');
      const simVal = canvas.querySelector('#wm-sim-val');
      const simReadout = canvas.querySelector('#wm-telemetry-readout');

      let simMultiplier = 1.0;
      if (simRange) {
        simRange.addEventListener('input', () => {
          const v = Number(simRange.value);
          simMultiplier = Math.max(0.2, v / Math.max(1, ctrlDef));
          if (simVal) simVal.textContent = `${v}${ctrlUnit}`;
          if (simReadout && def.telemetryFn) {
            simReadout.textContent = `⚡ ${def.telemetryFn(v)}`;
          }
        });
      }

      const T = window.THREE;
      let renderer;
      try {
        if (T) renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      } catch {}
      if (!renderer) {
        status.textContent = 'WebGL недоступен. Выберите элемент из списка, чтобы прочитать описание.';
      }

      let meshes = [];
      let partGroups = [];
      let labelSprites = [];
      let selectedIndex = -1;

      const selectPart = (idx) => {
        selectedIndex = idx;
        buttons.forEach((peer, bi) => peer.setAttribute('aria-pressed', String(bi === idx)));
        if (parts[idx]) {
          status.textContent = `Узел #${idx + 1} (${parts[idx][0]}): ${parts[idx][1]}`;
        }
      };

      if (renderer) {
        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(40, 1, 0.1, 45);

        const key = new T.DirectionalLight(0xffffff, 1.5);
        key.position.set(3.5, 5.5, 4.5);
        const rim = new T.PointLight(0x38bdf8, 1.35, 18);
        rim.position.set(-3.5, 2.5, -3.5);
        const warm = new T.PointLight(0xf59e0b, 0.75, 15);
        warm.position.set(2.5, -1.5, 3.0);
        scene.add(key, rim, warm, new T.HemisphereLight(0xe0e7ff, 0x0f172a, 1.05));

        const grid = new T.GridHelper(6.5, 14, 0x38bdf8, 0x1e293b);
        grid.position.y = -0.18;
        if (grid.material) {
          grid.material.transparent = true;
          grid.material.opacity = 0.30;
        }
        scene.add(grid);

        // Опорный техно-подиум
        const podium = new T.Mesh(
          new T.RingGeometry(1.85, 2.05, 48),
          new T.MeshBasicMaterial({ color: 0x38bdf8, side: T.DoubleSide, transparent: true, opacity: 0.25 })
        );
        podium.rotation.x = Math.PI / 2;
        podium.position.y = -0.16;
        scene.add(podium);

        const basePositions = [];
        partGroups = parts.map(([label, , shape, params, position, color], idx) => {
          const pGroup = new T.Group();
          const tex = createPartTexture(T, label, color, idx);
          const mat = new T.MeshStandardMaterial({
            color,
            map: tex || null,
            roughness: 0.32,
            metalness: 0.35,
            side: T.DoubleSide
          });
          const item = new T.Mesh(geometry(T, shape, params), mat);
          item.userData.partIdx = idx;
          pGroup.add(item);
          meshes.push(item);

          attachSubAssemblyDetail(T, pGroup, label, shape, params, color);

          const sp = createCalloutSprite(T, idx, label, color);
          if (sp) {
            sp.position.set(0, (params[1] && shape !== 'torus' ? params[1] * 0.55 : 0.45) + 0.32, 0);
            pGroup.add(sp);
            labelSprites.push(sp);
          }

          pGroup.position.set(...position);
          basePositions.push(new T.Vector3(...position));
          scene.add(pGroup);
          return pGroup;
        });

        // Поток сигнальных частиц по контуру между узлами
        const flowParticles = [];
        const flowCurve = new T.CatmullRomCurve3(
          parts.map(([, , , , [x, y, z]]) => new T.Vector3(x, Math.max(0.2, y), z)),
          Boolean(def.loop)
        );
        if (def.loop) {
          scene.add(new T.Mesh(
            new T.TubeGeometry(flowCurve, 56, 0.042, 12, true),
            new T.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.6, transparent: true, opacity: 0.55 })
          ));
        }
        const particleGeo = new T.SphereGeometry(0.065, 12, 12);
        for (let pi = 0; pi < 10; pi++) {
          const pMesh = new T.Mesh(
            particleGeo,
            new T.MeshBasicMaterial({ color: pi % 2 === 0 ? 0x38bdf8 : 0xfbbf24 })
          );
          scene.add(pMesh);
          flowParticles.push({ mesh: pMesh, offset: pi / 10 });
        }

        let angle = 0.45;
        let pitch = 2.65;
        let radius = 5.2;
        let autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let explodeFactor = 0;
        let targetExplode = 0;
        let wireframeMode = false;
        let labelsVisible = true;
        let dragging = false;
        let downX = 0;
        let downY = 0;
        let lastX = 0;
        let lastY = 0;
        let rafId = null;

        stage.hidden = false;
        toolbar.hidden = false;
        stage.append(renderer.domElement);

        const syncSize = () => {
          const width = stage.clientWidth || 360;
          const height = stage.clientHeight || 280;
          renderer.setSize(width, height, false);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const resize = new ResizeObserver(syncSize);
        resize.observe(stage);
        syncSize();

        stage.addEventListener('pointerdown', (e) => {
          dragging = true;
          downX = lastX = e.clientX;
          downY = lastY = e.clientY;
          stage.style.cursor = 'grabbing';
        });
        const onPointerUp = (e) => {
          if (dragging && Math.hypot(e.clientX - downX, e.clientY - downY) < 6 && T.Raycaster) {
            try {
              const rect = renderer.domElement.getBoundingClientRect();
              const mouse = new T.Vector2(
                ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
                -(((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1)
              );
              const raycaster = new T.Raycaster();
              raycaster.setFromCamera(mouse, camera);
              const hits = raycaster.intersectObjects(meshes, false);
              if (hits.length > 0 && hits[0].object.userData.partIdx !== undefined) {
                selectPart(hits[0].object.userData.partIdx);
              }
            } catch {}
          }
          dragging = false;
          stage.style.cursor = 'grab';
        };
        window.addEventListener('pointerup', onPointerUp);
        stage.addEventListener('pointermove', (e) => {
          if (!dragging) return;
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          angle -= dx * 0.01;
          pitch = Math.max(0.7, Math.min(4.9, pitch + dy * 0.01));
        });
        stage.addEventListener('wheel', (e) => {
          e.preventDefault();
          radius = Math.max(3.0, Math.min(8.5, radius + e.deltaY * 0.003));
        }, { passive: false });

        toolbar.querySelectorAll('button').forEach((button) => {
          button.addEventListener('click', () => {
            if (button.dataset.action === 'explode') {
              targetExplode = targetExplode > 0 ? 0 : 1;
              button.setAttribute('aria-pressed', String(targetExplode > 0));
            } else if (button.dataset.action === 'wireframe') {
              wireframeMode = !wireframeMode;
              button.setAttribute('aria-pressed', String(wireframeMode));
              meshes.forEach((m) => { m.material.wireframe = wireframeMode; });
            } else if (button.dataset.action === 'labels') {
              labelsVisible = !labelsVisible;
              button.setAttribute('aria-pressed', String(labelsVisible));
              labelSprites.forEach((sp) => { sp.visible = labelsVisible; });
            } else if (button.dataset.action === 'autorotate') {
              autoRotate = !autoRotate;
              button.setAttribute('aria-pressed', String(autoRotate));
            } else if (button.dataset.cam === 'top') {
              pitch = 4.6;
              angle = 0.0;
            } else {
              const step = Number(button.dataset.angle);
              if (step === 0) {
                angle = 0.45;
                pitch = 2.65;
                radius = 5.2;
                targetExplode = 0;
              } else {
                angle += step * 0.45;
              }
            }
          });
        });

        const clockStart = performance.now();
        const tick = (now) => {
          rafId = requestAnimationFrame(tick);
          const t = (now - clockStart) * 0.001 * simMultiplier;
          if (autoRotate && !dragging) {
            angle += 0.0045 * Math.min(1.8, simMultiplier);
          }
          explodeFactor += (targetExplode - explodeFactor) * 0.1;
          key.intensity = 1.2 + Math.min(1.2, simMultiplier * 0.35);

          partGroups.forEach((pGroup, idx) => {
            const [label, , shape] = parts[idx];
            const mesh = meshes[idx];
            const base = basePositions[idx];
            const radial = base.clone().normalize().multiplyScalar(explodeFactor * 0.68);

            let liveY = 0;
            if (label.includes('Поршень')) {
              liveY = Math.sin(t * 3.8) * 0.34;
            } else if (label.includes('клапан')) {
              liveY = Math.max(0, Math.sin(t * 1.9 + idx) * 0.12);
            } else if (shape === 'sphere') {
              liveY = Math.sin(t * 2.1 + idx) * 0.06;
            } else if (shape === 'wave') {
              liveY = Math.sin(t * 2.8 + idx) * 0.035;
            }

            if (shape === 'torus' || label.includes('турбин') || label.includes('Турбин') || label.includes('улитка') || label.includes('Колесо') || label.includes('диск')) {
              mesh.rotation.z = t * 1.6;
            } else if (label.includes('Спектральный куб') || label.includes('Печатный блок')) {
              mesh.rotation.y = t * 0.75;
              mesh.rotation.x = Math.sin(t * 0.8) * 0.15;
            } else if (label.includes('Верхний клапан')) {
              mesh.rotation.x = -Math.min(1.4, (simMultiplier - 0.2) * 0.7);
            }

            const spreadScale = def.key === 'it-grid' ? (simMultiplier - 1) * 0.25 : 0;
            pGroup.position.set(
              base.x + radial.x,
              base.y + radial.y + (explodeFactor + Math.max(0, spreadScale)) * (idx * 0.20) + liveY + (idx === selectedIndex ? Math.sin(t * 3.2) * 0.05 : 0),
              base.z + radial.z
            );
            if (idx === selectedIndex) {
              const pulse = 0.35 + Math.sin(t * 4) * 0.18;
              mesh.material.emissive.setHex(0x0284c7);
              mesh.material.emissiveIntensity = 0.55 + pulse;
            } else {
              mesh.material.emissive.setHex(0x000000);
              mesh.material.emissiveIntensity = 0;
            }
          });

          flowParticles.forEach((fp) => {
            const u = (fp.offset + t * 0.18) % 1;
            const pt = flowCurve.getPointAt(u);
            fp.mesh.position.copy(pt);
          });

          camera.position.set(Math.sin(angle) * radius, pitch, Math.cos(angle) * radius);
          camera.lookAt(0, 0.62, 0);
          renderer.render(scene, camera);
        };
        rafId = requestAnimationFrame(tick);

        innerCleanup = () => {
          if (rafId) cancelAnimationFrame(rafId);
          window.removeEventListener('pointerup', onPointerUp);
          resize.disconnect();
          scene.traverse((item) => {
            item.geometry?.dispose?.();
            if (item.material) {
              item.material.map?.dispose?.();
              item.material.dispose?.();
            }
          });
          renderer.dispose();
        };
      }

      buttons.forEach((button, i) => button.addEventListener('click', () => {
        selectPart(i);
      }));
    }

    mountModel(activeDef);
    return () => {
      if (innerCleanup) innerCleanup();
    };
  }

  function forLesson(lesson) {
    if (!lesson) return undefined;
    const key = resolveModelKey(lesson.course_slug || lesson.specialty_slug, lesson.order_num || lesson.task_number || 1);
    return key ? models[key] : undefined;
  }

  function forCourse(courseSlug, index = 0) {
    const keys = COURSE_MODEL_KEYS[courseSlug] || COURSE_MODEL_KEYS.it;
    const key = keys[Math.max(0, Math.min(keys.length - 1, index))];
    return models[key];
  }

  return { forLesson, forCourse, show, models, resolveModelKey, COURSE_MODEL_KEYS };
})();
