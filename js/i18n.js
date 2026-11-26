/**
 * AMK SkillHub i18n Engine (ru <-> kk, ready for kk-Latn)
 * Lightweight, zero-dependency internationalization & Kazakh localization module.
 */
(function () {
  'use strict';

  // 1. Extensible Locale Registry (Adding a language = 1 JSON file + 1 line here)
  const LOCALES_CONFIG = {
    ru: { code: 'ru', bcp47: 'ru-RU', name: 'Русский', short: 'РУС', script: 'Cyrl', url: 'locales/ru.json' },
    kk: { code: 'kk', bcp47: 'kk-KZ', name: 'Қазақша', short: 'ҚАЗ', script: 'Cyrl', url: 'locales/kk.json' }
    // Future Latin support:
    // 'kk-Latn': { code: 'kk-Latn', bcp47: 'kk-Latn-KZ', name: 'Qazaqşa', short: 'QAZ', script: 'Latn', url: 'locales/kk-Latn.json' }
  };

  const STORAGE_KEY = 'eduspace_locale';
  const DEFAULT_LOCALE = 'ru';

  // Built-in synchronous dictionaries (also refreshed via fetch from locales/*.json)
  const DICTIONARIES = {
    ru: {
  "meta": {
    "locale": "ru",
    "languageName": "Русский",
    "shortCode": "РУС",
    "script": "Cyrl",
    "pageTitle": "Программа курса и модули — AMK SkillHub",
    "pageDescription": "Программа курса и модули — AMK SkillHub — Цифровая образовательная платформа"
  },
  "a11y": {
    "skipToContent": "К содержимому",
    "sidebarNav": "Боковая навигация",
    "sidebarSections": "Разделы кабинета",
    "collapseSidebar": "Свернуть или развернуть меню",
    "collapseSidebarTitle": "Свернуть меню",
    "breadcrumbs": "Хлебные крошки",
    "langSwitcher": "Выбор языка интерфейса",
    "nextActionRegion": "Ближайшее действие",
    "courseHeaderRegion": "О курсе и ваш прогресс",
    "courseProgressLabel": "Освоение курса",
    "controlsRegion": "Фильтры и поиск уроков",
    "statusFilterGroup": "Фильтр по статусу уроков",
    "searchLabel": "Поиск по теме или инструментам",
    "lessonsListRegion": "Список модулей курса",
    "mobileNav": "Мобильная навигация",
    "closeModal": "Закрыть окно"
  },
  "brand": {
    "homeTitle": "На главную AMK SkillHub",
    "cabinetSubtitle": "Платформа колледжа"
  },
  "lang": {
    "switcherLabel": "Язык интерфейса",
    "ru": "Русский",
    "kk": "Қазақша",
    "ruShort": "РУС",
    "kkShort": "ҚАЗ",
    "fallbackBadge": "На русском",
    "fallbackTooltip": "Материал временно доступен на русском языке"
  },
  "nav": {
    "group": {
      "learning": "Обучение",
      "progress": "Прогресс",
      "communication": "Общение",
      "profile": "Профиль"
    },
    "myLearning": "Моё обучение",
    "myLearningTooltip": "Моё обучение и курсы",
    "lessonsAndTasks": "Уроки и задания",
    "lessonsAndTasksTooltip": "Уроки и задания",
    "availableCountTitle": "Доступно уроков",
    "roadmap": "Дорожная карта",
    "roadmapTooltip": "Дорожная карта курса",
    "grades": "Оценки",
    "gradesTooltip": "Оценки и зачётка",
    "deadlines": "Дедлайны",
    "deadlinesTooltip": "Календарь дедлайнов",
    "curatorChat": "AI Тьютор",
    "curatorChatTooltip": "AI Тьютор",
    "curatorOnlineTitle": "AI Тьютор онлайн",
    "notifications": "Уведомления",
    "notificationsTooltip": "Уведомления",
    "profileAndCert": "Профиль и сертификат",
    "profileAndCertTooltip": "Профиль и сертификат",
    "career": "Карьера",
    "careerTooltip": "Карьера и резюме",
    "tools": "Инструменты",
    "toolsTooltip": "Учебные инструменты",
    "resetDemo": "Сбросить демо-прогресс",
    "resetDemoTitle": "Сбросить демо-прогресс к 0%",
    "settings": "Настройки",
    "settingsTooltip": "Настройки",
    "logout": "Выйти",
    "logoutTooltip": "Выйти",
    "mobile": {
      "cabinet": "Кабинет",
      "modules": "Модули",
      "roadmap": "Карта",
      "chat": "Чат",
      "profile": "Профиль"
    }
  },
  "header": {
    "breadcrumbCabinet": "Кабинет",
    "breadcrumbModules": "Модули",
    "studyDayBadge": "День {day} из {total}",
    "studyDayTooltip": "По учебному расписанию каждый новый день открывает следующий модуль",
    "studentDefaultName": "Студент",
    "studentDefaultInitials": "СТ"
  },
  "continueBanner": {
    "badge": "Следующий шаг",
    "subtitle": "Практический модуль · ~{duration} · {deadline}",
    "startBtn": "Начать урок {num}",
    "continueBtn": "Продолжить урок {num}",
    "mobileBtn": "Продолжить · Урок {num}"
  },
  "course": {
    "curatorLine": "{code} · Куратор: {curator}",
    "switchCourseBtn": "Сменить курс",
    "switchCourseAria": "Сменить курс обучения",
    "primaryCtaStart": "Открыть плеер модуля №{num}",
    "primaryCtaContinue": "Продолжить обучение · Урок {num}",
    "textbookBtn": "Учебник и разобранные примеры",
    "progress": {
      "label": "Освоение курса",
      "summary": "{done} из {total} зачтено · Следующий шаг: Урок {next}",
      "setPrimary": "Сделать основным",
      "isPrimary": "Основной курс ✓"
    },
    "catalog": {
      "it": {
        "title": "Программное обеспечение (Web Design)",
        "shortTitle": "Web Design",
        "description": "Практический курс веб-дизайна: подготовка графики в Photoshop и Illustrator, проектирование интерфейсов, Auto Layout и компонентов в Figma, вёрстка HTML/CSS и интерактив."
      },
      "graphic_design": {
        "title": "Графический дизайн и брендинг",
        "shortTitle": "Графический дизайн",
        "description": "Создание айдентики, векторной графики, рекламных постеров и многостраничных макетов в Illustrator, Photoshop и Figma."
      },
      "autoelectric": {
        "title": "Автоэлектрика и компьютерная диагностика",
        "shortTitle": "Автоэлектрика",
        "description": "Диагностика цепей мультиметром и осциллографом, проверка системы пуска, датчиков ЭСУД, шин CAN/LIN и чтение кодов OBD-II."
      },
      "hvac": {
        "title": "Холодильное оборудование и кондиционирование",
        "shortTitle": "Холодильное оборудование",
        "description": "Термодинамический цикл, диагностика герметичности, вакуумирование, заправка хладагентов и настройка автоматики."
      },
      "automechanic": {
        "title": "Автомеханика и техническое обслуживание",
        "shortTitle": "Автомеханика",
        "description": "Дефектовка узлов ДВС, фазы ГРМ, обслуживание тормозной системы, подвески, трансмиссии и регламентное ТО."
      }
    }
  },
  "filter": {
    "available": "Доступные",
    "inProgress": "В процессе",
    "submitted": "На проверке",
    "graded": "Проверено",
    "locked": "Заблокировано",
    "all": "Все",
    "emptyTitle": "В этой категории пока нет уроков",
    "showAllBtn": "Показать все {total} модулей"
  },
  "search": {
    "placeholder": "Поиск по теме, тегам или инструментам (Figma, SVG, 72 ppi)..."
  },
  "lesson": {
    "prefix": "Урок {num}. ",
    "moduleDuration": "{minutes} мин",
    "status": {
      "available": "Доступно",
      "inProgress": "В процессе",
      "inProgressQuiz": "В процессе · Квиз {score}/3",
      "submitted": "На проверке",
      "graded": "Зачтено · {score}/100",
      "locked": "Заблокировано"
    },
    "action": {
      "start": "Начать урок",
      "continue": "Продолжить урок",
      "simulator": "Тренажёр",
      "open": "Открыть"
    },
    "dates": {
      "opensOn": "Откроется: {date}",
      "opensTomorrow": "Откроется завтра",
      "opensInDays_one": "Откроется через {count} день",
      "opensInDays_few": "Откроется через {count} дня",
      "opensInDays_many": "Откроется через {count} дней",
      "opensInDays_other": "Откроется через {count} дн.",
      "deadlineTomorrow": "Дедлайн завтра",
      "deadlineInDays_one": "Дедлайн через {count} день",
      "deadlineInDays_few": "Дедлайн через {count} дня",
      "deadlineInDays_many": "Дедлайн через {count} дней",
      "deadlineInDays_other": "Дедлайн через {count} дн.",
      "exactDateTooltip": "Точная дата: {date}",
      "lockedTooltip": "Модуль откроется: {date}"
    }
  },
  "modal": {
    "close": "Закрыть",
    "cancel": "Отмена",
    "save": "Сохранить изменения",
    "roadmap": {
      "title": "🚀 Дорожная карта курса: {course}",
      "subtitle": "Персональная траектория освоения профессии от базовой теории до дипломного проекта с поддержкой 3D-моделей и тренажёров.",
      "moduleCompleted": "✓ Модуль зачтён",
      "modulePro": "Профильный модуль · Сертификат",
      "moduleBase": "Базовый модуль"
    },
    "grades": {
      "title": "📊 Оценки и зачётка — {name}",
      "passedLabel": "Зачтено по курсу",
      "gpaLabel": "Средний балл / GPA",
      "xpLabel": "Опыт обучения",
      "colLesson": "Урок / Модуль",
      "colCourse": "Курс",
      "colScore": "Балл",
      "colStatus": "Статус",
      "colComment": "Рецензия AI",
      "emptyRow": "У вас пока нет сданных работ. Откройте Урок №1, пройдите автопроверку и отправьте первое решение!",
      "downloadCsv": "Скачать выписку CSV"
    },
    "deadlines": {
      "title": "🗓️ Календарь дедлайнов (Текущий день: День {day})",
      "banner": "Задания открываются поэтапно согласно расписанию курса. Будущие уроки станут доступны в соответствующий учебный день.",
      "dayLabel": "День {day}",
      "doneBadge": "Выполнено ({score}/100)",
      "lockedBadge": "Откроется: {date}",
      "todayBadge": "Задание на сегодня",
      "availableBadge": "Доступно",
      "scheduleLine": "Открытие: {openDate} · Дедлайн: {deadlineDate}",
      "openLessonBtn": "Открыть урок"
    },
    "chat": {
      "title": "💬 AI Тьютор курса",
      "loading": "Загружаем сообщения…",
      "guestStatus": "AI Тьютор курса (Ознакомительный режим)",
      "curatorRole": "Куратор курса · {curator}",
      "welcomeMessage": "Здравствуйте! Добро пожаловать на курс «{course}». Здесь вы можете задать вопрос по текущему уроку, разбору ошибок или срокам сдачи.",
      "inputPlaceholder": "Напишите сообщение куратору...",
      "sendBtn": "Отправить",
      "youLabel": "Вы (Студент)",
      "sentStatus": "Сообщение доставлено куратору."
    },
    "notifications": {
      "title": "🔔 Уведомления",
      "empty": "Новых уведомлений пока нет.",
      "welcomeTitle": "Открыт Урок №1 по курсу «{course}»",
      "welcomeBody": "Вам доступны интерактивный конспект с видеоразбором, 3D-схема и практический тренажёр с автопроверкой.",
      "curatorTitle": "Куратор курса: {curator}",
      "curatorBody": "Ближайший дедлайн отправки первого практического задания — через 2 дня. Вопросы можно задать в чате."
    },
    "settings": {
      "title": "⚙️ Настройки профиля и интерфейса",
      "lastName": "Фамилия *",
      "firstName": "Имя *",
      "middleName": "Отчество",
      "middleNamePlaceholder": "При наличии",
      "email": "Подтверждённый Email",
      "group": "Учебная группа",
      "activeCourse": "Активный курс обучения",
      "interfaceLanguage": "Язык интерфейса",
      "newPassword": "Новый пароль (оставьте пустым, если не меняете)",
      "newPasswordPlaceholder": "Минимум 6 символов, буквы и цифры"
    }
  },
  "toast": {
    "langSwitched": "Язык интерфейса переключён: Русский",
    "courseSwitched": "Курс успешно переключён!",
    "settingsSaved": "Настройки успешно сохранены!",
    "demoResetConfirm": "Сбросить демо-прогресс к началу (0%, День 1)?",
    "demoResetSuccess": "Демо-прогресс сброшен к началу!",
    "csvExported": "Ведомость успеваемости выгружена в формате CSV!"
  }
},
    kk: {
  "meta": {
    "locale": "kk",
    "languageName": "Қазақша",
    "shortCode": "ҚАЗ",
    "script": "Cyrl",
    "pageTitle": "Курс бағдарламасы мен модульдер — AMK SkillHub",
    "pageDescription": "Курс бағдарламасы мен модульдер — AMK SkillHub цифрлық білім беру платформасы"
  },
  "a11y": {
    "skipToContent": "Негізгі мазмұнға өту",
    "sidebarNav": "Бүйірлік навигация",
    "sidebarSections": "Кабинет бөлімдері",
    "collapseSidebar": "Мәзірді жинау немесе жазу",
    "collapseSidebarTitle": "Мәзірді жинау",
    "breadcrumbs": "Навигация тізбегі",
    "langSwitcher": "Интерфейс тілін таңдау",
    "nextActionRegion": "Келесі әрекет",
    "courseHeaderRegion": "Курс туралы ақпарат және оқу үлгерімі",
    "courseProgressLabel": "Курсты меңгеру",
    "controlsRegion": "Сабақтарды сүзу және іздеу",
    "statusFilterGroup": "Сабақ мәртебесі бойынша сүзгі",
    "searchLabel": "Тақырып немесе құралдар бойынша іздеу",
    "lessonsListRegion": "Курс модульдерінің тізімі",
    "mobileNav": "Мобильді навигация",
    "closeModal": "Терезені жабу"
  },
  "brand": {
    "homeTitle": "AMK SkillHub басты бетіне өту",
    "cabinetSubtitle": "АМК кабинеті"
  },
  "lang": {
    "switcherLabel": "Интерфейс тілі",
    "ru": "Русский",
    "kk": "Қазақша",
    "ruShort": "РУС",
    "kkShort": "ҚАЗ",
    "fallbackBadge": "Орысша",
    "fallbackTooltip": "Бұл материал әзірше орыс тілінде берілген"
  },
  "nav": {
    "group": {
      "learning": "Оқу",
      "progress": "Үлгерім",
      "communication": "Байланыс",
      "profile": "Профиль"
    },
    "myLearning": "Менің оқуым",
    "myLearningTooltip": "Менің оқуым және курстарым",
    "lessonsAndTasks": "Сабақтар мен тапсырмалар",
    "lessonsAndTasksTooltip": "Сабақтар мен тапсырмалар",
    "availableCountTitle": "Қолжетімді сабақ саны",
    "roadmap": "Жол картасы",
    "roadmapTooltip": "Курстың жол картасы",
    "grades": "Бағалар",
    "gradesTooltip": "Бағалар мен сынақ кітапшасы",
    "deadlines": "Тапсыру мерзімі",
    "deadlinesTooltip": "Мерзімдер күнтізбесі",
    "curatorChat": "AI Тьютор",
    "curatorChatTooltip": "AI Тьютор",
    "curatorOnlineTitle": "AI Тьютор желіде",
    "notifications": "Хабарландырулар",
    "notificationsTooltip": "Хабарландырулар",
    "profileAndCert": "Профиль және сертификат",
    "profileAndCertTooltip": "Профиль және сертификат",
    "career": "Мансап",
    "careerTooltip": "Мансап және түйіндеме",
    "tools": "Құралдар",
    "toolsTooltip": "Оқу құралдары",
    "resetDemo": "Демо-үлгерімді нөлдеу",
    "resetDemoTitle": "Демо-үлгерімді 0% деңгейіне қайтару",
    "settings": "Параметрлер",
    "settingsTooltip": "Параметрлер",
    "logout": "Шығу",
    "logoutTooltip": "Аккаунттан шығу",
    "mobile": {
      "cabinet": "Кабинет",
      "modules": "Модульдер",
      "roadmap": "Карта",
      "chat": "Чат",
      "profile": "Профиль"
    }
  },
  "header": {
    "breadcrumbCabinet": "Кабинет",
    "breadcrumbModules": "Модульдер",
    "studyDayBadge": "{day}-күн / {total}",
    "studyDayTooltip": "Оқу кестесі бойынша әр жаңа оқу күні келесі модуль ашылады",
    "studentDefaultName": "Студент",
    "studentDefaultInitials": "СТ"
  },
  "continueBanner": {
    "badge": "Келесі қадам",
    "subtitle": "Практикалық модуль · ~{duration} · {deadline}",
    "startBtn": "{num}-сабақты бастау",
    "continueBtn": "{num}-сабақты жалғастыру",
    "mobileBtn": "Жалғастыру · {num}-сабақ"
  },
  "course": {
    "curatorLine": "{code} · Куратор: {curator}",
    "switchCourseBtn": "Курсты ауыстыру",
    "switchCourseAria": "Оқу курсын ауыстыру",
    "primaryCtaStart": "Сабақты бастау · {num}-сабақ",
    "primaryCtaContinue": "Оқуды жалғастыру · {num}-сабақ",
    "textbookBtn": "Оқулық және талданған мысалдар",
    "progress": {
      "label": "Курсты меңгеру",
      "summary": "{total} модульдің {done} тапсырылды · Келесі: {next}-сабақ",
      "setPrimary": "Негізгі курс ету",
      "isPrimary": "Негізгі курс ✓"
    },
    "catalog": {
      "it": {
        "title": "Бағдарламалық қамтамасыз ету (Web Design)",
        "shortTitle": "Web Design",
        "description": "Веб-дизайн бойынша практикалық курс: Photoshop пен Illustrator бағдарламаларында графика дайындау, Figma-да интерфейс, Auto Layout пен компоненттер құрастыру, HTML/CSS беттеу."
      },
      "graphic_design": {
        "title": "Графикалық дизайн және брендинг",
        "shortTitle": "Графикалық дизайн",
        "description": "Illustrator, Photoshop және Figma көмегімен айдентика, векторлық графика, жарнама постерлері мен көпбетті макеттер жасау."
      },
      "autoelectric": {
        "title": "Автоэлектрика және компьютерлік диагностика",
        "shortTitle": "Автоэлектрика",
        "description": "Электр тізбектерін мультиметрмен және осциллографпен тексеру, іске қосу жүйесі, ЭБЖ датчиктері, CAN/LIN шиналары мен OBD-II кодтарын диагностикалау."
      },
      "hvac": {
        "title": "Тоңазытқыш жабдықтары және ауа баптау",
        "shortTitle": "Тоңазытқыш жабдықтары",
        "description": "Термодинамикалық цикл, саңылаусыздықты тексеру, вакуумдау, хладагент құю және автоматиканы баптау."
      },
      "automechanic": {
        "title": "Автомеханика және техникалық қызмет көрсету",
        "shortTitle": "Автомеханика",
        "description": "ІЖҚ тораптарын ақаулау, ГТМ фазаларын реттеу, тежегіш жүйесіне, аспа мен трансмиссияға регламенттік ТҚК жүргізу."
      }
    }
  },
  "filter": {
    "available": "Қолжетімді",
    "inProgress": "Орындалуда",
    "submitted": "Тексеруде",
    "graded": "Тексерілді",
    "locked": "Жабық",
    "all": "Барлығы",
    "emptyTitle": "Бұл санатта әзірше сабақ жоқ",
    "showAllBtn": "Барлық {total} модульді көрсету"
  },
  "search": {
    "placeholder": "Тақырып немесе құрал бойынша іздеу (Figma, SVG, 72 ppi)..."
  },
  "lesson": {
    "prefix": "{num}-сабақ. ",
    "moduleDuration": "{minutes} мин",
    "status": {
      "available": "Қолжетімді",
      "inProgress": "Орындалуда",
      "inProgressQuiz": "Орындалуда · Тест {score}/3",
      "submitted": "Тексеруде",
      "graded": "Тексерілді · {score}/100",
      "locked": "Жабық"
    },
    "action": {
      "start": "Сабақты бастау",
      "continue": "Оқуды жалғастыру",
      "simulator": "Тренажер",
      "open": "Ашу"
    },
    "dates": {
      "opensOn": "Ашылады: {date}",
      "opensTomorrow": "Ертең ашылады",
      "opensInDays_one": "Ашылуына {count} күн қалды",
      "opensInDays_few": "Ашылуына {count} күн қалды",
      "opensInDays_many": "Ашылуына {count} күн қалды",
      "opensInDays_other": "Ашылуына {count} күн қалды",
      "deadlineTomorrow": "Тапсыру мерзімі: ертең",
      "deadlineInDays_one": "Тапсыру мерзімі: {count} күннен кейін",
      "deadlineInDays_few": "Тапсыру мерзімі: {count} күннен кейін",
      "deadlineInDays_many": "Тапсыру мерзімі: {count} күннен кейін",
      "deadlineInDays_other": "Тапсыру мерзімі: {count} күннен кейін",
      "exactDateTooltip": "Нақты уақыты: {date}",
      "lockedTooltip": "Модуль ашылатын уақыт: {date}"
    }
  },
  "modal": {
    "close": "Жабу",
    "cancel": "Болдырмау",
    "save": "Өзгерістерді сақтау",
    "roadmap": {
      "title": "🚀 Жол картасы: {course}",
      "subtitle": "Базалық теориядан бастап 3D-модельдер мен практикалық тренажерларды қамтитын дипломдық жобаға дейінгі оқу траекториясы.",
      "moduleCompleted": "✓ Модуль тапсырылды",
      "modulePro": "Кәсіби модуль · Сертификат",
      "moduleBase": "Базалық модуль"
    },
    "grades": {
      "title": "📊 Бағалар мен сынақ кітапшасы — {name}",
      "passedLabel": "Курс бойынша тапсырылды",
      "gpaLabel": "Орташа балл / GPA",
      "xpLabel": "Оқу тәжірибесі",
      "colLesson": "Сабақ / Модуль",
      "colCourse": "Курс",
      "colScore": "Балл",
      "colStatus": "Мәртебесі",
      "colComment": "Куратор пікірі",
      "emptyRow": "Сізде әзірше тапсырылған жұмыс жоқ. 1-сабақты ашып, автотексеруден өтіп, алғашқы тапсырманы жіберіңіз!",
      "downloadCsv": "CSV үзіндісін жүктеп алу"
    },
    "deadlines": {
      "title": "🗓️ Мерзімдер күнтізбесі (Ағымдағы оқу күні: {day}-күн)",
      "banner": "Тапсырмалар курс кестесіне сәйкес кезең-кезеңімен ашылады. Келесі сабақтар тиісті оқу күні келгенде қолжетімді болады.",
      "dayLabel": "{day}-күн",
      "doneBadge": "Орындалды ({score}/100)",
      "lockedBadge": "Ашылады: {date}",
      "todayBadge": "Бүгінгі тапсырма",
      "availableBadge": "Қолжетімді",
      "scheduleLine": "Ашылуы: {openDate} · Тапсыру мерзімі: {deadlineDate}",
      "openLessonBtn": "Сабақты ашу"
    },
    "chat": {
      "title": "💬 AI Тьютор",
      "loading": "Хабарламалар жүктелуде…",
      "guestStatus": "AI Тьютор (Танысу режимі)",
      "curatorRole": "Курс кураторы · {curator}",
      "welcomeMessage": "Сәлеметсіз бе! «{course}» курсына қош келдіңіз. Осы чатта ағымдағы сабақ, қатемен жұмыс немесе тапсыру мерзімі бойынша сұрақ қоя аласыз.",
      "inputPlaceholder": "Кураторға хабарлама жазыңыз...",
      "sendBtn": "Жіберу",
      "youLabel": "Сіз (Студент)",
      "sentStatus": "Хабарлама кураторға жеткізілді."
    },
    "notifications": {
      "title": "🔔 Хабарландырулар",
      "empty": "Жаңа хабарландырулар жоқ.",
      "welcomeTitle": "«{course}» курсы бойынша 1-сабақ ашылды",
      "welcomeBody": "Сізге бейнеталдауы бар интерактивті конспект, 3D-сызба және автотексеруі бар практикалық тренажер қолжетімді.",
      "curatorTitle": "Курс кураторы: {curator}",
      "curatorBody": "Бірінші практикалық тапсырманы тапсыру мерзімі — 2 күннен кейін. Сұрақтарыңызды чатта қоя аласыз."
    },
    "settings": {
      "title": "⚙️ Профиль және интерфейс параметрлері",
      "lastName": "Тегі *",
      "firstName": "Аты *",
      "middleName": "Әкесінің аты",
      "middleNamePlaceholder": "Болған жағдайда",
      "email": "Расталған Email",
      "group": "Оқу тобы",
      "activeCourse": "Белсенді оқу курсы",
      "interfaceLanguage": "Интерфейс тілі",
      "newPassword": "Жаңа құпиясөз (өзгертпесеңіз, бос қалдырыңыз)",
      "newPasswordPlaceholder": "Кемінде 6 таңба, әріптер мен сандар"
    }
  },
  "toast": {
    "langSwitched": "Интерфейс тілі ауыстырылды: Қазақша",
    "courseSwitched": "Оқу курсы сәтті ауыстырылды!",
    "settingsSaved": "Параметрлер сәтті сақталды!",
    "demoResetConfirm": "Демо-үлгерімді бастапқы күйге (0%, 1-күн) қайтару керек пе?",
    "demoResetSuccess": "Демо-үлгерім бастапқы күйге қайтарылды!",
    "csvExported": "Үлгерім ведомосі CSV форматында жүктелді!"
  }
}
  };

  // Kazakh & Russian Month and Weekday dictionaries (fallback if browser ICU lacks kk-KZ)
  const MONTHS_KK = [
    'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
    'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'
  ];
  const MONTHS_RU_GENITIVE = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const WEEKDAYS_KK = [
    'жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі'
  ];

  // Content translation table (DB simulation: title_kk / description_kk for course lessons)
  // Technical terms (Photoshop, Illustrator, Figma, HTML, CSS, WebP, PNG, SVG, Auto Layout, px, ppi) stay in Latin.
  const CONTENT_TRANSLATIONS_KK = {
    'it:1': {
      shortTitle: 'Photoshop: сайтқа арналған баннер',
      title: '1-сабақ. Web Design үшін Photoshop: сайт баннерін дайындау және экспорттау (72 ppi, WebP/PNG)',
      description: 'Photoshop бағдарламасында сайтқа арналған жарнама баннерін дайындау ретін сипаттаңыз: өлшемі (1200×600 px), экран рұқсаты 72 ppi, формат таңдау (WebP немесе PNG) және мөлдірлікті сақтау.',
      tools: 'Adobe Photoshop, Экран рұқсаты 72 ppi, WebP / PNG / JPG форматтары'
    },
    'it:2': {
      shortTitle: 'Illustrator: векторлық белгіше және SVG',
      title: '2-сабақ. Web Design үшін Illustrator: векторлық белгіше салу және SVG форматына экспорттау',
      description: 'Illustrator бағдарламасында сайтқа арналған себет немесе профиль белгішесін жасау қадамдарын жазыңыз: артборд өлшемі 24×24 px, қарапайым фигуралармен салу, мөлдір фон және SVG форматында сақтау.',
      tools: 'Adobe Illustrator, Қаламұш (Pen Tool), Векторлық SVG форматы'
    },
    'it:3': {
      shortTitle: 'Figma: фреймдер және 12 бағанды тор',
      title: '3-сабақ. Figma негіздері: жұмыс аймағы, фреймдер және 12 бағанды Layout Grid торы',
      description: 'Figma-да Desktop фреймін (1440×900 px) баптауды сипаттаңыз: 12 бағанды тор қосу (margin 120 px, gutter 24 px) және бірінші экран блоктарын орналастыру.',
      tools: 'Figma, Frames (Фреймдер), Layout Grid (Модульдік тор)'
    },
    'it:4': {
      shortTitle: 'Figma: типографика және түстер жүйесі',
      title: '4-сабақ. Figma-дағы типографика және түстер: тақырып стильдері мен палитра (Text & Color Styles)',
      description: 'Figma-да лендингке арналған мәтін стильдерін (H1, H2, Body) және түстер палитрасын (Primary, Background, Text) жасау алгоритмін құрастырыңыз.',
      tools: 'Figma Text Styles, Color Styles, WCAG контраст нормасы'
    },
    'it:5': {
      shortTitle: 'Figma Auto Layout: бейімделгіш батырмалар',
      title: '5-сабақ. Figma Auto Layout: бейімделгіш батырмалар, карточкалар және навигациялық мәзір',
      description: 'Figma-да Auto Layout көмегімен мәтін ұзындығы өзгергенде ішкі шегіністерін (padding 12×24 px, gap 8 px) автоматты сақтайтын батырма мен карточка жасауды сипаттаңыз.',
      tools: 'Figma Auto Layout, Padding & Gap, Hug Contents / Fill Container'
    },
    'it:6': {
      shortTitle: 'Figma Components: UI-кит және күйлер',
      title: '6-сабақ. Figma-дағы компоненттер мен варианттар (Components & Variants): UI-кит жинау',
      description: 'Үш күйі бар (Default, Hover, Disabled) негізгі Button компонентінVariants арқылы жасау және оны макетте қолдану тәртібін жазыңыз.',
      tools: 'Figma Components, Variants, UI-Kit жүйесі'
    },
    'it:7': {
      shortTitle: 'Figma Prototyping: интерактивті өтулер',
      title: '7-сабақ. Figma-да интерактивті прототиптеу: экрандар байланысы және Smart Animate',
      description: 'Figma-да интерактивті прототипті қалай баптау керектігін сипаттаңыз: батырмадан модальді терезеге өту (On Click → Open Overlay) және Smart Animate анимациясы.',
      tools: 'Figma Prototype, Smart Animate, Interactive Overlays'
    },
    'it:8': {
      shortTitle: 'HTML5: Figma макеті бойынша семантика',
      title: '8-сабақ. HTML5 негіздері: Figma макеті бойынша беттің семантикалық құрылымы',
      description: 'Дайын Figma макетіне сүйеніп, header, nav, main, section және footer семантикалық тегтері арқылы лендингтің HTML5 қаңқасын жазыңыз.',
      tools: 'HTML5, Семантикалық тегтер, DOM құрылымы'
    },
    'it:9': {
      shortTitle: 'CSS3 және Flexbox: карточкаларды беттеу',
      title: '9-сабақ. CSS3 және Flexbox негіздері: Figma-дан стильдерді көшіру және блоктарды тегістеу',
      description: 'Figma Dev Mode / Inspect панелінен түстерді, қаріптерді және шегіністерді CSS-ке көшіріп, Flexbox (display: flex, gap) арқылы карточкалар қатарын беттеуді сипаттаңыз.',
      tools: 'CSS3, Flexbox, Figma Inspect'
    },
    'it:10': {
      shortTitle: 'Responsive Design: Desktop пен Mobile',
      title: '10-сабақ. Бейімделгіш веб-дизайн (Responsive): Figma-дағы Desktop пен Mobile макеттер және @media',
      description: '1440 px макетін 375 px мобильді экранға бейімдеу ережелерін жазыңыз: торды қайта құру, қаріп өлшемдерін өзгерту және CSS @media (max-width: 768px) қолдану.',
      tools: 'Responsive Design, Мобильді макет 375 px, CSS Media Queries'
    }
  };

  let currentLocale = DEFAULT_LOCALE;
  let pseudoMode = false;
  const warnedKeys = new Set();

  function detectDefaultLocale() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const qLang = params.get('lang');
      if (qLang && LOCALES_CONFIG[qLang]) return qLang;
    } catch (e) {}
    try {
      const saved = localStorage.getItem('amk.lang') || localStorage.getItem(STORAGE_KEY);
      if (saved && LOCALES_CONFIG[saved]) return saved;
    } catch (e) {}

    if (typeof navigator !== 'undefined' && navigator.language) {
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('kk')) return 'kk';
      if (navLang.startsWith('ru')) return 'ru';
    }
    return DEFAULT_LOCALE;
  }

  function resolvePath(obj, pathStr) {
    if (!obj || !pathStr) return undefined;
    return pathStr.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  // Pseudo-localization transformer (+30% length with Kazakh specific Cyrillic glyphs)
  function toPseudoString(str) {
    const map = {
      'а': 'ә', 'А': 'Ә',
      'г': 'ғ', 'Г': 'Ғ',
      'к': 'қ', 'К': 'Қ',
      'н': 'ң', 'Н': 'Ң',
      'о': 'ө', 'О': 'Ө',
      'у': 'ұ', 'У': 'Ұ',
      'ы': 'і', 'Ы': 'І',
      'х': 'һ', 'Х': 'Һ'
    };
    let out = '';
    let inPlaceholder = false;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === '{') inPlaceholder = true;
      if (!inPlaceholder && map[ch]) out += map[ch];
      else out += ch;
      if (ch === '}') inPlaceholder = false;
    }
    const padLen = Math.max(3, Math.ceil(str.length * 0.3));
    const pad = '·әғқңөұүһі'.repeat(Math.ceil(padLen / 10)).slice(0, padLen);
    return `[${out}${pad}]`;
  }

  function interpolate(template, params) {
    if (!params || typeof template !== 'string') return template;
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      return params[key] !== undefined && params[key] !== null ? String(params[key]) : match;
    });
  }

  /**
   * Translate key with parameters and automatic Russian fallback + console warning.
   */
  function t(key, params = null, localeOverride = null) {
    const loc = localeOverride || currentLocale;
    const dict = DICTIONARIES[loc] || DICTIONARIES[DEFAULT_LOCALE];
    let val = resolvePath(dict, key);

    if (val === undefined || val === '') {
      if (loc !== DEFAULT_LOCALE) {
        const warnId = `${loc}:${key}`;
        if (!warnedKeys.has(warnId)) {
          warnedKeys.add(warnId);
          console.warn(`[i18n] Missing key "${key}" in locale "${loc}". Falling back to "${DEFAULT_LOCALE}".`);
        }
        val = resolvePath(DICTIONARIES[DEFAULT_LOCALE], key);
      }
    }

    if (val === undefined || typeof val !== 'string') {
      console.warn(`[i18n] Unknown translation key: "${key}"`);
      return key;
    }

    const interpolated = interpolate(val, params);
    return pseudoMode ? toPseudoString(interpolated) : interpolated;
  }

  /**
   * Pluralization via Intl.PluralRules ('kk' uses one/other; 'ru' uses one/few/many/other).
   * In Kazakh, nouns after numerals remain singular ("5 сабақ", not "5 сабақтар").
   */
  function plural(baseKey, count, params = {}) {
    const num = Number(count) || 0;
    let category = 'other';
    try {
      const bcp = (LOCALES_CONFIG[currentLocale] && LOCALES_CONFIG[currentLocale].bcp47) || currentLocale;
      const pr = new Intl.PluralRules(bcp);
      category = pr.select(num);
    } catch (e) {
      category = num === 1 ? 'one' : 'other';
    }

    const mergedParams = Object.assign({}, params, { count: formatNumber(num) });
    const exactKey = `${baseKey}_${category}`;
    const dict = DICTIONARIES[currentLocale] || DICTIONARIES[DEFAULT_LOCALE];

    if (resolvePath(dict, exactKey) !== undefined) {
      return t(exactKey, mergedParams);
    }
    return t(`${baseKey}_other`, mergedParams);
  }

  function formatNumber(num) {
    const n = Number(num);
    if (Number.isNaN(n)) return String(num);
    try {
      const bcp = (LOCALES_CONFIG[currentLocale] && LOCALES_CONFIG[currentLocale].bcp47) || 'ru-RU';
      return new Intl.NumberFormat(bcp).format(n);
    } catch (e) {
      return String(n);
    }
  }

  /**
   * Converts Russian date strings from backend (e.g. "12 ноября, 09:00") to Kazakh ("12 қараша, 09:00")
   * or formats Date objects using Intl.DateTimeFormat('kk-KZ') with built-in month dictionary fallback.
   */
  function localizeDateString(rawDateStr) {
    if (!rawDateStr) return '';
    const str = String(rawDateStr);
    if (currentLocale === 'ru') return str;

    let result = str;
    for (let i = 0; i < MONTHS_RU_GENITIVE.length; i++) {
      const ruMonth = MONTHS_RU_GENITIVE[i];
      const kkMonth = MONTHS_KK[i];
      const regex = new RegExp(ruMonth, 'gi');
      result = result.replace(regex, kkMonth);
    }
    return result;
  }

  function formatDate(dateObj, includeTime = false) {
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    if (Number.isNaN(d.getTime())) return localizeDateString(dateObj);

    const day = d.getDate();
    const monthIdx = d.getMonth();
    const monthName = currentLocale === 'kk' ? MONTHS_KK[monthIdx] : MONTHS_RU_GENITIVE[monthIdx];
    const base = `${day} ${monthName}`;

    if (!includeTime) return base;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${base}, ${hh}:${mm}`;
  }

  /**
   * Locale-aware case conversion (critical for Kazakh і <-> І and ы <-> Ы).
   */
  function toUpper(str) {
    return String(str || '').toLocaleUpperCase(currentLocale === 'kk' ? 'kk-KZ' : 'ru-RU');
  }

  function toLower(str) {
    return String(str || '').toLocaleLowerCase(currentLocale === 'kk' ? 'kk-KZ' : 'ru-RU');
  }

  /**
   * Localizes database/catalog lesson content with fallback badge ('Орысша') when kk translation is absent.
   */
  function localizeLessonContent(specSlug, taskNumber, rawTask) {
    if (currentLocale === 'ru') {
      return {
        title: rawTask.title_ru || rawTask.title,
        description: rawTask.description_ru || rawTask.description,
        tools: rawTask.tools_ru || rawTask.tools_required || '',
        shortTitleOverride: null,
        isFallback: false
      };
    }

    // Check explicit DB fields first (title_kk, description_kk)
    if (rawTask.title_kk && rawTask.description_kk) {
      return {
        title: rawTask.title_kk,
        description: rawTask.description_kk,
        tools: rawTask.tools_kk || rawTask.tools_required || '',
        shortTitleOverride: rawTask.short_title_kk || null,
        isFallback: false
      };
    }

    // Check translation table
    const key = `${specSlug}:${taskNumber}`;
    const entry = CONTENT_TRANSLATIONS_KK[key];
    if (entry) {
      return {
        title: entry.title,
        description: entry.description,
        tools: entry.tools || rawTask.tools_required || '',
        shortTitleOverride: entry.shortTitle || null,
        isFallback: false
      };
    }

    // Fallback to Russian content with explicit 'Орысша' badge (no empty strings!)
    return {
      title: rawTask.title,
      description: rawTask.description,
      tools: rawTask.tools_required || '',
      shortTitleOverride: null,
      isFallback: true
    };
  }

  const SHARED_UI_PHRASES_RU_KK = {
    'Главная': 'Басты бет',
    'Специальности': 'Мамандықтар',
    'Программы': 'Бағдарламалар',
    'Учебник': 'Оқулық',
    'Практикум': 'Практикум',
    'Возможности': 'Мүмкіндіктер',
    'О колледже': 'Колледж туралы',
    'Войти': 'Кіру',
    'Вход': 'Кіру',
    'Регистрация': 'Тіркелу',
    'Моё обучение': 'Менің оқуым',
    'Выйти': 'Шығу',
    'Инструменты': 'Құралдар',
    'Карьера': 'Мансап',
    'Тарифы': 'Тарифтер',
    'Отзывы': 'Пікірлер',
    'Тренажёр': 'Жаттықтырғыш',
    'Светлая': 'Ашық',
    'Графит': 'Графит',
    'Неон': 'Неон',
    'Кабинет': 'Кабинет',
    'В кабинет': 'Кабинетке',
    'Профиль': 'Профиль',
    'Начать обучение': 'Оқуды бастау',
    'Начать обучение →': 'Оқуды бастау →',
    'Открыть учебник': 'Оқулықты ашу',
    'Личный кабинет': 'Жеке кабинет',
    'К списку миссий': 'Миссиялар тізіміне',
    'AI Тьютор': 'AI Тьютор',
    'Синхронизировано с PostgreSQL': 'PostgreSQL-мен синхрондалған',
    'Каталог курсов': 'Курстар каталогы',
    'Проверка сертификата': 'Сертификатты тексеру',
    'Алматинский многопрофильный колледж': 'Алматы көпсалалы колледжі',
    'Алматинский многопрофильный колледж · 5 специальностей ТиПО': 'Алматы көпсалалы колледжі · ТжКБ 5 мамандығы',
    'Интерактивные уроки с озвучкой и тренажёрами': 'Дыбысталған интерактивті сабақтар мен тренажерлар',
    'Интерактивных уроков с озвучкой и тренажёрами': 'Дыбысталған интерактивті сабақтар мен тренажерлар',
    '5 живых 3D-сцен со студийным светом и фонами': 'Студиялық жарығы мен фоны бар 5 тірі 3D-сахна',
    'Обученный ИИ-наставник и экзаменатор по ГОСТ/DIN': 'МЕМСТ/DIN бойынша оқытылған ЖИ-тәлімгер және емтихан алушы',
    'Контроль самостоятельности и цифровой ID студента': 'Дербестікті бақылау және студенттің цифрлық ID-і',
    'Интерактивные фотореалистичные 3D-стенды АМК': 'АМК интерактивті фотореалистік 3D-стендтері',
    '5 специальностей ТиПО': 'ТжКБ 5 мамандығы',
    'Выберите направление': 'Бағытты таңдаңыз',
    'Все модули и 25 стендов →': 'Барлық модульдер мен 25 стенд →',
    '01 · 20 уроков': '01 · 20 сабақ',
    '02 · 20 уроков': '02 · 20 сабақ',
    '03 · 20 уроков': '03 · 20 сабақ',
    '04 · 20 уроков': '04 · 20 сабақ',
    '05 · 20 уроков': '05 · 20 сабақ',
    'Веб-дизайн': 'Веб-дизайн',
    'Графический дизайн': 'Графикалық дизайн',
    'Автоэлектрика': 'Автоэлектрика',
    'Холодильное (HVAC)': 'Тоңазытқыш жабдықтары (HVAC)',
    'Холодильное оборудование': 'Тоңазытқыш жабдықтары',
    'Автомеханика': 'Автомеханика',
    'Рабочие инструменты студента': 'Студенттің жұмыс құралдары',
    'Поиск по базе знаний, калькулятор GPA и трекер задач': 'Білім қорынан іздеу, GPA калькуляторы және тапсырмалар трекері',
    '1. Живой поиск по базе знаний': '1. Білім қорынан тірі іздеу',
    '2. Калькулятор оценок практикума': '2. Практикум бағаларының калькуляторы',
    '3. Трекер задач · Task Hub': '3. Тапсырмалар трекері · Task Hub',
    'Средний балл (5.0)': 'Орташа балл (5.0)',
    'Уроков сдано': 'Тапсырылған сабақ',
    'Пройдено уроков': 'Өтілген сабақтар',
    '+ Прогноз урока': '+ Сабақ болжамы',
    '+ Прогноз': '+ Болжам',
    'Синхронизировать': 'Синхрондау',
    '+ Проект': '+ Жоба',
    'Добавить': 'Қосу',
    'Все': 'Барлығы',
    'Активные': 'Белсенді',
    'Готовые': 'Дайын',
    'Быстрый старт': 'Жылдам бастау',
    'Откройте первый урок прямо сейчас': 'Бірінші сабақты дәл қазір ашыңыз',
    'Выберите специальность и приступайте к практике в браузере без ожидания.': 'Мамандықты таңдап, браузерде күтусіз практикаға кірісіңіз.',
    'Обучение': 'Оқу',
    'Платформа': 'Платформа',
    'Колледж': 'Колледж',
    'Мой кабинет': 'Менің кабинетім',
    'Инструменты и шпаргалки': 'Құралдар мен жадынамалар',
    'Профиль и сертификат': 'Профиль және сертификат',
    '5 специальностей / 100 уроков / 25 3D-моделей': '5 мамандық / 100 сабақ / 25 3D-модель',
    'Программа курса': 'Курс бағдарламасы',
    'Прогресс по направлению': 'Бағыт бойынша үлгерім',
    'Начать с урока 1 →': '1-сабақтан бастау →',
    'Калькулятор оценок практикума и шпаргалки по курсам': 'Практикум бағаларының калькуляторы және курс жадынамалары',
    'Калькулятор среднего балла по практикуму': 'Практикум бойынша орташа балл калькуляторы',
    'Личный трекер задач': 'Жеке тапсырмалар трекері',
    'Таймер фокуса и конспект': 'Фокус таймері және конспект',
    'Все курсы': 'Барлық курстар',
    'Интерактивный тренажёр': 'Интерактивті жаттықтырғыш',
    'Двойная проверка работ': 'Жұмыстарды қос тексеру',
    'Поэтапный график (Drip-Feed)': 'Кезеңдік кесте (Drip-Feed)',
    'Электронный журнал и GPA': 'Электрондық журнал және GPA',
    'Цифровой сертификат с QR': 'QR-коды бар цифрлық сертификат',
    'Прямой чат с куратором': 'Куратормен тікелей чат',
    'Готовы приступить к практическому обучению?': 'Практикалық оқуға кірісуге дайынсыз ба?',
    'Зарегистрироваться бесплатно': 'Тегін тіркелу',
    'Смотреть все 100 модулей': 'Барлық 100 модульді көру',
    'О колледже и LMS': 'Колледж және LMS туралы',
    'Наша миссия и стандарты': 'Біздің миссиямыз бен стандарттарымыз',
    'Аккредитованных специальностей': 'Аккредиттелген мамандықтар',
    'Интерактивных уроков (по 20 модулей)': 'Интерактивті сабақтар (20 модульден)',
    '3D-моделей и виртуальных стендов': '3D-модельдер мен виртуалды стендтер',
    '5 регламентированных направлений подготовки:': 'Дайындықтың 5 регламенттелген бағыты:',
    'Автор проекта': 'Жоба авторы',
    'Учебное заведение и группа': 'Оқу орны және топ',
    'Формат разработки': 'Әзірлеу форматы',
    'Концепция и стиль': 'Тұжырымдама және стиль',
    'Навигация': 'Навигация',
    'Автор и связь (NyVor)': 'Автор және байланыс (NyVor)',
    'Ваше обучение в одном месте': 'Сіздің оқуыңыз бір жерде',
    'Создание аккаунта': 'Аккаунт құру',
    'Сбросить пароль': 'Құпиясөзді қалпына келтіру',
    'Войти в аккаунт': 'Аккаунтқа кіру',
    'Зарегистрироваться': 'Тіркелу'
  };

  function translateSharedHeaderNodes() {
    const candidates = document.querySelectorAll('header a, header button, header span, header h1, header p, main h1, main h2, main h3, main p, main span, main a, main button, main strong, main small, main div, main option, footer h3, footer a, footer span, footer div');
    candidates.forEach(el => {
      if (el.hasAttribute('data-i18n') || el.hasAttribute('data-lang') || el.children.length > 0) return;
      const raw = (el.getAttribute('data-orig-ru') || el.textContent || '').trim();
      if (!raw) return;
      if (SHARED_UI_PHRASES_RU_KK[raw]) {
        if (!el.hasAttribute('data-orig-ru')) {
          el.setAttribute('data-orig-ru', raw);
        }
        el.textContent = currentLocale === 'kk' ? SHARED_UI_PHRASES_RU_KK[raw] : raw;
      } else if (el.hasAttribute('data-orig-ru')) {
        const orig = el.getAttribute('data-orig-ru');
        el.textContent = currentLocale === 'kk' ? (SHARED_UI_PHRASES_RU_KK[orig] || orig) : orig;
      }
    });
  }

  function buildHeaderLangSwitcher() {
    const header = document.querySelector('header');
    if (!header) return;
    const existingBtns = document.querySelectorAll('[data-lang-switch], [data-lang], [data-i18n-lang]');
    if (existingBtns.length > 0) {
      existingBtns.forEach(btn => {
        const loc = btn.getAttribute('data-lang-switch') || btn.getAttribute('data-lang') || btn.getAttribute('data-i18n-lang');
        if (!loc) return;
        btn.setAttribute('data-lang', loc);
        btn.setAttribute('data-i18n-lang', loc);
        btn.setAttribute('data-lang-switch', loc);
        if (!btn.hasAttribute('data-i18n-bound')) {
          btn.setAttribute('data-i18n-bound', '1');
          btn.addEventListener('click', () => setLocale(loc));
        }
      });
      return;
    }

    const host =
      document.getElementById('lang-switch-slot') ||
      document.querySelector('.topbar .container') ||
      header.querySelector('.max-w-7xl, .header-actions') ||
      header;
    if (!host) return;

    const wrap = document.createElement('div');
    wrap.className = 'lang-switch';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Язык интерфейса');

    ['ru', 'kk'].forEach(code => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lang-dot' + (code === currentLocale ? ' is-active' : '');
      b.setAttribute('data-lang', code);
      b.setAttribute('data-i18n-lang', code);
      b.setAttribute('data-lang-switch', code);
      b.setAttribute('data-i18n-bound', '1');
      b.setAttribute('aria-pressed', String(code === currentLocale));
      b.textContent = code === 'kk' ? 'ҚАЗ' : 'РУС';
      b.addEventListener('click', () => setLocale(code));
      wrap.appendChild(b);
    });

    const themeSwitch = host.querySelector('.theme-switch');
    if (themeSwitch && themeSwitch.parentNode === host) {
      host.insertBefore(wrap, themeSwitch);
    } else {
      host.appendChild(wrap);
    }
  }

  /**
   * Applies translations to DOM elements with [data-i18n] and [data-i18n-attr].
   */
  function applyTranslations(root = document) {
    if (!root) return;

    // Update <html lang="...">
    if (root === document && document.documentElement) {
      document.documentElement.setAttribute('lang', currentLocale);
      if (document.querySelector('[data-i18n]')) {
        document.title = t('meta.pageTitle');
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', t('meta.pageDescription'));
      }
    }

    // 1. Text content: [data-i18n="key"]
    const textNodes = root.querySelectorAll('[data-i18n]');
    textNodes.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      let params = null;
      const rawParams = el.getAttribute('data-i18n-params');
      if (rawParams) {
        try { params = JSON.parse(rawParams); } catch (e) {}
      }
      el.textContent = t(key, params);
    });

    // 2. Attributes: [data-i18n-attr="placeholder:search.placeholder;aria-label:a11y.searchLabel"]
    const attrNodes = root.querySelectorAll('[data-i18n-attr]');
    attrNodes.forEach(el => {
      const spec = el.getAttribute('data-i18n-attr');
      if (!spec) return;
      spec.split(';').forEach(pair => {
        const [attrName, key] = pair.split(':').map(s => s && s.trim());
        if (attrName && key) {
          el.setAttribute(attrName, t(key));
        }
      });
    });

    translateSharedHeaderNodes();

    // 3. Sync Language Switcher active states (aria-pressed, is-active)
    document.querySelectorAll('[data-lang-switch], [data-lang], [data-i18n-lang]').forEach(btn => {
      const btnLoc = btn.getAttribute('data-lang-switch') || btn.getAttribute('data-lang') || btn.getAttribute('data-i18n-lang');
      const isActive = btnLoc === currentLocale;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  /**
   * Switches active locale without page reload.
   */
  function setLocale(nextLocale, options = { silent: false, animate: true }) {
    if (!LOCALES_CONFIG[nextLocale]) {
      console.warn(`[i18n] Unsupported locale "${nextLocale}". Supported:`, Object.keys(LOCALES_CONFIG));
      return currentLocale;
    }

    const changed = currentLocale !== nextLocale;
    currentLocale = nextLocale;

    try {
      localStorage.setItem(STORAGE_KEY, currentLocale);
      localStorage.setItem('amk.lang', currentLocale);
      if (window.EduSpace && typeof window.EduSpace.getActiveUser === 'function') {
        const u = window.EduSpace.getActiveUser();
        if (u) {
          u.locale = currentLocale;
          window.EduSpace.setActiveUser(u);
        }
      }
    } catch (e) {}

    if (document.documentElement) {
      document.documentElement.setAttribute('lang', currentLocale);
    }

    applyTranslations(document);
    window.dispatchEvent(new CustomEvent('eduspace:localeChanged', { detail: { locale: currentLocale } }));
    if (changed && !options.silent && typeof window.showToast === 'function') {
      window.showToast(t('toast.langSwitched'), 'info');
    }

    return currentLocale;
  }

  function setPseudoLocale(enabled) {
    pseudoMode = Boolean(enabled);
    applyTranslations(document);
    window.dispatchEvent(new CustomEvent('eduspace:localeChanged', { detail: { locale: currentLocale, pseudo: pseudoMode } }));
  }

  // Asynchronously refresh dictionaries from locales/*.json when served over HTTP(S)
  async function loadExternalDictionaries() {
    if (typeof fetch !== 'function' || window.location.protocol === 'file:') return;
    await Promise.all(Object.values(LOCALES_CONFIG).map(async cfg => {
      try {
        const res = await fetch(cfg.url, { cache: 'no-cache' });
        if (res.ok) {
          DICTIONARIES[cfg.code] = await res.json();
        }
      } catch (e) {
        // Built-in dictionary remains active offline
      }
    }));
  }

  // Initialize locale immediately
  currentLocale = detectDefaultLocale();
  try {
    localStorage.setItem(STORAGE_KEY, currentLocale);
    localStorage.setItem('amk.lang', currentLocale);
  } catch (e) {}
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('lang', currentLocale);
  }

  function onReady() {
    buildHeaderLangSwitcher();
    applyTranslations(document);
    loadExternalDictionaries();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  window.I18n = {
    t,
    plural,
    setLocale,
    getLocale: () => currentLocale,
    getSupportedLocales: () => Object.assign({}, LOCALES_CONFIG),
    applyTranslations,
    formatNumber,
    formatDate,
    localizeDateString,
    localizeLessonContent,
    toUpper,
    toLower,
    setPseudoLocale
  };
  window.t = t;
})();

