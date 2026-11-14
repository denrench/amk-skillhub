window.WorkshopModels = (() => {
  // 25 детальных 3D-моделей (по 5 на каждую из 5 профессий), привязанных ко всем 100 урокам
  const models = {
    // ================= IT / WEB DESIGN (5 моделей) =================
    'it-grid': {
      title: 'Слои CSS-блока (Box Model)',
      parts: [
        ['Контент (Content)', 'Внутренняя область текста, изображений или видео.', 'box', [1.65, 0.22, 0.95], [0, 1.05, 0], 0xffd275],
        ['Внутренний отступ (Padding)', 'Прозрачный буфер между контентом и рамкой блока.', 'box', [2.4, 0.18, 1.5], [0, 0.72, 0], 0x86c6a5],
        ['Граница (Border)', 'Видимое или невидимое обрамление элемента.', 'box', [2.85, 0.16, 1.85], [0, 0.40, 0], 0x75adc3],
        ['Внешний отступ (Margin)', 'Дистанция снаружи границы до соседних элементов.', 'box', [3.5, 0.10, 2.3], [0, 0.10, 0], 0x8b8db9],
      ],
    },
    'it-server': {
      title: 'Стек клиент-серверной архитектуры (REST + DB)',
      parts: [
        ['Клиент (Browser / Fetch)', 'Отправляет асинхронные HTTP-запросы и рендерит DOM.', 'box', [1.4, 0.85, 0.12], [-1.5, 0.85, 0], 0x38bdf8],
        ['API-шлюз (Flask / REST)', 'Проверяет сессию, RBAC-права и валидирует JSON.', 'cylinder', [0.42, 1.1], [0, 0.85, 0], 0x818cf8],
        ['База данных (SQLite / PG)', 'Хранит таблицы пользователей, уроков и XP-транзакций.', 'cylinder', [0.55, 0.95], [1.5, 0.75, 0], 0x10b981],
        ['Шина JSON-ответа', 'Передаёт параметризованные данные с кодами 200/403.', 'wave', [1], [0, 0.25, 0], 0xf59e0b],
      ],
    },
    'it-dom': {
      title: 'Дерево DOM и цикл событий JavaScript',
      parts: [
        ['Document Root (<html>)', 'Корневой узел объектной модели документа.', 'sphere', [0.42], [0, 1.45, 0], 0x6366f1],
        ['Элемент Header (<nav>)', 'Навигационный узел с обработчиками событий.', 'box', [1.1, 0.28, 0.55], [-1.1, 0.75, 0], 0x22d3ee],
        ['Контейнер Main (<main>)', 'Динамическая зона рендеринга карточек Grid.', 'box', [1.2, 0.34, 0.65], [1.1, 0.75, 0], 0x10b981],
        ['Event Loop / Callback', 'Асинхронная очередь задач промисов и fetch().', 'torus', [0.55, 0.11], [0, 0.22, 0], 0xf472b6],
      ],
    },
    'it-webgl': {
      title: 'Конвейер WebGL / Three.js сцены',
      parts: [
        ['PerspectiveCamera', 'Точка обзора сцены с углом FOV и матрицей проекции.', 'cone', [0.42, 0.75], [-1.4, 0.95, 0], 0xfbbf24],
        ['Mesh (Geometry + PBR)', 'Трёхмерная сетка с материалом MeshStandardMaterial.', 'sphere', [0.55], [0, 0.85, 0], 0x38bdf8],
        ['Directional + Rim Light', 'Источники света, формирующие тени и блики.', 'sphere', [0.24], [1.35, 1.35, 0.6], 0xfef08a],
        ['WebGLRenderer Canvas', 'Буфер кадров с частотой 60 FPS через requestAnimationFrame.', 'box', [3.2, 0.1, 1.9], [0, 0.08, 0], 0x6366f1],
      ],
    },
    'it-security': {
      title: 'Эшелонированная защита Web-приложения (OWASP)',
      parts: [
        ['HttpOnly Session Cookie', 'Защищает токен сессии от чтения через document.cookie.', 'torus', [0.52, 0.14], [-1.35, 0.8, 0], 0x10b981],
        ['RBAC & Guard', 'Проверяет роль пользователя из БД на каждом маршруте.', 'box', [0.85, 1.15, 0.45], [0, 0.8, 0], 0x6366f1],
        ['escapeHtml() Sanitizer', 'Нейтрализует Stored XSS-теги перед вставкой в DOM.', 'box', [0.85, 0.85, 0.45], [1.35, 0.7, 0], 0x22d3ee],
        ['Parameterized SQL (?)', 'Блокирует SQL-инъекции на уровне драйвера БД.', 'cylinder', [0.48, 0.32], [0, 0.16, 0.95], 0xf59e0b],
      ],
    },

    // ================= GRAPHIC DESIGN (5 моделей) =================
    'design-packaging': {
      title: 'Конструктив и грани упаковки (Dieline)',
      parts: [
        ['Лицевая грань (Front)', 'Ключевая зона для логотипа, УТП и главного визуала.', 'box', [1.55, 1.42, 0.07], [0, 0.75, 0.58], 0xfbd275],
        ['Боковые грани (Sides)', 'Технический текст, состав и проверка стыковки на сгибе.', 'box', [0.07, 1.42, 1.15], [0.78, 0.75, 0], 0x86c6a5],
        ['Верхний клапан (Flap)', 'Закрывающий элемент с линией биговки и замком.', 'box', [1.55, 0.07, 1.18], [0, 1.48, 0], 0x75adc3],
        ['Каркас коробки (Body)', 'Внутренний объём для проверки вылетов под обрез (Bleed).', 'box', [1.48, 1.38, 1.07], [0, 0.74, 0], 0x607a6b],
      ],
    },
    'design-color': {
      title: 'Цветовые пространства RGB и CMYK + Свет',
      parts: [
        ['Спектральный куб RGB', 'Аддитивная модель для экранов (0–255, sRGB).', 'box', [0.85, 0.85, 0.85], [-1.15, 0.8, 0], 0x38bdf8],
        ['Печатный блок CMYK', 'Субтрактивная модель из 4 триадных красок (300 dpi).', 'box', [0.85, 0.85, 0.85], [1.15, 0.8, 0], 0xec4899],
        ['Цветовой круг Иттена', 'Гармония комплементарных и триадных сочетаний.', 'torus', [0.62, 0.14], [0, 0.85, 0], 0xfbbf24],
        ['Контраст WCAG AA', 'Опорная база читаемости с коэффициентом >= 4.5:1.', 'box', [3.1, 0.12, 1.6], [0, 0.1, 0], 0x334155],
      ],
    },
    'design-lighting': {
      title: 'Студийная схема трёхточечного 3D-света',
      parts: [
        ['Key Light (Рисующий)', 'Основной направленный свет, задающий объём и тени.', 'cone', [0.35, 0.65], [-1.5, 1.35, 0.9], 0xfef08a],
        ['Fill Light (Заполняющий)', 'Мягко высветляет глубокие тени на теневой стороне.', 'cone', [0.32, 0.55], [1.5, 0.95, 0.9], 0x93c5fd],
        ['Rim Light (Контровой)', 'Создаёт яркую световую кромку, отделяя силуэт от фона.', 'cone', [0.3, 0.55], [0, 1.55, -1.3], 0xc084fc],
        ['Объект съёмки (PBR)', 'Центральный 3D-объект с настроенным Roughness/Metalness.', 'sphere', [0.58], [0, 0.68, 0], 0xf472b6],
      ],
    },
    'design-typography': {
      title: 'Модульная сетка и иерархия типографики',
      parts: [
        ['Заголовок H1 (Display)', 'Крупный акцидентный якорь, задающий фокус внимания.', 'box', [2.5, 0.34, 0.35], [0, 1.45, 0], 0xf59e0b],
        ['Подзаголовок H2', 'Направляющий уровень для быстрого сканирования.', 'box', [1.9, 0.22, 0.35], [-0.3, 1.0, 0], 0x38bdf8],
        ['Наборный текст (Body)', 'Комфортный интерлиньяж 1.4–1.6 и длина строки 60 симв.', 'box', [2.2, 0.45, 0.35], [0, 0.48, 0], 0x94a3b8],
        ['Модульный шаг 8px', 'Базовая линейка выравнивания отступов и интервалов.', 'box', [3.2, 0.08, 1.5], [0, 0.06, 0], 0x6366f1],
      ],
    },
    'design-brand': {
      title: 'Экосистема брендбука и дизайн-токенов',
      parts: [
        ['Мастер-логотип (SVG)', 'Векторный знак с охранным полем (Clear Space).', 'torus', [0.48, 0.15], [0, 1.25, 0], 0x6366f1],
        ['UI-Токены (Variables)', 'Семантические цвета и радиусы для Figma и веба.', 'box', [0.95, 0.75, 0.25], [-1.35, 0.65, 0], 0x22d3ee],
        ['Носитель / Мокап', 'Реалистичная презентация айдентики через Smart Object.', 'cylinder', [0.4, 0.95], [1.35, 0.65, 0], 0x10b981],
        ['Фирменный паттерн', 'Объединяющая графическая подложка всех носителей.', 'box', [3.2, 0.1, 1.7], [0, 0.08, 0], 0xec4899],
      ],
    },

    // ================= AUTOELECTRIC (5 моделей) =================
    'autoel-can': {
      title: 'Дифференциальная шина CAN-Bus (High / Low)',
      parts: [
        ['Узел ЭБУ двигателя (ECU)', 'Ведущий контроллер впрыска, зажигания и датчиков.', 'box', [0.78, 0.65, 0.78], [-1.65, 0.52, 0], 0x86c6a5],
        ['Линия CAN High', 'Витой провод (2.5В -> 3.5В в доминанте).', 'wave', [1], [0, 0.65, 0.15], 0xfbd275],
        ['Линия CAN Low', 'Зеркальный витой провод (2.5В -> 1.5В в доминанте).', 'wave', [-1], [0, 0.42, -0.15], 0x75adc3],
        ['Блок ABS / BCM + Терминатор', 'Согласующий резистор 120 Ом (суммарно 60 Ом в цепи).', 'box', [0.78, 0.65, 0.78], [1.65, 0.52, 0], 0x38bdf8],
      ],
    },
    'autoel-ignition': {
      title: 'Индивидуальная катушка зажигания (COP) и свеча',
      parts: [
        ['Силовой ключ IGBT / Разъём', 'Принимает управляющий импульс от ЭБУ (+12В / GND / SIG).', 'box', [0.75, 0.35, 0.75], [0, 1.55, 0], 0x6366f1],
        ['Первичная и вторичная обмотка', 'Повышающий трансформатор до 25–35 кВ.', 'cylinder', [0.28, 0.78], [0, 1.0, 0], 0xf59e0b],
        ['Высоковольтный изолятор', 'Защищает наконечник от пробоя на корпус колодца.', 'cylinder', [0.20, 0.52], [0, 0.42, 0], 0xe2e8f0],
        ['Свеча зажигания и зазор', 'Формирует искровой разряд длительностью 1.0–1.8 мс.', 'cone', [0.16, 0.32], [0, 0.08, 0], 0x38bdf8],
      ],
    },
    'autoel-sensors': {
      title: 'Синхронизация ДПКВ (Индуктивный) и ДПРВ (Холла)',
      parts: [
        ['Задающий диск 60-2', 'Маховик с пропуском 2 зубьев для отсчёта ВМТ.', 'torus', [0.68, 0.16], [-1.0, 0.75, 0], 0x94a3b8],
        ['Индуктивный ДПКВ', 'Генерирует переменный синусоидальный сигнал (AC).', 'cylinder', [0.18, 0.65], [-1.0, 0.75, 0.82], 0xf59e0b],
        ['Датчик Холла (ДПРВ)', 'Выдаёт чёткий прямоугольный меандр 0–5 В по фазе ГРМ.', 'box', [0.55, 0.45, 0.45], [1.15, 0.85, 0], 0x22d3ee],
        ['Линия осциллографа', 'Сравнивает совпадение фронтов двух каналов в реальном времени.', 'wave', [1.2], [0, 0.22, 0], 0x10b981],
      ],
    },
    'autoel-charging': {
      title: 'Цепь генератора, АКБ и стартера (12В/14.4В)',
      parts: [
        ['Аккумуляторная батарея (АКБ)', 'Источник 12.6В в покое и буфер бортовой сети.', 'box', [0.95, 0.75, 0.68], [-1.5, 0.48, 0], 0x334155],
        ['Генератор с регулятором', 'Вырабатывает 13.8–14.5В для питания и заряда.', 'cylinder', [0.46, 0.62], [0, 0.65, 0], 0x38bdf8],
        ['Стартер с втягивающим реле', 'Потребляет высокий пусковой ток от клеммы 30 и 50.', 'cylinder', [0.34, 0.85], [1.5, 0.48, 0], 0xfbbf24],
        ['Силовая шина B+ и масса', 'Главный силовой контур; норма падения < 0.2 В.', 'wave', [0.8], [0, 0.15, 0.6], 0xef4444],
      ],
    },
    'autoel-hv': {
      title: 'Высоковольтный контур электромобиля (400V HV)',
      parts: [
        ['Тяговая батарея (ВВБ 400В)', 'Содержит чеку безопасности Service Plug.', 'box', [1.45, 0.42, 0.95], [-1.15, 0.35, 0], 0xf97316],
        ['Инвертор (DC -> 3-Phase AC)', 'Управляет тяговым электродвигателем через IGBT-ключи.', 'box', [0.95, 0.65, 0.75], [0.4, 0.65, 0], 0x6366f1],
        ['DC-DC преобразователь', 'Понижает 400В в 14В для зарядки обычной АКБ.', 'box', [0.7, 0.45, 0.6], [1.55, 0.45, 0], 0x22d3ee],
        ['Оранжевый HV-жгут', 'Стандартизованная маркировка цепей высокого напряжения.', 'wave', [1.1], [0, 0.95, 0], 0xf97316],
      ],
    },

    // ================= HVAC (5 моделей) =================
    'hvac-cycle': {
      title: 'Термодинамический контур холодильной машины',
      parts: [
        ['Компрессор', 'Сжимает пары хладагента, повышая давление и температуру.', 'cylinder', [0.36, 0.72], [-1.3, 0.48, 0.75], 0xfbd275],
        ['Конденсатор', 'Отводит тепло в окружающую среду, газ переходит в жидкость.', 'box', [0.68, 0.74, 0.82], [-1.3, 0.48, -0.75], 0xe48a72],
        ['Дроссель (ТРВ / ЭРВ)', 'Резко снижает давление перед входом в испаритель.', 'cylinder', [0.18, 0.35], [1.3, 0.35, -0.75], 0x86c6a5],
        ['Испаритель', 'Хладагент кипит при низкой температуре, забирая тепло.', 'box', [0.70, 0.62, 0.82], [1.3, 0.48, 0.75], 0x75adc3],
      ],
      loop: true,
    },
    'hvac-inverter': {
      title: 'Инверторный BLDC-компрессор и плата IPM',
      parts: [
        ['Клеммная коробка (U, V, W)', 'Три симметричные фазные обмотки статора.', 'box', [0.75, 0.3, 0.75], [0, 1.38, 0], 0x38bdf8],
        ['Спиральный блок (Scroll)', 'Сжимает хладагент без пульсаций и высокого пускового тока.', 'cylinder', [0.54, 0.95], [0, 0.75, 0], 0x818cf8],
        ['Силовой модуль IPM', 'Преобразует постоянный ток в регулируемую частоту 3 фаз.', 'box', [0.95, 0.25, 0.65], [-1.35, 0.45, 0], 0x10b981],
        ['Фильтр-осушитель и докипатель', 'Задерживает влагу и жидкий фреон на линии всасывания.', 'cylinder', [0.28, 0.68], [1.35, 0.55, 0], 0xf59e0b],
      ],
    },
    'hvac-vrf': {
      title: 'Трасса VRF / VRV с рефнетом и маслоподъёмом',
      parts: [
        ['Наружный блок VRF', 'Инверторный агрегат переменной производительности.', 'box', [1.1, 1.2, 0.75], [-1.5, 0.65, 0], 0x64748b],
        ['Медный рефнет (Y-тройник)', 'Устанавливается горизонтально для деления потока.', 'cone', [0.28, 0.58], [0, 0.68, 0], 0xf59e0b],
        ['Внутренние блоки (Fancoil)', 'Поддерживают заданную температуру в каждой зоне.', 'box', [0.9, 0.42, 0.55], [1.45, 1.05, -0.5], 0x38bdf8],
        ['Маслоподъёмная петля', 'Возвращает компрессорное масло с вертикального стояка.', 'torus', [0.36, 0.08], [0, 0.25, 0.75], 0x10b981],
      ],
    },
    'hvac-chiller': {
      title: 'Чиллер и пластинчатый теплообменник (Вода / Гликоль)',
      parts: [
        ['Пластинчатый теплообменник', 'Разделяет фреоновый и водяной контуры; боится заморозки.', 'box', [0.95, 0.95, 0.65], [0, 0.68, 0], 0x38bdf8],
        ['Реле протока (Flow Switch)', 'Аварийная защита: запрещает пуск без циркуляции воды.', 'cylinder', [0.22, 0.55], [-1.3, 0.65, 0], 0xef4444],
        ['Циркуляционный насос', 'Прокачивает раствор этилен-/пропиленгликоля.', 'sphere', [0.42], [1.3, 0.55, 0], 0x10b981],
        ['Расширительный мембранный бак', 'Компенсирует тепловое расширение теплоносителя.', 'cylinder', [0.34, 0.62], [1.3, 0.55, -0.95], 0xf59e0b],
      ],
    },
    'hvac-service': {
      title: 'Вакуумный пост, манометрия и станция рекуперации',
      parts: [
        ['Манометрический коллектор', 'Контроль высокого (HP) и низкого (LP) давления в бар/psi.', 'box', [0.95, 0.55, 0.3], [0, 1.15, 0], 0xef4444],
        ['Вакуумный насос + Вакуумметр', 'Удаляет воздух и влагу до уровня < 500 микрон.', 'cylinder', [0.42, 0.65], [-1.35, 0.48, 0], 0x38bdf8],
        ['Баллон хладагента на весах', 'Заправка по весам (и сбор не более 80% объёма).', 'cylinder', [0.38, 0.85], [1.35, 0.55, 0], 0x10b981],
        ['Электронные весы (точность 5г)', 'Контролируют массу заправленного или собранного фреона.', 'box', [0.95, 0.14, 0.95], [1.35, 0.08, 0], 0x94a3b8],
      ],
    },

    // ================= AUTOMECHANIC (5 моделей) =================
    'mech-cylinder': {
      title: 'Разрез цилиндра ДВС и механизм ГРМ',
      parts: [
        ['Стенка цилиндра (с хоном)', 'Рабочая гильза; сетка хона удерживает масляную плёнку.', 'cut', [0.75, 1.65], [0, 0.95, 0], 0x75adc3],
        ['Поршень с кольцами', 'Совершает возвратно-поступательное движение от ВМТ к НМТ.', 'cylinder', [0.58, 0.30], [0, 0.68, 0], 0xfbd275],
        ['Впускной клапан', 'Подаёт воздух/смесь в цилиндр на такте впуска.', 'cylinder', [0.12, 0.45], [-0.30, 1.75, 0], 0x86c6a5],
        ['Выпускной клапан', 'Выводит отработавшие газы на такте выпуска.', 'cylinder', [0.12, 0.45], [0.30, 1.75, 0], 0xe48a72],
      ],
    },
    'mech-turbo': {
      title: 'Турбокомпрессор и контур интеркулера',
      parts: [
        ['Горячая улитка (Турбина)', 'Раскручивается выхлопными газами до 150 000 об/мин.', 'torus', [0.45, 0.22], [-0.95, 0.85, 0], 0xef4444],
        ['Картридж и вал (CHRA)', 'Смазывается под давлением масла; осевой люфт недопустим.', 'cylinder', [0.22, 0.85], [0, 0.85, 0], 0xfbbf24],
        ['Холодная улитка (Компрессор)', 'Сжимает свежий воздух и подаёт его в интеркулер.', 'torus', [0.48, 0.22], [0.95, 0.85, 0], 0x38bdf8],
        ['Интеркулер (Радиатор наддува)', 'Охлаждает сжатый воздух для повышения плотности.', 'box', [1.85, 0.52, 0.32], [0, 0.25, 0.85], 0x94a3b8],
      ],
    },
    'mech-transmission': {
      title: 'Трансмиссия: гидротрансформатор, планетарка и сцепление',
      parts: [
        ['Гидротрансформатор / Сцепление', 'Передаёт крутящий момент от маховика ДВС.', 'cylinder', [0.62, 0.38], [-1.35, 0.72, 0], 0xf59e0b],
        ['Планетарный редуктор', 'Меняет передаточные числа с помощью пакетов фрикционов.', 'torus', [0.55, 0.18], [0, 0.72, 0], 0x38bdf8],
        ['Поддон с магнитами ATF', 'Улавливает металлическую пыль; уровень меряется при +40°C.', 'box', [1.6, 0.22, 1.0], [0, 0.14, 0], 0x64748b],
        ['Дифференциал и полуоси', 'Распределяет момент между ведущими колёсами.', 'sphere', [0.44], [1.35, 0.72, 0], 0x10b981],
      ],
    },
    'mech-suspension': {
      title: 'Подвеска МакФерсон и углы установки колёс (УУК)',
      parts: [
        ['Амортизаторная стойка + Пружина', 'Задаёт продольный угол наклона оси поворота (Кастер).', 'cylinder', [0.22, 1.35], [0, 0.92, 0], 0x38bdf8],
        ['Поворотный кулак и ступица', 'Узел крепления колеса, тормозного диска и подшипника.', 'box', [0.55, 0.55, 0.55], [0.55, 0.52, 0], 0x94a3b8],
        ['Колесо (Развал / Схождение)', 'Углы Camber и Toe определяют износ протектора.', 'torus', [0.55, 0.18], [1.25, 0.58, 0], 0x334155],
        ['Нижний рычаг и шаровая опора', 'Проверяется на люфт до установки 3D-мишеней УУК.', 'box', [1.3, 0.14, 0.35], [-0.45, 0.22, 0], 0x10b981],
      ],
    },
    'mech-brakes': {
      title: 'Тормозная система: вентилируемый диск и суппорт',
      parts: [
        ['Вентилируемый тормозной диск', 'Проверяется микрометром на толщину и биение.', 'cylinder', [0.78, 0.14], [0, 0.75, 0], 0x94a3b8],
        ['Тормозной суппорт и поршень', 'Направляющие пальцы смазываются высокотемпературной смазкой.', 'box', [0.48, 0.65, 0.45], [0.65, 0.85, 0], 0xef4444],
        ['Тормозные колодки', 'Фрикционные накладки с индикатором износа.', 'box', [0.35, 0.52, 0.22], [0.28, 0.85, 0], 0xfbbf24],
        ['Магистраль DOT-4 + ABS', 'Прокачивается при замене, проверяется на содержание влаги.', 'wave', [0.9], [-0.95, 0.55, 0], 0x22d3ee],
      ],
    },
  };

  // Маппинг всех 100 уроков (5 профессий x 20 уроков) на 25 3D-моделей
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
    return null;
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

  function show(canvas, definition) {
    const { title, parts } = definition;
    canvas.innerHTML = `
      <section class="starter-panel workshop-model-panel">
        <div class="starter-heading">
          <span>ИНТЕРАКТИВНАЯ 3D-МОДЕЛЬ УЗЛА</span>
          <h2>${title}</h2>
          <p>Вращайте мышью, включайте взрыв-схему или выбирайте элемент из списка.</p>
        </div>
        <div class="starter-grid">
          <div>
            <div class="workshop-visual" aria-label="${title}" style="cursor:grab; touch-action:none;" hidden></div>
            <div class="starter-view" role="group" aria-label="Управление 3D-видом" hidden>
              <button type="button" class="starter-button" data-angle="-1">⟲ Влево</button>
              <button type="button" class="starter-button" data-angle="1">⟳ Вправо</button>
              <button type="button" class="starter-button" data-action="explode" aria-pressed="false">Взрыв-схема</button>
              <button type="button" class="starter-button" data-action="wireframe" aria-pressed="false">Каркас</button>
              <button type="button" class="starter-button" data-action="autorotate" aria-pressed="true">Авто</button>
              <button type="button" class="starter-button" data-angle="0">Сброс</button>
            </div>
          </div>
          <aside class="starter-sidebar" aria-label="Элементы модели">
            ${parts.map(([label], i) => `<button type="button" class="starter-button" data-part="${i}" aria-pressed="false">${label}</button>`).join('')}
            <p role="status">Выберите элемент из списка, чтобы изучить его назначение.</p>
          </aside>
        </div>
      </section>`;

    const stage = canvas.querySelector('.workshop-visual');
    const toolbar = canvas.querySelector('.starter-view');
    const status = canvas.querySelector('[role="status"]');
    const buttons = canvas.querySelectorAll('[data-part]');
    const T = window.THREE;
    let renderer;
    try {
      if (T) renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // Fallback без WebGL
    }
    if (!renderer) {
      status.textContent = 'WebGL недоступен. Выберите элемент из списка, чтобы прочитать описание.';
    }

    let meshes = [];
    let dispose;
    let selectedIndex = -1;

    if (renderer) {
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(40, 1, 0.1, 40);

      const key = new T.DirectionalLight(0xffffff, 1.45);
      key.position.set(3.5, 5.5, 4.5);
      const rim = new T.PointLight(0x38bdf8, 1.2, 18);
      rim.position.set(-3.5, 2.5, -3.5);
      scene.add(key, rim, new T.HemisphereLight(0xe0e7ff, 0x1e293b, 1.0));

      // Неоновая сетка основания для глубины 3D-сцены
      const grid = new T.GridHelper(6, 12, 0x38bdf8, 0x1e293b);
      grid.position.y = -0.15;
      if (grid.material) {
        grid.material.transparent = true;
        grid.material.opacity = 0.28;
      }
      scene.add(grid);

      const basePositions = [];
      meshes = parts.map(([, , shape, params, position, color]) => {
        const mat = new T.MeshStandardMaterial({
          color,
          roughness: 0.35,
          metalness: 0.25,
          side: T.DoubleSide
        });
        const item = new T.Mesh(geometry(T, shape, params), mat);
        item.position.set(...position);
        basePositions.push(new T.Vector3(...position));
        scene.add(item);
        return item;
      });

      if (definition.loop) {
        const path = new T.CatmullRomCurve3(parts.map(([, , , , [x, , z]]) => new T.Vector3(x, 0.24, z)), true);
        scene.add(new T.Mesh(
          new T.TubeGeometry(path, 48, 0.045, 10, true),
          new T.MeshStandardMaterial({ color: 0xe4ddd0, roughness: 0.3, metalness: 0.4 })
        ));
      }

      let angle = 0.45;
      let pitch = 2.7;
      let autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let explodeFactor = 0;
      let targetExplode = 0;
      let wireframeMode = false;
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let rafId = null;

      stage.hidden = false;
      toolbar.hidden = false;
      stage.append(renderer.domElement);

      const syncSize = () => {
        const width = stage.clientWidth || 320;
        const height = stage.clientHeight || 260;
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const resize = new ResizeObserver(syncSize);
      resize.observe(stage);
      syncSize();

      // Интерактивное вращение мышью/тачем
      stage.addEventListener('pointerdown', (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        stage.style.cursor = 'grabbing';
      });
      window.addEventListener('pointerup', () => {
        dragging = false;
        stage.style.cursor = 'grab';
      });
      stage.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        angle -= dx * 0.01;
        pitch = Math.max(0.9, Math.min(4.8, pitch + dy * 0.01));
      });

      toolbar.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', () => {
          if (button.dataset.action === 'explode') {
            targetExplode = targetExplode > 0 ? 0 : 1;
            button.setAttribute('aria-pressed', String(targetExplode > 0));
          } else if (button.dataset.action === 'wireframe') {
            wireframeMode = !wireframeMode;
            button.setAttribute('aria-pressed', String(wireframeMode));
            meshes.forEach((m) => { m.material.wireframe = wireframeMode; });
          } else if (button.dataset.action === 'autorotate') {
            autoRotate = !autoRotate;
            button.setAttribute('aria-pressed', String(autoRotate));
          } else {
            const step = Number(button.dataset.angle);
            if (step === 0) {
              angle = 0.45;
              pitch = 2.7;
            } else {
              angle += step * 0.4;
            }
          }
        });
      });

      const clockStart = performance.now();
      const tick = (now) => {
        rafId = requestAnimationFrame(tick);
        const t = (now - clockStart) * 0.001;
        if (autoRotate && !dragging) {
          angle += 0.0045;
        }
        explodeFactor += (targetExplode - explodeFactor) * 0.1;

        meshes.forEach((mesh, idx) => {
          const [label, , shape] = parts[idx];
          const base = basePositions[idx];
          const radial = base.clone().normalize().multiplyScalar(explodeFactor * 0.65);

          let liveY = 0;
          if (label.includes('Поршень')) {
            liveY = Math.sin(t * 3.6) * 0.32;
          } else if (shape === 'sphere') {
            liveY = Math.sin(t * 2.1 + idx) * 0.06;
          } else if (shape === 'wave') {
            liveY = Math.sin(t * 2.8 + idx) * 0.035;
          }

          if (shape === 'torus' || label.includes('турбин') || label.includes('Турбин') || label.includes('улитка') || label.includes('Колесо') || label.includes('диск')) {
            mesh.rotation.z = t * 1.4;
          } else if (label.includes('Спектральный куб') || label.includes('Печатный блок')) {
            mesh.rotation.y = t * 0.7;
            mesh.rotation.x = Math.sin(t * 0.8) * 0.15;
          }

          mesh.position.set(
            base.x + radial.x,
            base.y + radial.y + explodeFactor * (idx * 0.18) + liveY + (idx === selectedIndex ? Math.sin(t * 3.2) * 0.05 : 0),
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

        camera.position.set(Math.sin(angle) * 5.2, pitch, Math.cos(angle) * 5.2);
        camera.lookAt(0, 0.62, 0);
        renderer.render(scene, camera);
      };
      rafId = requestAnimationFrame(tick);

      dispose = () => {
        if (rafId) cancelAnimationFrame(rafId);
        resize.disconnect();
        scene.traverse((item) => {
          item.geometry?.dispose();
          item.material?.dispose();
        });
        renderer.dispose();
      };
    }

    buttons.forEach((button, i) => button.addEventListener('click', () => {
      selectedIndex = i;
      buttons.forEach((peer) => peer.setAttribute('aria-pressed', String(peer === button)));
      status.textContent = parts[i][1];
    }));

    return dispose;
  }

  function forLesson(lesson) {
    if (!lesson) return undefined;
    const key = resolveModelKey(lesson.course_slug, lesson.order_num);
    return key ? models[key] : undefined;
  }

  return { forLesson, show, models, resolveModelKey };
})();
