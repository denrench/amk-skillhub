/* ========================================================
   AMK SKILLHUB: COMPREHENSIVE CURRICULUM DATA (data.js)
   50 Practical Tasks (10 per Specialty) + Modes & Roles
   ======================================================== */

const AMK_DATA = {
  // Student Profile
  student: {
    name: "Асылхан Бауыржанұлы",
    group: "ПО-22",
    course: 3,
    college: "Алматинский многопрофильный колледж",
    id: "KZ-AMK-2026-98421",
    skillPoints: 920,
    skills: {
      it: 94,
      auto: 88,
      cryo: 91,
      design: 85,
      furniture: 80
    }
  },

  // 5 College Specialties with Vibrant Brand Colors
  specialties: [
    {
      code: "06130100",
      slug: "it",
      category: "tech",
      icon: "💻",
      material_icon: "terminal",
      color: "#0ea5e9",
      gradient: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
      title_ru: "Программное обеспечение (IT)",
      title_kz: "Бағдарламалық қамтамасыз ету",
      desc_ru: "Алгоритмизация, веб-разработка, автоматизация баз данных и юнит-тестирование V8.",
      desc_kz: "Алгоритмдеу, веб-бағдарламалау, деректер қоры және тестілеу.",
      tags: ["JavaScript", "SQL", "Алгоритмы", "10 заданий"],
      tasksCount: 10
    },
    {
      code: "07161300",
      slug: "auto",
      category: "auto",
      icon: "🚗",
      material_icon: "directions_car",
      color: "#f97316",
      gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
      title_ru: "ТО и ремонт автомобильного транспорта",
      title_kz: "Автокөлік құралдарына ТҚК және жөндеу",
      desc_ru: "Компьютерная диагностика через сканер OBD-II, осциллограф, мультиметр и ремонт ДВС.",
      desc_kz: "OBD-II компьютерлік диагностикасы, осциллограф және ІЖҚ жөндеу.",
      tags: ["OBD-II", "Осциллограф", "Мультиметр", "10 заданий"],
      tasksCount: 10
    },
    {
      code: "07150900",
      slug: "cryo",
      category: "eng",
      icon: "❄️",
      material_icon: "ac_unit",
      color: "#06b6d4",
      gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
      title_ru: "Монтаж и эксплуатация холодильных машин",
      title_kz: "Тоңазытқыш-компрессорлық машиналарды пайдалану",
      desc_ru: "Термодинамический цикл R134a/R404A, балансировка компрессора, дросселя ТРВ и COP.",
      desc_kz: "R134a/R404A термодинамикалық циклі, ТРВ реттеу және COP тиімділігі.",
      tags: ["Хладагенты", "Компрессоры", "ТРВ-вентиль", "10 заданий"],
      tasksCount: 10
    },
    {
      code: "02110300",
      slug: "design",
      category: "design",
      icon: "🎨",
      material_icon: "palette",
      color: "#ec4899",
      gradient: "linear-gradient(135deg, #db2777 0%, #ec4899 100%)",
      title_ru: "Графический и мультимедийный дизайн",
      title_kz: "Графикалық және мультимедиялық дизайн",
      desc_ru: "Экспертный UI/UX аудит, стандарты доступности WCAG 2.1 AA, типографика и модульная сетка.",
      desc_kz: "UI/UX аудит, WCAG қолжетімділік стандарты және типографика.",
      tags: ["UI/UX Аудит", "WCAG 2.1", "Типографика", "10 заданий"],
      tasksCount: 10
    },
    {
      code: "07221400",
      slug: "furniture",
      category: "prod",
      icon: "🪑",
      material_icon: "chair",
      color: "#eab308",
      gradient: "linear-gradient(135deg, #ca8a04 0%, #eab308 100%)",
      title_ru: "Производство мебели и раскрой на ЧПУ",
      title_kz: "Жиһаз өндірісі және ЧПУ пішу",
      desc_ru: "2D оптимизация раскроя плит ЛДСП 2800×2070, расчет толщины пропила диска и минимизация отходов.",
      desc_kz: "ЛДСП 2800×2070 тақталарын 2D оңтайлы пішу және қалдықты азайту.",
      tags: ["ЧПУ Раскрой", "Карты распила", "Смета ЛДСП", "10 заданий"],
      tasksCount: 10
    }
  ],

  // 10 Tasks per Specialty (50 Tasks Total)
  tasks: {
    it: [
      {
        id: "it-1",
        num: 1,
        title: "Начисление академической стипендии",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: true, // Назначено учителем
        ticketNum: "Билет №1",
        desc: "Реализуйте расчет выплаты студенту: балл >= 4.5 и посещаемость >= 90% -> Повышенная (45 000 ₸); балл >= 3.5 и посещаемость >= 75% -> Обычная (35 000 ₸); иначе -> Не назначена (0 ₸).",
        codeSnippet: `function calculateScholarship(gradeAvg, attendanceRate) {
  if (gradeAvg >= 4.5 && attendanceRate >= 90) {
    return "Повышенная (45 000 ₸)";
  } else if (gradeAvg >= 3.5 && attendanceRate >= 75) {
    return "Обычная (35 000 ₸)";
  } else {
    return "Не назначена (0 ₸)";
  }
}`
      },
      {
        id: "it-2",
        num: 2,
        title: "Валидация казахстанского ИИН",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Проверьте корректность ИИН гражданина РК: строка строго из 12 цифр, корректный век рождения (7-я цифра от 1 до 6).",
        codeSnippet: `function validateIIN(iin) {
  if (typeof iin !== 'string' || iin.length !== 12) return false;
  if (!/^\\d{12}$/.test(iin)) return false;
  const century = parseInt(iin[6], 10);
  return century >= 1 && century <= 6;
}`
      },
      {
        id: "it-3",
        num: 3,
        title: "Расчет пенсионных отчислений (ЕНПФ 10%)",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Начислите обязательный пенсионный взнос (10% от оклада, но не более 50 МЗП в 2026 году = 425 000 ₸).",
        codeSnippet: `function calculatePension(salary) {
  const maxDeduction = 425000;
  const pension = salary * 0.10;
  return Math.min(pension, maxDeduction);
}`
      },
      {
        id: "it-4",
        num: 4,
        title: "Фильтрация абитуриентов по проходному баллу",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: true,
        ticketNum: "Билет №4",
        desc: "Отфильтруйте массив абитуриентов колледжа, вернув только тех, чей аттестационный балл >= 4.0, отсортировав по убыванию.",
        codeSnippet: `function filterApplicants(list) {
  return list
    .filter(a => a.score >= 4.0)
    .sort((a, b) => b.score - a.score);
}`
      },
      {
        id: "it-5",
        num: 5,
        title: "Форматирование телефонного номера (+7)",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Преобразуйте введенные 10 цифр (например 7771234567) в маску +7 (777) 123-45-67.",
        codeSnippet: `function formatKazakhPhone(digits) {
  const clean = digits.replace(/\\D/g, '').slice(-10);
  return \`+7 (\${clean.slice(0,3)}) \${clean.slice(3,6)}-\${clean.slice(6,8)}-\${clean.slice(8,10)}\`;
}`
      },
      {
        id: "it-6",
        num: 6,
        title: "Расчет среднего балла успеваемости (GPA)",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Вычислите средний балл студента по 5 экзаменационным предметам и округлите до 2 знаков после запятой.",
        codeSnippet: `function calculateGPA(grades) {
  if (!grades || grades.length === 0) return 0;
  const sum = grades.reduce((acc, g) => acc + g, 0);
  return Number((sum / grades.length).toFixed(2));
}`
      },
      {
        id: "it-7",
        num: 7,
        title: "Конвертер валют по курсу Нацбанка РК",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Конвертируйте сумму в тенге (KZT) в доллары (USD) по фиксированному курсу 495.50 ₸ с учетом комиссии банка 1%.",
        codeSnippet: `function convertKztToUsd(amountKzt) {
  const rate = 495.50;
  const fee = 0.01;
  const usable = amountKzt * (1 - fee);
  return Number((usable / rate).toFixed(2));
}`
      },
      {
        id: "it-8",
        num: 8,
        title: "Поиск дубликатов в базе студентов",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: true,
        ticketNum: "Билет №8",
        desc: "Найдите дублирующиеся студенческие билеты в массиве регистраций деканата и верните уникальный список повторов.",
        codeSnippet: `function findDuplicates(idList) {
  const seen = new Set();
  const duplicates = new Set();
  for (const id of idList) {
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  }
  return Array.from(duplicates);
}`
      },
      {
        id: "it-9",
        num: 9,
        title: "Валидация корпоративного email @amk.edu.kz",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Проверьте, принадлежит ли почта официальному почтовому домену колледжа АМК @amk.edu.kz.",
        codeSnippet: `function validateAmkEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@amk\\.edu\\.kz$/i;
  return regex.test(String(email).trim());
}`
      },
      {
        id: "it-10",
        num: 10,
        title: "Шифрование пароля (Хеш-сумма)",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: false,
        desc: "Реализуйте контрольный алгоритм проверки надежности пароля: длина >= 8, наличие цифры, спецсимвола и заглавной буквы.",
        codeSnippet: `function isPasswordStrong(pwd) {
  if (pwd.length < 8) return false;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*]/.test(pwd);
  return hasUpper && hasDigit && hasSpecial;
}`
      }
    ],

    auto: [
      {
        id: "auto-1",
        num: 1,
        title: "Ошибка P0301: Пропуск зажигания цилиндра 1",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: true,
        ticketNum: "Билет №1",
        desc: "Горит Check Engine. Считайте DTC, проверьте катушку мультиметром (1.1 Ом), замените неисправную и сбросьте память ЭБУ.",
        faultCode: "P0301",
        targetPart: "Катушка зажигания цилиндра #1"
      },
      {
        id: "auto-2",
        num: 2,
        title: "Ошибка P0171: Бедная смесь банк 1 (ДМРВ)",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Двигатель троит на холостых. Диагностируйте датчик массового расхода воздуха (MAF), устраните подсос воздуха во впускном тракте.",
        faultCode: "P0171",
        targetPart: "Датчик массового расхода воздуха (MAF)"
      },
      {
        id: "auto-3",
        num: 3,
        title: "Ошибка P0420: Эффективность катализатора ниже порога",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Проверьте напряжение заднего лямбда-зонда. Зафиксируйте отсутствие синусоиды переключения и замените датчик кислорода O2.",
        faultCode: "P0420",
        targetPart: "Кислородный датчик лямбда-зонд #2"
      },
      {
        id: "auto-4",
        num: 4,
        title: "Замер компрессии в 4-цилиндровом ДВС",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: true,
        ticketNum: "Билет №4",
        desc: "Подключите компрессометр при выжатой педали газа. Норма 12.5 - 13.5 бар. Выявите цилиндр с падением давления.",
        faultCode: "COMP-TEST",
        targetPart: "Клапанный механизм цилиндра #3"
      },
      {
        id: "auto-5",
        num: 5,
        title: "Диагностика цепи генератора (Напряжение зарядки)",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Замерьте напряжение на клеммах АКБ под нагрузкой. Напряжение должно быть строго в диапазоне 13.8 — 14.4 В.",
        faultCode: "BATT-GEN",
        targetPart: "Реле-регулятор генератора"
      },
      {
        id: "auto-6",
        num: 6,
        title: "Проверка датчика коленвала ДПКВ осциллографом",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: false,
        desc: "Снимите сигнал индуктивного датчика коленвала на 60-2 реперном диске. Зафиксируйте правильный пропуск двух зубьев.",
        faultCode: "P0335",
        targetPart: "Датчик положения коленчатого вала"
      },
      {
        id: "auto-7",
        num: 7,
        title: "Ошибка P0115: Неисправность датчика температуры ДТОЖ",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Вентилятор радиатора молотит непрерывно. Замерьте сопротивление NTC-термистора (норма 2500 Ом при +20°C).",
        faultCode: "P0115",
        targetPart: "Датчик температуры ОЖ (ДТОЖ)"
      },
      {
        id: "auto-8",
        num: 8,
        title: "Тест электромагнитных форсунок впрыска топлива",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: true,
        ticketNum: "Билет №8",
        desc: "Проверьте баланс форсунок и сопротивление обмотки (норма 12-14 Ом). Очистите форсунку ультразвуком.",
        faultCode: "P0200",
        targetPart: "Топливная форсунка MPI"
      },
      {
        id: "auto-9",
        num: 9,
        title: "Диагностика системы ABS: Обрыв датчика скорости колеса",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Горит лампа ABS. Считайте код ошибки C0035, замерьте сигнал датчика Холла переднего левого ступичного узла.",
        faultCode: "C0035",
        targetPart: "Датчик ABS переднего левого колеса"
      },
      {
        id: "auto-10",
        num: 10,
        title: "Замер тока утечки покоя бортовой сети",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: false,
        desc: "АКБ разряжается за ночь. Включите амперметр в разрыв минусовой клеммы. Норма тока покоя автомобиля < 0.04 А.",
        faultCode: "DRAIN-TEST",
        targetPart: "Блок комфорта BCM (утечка тока)"
      }
    ],

    cryo: [
      {
        id: "cryo-1",
        num: 1,
        title: "Балансировка контура R134a продуктового склада",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: true,
        ticketNum: "Билет №1",
        desc: "Регулируйте компрессор и вентиль ТРВ: HP должно быть 13.0 — 15.0 bar, LP — 2.0 — 2.3 bar. Достигните COP > 3.20.",
        refrigerant: "R134a",
        targetHp: [13.0, 15.0],
        targetLp: [2.0, 2.3]
      },
      {
        id: "cryo-2",
        num: 2,
        title: "Вакуумирование контура перед заправкой",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Подключите двухступенчатый вакуумный насос. Создайте остаточное давление -0.98 bar и проверьте контур на герметичность (15 мин).",
        refrigerant: "R134a",
        targetLp: [-0.98, -0.95]
      },
      {
        id: "cryo-3",
        num: 3,
        title: "Настройка терморегулирующего вентиля (ТРВ)",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Отрегулируйте перегрев на выходе из испарителя (Superheat) до нормы 6 — 8 К во избежание влажного хода компрессора.",
        refrigerant: "R404A",
        targetLp: [1.8, 2.2]
      },
      {
        id: "cryo-4",
        num: 4,
        title: "Настройка зимнего пуска компрессора (-25°C Алматы)",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: true,
        ticketNum: "Билет №4",
        desc: "Включите подогреватель картера компрессора и отрегулируйте регулятор давления конденсации KVR.",
        refrigerant: "R404A",
        targetHp: [12.0, 14.0]
      },
      {
        id: "cryo-5",
        num: 5,
        title: "Заправка хладагента R404A по смотровому стеклу",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Дозируйте жидкую фазу хладагента через сервисный штуцер ресивера до полного исчезновения пузырьков в смотровом стекле.",
        refrigerant: "R404A",
        targetHp: [14.5, 16.5]
      },
      {
        id: "cryo-6",
        num: 6,
        title: "Устранение обмерзания воздухоохладителя",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Испаритель зарос снеговой шубой. Настройте таймер оттайки ТЭНами и температуру окончания оттайки (+8°C).",
        refrigerant: "R134a",
        targetLp: [2.1, 2.4]
      },
      {
        id: "cryo-7",
        num: 7,
        title: "Настройка сдвоенного прессостата Danfoss KP15",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Выставьте порог аварийного отключения по высокому давлению (18 bar) и пуск/останов по низкому давлению (2.0 / 0.8 bar).",
        refrigerant: "R134a",
        targetHp: [14.0, 15.0]
      },
      {
        id: "cryo-8",
        num: 8,
        title: "Диагностика реле контроля смазки компрессора (MP55)",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: true,
        ticketNum: "Билет №8",
        desc: "Проверьте перепад давления масла масляного насоса полугерметичного компрессора Bitzer (норма delta P > 1.2 bar).",
        refrigerant: "R134a",
        targetHp: [13.5, 14.5]
      },
      {
        id: "cryo-9",
        num: 9,
        title: "Расчет тепловой нагрузки морозильной камеры",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Рассчитайте холодопроизводительность для охлаждения 2 тонн мяса от +15°C до -18°C за 12 часов работы установки.",
        refrigerant: "R404A",
        targetLp: [1.2, 1.6]
      },
      {
        id: "cryo-10",
        num: 10,
        title: "Максимизация холодильного коэффициента COP",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: false,
        desc: "Оптимизируйте теплообмен конденсатора при жаре в Алматы (+35°C), добившись максимального значения COP > 3.40.",
        refrigerant: "R134a",
        targetHp: [13.5, 14.2],
        targetLp: [2.1, 2.3]
      }
    ],

    design: [
      {
        id: "design-1",
        num: 1,
        title: "Аудит доступности WCAG 2.1 (Контраст 4.5:1)",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: true,
        ticketNum: "Билет №1",
        desc: "Устраните 4 грубых ошибки верстки (искажение логотипа, бледный текст, комичный шрифт, поломанная кнопка).",
        targetStandard: "WCAG 2.1 AA"
      },
      {
        id: "design-2",
        num: 2,
        title: "Построение 12-колоночной модульной сетки",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Выровняйте карточки факультетов по 12-колоночной сетке Bootstrap/Figma с отступами колонок (gutter 24px).",
        targetStandard: "Layout Grid 12-col"
      },
      {
        id: "design-3",
        num: 3,
        title: "Охранное поле и пропорции логотипа АМК",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Задайте логотипу колледжа обязательное охранное поле шириной в букву «А» и устраните нелинейное масштабирование.",
        targetStandard: "Brand Identity"
      },
      {
        id: "design-4",
        num: 4,
        title: "Ритм вертикальной типографики (8pt Grid)",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: true,
        ticketNum: "Билет №4",
        desc: "Приведите размеры шрифтов и интерлиньяж к гармоничному масштабу: 32/40, 24/32, 18/26, 15/22 px.",
        targetStandard: "Typography Scale"
      },
      {
        id: "design-5",
        num: 5,
        title: "Минимальная тач-зона мобильных кнопок (44x44)",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Исправьте микро-кнопки навигации для мобильных экранов до эргономичного стандарта Apple/Google (не менее 44×44 px).",
        targetStandard: "Touch Target Size"
      },
      {
        id: "design-6",
        num: 6,
        title: "Цветовая доступность для дальтоников (Colorblind)",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Продублируйте цветовые статусы оценок (красный/зеленый) текстовыми маркерами и иконками для лиц с дейтеранопией.",
        targetStandard: "Accessibility Color"
      },
      {
        id: "design-7",
        num: 7,
        title: "Оптимизация баннера колледжа в WebP",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Сожмите тяжелый фоновый баннер PNG (4.8 МБ) в формат WebP со снижением веса до 280 КБ без видимой потери четкости.",
        targetStandard: "Performance WebP"
      },
      {
        id: "design-8",
        num: 8,
        title: "Проектирование состояний кнопки (Hover/Active/Focus)",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: true,
        ticketNum: "Билет №8",
        desc: "Создайте интерактивную анимацию кнопки подачи заявки: плавное свечение при наведении, сжатие при клике и кольцо доступности.",
        targetStandard: "Micro-interactions"
      },
      {
        id: "design-9",
        num: 9,
        title: "Векторные пиктограммы SVG (Символы дисциплин)",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Отрисуйте набор пиктограмм в единой толщине штриха 2px со скругленными углами для шапки специальностей.",
        targetStandard: "Iconography 24px"
      },
      {
        id: "design-10",
        num: 10,
        title: "Темная и светлая темы по шкале APCA",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: false,
        desc: "Сбалансируйте контрастность элементов интерфейса для темной темы без эффекта гало (чистый цвет #090d16 vs #0f172a).",
        targetStandard: "APCA Contrast"
      }
    ],

    furniture: [
      {
        id: "furn-1",
        num: 1,
        title: "Раскрой плиты ЛДСП 2800×2070 мм на кухонный короб",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: true,
        ticketNum: "Билет №1",
        desc: "Рассчитайте оптимальную карту раскроя кухонного шкафа на станке с ЧПУ с толщиной диска 4.2 мм. Снизьте отход ниже 9%.",
        sheetSize: "2800 × 2070 × 16 мм",
        targetWaste: 8.4
      },
      {
        id: "furn-2",
        num: 2,
        title: "Учет направления древесной текстуры ЛДСП",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Расположите фасады и боковины шкафа строго вдоль продольной текстуры листа дуба (2800 мм), исключив поперечный разворот.",
        sheetSize: "2800 × 2070 × 16 мм",
        targetWaste: 9.8
      },
      {
        id: "furn-3",
        num: 3,
        title: "Расчет припуска на кромкооблицовку ПВХ (2 мм)",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Вычтите толщину кромки 2.0 мм из чистового размера деталей корпуса, чтобы сохранить монтажные габариты шкафа.",
        sheetSize: "2800 × 2070 × 16 мм",
        targetWaste: 8.9
      },
      {
        id: "furn-4",
        num: 4,
        title: "Карта присадки отверстий под евровинты (Конфирмат)",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: true,
        ticketNum: "Билет №4",
        desc: "Разметьте отверстия сверления диаметром 7 мм (под тело) и 5 мм (под резьбу) с отступом 8 мм от края плиты.",
        sheetSize: "Карта присадки ЧПУ",
        targetWaste: 0
      },
      {
        id: "furn-5",
        num: 5,
        title: "Оптимизация раскроя листа МДФ 2800×2070 под фасады",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: false,
        desc: "Разместите 8 фасадных полотен с единым зазором 3 мм под фрезеровку скрытых ручек на 3D фрезерном станке ЧПУ.",
        sheetSize: "2800 × 2070 × 19 мм",
        targetWaste: 7.6
      },
      {
        id: "furn-6",
        num: 6,
        title: "Калькуляция себестоимости материалов гарнитура",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Рассчитайте затраты: стоимость плиты ЛДСП (24 500 ₸), 32 м кромки (3 200 ₸) и распила (4 500 ₸) на фабрике в Алматы.",
        sheetSize: "Смета расходов",
        targetWaste: 8.4
      },
      {
        id: "furn-7",
        num: 7,
        title: "Учет чистовой подрезки кромки листа (Обпил 10 мм)",
        difficulty: "Базовый",
        level: "junior",
        teacherAssigned: false,
        desc: "Задайте обязательный технологический обпил 10 мм по всему периметру плиты для устранения транспортировочных сколов.",
        sheetSize: "2780 × 2050 (полезная площадь)",
        targetWaste: 9.1
      },
      {
        id: "furn-8",
        num: 8,
        title: "Расчет зазоров под направляющие ящиков Blum",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: true,
        ticketNum: "Билет №8",
        desc: "Вычислите точную ширину дна ящика из ХДФ 4 мм с учетом зазоров 12.5 мм с каждой стороны под роликовые шины.",
        sheetSize: "Фурнитурный расчет",
        targetWaste: 0
      },
      {
        id: "furn-9",
        num: 9,
        title: "Раскрой остатков (Деловые обрезки)",
        difficulty: "Средний",
        level: "middle",
        teacherAssigned: false,
        desc: "Выделите из остаточного куска ЛДСП 1200×600 мм заготовки под внутренние съемные полки шкафа.",
        sheetSize: "Деловой обрезок",
        targetWaste: 6.2
      },
      {
        id: "furn-10",
        num: 10,
        title: "Экспорт G-кода для форматно-раскроечного центра",
        difficulty: "Продвинутый",
        level: "senior",
        teacherAssigned: false,
        desc: "Сформируйте управляющую программу раскроя с координатами первых продольных и поперечных резов пильной каретки.",
        sheetSize: "G-Code NC-Studio",
        targetWaste: 8.4
      }
    ]
  },

  // Career Positions in Almaty
  careers: [
    {
      role: "Разработчик программного обеспечения",
      specialty: "06130100 — Программное обеспечение",
      baseSalary: 350000,
      maxSalary: 950000,
      companies: "Kaspi.kz, Kolesa Group, ONE Tech",
      skills: "JavaScript, HTML5/CSS3, SQL, Git"
    },
    {
      role: "Автоэлектрик-диагност ДВС и систем",
      specialty: "07161300 — ТО и ремонт автотранспорта",
      baseSalary: 300000,
      maxSalary: 800000,
      companies: "Astana Motors, Allur Auto, Toyota Center",
      skills: "OBD-II, CAN-шина, Мультиметр, ЭБУ"
    },
    {
      role: "Инженер холодильных и климатических систем",
      specialty: "07150900 — Холодильно-компрессорные машины",
      baseSalary: 380000,
      maxSalary: 850000,
      companies: "ТОО «АлматыХолод», Danfoss KZ, Magnum",
      skills: "Хладагенты R134a/R404a, Компрессоры, ТРВ"
    },
    {
      role: "UI/UX & Графический дизайнер",
      specialty: "02110300 — Графический дизайн",
      baseSalary: 280000,
      maxSalary: 700000,
      companies: "Dasm Group, Rocket Firm, Creatida",
      skills: "Figma, Веб-доступность WCAG, Типографика"
    },
    {
      role: "Технолог мебельного производства и ЧПУ",
      specialty: "07221400 — Производство мебели",
      baseSalary: 300000,
      maxSalary: 750000,
      companies: "Zeta, Almaty Мебель, Кухни Мастер",
      skills: "Оптимизация раскроя, Карты распила ЛДСП"
    }
  ],

  // Translations
  i18n: {
    ru: {
      college_sub: "Алматинский многопрофильный колледж",
      nav_specialties: "Специальности",
      nav_career: "Калькулятор дохода",
      nav_simulator: "Симуляторы",
      hero_badge: "Стандарты WorldSkills Kazakhstan",
      hero_title_1: "Профессиональная платформа",
      hero_title_2: "практического обучения АМК",
      hero_desc: "Интерактивная среда подготовки студентов колледжа АМК к производственной практике, демонстрационным экзаменам и трудоустройству в Алматы.",
      btn_start: "Открыть симуляторы",
      btn_diploma: "Паспорт компетенций",
      calc_title: "Калькулятор дохода выпускников в Алматы",
      calc_desc: "Двигайте ползунок, чтобы увидеть рост дохода и карьерные перспективы по специальностям колледжа."
    },
    kz: {
      college_sub: "Алматы көпсалалы колледжі",
      nav_specialties: "Мамандықтар",
      nav_career: "Табыс калькуляторы",
      nav_simulator: "Симуляторлар",
      hero_badge: "WorldSkills Kazakhstan стандарттары",
      hero_title_1: "АМК колледжінің",
      hero_title_2: "кәсіби оқыту платформасы",
      hero_desc: "АМК студенттеріне арналған интерактивті тәжірибелік дайындық және демоемтиханға арналған жұмыс ортасы.",
      btn_start: "Симуляторларды ашу",
      btn_diploma: "Дағды паспорты",
      calc_title: "Алматыдағы түлектер табысының калькуляторы",
      calc_desc: "Жүгірткіні жылжытып, мамандықтар бойынша табыстың өсуін және компанияларды көріңіз."
    }
  }
};
