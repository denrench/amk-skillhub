window.WorkshopModels = (() => {
  // 25 профильных 3D-моделей (.glb glTF 2.0) — строго по темам 5 специальностей колледжа АМК (100 уроков)
  const models = {
    // ================= 1. АВТОМЕХАНИКА (5 моделей) =================
    'mech-turbo': {
      key: 'mech-turbo',
      course: 'automechanic',
      glb: 'assets/models/mech-turbo.glb',
      title: 'Автомобиль GT и контур турбонаддува',
      author: 'АМК · Автомеханика',
      controlLabel: 'Обороты ротора турбины',
      controlUnit: ' тыс. об',
      controlMin: 20,
      controlMax: 160,
      controlDefault: 95,
      telemetryFn: (v) => `Ротор CHRA: ${v} 000 об/мин · Наддув: ${(0.4 + v * 0.01).toFixed(2)} бар · Осевой люфт: 0.00 мм`,
      parts: [
        ['Кузов и аэродинамика впуска', 'Воздуховоды охлаждения интеркулера, диффузор и силовые панели кузова.', 'torus', [0.46, 0.22], [-0.95, 0.85, 0], 0x4f46e5, 'Модуль 13–14'],
        ['Шасси, подвеска и трансмиссия', 'Силовая рама, рычаги подвески и магистраль отвода выхлопных газов к турбине.', 'cylinder', [0.22, 0.85], [0, 0.85, 0], 0x0284c7, 'Модуль 15–16'],
        ['Колёса и тормозные механизмы', 'Многоспицевые диски, суппорты и шины с контролем углов установки (УУК).', 'torus', [0.48, 0.22], [0.95, 0.85, 0], 0x10b981, 'Модуль 7–8'],
        ['Турбокомпрессор и интеркулер', 'Горячая и холодная улитки, картридж CHRA и радиатор охлаждения наддува.', 'box', [1.85, 0.52, 0.32], [0, 0.25, 0.85], 0xf59e0b, 'Модуль 19'],
      ],
      loop: true,
    },
    'mech-cylinder': {
      key: 'mech-cylinder',
      course: 'automechanic',
      glb: 'assets/models/mech-cylinder.glb',
      title: 'Двухцилиндровый ДВС в разрезе: ЦПГ, коленвал и ГРМ',
      author: 'АМК · Автомеханика',
      controlLabel: 'Обороты коленвала ДВС',
      controlUnit: ' об/мин',
      controlMin: 750,
      controlMax: 5500,
      controlDefault: 1800,
      telemetryFn: (v) => `Обороты: ${v} об/мин · Компрессия: 13.4 бар · Зазор клапанов: 0.25 мм`,
      parts: [
        ['Блок цилиндров и гильзы с хоном', 'Рабочие цилиндры с сеткой хона под углом 60° для удержания масляной плёнки.', 'cut', [0.75, 1.65], [0, 0.95, 0], 0x0284c7, 'Модуль 1–2'],
        ['Поршни, кольца и шатуны (ЦПГ)', 'Компрессионные и маслосъёмные кольца, поршневые пальцы и шатунные шейки.', 'cylinder', [0.58, 0.32], [0, 0.68, 0], 0xf59e0b, 'Модуль 3'],
        ['Коленчатый вал и противовесы', 'Преобразует возвратно-поступательное движение поршней в крутящий момент.', 'cylinder', [0.13, 0.46], [-0.30, 1.75, 0], 0x10b981, 'Модуль 17'],
        ['Клапанный механизм ГРМ', 'Синхронизирует такты впуска, сжатия, рабочего хода и выпуска по меткам ВМТ.', 'cylinder', [0.13, 0.46], [0.30, 1.75, 0], 0xef4444, 'Модуль 18–20'],
      ],
    },
    'mech-transmission': {
      key: 'mech-transmission',
      course: 'automechanic',
      glb: 'assets/models/mech-transmission.glb',
      title: 'Коробка передач и редуктор в сборе',
      author: 'АМК · Автомеханика',
      controlLabel: 'Частота вращения первичного вала',
      controlUnit: '%',
      controlMin: 30,
      controlMax: 200,
      controlDefault: 100,
      telemetryFn: (v) => `Давление масла: ${(4.2 + v * 0.02).toFixed(1)} бар · Зацепление шестерён: 100% · Зазор 0.08 мм`,
      parts: [
        ['Первичный и вторичный валы', 'Набор косозубых шестерён постоянного зацепления на опорных подшипниках.', 'cylinder', [0.62, 0.38], [-1.35, 0.72, 0], 0xf59e0b, 'Модуль 5'],
        ['Муфты синхронизаторов и вилки', 'Выравнивают угловые скорости шестерён при переключении передач.', 'torus', [0.55, 0.18], [0, 0.72, 0], 0x0284c7, 'Модуль 6'],
        ['Картер КПП и поддон', 'Корпус трансмиссии с каналами смазки и магнитным уловителем стружки.', 'box', [1.6, 0.22, 1.0], [0, 0.14, 0], 0x64748b, 'Модуль 15'],
        ['Главная пара и дифференциал', 'Распределяет крутящий момент между ведущими полуосями.', 'sphere', [0.44], [1.35, 0.72, 0], 0x10b981, 'Модуль 15'],
      ],
    },
    'mech-suspension': {
      key: 'mech-suspension',
      course: 'automechanic',
      glb: 'assets/models/mech-suspension.glb',
      title: 'Шасси, подвеска и рулевое управление',
      author: 'АМК · Автомеханика',
      controlLabel: 'Ход сжатия стойки подвески',
      controlUnit: ' мм',
      controlMin: 10,
      controlMax: 120,
      controlDefault: 45,
      telemetryFn: (v) => `Ход стойки: ${v} мм · Развал (Camber): -0°30' · Схождение (Toe): +0°08'`,
      parts: [
        ['Рычаги и амортизаторные стойки', 'Задают углы Кастера и Развала, гасят колебания на неровностях.', 'cylinder', [0.22, 1.35], [0, 0.92, 0], 0x0284c7, 'Модуль 7'],
        ['Рулевая рейка и тяги', 'Механизм поворота колёс с регулировкой схождения (Toe) на стенде УУК.', 'box', [0.55, 0.55, 0.55], [0.55, 0.52, 0], 0x64748b, 'Модуль 11'],
        ['Пространственная рама шасси', 'Силовой каркас для проверки геометрии контрольных точек кузова.', 'torus', [0.55, 0.18], [1.25, 0.58, 0], 0x4f46e5, 'Модуль 16'],
        ['Ступицы, подшипники и шины', 'Балансируемые колёса в сборе с проверкой люфта шаровых опор.', 'box', [1.3, 0.14, 0.35], [-0.45, 0.22, 0], 0x10b981, 'Модуль 8'],
      ],
    },
    'mech-brakes': {
      key: 'mech-brakes',
      course: 'automechanic',
      glb: 'assets/models/mech-brakes.glb',
      title: 'Тормозная система и шасси автомобиля',
      author: 'АМК · Автомеханика',
      controlLabel: 'Давление в контуре DOT-4',
      controlUnit: ' бар',
      controlMin: 10,
      controlMax: 140,
      controlDefault: 65,
      telemetryFn: (v) => `Давление торможения: ${v} бар · Толщина диска: 24.2 мм · Биение: 0.02 мм`,
      parts: [
        ['Тормозные диски и суппорты', 'Вентилируемые роторы, направляющие пальцы и контроль биения микрометром.', 'cylinder', [0.78, 0.14], [0, 0.75, 0], 0x64748b, 'Модуль 9'],
        ['Гидравлическая магистраль ABS', 'Контур тормозной жидкости DOT-4 и блок клапанов модуляции давления.', 'box', [0.48, 0.65, 0.45], [0.65, 0.85, 0], 0xef4444, 'Модуль 10'],
        ['Фрикционные колодки', 'Комплект тормозных накладок с датчиком предельного износа.', 'box', [0.35, 0.52, 0.22], [0.28, 0.85, 0], 0xf59e0b, 'Модуль 12'],
        ['Педальный узел и усилитель', 'Вакуумный усилитель тормозов и главный тормозной цилиндр (ГТЦ).', 'wave', [0.9], [-0.95, 0.55, 0], 0x0284c7, 'Модуль 19'],
      ],
    },

    // ================= 2. АВТОЭЛЕКТРИКА (5 моделей) =================
    'autoel-charging': {
      key: 'autoel-charging',
      course: 'autoelectric',
      glb: 'assets/models/autoel-charging.glb',
      title: 'Электропривод, щёточный узел и редуктор (12В/24В)',
      author: 'АМК · Автоэлектрика',
      controlLabel: 'Ток нагрузки силового привода',
      controlUnit: ' А',
      controlMin: 15,
      controlMax: 120,
      controlDefault: 55,
      telemetryFn: (v) => `Ток цепи: ${v} А · Напряжение B+: ${(14.45 - v * 0.004).toFixed(2)} В · Падение: 0.08 В`,
      parts: [
        ['Якорь и обмотки статора', 'Силовые медные обмотки и коллекторный узел стартера/генератора.', 'box', [0.95, 0.75, 0.68], [-1.5, 0.48, 0], 0x4f46e5, 'Модуль 1–3'],
        ['ШИМ-регулятор и силовое реле', 'Коммутация тока по стандарту DIN 72552 (контакты 30, 85, 86, 87).', 'cylinder', [0.46, 0.62], [0, 0.65, 0], 0x0284c7, 'Модуль 5'],
        ['Планетарный редуктор привода', 'Увеличивает крутящий момент пускового электродвигателя.', 'cylinder', [0.34, 0.85], [1.5, 0.48, 0], 0xf59e0b, 'Модуль 10'],
        ['Диэлектрический корпус и масса', 'Защитный кожух и точка контроля переходного сопротивления массы.', 'wave', [0.8], [0, 0.15, 0.6], 0xef4444, 'Модуль 12'],
      ],
      loop: true,
    },
    'autoel-can': {
      key: 'autoel-can',
      course: 'autoelectric',
      glb: 'assets/models/autoel-can.glb',
      title: 'Бортовая сеть CAN-Bus и блоки управления автомобиля',
      author: 'АМК · Автоэлектрика',
      controlLabel: 'Скорость обмена шины CAN',
      controlUnit: ' кбит/с',
      controlMin: 125,
      controlMax: 1000,
      controlDefault: 500,
      telemetryFn: (v) => `CAN High: 3.5В · CAN Low: 1.5В · Сопротивление: 60 Ом · ${v} кбит/с`,
      parts: [
        ['ЭБУ двигателя (ECM)', 'Главный контроллер впрыска, зажигания и обмена по шине CAN Powertrain.', 'box', [0.80, 0.68, 0.80], [-1.65, 0.52, 0], 0x10b981, 'Модуль 8'],
        ['Блок комфорта (BCM)', 'Управляет светотехникой, стеклоподъёмниками и центральным замком по LIN/CAN.', 'wave', [1], [0, 0.68, 0.16], 0xf59e0b, 'Модуль 11'],
        ['Шина CAN High / Low (60 Ом)', 'Витая пара с двумя согласующими терминаторами по 120 Ом на концах.', 'wave', [-1], [0, 0.42, -0.16], 0x0284c7, 'Модуль 15'],
        ['Разъём диагностики OBD-II', 'Считывание кодов DTC (P/U/B/C) и параметров Live Data сканером.', 'box', [0.80, 0.68, 0.80], [1.65, 0.52, 0], 0x4f46e5, 'Модуль 20'],
      ],
      loop: true,
    },
    'autoel-hv': {
      key: 'autoel-hv',
      course: 'autoelectric',
      glb: 'assets/models/autoel-hv.glb',
      title: 'Высоковольтный инвертор и тяговый электропривод (400V HV)',
      author: 'АМК · Автоэлектрика',
      controlLabel: 'Частота ШИМ инвертора IGBT',
      controlUnit: ' кГц',
      controlMin: 4,
      controlMax: 20,
      controlDefault: 10,
      telemetryFn: (v) => `Шина HV: 396 В DC · Частота IGBT: ${v} кГц · Изоляция > 500 МОм`,
      parts: [
        ['Синхронный ротор-индуктор', 'Магнитный ротор тягового мотора с датчиком положения Резольвером.', 'box', [1.45, 0.44, 0.95], [-1.15, 0.35, 0], 0xf59e0b, 'Модуль 18'],
        ['Инвертор IGBT (DC -> 3-Phase AC)', 'Преобразует 400В постоянной батареи в 3-фазный переменный ток U-V-W.', 'box', [0.95, 0.65, 0.75], [0.4, 0.65, 0], 0x4f46e5, 'Модуль 19'],
        ['DC-DC конвертер 400В -> 14В', 'Заряжает штатную 12-вольтовую бортовую АКБ без генератора.', 'box', [0.7, 0.45, 0.6], [1.55, 0.45, 0], 0x0284c7, 'Модуль 19'],
        ['Петля блокировки Service Plug', 'Аварийное обесточивание высоковольтного контура перед обслуживанием.', 'wave', [1.1], [0, 0.95, 0], 0xef4444, 'Модуль 19'],
      ],
    },
    'autoel-ignition': {
      key: 'autoel-ignition',
      course: 'autoelectric',
      glb: 'assets/models/autoel-ignition.glb',
      title: 'Индивидуальная катушка зажигания (COP) и свеча',
      author: 'АМК · Автоэлектрика',
      controlLabel: 'Время накопления (Dwell Time)',
      controlUnit: 'дес. мс',
      controlMin: 15,
      controlMax: 45,
      controlDefault: 28,
      telemetryFn: (v) => `Накопление: ${(v / 10).toFixed(1)} мс · Пробивное напряжение: ${Math.round(14 + v * 0.45)} кВ`,
      parts: [
        ['Силовой ключ IGBT и разъём', 'Принимает управляющий импульс от ЭБУ (+12В / GND / SIG).', 'box', [0.78, 0.36, 0.78], [0, 1.55, 0], 0x4f46e5, 'Модуль 6'],
        ['Первичная и вторичная обмотки', 'Повышающий трансформатор зажигания до 25–35 кВ.', 'cylinder', [0.30, 0.78], [0, 1.0, 0], 0xf59e0b, 'Модуль 14'],
        ['Высоковольтный изолятор', 'Защищает свечной колодец от пробоя искры на массу ГБЦ.', 'cylinder', [0.21, 0.52], [0, 0.42, 0], 0x94a3b8, 'Модуль 14'],
        ['Свеча зажигания и электрод', 'Формирует искровой разряд в камере сгорания длительностью 1.0–1.8 мс.', 'cone', [0.17, 0.34], [0, 0.08, 0], 0x0284c7, 'Модуль 14'],
      ],
    },
    'autoel-sensors': {
      key: 'autoel-sensors',
      course: 'autoelectric',
      glb: 'assets/models/autoel-sensors.glb',
      title: 'Синхронизация ДПКВ (60-2), ДПРВ Холла и осциллограф',
      author: 'АМК · Автоэлектрика',
      controlLabel: 'Обороты задающего шкива 60-2',
      controlUnit: ' об/мин',
      controlMin: 600,
      controlMax: 4500,
      controlDefault: 1200,
      telemetryFn: (v) => `Обороты: ${v} об/мин · Амплитуда ДПКВ: ${(3.5 + v * 0.0025).toFixed(1)} В AC · Меандр ДПРВ: 0–5.0 В`,
      parts: [
        ['Задающий диск 60-2', 'Маховик с пропуском двух зубьев для определения ВМТ первого цилиндра.', 'torus', [0.68, 0.16], [-1.0, 0.75, 0], 0x64748b, 'Модуль 4'],
        ['Индуктивный датчик ДПКВ', 'Выдаёт синусоидальный переменный сигнал (AC) при прохождении зубьев.', 'cylinder', [0.18, 0.65], [-1.0, 0.75, 0.82], 0xf59e0b, 'Модуль 7'],
        ['Датчик Холла (ДПРВ)', 'Формирует чёткий прямоугольный меандр 0–5 В по фазе распредвала.', 'box', [0.55, 0.45, 0.45], [1.15, 0.85, 0], 0x0284c7, 'Модуль 13'],
        ['Двухканальный мотор-тестер', 'Сравнивает совпадение фронтов ДПКВ и ДПРВ на одной шкале времени.', 'wave', [1.2], [0, 0.22, 0], 0x10b981, 'Модуль 16'],
      ],
    },

    // ================= 3. ХОЛОДИЛЬНОЕ ОБОРУДОВАНИЕ / HVAC (5 моделей) =================
    'hvac-cycle': {
      key: 'hvac-cycle',
      course: 'hvac',
      glb: 'assets/models/hvac-cycle.glb',
      title: 'Промышленный холодильный шкаф-витрина',
      author: 'АМК · Холодильное (HVAC)',
      controlLabel: 'Производительность компрессора',
      controlUnit: '%',
      controlMin: 30,
      controlMax: 160,
      controlDefault: 100,
      telemetryFn: (v) => `LP: ${(1.9 + v * 0.003).toFixed(1)} бар · HP: ${(11.5 + v * 0.025).toFixed(1)} бар · Superheat ΔT = 6.2 K`,
      parts: [
        ['Компрессорно-конденсаторный блок', 'Сжимает пары R600a/R134a и отводит тепло конденсации в помещение.', 'cylinder', [0.38, 0.74], [-1.3, 0.48, 0.75], 0xf59e0b, 'Модуль 1–2'],
        ['Испаритель и воздухоохладитель', 'Хладагент кипит при низком давлении, забирая тепло из камеры.', 'box', [0.70, 0.76, 0.84], [-1.3, 0.48, -0.75], 0x0284c7, 'Модуль 3'],
        ['Дверь со стеклопакетом и ПЭН', 'Оснащена контуром антиконденсатного обогрева и магнитным уплотнителем.', 'cylinder', [0.20, 0.38], [1.3, 0.35, -0.75], 0x10b981, 'Модуль 10'],
        ['Контроллер оттайки No Frost', 'Управляет циклами охлаждения, паузами и ТЭНом оттайки испарителя.', 'box', [0.72, 0.64, 0.84], [1.3, 0.48, 0.75], 0x4f46e5, 'Модуль 9–17'],
      ],
      loop: true,
    },
    'hvac-chiller': {
      key: 'hvac-chiller',
      course: 'hvac',
      glb: 'assets/models/hvac-chiller.glb',
      title: 'Поршневой компрессор чиллера в разрезе',
      author: 'АМК · Холодильное (HVAC)',
      controlLabel: 'Скорость протока теплоносителя',
      controlUnit: ' м³/ч',
      controlMin: 2,
      controlMax: 18,
      controlDefault: 8,
      telemetryFn: (v) => `Проток: ${v} м³/ч · Вода Вход/Выход: +12°C / +7°C · Реле протока ОК`,
      parts: [
        ['Цилиндры сжатия фреона', 'Камеры сжатия паров; защищаются от попадания жидкого хладагента.', 'box', [0.95, 0.95, 0.65], [0, 0.68, 0], 0x0284c7, 'Модуль 4'],
        ['Клапанная доска (LP / HP)', 'Пластинчатые клапаны всасывания и нагнетания высокого давления.', 'cylinder', [0.22, 0.55], [-1.3, 0.65, 0], 0xef4444, 'Модуль 16'],
        ['ТЭН картера и маслоотделитель', 'Выпаривает растворённый хладагент из масла перед холодным пуском.', 'sphere', [0.42], [1.3, 0.55, 0], 0x10b981, 'Модуль 16'],
        ['Приводной вал и реле протока', 'Аварийная автоматика, блокирующая пуск без циркуляции гликоля.', 'cylinder', [0.34, 0.62], [1.3, 0.55, -0.95], 0xf59e0b, 'Модуль 16'],
      ],
    },
    'hvac-inverter': {
      key: 'hvac-inverter',
      course: 'hvac',
      glb: 'assets/models/hvac-inverter.glb',
      title: 'Инверторный BLDC-компрессор и плата IPM',
      author: 'АМК · Холодильное (HVAC)',
      controlLabel: 'Частота вращения инвертора',
      controlUnit: ' Гц',
      controlMin: 25,
      controlMax: 120,
      controlDefault: 65,
      telemetryFn: (v) => `Частота BLDC: ${v} Гц · Обмотки U-V-W: 1.8 Ом (симметрия) · Ток IPM: ${(2.1 + v * 0.04).toFixed(1)} А`,
      parts: [
        ['Клеммник фаз U, V, W', 'Три симметричные обмотки статора без пускового конденсатора.', 'box', [0.75, 0.3, 0.75], [0, 1.38, 0], 0x0284c7, 'Модуль 11'],
        ['Спиральный блок (Scroll)', 'Плавное сжатие хладагента без пульсаций и высоких пусковых токов.', 'cylinder', [0.54, 0.95], [0, 0.75, 0], 0x4f46e5, 'Модуль 14'],
        ['Силовой модуль IPM', 'Формирует регулируемое трёхфазное напряжение для изменения оборотов.', 'box', [0.95, 0.25, 0.65], [-1.35, 0.45, 0], 0x10b981, 'Модуль 18'],
        ['Докипатель на линии всасывания', 'Задерживает остатки жидкого фреона перед входом в спираль.', 'cylinder', [0.28, 0.68], [1.35, 0.55, 0], 0xf59e0b, 'Модуль 18'],
      ],
    },
    'hvac-vrf': {
      key: 'hvac-vrf',
      course: 'hvac',
      glb: 'assets/models/hvac-vrf.glb',
      title: 'Мультизональная трасса VRF с медным рефнетом',
      author: 'АМК · Холодильное (HVAC)',
      controlLabel: 'Открытие шагового вентиля ЭРВ',
      controlUnit: ' имп.',
      controlMin: 60,
      controlMax: 480,
      controlDefault: 240,
      telemetryFn: (v) => `Позиция ЭРВ: ${v} pls · Баланс рефнета: 50/50 · Возврат масла стабилен`,
      parts: [
        ['Наружный блок VRF', 'Инверторный агрегат переменной производительности с двумя вентиляторами.', 'box', [1.1, 1.2, 0.75], [-1.5, 0.65, 0], 0x64748b, 'Модуль 13'],
        ['Медный Y-рефнет и пайка в азоте', 'Монтируется строго горизонтально с защитой от окалины сухим азотом.', 'cone', [0.28, 0.58], [0, 0.68, 0], 0xf59e0b, 'Модуль 5–13'],
        ['Жидкостная и газовая магистрали', 'Трубопроводы в теплоизоляции, испытанные опрессовкой до 41.5 бар.', 'box', [0.9, 0.42, 0.55], [1.45, 1.05, -0.5], 0x0284c7, 'Модуль 6'],
        ['Внутренние блоки (Fancoil)', 'Поддерживают заданную температуру в отдельных зонах здания.', 'torus', [0.36, 0.08], [0, 0.25, 0.75], 0x10b981, 'Модуль 13'],
      ],
      loop: true,
    },
    'hvac-service': {
      key: 'hvac-service',
      course: 'hvac',
      glb: 'assets/models/hvac-service.glb',
      title: 'Вакуумный пост, манометрический коллектор и весы',
      author: 'АМК · Холодильное (HVAC)',
      controlLabel: 'Глубина вакуумирования',
      controlUnit: '%',
      controlMin: 20,
      controlMax: 200,
      controlDefault: 120,
      telemetryFn: (v) => `Вакуум: ${Math.max(180, Math.round(950 - v * 3.8))} микрон · Доза фреона: ${(v * 1.2).toFixed(0)} г · Герметично`,
      parts: [
        ['Двухступенчатый вакуумный насос', 'Удаляет воздух и влагу из контура до остаточного давления < 500 микрон.', 'cylinder', [0.42, 0.65], [-1.35, 0.48, 0], 0x0284c7, 'Модуль 7'],
        ['Манометрический коллектор (LP/HP)', 'Контроль низкого и высокого давления с расчётом перегрева Superheat.', 'box', [0.95, 0.55, 0.3], [0, 1.15, 0], 0xef4444, 'Модуль 12'],
        ['Баллон хладагента', 'Подключается вентилем вниз для точной заправки жидкой фазой.', 'cylinder', [0.38, 0.85], [1.35, 0.55, 0], 0x10b981, 'Модуль 8'],
        ['Электронные весы (точность 5 г)', 'Контролируют массу заправленного или рекуперированного хладагента.', 'box', [0.95, 0.14, 0.95], [1.35, 0.08, 0], 0x64748b, 'Модуль 19–20'],
      ],
    },

    // ================= 4. ГРАФИЧЕСКИЙ ДИЗАЙН (5 моделей) =================
    'design-packaging': {
      key: 'design-packaging',
      course: 'graphic_design',
      glb: 'assets/models/design-packaging.glb',
      title: 'Продуктовый мокап упаковки: этикетка, УФ-лак и дозатор',
      author: 'АМК · Графический дизайн',
      controlLabel: 'Угол блика выборочного УФ-лака',
      controlUnit: '%',
      controlMin: 0,
      controlMax: 180,
      controlDefault: 60,
      telemetryFn: (v) => `УФ-лак: ${v}% · Вылеты Bleed: 3 мм · Профиль печати FOGRA39 (300 dpi)`,
      parts: [
        ['Круговая этикетка и логотип', 'Поле композиции с охранным полем знака, УТП и штрихкодом EAN-13.', 'box', [1.55, 1.42, 0.08], [0, 0.75, 0.58], 0xf59e0b, 'Модуль 8'],
        ['Матовый корпус и УФ-лак (Spot UV)', 'Контраст матовой поверхности и глянцевого выборочного лакирования.', 'box', [0.08, 1.42, 1.15], [0.78, 0.75, 0], 0x10b981, 'Модуль 16'],
        ['Верхний колпачок с тиснением', 'Конструктивный элемент с контролем стыковки и цветом по Pantone.', 'box', [1.55, 0.08, 1.18], [0, 1.48, 0], 0x0284c7, 'Модуль 17'],
        ['Допечатная развёртка (PDF/X-1a)', 'Проверка вылетов 3 мм (Bleed) и суммарного лимита краски TIL <= 300%.', 'box', [1.48, 1.38, 1.07], [0, 0.74, 0], 0x4f46e5, 'Модуль 9'],
      ],
    },
    'design-color': {
      key: 'design-color',
      course: 'graphic_design',
      glb: 'assets/models/design-color.glb',
      title: 'Цветовые пространства RGB / CMYK и круг Иттена',
      author: 'АМК · Графический дизайн',
      controlLabel: 'Спектральный баланс CMYK / RGB',
      controlUnit: '%',
      controlMin: 25,
      controlMax: 200,
      controlDefault: 100,
      telemetryFn: (v) => `Профиль: FOGRA39 (300 dpi) · TIL <= ${Math.min(300, Math.round(220 + v * 0.4))}% · Контраст WCAG AA/AAA`,
      parts: [
        ['Аддитивная триада RGB', 'Цветовая модель для экранов (0–255, sRGB / Display P3).', 'box', [0.88, 0.88, 0.88], [-1.18, 0.82, 0], 0x0284c7, 'Модуль 2'],
        ['Субтрактивная триада CMYK', 'Четыре триадные краски (Cyan, Magenta, Yellow, Key Black) для типографии.', 'box', [0.88, 0.88, 0.88], [1.18, 0.82, 0], 0xec4899, 'Модуль 2'],
        ['Цветовой круг Иттена', 'Правило 60–30–10, комплементарные и триадные цветовые схемы.', 'torus', [0.64, 0.15], [0, 0.86, 0], 0xf59e0b, 'Модуль 7'],
        ['Контраст читаемости WCAG 2.1', 'Опорная проверка читаемости текста на фоне (минимум 4.5:1).', 'box', [3.1, 0.12, 1.6], [0, 0.1, 0], 0x4f46e5, 'Модуль 19'],
      ],
    },
    'design-lighting': {
      key: 'design-lighting',
      course: 'graphic_design',
      glb: 'assets/models/design-lighting.glb',
      title: 'Студийный светильник и постановка 3-точечного света',
      author: 'АМК · Графический дизайн',
      controlLabel: 'Яркость рисующего света (Key Light)',
      controlUnit: '%',
      controlMin: 30,
      controlMax: 240,
      controlDefault: 120,
      telemetryFn: (v) => `Key Light: ${v}% · Fill Light: ${Math.round(v * 0.5)}% · Rim Light: ${Math.round(v * 0.75)}%`,
      parts: [
        ['Плафон-рефлектор (Key Light)', 'Основной направленный источник света, формирующий объём и тени.', 'cone', [0.36, 0.68], [-1.5, 1.35, 0.9], 0xf59e0b, 'Модуль 15'],
        ['Светодиодная лампа (3200K–5600K)', 'Задаёт цветовую температуру сцены и блики на глянцевых материалах.', 'cone', [0.32, 0.56], [1.5, 0.95, 0.9], 0x0284c7, 'Модуль 15'],
        ['Штатив и угол постановки 45°', 'Классическая схема освещения Рембрандта для предметного рендера.', 'cone', [0.3, 0.56], [0, 1.55, -1.3], 0x8b5cf6, 'Модуль 16'],
        ['Антибликовое основание', 'Матовая поверхность с контролем шероховатости (Roughness).', 'sphere', [0.60], [0, 0.68, 0], 0x64748b, 'Модуль 16'],
      ],
    },
    'design-typography': {
      key: 'design-typography',
      course: 'graphic_design',
      glb: 'assets/models/design-typography.glb',
      title: 'Модульная сетка плаката, вылеты Bleed и типографика',
      author: 'АМК · Графический дизайн',
      controlLabel: 'Интерлиньяж и масштаб сетки',
      controlUnit: '%',
      controlMin: 100,
      controlMax: 200,
      controlDefault: 145,
      telemetryFn: (v) => `Интерлиньяж: ${(v / 100).toFixed(2)} · Безопасная зона: 5 мм · Сетка колонок выровнена`,
      parts: [
        ['Зона вылетов под обрез (Bleed 3 мм)', 'Фоновый слой выходит за линию реза, исключая белые полосы в тираже.', 'box', [2.5, 0.34, 0.36], [0, 1.45, 0], 0x64748b, 'Модуль 1'],
        ['Акцидентный заголовок H1', 'Главная визуальная доминанта композиции с оптическим кернингом.', 'box', [1.9, 0.22, 0.36], [-0.3, 1.0, 0], 0x4f46e5, 'Модуль 3'],
        ['Многоколоночная текстовая сетка', 'Выравнивание по базовым линиям (Baseline Grid) с длиной строки 50–65 зн.', 'box', [2.2, 0.45, 0.36], [0, 0.48, 0], 0x0284c7, 'Модуль 6'],
        ['Целевой призыв к действию (CTA)', 'Контрастный акцент в нижней трети макета с охранным полем.', 'box', [3.2, 0.08, 1.5], [0, 0.06, 0], 0xf59e0b, 'Модуль 14'],
      ],
    },
    'design-brand': {
      key: 'design-brand',
      course: 'graphic_design',
      glb: 'assets/models/design-brand.glb',
      title: 'Промышленный объект айдентики: металл, стекло и гравировка',
      author: 'АМК · Графический дизайн',
      controlLabel: 'Охранное поле знака (X)',
      controlUnit: '%',
      controlMin: 50,
      controlMax: 200,
      controlDefault: 100,
      telemetryFn: (v) => `Охранное поле: ${(v / 100).toFixed(1)}X · Анизотропия металла · Брендбук синхронизирован`,
      parts: [
        ['Купол из шлифованного металла', 'Демонстрация анизотропного блика на носителе корпоративного стиля.', 'torus', [0.50, 0.16], [0, 1.25, 0], 0x4f46e5, 'Модуль 5'],
        ['Шильд с логотипом бренда', 'Зона нанесения векторного знака с сохранением охранного поля 1X.', 'box', [0.95, 0.75, 0.28], [-1.35, 0.65, 0], 0x0284c7, 'Модуль 10'],
        ['Стеклянный диффузор', 'Физическое преломление света (IOR 1.52) в презентационном рендере.', 'cylinder', [0.42, 0.95], [1.35, 0.65, 0], 0x10b981, 'Модуль 12'],
        ['Фирменная цветовая пара', 'Сочетание графита, латуни и акцента по гайдлайну брендбука.', 'box', [3.2, 0.1, 1.7], [0, 0.08, 0], 0xec4899, 'Модуль 20'],
      ],
    },

    // ================= 5. ВЕБ-ДИЗАЙН / IT (5 моделей) =================
    'it-grid': {
      key: 'it-grid',
      course: 'it',
      glb: 'assets/models/it-grid.glb',
      title: 'Блочная модель CSS (Box Model) и 8px сетка макета',
      author: 'АМК · Веб-дизайн (IT)',
      controlLabel: 'Разнос слоёв Box Model',
      controlUnit: '%',
      controlMin: 20,
      controlMax: 220,
      controlDefault: 100,
      telemetryFn: (v) => `Padding: ${Math.round(v * 0.16)}px · Margin: ${Math.round(v * 0.24)}px · box-sizing: border-box`,
      parts: [
        ['Внешний отступ (Margin)', 'Дистанция снаружи границы блока до соседних элементов сетки.', 'box', [3.2, 0.10, 2.2], [0, 0.08, 0], 0x4f46e5, 'Модуль 3–7'],
        ['Граница элемента (Border)', 'Обрамление карточки; при border-box входит в объявленную ширину.', 'box', [2.7, 0.14, 1.8], [0, 0.30, 0], 0x0284c7, 'Модуль 7'],
        ['Внутренний отступ (Padding)', 'Воздушный буфер между рамкой и контентом, кратный 8px.', 'box', [2.2, 0.16, 1.45], [0, 0.54, 0], 0x10b981, 'Модуль 4'],
        ['Контент (Header + 3 Grid Cards)', 'Сетка CSS Grid / Flexbox с карточками товара и заголовком.', 'box', [1.75, 0.22, 0.28], [0, 0.84, -0.42], 0xf59e0b, 'Модуль 8–13'],
      ],
    },
    'it-dom': {
      key: 'it-dom',
      course: 'it',
      glb: 'assets/models/it-dom.glb',
      title: 'Адаптивный интерфейс (Desktop + Mobile) и дерево DOM',
      author: 'АМК · Веб-дизайн (IT)',
      controlLabel: 'Частота обновления UI',
      controlUnit: ' FPS',
      controlMin: 15,
      controlMax: 144,
      controlDefault: 60,
      telemetryFn: (v) => `Рендер: ${v} FPS · Breakpoints: 1440px & 375px · Переполнения по X нет`,
      parts: [
        ['Десктопный фрейм (1440px)', 'Широкоформатная сетка с навигацией <header> и 3-колоночным <main>.', 'box', [2.25, 1.38, 0.10], [-0.35, 1.15, 0], 0x1e293b, 'Модуль 6'],
        ['Семантические узлы DOM', 'Иерархия <nav>, <section>, <article> с обработчиками addEventListener.', 'box', [1.92, 0.42, 0.04], [-0.35, 1.26, 0.08], 0x0284c7, 'Модуль 9'],
        ['Карточки Auto Layout / Flexbox', 'Гибкие контейнеры, перестраивающиеся без горизонтального скролла.', 'box', [0.58, 0.38, 0.04], [-0.35, 0.78, 0.08], 0x10b981, 'Модуль 10'],
        ['Мобильный вьюпорт (375px @media)', 'Адаптация колонок в 1 вертикальный поток по принципу Mobile-First.', 'box', [0.58, 1.12, 0.09], [1.28, 0.62, 0.25], 0x4f46e5, 'Модуль 11'],
      ],
    },
    'it-server': {
      key: 'it-server',
      course: 'it',
      glb: 'assets/models/it-server.glb',
      title: 'Серверная стойка, REST API и кластер базы данных',
      author: 'АМК · Веб-дизайн (IT)',
      controlLabel: 'Нагрузка запросов (RPS)',
      controlUnit: ' RPS',
      controlMin: 50,
      controlMax: 1500,
      controlDefault: 450,
      telemetryFn: (v) => `Трафик: ${v} req/s · Латентность: ${Math.max(4, Math.round(45 - v * 0.02))} мс · HTTP 200 OK`,
      parts: [
        ['Серверная стойка и блейд-узлы', 'Обрабатывают асинхронные fetch()-запросы клиентов и статику.', 'box', [1.35, 2.1, 1.05], [-0.85, 1.05, 0], 0x334155, 'Модуль 15'],
        ['Шлюз REST API (Flask / JSON)', 'Валидирует входные данные и возвращает структурированный JSON-ответ.', 'box', [1.22, 0.28, 1.08], [-0.85, 1.28, 0.02], 0x0284c7, 'Модуль 16'],
        ['Кластер БД (SQLite / PostgreSQL)', 'Надёжное хранение таблиц пользователей, уроков и оценок студентов.', 'cylinder', [0.55, 0.36], [1.05, 0.80, 0], 0x4f46e5, 'Модуль 16'],
        ['Шина обмена и статус-индикаторы', 'Контроль доступности /api/health и времени отклика сервера.', 'box', [1.3, 0.08, 0.12], [0.1, 0.85, 0], 0x10b981, 'Модуль 20'],
      ],
      loop: true,
    },
    'it-webgl': {
      key: 'it-webgl',
      course: 'it',
      glb: 'assets/models/it-webgl.glb',
      title: 'Конвейер WebGL-сцены: камера, меш и студийный свет',
      author: 'АМК · Веб-дизайн (IT)',
      controlLabel: 'Яркость источников света сцены',
      controlUnit: '%',
      controlMin: 30,
      controlMax: 220,
      controlDefault: 120,
      telemetryFn: (v) => `Свет сцены: ${v}% · Draw Calls: 7 · 60 FPS GPU-рендеринг Three.js`,
      parts: [
        ['PerspectiveCamera и матрица FOV', 'Определяет точку обзора, фокусное расстояние и глубину кадра.', 'box', [0.62, 0.46, 0.48], [-1.15, 0.95, 0.45], 0x0284c7, 'Модуль 14'],
        ['3D-меш и PBR-шейдер', 'Геометрия с материалом MeshStandardMaterial (Roughness / Metalness).', 'box', [0.75, 0.75, 0.75], [0.15, 0.78, 0], 0x4f46e5, 'Модуль 18'],
        ['Directional & Rim освещение', 'Формирует направленные тени и световой контур вокруг объекта.', 'cylinder', [0.22, 0.42], [1.15, 1.55, 0.65], 0xf59e0b, 'Модуль 18'],
        ['Canvas WebGLRenderer', 'Выводит сцену в браузер с частотой 60 FPS через requestAnimationFrame.', 'box', [2.8, 0.10, 1.9], [0, 0.06, 0], 0x334155, 'Модуль 18'],
      ],
    },
    'it-security': {
      key: 'it-security',
      course: 'it',
      glb: 'assets/models/it-security.glb',
      title: 'Эшелонированная защита веб-приложения (OWASP)',
      author: 'АМК · Веб-дизайн (IT)',
      controlLabel: 'Уровень фильтрации WAF',
      controlUnit: '%',
      controlMin: 50,
      controlMax: 200,
      controlDefault: 100,
      telemetryFn: (v) => `Защита: ${v}% · HttpOnly + RBAC + escapeHtml() активны · XSS/SQLi заблокированы`,
      parts: [
        ['Щит RBAC-авторизации', 'Проверяет роль пользователя (Студент / Преподаватель / Админ) на сервере.', 'box', [1.15, 1.35, 0.24], [0, 0.92, 0], 0x4f46e5, 'Модуль 17'],
        ['Контур HttpOnly Session Cookie', 'Защищает токен сессии от кражи через клиентский JavaScript.', 'box', [0.45, 0.75, 0.18], [-1.05, 0.78, 0.25], 0x0284c7, 'Модуль 17'],
        ['Санитайзер escapeHtml()', 'Экранирует HTML-теги перед вставкой в DOM, нейтрализуя Stored XSS.', 'box', [0.45, 0.75, 0.18], [1.05, 0.78, 0.25], 0xf59e0b, 'Модуль 17'],
        ['Параметризованный SQL-шлюз', 'Разделяет SQL-команду и пользовательские данные через плейсхолдеры.', 'cylinder', [0.48, 0.34], [0, 0.18, 0.95], 0x10b981, 'Модуль 17'],
      ],
    },
  };

  const COURSE_MODEL_KEYS = {
    it: ['it-grid', 'it-dom', 'it-server', 'it-webgl', 'it-security'],
    graphic_design: ['design-color', 'design-typography', 'design-packaging', 'design-lighting', 'design-brand'],
    autoelectric: ['autoel-charging', 'autoel-can', 'autoel-sensors', 'autoel-ignition', 'autoel-hv'],
    hvac: ['hvac-cycle', 'hvac-chiller', 'hvac-inverter', 'hvac-vrf', 'hvac-service'],
    automechanic: ['mech-turbo', 'mech-cylinder', 'mech-transmission', 'mech-suspension', 'mech-brakes'],
  };

  function resolveModelKey(slug, orderNum) {
    const n = Number(orderNum) || 1;
    if (slug === 'it') {
      if (n <= 5 || n === 7 || n === 13) return 'it-grid';
      if (n === 6 || n === 8 || n === 9 || n === 10 || n === 11 || n === 12) return 'it-dom';
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
      if (n === 19 || n === 9) return 'autoel-hv';
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
      if (n === 1 || n === 13 || n === 14 || n === 19) return 'mech-turbo';
      if (n <= 4 || n === 17 || n === 18 || n === 20) return 'mech-cylinder';
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

  function show(canvas, definition, options = {}) {
    if (!definition || !canvas) return undefined;
    let activeDef = definition;
    const courseSlug = options.courseSlug || activeDef.course || 'it';
    const courseKeys = COURSE_MODEL_KEYS[courseSlug] || COURSE_MODEL_KEYS.it;
    const allowModelSwitch = options.allowModelSwitch !== false;

    let innerCleanup = null;

    function mountModel(def) {
      if (innerCleanup) {
        try { innerCleanup(); } catch {}
        innerCleanup = null;
      }
      activeDef = def;
      const { title, parts } = def;
      const modelKey = def.key || 'it-grid';
      const glbUrl = def.glb || `assets/models/${modelKey}.glb`;
      const ctrlLabel = def.controlLabel || 'Режим и скорость узла';
      const ctrlUnit = def.controlUnit || '%';
      const ctrlMin = def.controlMin ?? 20;
      const ctrlMax = def.controlMax ?? 200;
      const ctrlDef = def.controlDefault ?? 100;

      const courseSwitcherHtml = allowModelSwitch ? `
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:12px;" role="group" aria-label="3D-модели курса">
          <span style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-right:4px;">Модели курса (${courseKeys.length}):</span>
          ${courseKeys.map((k, idx) => {
            const m = models[k];
            const isAct = k === modelKey;
            return `<button type="button" data-switch-model="${k}" aria-pressed="${isAct}" style="padding:5px 11px;border-radius:999px;font-size:11px;font-weight:700;cursor:pointer;transition:all 150ms ease;border:1px solid ${isAct ? '#38bdf8' : 'rgba(255,255,255,0.16)'};background:${isAct ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.06)'};color:${isAct ? '#7dd3fc' : '#cbd5e1'};">3D #${idx + 1}: ${m.title.split(':')[0].slice(0, 24)}</button>`;
          }).join('')}
        </div>
      ` : '';

      const thumbs = [
        { label: 'Общий 3/4', angle: 0.55, pitch: 2.35, zoom: 4.8, explode: 0, wire: false, clay: false },
        { label: 'Спереди', angle: 0.0, pitch: 2.1, zoom: 4.5, explode: 0, wire: false, clay: false },
        { label: 'Профиль', angle: 1.57, pitch: 2.0, zoom: 4.6, explode: 0, wire: false, clay: false },
        { label: 'Сверху', angle: 0.0, pitch: 4.4, zoom: 5.2, explode: 0, wire: false, clay: false },
        { label: 'Крупно', angle: -0.45, pitch: 1.95, zoom: 3.3, explode: 0, wire: false, clay: false },
        { label: 'Взрыв-схема', angle: 0.65, pitch: 2.5, zoom: 5.4, explode: 1, wire: false, clay: false },
        { label: 'Clay (Скульпт)', angle: 0.55, pitch: 2.35, zoom: 4.8, explode: 0, wire: false, clay: true },
        { label: 'Wireframe', angle: -0.65, pitch: 2.35, zoom: 4.8, explode: 0, wire: true, clay: false },
      ];

      canvas.innerHTML = `
        <section class="starter-panel workshop-model-panel" style="background:#0f172a;border:1px solid rgba(56,189,248,0.22);border-radius:18px;padding:18px;color:#f8fafc;">
          ${courseSwitcherHtml}
          <div class="starter-heading" style="margin-bottom:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <span style="font-size:11px;font-weight:800;color:#38bdf8;letter-spacing:0.06em;">${def.author || 'АМК · 3D-СТЕНД'} · GLB 2.0</span>
              <span id="wm-loading-badge" style="padding:3px 10px;border-radius:999px;background:rgba(56,189,248,0.14);border:1px solid rgba(56,189,248,0.35);color:#7dd3fc;font-size:11px;font-weight:700;">Загрузка 3D (.glb)…</span>
            </div>
            <h2 style="margin:4px 0 4px;font-size:1.25rem;color:#ffffff;">${title}</h2>
            <p style="margin:0;font-size:12.5px;color:#94a3b8;">Вращайте 3D-модель мышью, переключайте ракурсы и режимы рендера или выберите узел справа.</p>
          </div>

          <div class="starter-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;align-items:start;">
            <div>
              <div class="workshop-visual" aria-label="${title}" style="width:100%;height:340px;border-radius:14px;background:radial-gradient(circle at 50% 35%, #1e293b 0%, #090d16 80%);border:1px solid rgba(255,255,255,0.1);cursor:grab;touch-action:none;" hidden></div>

              <div role="group" aria-label="Ракурсы и режимы 3D" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:8px;">
                ${thumbs.map((th, idx) => `
                  <button type="button" data-thumb-idx="${idx}" style="padding:6px 8px;border-radius:8px;border:1px solid ${idx === 0 ? '#38bdf8' : 'rgba(255,255,255,0.12)'};background:${idx === 0 ? 'rgba(56,189,248,0.16)' : 'rgba(255,255,255,0.04)'};color:#e2e8f0;font-size:11px;font-weight:700;cursor:pointer;text-align:center;">${th.label}</button>
                `).join('')}
              </div>

              <div class="starter-view" role="group" aria-label="Управление 3D-видом" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;" hidden>
                <button type="button" class="starter-button" data-angle="-1">⟲ Влево</button>
                <button type="button" class="starter-button" data-angle="1">⟳ Вправо</button>
                <button type="button" class="starter-button" data-action="explode" aria-pressed="false">Взрыв-схема</button>
                <button type="button" class="starter-button" data-action="wireframe" aria-pressed="false">Сетка</button>
                <button type="button" class="starter-button" data-action="autorotate" aria-pressed="true">Авто</button>
                <button type="button" class="starter-button" data-angle="0">Сброс</button>
              </div>
            </div>

            <aside class="starter-sidebar" aria-label="Узлы модели" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;">
              <strong style="font-size:13.5px;color:#ffffff;">Разбор узлов модели (${parts.length})</strong>
              <div style="display:flex;flex-direction:column;gap:7px;">
                ${parts.map(([label, , , , , hexCol, modTag], i) => {
                  const colHex = '#' + (hexCol || 0x38bdf8).toString(16).padStart(6, '0');
                  return `
                    <button type="button" class="starter-button wm-assembly-card" data-part="${i}" aria-pressed="${i === 0 ? 'true' : 'false'}" style="width:100%;text-align:left;padding:9px 11px;border-radius:10px;border:1px solid ${i === 0 ? '#38bdf8' : 'rgba(255,255,255,0.12)'};background:${i === 0 ? 'rgba(56,189,248,0.14)' : 'rgba(15,23,42,0.75)'};display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;">
                      <span style="display:flex;align-items:center;gap:8px;min-width:0;">
                        <span style="width:10px;height:10px;border-radius:50%;background:${colHex};flex-shrink:0;"></span>
                        <span style="font-size:12.5px;font-weight:700;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i + 1}. ${label}</span>
                      </span>
                      <span style="font-size:10.5px;font-family:monospace;color:#94a3b8;flex-shrink:0;">${modTag || 'АМК'}</span>
                    </button>
                  `;
                }).join('')}
              </div>

              <p role="status" style="margin:0;padding:10px 12px;border-radius:10px;background:rgba(15,23,42,0.9);border:1px solid rgba(255,255,255,0.08);font-size:12px;color:#e2e8f0;line-height:1.45;">
                ${parts[0] ? `Узел #1 (${parts[0][0]}): ${parts[0][1]}` : 'Выберите узел из списка, чтобы изучить его назначение.'}
              </p>

              <div style="padding:10px 12px;border-radius:10px;background:rgba(15,23,42,0.9);border:1px solid rgba(56,189,248,0.2);display:flex;flex-direction:column;gap:5px;">
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;">
                  <label for="wm-sim-range" style="font-weight:700;color:#cbd5e1;">🎛️ ${ctrlLabel}:</label>
                  <strong id="wm-sim-val" style="color:#38bdf8;font-family:monospace;">${ctrlDef}${ctrlUnit}</strong>
                </div>
                <input id="wm-sim-range" type="range" min="${ctrlMin}" max="${ctrlMax}" value="${ctrlDef}" style="width:100%;accent-color:#4f46e5;cursor:pointer;">
                <div id="wm-telemetry-readout" style="font-size:11px;color:#7dd3fc;font-family:monospace;">⚡ ${def.telemetryFn ? def.telemetryFn(ctrlDef) : 'Параметры в норме'}</div>
              </div>

              <a href="${glbUrl}" download="${modelKey}.glb" style="width:100%;padding:10px 14px;border-radius:10px;background:#4f46e5;color:#ffffff;font-weight:700;font-size:12.5px;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;">
                <span>⬇ Скачать 3D-модель (.GLB)</span>
              </a>
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
      const thumbBtns = canvas.querySelectorAll('[data-thumb-idx]');
      const loadingBadge = canvas.querySelector('#wm-loading-badge');
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
        status.textContent = 'WebGL недоступен. Выберите узел из списка, чтобы прочитать описание.';
      }

      let fallbackMeshes = [];
      let gltfMeshes = [];
      let mixer = null;
      let selectedIndex = -1;
      let targetExplode = 0;
      let explodeFactor = 0;
      let wireframeMode = false;
      let clayMode = false;
      let angle = 0.55;
      let pitch = 2.35;
      let radius = 4.8;
      let autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const selectPart = (idx) => {
        selectedIndex = idx;
        buttons.forEach((peer, bi) => {
          const isSel = bi === idx;
          peer.setAttribute('aria-pressed', String(isSel));
          peer.style.borderColor = isSel ? '#38bdf8' : 'rgba(255,255,255,0.12)';
          peer.style.background = isSel ? 'rgba(56,189,248,0.14)' : 'rgba(15,23,42,0.75)';
        });
        if (parts[idx]) {
          status.textContent = `Узел #${idx + 1} (${parts[idx][0]}): ${parts[idx][1]}`;
        }
      };

      const applyShaderFlags = () => {
        gltfMeshes.forEach((m) => {
          if (!m.userData.origMat) m.userData.origMat = m.material;
          if (!m.userData.clayMat) {
            m.userData.clayMat = new T.MeshStandardMaterial({ color: 0xd6d1c7, roughness: 0.65, metalness: 0.05, side: T.DoubleSide });
          }
          m.material = clayMode ? m.userData.clayMat : m.userData.origMat;
          if (m.material) m.material.wireframe = wireframeMode;
        });
        fallbackMeshes.forEach((m) => {
          if (m.material) m.material.wireframe = wireframeMode;
        });
      };

      if (renderer) {
        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(38, 1, 0.1, 60);
        if (renderer.outputEncoding !== undefined && T.sRGBEncoding !== undefined) {
          renderer.outputEncoding = T.sRGBEncoding;
        }
        if (renderer.toneMapping !== undefined && T.ACESFilmicToneMapping !== undefined) {
          renderer.toneMapping = T.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.24;
        }

        // Procedural Studio Softbox Environment Map for realistic PBR metal/glass reflections
        try {
          const envCanvas = document.createElement('canvas');
          envCanvas.width = 256;
          envCanvas.height = 128;
          const ectx = envCanvas.getContext('2d');
          const bgGrad = ectx.createLinearGradient(0, 0, 0, 128);
          bgGrad.addColorStop(0.0, '#1e293b');
          bgGrad.addColorStop(0.45, '#475569');
          bgGrad.addColorStop(0.55, '#0f172a');
          bgGrad.addColorStop(1.0, '#090d16');
          ectx.fillStyle = bgGrad;
          ectx.fillRect(0, 0, 256, 128);
          // Studio softbox highlights
          ectx.fillStyle = '#ffffff';
          ectx.fillRect(28, 12, 68, 22);
          ectx.fillStyle = '#e0f2fe';
          ectx.fillRect(148, 16, 76, 18);
          ectx.fillStyle = '#93c5fd';
          ectx.fillRect(92, 48, 52, 8);
          ectx.fillStyle = '#f8fafc';
          ectx.fillRect(10, 42, 24, 14);
          const rawEnvTex = new T.CanvasTexture(envCanvas);
          rawEnvTex.mapping = T.EquirectangularReflectionMapping;
          if (T.sRGBEncoding !== undefined) rawEnvTex.encoding = T.sRGBEncoding;
          if (typeof T.PMREMGenerator === 'function') {
            const pmrem = new T.PMREMGenerator(renderer);
            pmrem.compileEquirectangularShader();
            scene.environment = pmrem.fromEquirectangular(rawEnvTex).texture;
            rawEnvTex.dispose();
            pmrem.dispose();
          } else {
            scene.environment = rawEnvTex;
          }
        } catch (e) {}

        const keyLight = new T.DirectionalLight(0xffffff, 2.1);
        keyLight.position.set(4.5, 6.5, 5.0);
        const fillLight = new T.DirectionalLight(0x93c5fd, 1.15);
        fillLight.position.set(-4.5, 3.5, 3.5);
        const rimLight = new T.PointLight(0x38bdf8, 1.4, 22);
        rimLight.position.set(0, 4.5, -5.0);
        scene.add(keyLight, fillLight, rimLight, new T.HemisphereLight(0xffffff, 0x1e293b, 1.2));

        const floorDisc = new T.Mesh(
          new T.CircleGeometry(2.6, 48),
          new T.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.35, roughness: 0.65, transparent: true, opacity: 0.72 })
        );
        floorDisc.rotation.x = -Math.PI / 2;
        floorDisc.position.y = -0.15;
        scene.add(floorDisc);

        const grid = new T.GridHelper(6.5, 14, 0x38bdf8, 0x1e293b);
        grid.position.y = -0.14;
        if (grid.material) {
          grid.material.transparent = true;
          grid.material.opacity = 0.28;
        }
        scene.add(grid);

        const fallbackGroup = new T.Group();
        const basePositions = [];
        fallbackMeshes = parts.map(([, , shape, params, position, color]) => {
          const mat = new T.MeshStandardMaterial({
            color,
            roughness: 0.32,
            metalness: 0.42,
            side: T.DoubleSide
          });
          const item = new T.Mesh(geometry(T, shape, params), mat);
          item.position.set(...position);
          basePositions.push(new T.Vector3(...position));
          fallbackGroup.add(item);
          return item;
        });
        scene.add(fallbackGroup);

        const gltfRoot = new T.Group();
        scene.add(gltfRoot);

        if (T.GLTFLoader) {
          const loader = new T.GLTFLoader();
          loader.load(
            glbUrl,
            (gltf) => {
              const modelScene = gltf.scene || (gltf.scenes && gltf.scenes[0]);
              if (!modelScene) return;

              const box = new T.Box3().setFromObject(modelScene);
              const size = new T.Vector3();
              box.getSize(size);
              const maxDim = Math.max(size.x, size.y, size.z, 0.001);
              modelScene.scale.setScalar(3.1 / maxDim);

              const scaledBox = new T.Box3().setFromObject(modelScene);
              const scaledCenter = new T.Vector3();
              scaledBox.getCenter(scaledCenter);
              modelScene.position.x -= scaledCenter.x;
              modelScene.position.z -= scaledCenter.z;
              modelScene.position.y -= scaledBox.min.y + 0.08;

              gltfMeshes = [];
              modelScene.traverse((child) => {
                if (child.isMesh) {
                  child.userData.origPos = child.position.clone();
                  const worldPos = new T.Vector3();
                  child.getWorldPosition(worldPos);
                  child.userData.explodeDir = worldPos.clone().sub(new T.Vector3(0, 0.6, 0)).normalize();
                  if (child.material) {
                    child.material = child.material.clone();
                    if (child.material.envMapIntensity !== undefined) {
                      child.material.envMapIntensity = 1.25;
                    }
                  }
                  gltfMeshes.push(child);
                }
              });

              if (gltf.animations && gltf.animations.length > 0 && T.AnimationMixer) {
                mixer = new T.AnimationMixer(modelScene);
                gltf.animations.forEach((clip) => {
                  try { mixer.clipAction(clip).play(); } catch {}
                });
              }

              fallbackGroup.visible = false;
              gltfRoot.add(modelScene);
              applyShaderFlags();
              if (loadingBadge) {
                loadingBadge.textContent = `✓ GLB 3D · ${gltfMeshes.length} дет.`;
                loadingBadge.style.color = '#34d399';
                loadingBadge.style.borderColor = 'rgba(52,211,153,0.45)';
              }
            },
            undefined,
            () => {
              if (loadingBadge) loadingBadge.textContent = '3D CAD Режим';
            }
          );
        }

        let dragging = false;
        let lastX = 0;
        let lastY = 0;
        let rafId = null;

        stage.hidden = false;
        toolbar.hidden = false;
        stage.append(renderer.domElement);

        const syncSize = () => {
          const width = stage.clientWidth || 380;
          const height = stage.clientHeight || 320;
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
          lastX = e.clientX;
          lastY = e.clientY;
          stage.style.cursor = 'grabbing';
        });
        const onPointerUp = () => {
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
          pitch = Math.max(0.65, Math.min(4.8, pitch + dy * 0.01));
        });
        stage.addEventListener('wheel', (e) => {
          e.preventDefault();
          radius = Math.max(2.4, Math.min(8.5, radius + e.deltaY * 0.003));
        }, { passive: false });

        thumbBtns.forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-thumb-idx')) || 0;
            const preset = thumbs[idx] || thumbs[0];
            angle = preset.angle;
            pitch = preset.pitch;
            radius = preset.zoom;
            targetExplode = preset.explode;
            wireframeMode = preset.wire;
            clayMode = preset.clay;
            applyShaderFlags();
            thumbBtns.forEach((b, bi) => {
              b.style.borderColor = bi === idx ? '#38bdf8' : 'rgba(255,255,255,0.12)';
              b.style.background = bi === idx ? 'rgba(56,189,248,0.16)' : 'rgba(255,255,255,0.04)';
            });
          });
        });

        toolbar.querySelectorAll('button').forEach((button) => {
          button.addEventListener('click', () => {
            if (button.dataset.action === 'explode') {
              targetExplode = targetExplode > 0 ? 0 : 1;
              button.setAttribute('aria-pressed', String(targetExplode > 0));
            } else if (button.dataset.action === 'wireframe') {
              wireframeMode = !wireframeMode;
              button.setAttribute('aria-pressed', String(wireframeMode));
              applyShaderFlags();
            } else if (button.dataset.action === 'autorotate') {
              autoRotate = !autoRotate;
              button.setAttribute('aria-pressed', String(autoRotate));
            } else {
              const step = Number(button.dataset.angle);
              if (step === 0) {
                angle = 0.55;
                pitch = 2.35;
                radius = 4.8;
                targetExplode = 0;
                wireframeMode = false;
                clayMode = false;
                applyShaderFlags();
              } else {
                angle += step * 0.45;
              }
            }
          });
        });

        let lastTime = performance.now();
        const clockStart = lastTime;
        const tick = (now) => {
          rafId = requestAnimationFrame(tick);
          const dt = Math.min(0.05, (now - lastTime) * 0.001) * simMultiplier;
          lastTime = now;
          const t = (now - clockStart) * 0.001 * simMultiplier;

          if (autoRotate && !dragging) {
            angle += 0.0045 * Math.min(1.8, simMultiplier);
          }
          explodeFactor += (targetExplode - explodeFactor) * 0.1;

          if (mixer) {
            try { mixer.update(dt); } catch {}
          }

          if (gltfMeshes.length > 0) {
            const groupSize = Math.max(1, Math.ceil(gltfMeshes.length / parts.length));
            gltfMeshes.forEach((m, mIdx) => {
              const orig = m.userData.origPos;
              const dir = m.userData.explodeDir;
              if (orig && dir) {
                m.position.set(
                  orig.x + dir.x * explodeFactor * 0.45,
                  orig.y + dir.y * explodeFactor * 0.45,
                  orig.z + dir.z * explodeFactor * 0.45
                );
              }
              if (m.material && m.material.emissive) {
                const belongGroup = Math.floor(mIdx / groupSize);
                if (selectedIndex >= 0 && belongGroup === selectedIndex) {
                  const pulse = 0.28 + Math.sin(t * 4.5) * 0.16;
                  m.material.emissive.setHex(0x0284c7);
                  m.material.emissiveIntensity = pulse;
                } else {
                  m.material.emissive.setHex(0x000000);
                  m.material.emissiveIntensity = 0;
                }
              }
            });
          }

          if (fallbackGroup.visible) {
            fallbackMeshes.forEach((mesh, idx) => {
              const base = basePositions[idx];
              const radial = base.clone().normalize().multiplyScalar(explodeFactor * 0.65);
              mesh.position.set(base.x + radial.x, base.y + radial.y + explodeFactor * idx * 0.18, base.z + radial.z);
            });
          }

          camera.position.set(Math.sin(angle) * radius, pitch, Math.cos(angle) * radius);
          camera.lookAt(0, 0.65, 0);
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
