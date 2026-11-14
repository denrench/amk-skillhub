// AMK SkillHub — 100 Unique Interactive Domain Topic Games (5 Specialties x 20 Lessons x 3 Rounds)
// Auto-validated schema for window.TopicGameEngine
window.EDU_TOPIC_GAMES = {
  "it": {
    "1": {
      "title": "Лаборатория растрового экспорта: Photoshop Web",
      "instrument": "Adobe Photoshop Export",
      "mechanic": "bench_tuner",
      "badge": "IT / Растр 72 ppi",
      "brief": "Настрой экспорт веб-баннера без потери резкости и замедления загрузки сайта.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: Заказчику нужен лёгкий баннер на сайт (ширина 1200 px, разрешение для экрана 72 ppi, современный сжатый формат WebP с прозрачностью).",
          "previewType": "banner_export",
          "controls": [
            {
              "id": "width",
              "kind": "range",
              "label": "Ширина макета (px)",
              "min": 600,
              "max": 2400,
              "step": 200,
              "init": 2000,
              "unit": "px",
              "targetMin": 1200,
              "targetMax": 1200
            },
            {
              "id": "ppi",
              "kind": "pills",
              "label": "Разрешение (PPI)",
              "options": [
                "72",
                "150",
                "300"
              ],
              "init": "300",
              "targetVal": "72"
            },
            {
              "id": "fmt",
              "kind": "pills",
              "label": "Формат файла",
              "options": [
                "BMP",
                "PNG",
                "WebP",
                "TIFF"
              ],
              "init": "BMP",
              "targetVal": "WebP"
            }
          ],
          "hint": "Для веб-экранов стандарт 72 ppi (300 ppi нужен только для типографии). WebP сжимает на 25-35% легче PNG и поддерживает прозрачность.",
          "winRule": "Для экранов всегда задавайте 72 ppi и формат WebP — страница грузится мгновенно без потери чёткости.",
          "failRule": "300 ppi и BMP/TIFF раздувают веб-страницу до нескольких мегабайт и тормозят сайт."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: В пресете экспорта иконки бренда на тёмный сайт допущена ошибка, из-за которой появился белый квадратный фон. Найди бракованную настройку!",
          "artifactTitle": "Export As Preset — brand-logo",
          "items": [
            {
              "id": "d1",
              "code": "color_profile: sRGB IEC61966-2.1",
              "label": "Цветовое пространство веба"
            },
            {
              "id": "d2",
              "code": "format: JPEG (Quality 80%)",
              "label": "Формат сохранения иконки с прозрачным фоном"
            },
            {
              "id": "d3",
              "code": "canvas_width: 512 px @1x",
              "label": "Размер артборда под SVG/растр превью"
            },
            {
              "id": "d4",
              "code": "resample: Bicubic Sharper",
              "label": "Алгоритм уменьшения без мыла"
            }
          ],
          "defectId": "d2",
          "fixedCode": "format: PNG-24 / WebP (Transparency: ON)",
          "hint": "Какой популярный формат фото НЕ умеет хранить альфа-канал (прозрачность)?",
          "winRule": "JPEG не поддерживает прозрачность и всегда заливает пустой фон белым — для логотипов без фона берите PNG-24 или WebP.",
          "failReasons": {
            "d1": "sRGB — как раз правильный профиль для всех браузеров и экранов.",
            "d3": "Ширина 512 px оптимальна для превью логотипа.",
            "d4": "Bicubic Sharper корректно сохраняет резкость при сжатии."
          }
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Блиц-сортировка ассетов проекта — направь каждый объект в нужный веб-формат!",
          "bins": [
            {
              "id": "webp_jpg",
              "label": "Фото (WebP / JPEG)",
              "color": "cyan"
            },
            {
              "id": "png_alpha",
              "label": "Прозрачность (PNG-24 / WebP)",
              "color": "emerald"
            }
          ],
          "cards": [
            {
              "tag": "Баннер",
              "specimen": "Фотография команды в офисе 1600x900",
              "context": "Сплошной прямоугольный снимок без прозрачных краёв",
              "targetBin": "webp_jpg",
              "rule": "Сложные фотографии сжимают с потерями в JPEG или WebP — вес падает в 5-10 раз."
            },
            {
              "tag": "Стикер",
              "specimen": "Вырезанный кроссовок с мягкой тенью",
              "context": "Должен ложиться поверх любого градиента сайта",
              "targetBin": "png_alpha",
              "rule": "Плавная полупрозрачная тень требует альфа-канала (PNG-24 или WebP-alpha)."
            },
            {
              "tag": "Фон карточки",
              "specimen": "Текстура дерева для секции блога",
              "context": "Множество оттенков, прозрачность не нужна",
              "targetBin": "webp_jpg",
              "rule": "Растровые текстуры без прозрачности оптимально отдавать в WebP/JPEG."
            }
          ],
          "hint": "Если фоном под объектом должен просвечивать сайт — нужен альфа-канал (PNG/WebP). Сплошные фото сжимайте как JPEG/WebP.",
          "winRule": "Грамотное разделение фото (JPEG/WebP) и прозрачной графики (PNG/WebP) экономит до 70% трафика сайта."
        }
      ]
    },
    "2": {
      "title": "Векторная точность: Illustrator & SVG",
      "instrument": "Vector SVG Inspector",
      "mechanic": "defect_inspector",
      "badge": "IT / SVG Вектор",
      "brief": "Разбери векторный ассет перед отдачей разработчикам: проверь кривые Безье, масштаб и viewBox.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: На Retina-дисплее логотип в шапке сайта стал «мыльным», хотя дизайнер залил .svg файл! Инспектируй код и свойства файла.",
          "artifactTitle": "header-logo.svg — XML Structure",
          "items": [
            {
              "id": "v1",
              "code": "<svg viewBox=\"0 0 120 32\" fill=\"none\">",
              "label": "Векторный контейнер с viewBox"
            },
            {
              "id": "v2",
              "code": "<image xlink:href=\"data:image/png;base64,...\"/>",
              "label": "Встроенный элемент внутри SVG"
            },
            {
              "id": "v3",
              "code": "xmlns=\"http://www.w3.org/2000/svg\"",
              "label": "Пространство имён W3C SVG"
            },
            {
              "id": "v4",
              "code": "stroke-linecap=\"round\"",
              "label": "Скругление концов обводки"
            }
          ],
          "defectId": "v2",
          "fixedCode": "<path d=\"M12 4C18 4 24 10 24 16Z\" fill=\"#6366F1\"/>",
          "hint": "Посмотри внутрь SVG-контейнера: настоящая векторная геометрия описывается через <path>, а что скрывается в base64?",
          "winRule": "Вставка растрового PNG внутрь SVG-обёртки не делает картинку векторной — настоящие логотипы строятся кривыми <path> и формулами Безье.",
          "failReasons": {
            "v1": "Атрибут viewBox корректно масштабирует вектор под любые экраны.",
            "v3": "Стандартный xmlns обязателен для браузерного рендеринга SVG.",
            "v4": "Свойство stroke-linecap допустимо для векторных обводок."
          }
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Собери правильный пайплайн подготовки векторной иконки из Adobe Illustrator в чистый веб-SVG.",
          "chips": [
            {
              "id": "c1",
              "text": "Выровнять артборд в целых пикселях (24x24)"
            },
            {
              "id": "c2",
              "text": "Expand обводок и Object -> Flatten"
            },
            {
              "id": "c3",
              "text": "Pathfinder: объединить лишние контуры"
            },
            {
              "id": "c4",
              "text": "Сохранить в BMP 600 dpi"
            },
            {
              "id": "c5",
              "text": "Экспорт SVG + оптимизация через SVGO"
            }
          ],
          "correctOrder": [
            "c1",
            "c2",
            "c3",
            "c5"
          ],
          "hint": "Сначала ровная сетка, затем перевод обводок в кривые (Expand), склейка лишних фигур и чистый SVG-экспорт.",
          "winRule": "Чистый веб-вектор требует целых координат артборда, раскрытых обводок (Expand) и оптимизации пути без мусора Illustrator."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "UI-204",
          "speaker": "Frontend-разработчик Тимур",
          "telemetry": [
            {
              "label": "Иконка",
              "val": "24x24 SVG",
              "bad": false
            },
            {
              "label": "Цвет hover",
              "val": "Заблокирован",
              "bad": true
            }
          ],
          "situation": "Верстальщик жалуется: CSS-правило `.icon:hover { fill: #22d3ee; }` не красит SVG-иконку, она остаётся чёрной!",
          "choices": [
            {
              "id": "a",
              "text": "Увеличить размер артборда до 240x240 px",
              "outcome": "Размер не влияет на управление цветом через CSS."
            },
            {
              "id": "b",
              "text": "Заменить жёстко вшитый fill=\"#000000\" на fill=\"currentColor\"",
              "outcome": "Идеально! CSS сразу подхватывает текущий цвет текста элемента."
            },
            {
              "id": "c",
              "text": "Перевести иконку обратно в JPEG",
              "outcome": "JPEG вообще не поддерживает SVG/CSS перекраску и прозрачность."
            }
          ],
          "correctId": "b",
          "hint": "Какое специальное значение атрибута fill заставляет SVG наследовать цвет текста из CSS?",
          "winRule": "Атрибут fill=\"currentColor\" связывает цвет векторного SVG с CSS-свойством color, упрощая hover и темы."
        }
      ]
    },
    "3": {
      "title": "Архитектура Figma: Frame и 8px-сетка",
      "instrument": "Figma Grid Studio",
      "mechanic": "code_or_formula_builder",
      "badge": "IT / Сетка 8px",
      "brief": "Построй правильную иерархию холста и настрой модульную 12-колоночную сетку в Figma.",
      "rounds": [
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 1: Пошагово создай каркас Hero-экрана сайта шириной 1440 px по стандарту Figma.",
          "chips": [
            {
              "id": "f1",
              "text": "Нажать F (Frame) и выбрать Desktop 1440"
            },
            {
              "id": "f2",
              "text": "Добавить Layout Grid: Columns 12, Gutter 24px"
            },
            {
              "id": "f3",
              "text": "Вложить внутренние секции как дочерние фреймы"
            },
            {
              "id": "f4",
              "text": "Нарисовать фон через Rectangle R без вложенности"
            },
            {
              "id": "f5",
              "text": "Настроить Constraints и кратные 8px отступы"
            }
          ],
          "correctOrder": [
            "f1",
            "f2",
            "f3",
            "f5"
          ],
          "hint": "Простой прямоугольник (R) не держит сетку и вёрстку — всегда стартуем с Frame (клавиша F).",
          "winRule": "В Figma экраны и блоки строят через Frame (F), а не Rectangle (R), с 12-колоночной сеткой и шагом отступов кратным 8 px."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Приведи макет к единому 8-точечному ритму (8pt Grid): стандартный компьютерный фрейм 1440 px, 12 колонок и отступы кратные 8 (Gutter 24 px, Margin 120 px).",
          "previewType": "generic",
          "controls": [
            {
              "id": "cols",
              "kind": "pills",
              "label": "Число колонок (Desktop)",
              "options": [
                "5",
                "8",
                "12"
              ],
              "init": "5",
              "targetVal": "12"
            },
            {
              "id": "gutter",
              "kind": "range",
              "label": "Межколонник Gutter (кратен 8)",
              "min": 8,
              "max": 40,
              "step": 4,
              "init": 12,
              "unit": "px",
              "targetMin": 24,
              "targetMax": 24
            },
            {
              "id": "pad",
              "kind": "range",
              "label": "Внутренний отступ карточки (кратен 8)",
              "min": 8,
              "max": 48,
              "step": 4,
              "init": 20,
              "unit": "px",
              "targetMin": 24,
              "targetMax": 32
            }
          ],
          "hint": "12 колонок идеально делятся на 2, 3, 4 и 6 блоков. Для отступов выбирай числа кратные 8 (16, 24, 32).",
          "winRule": "Сетка 12 колонок + кратность отступов 8px (Gutter 24px, Padding 24-32px) делает интерфейс предсказуемым и чистым.",
          "failRule": "Нечётные отступы вроде 12 или 20 px ломают 8px-ритм макета."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 3: При растяжении окна с 1440px до 1920px аватарка в углу «уехала» в центр шапки. Найди сломанный параметр на панели Properties!",
          "meterName": "FIGMA INSPECTOR",
          "normalSpec": "Аватар прибит к правому краю (Right + Top)",
          "points": [
            {
              "id": "p1",
              "name": "Header Frame Width",
              "pin": "Layout -> Constraints",
              "reading": "Scale / Left+Right",
              "unit": "",
              "meterNote": "Шапка корректно растягивается на всю ширину экрана."
            },
            {
              "id": "p2",
              "name": "Avatar Constraints",
              "pin": "Node -> Constraints",
              "reading": "Left + Top",
              "unit": "",
              "meterNote": "Стоит привязка к ЛЕВОМУ краю — при расширении остаётся слева от края!"
            },
            {
              "id": "p3",
              "name": "Avatar Layer Depth",
              "pin": "Hierarchy",
              "reading": "Inside Header Frame",
              "unit": "",
              "meterNote": "Слой правильно лежит внутри контейнера шапки."
            },
            {
              "id": "p4",
              "name": "Base Grid Snap",
              "pin": "Grid 8px",
              "reading": "x: 1368, y: 16",
              "unit": "",
              "meterNote": "Позиция кратна 8 px на стартовом 1440-фрейме."
            }
          ],
          "faultId": "p2",
          "hint": "Если элемент находится справа, к какой стороне родительского фрейма должен быть привязан его Constraint?",
          "winRule": "Правые элементы шапки привязывают Constraint = Right + Top, тогда при адаптивном ресайзе они сохраняют отступ от правого края."
        }
      ]
    },
    "4": {
      "title": "Auto Layout в Figma: резина и отступы",
      "instrument": "Auto Layout Inspector",
      "mechanic": "probe_diagnostic",
      "badge": "IT / Shift+A",
      "brief": "Освой резиновые контейнеры Auto Layout: режимы Hug, Fill container, Gap и Padding.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: В карточку добавили длинный заголовок — и текст вылез за границы кнопки и накрыл цену! Прозвони свойства Auto Layout.",
          "meterName": "AUTO LAYOUT PROBE",
          "normalSpec": "Кнопка и текст адаптируются под длину контента (Hug / Fill)",
          "points": [
            {
              "id": "a1",
              "name": "Корневой Card Frame",
              "pin": "Vertical Shift+A",
              "reading": "Gap: 16px, Pad: 24px",
              "unit": "",
              "meterNote": "Вертикальное направление и отступы настроены верно."
            },
            {
              "id": "a2",
              "name": "Текстовый блок Title",
              "pin": "Resizing Mode",
              "reading": "Fixed width + Fixed height",
              "unit": "",
              "meterNote": "Жёсткий Fixed height! Строка не расширяет карточку и наезжает на цену снизу."
            },
            {
              "id": "a3",
              "name": "Кнопка Купить (CTA)",
              "pin": "Width Resizing",
              "reading": "Hug contents",
              "unit": "",
              "meterNote": "Кнопка аккуратно обжимает свой текст."
            }
          ],
          "faultId": "a2",
          "hint": "Какой режим Resizing не даёт текстовому слою растягивать карточку по высоте при переносе строк?",
          "winRule": "Многострочный текст внутри Auto Layout карточки должен иметь ширину Fill container и высоту Hug contents (но не Fixed height!)."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Настрой идеальную кнопку с иконкой и текстом через Auto Layout: ширина обнимает текст (Hug), горизонтальный паддинг 24px, вертикальный 12px, зазор (Gap) между иконкой и текстом 8px.",
          "previewType": "generic",
          "controls": [
            {
              "id": "resize",
              "kind": "pills",
              "label": "Horizontal Resizing",
              "options": [
                "Fixed",
                "Hug",
                "Fill"
              ],
              "init": "Fixed",
              "targetVal": "Hug"
            },
            {
              "id": "padX",
              "kind": "range",
              "label": "Горизонтальный Padding",
              "min": 8,
              "max": 40,
              "step": 4,
              "init": 8,
              "unit": "px",
              "targetMin": 20,
              "targetMax": 28
            },
            {
              "id": "gap",
              "kind": "range",
              "label": "Gap (между иконкой и текстом)",
              "min": 0,
              "max": 24,
              "step": 4,
              "init": 20,
              "unit": "px",
              "targetMin": 8,
              "targetMax": 12
            }
          ],
          "hint": "В кнопках горизонтальный отступ (24px) обычно вдвое больше вертикального (12px), а ширина — Hug contents.",
          "winRule": "Сочетание Hug contents + Padding 24/12 + Gap 8px даёт кнопку, которая сама расширяется под любой язык текста."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: Внутри карточки 3 колонки цен «вылезли» вправо на мобильном экране 375 px. Найди сломанный параметр!",
          "artifactTitle": "Pricing Card — Mobile Container",
          "items": [
            {
              "id": "m1",
              "code": "Card Parent: Width = 343px (Fill)",
              "label": "Ширина внешней мобильной карточки"
            },
            {
              "id": "m2",
              "code": "Price Row: Children Width = Fixed 180px * 3",
              "label": "Вложенные ячейки внутри горизонтального ряда"
            },
            {
              "id": "m3",
              "code": "Auto Layout Wrap: Enabled",
              "label": "Перенос элементов при нехватке ширины"
            },
            {
              "id": "m4",
              "code": "Padding: 16px all sides",
              "label": "Поля карточки"
            }
          ],
          "defectId": "m2",
          "fixedCode": "Price Row: Children Width = Fill container (Min-width: 96px)",
          "hint": "180 * 3 = 540 px! Они шире, чем весь мобильный экран 375 px.",
          "winRule": "Адаптивные элементы внутри Auto Layout ряда используют Fill container (или min-width), чтобы сжиматься под узкий экран."
        }
      ]
    },
    "5": {
      "title": "Компоненты и Прототипы в Figma",
      "instrument": "Component Lab",
      "mechanic": "workshop_quest",
      "badge": "IT / Компоненты",
      "brief": "Создавай масштабируемые дизайн-системы на Main Components, Variants и живых прототипах.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "DS-101",
          "speaker": "Арт-директор Анна",
          "telemetry": [
            {
              "label": "Кнопок в макете",
              "val": "48 штук",
              "bad": false
            },
            {
              "label": "Реакция на edit",
              "val": "Не обновляются",
              "bad": true
            }
          ],
          "situation": "Мы поменяли цвет кнопки в библиотеке, но на всех 48 экранах кнопки остались старого цвета. Что произошло при копировании?",
          "choices": [
            {
              "id": "a",
              "text": "Были сделаны Detach Instance (разрыв связи) — кнопки стали обычными фреймами",
              "outcome": "Точно в цель! После Detach элемент перестаёт получать обновления от Main Component."
            },
            {
              "id": "b",
              "text": "В Figma заблокирован зум холста",
              "outcome": "Зум холста никак не влияет на наследование стилей компонентов."
            },
            {
              "id": "c",
              "text": "Не выбран режим Dark Mode",
              "outcome": "Цветовые переменные и Detach — разные механизмы."
            }
          ],
          "correctId": "a",
          "hint": "Какая команда навсегда отвязывает дочерний экземпляр (Instance) от ромбовидного мастера?",
          "winRule": "Никогда не делайте Detach Instance ради правки цвета или текста — меняйте цвет только в Main Component или через Variants."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 2: Отдели правила Главного компонента (Main Component) от Экземпляра (Instance)!",
          "bins": [
            {
              "id": "main",
              "label": "Main Component (Мастер)",
              "color": "purple"
            },
            {
              "id": "inst",
              "label": "Instance (Экземпляр)",
              "color": "cyan"
            }
          ],
          "cards": [
            {
              "tag": "Структура",
              "specimen": "Добавление и удаление новых слоёв внутри кнопки",
              "context": "Например, вставить бейдж скидки во все карточки сразу",
              "targetBin": "main",
              "rule": "Добавлять или удалять слои в иерархии можно только в Main Component."
            },
            {
              "tag": "Контент (Override)",
              "specimen": "Замена текста «Купить» на «Перейти в корзину»",
              "context": "На конкретной странице заказа",
              "targetBin": "inst",
              "rule": "Переопределение текста, цвета и иконки (Overrides) безопасно делается прямо в Instance."
            },
            {
              "tag": "Состояния",
              "specimen": "Объединение Default / Hover / Disabled в Variant Set",
              "context": "Единая система переключения",
              "targetBin": "main",
              "rule": "Варианты (Variants) создаются и хранятся в наборе Main Component."
            }
          ],
          "hint": "Меняем внутреннюю геометрию и наборы вариантов — в Main. Меняем только конкретный текст или картинку карточки — в Instance.",
          "winRule": "Main Component задаёт единую структуру и варианты, а Instance позволяет переопределять контент без разрушения связи."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери правильную связку живого прототипа (While Hovering) для плавной кнопки.",
          "chips": [
            {
              "id": "p1",
              "text": "Создать 2 варианта в Component Set: State=Default и State=Hover"
            },
            {
              "id": "p2",
              "text": "Перейти во вкладку Prototype и протянуть связь от Default к Hover"
            },
            {
              "id": "p3",
              "text": "Выбрать триггер While hovering + Smart animate (200ms)"
            },
            {
              "id": "p4",
              "text": "Назначить On Click с мгновенным сбросом страницы"
            },
            {
              "id": "p5",
              "text": "Протестировать наведённый Instance в окне Present (Play)"
            }
          ],
          "correctOrder": [
            "p1",
            "p2",
            "p3",
            "p5"
          ],
          "hint": "Для реакции на наведение курсора (без клика!) используется триггер While hovering и плавная анимация Smart animate.",
          "winRule": "Interactive Components с While hovering + Smart animate оживляют кнопки прямо внутри одного экземпляра."
        }
      ]
    },
    "6": {
      "title": "Семантика HTML5 и Доступность DOM",
      "instrument": "HTML5 DOM Validator",
      "mechanic": "triage_radar",
      "badge": "IT / HTML5",
      "brief": "Строй правильный семантический HTML-скелет: поисковые роботы и скринридеры понимают смысловые теги.",
      "rounds": [
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 1: Распредели HTML-блоки — какие теги семантически верны, а какие нарушают стандарт W3C!",
          "bins": [
            {
              "id": "good",
              "label": "✓ Чистая семантика HTML5",
              "color": "emerald"
            },
            {
              "id": "bad",
              "label": "✗ Div-суп / Антипаттерн",
              "color": "rose"
            }
          ],
          "cards": [
            {
              "tag": "Навигация",
              "specimen": "<header><nav>...</nav></header>",
              "context": "Верхняя панель со ссылками разделов",
              "targetBin": "good",
              "rule": "<header> и <nav> чётко обозначают шапку и навигацию для SEO и скринридеров."
            },
            {
              "tag": "Кнопка",
              "specimen": "<div onclick=\"buy()\">Купить</div>",
              "context": "Кликабельный элемент формы заказа",
              "targetBin": "bad",
              "rule": "<div onclick> не фокусируется с клавиатуры Tab/Enter — всегда берите <button type=\"button\">!"
            },
            {
              "tag": "Изображение",
              "specimen": "<img src=\"hero.webp\" alt=\"Умные часы X5\">",
              "context": "Товарное фото в карточке",
              "targetBin": "good",
              "rule": "Атрибут alt описывает картинку при сбое загрузки и для незрячих пользователей."
            }
          ],
          "hint": "Интерактивные действия — это <button>, переходы между URL — <a href>, а не <div onclick>.",
          "winRule": "Семантика HTML5 (<header>, <main>, <button>, <img alt>) автоматически даёт доступность (a11y) и бонус к SEO."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: Lighthouse выдал предупреждение по HTML-коду лендинга. Найди грубую ошибку структуры документа!",
          "artifactTitle": "index.html — Document Outline",
          "items": [
            {
              "id": "h1",
              "code": "<!DOCTYPE html><html lang=\"ru\">",
              "label": "Объявление стандарта HTML5 и языка"
            },
            {
              "id": "h2",
              "code": "<h1>Сайт 1</h1> ... <h1>Услуги</h1> ... <h1>Отзывы</h1>",
              "label": "Разметка заголовков секций на одной странице"
            },
            {
              "id": "h3",
              "code": "<main><section aria-labelledby=\"sec1\">...</section></main>",
              "label": "Основная область контента"
            },
            {
              "id": "h4",
              "code": "<a href=\"#catalog\" class=\"btn\">Смотреть каталог</a>",
              "label": "Якорный переход к секции"
            }
          ],
          "defectId": "h2",
          "fixedCode": "Один <h1> в Hero + <h2>Услуги</h2> и <h2>Отзывы</h2> для секций",
          "hint": "Сколько главных заголовков первого уровня должно быть на одной веб-странице?",
          "winRule": "На странице должен быть один главный <h1>, а все разделы ниже структурируются иерархией <h2> -> <h3>.",
          "failReasons": {
            "h1": "DOCTYPE html и lang=\"ru\" полностью валидны.",
            "h3": "Теги <main> и <section> правильно выделяют смысловые области.",
            "h4": "Ссылка <a href> корректна для навигационного перехода."
          }
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери корректную карточку товара в HTML5 от обёртки до кнопки.",
          "chips": [
            {
              "id": "t1",
              "text": "<article class=\"product-card\">"
            },
            {
              "id": "t2",
              "text": "<img src=\"item.webp\" alt=\"Кроссовки RunPro\">"
            },
            {
              "id": "t3",
              "text": "<h3 class=\"title\">RunPro Air</h3>"
            },
            {
              "id": "t4",
              "text": "<button type=\"button\">В корзину</button></article>"
            },
            {
              "id": "t5",
              "text": "<marquee><blink>Купи сейчас</blink></marquee>"
            }
          ],
          "correctOrder": [
            "t1",
            "t2",
            "t3",
            "t4"
          ],
          "hint": "Независимая карточка оборачивается в <article>, внутри фото с alt, заголовок h3 и семантический <button>.",
          "winRule": "Карточка товара — идеальный пример <article> с изображением, заголовком и кнопкой <button>."
        }
      ]
    },
    "7": {
      "title": "CSS Box Model: Padding, Margin и Overflow",
      "instrument": "CSS Box Model Debugger",
      "mechanic": "defect_inspector",
      "badge": "IT / Box Model",
      "brief": "Пойми разницу между внутренним padding, внешним margin и поведением box-sizing: border-box.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: Два блока по 50% ширины не поместились рядом и вторая колонка упала вниз! Найди виновную CSS-строку в блоке .col.",
          "artifactTitle": "styles.css — .two-columns",
          "items": [
            {
              "id": "b1",
              "code": ".row { display: flex; flex-wrap: wrap; }",
              "label": "Контейнер двух колонок"
            },
            {
              "id": "b2",
              "code": ".col { width: 50%; padding: 24px; box-sizing: content-box; }",
              "label": "Правило ширины и отступа колонки"
            },
            {
              "id": "b3",
              "code": ".col h2 { margin-bottom: 12px; }",
              "label": "Нижний отступ заголовка"
            },
            {
              "id": "b4",
              "code": ".btn { border-radius: 12px; }",
              "label": "Скругление углов кнопки"
            }
          ],
          "defectId": "b2",
          "fixedCode": ".col { width: 50%; padding: 24px; box-sizing: border-box; }",
          "hint": "При content-box к width: 50% ПРИБАВЛЯЮТСЯ 24px + 24px padding — итоговая ширина больше 100%!",
          "winRule": "Всегда задавайте `box-sizing: border-box;`, тогда padding и border входят внутрь заданных width/height, а не раздувают блок.",
          "failReasons": {
            "b1": "Flex-wrap честно перенёс колонку, когда суммарная ширина превысила 100%.",
            "b3": "Отступ снизу заголовка внутри блока ширину не ломает.",
            "b4": "border-radius не меняет геометрию ширины блока."
          }
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Настрой комфортную кликабельную карточку-кнопку: внутренний padding 16px (воздух внутри рамки), border-radius 12px, и border-box.",
          "previewType": "generic",
          "controls": [
            {
              "id": "sizing",
              "kind": "pills",
              "label": "box-sizing",
              "options": [
                "content-box",
                "border-box"
              ],
              "init": "content-box",
              "targetVal": "border-box"
            },
            {
              "id": "padding",
              "kind": "range",
              "label": "Внутренний padding",
              "min": 0,
              "max": 32,
              "step": 4,
              "init": 0,
              "unit": "px",
              "targetMin": 16,
              "targetMax": 24
            },
            {
              "id": "radius",
              "kind": "range",
              "label": "border-radius",
              "min": 0,
              "max": 32,
              "step": 4,
              "init": 0,
              "unit": "px",
              "targetMin": 12,
              "targetMax": 16
            }
          ],
          "hint": "Внутреннее пространство вокруг текста внутри фона/рамки задаёт именно padding, а не margin.",
          "winRule": "Padding увеличивает кликабельную зону внутри кнопки, а border-radius 12-16px создаёт современный UI-вид."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "CSS-307",
          "speaker": "QA-инженер Лена",
          "telemetry": [
            {
              "label": "Фон кнопки",
              "val": "Впритык к буквам",
              "bad": true
            },
            {
              "label": "Соседние кнопки",
              "val": "Тоже слиплись",
              "bad": true
            }
          ],
          "situation": "Новичок задал кнопке `margin: 16px`, но текст внутри синей рамки остался прижат к краям! Как это исправить?",
          "choices": [
            {
              "id": "a",
              "text": "Заменить на `margin: 40px` ещё больше",
              "outcome": "Margin отодвинет только соседние элементы снаружи, но не фон самой кнопки."
            },
            {
              "id": "b",
              "text": "Задать `padding: 12px 24px` для внутреннего воздуха и `margin` (или flex `gap`) для дистанции между кнопками",
              "outcome": "Абсолютно верно! Padding — внутри границ, Margin/Gap — снаружи."
            },
            {
              "id": "c",
              "text": "Использовать `z-index: 999`",
              "outcome": "z-index управляет только слоями наложения по оси Z."
            }
          ],
          "correctId": "b",
          "hint": "Разграничь: какое свойство отодвигает содержимое от собственной рамки элемента, а какое — сам элемент от соседей?",
          "winRule": "Padding — это внутренний отступ от контента до border, а Margin / gap — внешний отступ от других элементов."
        }
      ]
    },
    "8": {
      "title": "CSS Flexbox: идеальная шапка сайта",
      "instrument": "Live Flexbox Sandbox",
      "mechanic": "bench_tuner",
      "badge": "IT / Flexbox",
      "brief": "Управляй осями Flexbox в реальном времени: выравнивай логотип, меню и кнопку CTA.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: Включи Flexbox для шапки сайта, разведи LOGO, меню и кнопку «Войти» по краям (space-between) и выровняй по вертикальному центру (center) с gap 16px.",
          "previewType": "flexbox",
          "controls": [
            {
              "id": "display",
              "kind": "pills",
              "label": "display",
              "options": [
                "block",
                "flex"
              ],
              "init": "block",
              "targetVal": "flex"
            },
            {
              "id": "justify",
              "kind": "pills",
              "label": "justify-content (горизонталь)",
              "options": [
                "flex-start",
                "center",
                "space-between"
              ],
              "init": "flex-start",
              "targetVal": "space-between"
            },
            {
              "id": "align",
              "kind": "pills",
              "label": "align-items (вертикаль)",
              "options": [
                "stretch",
                "flex-start",
                "center"
              ],
              "init": "stretch",
              "targetVal": "center"
            },
            {
              "id": "gap",
              "kind": "range",
              "label": "gap",
              "min": 0,
              "max": 32,
              "step": 4,
              "init": 0,
              "unit": "px",
              "targetMin": 12,
              "targetMax": 24
            }
          ],
          "hint": "Переключи display на flex — сразу увидишь, как элементы встанут в ряд! Затем space-between по главной оси и center по поперечной.",
          "winRule": "`display: flex; justify-content: space-between; align-items: center;` — классическая формула адаптивной шапки сайта.",
          "failRule": "В режиме block элементы падают в столбец, а свойства Flexbox вообще не действуют."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 2: На мобильном экране меню из 5 кнопок не переносится на новую строку и вызывает горизонтальный скролл. Прозвони CSS-правила контейнера!",
          "meterName": "FLEX DIAGNOSTICS",
          "normalSpec": "Кнопки на узком экране переносятся вниз (flex-wrap: wrap)",
          "points": [
            {
              "id": "fx1",
              "name": "display",
              "pin": ".nav-list",
              "reading": "flex",
              "unit": "",
              "meterNote": "Flex-контейнер активен."
            },
            {
              "id": "fx2",
              "name": "flex-wrap",
              "pin": ".nav-list",
              "reading": "nowrap (default)",
              "unit": "",
              "meterNote": "По умолчанию стоит nowrap — элементы не переносятся и пробивают ширину 100%!"
            },
            {
              "id": "fx3",
              "name": "align-items",
              "pin": ".nav-list",
              "reading": "center",
              "unit": "",
              "meterNote": "Вертикальное выравнивание корректно."
            },
            {
              "id": "fx4",
              "name": "gap",
              "pin": ".nav-list",
              "reading": "12px",
              "unit": "",
              "meterNote": "Отступ между кнопками задан чисто."
            }
          ],
          "faultId": "fx2",
          "hint": "По умолчанию flex-элементы упрямо вытягиваются в одну бесконечно длинную строку...",
          "winRule": "Свойство `flex-wrap: wrap` разрешает flex-элементам переноситься на следующую строку при сужении экрана."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Выбери подходящий инструмент современной вёрстки: одномерный Flexbox или двумерный CSS Grid!",
          "bins": [
            {
              "id": "flex",
              "label": "Flexbox (1 ось: ряд/столбец)",
              "color": "indigo"
            },
            {
              "id": "grid",
              "label": "CSS Grid (2D матрица)",
              "color": "cyan"
            }
          ],
          "cards": [
            {
              "tag": "Панель",
              "specimen": "Навигация в шапке с лого и кнопкой Вход",
              "context": "Один горизонтальный ряд элементов",
              "targetBin": "flex",
              "rule": "Линейные ряды и выравнивание внутри одной оси удобнее делать на Flexbox."
            },
            {
              "tag": "Каталог",
              "specimen": "Сетка 4x3 карточки курсов одинаковой ширины",
              "context": "Строгий контроль строк И колонок одновременно",
              "targetBin": "grid",
              "rule": "Двумерные сетки `grid-template-columns: repeat(4, 1fr)` — стихия CSS Grid."
            },
            {
              "tag": "Кнопка",
              "specimen": "Иконка слева + текст строго по центру кнопки",
              "context": "Одна строчка с gap: 8px",
              "targetBin": "flex",
              "rule": "`display: inline-flex; align-items: center; gap: 8px` — стандарт для кнопок."
            }
          ],
          "hint": "Одна линия/ось — берите Flexbox. Сетка с одновременными строками и колонками — CSS Grid.",
          "winRule": "Flexbox и CSS Grid не конкуренты, а дополняют друг друга: Grid держит каркас страницы, Flexbox выравнивает контент внутри блоков."
        }
      ]
    },
    "9": {
      "title": "JavaScript DOM и События клика",
      "instrument": "JS DOM Console",
      "mechanic": "probe_diagnostic",
      "badge": "IT / JS Events",
      "brief": "Оживляй интерфейс через querySelector, addEventListener и переключение классов без ошибок.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: Кнопка «Открыть меню» на сайте вообще не реагирует и консоль выдаёт TypeError: Cannot read properties of null! Проверь цепочку DOM-скрипта.",
          "meterName": "DEVTOOLS DOM PROBE",
          "normalSpec": "querySelector находит существующий узел и вешает 'click'",
          "points": [
            {
              "id": "js1",
              "name": "HTML кнопка",
              "pin": "<button id=\"menu-btn\">",
              "reading": "id=\"menu-btn\"",
              "unit": "",
              "meterNote": "Кнопка в HTML имеет атрибут ID."
            },
            {
              "id": "js2",
              "name": "JS Селектор",
              "pin": "app.js line 2",
              "reading": "document.querySelector('.menu-btn') -> null",
              "unit": "",
              "meterNote": "Точка `.menu-btn` ищет CLASS вместо ID `#menu-btn`! Возвращает null."
            },
            {
              "id": "js3",
              "name": "Слушатель",
              "pin": "app.js line 3",
              "reading": ".addEventListener('click', toggleMenu)",
              "unit": "",
              "meterNote": "Синтаксис самого слушателя верен, но при null он падает."
            },
            {
              "id": "js4",
              "name": "Подключение script",
              "pin": "index.html",
              "reading": "Перед </body> (DOM готов)",
              "unit": "",
              "meterNote": "Скрипт подключён в конце body, HTML уже построен."
            }
          ],
          "faultId": "js2",
          "hint": "Посмотри на символ перед названием в `querySelector`: в HTML стоит `id=\"menu-btn\"`, а в JS написано с точкой!",
          "winRule": "В `document.querySelector` символы соответствуют CSS: `#` для `id`, `.` для `class`. Возврат `null` сразу роняет `addEventListener`."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: На странице 5 кнопок «В избранное», но срабатывает только самая первая. Найди причину в коде!",
          "artifactTitle": "favorites.js — Event Binding",
          "items": [
            {
              "id": "l1",
              "code": "const cardBtns = document.querySelector('.fav-btn');",
              "label": "Поиск кнопок в DOM"
            },
            {
              "id": "l2",
              "code": "btn.classList.toggle('is-active');",
              "label": "Переключение CSS-класса активности"
            },
            {
              "id": "l3",
              "code": "e.preventDefault();",
              "label": "Предотвращение перезагрузки внутри ссылки"
            },
            {
              "id": "l4",
              "code": "btn.setAttribute('aria-pressed', 'true');",
              "label": "Обновление доступности кнопки"
            }
          ],
          "defectId": "l1",
          "fixedCode": "document.querySelectorAll('.fav-btn').forEach(btn => ...)",
          "hint": "`querySelector` всегда останавливается на ПЕРВОМ найденном совпадении...",
          "winRule": "Для группы однотипных элементов используйте `querySelectorAll('.class')` + `.forEach(...)` или делегирование событий.",
          "failReasons": {
            "l2": "`classList.toggle` отлично включает и выключает класс при каждом клике.",
            "l3": "`preventDefault` корректно гасит стандартный переход/отправку.",
            "l4": "`aria-pressed` полезен для доступности переключателей."
          }
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери чистый рабочий обработчик открытия модального окна по клику на кнопку.",
          "chips": [
            {
              "id": "c1",
              "text": "const modal = document.querySelector('#modal');"
            },
            {
              "id": "c2",
              "text": "const openBtn = document.querySelector('#open-modal');"
            },
            {
              "id": "c3",
              "text": "openBtn.addEventListener('click', () => {"
            },
            {
              "id": "c4",
              "text": "modal.classList.toggle('open'); });"
            },
            {
              "id": "c5",
              "text": "window.location.reload(); });"
            }
          ],
          "correctOrder": [
            "c1",
            "c2",
            "c3",
            "c4"
          ],
          "hint": "Находим два элемента DOM, вешаем слушатель `'click'` и переключаем класс видимости `'open'`.",
          "winRule": "Связка querySelector + addEventListener('click') + classList.toggle — базовый паттерн любого интерактива в вебе."
        }
      ]
    },
    "10": {
      "title": "Итоговый релиз IT: Figma -> Код Карточки",
      "instrument": "Production Release Gate",
      "mechanic": "workshop_quest",
      "badge": "IT / Финал",
      "brief": "Сдай готовую интерактивную карточку товара по полному циклу Figma -> HTML -> CSS -> JS.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "REL-100",
          "speaker": "Тимлид Максим",
          "telemetry": [
            {
              "label": "Картинки",
              "val": "PNG по 3 MB",
              "bad": true
            },
            {
              "label": "Hover-эффект",
              "val": "Дёргает соседей",
              "bad": true
            }
          ],
          "situation": "При наведении мыши на карточку товара все остальные карточки в сетке прыгают на 2px вверх! Верстальщик менял `border-width` при `:hover`. Как решить проблему по стандарту UI?",
          "choices": [
            {
              "id": "a",
              "text": "Оставить border, но при :hover менять transform: translateY(-4px) и box-shadow с transition: 0.2s",
              "outcome": "Безупречно! GPU-свойства transform и box-shadow не сдвигают соседние блоки в потоке."
            },
            {
              "id": "b",
              "text": "Удалить hover-эффект вообще",
              "outcome": "Отзывчивость интерфейса (micro-interactions) теряется."
            },
            {
              "id": "c",
              "text": "Увеличивать width и height карточки при наведении",
              "outcome": "Изменение размеров в потоке заставит пересчитываться и дёргаться всю сетку."
            }
          ],
          "correctId": "a",
          "hint": "Какие CSS-свойства анимируются на видеокарте (GPU) и не пересчитывают геометрию соседей?",
          "winRule": "Используйте `transform: translateY()` и `box-shadow` + `transition` на `:hover` вместо изменения border/padding/width — анимация будет 60 FPS без скачков."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: Финальный чекап карточки перед заливкой на GitHub Pages. Найди единственный критический баг в разметке!",
          "artifactTitle": "product-card.html — Audit",
          "items": [
            {
              "id": "r1",
              "code": "<img src=\"assets/sneakers.webp\" width=\"400\" height=\"300\" alt=\"Беговые кроссовки\">",
              "label": "Сжатое WebP фото с размерами и alt"
            },
            {
              "id": "r2",
              "code": "<a onclick=\"addToCart()\">В корзину</a>",
              "label": "Кнопка добавления товара в корзину без href"
            },
            {
              "id": "r3",
              "code": "<span class=\"price\">12 990 ₽</span>",
              "label": "Ценник карточки"
            },
            {
              "id": "r4",
              "code": ".card { display: flex; flex-direction: column; gap: 12px; }",
              "label": "Вертикальный Flexbox внутри карточки"
            }
          ],
          "defectId": "r2",
          "fixedCode": "<button type=\"button\" class=\"add-cart-btn\">В корзину</button>",
          "hint": "Тег `<a>` без `href` для JS-действия — семантическая ошибка и баг клавиатурной навигации!",
          "winRule": "Для действий на странице (корзина, лайк, модалка) всегда используется `<button type=\"button\">`, а `<a>` — только для переходов по `href`.",
          "failReasons": {
            "r1": "WebP + width/height + alt — образцовая оптимизация (zero CLS).",
            "r3": "Ценник оформлен аккуратно.",
            "r4": "Вертикальный flex с gap: 12px отлично держит внутренние отступы."
          }
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 3: Финальная полировка карточки в Figma & CSS перед релизом: 72 ppi WebP фото шириной 800 px для ретины, Display = flex и gap = 16 px.",
          "previewType": "flexbox",
          "controls": [
            {
              "id": "display",
              "kind": "pills",
              "label": "display контейнера",
              "options": [
                "block",
                "flex"
              ],
              "init": "block",
              "targetVal": "flex"
            },
            {
              "id": "justify",
              "kind": "pills",
              "label": "justify-content (футер карточки)",
              "options": [
                "flex-start",
                "space-between"
              ],
              "init": "flex-start",
              "targetVal": "space-between"
            },
            {
              "id": "align",
              "kind": "pills",
              "label": "align-items",
              "options": [
                "stretch",
                "center"
              ],
              "init": "stretch",
              "targetVal": "center"
            },
            {
              "id": "gap",
              "kind": "range",
              "label": "gap",
              "min": 4,
              "max": 28,
              "step": 4,
              "init": 4,
              "unit": "px",
              "targetMin": 16,
              "targetMax": 16
            }
          ],
          "hint": "Разнеси цену слева и кнопку справа через space-between, выровняй по вертикальному центру и задай gap 16px.",
          "winRule": "Идеальная сдача цикла: семантический HTML + лёгкий WebP + 8px-ритм + плавный Flexbox!"
        }
      ]
    },
    "11": {
      "title": "Адаптивная вёрстка @media и Mobile-First",
      "instrument": "Responsive Layout Lab",
      "mechanic": "code_or_formula_builder",
      "badge": "IT / Адаптивность",
      "brief": "Перестраивай десктопный ряд карточек под экран смартфона 360px без горизонтальной прокрутки.",
      "rounds": [
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 1: Собери правильное CSS-правило с медиа-запросом, которое перестраивает карточки в вертикальную колонку на экранах до 768px.",
          "chips": [
            {
              "id": "mq1",
              "text": "@media (max-width: 768px) {"
            },
            {
              "id": "mq2",
              "text": ".cards-grid { flex-direction: column; }"
            },
            {
              "id": "mq3",
              "text": ".card { width: 100%; }"
            },
            {
              "id": "mq4",
              "text": "}"
            },
            {
              "id": "mq_bad",
              "text": "body { min-width: 1200px; }"
            }
          ],
          "correctOrder": [
            "mq1",
            "mq2",
            "mq3",
            "mq4"
          ],
          "hint": "Сначала открываем @media (max-width: 768px) {, внутри меняем flex-direction на column и растягиваем карточку до 100%, затем закрываем скобку.",
          "winRule": "Медиа-запрос с max-width: 768px активирует flex-direction: column и width: 100% только на узких экранах, убирая горизонтальный скролл."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Настрой макет смартфона (360px) в DevTools: включи корректный viewport-режим, установи точку перелома (breakpoint) 768px и безопасный боковой отступ 16px.",
          "previewType": "generic",
          "controls": [
            {
              "id": "vp",
              "kind": "pills",
              "label": "Мета-тег viewport в head",
              "options": [
                "Без meta viewport",
                "width=device-width initial-scale=1"
              ],
              "init": "Без meta viewport",
              "targetVal": "width=device-width initial-scale=1"
            },
            {
              "id": "bp",
              "kind": "range",
              "label": "Breakpoint @media max-width",
              "min": 480,
              "max": 1200,
              "step": 48,
              "init": 1200,
              "unit": "px",
              "targetMin": 720,
              "targetMax": 816
            },
            {
              "id": "pad",
              "kind": "range",
              "label": "Внешний боковой padding",
              "min": 0,
              "max": 48,
              "step": 8,
              "init": 0,
              "unit": "px",
              "targetMin": 16,
              "targetMax": 24
            }
          ],
          "hint": "Без meta name=viewport смартфон масштабирует страницу как десктоп 980px! Точка перелома для планшетов/телефонов — около 768px, отступы 16–24px.",
          "winRule": "width=device-width сообщает браузеру реальную ширину экрана, а @media (max-width: 768px) с отступами 16–24px даёт читаемый мобильный интерфейс.",
          "failRule": "Проверьте meta viewport и убедитесь, что breakpoint выставлен около 768px с безопасными боковыми полями."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: В мобильной версии 360px появился горизонтальный скролл на +140px. Найди строку CSS, которая ломает адаптивность!",
          "artifactTitle": "styles/responsive.css — отчёт DevTools",
          "items": [
            {
              "id": "rw1",
              "code": "* { box-sizing: border-box; }",
              "label": "Учёт padding и border внутри ширины"
            },
            {
              "id": "rw2",
              "code": "img { max-width: 100%; height: auto; }",
              "label": "Гибкое масштабирование картинок"
            },
            {
              "id": "rw3",
              "code": ".hero-card { width: 500px; flex-shrink: 0; }",
              "label": "Фиксированная ширина карточки героя"
            },
            {
              "id": "rw4",
              "code": "@media (max-width: 768px) { .nav { flex-wrap: wrap; } }",
              "label": "Перенос пунктов меню на малом экране"
            }
          ],
          "defectId": "rw3",
          "fixedCode": ".hero-card { width: 100%; max-width: 500px; }",
          "hint": "Какой элемент жёстко требует 500px ширины даже внутри экрана 360px?",
          "winRule": "Жёсткая ширина width: 500px выталкивает макет за пределы 360px. Используйте связку width: 100%; max-width: 500px!",
          "failReasons": {
            "rw1": "box-sizing: border-box наоборот предотвращает раздувание блоков от padding.",
            "rw2": "max-width: 100% удерживает картинки внутри контейнера.",
            "rw4": "flex-wrap: wrap помогает меню аккуратно переноситься на новую строку."
          }
        }
      ]
    },
    "12": {
      "title": "Дипломный релиз: Семантика, Lighthouse и GitHub Pages",
      "instrument": "Release QA Gate",
      "mechanic": "triage_radar",
      "badge": "IT / Выпускной проект",
      "brief": "Собери каркас диплома (<header>/<main>/<footer>), пройди аудит Lighthouse и опубликуй сайт.",
      "rounds": [
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 1: Проверь дипломный лендинг по стандартам приёмки перед защитой — отдели готовые практики от релизных блокеров!",
          "bins": [
            {
              "id": "ship",
              "label": "Готово к деплою (PRO)",
              "color": "emerald"
            },
            {
              "id": "block",
              "label": "Блокер защиты (Исправить)",
              "color": "rose"
            }
          ],
          "cards": [
            {
              "tag": "Семантика",
              "specimen": "Каркас <header>, <nav>, <main> и <footer> с одним <h1>",
              "context": "Чёткая иерархия для скринридеров и SEO",
              "targetBin": "ship",
              "rule": "Семантический скелет верхнего уровня обязателен для Lighthouse Accessibility и SEO."
            },
            {
              "tag": "Точка входа",
              "specimen": "Главный файл назван glavnoe-okno.html без index.html в корне",
              "context": "Публикация статического сайта на GitHub Pages",
              "targetBin": "block",
              "rule": "GitHub Pages и веб-серверы открывают по умолчанию только index.html в корне."
            },
            {
              "tag": "Производительность",
              "specimen": "Сжатые изображения WebP + атрибут alt и проверенный фокус с клавиатуры",
              "context": "Результаты Google Lighthouse ≥ 90",
              "targetBin": "ship",
              "rule": "Оптимизированная графика и alt-описания ускоряют загрузку и повышают доступность."
            },
            {
              "tag": "Регрессия JS",
              "specimen": "Кнопка записи не реагирует на клик, в Console 3 Uncaught TypeError",
              "context": "Проверка перед показом комиссии",
              "targetBin": "block",
              "rule": "Ошибки в Console и мёртвые CTA-кнопки полностью блокируют защиту проекта."
            }
          ],
          "hint": "Где без index.html или без работающего JS проект вообще не откроется/не сработает, а где соблюдены стандарты HTML5 и Lighthouse?",
          "winRule": "Диплом допускается к защите только с index.html в корне, чистой консолью, рабочей семантикой и живыми обработчиками событий."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "QA-905",
          "speaker": "Председатель комиссии",
          "telemetry": [
            {
              "label": "Accessibility",
              "val": "62/100",
              "bad": true
            },
            {
              "label": "Lighthouse SEO",
              "val": "70/100",
              "bad": true
            }
          ],
          "prompt": "Раунд 2: Перед защитой отчёт Google Lighthouse показал низкий балл Accessibility (62/100) и SEO (70/100). Выбери решение!",
          "situation": "Аудит Chrome DevTools -> Lighthouse на дипломном лендинге студента АМК выявил просадку Accessibility и SEO.",
          "choices": [
            {
              "id": "lh_alt",
              "text": "Добавить осмысленные alt у картинок, aria-label для иконочных кнопок и контрастный текст",
              "outcome": "Lighthouse Accessibility взлетел до 98/100! Читаемость и навигация с клавиатуры подтверждены."
            },
            {
              "id": "lh_hide",
              "text": "Закрыть DevTools, чтобы комиссия смотрела только на десктопе без аудита",
              "outcome": "Комиссия сама открывает Lighthouse на защите и видит провал по доступности."
            },
            {
              "id": "lh_div",
              "text": "Заменить все <header>, <button> и <a> на обычные <div> с onclick",
              "outcome": "Это ломает навигацию с Tab и ещё сильнее обрушивает Accessibility и SEO."
            }
          ],
          "correctId": "lh_alt",
          "hint": "Что напрямую проверяет Lighthouse Accessibility: контраст, альтернативный текст alt и доступные подписи кнопок?",
          "winRule": "Качественный alt-текст, семантические <button>/<a>, достаточный контраст и видимый :focus-visible поднимают Accessibility до 95–100."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери правильный алгоритм финального релиза дипломного проекта на GitHub Pages!",
          "chips": [
            {
              "id": "gh1",
              "text": "Проверить вёрстку в 360px/1440px и ноль ошибок в DevTools Console"
            },
            {
              "id": "gh2",
              "text": "Убедиться, что стартовая страница в корне называется index.html"
            },
            {
              "id": "gh3",
              "text": "Зафиксировать и отправить код: git add . -> git commit -> git push"
            },
            {
              "id": "gh4",
              "text": "Включить GitHub Pages (Deploy from branch main) и проверить живой URL"
            }
          ],
          "correctOrder": [
            "gh1",
            "gh2",
            "gh3",
            "gh4"
          ],
          "hint": "Сначала локальный аудит и имя index.html, затем git push и финальная проверка опубликованной ссылки.",
          "winRule": "Надёжный релиз идёт по цепочке: локальный QA -> корректный index.html -> git push -> проверка прод-URL на GitHub Pages."
        }
      ]
    },
    "13": {
      "title": "Тренажёр: CSS Grid Layout: двумерные сетки, grid-template-areas и ад",
      "instrument": "CSS Grid",
      "mechanic": "workshop_quest",
      "badge": "IT / Урок 13",
      "brief": "Проектирование сложных двумерных макетов дашбордов и каталогов с помощью CSS Grid, fr-единиц и minmax().",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-131",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 13/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «CSS Grid Layout: двумерные сетки, grid-template-areas и адаптивные карточки»: Какая единица измерения в CSS Grid распределяет свободное пространство пропорционально?",
          "choices": [
            {
              "id": "a",
              "text": "fr",
              "outcome": "Единица fr (fraction) делит доступное пространство контейнера на доли."
            },
            {
              "id": "b",
              "text": "em",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "vw",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "pt",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Единица fr (fraction) делит доступное пространство контейнера на доли.",
          "winRule": "Отлично! Примените правило: Единица fr (fraction) делит доступное пространство контейнера на доли."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «CSS Grid Layout: двумерные сетки, grid-template-areas и адаптивные карточки».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (CSS Grid)"
            },
            {
              "id": "s2",
              "text": "2. Использован display: grid"
            },
            {
              "id": "s3",
              "text": "3. Применена функция repeat(auto-fit, minmax(...))"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Задан отступ gap"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-133",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "CSS Grid",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какая конструкция создаёт адаптивную сетку карточек не уже 260px?",
          "choices": [
            {
              "id": "a",
              "text": "repeat(auto-fit, minmax(260px, 1fr))",
              "outcome": "repeat(auto-fit, minmax(260px, 1fr)) автоматически подбирает число колонок."
            },
            {
              "id": "b",
              "text": "flex-wrap: 260px",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "grid-auto: 260px",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "columns: auto 260px",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "repeat(auto-fit, minmax(260px, 1fr)) автоматически подбирает число колонок.",
          "winRule": "Зачёт по модулю №13 подтверждён!"
        }
      ]
    },
    "14": {
      "title": "Тренажёр: CSS-анимации, переходы (@keyframes, transition) и аппаратн",
      "instrument": "CSS3 Transitions",
      "mechanic": "workshop_quest",
      "badge": "IT / Урок 14",
      "brief": "Создание плавных 60fps микровзаимодействий, ключевых кадров @keyframes и учёт prefers-reduced-motion.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-141",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 14/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «CSS-анимации, переходы (@keyframes, transition) и аппаратное ускорение GPU»: Какие два CSS-свойства анимируются на GPU без пересчёта макета (Reflow)?",
          "choices": [
            {
              "id": "a",
              "text": "transform и opacity",
              "outcome": "transform и opacity обрабатываются на уровне композитинга GPU."
            },
            {
              "id": "b",
              "text": "width и margin",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "top и left",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "padding и border",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "transform и opacity обрабатываются на уровне композитинга GPU.",
          "winRule": "Отлично! Примените правило: transform и opacity обрабатываются на уровне композитинга GPU."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «CSS-анимации, переходы (@keyframes, transition) и аппаратное ускорение GPU».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (CSS3 Transitions)"
            },
            {
              "id": "s2",
              "text": "2. Объявлен блок @keyframes"
            },
            {
              "id": "s3",
              "text": "3. Использовано свойство transform"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Задан плавный transition"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-143",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "CSS3 Transitions",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какое правило задаёт ключевые кадры многошаговой анимации?",
          "choices": [
            {
              "id": "a",
              "text": "@keyframes",
              "outcome": "@keyframes определяет промежуточные состояния анимации."
            },
            {
              "id": "b",
              "text": "@transition",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "@frames",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "@animate",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "@keyframes определяет промежуточные состояния анимации.",
          "winRule": "Зачёт по модулю №14 подтверждён!"
        }
      ]
    },
    "15": {
      "title": "Тренажёр: JavaScript ES6+: работа с массивами, объектами и шаблонами",
      "instrument": "JavaScript ES6+",
      "mechanic": "workshop_quest",
      "badge": "IT / Урок 15",
      "brief": "Функциональная обработка данных каталога и списков студентов без мутации исходных массивов.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-151",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 15/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «JavaScript ES6+: работа с массивами, объектами и шаблонами (map, filter, destructuring)»: Какой метод массива возвращает новый массив той же длины с преобразованными элементами?",
          "choices": [
            {
              "id": "a",
              "text": "map()",
              "outcome": "map() всегда возвращает новый массив той же длины."
            },
            {
              "id": "b",
              "text": "filter()",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "forEach()",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "find()",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "map() всегда возвращает новый массив той же длины.",
          "winRule": "Отлично! Примените правило: map() всегда возвращает новый массив той же длины."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «JavaScript ES6+: работа с массивами, объектами и шаблонами (map, filter, destructuring)».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (JavaScript ES6+)"
            },
            {
              "id": "s2",
              "text": "2. Использован метод .filter()"
            },
            {
              "id": "s3",
              "text": "3. Использован метод .map()"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Применены стрелочные функции ES6"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-153",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "JavaScript ES6+",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Что вернёт [10, 20, 30].filter(x => x > 15)?",
          "choices": [
            {
              "id": "a",
              "text": "[20, 30]",
              "outcome": "filter оставляет элементы, для которых предикат вернул true."
            },
            {
              "id": "b",
              "text": "[10]",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "true",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "50",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "filter оставляет элементы, для которых предикат вернул true.",
          "winRule": "Зачёт по модулю №15 подтверждён!"
        }
      ]
    },
    "16": {
      "title": "Тренажёр: Асинхронный JavaScript: Fetch API, JSON, async/await и обр",
      "instrument": "Fetch API",
      "mechanic": "workshop_quest",
      "badge": "IT / Урок 16",
      "brief": "Загрузка реальных данных с бэкенда Flask через fetch(), парсинг JSON и перехват сетевых ошибок в try/catch.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-161",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 16/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Асинхронный JavaScript: Fetch API, JSON, async/await и обработка ошибок»: Что проверяет свойство response.ok в Fetch API?",
          "choices": [
            {
              "id": "a",
              "text": "Успешный HTTP-статус (200–299)",
              "outcome": "fetch не выбрасывает ошибку при 404/500 — нужно проверять response.ok."
            },
            {
              "id": "b",
              "text": "Скорость интернета",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Валидность JSON",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Наличие cookie",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "fetch не выбрасывает ошибку при 404/500 — нужно проверять response.ok.",
          "winRule": "Отлично! Примените правило: fetch не выбрасывает ошибку при 404/500 — нужно проверять response.ok."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Асинхронный JavaScript: Fetch API, JSON, async/await и обработка ошибок».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Fetch API)"
            },
            {
              "id": "s2",
              "text": "2. Объявлена async function"
            },
            {
              "id": "s3",
              "text": "3. Вызван await fetch(...)"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Проверено res.ok и вызван res.json()"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-163",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Fetch API",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой метод преобразует тело ответа в JavaScript-объект?",
          "choices": [
            {
              "id": "a",
              "text": "await res.json()",
              "outcome": "Метод res.json() асинхронно читает и парсит JSON."
            },
            {
              "id": "b",
              "text": "JSON.stringify(res)",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "res.toObject()",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "res.parse()",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Метод res.json() асинхронно читает и парсит JSON.",
          "winRule": "Зачёт по модулю №16 подтверждён!"
        }
      ]
    },
    "17": {
      "title": "Тренажёр: Web-безопасность: защита от XSS (escapeHtml), CSRF и безоп",
      "instrument": "OWASP Top 10",
      "mechanic": "workshop_quest",
      "badge": "IT / Урок 17",
      "brief": "Предотвращение Stored/Reflected XSS-атак при выводе пользовательских данных в интерфейсах LMS.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-171",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 17/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Web-безопасность: защита от XSS (escapeHtml), CSRF и безопасная работа с DOM»: Какое свойство DOM безопасно вставляет текст без интерпретации HTML-тегов?",
          "choices": [
            {
              "id": "a",
              "text": "textContent",
              "outcome": "textContent трактует любые символы как обычный текст."
            },
            {
              "id": "b",
              "text": "innerHTML",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "outerHTML",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "insertAdjacentHTML",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "textContent трактует любые символы как обычный текст.",
          "winRule": "Отлично! Примените правило: textContent трактует любые символы как обычный текст."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Web-безопасность: защита от XSS (escapeHtml), CSRF и безопасная работа с DOM».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (OWASP Top 10)"
            },
            {
              "id": "s2",
              "text": "2. Реализована замена < на &lt; и > на &gt;"
            },
            {
              "id": "s3",
              "text": "3. Экранирован символ &"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Использовано безопасное экранирование перед выводом"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-173",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "OWASP Top 10",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой символ нужно экранировать в первую очередь, чтобы закрыть HTML-теги?",
          "choices": [
            {
              "id": "a",
              "text": "< и >",
              "outcome": "Замена < на &lt; и > на &gt; не даёт браузеру создать тег."
            },
            {
              "id": "b",
              "text": "$ и %",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "# и @",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "+ и =",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Замена < на &lt; и > на &gt; не даёт браузеру создать тег.",
          "winRule": "Зачёт по модулю №17 подтверждён!"
        }
      ]
    },
    "18": {
      "title": "Тренажёр: Основы WebGL и 3D в браузере: Three.js (Scene, Camera, Mes",
      "instrument": "Three.js",
      "mechanic": "workshop_quest",
      "badge": "IT / Урок 18",
      "brief": "Создание интерактивной 3D-сцены в браузере: геометрия, PBR-материалы, освещение и цикл анимации requestAnimationFrame.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-181",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 18/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Основы WebGL и 3D в браузере: Three.js (Scene, Camera, Mesh, Light)»: Из каких двух компонентов создаётся THREE.Mesh?",
          "choices": [
            {
              "id": "a",
              "text": "Geometry и Material",
              "outcome": "Mesh объединяет форму (Geometry) и внешний вид (Material)."
            },
            {
              "id": "b",
              "text": "Scene и Camera",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Light и Canvas",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Vector и Matrix",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Mesh объединяет форму (Geometry) и внешний вид (Material).",
          "winRule": "Отлично! Примените правило: Mesh объединяет форму (Geometry) и внешний вид (Material)."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Основы WebGL и 3D в браузере: Three.js (Scene, Camera, Mesh, Light)».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Three.js)"
            },
            {
              "id": "s2",
              "text": "2. Созданы Scene и PerspectiveCamera"
            },
            {
              "id": "s3",
              "text": "3. Создан Mesh из BoxGeometry и MeshStandardMaterial"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Реализован цикл requestAnimationFrame"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-183",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Three.js",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой тип материала реагирует на источники света и тени?",
          "choices": [
            {
              "id": "a",
              "text": "MeshStandardMaterial",
              "outcome": "MeshStandardMaterial поддерживает физически корректное освещение (PBR)."
            },
            {
              "id": "b",
              "text": "MeshBasicMaterial",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "LineBasicMaterial",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "SpriteMaterial",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "MeshStandardMaterial поддерживает физически корректное освещение (PBR).",
          "winRule": "Зачёт по модулю №18 подтверждён!"
        }
      ]
    },
    "19": {
      "title": "Тренажёр: Backend-интеграция: Flask REST API, SQLite/PostgreSQL и ва",
      "instrument": "Python 3.12",
      "mechanic": "workshop_quest",
      "badge": "IT / Урок 19",
      "brief": "Проектирование защищённых серверных маршрутов, параметризованных SQL-запросов и возврат корректных HTTP-кодов.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-191",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 19/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Backend-интеграция: Flask REST API, SQLite/PostgreSQL и валидация данных»: Как правильно передавать параметры в SQL-запрос в Python?",
          "choices": [
            {
              "id": "a",
              "text": "Через плейсхолдеры ? и кортеж параметров",
              "outcome": "Параметризованные запросы полностью исключают SQL-инъекции."
            },
            {
              "id": "b",
              "text": "Через f-строки f'WHERE id={id}'",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Через конкатенацию +",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Через base64",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Параметризованные запросы полностью исключают SQL-инъекции.",
          "winRule": "Отлично! Примените правило: Параметризованные запросы полностью исключают SQL-инъекции."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Backend-интеграция: Flask REST API, SQLite/PostgreSQL и валидация данных».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Python 3.12)"
            },
            {
              "id": "s2",
              "text": "2. Использован декоратор @app.route с POST"
            },
            {
              "id": "s3",
              "text": "3. Вызван request.get_json()"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Использован параметризованный SQL с ?"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-193",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Python 3.12",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой HTTP-статус возвращается при нехватке прав роли (например, студент открыл админку)?",
          "choices": [
            {
              "id": "a",
              "text": "403 Forbidden",
              "outcome": "403 означает, что пользователь авторизован, но доступ запрещён."
            },
            {
              "id": "b",
              "text": "200 OK",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "404 Not Found",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "500 Server Error",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "403 означает, что пользователь авторизован, но доступ запрещён.",
          "winRule": "Зачёт по модулю №19 подтверждён!"
        }
      ]
    },
    "20": {
      "title": "Тренажёр: Выпускная квалификационная защита: Full-Stack Web-сервис с",
      "instrument": "HTML5",
      "mechanic": "workshop_quest",
      "badge": "IT / Урок 20",
      "brief": "Итоговая аттестация: объединение адаптивного фронтенда, анимаций, 3D-витрины и защищённого REST API в единый продукт.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-201",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 20/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Выпускная квалификационная защита: Full-Stack Web-сервис с 3D-превью и API»: Что обязательно должно выполняться перед публикацией проекта в продакшен?",
          "choices": [
            {
              "id": "a",
              "text": "Проверка безопасности (XSS/SQLi), адаптивности и статус-кодов API",
              "outcome": "Комплексный QA-аудит гарантирует надёжность и безопасность."
            },
            {
              "id": "b",
              "text": "Отключение HTTPS",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Удаление try/catch",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Хранение паролей в открытом виде",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Комплексный QA-аудит гарантирует надёжность и безопасность.",
          "winRule": "Отлично! Примените правило: Комплексный QA-аудит гарантирует надёжность и безопасность."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Выпускная квалификационная защита: Full-Stack Web-сервис с 3D-превью и API».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (HTML5)"
            },
            {
              "id": "s2",
              "text": "2. Указана адаптивная сетка CSS Grid"
            },
            {
              "id": "s3",
              "text": "3. Описан асинхронный fetch() к API"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Упомянуты меры безопасности XSS и SQLi"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "IT-203",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "HTML5",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Экзамен",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой инструмент проверяет отсутствие горизонтального скролла на мобильных экранах?",
          "choices": [
            {
              "id": "a",
              "text": "DevTools Device Toolbar (375px)",
              "outcome": "Эмуляция мобильных вьюпортов 375px и 390px выявляет переполнения."
            },
            {
              "id": "b",
              "text": "Notepad",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Ping",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "FTP",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Эмуляция мобильных вьюпортов 375px и 390px выявляет переполнения.",
          "winRule": "Зачёт по модулю №20 подтверждён!"
        }
      ]
    }
  },
  "graphic_design": {
    "1": {
      "title": "Композиция, правило третей и воздух",
      "instrument": "Artboard Layout Lab",
      "mechanic": "bench_tuner",
      "badge": "Дизайн / Композиция",
      "brief": "Сбалансируй афишу: выстрой контраст размеров H1:body, правило третей и достаточные поля.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: Настрой иерархию плаката: заголовок H1 в 3 раза крупнее текста (48-60pt при тексте 16pt), поля от края (Margin) минимум 40mm и 35-45% свободного воздуха.",
          "previewType": "generic",
          "controls": [
            {
              "id": "h1",
              "kind": "range",
              "label": "Кегль заголовка H1 (при body 16pt)",
              "min": 18,
              "max": 72,
              "step": 6,
              "init": 18,
              "unit": "pt",
              "targetMin": 48,
              "targetMax": 60
            },
            {
              "id": "margin",
              "kind": "range",
              "label": "Безопасные поля листа",
              "min": 5,
              "max": 60,
              "step": 5,
              "init": 10,
              "unit": "mm",
              "targetMin": 40,
              "targetMax": 50
            },
            {
              "id": "grid",
              "kind": "pills",
              "label": "Точка фокуса",
              "options": [
                "Случайно в углу",
                "Правило третей (1/3)"
              ],
              "init": "Случайно в углу",
              "targetVal": "Правило третей (1/3)"
            }
          ],
          "hint": "Если заголовок чуть больше текста (18pt против 16pt), взгляд зрителя не понимает, что читать первым!",
          "winRule": "Контраст масштаба (H1 >= 3x текста), просторные поля и фокус на пересечении третей сразу делают макет дорогим и читаемым.",
          "failRule": "Мелкие поля 10мм и слабый контраст кеглей превращают афишу в хаотичную листовку."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: Рекламный баннер ресторана выглядит «душным и дешёвым». Инспектируй макет и укажи главный композиционный брак!",
          "artifactTitle": "cafe-poster.ai — Layout Audit",
          "items": [
            {
              "id": "g1",
              "code": "Alignment: Left-aligned grid columns",
              "label": "Выравнивание текстового блока"
            },
            {
              "id": "g2",
              "code": "Fill Density: 95% (текст на каждой пустой щели)",
              "label": "Плотность заполнения холста элементами"
            },
            {
              "id": "g3",
              "code": "Visual Center: Optical alignment +5% higher",
              "label": "Коррекция оптического центра логотипа"
            },
            {
              "id": "g4",
              "code": "Accent Color: Single warm terracotta #D97706",
              "label": "Выбор одного акцентного цвета"
            }
          ],
          "defectId": "g2",
          "fixedCode": "Negative Space >= 30-40% (Воздух вокруг главного оффера)",
          "hint": "Попытка забить 95% площади стикерами, тенями и текстом убивает саму возможность прочитать главное предложение!",
          "winRule": "Негативное пространство («воздух») — активный элемент дизайна: оставляйте минимум 30% холста чистым вокруг ключевого объекта.",
          "failReasons": {
            "g1": "Единое левое выравнивание задаёт чёткую силовую линию для взгляда.",
            "g3": "Поднятие элемента на ~5% над геометрическим центром — грамотный оптический приём.",
            "g4": "Один главный акцентный цвет отлично фокусирует внимание."
          }
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Распредели композиционные приёмы: что даёт порядок (Визуальная иерархия), а что создаёт визуальный шум!",
          "bins": [
            {
              "id": "order",
              "label": "✓ Сильная композиция",
              "color": "emerald"
            },
            {
              "id": "noise",
              "label": "✗ Визуальный шум",
              "color": "rose"
            }
          ],
          "cards": [
            {
              "tag": "Группировка",
              "specimen": "Заголовок + подпись на расстоянии 6px (Правило близости)",
              "context": "А соседняя секция отделена на 48px",
              "targetBin": "order",
              "rule": "Правило близости: связанные элементы стоят ближе друг к другу, чем к чужим группам."
            },
            {
              "tag": "Выравнивание",
              "specimen": "Заголовок по центру, текст слева, цена справа лесенкой",
              "context": "Ни одной общей вертикальной оси",
              "targetBin": "noise",
              "rule": "Смешение хаотичных осей выравнивания разрушает модульность страницы."
            },
            {
              "tag": "Фокус",
              "specimen": "Один крупный герой макета (60% веса) + второстепенные сноски",
              "context": "Чёткий путь взгляда сверху вниз",
              "targetBin": "order",
              "rule": "В хорошем макете всегда есть один главный герой, а не три равных конкурента."
            }
          ],
          "hint": "Ищи правило близости, единые оси выравнивания и одного явного лидера композиции.",
          "winRule": "Близость, единство осей, контраст масштаба и воздух превращают набор элементов в профессиональный дизайн."
        }
      ]
    },
    "2": {
      "title": "RGB, CMYK и Цветопрофили печати",
      "instrument": "Prepress Color Analyzer",
      "mechanic": "defect_inspector",
      "badge": "Дизайн / RGB vs CMYK",
      "brief": "Перестань терять яркость при печати: разберись с цветовым охватом CMYK, ICC-профилями и Pantone.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: Тираж визиток вернулся с мутным серым оттенком вместо ярко-салатового с экрана. Найди критический косяк в файле, отправленном в типографию!",
          "artifactTitle": "vizitka-print-v1.pdf — Color Setup",
          "items": [
            {
              "id": "c1",
              "code": "Bleed Area: 2.0 mm all around",
              "label": "Вылеты под обрезку"
            },
            {
              "id": "c2",
              "code": "Color Mode: sRGB Neon #00FF66 (без конверсии)",
              "label": "Цветовой режим макета для офсетной печати"
            },
            {
              "id": "c3",
              "code": "Fonts: All converted to Outlines",
              "label": "Шрифты переведены в кривые"
            },
            {
              "id": "c4",
              "code": "Resolution: 300 dpi",
              "label": "Плотность растровой подложки"
            }
          ],
          "defectId": "c2",
          "fixedCode": "Color Mode: CMYK (FOGRA39) + Pantone 802C для чистого неона",
          "hint": "Экран светит RGB, а типографская машина смешивает краски CMYK, которые не умеют светиться кислотным неоном!",
          "winRule": "Перед сдачей в печать макет обязательно переводят в CMYK (обычно FOGRA39) с ручной коррекцией выпавших из охвата оттенков, а неон берут по вееру Pantone.",
          "failReasons": {
            "c1": "Вылеты 2-3 мм обязательны для качественного реза визиток.",
            "c3": "Кривые шрифты избавляют от сбоя гарнитуры в типографии.",
            "c4": "300 dpi — стандарт офсетной и цифровой печати."
          }
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 2: На оттиске глубокий тёмный фон «размазался» краской и не высох вовремя (отмарывание). Промерь пипеткой (Separations Preview) плотность красок TIL!",
          "meterName": "INK COVERAGE METER",
          "normalSpec": "Максимум суммы красок TIL для мелованной бумаги: ≤ 300%",
          "points": [
            {
              "id": "k1",
              "name": "Белая плашка лого",
              "pin": "Zone A",
              "reading": "0/0/0/0 (0%)",
              "unit": "",
              "meterNote": "Чистая бумага, краска отсутствует."
            },
            {
              "id": "k2",
              "name": "Тени фона (Registration Black)",
              "pin": "Zone B",
              "reading": "C100 M100 Y100 K100 (400%)",
              "unit": "",
              "meterNote": "400% суммы красок! Бумага буквально промокает и смазывает листы в стопе."
            },
            {
              "id": "k3",
              "name": "Акцентный красный",
              "pin": "Zone C",
              "reading": "C0 M95 Y90 K0 (185%)",
              "unit": "",
              "meterNote": "Чистый оранжево-красный в пределах 185% сохнет мгновенно."
            },
            {
              "id": "k4",
              "name": "Основной текст 10pt",
              "pin": "Zone D",
              "reading": "C0 M0 Y0 K100 (100%)",
              "unit": "",
              "meterNote": "Чистый 100% чёрный — идеальная чёткость мелкого текста."
            }
          ],
          "faultId": "k2",
          "hint": "Сумма всех четырёх каналов (C+M+Y+K) не должна превышать 300% (а для газет 240%)!",
          "winRule": "Никогда не используйте Registration (C100 M100 Y100 K100 = 400%) для фона! Составной глубокий чёрный должен быть около C40 M30 Y30 K100 (200%)."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "CLR-202",
          "speaker": "Менеджер бренда «Аква»",
          "telemetry": [
            {
              "label": "Цвет бренда",
              "val": "Ярко-бирюзовый",
              "bad": false
            },
            {
              "label": "Материал",
              "val": "10 000 пакетов",
              "bad": false
            }
          ],
          "situation": "Заказчик требует, чтобы фирменный бирюзовый цвет был строго одинаковым на всех 10 000 бумажных пакетах вне зависимости от принтера. Что заложить в техтребования?",
          "choices": [
            {
              "id": "a",
              "text": "Отправить RGB-код и попросить печатника «подобрать на глаз»",
              "outcome": "Оттенок уплывёт в каждом новом тираже."
            },
            {
              "id": "b",
              "text": "Зафиксировать плашечный цвет Pantone Solid Coated (например 326 C) как смесевую краску",
              "outcome": "Точно! Pantone гарантирует эталонный оттенок краски с завода по всему миру."
            },
            {
              "id": "c",
              "text": "Задать 400% CMYK на всякий случай",
              "outcome": "Краска не высохнет и смажет тираж."
            }
          ],
          "correctId": "b",
          "hint": "Какой международный стандарт смесевых красок (веер) гарантирует точное попадание фирменного цвета?",
          "winRule": "Для точного попадания корпоративного цвета на упаковке и пакетах используют стандартные смесевые краски Pantone Spot Color."
        }
      ]
    },
    "3": {
      "title": "Типографика, Кернинг и Интерлиньяж",
      "instrument": "Typography Bench",
      "mechanic": "code_or_formula_builder",
      "badge": "Дизайн / Типографика",
      "brief": "Собирай идеальные шрифтовые пары, рассчитывай интерлиньяж 120–145% и устраняй коридоры.",
      "rounds": [
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 1: Собери безотказный алгоритм вёрстки журнального текстового блока.",
          "chips": [
            {
              "id": "ty1",
              "text": "Подобрать контрастную пару: Serif заголовок + Sans-Serif набор"
            },
            {
              "id": "ty2",
              "text": "Ограничить длину строки 55-75 знаками для лёгкого чтения"
            },
            {
              "id": "ty3",
              "text": "Задать интерлиньяж (Leading) 135-145% от размера кегля"
            },
            {
              "id": "ty4",
              "text": "Включить выключку по ширине в узкой колонке 15 знаков"
            },
            {
              "id": "ty5",
              "text": "Проверить оптический кернинг пар A/V/T в крупном заголовке"
            }
          ],
          "correctOrder": [
            "ty1",
            "ty2",
            "ty3",
            "ty5"
          ],
          "hint": "Сначала шрифтовая пара, затем оптимальная ширина строки (не длиннее 75 символов!), интерлиньяж ~1.4x и финишный кернинг в H1.",
          "winRule": "Золотой треугольник типографики: контрастная пара + длина строки 55-75 знаков + интерлиньяж 120-145%."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Настрой читаемый основной текст сайта: кегль 16-18 px, интерлиньяж 140-150% (примерно 24 px при 16px) и комфортную ширину абзаца 65 знаков.",
          "previewType": "generic",
          "controls": [
            {
              "id": "size",
              "kind": "range",
              "label": "Размер шрифта (Body)",
              "min": 10,
              "max": 24,
              "step": 2,
              "init": 12,
              "unit": "px",
              "targetMin": 16,
              "targetMax": 18
            },
            {
              "id": "lead",
              "kind": "range",
              "label": "Интерлиньяж (%)",
              "min": 95,
              "max": 200,
              "step": 5,
              "init": 100,
              "unit": "%",
              "targetMin": 135,
              "targetMax": 150
            },
            {
              "id": "measure",
              "kind": "range",
              "label": "Ширина колонки (знаков)",
              "min": 25,
              "max": 120,
              "step": 5,
              "init": 110,
              "unit": " ch",
              "targetMin": 55,
              "targetMax": 75
            }
          ],
          "hint": "При интерлиньяже 100% буквы слипаются, а при строке 110 символов глаз теряет следующую строку.",
          "winRule": "Для основного набора в вебе идеальны 16-18px, интерлиньяж ~145% и ширина блока 55-75ch."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: В постере премиальной юридической фирмы заказчик почувствовал «дискомфорт». Найди грубую типографическую ошибку!",
          "artifactTitle": "law-firm-hero.pdf — Font Audit",
          "items": [
            {
              "id": "f1",
              "code": "Heading 1: Playfair Display Bold 56pt",
              "label": "Антиква (Serif) для солидного заголовка"
            },
            {
              "id": "f2",
              "code": "Body Copy: Inter Regular 16pt (Leading 145%)",
              "label": "Чистый гротеск для текста"
            },
            {
              "id": "f3",
              "code": "Narrow Column (3 words/line): Justify All Lines",
              "label": "Выключка по ширине в узкой врезке"
            },
            {
              "id": "f4",
              "code": "Tracking: +4% на КАПСЕ подзаголовка",
              "label": "Лёгкая разрядка прописных букв"
            }
          ],
          "defectId": "f3",
          "fixedCode": "Left Align (выравнивание по левому краю) + перенос слов",
          "hint": "Выключка по ширине в очень узкой колонке рвёт межсловные пробелы огромными дырами («реками» / коридорами).",
          "winRule": "В узких колонках используйте левое выравнивание («флаг»), иначе выключка по ширине создаёт безобразные белые дыры между словами.",
          "failReasons": {
            "f1": "Благородная антиква отлично подходит для юридического премиума.",
            "f2": "Inter с интерлиньяжем 145% отлично читается.",
            "f4": "Лёгкий положительный трекинг (+4%..+10%) обязателен при наборе ПРОПИСНЫМИ (ALL CAPS)."
          }
        }
      ]
    },
    "4": {
      "title": "Illustrator PRO: Безье, Pathfinder и Кривые",
      "instrument": "Illustrator Vector Check",
      "mechanic": "probe_diagnostic",
      "badge": "Дизайн / Illustrator",
      "brief": "Очищай логотипы от незакрытых обводок, проверяй опорные точки Безье и готовь файлы под гравировку.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: Плоттерная резка и типография отклонили исходник .ai с логотипом! Проверь свойства объектов логотипа на скрытый брак.",
          "meterName": "AI VECTOR PRECHECK",
          "normalSpec": "Все контуры замкнуты, обводки раскрыты (Expanded), шрифты в кривых",
          "points": [
            {
              "id": "ai1",
              "name": "Знак (Эмблема)",
              "pin": "Pathfinder -> Unite",
              "reading": "1 замкнутый Compound Path (8 точек)",
              "unit": "",
              "meterNote": "Чистый минималистичный контур без лишних узлов."
            },
            {
              "id": "ai2",
              "name": "Слоган под лого",
              "pin": "Type Object",
              "reading": "Live Editable Font (Montserrat)",
              "unit": "",
              "meterNote": "Живой текстовый слой! Если у плоттера нет шрифта — логотип развалится."
            },
            {
              "id": "ai3",
              "name": "Цветовая модель",
              "pin": "Document Color Mode",
              "reading": "CMYK Coated",
              "unit": "",
              "meterNote": "Печатный режим настроен корректно."
            },
            {
              "id": "ai4",
              "name": "Толщина обводки рамки",
              "pin": "Expanded Fill",
              "reading": "0 pt Stroke / Solid Fill",
              "unit": "",
              "meterNote": "Рамка уже переведена в залитый контур и не собьётся при масштабировании."
            }
          ],
          "faultId": "ai2",
          "hint": "Какой элемент файла требует обязательной команды Create Outlines (Ctrl+Shift+O) перед отправкой подрядчику?",
          "winRule": "Перед сдачей .ai/.eps логотипа переводите все тексты в кривые (`Create Outlines`) и раскрывайте обводки (`Object -> Expand`)."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Как в Illustrator ровно вырезать полумесяц (вычесть маленький круг из большого) и зафиксировать результат?",
          "chips": [
            {
              "id": "b1",
              "text": "Положить вычитаемый круг поверх основного круга"
            },
            {
              "id": "b2",
              "text": "Выделить оба объекта инструментом Selection (V)"
            },
            {
              "id": "b3",
              "text": "Нажать Pathfinder -> Minus Front (Минус верхний)"
            },
            {
              "id": "b4",
              "text": "Сгладить лишние узлы и проверить замыкание контура"
            },
            {
              "id": "b5",
              "text": "Растрировать логотип в 72 dpi"
            }
          ],
          "correctOrder": [
            "b1",
            "b2",
            "b3",
            "b4"
          ],
          "hint": "Команда Minus Front всегда отрезает то, что лежит ВЫШЕ в иерархии слоёв.",
          "winRule": "Булевы операции Pathfinder (`Unite`, `Minus Front`) строят математически чистые формы без наложения маскирующих белых фигур."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: Дизайнер уменьшил значок в 10 раз — и тонкая обводка 4pt неожиданно превратилась в сплошное толстое пятно! Что не так?",
          "artifactTitle": "Scale Settings — icon.ai",
          "items": [
            {
              "id": "s1",
              "code": "Artboard Grid: Vector View",
              "label": "Режим просмотра векторной сетки"
            },
            {
              "id": "s2",
              "code": "Stroke Width: 4pt, Scale Strokes & Effects = OFF",
              "label": "Настройка масштабирования обводки"
            },
            {
              "id": "s3",
              "code": "Anchor Points: Smooth Bezier Handles",
              "label": "Плавность направляющих кривых"
            },
            {
              "id": "s4",
              "code": "Layer Opacity: 100%",
              "label": "Непрозрачность слоя"
            }
          ],
          "defectId": "s2",
          "fixedCode": "Включить 'Scale Strokes & Effects' или сделать Object -> Expand!",
          "hint": "Если флажок пропорционального масштабирования обводок выключен, толщина линии 4pt остаётся прежней на крошечном 10px объекте.",
          "winRule": "Либо держите включённой опцию `Scale Strokes & Effects`, либо переводите финальные обводки в залитые объекты через `Expand`."
        }
      ]
    },
    "5": {
      "title": "Логотип и Правила Брендбука",
      "instrument": "Brandbook Compliance Kit",
      "mechanic": "workshop_quest",
      "badge": "Дизайн / Айдентика",
      "brief": "Защищай чистоту бренда: проектируй масштабируемый знак, охранное поле и монохромную версию.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "BR-505",
          "speaker": "Основатель стартапа Игорь",
          "telemetry": [
            {
              "label": "Фавиконка",
              "val": "16x16 px",
              "bad": true
            },
            {
              "label": "Градиент+фото",
              "val": "35 микродеталей",
              "bad": true
            }
          ],
          "situation": "Заказчик просит нарисовать логотип с 3D-каплей воды, тончайшими тенями и 4-мя строками мелкого текста внутри круга. При уменьшении на фавиконку 16px или ручку он превращается в серое пятно. Как убедить и решить технически?",
          "choices": [
            {
              "id": "a",
              "text": "Включить сглаживание покрупнее и сдать как есть",
              "outcome": "На печати, шевроне и в браузере знак всё равно превратится в грязь."
            },
            {
              "id": "b",
              "text": "Построить упрощённую векторную геометрию (тест на размер 15мм), без мелких деталей + адаптивную монохромную версию",
              "outcome": "Профессионально! Логотип должен мгновенно узнаваться и в цвете, и в 1-красочном штампе 15мм."
            },
            {
              "id": "c",
              "text": "Запретить заказчику делать фавиконки",
              "outcome": "Современный бренд обязан работать от биллборда до иконки 16px."
            }
          ],
          "correctId": "b",
          "hint": "Какой главный тест подтверждает живучесть логотипа на ручках, штампах и в шапке браузера?",
          "winRule": "Сильный логотип работает в 1 цвете (100% чёрно-белый монохром) и остаётся чётким даже при сжатии до 15 мм / 16 px."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 2: Раздел брендбука «Как нельзя использовать знак»: рассортируй макеты подрядчиков!",
          "bins": [
            {
              "id": "ok",
              "label": "✓ По брендбуку",
              "color": "emerald"
            },
            {
              "id": "ban",
              "label": "✗ Запрещено гайдлайном",
              "color": "rose"
            }
          ],
          "cards": [
            {
              "tag": "Охранное поле",
              "specimen": "Отступ 1X вокруг логотипа от заголовка и края листа",
              "context": "Где X — высота строчной буквы/модуля знака",
              "targetBin": "ok",
              "rule": "Охранное поле (Clear Space) защищает знак от визуального слипания с соседним контентом."
            },
            {
              "tag": "Искажение",
              "specimen": "Сплющили знак по вертикали на 30%, чтобы влез в шапку",
              "context": "Непропорциональный ресайз без Shift",
              "targetBin": "ban",
              "rule": "Любое искажение пропорций логотипа — табу номер один в брендбуке."
            },
            {
              "tag": "Тёмный фон",
              "specimen": "Белая выворотка (Negative) поверх тёмного фото",
              "context": "С высокой контрастностью > 4.5:1",
              "targetBin": "ok",
              "rule": "Белая монохромная выворотка из гайдлайна — правильный способ посадки на тёмные фоны."
            }
          ],
          "hint": "Пропорциональность, охранное поле и чёткая выворотка разрешены; сплющивание и наползание текста — под запретом.",
          "winRule": "Брендбук фиксирует охранное поле (Clear Space), минимальный кегль, монохром/выворотку и жёсткие табу на деформацию."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: Типография печатает одноцветный пакет (только 1 краска — чёрная). Найди ошибку в монохромной версии логотипа!",
          "artifactTitle": "logo-mono-1color.eps",
          "items": [
            {
              "id": "m1",
              "code": "Shape Fill: K100 (Spot Black)",
              "label": "Заливка основы логотипа"
            },
            {
              "id": "m2",
              "code": "Accent Wave: Gradient K100 -> K15 + Drop Shadow",
              "label": "Плавный растровый градиент и тень на волне"
            },
            {
              "id": "m3",
              "code": "Clear Space Margin: Equal to X-height",
              "label": "Заданные отступы вокруг знака"
            },
            {
              "id": "m4",
              "code": "Text: Outlined Vector Curves",
              "label": "Векторные кривые шрифта"
            }
          ],
          "defectId": "m2",
          "fixedCode": "Flat Vector Fill: Solid 100% K (без полутоновых теней и градиентов)",
          "hint": "Однокрасочная шелкография, тиснение фольгой и лазерная гравировка не воспроизводят полупрозрачные растровые тени!",
          "winRule": "Чистая монохромная версия логотипа строится без градиентов и теней — только чистыми плашками (100% K / выворотка)."
        }
      ]
    },
    "6": {
      "title": "Многостраничная вёрстка в InDesign",
      "instrument": "InDesign Master Desk",
      "mechanic": "triage_radar",
      "badge": "Дизайн / InDesign",
      "brief": "Автоматизируй журналы и каталоги через Parent Pages, Paragraph Styles и сетку базовых линий.",
      "rounds": [
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 1: Что выносим на Шаблон-страницы (Parent/Master Pages), а что верстаем на живом развороте?",
          "bins": [
            {
              "id": "master",
              "label": "Parent Page (Шаблон)",
              "color": "indigo"
            },
            {
              "id": "spread",
              "label": "Живой разворот (Spread)",
              "color": "amber"
            }
          ],
          "cards": [
            {
              "tag": "Нумерация",
              "specimen": "Авто-колонтитул и маркер текущей страницы [A]",
              "context": "Должен повторяться на всех 64 страницах",
              "targetBin": "master",
              "rule": "Авто-нумерация и постоянные колонтитулы всегда задаются один раз на Parent Page."
            },
            {
              "tag": "Статья",
              "specimen": "Уникальная врезка интервью и 3 фото спикера",
              "context": "Относится только к 14-му развороту",
              "targetBin": "spread",
              "rule": "Уникальный контент конкретной статьи размещают прямо на разворотах документа."
            },
            {
              "tag": "Модули",
              "specimen": "Общие направляющие полей и колонок каталога",
              "context": "Каркас всего издания",
              "targetBin": "master",
              "rule": "Общую сетку разворота задают на Parent Page для визуального единства."
            }
          ],
          "hint": "Всё повторяющееся на десятках страниц — в Parent Pages. Уникальные тексты и фото — на разворотах.",
          "winRule": "Parent Pages экономят часы работы: правка колонтитула в одном месте мгновенно обновляет весь 100-страничный каталог."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: Заказчик прислал свёрстанную брошюру для печати на скрепке (Saddle Stitch). Типография отклонила файл! Найди причину.",
          "artifactTitle": "brochure-2026.indd — Booklet Preflight",
          "items": [
            {
              "id": "id1",
              "code": "Total Pages: 19 pages (Facing Pages)",
              "label": "Общее количество полос в издании"
            },
            {
              "id": "id2",
              "code": "Baseline Grid: 12pt Align Across Columns",
              "label": "Совпадение строк текста на соседних колонках"
            },
            {
              "id": "id3",
              "code": "Paragraph Styles: H1, Lead, BodyText",
              "label": "Единые стили абзацев"
            },
            {
              "id": "id4",
              "code": "Links Status: 0 missing, 300 dpi CMYK",
              "label": "Проверка прилинкованных изображений"
            }
          ],
          "defectId": "id1",
          "fixedCode": "Total Pages: 20 (или 16 / 24) — строго кратно 4 полосам!",
          "hint": "Один согнутый пополам печатный лист на скрепке всегда даёт 4 страницы! Можно ли сложить 19?",
          "winRule": "Брошюра на скобе (сшивке) всегда должна иметь число страниц, кратное 4 (16, 20, 24, 32...), иначе останутся лишние пустые листы.",
          "failReasons": {
            "id2": "Baseline Grid идеально выравнивает строки по горизонтали на всём развороте.",
            "id3": "Paragraph Styles позволяют менять шрифт всего каталога в один клик.",
            "id4": "Все изображения прилинкованы в CMYK 300 dpi без потерь."
          }
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери безошибочный пайплайн упаковки макета InDesign для передачи типографии или коллеге.",
          "chips": [
            {
              "id": "p1",
              "text": "Включить Align to Baseline Grid у основного стиля текста"
            },
            {
              "id": "p2",
              "text": "Проверить панель Preflight (0 ошибок: нет вылетов текста Overset)"
            },
            {
              "id": "p3",
              "text": "Выполнить File -> Package (шрифты + линки + IDML + PDF/X)"
            },
            {
              "id": "p4",
              "text": "Скопировать один .indd файл на флешку без папки Links"
            }
          ],
          "correctOrder": [
            "p1",
            "p2",
            "p3"
          ],
          "hint": "Без привязанных картинок (Links) один файл .indd откроется с мутными превью.",
          "winRule": "Команда `File -> Package` собирает всё в одну папку: шрифты, ссылки Links, совместимый IDML и печатный PDF."
        }
      ]
    },
    "7": {
      "title": "Photoshop для Дизайна: Маски и Смарт-объекты",
      "instrument": "PS Nondestructive Stack",
      "mechanic": "defect_inspector",
      "badge": "Дизайн / Смарт-слои",
      "brief": "Работай неразрушающим методом: Layer Masks вместо ластика, Smart Objects и корректирующие слои.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: Правки клиента требуют вернуть чуть-чуть фона за моделью, но стажёр ничего не может восстановить! Проверь стек слоёв PSD.",
          "artifactTitle": "key-visual-v4.psd — Layers Panel",
          "items": [
            {
              "id": "ps1",
              "code": "Adjust: Curves Adjustment Layer (Clipping)",
              "label": "Коррекция тона и контраста"
            },
            {
              "id": "ps2",
              "code": "Model Layer: Вырезана ластиком (Eraser E) на Растре",
              "label": "Отделение модели от фона"
            },
            {
              "id": "ps3",
              "code": "Logo: Vector Smart Object from .ai",
              "label": "Векторный логотип в шапке"
            },
            {
              "id": "ps4",
              "code": "Shadow: Soft Brush on New Overlay Layer (45%)",
              "label": "Мягкая тень под моделью"
            }
          ],
          "defectId": "ps2",
          "fixedCode": "Model Layer: Layer Mask (Чёрная кисть скрывает, Белая — возвращает!)",
          "hint": "Инструмент Ластик (Eraser) навсегда стирает пиксели с растрового слоя — при закрытии файла их не вернуть!",
          "winRule": "Ластик в профессиональном ретушировании и дизайне заменён на Layer Mask: чёрный прячет, белый проявляет, оригинал не тронут.",
          "failReasons": {
            "ps1": "Корректирующие слои (Curves) с обтравочной маской полностью неразрушающи.",
            "ps3": "Vector Smart Object позволяет масштабировать логотип туда-сюда без потери резкости.",
            "ps4": "Тень на отдельном слое можно в любой момент подкрутить по прозрачности."
          }
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "PS-702",
          "speaker": "Старший ретушёр Ольга",
          "telemetry": [
            {
              "label": "Слой фото",
              "val": "Обычный растр",
              "bad": true
            },
            {
              "label": "Ресайз",
              "val": "10% -> 100%",
              "bad": true
            }
          ],
          "situation": "Дизайнер уменьшил обычную фотографию в макете до размера миниатюры 100px, сохранил проект, а через час растянул обратно до 1200px — фото превратилось в пиксельную кашу! Как предотвратить такую потерю при поиске композиции?",
          "choices": [
            {
              "id": "a",
              "text": "Использовать фильтр Sharpen поверх размытого фото",
              "outcome": "Резкость не восстановит безвозвратно потерянные пиксели."
            },
            {
              "id": "b",
              "text": "Перед трансформацией перевести слой в Smart Object (`Convert to Smart Object`)",
              "outcome": "В десятку! Смарт-объект хранит внутри исходное разрешение и позволяет безопасно менять размер 100 раз."
            },
            {
              "id": "c",
              "text": "Увеличить DPI документа до 600",
              "outcome": "Это просто растянет уже испорченную картинку с ещё большим мылом."
            }
          ],
          "correctId": "b",
          "hint": "Какой тип контейнера слоя внутри Photoshop защищает исходные пиксели при многократном уменьшении и увеличении?",
          "winRule": "Конвертируйте ключевые фото и лого в Smart Object перед трансформацией — внутри сохраняется оригинал в 100% качестве."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 3: Сделали резкое контрастное фото через меню Image -> Adjustments -> Brightness/Contrast прямо на слое, а теперь нужно ослабить жёсткие тени. Что тормозит правку?",
          "meterName": "LAYER WORKFLOW PROBE",
          "normalSpec": "Коррекции вынесены в отдельные Adjustment Layers с масками",
          "points": [
            {
              "id": "pr2",
              "name": "Smart Sharpen Filter",
              "pin": "On Smart Object",
              "reading": "Smart Filter (Editable)",
              "unit": "",
              "meterNote": "Резкость наложена как Smart Filter — можно дважды кликнуть и поменять радиус."
            },
            {
              "id": "pr1",
              "name": "Layer 1 (Portrait)",
              "pin": "Menu Adjustments",
              "reading": "Destructive Baked Pixels (Убиты света)",
              "unit": "",
              "meterNote": "Цветокоррекция запеклась прямо в пиксели портрета — открутить нельзя!"
            },
            {
              "id": "pr3",
              "name": "Mask Feather",
              "pin": "Properties",
              "reading": "1.5 px Soft Edge",
              "unit": "",
              "meterNote": "Параметр маски регулируется в реальном времени."
            }
          ],
          "faultId": "pr1",
          "hint": "Меню `Image -> Adjustments` меняет пиксели навсегда, в отличие от иконки кружочка внизу панели Layers...",
          "winRule": "Используйте `Adjustment Layers` (Curves, Levels, Hue/Saturation) вместо меню Image -> Adjustments, чтобы править цвет в любой день проекта."
        }
      ]
    },
    "8": {
      "title": "Упаковка и Dieline: ножи резки и Overprint",
      "instrument": "Packaging Dieline Lab",
      "mechanic": "bench_tuner",
      "badge": "Дизайн / Упаковка",
      "brief": "Настрой развёртку коробки правильно: плашечный цвет ножей, Overprint Stroke, клеевой клапан и вылеты.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: Задай корректные геометрические параметры развертки картонной коробки: вылеты за край ножа 3 мм, ширина клеевого клапана без лака 12-15 мм и Overprint для линии реза.",
          "previewType": "generic",
          "controls": [
            {
              "id": "bleed",
              "kind": "range",
              "label": "Вылеты фона за нож (Bleed)",
              "min": 0,
              "max": 6,
              "step": 1,
              "init": 0,
              "unit": "mm",
              "targetMin": 3,
              "targetMax": 5
            },
            {
              "id": "glue",
              "kind": "range",
              "label": "Клеевой клапан (без лака/краски)",
              "min": 4,
              "max": 20,
              "step": 2,
              "init": 4,
              "unit": "mm",
              "targetMin": 12,
              "targetMax": 16
            },
            {
              "id": "overprint",
              "kind": "pills",
              "label": "Линия CUT (Overprint Stroke)",
              "options": [
                "OFF (Выворотка)",
                "ON + Отдельный слой"
              ],
              "init": "OFF (Выворотка)",
              "targetVal": "ON + Отдельный слой"
            }
          ],
          "hint": "Если на линию реза забыть поставить Overprint, при отключении ножей перед печатью под ними останется белая полоса (дырка) на тираже!",
          "winRule": "Ножи резки (Cut) и биговки (Crease) кладут на отдельный верхний слой в Spot-цвете с обязательным `Overprint Stroke`, а клеевой клапан оставляют свободным от краски."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: На готовой коробке чая сканер на кассе не пробивает штрихкод EAN-13, а текст ингредиентов на сгибе «зажёван». Найди технический брак!",
          "artifactTitle": "tea-box-dieline.ai — Box Audit",
          "items": [
            {
              "id": "pk1",
              "code": "Dieline Layer: Spot 'DIE_CUT' 0.5pt Overprint",
              "label": "Технический слой штампа"
            },
            {
              "id": "pk2",
              "code": "EAN-13 Barcode: Yellow stripes on Dark Blue",
              "label": "Штрихкод на задней грани упаковки"
            },
            {
              "id": "pk3",
              "code": "Glue Flap 14mm: White paper (No Varnish)",
              "label": "Зона склейки клапана"
            },
            {
              "id": "pk4",
              "code": "Crease Dash Line: Spot Green Dashed",
              "label": "Пунктир линий сгиба (биговка)"
            }
          ],
          "defectId": "pk2",
          "fixedCode": "EAN-13 Barcode: 100% Black (K) штрихи строго на чистом белом прямоугольнике!",
          "hint": "Красный лазерный сканер не отличает жёлтые и тёплые штрихи на тёмном фоне!",
          "winRule": "Штрихкод EAN-13 всегда печатают 100% чёрным (0/0/0/100 K) на белой плашке со спокойной зоной (Quiet Zone) по бокам."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Распредели технические элементы развёртки коробки по их назначению в штампе!",
          "bins": [
            {
              "id": "cut",
              "label": "Сплошной Cut (Резка)",
              "color": "rose"
            },
            {
              "id": "crease",
              "label": "Пунктир Crease (Биговка)",
              "color": "cyan"
            },
            {
              "id": "safe",
              "label": "Безопасная зона (Safe Zone)",
              "color": "emerald"
            }
          ],
          "cards": [
            {
              "tag": "Контур",
              "specimen": "Внешний периметр коробки, отсекающий лишний картон",
              "context": "Острые ножи штанц-формы",
              "targetBin": "cut",
              "rule": "Внешний контур вырубного ножа задаётся сплошной Spot-линией Cut."
            },
            {
              "tag": "Сгиб",
              "specimen": "Линия сгиба крышки и боковых клапанов",
              "context": "Продавливает картон без прорезания",
              "targetBin": "crease",
              "rule": "Биговочные линейки (сгибы) обозначают пунктирной линией другого Spot-цвета."
            },
            {
              "tag": "Текст",
              "specimen": "Логотип и состав 3-4 мм ВНУТРЬ от линии сгиба",
              "context": "Чтобы надпись не попала на ребро коробки",
              "targetBin": "safe",
              "rule": "Важную графику отступают минимум на 3-5 мм от ножей и линий биговки."
            }
          ],
          "hint": "Сплошная — режет насквозь, пунктир — гнёт картон, текст — глубоко внутри Safe Zone.",
          "winRule": "Чёткое разделение Cut (сплошной), Crease (пунктир) и Safe Zone 4мм исключает брак вырубки и загиба текстов."
        }
      ]
    },
    "9": {
      "title": "Допечатная подготовка Prepress & PDF/X",
      "instrument": "Acrobat Preflight Desk",
      "mechanic": "probe_diagnostic",
      "badge": "Дизайн / Prepress",
      "brief": "Лови скрытые ошибки перед типографией: 300 dpi, вылеты 3 мм, чёрный текст 100% K и PDF/X-1a.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: В Acrobat Output Preview проверь макет листовки перед запуском дорогого офсетного тиража. Найди дефект, который смажет мелкий текст!",
          "meterName": "ACROBAT PREFLIGHT",
          "normalSpec": "Мелкий текст = 0/0/0/100 K; Bleed = 3-5 mm; 300 dpi",
          "points": [
            {
              "id": "pp1",
              "name": "Обложка фон",
              "pin": "Hero Photo",
              "reading": "CMYK 300 dpi",
              "unit": "",
              "meterNote": "Разрешение фона 300 ppi — оптимально для мелованной бумаги."
            },
            {
              "id": "pp2",
              "name": "Мелкий шрифт 8pt",
              "pin": "CMYK Separations",
              "reading": "C75 M68 Y65 K90 (4 краски!)",
              "unit": "",
              "meterNote": "Мелкий текст идёт в 4 краски! При малейшем неприводе валов буквы расплывутся цветной каймой."
            },
            {
              "id": "pp3",
              "name": "Вылеты BleedBox",
              "pin": "Document Box",
              "reading": "+3.0 mm по всем 4 сторонам",
              "unit": "",
              "meterNote": "Стандартный вылет под нож соблюдён."
            },
            {
              "id": "pp4",
              "name": "Шрифты в PDF",
              "pin": "Fonts Tab",
              "reading": "Embedded / Outlines",
              "unit": "",
              "meterNote": "Все глифы встроены в PDF без зависимости от ПК."
            }
          ],
          "faultId": "pp2",
          "hint": "При печати офсетом 4 формы едут последовательно — какая краска должна печатать тонкий мелкий текст в 1 прогон?",
          "winRule": "Тонкий чёрный текст до 14-18pt задавайте ТОЛЬКО чистым `C0 M0 Y0 K100` (100% K) с Overprint — тогда он будет резким как бритва."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: После подрезки стопки буклетов по краям осталась тонкая уродливая БЕЛАЯ полоска бумаги! Найди ошибку в окне PDF-экспорта.",
          "artifactTitle": "Export Adobe PDF — flyer.pdf",
          "items": [
            {
              "id": "ex1",
              "code": "Preset: PDF/X-1a:2001 (CMYK Flatten)",
              "label": "Индустриальный стандарт экспорта"
            },
            {
              "id": "ex2",
              "code": "Marks and Bleeds: Bleed = 0 mm (Use Document Bleed = OFF)",
              "label": "Выпуск фона под обрез"
            },
            {
              "id": "ex3",
              "code": "Output Intent: ISO Coated v2 (ECI)",
              "label": "Цветовой профиль бумаги"
            },
            {
              "id": "ex4",
              "code": "Compression: Bicubic 300 ppi",
              "label": "Разрешение растровых слоёв"
            }
          ],
          "defectId": "ex2",
          "fixedCode": "Bleed = 3.0 mm + фоновые картинки заходят за край обрезного формата!",
          "hint": "Гильотина в типографии имеет допуск ±0.5–1 мм. Если фон закончился ровно по краю страницы — нож покажет белую полоску!",
          "winRule": "Фоновые элементы и картинки в край листа обязаны выходить на 3-5 мм в зону вылетов (`Bleeds`), и при экспорте PDF эта галочка должна быть включена."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 3: Сконфигурируй идеальный пресет экспорта коммерческого буклета в типографию.",
          "previewType": "generic",
          "controls": [
            {
              "id": "std",
              "kind": "pills",
              "label": "Стандарт PDF",
              "options": [
                "Interactive PDF",
                "PDF/X-1a:2001"
              ],
              "init": "Interactive PDF",
              "targetVal": "PDF/X-1a:2001"
            },
            {
              "id": "dpi",
              "kind": "pills",
              "label": "Растр",
              "options": [
                "72 dpi",
                "150 dpi",
                "300 dpi"
              ],
              "init": "72 dpi",
              "targetVal": "300 dpi"
            },
            {
              "id": "bleed",
              "kind": "range",
              "label": "Вылеты (Bleed)",
              "min": 0,
              "max": 5,
              "step": 1,
              "init": 0,
              "unit": " mm",
              "targetMin": 3,
              "targetMax": 5
            }
          ],
          "hint": "Тройка препресса: CMYK, 300 dpi, вылеты >= 3мм и стандарт PDF/X-1a (или PDF/X-4).",
          "winRule": "Формат `PDF/X-1a:2001` с растром `300 dpi` и вылетами `3-5 мм` принимают без доработок 99% типографий мира."
        }
      ]
    },
    "10": {
      "title": "Итоговый проект Дизайна: 360° Айдентика",
      "instrument": "Brand Delivery Pack",
      "mechanic": "workshop_quest",
      "badge": "Дизайн / Финал",
      "brief": "Собери профессиональный пакет передачи бренда 360°: векторы, печатные PDF/X, веб-ассеты и презентационные мокапы.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "GD-FIN",
          "speaker": "Директор по маркетингу Светлана",
          "telemetry": [
            {
              "label": "Типография",
              "val": "Ждёт визитку",
              "bad": true
            },
            {
              "label": "Разработчики",
              "val": "Ждут иконки на сайт",
              "bad": true
            }
          ],
          "situation": "Мы утвердили бренд! Что именно вы положите в итоговую папку сдачи клиенту, чтобы не получать 100 писем с вопросом «А перешлите в другом формате»?",
          "choices": [
            {
              "id": "a",
              "text": "Отправить один красивый PNG-скриншот логотипа в Telegram",
              "outcome": "Полный провал: PNG сожмётся мессенджером, не подойдёт ни типографии, ни верстальщику."
            },
            {
              "id": "b",
              "text": "Структурированный архив: 01_Logo_Vector (AI/EPS/SVG в кривых CMYK+RGB), 02_Brandbook (PDF), 03_Print (PDF/X-1a 300dpi CMYK + 3mm Bleed), 04_Web (SVG/WebP sRGB)",
              "outcome": "Высший класс! Каждый подрядчик — от веб-студии до типографии — сразу берёт свою готовую папку."
            },
            {
              "id": "c",
              "text": "Только исходники .psd без шрифтов",
              "outcome": "У клиента нет Photoshop и ваших лицензионных шрифтов."
            }
          ],
          "correctId": "b",
          "hint": "Раздели итоговый пакет для заказчика минимум на Вектор, Веб (RGB SVG/WebP), Печать (CMYK PDF/X) и PDF-гайдлайн.",
          "winRule": "Золотой стандарт сдачи проекта — разделение исходников по папкам Vector / Print (PDF/X-1a CMYK 300dpi) / Web (sRGB SVG/WebP) + Brandbook PDF."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 2: Разложи готовые файлы финального бренда строго по папкам сдачи!",
          "bins": [
            {
              "id": "print",
              "label": "01_PRINT (Типография)",
              "color": "rose"
            },
            {
              "id": "web",
              "label": "02_WEB (Сайт/Соцсети)",
              "color": "cyan"
            },
            {
              "id": "vector",
              "label": "03_SOURCE (Вектор)",
              "color": "purple"
            }
          ],
          "cards": [
            {
              "tag": "Макет буклета",
              "specimen": "catalog-bleed3mm-CMYK.pdf (PDF/X-1a, 300dpi)",
              "context": "Для офсетной печати тиража",
              "targetBin": "print",
              "rule": "Печатные материалы всегда идут в CMYK 300dpi с вылетами 3мм в PDF/X."
            },
            {
              "tag": "Логотип сайта",
              "specimen": "logo-icon-sRGB.svg (<path> vector)",
              "context": "Для шапки лендинга",
              "targetBin": "web",
              "rule": "Логотипы для веба оптимизируют в чистый sRGB SVG (или PNG/WebP)."
            },
            {
              "tag": "Исходник знака",
              "specimen": "logo-master-outlined.ai / .eps",
              "context": "Базовый вектор в кривых + Pantone",
              "targetBin": "vector",
              "rule": "Кривые AI/EPS — золотой исходник логотипа на вывески, гравировку и будущие носители."
            }
          ],
          "hint": "CMYK PDF/X -> Print; sRGB SVG/WebP -> Web; AI/EPS в кривых -> Source.",
          "winRule": "Грамотная архитектура сдачи файлов экономит заказчику деньги и доказывает ваш экспертный уровень."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: Финальная проверка перед отправкой архива клиенту — отлови последний недочёт в одном из файлов!",
          "artifactTitle": "FINAL_BRAND_ARCHIVE_v1.zip — Verification",
          "items": [
            {
              "id": "fn1",
              "code": "01_PRINT/vizitka.pdf -> CMYK, 300dpi, Bleed 3mm",
              "label": "Печатный макет визитки"
            },
            {
              "id": "fn2",
              "code": "02_WEB/cover.webp -> sRGB, 72ppi, 180 KB",
              "label": "Обложка для сайта"
            },
            {
              "id": "fn3",
              "code": "03_SOURCE/logo.eps -> Text NOT outlined (Live Font)",
              "label": "Векторный мастер логотипа"
            },
            {
              "id": "fn4",
              "code": "04_BRANDBOOK/guideline.pdf -> Clear space & Color specs",
              "label": "Краткий гайдлайн с кодами RGB/CMYK/Pantone"
            }
          ],
          "defectId": "fn3",
          "fixedCode": "03_SOURCE/logo-outlined.eps -> 100% шрифты переведены в кривые!",
          "hint": "Шрифт внутри финального `.eps` оставлен живым — у подрядчика он слетит на Arial!",
          "winRule": "Финальный проверочный чек-лист спасает репутацию: 100% шрифтов в `.ai`/`.eps` в кривых, веб в sRGB, печать в CMYK PDF/X-1a."
        }
      ]
    },
    "11": {
      "title": "SMM-креативы: Ресайз-система и Safe Zones",
      "instrument": "SMM Format & SafeZone Studio",
      "mechanic": "bench_tuner",
      "badge": "Дизайн / SMM Ресайзы",
      "brief": "Адаптируй ключевой визуал под Feed (1:1) и Stories (9:16), оставив воздух для интерфейса.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: Настрой экспорт вертикального креатива для Instagram Stories / Reels: холст 1920px по высоте, профиль sRGB для экранов и верхняя охранная зона >= 250px.",
          "previewType": "generic",
          "controls": [
            {
              "id": "prof",
              "kind": "pills",
              "label": "Цветовой профиль",
              "options": [
                "CMYK Coated FOGRA39",
                "sRGB IEC61966-2.1"
              ],
              "init": "CMYK Coated FOGRA39",
              "targetVal": "sRGB IEC61966-2.1"
            },
            {
              "id": "hpx",
              "kind": "range",
              "label": "Высота макета 9:16 (при ширине 1080)",
              "min": 1080,
              "max": 2160,
              "step": 120,
              "init": 1080,
              "unit": "px",
              "targetMin": 1920,
              "targetMax": 1920
            },
            {
              "id": "safe",
              "kind": "range",
              "label": "Верхняя зона Safe Zone от края",
              "min": 50,
              "max": 400,
              "step": 50,
              "init": 50,
              "unit": "px",
              "targetMin": 250,
              "targetMax": 350
            }
          ],
          "hint": "Стандарт Stories (9:16) — 1080x1920 px, для экранов используем только sRGB, а сверху отступаем 250–350 px под шапку профиля.",
          "winRule": "Макет Stories 1080x1920 в профиле sRGB с отступом Safe Zone 250+ px гарантирует сочные цвета и чистую читаемость оффера.",
          "failRule": "В CMYK баннеры в браузере тускнеют и искажаются, а без Safe Zone интерфейс приложения закроет заголовок."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 2: Разнеси макеты рекламной кампании по правильным форматным сеткам Social Media!",
          "bins": [
            {
              "id": "feed",
              "label": "Лента 1080x1080 / 1080x1350",
              "color": "indigo"
            },
            {
              "id": "stories",
              "label": "Stories / Reels 1080x1920",
              "color": "cyan"
            }
          ],
          "cards": [
            {
              "tag": "9:16 Вертикаль",
              "specimen": "Полноэкранный макет с верхним отступом 250px и нижним 340px",
              "context": "Учтена строка ответа и иконка аккаунта",
              "targetBin": "stories",
              "rule": "Вертикальный формат 9:16 требует Safe Zones сверху и снизу под элементы интерфейса."
            },
            {
              "tag": "1:1 / 4:5 Лента",
              "specimen": "Квадратная или слегка вытянутая карточка товара с крупной ценой",
              "context": "Центральный фокус без перекрытий интерфейса поверх фото",
              "targetBin": "feed",
              "rule": "Лента использует 1080x1080 (1:1) или портретный 1080x1350 (4:5)."
            },
            {
              "tag": "CTA свайп",
              "specimen": "Кнопка призыва размещена на уровне 1350px по вертикали (выше низа на 570px)",
              "context": "Хорошо видна над полем комментария в Reels",
              "targetBin": "stories",
              "rule": "В Stories/Reels нижние ~340–420 px заняты описанием и кнопкой отправки сообщения."
            }
          ],
          "hint": "Где соотношение 9:16 и Safe Zones 250/340 px — это Stories; квадрат 1080x1080 и 4:5 (1080x1350) — это Лента Feed.",
          "winRule": "Правильный ресайз — это не растягивание 1:1 в 9:16, а перекомпоновка объектов внутри Safe Zones каждого формата."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: Клиент пожаловался, что на реальном iPhone промокод в макете Stories обрезало кнопкой лайка и аватаркой профиля. Найди причину в слоях!",
          "artifactTitle": "Спецификация рекламного креатива 9:16",
          "items": [
            {
              "id": "sm1",
              "code": "Холст: 1080 x 1920 px (72 ppi, sRGB)",
              "label": "Параметры документа Photoshop"
            },
            {
              "id": "sm2",
              "code": "Промокод и логотип размещены на Y = 90px и Y = 1830px от краёв",
              "label": "Расположение ключевой типографики"
            },
            {
              "id": "sm3",
              "code": "Фоновый градиент заполняет весь холст 1080 x 1920 px",
              "label": "Фоновое изображение до краёв"
            },
            {
              "id": "sm4",
              "code": "Экспорт PNG/JPG с качеством без лесенок на тексте",
              "label": "Параметры сохранения креатива"
            }
          ],
          "defectId": "sm2",
          "fixedCode": "Сдвинуть логотип и промокод в безопасную зону Safe Zone (Y от 260px до 1560px)!",
          "hint": "Какие координаты находятся ближе 250px к верхнему краю или ближе 340px к нижнему краю холста 1920px?",
          "winRule": "В вертикальном формате 1080x1920 фону место до самых краёв, а весь смысл (оффер, промокод, лого) живёт строго между Y=260 и Y=1560.",
          "failReasons": {
            "sm1": "Размер 1080x1920 px и профиль sRGB абсолютно корректны для Stories.",
            "sm3": "Фон как раз должен уходить до самых краёв холста без белых полос.",
            "sm4": "Качественный PNG/JPG без сжатия артефактами улучшает читаемость."
          }
        }
      ]
    },
    "12": {
      "title": "Защита дизайн-проекта: Мокапы и Hand-off архив",
      "instrument": "Hand-Off & Mockup Inspector",
      "mechanic": "probe_diagnostic",
      "badge": "Дизайн / Защита и Hand-off",
      "brief": "Собери фотореалистичный Mockup через Smart Objects и проверь комплект передачи заказчику.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: Проинспектируй слои презентационного мокапа (Mockup) в Photoshop — найди проблемный узел, из-за которого этикетка выглядит как плоская наклейка поверх бумаги!",
          "meterName": "PHOTOSHOP MOCKUP INSPECTOR",
          "normalSpec": "Smart Object + Perspective Warp + режим Multiply для светотени",
          "points": [
            {
              "id": "mk_size",
              "name": "Разрешение сцены",
              "pin": "Canvas 3000x2000",
              "reading": "3000 x 2000 px",
              "unit": "HQ",
              "meterNote": "Фокус резкий — текстура крафт-бумаги чёткая."
            },
            {
              "id": "mk_so",
              "name": "Контейнер этикетки",
              "pin": "Smart Object",
              "reading": "Linked OK",
              "unit": "SO",
              "meterNote": "Смарт-объект сохранён — редактирование двойным кликом работает."
            },
            {
              "id": "mk_flat",
              "name": "Наложение и геометрия",
              "pin": "Blend / Warp",
              "reading": "Normal 100%, плоский",
              "unit": "FLAT!",
              "meterNote": "Нет Perspective Warp и режима Multiply — этикетка перекрыла тени коробки!"
            },
            {
              "id": "mk_light",
              "name": "Верхний слой рефлексов",
              "pin": "Highlight Screen",
              "reading": "Screen 25%",
              "unit": "OK",
              "meterNote": "Мягкий блик света поверх зоны логотипа добавляет объём."
            }
          ],
          "faultId": "mk_flat",
          "hint": "Чтобы макет лёг в фактуру бумаги и повторил изгиб коробки, нужен Smart Object + Warp + режим наложения типа Multiply/Linear Burn!",
          "winRule": "Профессиональный мокап сочетает Smart Object, перспективу/Warp по геометрии и режим Multiply (или карту смещения), пропуская тени и текстуру материала.",
          "failReasons": {
            "mk_size": "Разрешение 3000x2000 px отлично подходит для презентации.",
            "mk_so": "Smart Object позволяет быстро подменять дизайн без потери качества.",
            "mk_light": "Рефлекс Screen 25% добавляет реалистичный блик материала."
          }
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Собери эталонную структуру выпускного архива (Hand-off Package) для передачи заказчику и типографии!",
          "chips": [
            {
              "id": "ho1",
              "text": "01_Brandbook (PDF-руководство: сетка лого, охранные поля, шрифты)"
            },
            {
              "id": "ho2",
              "text": "02_Logo_Vector (AI, EPS, SVG на светлом/тёмном/монохромном фонах)"
            },
            {
              "id": "ho3",
              "text": "03_Print_PDFX (CMYK 300 dpi + Bleeds 3 мм + шрифты в кривых)"
            },
            {
              "id": "ho4",
              "text": "04_Digital_Mockups (sRGB шаблоны соцсетей + презентация на носителях)"
            }
          ],
          "correctOrder": [
            "ho1",
            "ho2",
            "ho3",
            "ho4"
          ],
          "hint": "Логичная структура папок: сначала правила брендбука, затем исходники логотипа, далее печатные файлы PDF/X и завершает пакет digital/мокапы.",
          "winRule": "Грамотный Hand-off избавляет заказчика и подрядчиков от вопросов: все правила, векторы, печатные PDF/X и мокапы лежат по полочкам."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "GD-402",
          "speaker": "Заказчик проекта",
          "telemetry": [
            {
              "label": "Среда",
              "val": "Веб + Полиграфия",
              "bad": false
            },
            {
              "label": "Цвет-паспорт",
              "val": "Только HEX",
              "bad": true
            }
          ],
          "prompt": "Раунд 3: Заказчик просит на защите единую таблицу цветов для веба и типографской печати. Какие коды ты обязан зафиксировать в спецификации?",
          "situation": "Подготовка раздела «Фирменная палитра» на финальной квалификационной защите брендбука.",
          "choices": [
            {
              "id": "pal_all",
              "text": "Pantone Spot (эталон краски) + CMYK (для печати) + RGB / HEX (для экранов)",
              "outcome": "Полный стандарт! И типография, и веб-разработчик получат предсказуемый фирменный цвет."
            },
            {
              "id": "pal_hex",
              "text": "Только HEX (#4F46E5), пусть печатники сами переведут на глаз",
              "outcome": "Автоконвертация HEX в офсетную печать даёт грязный сдвиг оттенка на бумаге."
            },
            {
              "id": "pal_shot",
              "text": "Скриншот кружка цвета без цифр, чтобы подбирали пипеткой",
              "outcome": "Скриншот зависит от профиля монитора и искажает цвет на 15–30%."
            }
          ],
          "correctId": "pal_all",
          "hint": "Разным носителям нужны свои цветовые пространства: смесевая краска, триада CMYK и экранные RGB/HEX.",
          "winRule": "В брендбуке всегда указывают триаду стандартов: Pantone Spot (эталон), формулу CMYK (для тиража) и HEX/RGB (для экранов)."
        }
      ]
    },
    "13": {
      "title": "Тренажёр: Дизайн-система и токены: переменные цвета, типографическая",
      "instrument": "Figma Variables",
      "mechanic": "workshop_quest",
      "badge": "GRAPHIC_DESIGN / Урок 13",
      "brief": "Построение масштабируемой дизайн-системы с семантическими токенами цвета, отступов и состояний компонентов.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-131",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 13/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Дизайн-система и токены: переменные цвета, типографическая шкала и UI-кит»: Зачем нужны семантические токены вместо прямых HEX-кодов?",
          "choices": [
            {
              "id": "a",
              "text": "Для централизованной смены тем и консистентности UI",
              "outcome": "Семантические токены позволяют обновлять палитру во всём продукте из одной точки."
            },
            {
              "id": "b",
              "text": "Чтобы увеличить вес файла",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Чтобы отключить шрифты",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Только для печати CMYK",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Семантические токены позволяют обновлять палитру во всём продукте из одной точки.",
          "winRule": "Отлично! Примените правило: Семантические токены позволяют обновлять палитру во всём продукте из одной точки."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Дизайн-система и токены: переменные цвета, типографическая шкала и UI-кит».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Figma Variables)"
            },
            {
              "id": "s2",
              "text": "2. Указаны семантические токены цвета"
            },
            {
              "id": "s3",
              "text": "3. Задана иерархия шрифтов"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Определена модульная сетка отступов"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-133",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Figma Variables",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой базовый шаг отступов чаще всего используют в UI-системах?",
          "choices": [
            {
              "id": "a",
              "text": "4px / 8px сетка",
              "outcome": "Кратность 4px и 8px идеально масштабируется на всех экранах."
            },
            {
              "id": "b",
              "text": "7px",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "13px",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "19px",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Кратность 4px и 8px идеально масштабируется на всех экранах.",
          "winRule": "Зачёт по модулю №13 подтверждён!"
        }
      ]
    },
    "14": {
      "title": "Тренажёр: Инфографика и визуализация данных: диаграммы, иконки и сто",
      "instrument": "Adobe Illustrator",
      "mechanic": "workshop_quest",
      "badge": "GRAPHIC_DESIGN / Урок 14",
      "brief": "Превращение сухих статистических таблиц в понятную, честную и эстетичную визуальную инфографику.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-141",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 14/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Инфографика и визуализация данных: диаграммы, иконки и сторителлинг в цифрах»: С какого значения должна начинаться ось Y в столбчатой диаграмме?",
          "choices": [
            {
              "id": "a",
              "text": "С нуля (0)",
              "outcome": "Обрезанная ось Y визуально искажает разницу между столбцами."
            },
            {
              "id": "b",
              "text": "С минимального значения ряда",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "С 50%",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "С произвольного числа",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Обрезанная ось Y визуально искажает разницу между столбцами.",
          "winRule": "Отлично! Примените правило: Обрезанная ось Y визуально искажает разницу между столбцами."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Инфографика и визуализация данных: диаграммы, иконки и сторителлинг в цифрах».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Adobe Illustrator)"
            },
            {
              "id": "s2",
              "text": "2. Выбран корректный тип графика для динамики"
            },
            {
              "id": "s3",
              "text": "3. Указан тип графика для долей"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Соблюдено правило нулевой оси и чистоты данных"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-143",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Adobe Illustrator",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой тип графика лучше всего показывает изменение показателя за 12 месяцев?",
          "choices": [
            {
              "id": "a",
              "text": "Линейный график (Line Chart)",
              "outcome": "Линейный график наглядно передаёт тренд во времени."
            },
            {
              "id": "b",
              "text": "Круговая диаграмма (Pie)",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Радар",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Облако тегов",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Линейный график наглядно передаёт тренд во времени.",
          "winRule": "Зачёт по модулю №14 подтверждён!"
        }
      ]
    },
    "15": {
      "title": "Тренажёр: Моушн-дизайн и микроанимации интерфейсов: тайминг, easing-",
      "instrument": "After Effects / Figma Smart Animate",
      "mechanic": "workshop_quest",
      "badge": "GRAPHIC_DESIGN / Урок 15",
      "brief": "Проектирование осмысленной динамики интерфейса: кривые Безье, 12 принципов анимации и экспорт лёгких векторных анимаций.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-151",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 15/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Моушн-дизайн и микроанимации интерфейсов: тайминг, easing-кривые и Lottie/SVG»: Какая кривая ускорения лучше всего подходит для появления UI-панели?",
          "choices": [
            {
              "id": "a",
              "text": "ease-out (быстрый старт, мягкое торможение)",
              "outcome": "ease-out ощущается отзывчивым и естественным."
            },
            {
              "id": "b",
              "text": "linear",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "step-end",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "bounce-infinite",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "ease-out ощущается отзывчивым и естественным.",
          "winRule": "Отлично! Примените правило: ease-out ощущается отзывчивым и естественным."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Моушн-дизайн и микроанимации интерфейсов: тайминг, easing-кривые и Lottie/SVG».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (After Effects / Figma Smart Animate)"
            },
            {
              "id": "s2",
              "text": "2. Указан тайминг в миллисекундах"
            },
            {
              "id": "s3",
              "text": "3. Выбрана кривая ускорения"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Описаны визуальные параметры анимации"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-153",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "After Effects / Figma ",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой формат экспортирует векторную анимацию After Effects в компактный JSON для веба?",
          "choices": [
            {
              "id": "a",
              "text": "Lottie",
              "outcome": "Lottie рендерит вектор по JSON без потери качества на Retina."
            },
            {
              "id": "b",
              "text": "BMP",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "TIFF",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "WAV",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Lottie рендерит вектор по JSON без потери качества на Retina.",
          "winRule": "Зачёт по модулю №15 подтверждён!"
        }
      ]
    },
    "16": {
      "title": "Тренажёр: 3D-графика для дизайнера: основы моделирования, материалы ",
      "instrument": "Blender / Three.js",
      "mechanic": "workshop_quest",
      "badge": "GRAPHIC_DESIGN / Урок 16",
      "brief": "Постановка трёхточечного света (Key, Fill, Rim), настройка шероховатости (Roughness) и металличности (Metalness) для презентации упаковки.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-161",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 16/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «3D-графика для дизайнера: основы моделирования, материалы PBR и студийное освещение»: Какой источник света в трёхточечной схеме отделяет силуэт объекта от фона?",
          "choices": [
            {
              "id": "a",
              "text": "Rim Light (Контровой свет)",
              "outcome": "Контровой свет создаёт световую кромку по краю объекта."
            },
            {
              "id": "b",
              "text": "Key Light",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Ambient Occlusion",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Fog",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Контровой свет создаёт световую кромку по краю объекта.",
          "winRule": "Отлично! Примените правило: Контровой свет создаёт световую кромку по краю объекта."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «3D-графика для дизайнера: основы моделирования, материалы PBR и студийное освещение».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Blender / Three.js)"
            },
            {
              "id": "s2",
              "text": "2. Описаны все 3 источника света"
            },
            {
              "id": "s3",
              "text": "3. Указаны параметры Roughness/Metalness для картона и фольги"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Обоснован выбор ракурса камеры"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-163",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Blender / Three.js",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: За что отвечает параметр Roughness в PBR-материале?",
          "choices": [
            {
              "id": "a",
              "text": "За шероховатость (матовость или глянец поверхности)",
              "outcome": "Чем ниже Roughness, тем чётче блики и отражения."
            },
            {
              "id": "b",
              "text": "За прозрачность",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "За вес модели",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "За количество полигонов",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Чем ниже Roughness, тем чётче блики и отражения.",
          "winRule": "Зачёт по модулю №16 подтверждён!"
        }
      ]
    },
    "17": {
      "title": "Тренажёр: Фотореалистичные мокапы (Mockups) и презентация продукта в",
      "instrument": "Adobe Photoshop Smart Objects",
      "mechanic": "workshop_quest",
      "badge": "GRAPHIC_DESIGN / Урок 17",
      "brief": "Наложение айдентики и интерфейсов на реальные носители через смарт-объекты, искажение перспективы и режимы наложения Multiply/Screen.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-171",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 17/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Фотореалистичные мокапы (Mockups) и презентация продукта в среде»: Какая технология Photoshop позволяет обновлять дизайн на мокапе в 1 клик с сохранением перспективы?",
          "choices": [
            {
              "id": "a",
              "text": "Smart Objects (Смарт-объекты)",
              "outcome": "Смарт-объект хранит исходный макет отдельно от трансформаций."
            },
            {
              "id": "b",
              "text": "Magic Wand",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Flatten Image",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Posterize",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Смарт-объект хранит исходный макет отдельно от трансформаций.",
          "winRule": "Отлично! Примените правило: Смарт-объект хранит исходный макет отдельно от трансформаций."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Фотореалистичные мокапы (Mockups) и презентация продукта в среде».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Adobe Photoshop Smart Objects)"
            },
            {
              "id": "s2",
              "text": "2. Упомянуто преобразование в Smart Object"
            },
            {
              "id": "s3",
              "text": "3. Описано искажение по форме носителя"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Применены режимы наложения Multiply/Screen для света и тени"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-173",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Adobe Photoshop Smart ",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой режим наложения используют, чтобы фактура и тени бумаги проявились поверх цветного принта?",
          "choices": [
            {
              "id": "a",
              "text": "Multiply (Умножение)",
              "outcome": "Multiply сохраняет тёмные тени носителя."
            },
            {
              "id": "b",
              "text": "Difference",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Dissolve",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Invert",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Multiply сохраняет тёмные тени носителя.",
          "winRule": "Зачёт по модулю №17 подтверждён!"
        }
      ]
    },
    "18": {
      "title": "Тренажёр: UX-исследования, User Flow и прототипирование интерактивны",
      "instrument": "Figma Prototype",
      "mechanic": "workshop_quest",
      "badge": "GRAPHIC_DESIGN / Урок 18",
      "brief": "Построение пользовательских сценариев (User Flow), поиск узких мест (pain points) и кликабельное прототипирование переходов.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-181",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 18/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «UX-исследования, User Flow и прототипирование интерактивных сценариев»: Что отражает схема User Flow?",
          "choices": [
            {
              "id": "a",
              "text": "Последовательность экранов и решений пользователя на пути к цели",
              "outcome": "User Flow показывает логику переходов и ветвлений сценария."
            },
            {
              "id": "b",
              "text": "Цветовую палитру бренда",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Список шрифтов",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Смету типографии",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "User Flow показывает логику переходов и ветвлений сценария.",
          "winRule": "Отлично! Примените правило: User Flow показывает логику переходов и ветвлений сценария."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «UX-исследования, User Flow и прототипирование интерактивных сценариев».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Figma Prototype)"
            },
            {
              "id": "s2",
              "text": "2. Описаны последовательные шаги сценария"
            },
            {
              "id": "s3",
              "text": "3. Учтено состояние ошибки/валидации"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Указан финальный экран успеха"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-183",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Figma Prototype",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Сколько участников достаточно для качественного юзабилити-теста по методике Якоба Нильсена?",
          "choices": [
            {
              "id": "a",
              "text": "5 пользователей",
              "outcome": "5 человек находят ~85% критических ошибок юзабилити."
            },
            {
              "id": "b",
              "text": "500 пользователей",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "1 разработчик",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "100 дизайнеров",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "5 человек находят ~85% критических ошибок юзабилити.",
          "winRule": "Зачёт по модулю №18 подтверждён!"
        }
      ]
    },
    "19": {
      "title": "Тренажёр: Доступность в дизайне (WCAG 2.1): контрастность, дальтониз",
      "instrument": "Contrast Checker",
      "mechanic": "workshop_quest",
      "badge": "GRAPHIC_DESIGN / Урок 19",
      "brief": "Проверка контрастности текста по стандарту WCAG AA (4.5:1), дублирование цветовых статусов иконками и читаемые кегли.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-191",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 19/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Доступность в дизайне (WCAG 2.1): контрастность, дальтонизм и инклюзивная типографика»: Какой минимальный коэффициент контрастности обычного текста требует стандарт WCAG AA?",
          "choices": [
            {
              "id": "a",
              "text": "4.5 : 1",
              "outcome": "4.5:1 гарантирует читаемость для людей со сниженным зрением."
            },
            {
              "id": "b",
              "text": "1.5 : 1",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "2.0 : 1",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "10 : 1",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "4.5:1 гарантирует читаемость для людей со сниженным зрением.",
          "winRule": "Отлично! Примените правило: 4.5:1 гарантирует читаемость для людей со сниженным зрением."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Доступность в дизайне (WCAG 2.1): контрастность, дальтонизм и инклюзивная типографика».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Contrast Checker)"
            },
            {
              "id": "s2",
              "text": "2. Указан порог контрастности 4.5:1"
            },
            {
              "id": "s3",
              "text": "3. Описано дублирование цвета иконкой/текстом"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Задан размер интерактивных кнопок >= 44px"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-193",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Contrast Checker",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Почему нельзя передавать статус ошибки только красным цветом?",
          "choices": [
            {
              "id": "a",
              "text": "Люди с нарушением цветовосприятия могут не отличить красный от зелёного",
              "outcome": "Цвет нужно дублировать иконкой или текстовой подписью."
            },
            {
              "id": "b",
              "text": "Красный цвет медленнее грузится",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Это запрещено в CMYK",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Красный не работает на OLED",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Цвет нужно дублировать иконкой или текстовой подписью.",
          "winRule": "Зачёт по модулю №19 подтверждён!"
        }
      ]
    },
    "20": {
      "title": "Тренажёр: Итоговый дипломный проект: комплексный брендбук, 3D-упаков",
      "instrument": "Figma",
      "mechanic": "workshop_quest",
      "badge": "GRAPHIC_DESIGN / Урок 20",
      "brief": "Финальная защита дизайн-проекта: от концепции и дизайн-системы до 3D-презентации и допечатной/веб-спецификации.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-201",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 20/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Итоговый дипломный проект: комплексный брендбук, 3D-упаковка и интерактивный кейс»: Что обязательно должно входить в спецификацию для типографии (Prepress)?",
          "choices": [
            {
              "id": "a",
              "text": "CMYK-цвета, вылеты (bleeds) 2–5 мм, шрифты в кривых, 300 dpi",
              "outcome": "Типография требует CMYK, 300 dpi, вылеты под обрез и кривые."
            },
            {
              "id": "b",
              "text": "RGB и 72 ppi",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Только ссылка на Figma",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "GIF-анимация",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Типография требует CMYK, 300 dpi, вылеты под обрез и кривые.",
          "winRule": "Отлично! Примените правило: Типография требует CMYK, 300 dpi, вылеты под обрез и кривые."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Итоговый дипломный проект: комплексный брендбук, 3D-упаковка и интерактивный кейс».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Figma)"
            },
            {
              "id": "s2",
              "text": "2. Описаны носители и айдентика"
            },
            {
              "id": "s3",
              "text": "3. Разделены форматы для веба (RGB/SVG) и печати (CMYK/300dpi)"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Включён этап 3D/мокап-презентации и дизайн-токены"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "GRA-203",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Figma",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Экзамен",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой аспект отличает профессиональный кейс на Behance от набора картинок?",
          "choices": [
            {
              "id": "a",
              "text": "Логика процесса: проблема -> исследование -> система -> результат",
              "outcome": "Сторителлинг показывает мышление дизайнера."
            },
            {
              "id": "b",
              "text": "Большое количество случайных фильтров",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Отсутствие текста",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Использование Comic Sans",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Сторителлинг показывает мышление дизайнера.",
          "winRule": "Зачёт по модулю №20 подтверждён!"
        }
      ]
    }
  },
  "autoelectric": {
    "1": {
      "title": "Закон Ома, Сечение провода и Потеря напряжения",
      "instrument": "Auto Wire & Ohm Calc",
      "mechanic": "bench_tuner",
      "badge": "Автоэлектрика / Закон Ома",
      "brief": "Рассчитывай нагрузку цепей 12В: ток I = P / U, подбор безопасного сечения меди и контроль ΔU ≤ 0.5В.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: Подключаем пару мощных LED-фар общей мощностью 180 Вт (ток I = 180/12 = 15 А) через трассу 4 метра. Подбери безопасное сечение медного провода, чтобы не было перегрева и ΔU ≤ 0.5В!",
          "previewType": "ohm_wire",
          "controls": [
            {
              "id": "power",
              "kind": "pills",
              "label": "Мощность люстры (P)",
              "options": [
                "120",
                "180"
              ],
              "init": "180",
              "targetVal": "180"
            },
            {
              "id": "section",
              "kind": "pills",
              "label": "Сечение медной жилы (мм²)",
              "options": [
                "0.5",
                "0.75",
                "1.5",
                "2.5"
              ],
              "init": "0.5",
              "targetVal": "2.5"
            }
          ],
          "hint": "По закону Ома 180Вт / 12В = 15 Ампер. По жиле 0.5-0.75мм² провод разогреется как спираль! Бери правило: ~8-10 А на 1 мм² с запасом по длине (минимум 2.5 мм²).",
          "winRule": "По формуле I = P / U ток 15 А требует медного провода 2.5 мм², тогда падение напряжения на 4м ниже 0.5В и жила холодная.",
          "failRule": "Тонкий провод 0.5-1.5 мм² под током 15А и длиной 4м вызывает сильную просадку вольт и оплавление изоляции."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 2: Лампа фары горит тусклым жёлтым накалом! Замерь падение напряжения (Volt Drop) между точками цепи под включённой нагрузкой.",
          "meterName": "FLUKE 87V — VOLT DROP",
          "normalSpec": "Допустимое падение ΔU на участке провода/массы: ≤ 0.2 - 0.5 В",
          "points": [
            {
              "id": "oe1",
              "name": "Питание B+ на фаре (к минусу АКБ)",
              "pin": "Pin 1 (+12V)",
              "reading": "12.42",
              "unit": "V",
              "meterNote": "Плюсовая линия от реле в норме."
            },
            {
              "id": "oe2",
              "name": "Падение ΔU массы (Корпус фары -> Минус АКБ)",
              "pin": "GND Trace",
              "reading": "3.85",
              "unit": "V",
              "meterNote": "Огромная потеря 3.85 Вольта на окисленном болте массы! Лампе остаётся всего 8.5В."
            },
            {
              "id": "oe3",
              "name": "Предохранитель F12 (вход/выход)",
              "pin": "Fuse 15A",
              "reading": "0.02",
              "unit": "V",
              "meterNote": "Падение 20 мВ — контакт держателя предохранителя чистый."
            },
            {
              "id": "oe4",
              "name": "Напряжение на клеммах АКБ",
              "pin": "Battery",
              "reading": "12.60",
              "unit": "V",
              "meterNote": "Аккумулятор полностью заряжен."
            }
          ],
          "faultId": "oe2",
          "hint": "При исправной массе напряжение между клеммой «-» лампы и клеммой «-» АКБ должно быть близко к 0.0В!",
          "winRule": "Замер падения напряжения (Volt Drop) под нагрузкой моментально находит окисленный контакт массы, который при прозвонке «омметром» без тока кажется целым."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери правильный алгоритм подключения мощного потребителя 240Вт от аккумулятора.",
          "chips": [
            {
              "id": "w1",
              "text": "Рассчитать ток нагрузки: I = 240Вт / 12В = 20 А"
            },
            {
              "id": "w2",
              "text": "Поставить предохранитель 25А в <=20см от клеммы +АКБ"
            },
            {
              "id": "w3",
              "text": "Протянуть медный провод сечением 4.0 мм² через силовое реле"
            },
            {
              "id": "w4",
              "text": "Подключить питание напрямую через тонкую кнопку в салоне 0.5мм²"
            }
          ],
          "correctOrder": [
            "w1",
            "w2",
            "w3"
          ],
          "hint": "Сначала расчёт тока, затем защита цепи предохранителем у самого АКБ, и силовой кабель через разгрузочное реле.",
          "winRule": "Предохранитель ставится максимально близко к АКБ и защищает именно проводку сечением с запасом (≥2.5-4.0мм² для 20А)."
        }
      ]
    },
    "2": {
      "title": "АКБ 12.6В и Ток утечки покоя (мА)",
      "instrument": "Battery & Milliamps Test",
      "mechanic": "defect_inspector",
      "badge": "Автоэлектрика / АКБ",
      "brief": "Проверяй состояние батареи по НРЦ, нагрузочной вилкой и лови паразитную утечку миллиамперметром в разрыв.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: Машина каждое утро за зиму высаживает новый аккумулятор в ноль! Найди грубую ошибку при поиске утечки тока или обслуживании АКБ.",
          "artifactTitle": "Замер утечки в боксе №2",
          "items": [
            {
              "id": "bat1",
              "code": "НРЦ после 8ч отстоя: 12.65 В (100% заряд)",
              "label": "Напряжение разомкнутой цепи (OCV)"
            },
            {
              "id": "bat2",
              "code": "Двери закрыты, машина в охране 30 минут (CAN заснула)",
              "label": "Подготовка электроники к замеру покоя"
            },
            {
              "id": "bat3",
              "code": "Включили стартёр при включённом в разрыв мультиметре 10А!",
              "label": "Действие электрика при проверке цепи"
            },
            {
              "id": "bat4",
              "code": "Поиск утечки методом падения мВ на предохранителях",
              "label": "Неразрывной способ поиска виновной цепи"
            }
          ],
          "defectId": "bat3",
          "fixedCode": "Никогда не крутить стартёр/фары через амперметр! Питание держим через перемычку и ждём сна CAN.",
          "hint": "Через щупы мультиметра в режиме 10А течёт ток — пусковой ток стартера (200-400А) мгновенно сожжёт предохранитель прибора!",
          "winRule": "В режиме амперметра (в разрыв клеммы АКБ) стартер включать категорически запрещено — используйте замер после засыпания CAN (норма 20-50 мА).",
          "failReasons": {
            "bat1": "12.65В — это 100% заряженная исправная свинцовая батарея.",
            "bat2": "Современные авто засыпают за 15-40 минут, только после этого замер корректный.",
            "bat4": "Метод падения милливольт на предохранителях без разрыва цепи — профессиональный приём!"
          }
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 2: После засыпания всех блоков общий ток утечки держится на уровне 420 мА (норма ≤ 50 мА). Вытаскивая по очереди предохранители, найди виновника!",
          "meterName": "FLUKE MILLIAMMETER",
          "normalSpec": "Норма тока покоя спящего автомобиля: 20 - 50 мА (0.02 - 0.05 А)",
          "points": [
            {
              "id": "pd1",
              "name": "Общий замер без предохранителя F5 (Свет салона)",
              "pin": "Slot F5 out",
              "reading": "415",
              "unit": "mA",
              "meterNote": "Ток практически не упал — свет салона уже спит."
            },
            {
              "id": "pd2",
              "name": "Общий замер без предохранителя F19 (Нештатная магнитола)",
              "pin": "Slot F19 out",
              "reading": "32",
              "unit": "mA",
              "meterNote": "Ток мгновенно упал с 420 мА до эталонных 32 мА! Красный+жёлтый провода магнитолы скручены на постоянный +30."
            },
            {
              "id": "pd3",
              "name": "Общий замер без предохранителя F22 (Центральный замок)",
              "pin": "Slot F22 out",
              "reading": "418",
              "unit": "mA",
              "meterNote": "Блок замка не потребляет лишнего."
            },
            {
              "id": "pd4",
              "name": "Напряжение АКБ под нагрузочной вилкой 100А (5 сек)",
              "pin": "Load Test",
              "reading": "10.8",
              "unit": "V",
              "meterNote": "Пластины АКБ держат нагрузку (норма ≥ 9.6-10.0В), сама батарея жива."
            }
          ],
          "faultId": "pd2",
          "hint": "Ищи цепь, отключение которой снизило паразитный ток с 420 мА до нормы 20-50 мА!",
          "winRule": "При выемке нужного предохранителя ток падает до нормы (20-50 мА) — так находят зависший блок или магнитолу, скрученную в обход замка зажигания (АСС)."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 3: Сдай эталонные нормативы приёмки аккумулятора и тока покоя в сервисе.",
          "previewType": "generic",
          "controls": [
            {
              "id": "ocv",
              "kind": "pills",
              "label": "НРЦ заряженного АКБ (100%)",
              "options": [
                "11.8 В",
                "12.6 В",
                "14.4 В"
              ],
              "init": "11.8 В",
              "targetVal": "12.6 В"
            },
            {
              "id": "leak",
              "kind": "range",
              "label": "Макс. допустимый ток покоя (мА)",
              "min": 10,
              "max": 200,
              "step": 10,
              "init": 150,
              "unit": " mA",
              "targetMin": 30,
              "targetMax": 50
            },
            {
              "id": "loadv",
              "kind": "pills",
              "label": "Минимальное напряжение под вилкой",
              "options": [
                "7.5 В",
                "10.0 В",
                "13.2 В"
              ],
              "init": "7.5 В",
              "targetVal": "10.0 В"
            }
          ],
          "hint": "14.4В — это при работающем генераторе, а заглушенный заряженный АКБ показывает 12.6–12.7В!",
          "winRule": "Эталон диагностики АКБ: НРЦ 12.6В, просадка под нагрузочной вилкой не ниже ~10.0В, ток покоя до 50 мА."
        }
      ]
    },
    "3": {
      "title": "Стартер, Втягивающее и Клеммы 50 / 30",
      "instrument": "Starter Circuit Rig",
      "mechanic": "code_or_formula_builder",
      "badge": "Автоэлектрика / Стартер",
      "brief": "Различай управляющую клемму 50 и силовой плюс 30, а также механические поломки бендикса и пятаков.",
      "rounds": [
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 1: Восстанови правильную последовательность запуска двигателя с момента поворота ключа в положение START.",
          "chips": [
            {
              "id": "st1",
              "text": "Подача +12В на тонкую клемму 50 втягивающего реле"
            },
            {
              "id": "st2",
              "text": "Сердечник выталкивает шестерню бендикса в венец маховика"
            },
            {
              "id": "st3",
              "text": "Силовые медные 'пятаки' замыкают клемму 30 на щёткодержатель"
            },
            {
              "id": "st4",
              "text": "Якорь стартера вращает коленвал через обгонную муфту"
            },
            {
              "id": "st5",
              "text": "Маховик разрывает массу двигателя"
            }
          ],
          "correctOrder": [
            "st1",
            "st2",
            "st3",
            "st4"
          ],
          "hint": "Сначала срабатывает электромагнит (клемма 50) -> шестерня входит в зацепление -> замыкаются силовые пятаки (+30) -> крутит мотор!",
          "winRule": "Только ПОСЛЕ зацепления бендикса с маховиком пятаки замыкают силовой +30 на мотор стартера."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 2: Ключ на старт — полная тишина, даже щелчка втягивающего реле нет! Проверь контрольной лампой (нагрузкой!) все точки запуска.",
          "meterName": "CONTROL LAMP 21W PROBE",
          "normalSpec": "На клемме 30 постоянно +12.6В, на 50 при повороте ключа — +12В",
          "points": [
            {
              "id": "sr1",
              "name": "Верхний медный болт втягивающего (клемма 30)",
              "pin": "Terminal 30",
              "reading": "12.55",
              "unit": "V (Лампа горит ярко)",
              "meterNote": "Силовой толстый плюс от АКБ приходит чисто."
            },
            {
              "id": "sr2",
              "name": "Тонкая фишка управления (клемма 50) при START",
              "pin": "Terminal 50",
              "reading": "0.0",
              "unit": "V (Нет сигнала)",
              "meterNote": "При повороте ключа сигнал +12В НЕ приходит на 50-ю клемму (замок / ингибитор АКПП / реле)!"
            },
            {
              "id": "sr3",
              "name": "Масса корпуса ДВС (от -АКБ на блок)",
              "pin": "Engine Ground",
              "reading": "0.08",
              "unit": "V drop",
              "meterNote": "Плетёнка массы двигателя в отличном состоянии."
            },
            {
              "id": "sr4",
              "name": "Напряжение АКБ в покое",
              "pin": "Battery",
              "reading": "12.58",
              "unit": "V",
              "meterNote": "Батарея полностью заряжена."
            }
          ],
          "faultId": "sr2",
          "hint": "Если щелчка нет и на клемму 50 не приходит +12В при ключе в START — сам стартер снимать рано, ищем обрыв до клеммы 50!",
          "winRule": "Проверка клеммы 50 при повороте ключа мгновенно делит неисправность: нет +12В -> ищем в замке/реле/АКПП; есть +12В, но тишина -> неисправен сам стартер."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "EL-304",
          "speaker": "Механик приёмки Артур",
          "telemetry": [
            {
              "label": "Клемма 50",
              "val": "+12В есть",
              "bad": false
            },
            {
              "label": "Звук",
              "val": "Электромотор жужжит вхолостую",
              "bad": true
            }
          ],
          "situation": "При повороте ключа стартер весело жужжит с высоким свистом, но коленвал двигателя вообще не проворачивается! Что вышло из строя?",
          "choices": [
            {
              "id": "a",
              "text": "Разрядился аккумулятор",
              "outcome": "Разряженный АКБ не даёт электромотору крутиться на высоких оборотах."
            },
            {
              "id": "b",
              "text": "Пробуксовывает обгонная муфта (бендикс) — не передаёт крутящий момент на венец маховика",
              "outcome": "Верно! Ролики бендикса заклинили или износились, мотор стартера крутит сам себя."
            },
            {
              "id": "c",
              "text": "Перегорел предохранитель ближнего света",
              "outcome": "Свет и бендикс не связаны."
            }
          ],
          "correctId": "b",
          "hint": "Якорь крутится бодро, но вращение не доходит до венца маховика...",
          "winRule": "Холостое жужжание стартера без прокрутки коленвала — классический признак пробуксовки обгонной муфты (бендикса)."
        }
      ]
    },
    "4": {
      "title": "Генератор, Диодный мост и Пульсации AC",
      "instrument": "Alternator Analyzer",
      "mechanic": "probe_diagnostic",
      "badge": "Автоэлектрика / Зарядка",
      "brief": "Замеряй бортовое напряжение 13.8–14.5В, лови пробой диодного моста через AC-пульсации и падение по плюсу B+.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: Аккумулятор закипает или быстро умирает, лампочки мерцают на холостых. Проведи полный тест генератора мультиметром (DC и AC)!",
          "meterName": "FLUKE TRUE RMS (DC/AC)",
          "normalSpec": "Зарядка DC: 13.8-14.5В | Допустимые пульсации AC: < 0.2 - 0.3 В",
          "points": [
            {
              "id": "alt1",
              "name": "Постоянное напряжение на клеммах АКБ (2000 об/мин)",
              "pin": "DC Volts",
              "reading": "13.35",
              "unit": "V DC",
              "meterNote": "Зарядка просевшая, но ещё не критический ноль."
            },
            {
              "id": "alt2",
              "name": "Переменная составляющая на B+ (AC Ripple)",
              "pin": "AC Volts",
              "reading": "1.18",
              "unit": "V AC",
              "meterNote": "Критичные 1.18В переменного тока! Пробит один из диодов выпрямительного моста — в сеть идёт переменка."
            },
            {
              "id": "alt3",
              "name": "Падение напряжения B+ (Гайка генератора -> +АКБ)",
              "pin": "Volt Drop +",
              "reading": "0.11",
              "unit": "V",
              "meterNote": "Силовой плюсовой провод от генератора до АКБ чистый."
            },
            {
              "id": "alt4",
              "name": "Масса (Корпус генератора -> -АКБ)",
              "pin": "Volt Drop -",
              "reading": "0.05",
              "unit": "V",
              "meterNote": "Масса на корпусе отличная."
            }
          ],
          "faultId": "alt2",
          "hint": "Переключи мультиметр в режим переменного тока (AC V): исправный диодный мост выпрямляет синусоиду почти без пульсаций (<0.3В AC).",
          "winRule": "Высокое напряжение в режиме AC (> 0.3-0.5В переменного тока) на клеммах АКБ на работающем моторе — безошибочный тест пробоя диодного моста."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: После включения фар и обогрева стекла напряжение на клеммах АКБ падает до 12.1В, хотя прямо на гайке генератора держится 14.3В! Где проблема?",
          "artifactTitle": "Цепь зарядки — Замер под полной нагрузкой",
          "items": [
            {
              "id": "c1",
              "code": "Шпилька B+ генератора -> Клемма +АКБ: ΔU = 2.2 В!",
              "label": "Силовая магистраль зарядки и опрессовка наконечника"
            },
            {
              "id": "c2",
              "code": "Натяжение приводного ремня генератора: без свиста",
              "label": "Механический привод шкива"
            },
            {
              "id": "c3",
              "code": "Лампа заряда на панели приборов: гаснет при пуске",
              "label": "Начальное возбуждение генератора"
            },
            {
              "id": "c4",
              "code": "Щётки регулятора напряжения: остаток 9 мм",
              "label": "Контакт коллекторных колец"
            }
          ],
          "defectId": "c1",
          "fixedCode": "Переобжим силового наконечника B+ / замена окисленного провода",
          "hint": "Генератор вырабатывает 14.3В, но до АКБ доходит 12.1В — значит 2.2В греют плохой силовой контакт между ними!",
          "winRule": "Разница больше 0.3В между клеммой генератора B+ и клеммой +АКБ под нагрузкой указывает на окисленный силовой провод или наконечник."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 3: Настрой эталонные пороги проверки исправного генератора под нагрузкой (ближний свет + печка).",
          "previewType": "generic",
          "controls": [
            {
              "id": "vmin",
              "kind": "range",
              "label": "Мин. допустимое напряжение зарядки",
              "min": 12.0,
              "max": 14.5,
              "step": 0.2,
              "init": 12.4,
              "unit": " В",
              "targetMin": 13.6,
              "targetMax": 14.0
            },
            {
              "id": "vmax",
              "kind": "range",
              "label": "Порог перезаряда (не выше)",
              "min": 13.5,
              "max": 16.5,
              "step": 0.5,
              "init": 16.0,
              "unit": " В",
              "targetMin": 14.5,
              "targetMax": 15.0
            },
            {
              "id": "ac",
              "kind": "pills",
              "label": "Макс. AC-пульсации моста",
              "options": [
                "до 0.3 В AC",
                "2.5 В AC",
                "12.0 В AC"
              ],
              "init": "2.5 В AC",
              "targetVal": "до 0.3 В AC"
            }
          ],
          "hint": "Рабочий коридор генератора 13.8–14.5В (до ~14.8 на AGM/морозе), выше 15В кипит электролит!",
          "winRule": "Стандарт зарядки 13.8–14.5В DC и < 0.3В AC защищает и батарею от недозаряда, и ЭБУ от скачков."
        }
      ]
    },
    "5": {
      "title": "Схемы DIN 72552 и Полярность Реле",
      "instrument": "DIN Relay Bench",
      "mechanic": "workshop_quest",
      "badge": "Автоэлектрика / DIN Реле",
      "brief": "Читай любые европейские электросхемы без словаря: клеммы 30/15/31/50 и 4/5-контактные реле.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "DIN-501",
          "speaker": "Установщик ПТФ Дима",
          "telemetry": [
            {
              "label": "Клемма 85/86",
              "val": "Катушка",
              "bad": false
            },
            {
              "label": "Замыкание 30-87",
              "val": "Искрит при включении",
              "bad": true
            }
          ],
          "situation": "Новичок собирал реле противотуманных фар и перепутал клеммы: подал постоянный силовой +30 прямо на управляющую обмотку, а на 87 повесил массу! Какие выводы 4-контактного реле отвечают строго за КАТУШКУ управления, а какие за СИЛОВУЮ коммутацию?",
          "choices": [
            {
              "id": "a",
              "text": "30 и 85 — катушка; 86 и 87 — силовые контакты",
              "outcome": "Опасно! Подача плюса и массы на 30 и 87 сделает прямое короткое замыкание!"
            },
            {
              "id": "b",
              "text": "85 и 86 — обмотка управления (~70-90 Ом), а 30 (вход) и 87 (выход) — силовые контакты на нагрузку",
              "outcome": "Точно по стандарту DIN 72552! Сопротивление катушки 85-86 легко прозвонить омметром."
            },
            {
              "id": "c",
              "text": "Любые две пары выводов одинаковы внутри реле",
              "outcome": "Внутри совершенно разные узлы — тонкая катушка и толстые силовые контакты."
            }
          ],
          "correctId": "b",
          "hint": "Запомни пару: управляющая катушка = 85 и 86; силовой ключ = 30 -> 87 (и 87а в 5-контактном).",
          "winRule": "В стандартном автомобильном реле 85-86 — это обмотка управления (60-100 Ом), а 30-87 — замыкаемые силовые контакты."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 2: Быстро расшифруй клеммы немецких и европейских автосхем по стандарту DIN 72552!",
          "bins": [
            {
              "id": "k30",
              "label": "30 (Пост. +АКБ)",
              "color": "rose"
            },
            {
              "id": "k15",
              "label": "15 (+ Зажигание)",
              "color": "amber"
            },
            {
              "id": "k31",
              "label": "31 (Масса / Минус)",
              "color": "cyan"
            }
          ],
          "cards": [
            {
              "tag": "Питание",
              "specimen": "Провод напрямую от +АКБ, есть напряжение даже без ключа",
              "context": "Аварийка, память ЭБУ, вход 30 на реле",
              "targetBin": "k30",
              "rule": "Шина 30 — постоянный плюс от аккумулятора."
            },
            {
              "tag": "Замок",
              "specimen": "Появляется +12В только при включённом зажигании ON",
              "context": "Приборная панель, питание катушек зажигания",
              "targetBin": "k15",
              "rule": "Шина 15 — плюс после включения замка зажигания."
            },
            {
              "tag": "Кузов",
              "specimen": "Коричневый провод на кузовной болт автомобиля",
              "context": "Возвратный минус всех потребителей",
              "targetBin": "k31",
              "rule": "Шина 31 по стандарту DIN — всегда чистая масса (-АКБ)."
            }
          ],
          "hint": "30 — всегда + от АКБ; 15 — после замка зажигания; 31 — масса (в немецких авто часто коричневый провод).",
          "winRule": "Зная коды DIN (30 постоянный +, 15 зажигание, 31 масса, 50 стартер), вы прочитаете любую схему Bosch/VAG/Mercedes за минуту."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери правильную схему подключения 4-контактного реле для питания звукового сигнала (клаксона).",
          "chips": [
            {
              "id": "rl1",
              "text": "Клемма 30 реле <- постоянный + от АКБ через пред 20А"
            },
            {
              "id": "rl2",
              "text": "Клемма 87 реле -> силовой плюс на клаксон (минус клаксона на 31)"
            },
            {
              "id": "rl3",
              "text": "Клемма 85/86 <- цепь управления от кнопки руля"
            },
            {
              "id": "rl4",
              "text": "Соединить перемычкой 30 прямо на 31 массу"
            }
          ],
          "correctOrder": [
            "rl1",
            "rl2",
            "rl3"
          ],
          "hint": "Сила идёт по пути Предохранитель -> 30 -> 87 -> Клаксон; управление приходит на 85 и 86.",
          "winRule": "Правильная распиновка разгружает кнопку на руле: через подрулевой шлейф текут миллиамперы катушки 85-86, а большой ток идёт по 30-87."
        }
      ]
    },
    "6": {
      "title": "Компьютерная диагностика OBD-II и DTC",
      "instrument": "OBD-II DLC Scanner",
      "mechanic": "triage_radar",
      "badge": "Автоэлектрика / OBD-II",
      "brief": "Расшифровывай коды неисправностей P/C/B/U, находи питание разъёма DLC и отличай датчик от проводки по 5В опоре.",
      "rounds": [
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 1: Сканер выдал 3 кода ошибок (DTC). Отправь каждый код к правильной системе автомобиля!",
          "bins": [
            {
              "id": "p",
              "label": "P — Двигатель/КПП",
              "color": "amber"
            },
            {
              "id": "c_b",
              "label": "C/B — Шасси и Кузов",
              "color": "cyan"
            },
            {
              "id": "u",
              "label": "U — Связь шин CAN",
              "color": "purple"
            }
          ],
          "cards": [
            {
              "tag": "Ошибка 1",
              "specimen": "P0302: Cylinder 2 Misfire Detected",
              "context": "Пропуски воспламенения во 2-м цилиндре",
              "targetBin": "p",
              "rule": "P (Powertrain) — двигатель и трансмиссия."
            },
            {
              "tag": "Ошибка 2",
              "specimen": "C0035: Left Front Wheel Speed Sensor",
              "context": "Горит лампа ABS на панели",
              "targetBin": "c_b",
              "rule": "C (Chassis) — ABS, ESP, рулевая рейка; B (Body) — подушки, климат, свет."
            },
            {
              "tag": "Ошибка 3",
              "specimen": "U0100: Lost Communication With ECM/PCM",
              "context": "Потеря связи с блоком управления по шине CAN",
              "targetBin": "u",
              "rule": "U (Network / Undefined) — ошибки связи между блоками по сетевым шинам."
            }
          ],
          "hint": "P = Powertrain, C = Chassis (ABS), B = Body, U = Network (CAN-шина).",
          "winRule": "Первая буква DTC моментально сужает поиск (P-мотор, C-шасси/ABS, B-кузов, U-сеть), а вторая цифра 0/1 отличает общий стандарт OBD от заводского."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 2: Диагностический сканер вообще не включается при подключении в разъём OBD-II! Прозвони ключевые пины 16-контактного DLC.",
          "meterName": "OBD-II DLC PIN PROBE",
          "normalSpec": "Pin 4 & 5 = Масса (0В) | Pin 16 = +12В пост. | Pin 6/14 = CAN",
          "points": [
            {
              "id": "ob1",
              "name": "Pin 4 (Масса шасси)",
              "pin": "DLC Pin 4",
              "reading": "0.01",
              "unit": "V (Масса есть)",
              "meterNote": "Кузовная масса присутствует."
            },
            {
              "id": "ob2",
              "name": "Pin 5 (Сигнальная масса)",
              "pin": "DLC Pin 5",
              "reading": "0.02",
              "unit": "V (Масса есть)",
              "meterNote": "Сигнальная масса исправна."
            },
            {
              "id": "ob3",
              "name": "Pin 16 (Постоянное питание +12В)",
              "pin": "DLC Pin 16",
              "reading": "0.00",
              "unit": "V (ОБРЫВ)",
              "meterNote": "Нет +12В на 16-м пине! Часто сгорает общий предохранитель с прикуривателем."
            },
            {
              "id": "ob4",
              "name": "Pin 6 / Pin 14 (CAN-High / CAN-Low)",
              "pin": "DLC 6 & 14",
              "reading": "60.2",
              "unit": "Ohm",
              "meterNote": "Сопротивление CAN-шины ровно 60 Ом — шина цела."
            }
          ],
          "faultId": "ob3",
          "hint": "Питание диагностического адаптера подаётся на крайний нижний контакт №16 (часто запараллелен с прикуривателем).",
          "winRule": "Перед приговором ЭБУ при отсутствии питания сканера проверьте массу на пинах 4, 5 и постоянные +12В на пине 16 (предохранитель DLC/прикуривателя)."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: Сразу на трёх разных датчиках двигателя (MAP, ДПДЗ и давления топлива) опорное напряжение упало с 5.0В до 0.2В! Найди реальную причину.",
          "artifactTitle": "5V Reference Rail — ECU Diagram",
          "items": [
            {
              "id": "r1",
              "code": "Гипотеза А: Сгорели одновременно все 3 дорогих датчика",
              "label": "Вывод стажёра по кодам низкого сигнала"
            },
            {
              "id": "r2",
              "code": "Шина 5V Reference: Датчик давления фреона закоротил внутри на массу",
              "label": "Общая опорная линия 5В внутри ЭБУ"
            },
            {
              "id": "r3",
              "code": "Давление топлива в рампе: 3.8 бар",
              "label": "Механический замер манометром"
            },
            {
              "id": "r4",
              "code": "Масса датчиков (Sensor GND): целостная",
              "label": "Возврат сигнала в ЭБУ"
            }
          ],
          "defectId": "r2",
          "fixedCode": "Отключаем фишки датчиков по одной — как только 5.0В вернутся, виновник найден!",
          "hint": "Много датчиков сидят на ОДНОЙ общей шине питания 5В (5V Reference) от стабилизатора в ЭБУ — один коротыш роняет всех!",
          "winRule": "Если сразу несколько 5-вольтовых датчиков показывают 0В или 0.2В — один из датчиков (или жгут) замкнул общую опорную линию 5V на массу."
        }
      ]
    },
    "7": {
      "title": "Осциллограф: ДПКВ (Индуктивный) vs ДПРВ (Холл)",
      "instrument": "Dual-Channel Oscilloscope",
      "mechanic": "defect_inspector",
      "badge": "Автоэлектрика / Осциллограф",
      "brief": "Читай живые осциллограммы фаз ГРМ: синусоиду 60-2 индуктивного ДПКВ и прямоугольный меандр 0-5В датчика Холла.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: Мотор троит и глохнет, ошибок по сканеру нет! Осмотри осциллограмму коленвала (ДПКВ) и распредвала (ДПРВ) и найди механический дефект сигнала.",
          "artifactTitle": "CH1 CKP (Sine 60-2) + CH2 CMP (Hall 0-5V)",
          "items": [
            {
              "id": "os1",
              "code": "CH1 CKP (Индуктивный): Синусоида ±12В, 58 зубьев + 2 пропуск",
              "label": "Основной задающий диск 60-2"
            },
            {
              "id": "os2",
              "code": "CH1 Амплитуда на 14-м зубе: провал в 0В + срыв синусоиды",
              "label": "Локальный сбой на одном участке оборота диска"
            },
            {
              "id": "os3",
              "code": "CH2 CMP (Холл): Чёткий меандр ровно 0.0В <-> 5.0В",
              "label": "Сигнал датчика фаз распредвала"
            },
            {
              "id": "os4",
              "code": "Корпус экрана: Шум < 0.05В",
              "label": "Экранирование косы датчика коленвала"
            }
          ],
          "defectId": "os2",
          "fixedCode": "Очистить/заменить погнутый зуб задающего диска или удалить стружку с магнита ДПКВ!",
          "hint": "Сканер показывает только средние обороты, а осциллограф вживую ловит один сломанный зуб или биение задающего диска!",
          "winRule": "Осциллограф видит то, что слепо пропускает сканер: погнутый зуб, металлическую стружку на магните или смещение фаз (рассинхронизацию зуба ДПКВ и фронта ДПРВ)."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Как проверить 3-контактный датчик Холла (ДПРВ) обычным мультиметром/осциллографом при подозрении на обрыв?",
          "chips": [
            {
              "id": "hl1",
              "text": "Найти 3 пина: Питание (+5В или +12В), Масса (0В) и Сигнал"
            },
            {
              "id": "hl2",
              "text": "Проверить питание и массу на фишке при включённом зажигании"
            },
            {
              "id": "hl3",
              "text": "Вращать коленвал (или подносить сталь) — сигнал должен скакать 0В <-> 5В"
            },
            {
              "id": "hl4",
              "text": "Измерять сопротивление между всеми пинами датчика мегаомметром"
            }
          ],
          "correctOrder": [
            "hl1",
            "hl2",
            "hl3"
          ],
          "hint": "Активный датчик Холла содержит микросхему — его проверяют под питанием по скачку напряжения 0↔5В, а не омметром!",
          "winRule": "У 3-пинового датчика Холла всегда есть Питание, Масса и прямоугольный выход 0..5В. Проверять его омметром бесполезно и опасно."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 3: Сравни два канала осциллографа на незаводящемся авто и найди нерабочий датчик.",
          "meterName": "OSCILLOSCOPE 2CH CAPTURE",
          "normalSpec": "При прокрутке стартером CKP даёт переменный сигнал, CMP меняет уровень 0-5V",
          "points": [
            {
              "id": "sc1",
              "name": "ДПКВ Пин 1-2 (Индуктивный 60-2)",
              "pin": "CH1 AC",
              "reading": "±3.8 V (Плавная синусоида)",
              "unit": "Peak",
              "meterNote": "На прокрутке стартёром индуктивный ДПКВ выдаёт уверенную переменную синусоиду с пропуском 2 зубьев."
            },
            {
              "id": "sc2",
              "name": "ДПРВ Пин 2 Сигнальный (Холл)",
              "pin": "CH2 DC",
              "reading": "0.00 V (Мёртвая прямая)",
              "unit": "Flatline",
              "meterNote": "Питание 5В на Пин 1 есть, но сигнальный провод лежит намертво на 0.0В при вращении вала!"
            },
            {
              "id": "sc3",
              "name": "ДПРВ Пин 1 Питание",
              "pin": "5V Ref",
              "reading": "5.01",
              "unit": "V DC",
              "meterNote": "Опорное питание от ЭБУ приходит нормально."
            },
            {
              "id": "sc4",
              "name": "ДПРВ Пин 3 Масса",
              "pin": "GND",
              "reading": "0.02",
              "unit": "V",
              "meterNote": "Масса на датчике идеальная."
            }
          ],
          "faultId": "sc2",
          "hint": "Если питание 5В и масса приходят на датчик Холла, а на выходе при прокрутке вечный ноль (или вечные 5В) — датчик мёртв!",
          "winRule": "Мёртвая прямая линия на сигнальном проводе датчика Холла при исправных +5В и массе однозначно приговаривает сам датчик."
        }
      ]
    },
    "8": {
      "title": "Сетевая шина CAN-Bus: 60 Ом и Дифсигнал",
      "instrument": "CAN-Bus Bench Tester",
      "mechanic": "bench_tuner",
      "badge": "Автоэлектрика / CAN-Bus",
      "brief": "Измеряй дифференциальные уровни CAN-High/CAN-Low (2.5 ± 1.0В) и проверяй согласующие резисторы 60 Ом.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: Выставь эталонные параметры высокоскоростной шины High-Speed CAN (ISO 11898) при выключенном АКБ (сопротивление двух 120-Омных терминаторов в параллели) и рабочие уровни напряжения при передаче.",
          "previewType": "generic",
          "controls": [
            {
              "id": "ohm",
              "kind": "pills",
              "label": "Сопротивление CAN-H <-> CAN-L (без АКБ)",
              "options": [
                "30 Ом",
                "60 Ом",
                "120 Ом",
                "OL (Обрыв)"
              ],
              "init": "120 Ом",
              "targetVal": "60 Ом"
            },
            {
              "id": "canh",
              "kind": "range",
              "label": "Среднее напряжение CAN-High",
              "min": 1.0,
              "max": 4.5,
              "step": 0.2,
              "init": 1.6,
              "unit": " В",
              "targetMin": 2.4,
              "targetMax": 3.5
            },
            {
              "id": "canl",
              "kind": "range",
              "label": "Среднее напряжение CAN-Low",
              "min": 0.5,
              "max": 3.5,
              "step": 0.2,
              "init": 3.1,
              "unit": " В",
              "targetMin": 1.5,
              "targetMax": 2.4
            }
          ],
          "hint": "Два резистора по 120 Ом на концах шины соединены параллельно: 120 / 2 = 60 Ом! В доминантном бите CAN-H прыгает вверх (2.5->3.5В), а CAN-L зеркально вниз (2.5->1.5В).",
          "winRule": "Идеальная шина CAN даёт 60 Ом между пинами 6 и 14 DLC (при снятой клемме АКБ), а в сумме CAN-H + CAN-L всегда около 5.0 Вольт!",
          "failRule": "120 Ом говорит об обрыве одного из конечных блоков/магистрали, а <40 Ом — о замыкании."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 2: На приборной панели загорелась вся гирлянда (ABS, EPS, коробка в аварии), блоки потеряли связь. Сделай замер на витой паре (пины 6 и 14)!",
          "meterName": "CAN-BUS ANALYZER",
          "normalSpec": "60 Ом (без АКБ); в сумме CAN-H + CAN-L ≈ 5.0 В; нет КЗ на массу/плюс",
          "points": [
            {
              "id": "cn2",
              "name": "Замыкание CAN-H на Массу",
              "pin": "Pin 6 - GND",
              "reading": "OL (Бесконечность)",
              "unit": "",
              "meterNote": "КЗ на массу отсутствует."
            },
            {
              "id": "cn1",
              "name": "Сопротивление CAN-H <-> CAN-L",
              "pin": "Pin 6 - Pin 14 (АКБ снят)",
              "reading": "121.4",
              "unit": "Ohm",
              "meterNote": "Сопротивление ровно 120 Ом вместо 60! Шина разорвана на 2 сегмента и видит только один терминатор."
            },
            {
              "id": "cn3",
              "name": "Замыкание CAN-L на +12В",
              "pin": "Pin 14 - +12V",
              "reading": "0.0",
              "unit": "V shift",
              "meterNote": "Постороннего плюса на шине нет."
            }
          ],
          "faultId": "cn1",
          "hint": "Когда омметр на отключённом АКБ показывает ровно 120 Ом — значит один из двух терминаторов (или вся ветка к нему) отрезан!",
          "winRule": "120 Ом на разъёме OBD-II вместо 60 Ом означает обрыв магистрали шины CAN (или отключение конечного блока-терминатора ЭБУ/Приборки)."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "CAN-802",
          "speaker": "Диагност Сергей",
          "telemetry": [
            {
              "label": "CAN-Low",
              "val": "0.00 В к массе",
              "bad": true
            },
            {
              "label": "Связь",
              "val": "Нет связи со всем авто",
              "bad": true
            }
          ],
          "situation": "После заезда в глубокую лужу CAN-Low лёг на 0.00В (замкнул на массу в сгнившем разъёме под порогом), и НИ ОДИН блок не отвечает, кроме отключения узлов по очереди. Как быстро локализовать проблемный сегмент?",
          "choices": [
            {
              "id": "a",
              "text": "Искать разъёмы-разветвители (Star Connector) и отсоединять ветки блоков по одной, глядя на возврат 2.4В / 60 Ом",
              "outcome": "Абсолютно верно! Отключение проблемной ветки мгновенно оживляет всю остальную шину."
            },
            {
              "id": "b",
              "text": "Подать принудительно +12В на провод CAN-Low чтобы «прожечь» окисел",
              "outcome": "Смертельный совет! +12В на низковольтном трансивере сожгут микросхемы во всех ЭБУ!"
            },
            {
              "id": "c",
              "text": "Срезать витую пару и проложить обычный одинарный нескрученный провод",
              "outcome": "Без скрутки (витой пары) электромагнитные помехи положат передачу данных."
            }
          ],
          "correctId": "a",
          "hint": "Никогда не подавайте +12В в CAN! Работайте методом последовательного отключения веток на хабе / звезде.",
          "winRule": "Шину CAN проверяют отключением ветвей через соединительные хабы и ремонтом строго с сохранением шага витой пары."
        }
      ]
    },
    "9": {
      "title": "Кузовная электроника BCM: ШИМ и Концевики",
      "instrument": "BCM Output Bench",
      "mechanic": "probe_diagnostic",
      "badge": "Автоэлектрика / BCM",
      "brief": "Диагностируй умный блок комфорта BCM: ШИМ-регулировку света, массу датчиков дверей и парковку стеклоочистителей.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: Дворники машут без остановки или замирают строго посередине лобового стекла, как только отпускаешь подрулевой рычаг! Прозвони тракт доводчика.",
          "meterName": "BCM WIPER DIAGNOSTIC",
          "normalSpec": "Постоянный +15В приходит на парковочный контакт (Park Switch) внутри редуктора",
          "points": [
            {
              "id": "wp1",
              "name": "Питание 1-й скорости (От реле BCM)",
              "pin": "Wiper Pin 4",
              "reading": "12.5",
              "unit": "V (при ON)",
              "meterNote": "При включении рычага питание поступает, мотор крутит."
            },
            {
              "id": "wp2",
              "name": "Парковочный контакт доводчика в редукторе (Park Switch)",
              "pin": "Wiper Pin 2",
              "reading": "OL / Окислен",
              "unit": "Обрыв",
              "meterNote": "Обгорела/закисла дорожка доводчика внутри крышки редуктора! Мотор не дотягивает щётки вниз после выключения."
            },
            {
              "id": "wp3",
              "name": "Масса мотор-редуктора",
              "pin": "Pin 1 GND",
              "reading": "0.03",
              "unit": "V drop",
              "meterNote": "Масса на кузов в полном порядке."
            }
          ],
          "faultId": "wp2",
          "hint": "Кто сообщает моторчику и реле дворников о том, что щётки вернулись в нижнюю зону парковки?",
          "winRule": "За возврат дворников в нижнее положение отвечает скользящий парковочный контакт внутри крышки редуктора и постоянный +15 на нём."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: После замены ламп на дешёвые светодиодные поворотник моргает в 2 раза чаще, а габариты гаснут через 3 секунды после пуска! Инспектируй логику BCM.",
          "artifactTitle": "BCM Power Driver Log",
          "items": [
            {
              "id": "bc1",
              "code": "Cold/Hot Diagnostics: Ток LED = 0.25A < Порог 1.2A -> Защита!",
              "label": "Контроль целостности нити накаливания блоком BCM"
            },
            {
              "id": "bc2",
              "code": "PWM Duty Cycle (ДХО): 65% скважность сигнала",
              "label": "Управление яркостью без перегрева"
            },
            {
              "id": "bc3",
              "code": "Door Switch Output: Посадка входа BCM на массу при открытии",
              "label": "Классическая схема концевика двери"
            },
            {
              "id": "bc4",
              "code": "Fuse Box Rating: 15A Mini Blade",
              "label": "Предохранитель габаритной линии"
            }
          ],
          "defectId": "bc1",
          "fixedCode": "Установить LED с резисторами CANBUS (обманка) или перекодировать BCM под LED",
          "hint": "Умный MOSFET-драйвер в BCM замеряет ток каждой лампы — слишком малый ток дешёвого LED он принимает за перегоревшую нить!",
          "winRule": "Современные блоки BCM контролируют ток драйверов: для LED без ошибки нужна кодировка блока (если доступна) либо правильная нагрузка CANBUS."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Раздели элементы цепи управления BCM на ВХОДЫ (сигналы датчиков) и ИСПОЛНИТЕЛИ (ШИМ/силовые выходы)!",
          "bins": [
            {
              "id": "in",
              "label": "ВХОД (Датчик / Кнопка)",
              "color": "cyan"
            },
            {
              "id": "out",
              "label": "ВЫХОД (Нагрузка / ШИМ)",
              "color": "amber"
            }
          ],
          "cards": [
            {
              "tag": "Дверь",
              "specimen": "Микрик замка водительской двери (сигнал открыто/закрыто)",
              "context": "Слаботочный минус к блоку BCM",
              "targetBin": "in",
              "rule": "Микрики замков и кнопки — это слаботочные ВХОДЫ состояния для логики BCM."
            },
            {
              "tag": "Освещение",
              "specimen": "Плавное затухание плафона салона через PWM-сигнал",
              "context": "Силовой ключ транзистора (MOSFET)",
              "targetBin": "out",
              "rule": "Силовой PWM (ШИМ) на лампы и соленоиды — это ВЫХОД блока BCM."
            },
            {
              "tag": "Ручник",
              "specimen": "Концевик стояночного тормоза под рычагом",
              "context": "Подаёт массу на вход панели/BCM",
              "targetBin": "in",
              "rule": "Любой концевик и кнопка передают статус на вход ЭБУ."
            }
          ],
          "hint": "Кнопки и микрики информируют блок (Вход); лампы, моторы и соленоиды получают питание (Выход).",
          "winRule": "В блоке BCM нет механических предохранителей на каждую мелочь: выходы защищают электронные ключи (сброс ошибки после устранения КЗ)."
        }
      ]
    },
    "10": {
      "title": "Итоговый релиз Автоэлектрики: Поиск КЗ и Ремонт жгута",
      "instrument": "Master Auto-Electrical Bay",
      "mechanic": "workshop_quest",
      "badge": "Автоэлектрика / Финал",
      "brief": "Локализуй жёсткое короткое замыкание лампой-ограничителем без сжигания проводки и восстанови жгут по OEM-стандарту.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "EL-FIN",
          "speaker": "Главный диагност Виктор",
          "telemetry": [
            {
              "label": "Предохранитель F14",
              "val": "Сгорает мгновенно",
              "bad": true
            },
            {
              "label": "Жгутов в авто",
              "val": "28 метров под ковром",
              "bad": false
            }
          ],
          "situation": "Как только вставляешь новый предохранитель F14 (15А) — он тут же выстреливает с искрой! Клиент предлагает вставить «жучок» из толстой медной проволоки или предохранитель на 40А, чтобы увидеть откуда пойдёт дым. Каков правильный безопасный метод электрика?",
          "choices": [
            {
              "id": "a",
              "text": "Вставить «жучок» — сразу найдём место по запаху горелой изоляции",
              "outcome": "Пожар автомобиля гарантирован! Расплавится весь салонный жгут стоимостью сотни тысяч."
            },
            {
              "id": "b",
              "text": "Подключить вместо F14 ограничительную лампу накаливания H7 (55W) или 21W — пока КЗ активно, лампа горит ярко (ток ~4.5А), проводка холодная, а при отключении КЗ-участка лампа тухнет!",
              "outcome": "Золотой метод! Ни один провод не нагреется, а отключение разъёмов сразу погасит контрольную лампу на виновнике."
            },
            {
              "id": "c",
              "text": "Постучать по всем реле молотком",
              "outcome": "Не спасёт от КЗ в перетёртом проводе под капотом."
            }
          ],
          "correctId": "b",
          "hint": "Какой прибор за 100 рублей ставят ВМЕСТО сгоревшего предохранителя, чтобы ограничить ток на безопасном уровне до момента устранения КЗ?",
          "winRule": "Лампа-ограничитель (21W или H4/H7 55W) вместо предохранителя безопасно ограничивает ток до ~2-4.5А и служит идеальным индикатором момента устранения КЗ."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: Нашли перетёртый провод датчика ABS в колёсной арке. Год назад там кто-то уже чинил проводку, и сейчас внутри зелёная труха! Найди преступление против автоэлектрики.",
          "artifactTitle": "Wheel Arch Harness — Repair Forensic",
          "items": [
            {
              "id": "jn1",
              "code": "Участки сгиба: мягкий автомобильный провод ПГВА",
              "label": "Марка применённого ремонтного провода"
            },
            {
              "id": "jn2",
              "code": "Соединение: скрутка + пайка активной паяльной кислотой + простая ПВХ-изолента",
              "label": "Способ сращивания проводов на улице под днищем"
            },
            {
              "id": "jn3",
              "code": "Фиксация: пластиковая гофра + штатные клипсы без натяга",
              "label": "Крепление отремонтированного жгута"
            },
            {
              "id": "jn4",
              "code": "Запас длины: плавная петля хода подвески",
              "label": "Учёт хода стойки амортизатора"
            }
          ],
          "defectId": "jn2",
          "fixedCode": "Неизолированная медная гильза (обжим кримпером) + клеевая термоусадка!",
          "hint": "Активный флюс/кислота разъедает медь за одну зиму, а обычная ПВХ-изолента пропускает реагенты внутрь!",
          "winRule": "Паяльная кислота под днищем запрещена (сгниёт медь)! Автожгуты обжимают гильзами и закрывают клеевой термоусадкой с полной герметизацией."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери безотказный финишный алгоритм ремонта перебитого провода в подкапотном пространстве по OEM-стандарту.",
          "chips": [
            {
              "id": "em1",
              "text": "Надеть кусок клеевой термоусадки заранее на провод"
            },
            {
              "id": "em2",
              "text": "Зачистить жилы стриппером (не надрезая медь) и обжать гильзой кримпером"
            },
            {
              "id": "em3",
              "text": "Сместить и усадить термоусадку с выходом клея по краям, убрать в гофру"
            },
            {
              "id": "em4",
              "text": "Обмотать мокрой скруткой синей изолентой без зачистки окислов"
            }
          ],
          "correctOrder": [
            "em1",
            "em2",
            "em3"
          ],
          "hint": "Не забудь надеть термоусадку ДО обжима гильзы, затем качественный кримп и герметичный нагрев феном!",
          "winRule": "Механический обжим гильзой + клеевая термоусадка выдерживают вибрацию, воду и соли десятилетиями."
        }
      ]
    },
    "11": {
      "title": "Системы безопасности SRS Airbag и датчики ABS/ESP",
      "instrument": "SRS Safety & ABS Tester",
      "mechanic": "probe_diagnostic",
      "badge": "Автоэлектрика / SRS и ABS",
      "brief": "Соблюдай взрывобезопасность жёлтых цепей SRS (2.2 Ом) и проверяй активные токовые датчики ABS.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: На панели горит лампа Airbag (высокое сопротивление водительской подушки). Проверь точки цепи с имитатором 2.2 Ом (АКБ уже отключена 5 мин!) и найди обрыв!",
          "meterName": "SRS SCANNER + 2.2 Ω SIMULATOR",
          "normalSpec": "Норма контура с резистором: 2.0–2.4 Ом (без Active DTC)",
          "points": [
            {
              "id": "srs_bat",
              "name": "Подготовка АКБ и выдержка",
              "pin": "АКБ (-) снята",
              "reading": "0.0 В / 5 мин",
              "unit": "SAFE",
              "meterNote": "Резервные конденсаторы блока SRS гарантированно разряжены."
            },
            {
              "id": "srs_ecu",
              "name": "Вход ДО часовой пружины",
              "pin": "Имитатор 2.2 Ом",
              "reading": "2.2 Ом",
              "unit": "PASS",
              "meterNote": "Ошибка ушла в историю — сам блок SRS и жгут торпедо исправны!"
            },
            {
              "id": "srs_coil",
              "name": "Разъём ПОСЛЕ шлейфа руля",
              "pin": "Имитатор на руле",
              "reading": "> 99.9 Ом (OL)",
              "unit": "ОБРЫВ!",
              "meterNote": "При повороте руля обрывается дорожка внутри подрулевого шлейфа (улитки)!"
            },
            {
              "id": "srs_fuse",
              "name": "Питание блока SRS (IGN)",
              "pin": "Pin 15 (+12V)",
              "reading": "12.5",
              "unit": "В",
              "meterNote": "Штатное напряжение питания при включении зажигания в норме."
            }
          ],
          "faultId": "srs_coil",
          "hint": "Если резистор 2.2 Ом перед шлейфом убирает ошибку, а после шлейфа сканер снова видит обрыв — дефект точно внутри подрулевого шлейфа!",
          "winRule": "Имитатор 2.2 Ом позволяет безопасно локализовать обрыв подрулевого шлейфа («улитки»), не рискуя подать ток омметра на живой пиропатрон!",
          "failReasons": {
            "srs_bat": "Подготовка клеммы АКБ и выдержка 5 минут выполнены верно.",
            "srs_ecu": "Показание 2.2 Ом на входе доказывает исправность блока SRS и проводки от него.",
            "srs_fuse": "Питание блока +12.5 В в норме."
          }
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "SAFETY-SRS",
          "speaker": "Мастер участка",
          "telemetry": [
            {
              "label": "Разъём",
              "val": "Жёлтый (Airbag)",
              "bad": true
            },
            {
              "label": "Прибор",
              "val": "Омметр 200 Ом",
              "bad": true
            }
          ],
          "prompt": "Раунд 2: Начинающий слесарь переключил мультиметр в режим ОММЕТРА и хочет напрямую померить сопротивление на контактах самой подушки руля! Твои действия?",
          "situation": "Учебный бокс АМК: снятая водительская подушка SRS в руках у практиканта перед тестом.",
          "choices": [
            {
              "id": "srs_stop",
              "text": "Немедленно запретить! Батарея омметра может инициировать подрыв пиропатрона в руках",
              "outcome": "Жизнь и здоровье спасены! Для теста линии используют ТОЛЬКО тарированный имитатор 2.0–2.2 Ом при отключённом патроне."
            },
            {
              "id": "srs_low",
              "text": "Разрешить, если выбрать предел 200 Ом — там напряжение маленькое",
              "outcome": "ВЗРЫВ! Любой режим омметра подаёт измерительный ток через щупы прямо на нить воспламенителя."
            },
            {
              "id": "srs_key",
              "text": "Разрешить замер омметром, не выключая зажигание в машине",
              "outcome": "Критическое нарушение ТБ: риск нештатного срабатывания подушки и поломки блока SRS."
            }
          ],
          "correctId": "srs_stop",
          "hint": "Как работает омметр в мультиметре? Он всегда пускает ток от внутренней батарейки в цепь!",
          "winRule": "ЗОЛОТОЕ ПРАВИЛО SRS: пиропатроны НИКОГДА не прозванивают омметром! Перед снятием жёлтых фишек отключают минус АКБ и ждут 3–5 минут."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Продиагностируй показания датчиков ABS в потоке данных (Live Data) при вращении колеса!",
          "bins": [
            {
              "id": "abs_ok",
              "label": "Датчик ABS исправен",
              "color": "emerald"
            },
            {
              "id": "abs_bad",
              "label": "Дефект цепи / зазора",
              "color": "rose"
            }
          ],
          "cards": [
            {
              "tag": "Токовый датчик (Холла)",
              "specimen": "Прямоугольный сигнал переключает уровень 7 мА <-> 14 мА ровно при вращении колеса",
              "context": "Все 4 колеса показывают одинаковую скорость 18 км/ч",
              "targetBin": "abs_ok",
              "rule": "Активные двухпроводные датчики Холла передают данные переключением тока ровно между 7 мА и 14 мА."
            },
            {
              "tag": "Пропадание сигнала",
              "specimen": "На скорости 40 км/ч переднее правое колесо внезапно падает до 0 км/ч",
              "context": "Ошибка C0037 (обрыв/замыкание или огромный зазор до мишени)",
              "targetBin": "abs_bad",
              "rule": "Провал скорости одного колеса до нуля вызывает ложное срабатывание ABS и ошибку."
            },
            {
              "tag": "Повреждение мишени",
              "specimen": "Накопление металлической стружки и перекос магнитного кольца ступичного подшипника",
              "context": "Плавающий сбой пульсаций тока на малой скорости",
              "targetBin": "abs_bad",
              "rule": "Магнитное кольцо-мишень и зазор к датчику должны быть абсолютно чистыми."
            }
          ],
          "hint": "Нормальный активный датчик даёт 7/14 мА и ровную скорость, а провалы в 0 км/ч или стружка на магнитном кольце — дефект.",
          "winRule": "Активный датчик ABS тестируют осциллографом/сканером по импульсам тока 7–14 мА, состоянию жгута в арке и чистоте задающего магнитного кольца."
        }
      ]
    },
    "12": {
      "title": "Квалификационная аттестация: Аудит 4 контуров автоэлектрики",
      "instrument": "AutoElectric Qualification Stand",
      "mechanic": "bench_tuner",
      "badge": "Автоэлектрика / Аттестация",
      "brief": "Замерь энергобаланс, проверь CAN-шину (60 Ом) и закрой ремонт контрольной поездкой без DTC.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: Откалибруй эталонную карту выпускного контроля (Health Check) полностью исправного автомобиля: НРЦ АКБ 12.6–12.7 В, зарядка генератора ~14.2 В, сопротивление CAN-шины 60 Ом.",
          "previewType": "generic",
          "controls": [
            {
              "id": "bat",
              "kind": "range",
              "label": "Напряжение покоя АКБ (НРЦ)",
              "min": 11.4,
              "max": 13.0,
              "step": 0.2,
              "init": 11.8,
              "unit": " В",
              "targetMin": 12.6,
              "targetMax": 12.8
            },
            {
              "id": "alt",
              "kind": "range",
              "label": "Напряжение зарядки (ДВС заведён)",
              "min": 12.0,
              "max": 15.6,
              "step": 0.2,
              "init": 12.4,
              "unit": " В",
              "targetMin": 13.8,
              "targetMax": 14.4
            },
            {
              "id": "can",
              "kind": "pills",
              "label": "Сопротивление CAN (пины 6-14, АКБ снята)",
              "options": [
                "120 Ом (обрыв)",
                "60 Ом (оба 120 Ом в норме)"
              ],
              "init": "120 Ом (обрыв)",
              "targetVal": "60 Ом (оба 120 Ом в норме)"
            }
          ],
          "hint": "АКБ должна держать 12.6 В, генератор выдаёт 13.8–14.4 В, а два терминатора 120 Ом в шине CAN в параллели дают ровно 60 Ом.",
          "winRule": "Эталон энергосети и шины подтверждён: АКБ 12.6 В + Генератор 13.8–14.4 В + CAN 60 Ом!",
          "failRule": "11.8 В — разряженная АКБ, а 120 Ом на шине CAN говорит об обрыве одного из терминаторов."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Выстрой правильную последовательность комплексной диагностики автомобиля с множественными ошибками (WorldSkills / АМК)!",
          "chips": [
            {
              "id": "aq1",
              "text": "1. Базовое питание: АКБ 12.6 В, падение масс и зарядка 14.2 В"
            },
            {
              "id": "aq2",
              "text": "2. Общее сканирование всех блоков (Full Health Report & Freeze Frame)"
            },
            {
              "id": "aq3",
              "text": "3. Инструментальная проверка гипотезы мультиметром/осциллографом до замены"
            },
            {
              "id": "aq4",
              "text": "4. Ремонт, сброс DTC и контрольный тест Live Data под нагрузкой"
            }
          ],
          "correctOrder": [
            "aq1",
            "aq2",
            "aq3",
            "aq4"
          ],
          "hint": "Без питания блоки врут ошибки! Сначала проверяем питание/массы, затем читаем все блоки, доказываем дефект приборами, чиним и проверяем на ходу.",
          "winRule": "Системная диагностика начинается с питания и полной карты блоков, а заканчивается повторным тестом под нагрузкой после сброса DTC."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AE-EXAM-12",
          "speaker": "Эксперт ОТК",
          "telemetry": [
            {
              "label": "Жгут",
              "val": "Запаян + термоусадка",
              "bad": false
            },
            {
              "label": "Проверка",
              "val": "Только Clear DTC",
              "bad": true
            }
          ],
          "prompt": "Раунд 3: Провод датчика восстановлен, сканером ошибки стёрты на заглушённом моторе. Можно ли сразу отдавать ключи клиенту?",
          "situation": "Финальный этап аттестационного ремонта в боксе автоэлектрики АМК.",
          "choices": [
            {
              "id": "qa_retest",
              "text": "Нет! Надо завести авто, дать рабочую нагрузку / тестовый заезд и убедиться по Live Data, что коды не вернулись",
              "outcome": "Образцовая приёмка! Все сигналы чистые, ошибки не появились — выдан официальный протокол ОТК."
            },
            {
              "id": "qa_ship",
              "text": "Да, лампа Check Engine на панели погасла сразу после нажатия Clear DTC",
              "outcome": "Через 2 км пробега в рабочем режиме неисправность может вылезти повторно — гарантийный возврат!"
            },
            {
              "id": "qa_cut",
              "text": "Отключить лампу Check Engine в приборке, чтобы точно не горела",
              "outcome": "Фальсификация диагностики — грубейшее нарушение стандартов автосервиса."
            }
          ],
          "correctId": "qa_retest",
          "hint": "Кнопка «Очистить ошибки» просто стирает память блока, но не доказывает, что система ожила в рабочем режиме.",
          "winRule": "Подтверждением ремонта служит не сброс DTC, а отсутствие новых ошибок и эталонные графики Live Data при контрольном запуске и тесте."
        }
      ]
    },
    "13": {
      "title": "Тренажёр: Осциллограф в автодиагностике: снятие осциллограмм ДПКВ, Д",
      "instrument": "Мотор-тестер / Осциллограф (USB Autoscope)",
      "mechanic": "workshop_quest",
      "badge": "AUTOELECTRIC / Урок 13",
      "brief": "Чтение индуктивных (AC) и Холла (прямоугольных 0–5В) сигналов датчиков коленвала и распредвала, выявление растяжения цепи ГРМ.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-131",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 13/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Осциллограф в автодиагностике: снятие осциллограмм ДПКВ, ДПРВ и синхронизация фаз ГРМ»: Какую форму сигнала выдаёт исправный индуктивный ДПКВ на зубчатом венце 60-2?",
          "choices": [
            {
              "id": "a",
              "text": "Синусоиду с пропуском двух зубьев (маркер ВМТ)",
              "outcome": "Индуктивный датчик наводит переменную синусоиду при прохождении зубьев."
            },
            {
              "id": "b",
              "text": "Постоянные 12 В",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Прямоугольный ШИМ 5 В",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Отрицательный ноль",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Индуктивный датчик наводит переменную синусоиду при прохождении зубьев.",
          "winRule": "Отлично! Примените правило: Индуктивный датчик наводит переменную синусоиду при прохождении зубьев."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Осциллограф в автодиагностике: снятие осциллограмм ДПКВ, ДПРВ и синхронизация фаз ГРМ».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Мотор-тестер / Осциллограф (USB Autoscope))"
            },
            {
              "id": "s2",
              "text": "2. Указано подключение каналов и общей массы"
            },
            {
              "id": "s3",
              "text": "3. Описана форма сигналов (синусоида / меандр)"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Объяснён принцип выявления сдвига фаз ГРМ"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-133",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Мотор-тестер / Осцилло",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Что показывает одновременная осциллограмма ДПКВ + ДПРВ?",
          "choices": [
            {
              "id": "a",
              "text": "Фазовое рассогласование (растяжение цепи или перескок ремня ГРМ)",
              "outcome": "Сдвиг фронтов ДПРВ относительно маркера ДПКВ выявляет сбой фаз ГРМ."
            },
            {
              "id": "b",
              "text": "Давление в шинах",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Износ тормозных колодок",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Уровень омывателя",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Сдвиг фронтов ДПРВ относительно маркера ДПКВ выявляет сбой фаз ГРМ.",
          "winRule": "Зачёт по модулю №13 подтверждён!"
        }
      ]
    },
    "14": {
      "title": "Тренажёр: Высоковольтные цепи зажигания (COP/DIS): диагностика катуш",
      "instrument": "Емкостной/индуктивный датчик",
      "mechanic": "workshop_quest",
      "badge": "AUTOELECTRIC / Урок 14",
      "brief": "Анализ времени горения искры, напряжения пробоя, затухающих колебаний и поиск пропусков воспламенения без повреждения ЭБУ.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-141",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 14/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Высоковольтные цепи зажигания (COP/DIS): диагностика катушек, свечей и пробоя изоляции»: Что означает отсутствие затухающих колебаний после линии горения на осциллограмме зажигания?",
          "choices": [
            {
              "id": "a",
              "text": "Межвитковое замыкание первичной или вторичной обмотки катушки",
              "outcome": "Межвитковое замыкание мгновенно гасит остаточную энергию контура."
            },
            {
              "id": "b",
              "text": "Идеальная работа свечи",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Забитый воздушный фильтр",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Низкий уровень масла",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Межвитковое замыкание мгновенно гасит остаточную энергию контура.",
          "winRule": "Отлично! Примените правило: Межвитковое замыкание мгновенно гасит остаточную энергию контура."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Высоковольтные цепи зажигания (COP/DIS): диагностика катушек, свечей и пробоя изоляции».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Емкостной/индуктивный датчик)"
            },
            {
              "id": "s2",
              "text": "2. Описана проверка питания +12В и массы"
            },
            {
              "id": "s3",
              "text": "3. Указана проверка управляющего импульса"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Приведены нормы времени горения и запрет проверки без разрядника"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-143",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Емкостной/индуктивный ",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Почему нельзя снимать наконечник катушки на работающем двигателе без разрядника?",
          "choices": [
            {
              "id": "a",
              "text": "Скачок самоиндукции может пробить катушку или ключ ЭБУ",
              "outcome": "Без пути разряда напряжение возрастает до 30–40 кВ и пробивает изоляцию."
            },
            {
              "id": "b",
              "text": "Сгорит стартер",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Заблокируется АКПП",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Упадёт давление в шинах",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Без пути разряда напряжение возрастает до 30–40 кВ и пробивает изоляцию.",
          "winRule": "Зачёт по модулю №14 подтверждён!"
        }
      ]
    },
    "15": {
      "title": "Тренажёр: Шина LIN, FlexRay и диагностика мультиплексных кузовных се",
      "instrument": "Мультиметр",
      "mechanic": "workshop_quest",
      "badge": "AUTOELECTRIC / Урок 15",
      "brief": "Однопроводная шина LIN (Local Interconnect Network): ведущий/ведомые узлы, уровни напряжения 12В и поиск обрывов в дверных жгутах.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-151",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 15/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Шина LIN, FlexRay и диагностика мультиплексных кузовных сетей (BCM, стеклоподъёмники)»: Сколько сигнальных проводов используется в шине LIN?",
          "choices": [
            {
              "id": "a",
              "text": "1 провод (плюс общая масса)",
              "outcome": "LIN — однопроводная шина с архитектурой Master-Slave."
            },
            {
              "id": "b",
              "text": "2 витых провода",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "4 оптических волокна",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "3 фазных провода",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "LIN — однопроводная шина с архитектурой Master-Slave.",
          "winRule": "Отлично! Примените правило: LIN — однопроводная шина с архитектурой Master-Slave."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Шина LIN, FlexRay и диагностика мультиплексных кузовных сетей (BCM, стеклоподъёмники)».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Мультиметр)"
            },
            {
              "id": "s2",
              "text": "2. Указана проверка питания блока Master (BCM)"
            },
            {
              "id": "s3",
              "text": "3. Приведён замер напряжения покоя ~12В и импульсов"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Учтён осмотр жгута в гофре двери"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-153",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Мультиметр",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какое напряжение в покое должно быть на исправной шине LIN?",
          "choices": [
            {
              "id": "a",
              "text": "Около напряжения АКБ (~12 В)",
              "outcome": "LIN подтянута к напряжению батареи (Vbat)."
            },
            {
              "id": "b",
              "text": "2.5 В",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "0 В",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "24 В",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "LIN подтянута к напряжению батареи (Vbat).",
          "winRule": "Зачёт по модулю №15 подтверждён!"
        }
      ]
    },
    "16": {
      "title": "Тренажёр: Топливные коррекции (STFT / LTFT) и диагностика лямбда-зон",
      "instrument": "OBD-II сканер (Live Data)",
      "mechanic": "workshop_quest",
      "badge": "AUTOELECTRIC / Урок 16",
      "brief": "Чтение краткосрочных (STFT) и долгосрочных (LTFT) топливных коррекций, поиск подсоса воздуха и проверка датчиков кислорода.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-161",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 16/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Топливные коррекции (STFT / LTFT) и диагностика лямбда-зонда (O2 / Широкополосный AFR)»: О чём говорит положительная топливная коррекция LTFT = +22% на холостом ходу, падающая до 0% на высоких оборотах?",
          "choices": [
            {
              "id": "a",
              "text": "О подсосе неучтённого воздуха во впускной коллектор",
              "outcome": "На ХХ разрежение максимально, и подсос воздуха сильнее всего обедняет смесь."
            },
            {
              "id": "b",
              "text": "О течи форсунок",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "О забитом катализаторе",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "О неисправном генераторе",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "На ХХ разрежение максимально, и подсос воздуха сильнее всего обедняет смесь.",
          "winRule": "Отлично! Примените правило: На ХХ разрежение максимально, и подсос воздуха сильнее всего обедняет смесь."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Топливные коррекции (STFT / LTFT) и диагностика лямбда-зонда (O2 / Широкополосный AFR)».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (OBD-II сканер (Live Data))"
            },
            {
              "id": "s2",
              "text": "2. Верно определена причина (подсос воздуха)"
            },
            {
              "id": "s3",
              "text": "3. Объяснено поведение LTFT на ХХ и оборотах"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Описана опрессовка впуска дымогенератором"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-163",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "OBD-II сканер (Live Da",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: В каких пределах переключается исправный циркониевый датчик кислорода (Bank 1 Sensor 1)?",
          "choices": [
            {
              "id": "a",
              "text": "От 0.1 В (бедная) до 0.9 В (богатая)",
              "outcome": "Циркониевый зонд генерирует от 0.1 до 0.9 В."
            },
            {
              "id": "b",
              "text": "От 5 В до 12 В",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Постоянно 2.5 В",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "От -12 В до +12 В",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Циркониевый зонд генерирует от 0.1 до 0.9 В.",
          "winRule": "Зачёт по модулю №16 подтверждён!"
        }
      ]
    },
    "17": {
      "title": "Тренажёр: Системы безопасности SRS (Airbag) и ABS/ESP: датчики колёс",
      "instrument": "Диагностический сканер",
      "mechanic": "workshop_quest",
      "badge": "AUTOELECTRIC / Урок 17",
      "brief": "Техника безопасности при ремонте SRS (снятие клеммы АКБ, ожидание 10 мин), проверка активных датчиков ABS (MRE) и колец задающих.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-171",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 17/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Системы безопасности SRS (Airbag) и ABS/ESP: датчики колёс и безопасная работа с пиропатронами»: Почему категорически запрещено измерять сопротивление пиропатрона подушки безопасности мультиметром?",
          "choices": [
            {
              "id": "a",
              "text": "Тестовый ток мультиметра может инициировать взрыв пиропатрона",
              "outcome": "Провода проверяются только при отключённом пиропатроне, с использованием эмулятора."
            },
            {
              "id": "b",
              "text": "Мультиметр разрядит АКБ",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Подушка потеряет цвет",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Сгорит предохранитель прикуривателя",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Провода проверяются только при отключённом пиропатроне, с использованием эмулятора.",
          "winRule": "Отлично! Примените правило: Провода проверяются только при отключённом пиропатроне, с использованием эмулятора."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Системы безопасности SRS (Airbag) и ABS/ESP: датчики колёс и безопасная работа с пиропатронами».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Диагностический сканер)"
            },
            {
              "id": "s2",
              "text": "2. Указано отключение АКБ и пауза 10–15 мин"
            },
            {
              "id": "s3",
              "text": "3. Упомянут запрет прозвонки самого пиропатрона"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Описана проверка подрулевого шлейфа"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-173",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Диагностический сканер",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Сколько нужно ждать после снятия клеммы АКБ перед разборкой цепи SRS?",
          "choices": [
            {
              "id": "a",
              "text": "10–15 минут для разряда резервных конденсаторов",
              "outcome": "В блоке SRS стоят мощные конденсаторы автономного питания."
            },
            {
              "id": "b",
              "text": "1 секунду",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "24 часа",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Не нужно ждать",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "В блоке SRS стоят мощные конденсаторы автономного питания.",
          "winRule": "Зачёт по модулю №17 подтверждён!"
        }
      ]
    },
    "18": {
      "title": "Тренажёр: Иммобилайзер, бесключевой доступ (Keyless Go) и программир",
      "instrument": "Тестер накачки антенны иммобилайзера",
      "mechanic": "workshop_quest",
      "badge": "AUTOELECTRIC / Урок 18",
      "brief": "Принцип работы RFID-транспондера, проверка петли-антенны замка зажигания, синхронизация BCM и ЭБУ двигателя.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-181",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 18/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Иммобилайзер, бесключевой доступ (Keyless Go) и программирование транспондеров»: Откуда берёт питание пассивный чип-транспондер внутри обычного ключа без батарейки?",
          "choices": [
            {
              "id": "a",
              "text": "От электромагнитного поля антенны-рамки замка зажигания",
              "outcome": "Рамка-антенна передаёт энергию индуктивным способом (RFID)."
            },
            {
              "id": "b",
              "text": "От солнечной панели",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "От механической пружины",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "От Bluetooth телефона",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Рамка-антенна передаёт энергию индуктивным способом (RFID).",
          "winRule": "Отлично! Примените правило: Рамка-антенна передаёт энергию индуктивным способом (RFID)."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Иммобилайзер, бесключевой доступ (Keyless Go) и программирование транспондеров».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Тестер накачки антенны иммобилайзера)"
            },
            {
              "id": "s2",
              "text": "2. Упомянута проверка запасным ключом"
            },
            {
              "id": "s3",
              "text": "3. Описана проверка накачки антенны"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Указано чтение ошибок и синхронизации IMMO-ЭБУ"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-183",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Тестер накачки антенны",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Что показывает мигание проверочной катушки со светодиодом у замка зажигания?",
          "choices": [
            {
              "id": "a",
              "text": "Наличие сигнала накачки от блока иммобилайзера",
              "outcome": "Отсутствие накачки указывает на обрыв антенны или неисправность блока IMMO."
            },
            {
              "id": "b",
              "text": "Уровень топлива",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Заряд стартера",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Работу кондиционера",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Отсутствие накачки указывает на обрыв антенны или неисправность блока IMMO.",
          "winRule": "Зачёт по модулю №18 подтверждён!"
        }
      ]
    },
    "19": {
      "title": "Тренажёр: Электрооборудование гибридных и электромобилей (HV): техни",
      "instrument": "Диэлектрические перчатки (1000В)",
      "mechanic": "workshop_quest",
      "badge": "AUTOELECTRIC / Урок 19",
      "brief": "Оранжевые высоковольтные жгуты, отключение сервисного разъёма ВВБ, измерение сопротивления изоляции и принцип DC-DC преобразователя.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-191",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 19/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Электрооборудование гибридных и электромобилей (HV): техника безопасности 400В, инвертор и DC-DC»: Каким цветом стандартизированы высоковольтные жгуты в гибридах и электромобилях?",
          "choices": [
            {
              "id": "a",
              "text": "Оранжевым",
              "outcome": "Оранжевая гофра предупреждает о смертельно опасном напряжении."
            },
            {
              "id": "b",
              "text": "Синим",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Зелёным",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Белым",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Оранжевая гофра предупреждает о смертельно опасном напряжении.",
          "winRule": "Отлично! Примените правило: Оранжевая гофра предупреждает о смертельно опасном напряжении."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Электрооборудование гибридных и электромобилей (HV): техника безопасности 400В, инвертор и DC-DC».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Диэлектрические перчатки (1000В))"
            },
            {
              "id": "s2",
              "text": "2. Указаны диэлектрические перчатки 1000В"
            },
            {
              "id": "s3",
              "text": "3. Описано извлечение Service Plug и пауза 10 мин"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Указан контрольный замер 0 В и тест мегомметром"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-193",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Диэлектрические перчат",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой узел заменяет генератор и заряжает 12В аккумулятор в электромобиле?",
          "choices": [
            {
              "id": "a",
              "text": "DC-DC преобразователь",
              "outcome": "DC-DC конвертер понижает постоянное напряжение тяговой батареи до ~14 В."
            },
            {
              "id": "b",
              "text": "Трамблёр",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Карбюратор",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Вакуумный усилитель",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "DC-DC конвертер понижает постоянное напряжение тяговой батареи до ~14 В.",
          "winRule": "Зачёт по модулю №19 подтверждён!"
        }
      ]
    },
    "20": {
      "title": "Тренажёр: Комплексная компьютерная диагностика (OBD-II + Осциллограф",
      "instrument": "Сканер OBD-II",
      "mechanic": "workshop_quest",
      "badge": "AUTOELECTRIC / Урок 20",
      "brief": "Итоговый экзамен автоэлектрика: корреляция кодов неисправностей DTC, параметров Live Data, осциллограмм и оформление акта дефектовки.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-201",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 20/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Комплексная компьютерная диагностика (OBD-II + Осциллограф) и сдача электрооборудования»: Что содержит стоп-кадр (Freeze Frame) в памяти ЭБУ?",
          "choices": [
            {
              "id": "a",
              "text": "Параметры работы двигателя в момент фиксации ошибки (обороты, температура, нагрузка)",
              "outcome": "Freeze Frame помогает воспроизвести условия возникновения неисправности."
            },
            {
              "id": "b",
              "text": "Фотографию водителя",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Маршрут навигатора",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Список заправок",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Freeze Frame помогает воспроизвести условия возникновения неисправности.",
          "winRule": "Отлично! Примените правило: Freeze Frame помогает воспроизвести условия возникновения неисправности."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Комплексная компьютерная диагностика (OBD-II + Осциллограф) и сдача электрооборудования».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Сканер OBD-II)"
            },
            {
              "id": "s2",
              "text": "2. Описано чтение DTC и Freeze Frame"
            },
            {
              "id": "s3",
              "text": "3. Включены замеры питания/CAN/осциллографа"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Сформулирован вердикт и рекомендации по ремонту"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-203",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Сканер OBD-II",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Экзамен",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Почему нельзя сразу менять датчик по коду ошибки «Низкий уровень сигнала»?",
          "choices": [
            {
              "id": "a",
              "text": "Причиной может быть обрыв провода, окисление разъёма или потеря питания/массы",
              "outcome": "Код DTC указывает на цепь или симптом, а не на 100% поломку самого датчика."
            },
            {
              "id": "b",
              "text": "Датчик нельзя откручивать",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Ошибка исчезнет сама через год",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Нужно сначала поменять шины",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Код DTC указывает на цепь или симптом, а не на 100% поломку самого датчика.",
          "winRule": "Зачёт по модулю №20 подтверждён!"
        }
      ]
    }
  },
  "hvac": {
    "1": {
      "title": "Термодинамика и 4 стадии холодильного контура",
      "instrument": "P-h Loop Simulator",
      "mechanic": "bench_tuner",
      "badge": "HVAC / Контур",
      "brief": "Управляй фазами хладагента: сжатие, конденсация, дросселирование и кипение без гидроудара.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: Настрой рабочий баланс бытового контура (R600a/R134a): на конденсаторе (HP) поддерживаем теплоотдачу +42..+50°C, на всасывании испарителя (LP) — перегрев сухого пара +5..+8 K и чистый теплообменник.",
          "previewType": "ph_cycle",
          "controls": [
            {
              "id": "cond",
              "kind": "range",
              "label": "Темп. конденсации (HP)",
              "min": 25,
              "max": 75,
              "step": 5,
              "init": 70,
              "unit": "°C",
              "targetMin": 40,
              "targetMax": 50
            },
            {
              "id": "sh",
              "kind": "range",
              "label": "Перегрев пара перед компрессором",
              "min": 0,
              "max": 16,
              "step": 1,
              "init": 0,
              "unit": " K",
              "targetMin": 5,
              "targetMax": 8
            },
            {
              "id": "fan",
              "kind": "pills",
              "label": "Вентилятор конденсатора",
              "options": [
                "Забит пылью",
                "Чистый обдув"
              ],
              "init": "Забит пылью",
              "targetVal": "Чистый обдув"
            }
          ],
          "hint": "Если перегрев равен 0 K — в компрессор попадёт жидкий фреон и сломает клапаны (гидроудар)! А грязный конденсатор задирает HP выше +65°C.",
          "winRule": "В норме испаритель выдаёт сухой перегретый пар (+5..8 K), а чистый конденсатор сбрасывает тепло при +40..50°C.",
          "failRule": "Нулевой перегрев опасен гидроударом, а перегрев >70°C на нагнетании убивает масло компрессора."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Расставь 4 основных агрегата холодильного контура строго по направлению движения фреона от выхода компрессора.",
          "chips": [
            {
              "id": "hc1",
              "text": "Компрессор (сжимает холодный пар в горячий газ HP)"
            },
            {
              "id": "hc2",
              "text": "Конденсатор (охлаждает газ HP до тёплой жидкости)"
            },
            {
              "id": "hc3",
              "text": "Дроссель / Капиллярная трубка / ТРВ (резкий сброс давления HP -> LP)"
            },
            {
              "id": "hc4",
              "text": "Испаритель (жидкость кипит при низком LP, забирая тепло)"
            }
          ],
          "correctOrder": [
            "hc1",
            "hc2",
            "hc3",
            "hc4"
          ],
          "hint": "После нагнетания газ остывает и превращается в жидкость в конденсаторе, пролетает узкий дроссель и кипит с холодом в испарителе.",
          "winRule": "Компрессор качает пар -> Конденсатор переводит в жидкость (HP) -> ТРВ/Капиллярка сбрасывает давление -> Испаритель кипит (LP) и забирает тепло."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Определи агрегатное состояние хладагента и давление в каждой магистрали контура!",
          "bins": [
            {
              "id": "hp_hot",
              "label": "Сторона HP (Высокое давление)",
              "color": "rose"
            },
            {
              "id": "lp_cold",
              "label": "Сторона LP (Низкое давление)",
              "color": "cyan"
            }
          ],
          "cards": [
            {
              "tag": "Нагнетание",
              "specimen": "Трубка от компрессора ко входу конденсатора",
              "context": "Горячая на ощупь (+60..+85°C)",
              "targetBin": "hp_hot",
              "rule": "Линия нагнетания и сам конденсатор — зона высокого давления HP (переход газ -> жидкость)."
            },
            {
              "tag": "После дросселя",
              "specimen": "Вход в испаритель после капиллярной трубки",
              "context": "Холодная парожидкостная смесь",
              "targetBin": "lp_cold",
              "rule": "Сразу за капилляркой/ТРВ начинается зона низкого давления LP и холодного кипения."
            },
            {
              "tag": "Всасывание",
              "specimen": "Обратная магистраль из испарителя к компрессору",
              "context": "Прохладный сухой газ низкого давления",
              "targetBin": "lp_cold",
              "rule": "Всасывающая магистраль находится под низким давлением LP."
            }
          ],
          "hint": "Всё от клапана нагнетания компрессора ДО дросселя — высокое давление HP; от выхода дросселя ДО всаса компрессора — низкое LP.",
          "winRule": "Границы давления делят систему чётко пополам: компрессор поднимает давление (LP -> HP), а дроссель/ТРВ опускает его обратно (HP -> LP)."
        }
      ]
    },
    "2": {
      "title": "Хладагенты (R600a, R134a, R404A) и Масла",
      "instrument": "Refrigerant Safety Audit",
      "mechanic": "defect_inspector",
      "badge": "HVAC / Химия и Безопасность",
      "brief": "Соблюдай класс безопасности A3 (взрывоопасный изобутан R600a) и береги синтетическое масло POE от влаги.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: Мастер выехал чинить бытовой холодильник на R600a. Найди смертельно опасное нарушение техники безопасности на объекте!",
          "artifactTitle": "Карта работ — Холодильник R600a (Изобутан)",
          "items": [
            {
              "id": "rf1",
              "code": "Дозаправка строго по электронным весам ±1г",
              "label": "Контроль точной массы хладагента"
            },
            {
              "id": "rf2",
              "code": "Прожиг и выпайка трубки горелкой БЕЗ спуска газа и продувки азотом!",
              "label": "Огневые работы на контуре с R600a"
            },
            {
              "id": "rf3",
              "code": "Установлены прокалывающие клещи + вакуумный насос с отводом в окно",
              "label": "Подготовка магистрали к эвакуации"
            },
            {
              "id": "rf4",
              "code": "Использовано минеральное/алкилбензольное масло по шильдику",
              "label": "Подбор совместимого масла компрессора"
            }
          ],
          "defectId": "rf2",
          "fixedCode": "Стравить R600a на воздух / в ресивер + продуть тракт сухим азотом (N2) перед открытым огнём!",
          "hint": "Что такое R600a по химическому составу (класс A3) и что будет при встрече с открытым пламенем горелки?",
          "winRule": "R600a — горючий газ изобутан (класс A3)! Пайка разрешена ТОЛЬКО после полного удаления газа, вакуумирования/продувки азотом (или используйте бессварочные обжимные муфты Lokring).",
          "failReasons": {
            "rf1": "Маленькие дозы R600a (35-65г) действительно заправляют строго по весам.",
            "rf3": "Проветривание и откачка газа снижают взрывоопасную концентрацию.",
            "rf4": "Минеральное масло полностью совместимо с изобутаном R600a."
          }
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 2: Сопоставь популярные хладагенты с их совместимым компрессорным маслом!",
          "bins": [
            {
              "id": "min",
              "label": "Минеральное (MO / AB)",
              "color": "amber"
            },
            {
              "id": "poe",
              "label": "Синтетика POE (Полиэфир)",
              "color": "cyan"
            }
          ],
          "cards": [
            {
              "tag": "Бытовой",
              "specimen": "R600a (Изобутан, низкотемпературный бытовой)",
              "context": "Природный углеводород HC",
              "targetBin": "min",
              "rule": "Углеводороды (R600a, R290) и старый R12 работают на минеральном/алкилбензольном масле."
            },
            {
              "tag": "Холод/Озон-safe",
              "specimen": "R134a (ГФУ для бытовых и авто-АС)",
              "context": "Фторсодержащий гидрофторуглерод",
              "targetBin": "poe",
              "rule": "Для ГФУ-фреонов R134a и R404A в холодильниках требуется синтетическое масло POE (в авто — PAG)."
            },
            {
              "tag": "Торговый холод",
              "specimen": "R404A / R507 (Низкотемпературные лари и витрины)",
              "context": "Многокомпонентный ГФУ хладагент",
              "targetBin": "poe",
              "rule": "R404A не смешивается с минералкой — только синтетика POE!"
            }
          ],
          "hint": "ГФУ-семейство (R134a, R404A) требует синтетику POE; чистые углеводороды R600a/R290 дружат с минералкой.",
          "winRule": "Смешивание минералки с R134a/R404A приводит к масляному голоданию — масло не возвращается с фреоном обратно в картер!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "HV-208",
          "speaker": "Технолог цеха Алексей",
          "telemetry": [
            {
              "label": "Канистра POE",
              "val": "Открыта 3 недели",
              "bad": true
            },
            {
              "label": "Фильтр-осушитель",
              "val": "Забился",
              "bad": true
            }
          ],
          "situation": "После заправки маслом POE из вскрытой месяц назад негерметичной канистры новый компрессор встал через 2 месяца с кислотным пробоем обмоток! Что произошло с маслом?",
          "choices": [
            {
              "id": "a",
              "text": "Оно превратилось в пропан",
              "outcome": "Фреон и масло химически не превращаются друг в друга при хранении."
            },
            {
              "id": "b",
              "text": "Масло POE экстремально гигроскопично: за минуты впитывает влагу из воздуха и превращается в кислоту внутри горячего контура",
              "outcome": "Точно в цель! Влага + POE + температура образуют кислоты, съедающие лак обмоток и омедняющие клапаны."
            },
            {
              "id": "c",
              "text": "Просто мало налили",
              "outcome": "Главная беда вскрытой POE-тары — именно насыщение влагой из влажного цеха."
            }
          ],
          "correctId": "b",
          "hint": "Помни главное свойство синтетики POE при контакте с комнатным воздухом...",
          "winRule": "Синтетическое масло POE впитывает атмосферную влагу как губка — используйте только свежевскрытые малые фасовки и вакуумируйте сразу."
        }
      ]
    },
    "3": {
      "title": "Манометрический коллектор и Перегрев (Superheat)",
      "instrument": "Manifold & Superheat Bench",
      "mechanic": "code_or_formula_builder",
      "badge": "HVAC / Перегрев",
      "brief": "Рассчитывай истинный перегрев на всасывании (SH = T_трубы - T_кип = 5-8 K) по синему манометру LP и термометру.",
      "rounds": [
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 1: Собери точную последовательность замера Перегрева (Superheat) на работающем холодильном контуре.",
          "chips": [
            {
              "id": "sh1",
              "text": "Подключить синий шланг (LP) и считать температуру кипения T_sat со шкалы фреона"
            },
            {
              "id": "sh2",
              "text": "Измерить контактным термометром реальную T_pipe всасывающей трубы у выхода испарителя"
            },
            {
              "id": "sh3",
              "text": "Вычесть по формуле: Перегрев SH = T_pipe - T_sat (норма 5..8 K)"
            },
            {
              "id": "sh4",
              "text": "Выпустить половину фреона в атмосферу до исчезновения давления"
            }
          ],
          "correctOrder": [
            "sh1",
            "sh2",
            "sh3"
          ],
          "hint": "Сначала считываем давление/температуру насыщения T_sat по шкале манометра LP, замеряем реальную трубу T_pipe, и берём разницу!",
          "winRule": "Формула перегрева `SH = T_трубы - T_кип (по манометру)` показывает, насколько безопасно испарился хладагент (эталон 5–8 K)."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Настрой винт ТРВ (терморегулирующего вентиля) на коммерческой камере R404A, где T_кип по синему манометру -10°C: обеспечь перегрев (SH = T_трубы - T_кип) в диапазоне 5..8 K (значит T_трубы от -5 до -2°C) и выбери правильный порт коллектора!",
          "previewType": "ph_cycle",
          "controls": [
            {
              "id": "port",
              "kind": "pills",
              "label": "Порт замера кипения LP",
              "options": [
                "Красный HP",
                "Синий LP"
              ],
              "init": "Красный HP",
              "targetVal": "Синий LP"
            },
            {
              "id": "tpipe",
              "kind": "range",
              "label": "T_трубы на всасе (при T_кип = -10°C)",
              "min": -12,
              "max": 8,
              "step": 1,
              "init": -11,
              "unit": "°C",
              "targetMin": -5,
              "targetMax": -2
            }
          ],
          "hint": "При T_кип = -10°C перегрев 5..8 K даёт реальную температуру трубы -10 + 5 = -5°C ... -10 + 8 = -2°C!",
          "winRule": "Синий манометр всегда читает низкую сторону LP; оптимальный перегрев +5..8 K исключает как голодание испарителя (>12 K), так и гидроудар (<3 K)."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 3: Вся всасывающая труба аж до корпуса компрессора покрылась толстой снежной «шубой», компрессор гремит! Промерь параметры манометром и термометром.",
          "meterName": "SUPERHEAT DIAGNOSTIC",
          "normalSpec": "Норма SH = +5..+8 K (Компрессор всасывает сухой газ)",
          "points": [
            {
              "id": "sp1",
              "name": "Шкала T_sat синего манометра LP (R404A)",
              "pin": "Service LP",
              "reading": "-12.0",
              "unit": "°C",
              "meterNote": "Температура кипения в норме для средне/низкого холода."
            },
            {
              "id": "sp2",
              "name": "Термопара на всасе перед компрессором",
              "pin": "Suction Pipe",
              "reading": "-11.8",
              "unit": "°C (SH ≈ 0.2 K!)",
              "meterNote": "Перегрев почти НОЛЬ! В компрессор летит жидкий фреон («залив» / перезаправка / открыт ТРВ)."
            },
            {
              "id": "sp3",
              "name": "Давление конденсации HP (Красный манометр)",
              "pin": "Discharge HP",
              "reading": "14.2",
              "unit": "bar (+32°C)",
              "meterNote": "Давление на высокой стороне в разумных границах."
            },
            {
              "id": "sp4",
              "name": "Питание вентилятора испарителя",
              "pin": "Evap Fan",
              "reading": "230 V / Вращается",
              "unit": "",
              "meterNote": "Обдув испарителя в норме."
            }
          ],
          "faultId": "sp2",
          "hint": "Когда T_трубы почти равна температуре кипения T_sat (разница ~0 K), жидкость не успевает выкипеть до входа в компрессор!",
          "winRule": "Околонулевой перегрев (иней на картере компрессора) — сигнал аварийного залива жидким хладагентом: нужно прижать ТРВ или убрать лишнюю дозу газа."
        }
      ]
    },
    "4": {
      "title": "Компрессоры: Обмотки C-S-R, PTC и Klixon",
      "instrument": "Compressor Ohm & PTC Lab",
      "mechanic": "probe_diagnostic",
      "badge": "HVAC / Компрессор",
      "brief": "Определяй выводы C-S-R по сумме сопротивлений обмоток (R_S-R = R_C-S + R_C-R), тестируй позистор PTC и пробой на корпус.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: Компрессор гудит 4 секунды, щёлкает тепловушка (Klixon) и молчит! Замерь сопротивление 3 штырьков C-S-R и пробой на корпус мегаомметром.",
          "meterName": "COMPRESSOR OHM & MEGGER",
          "normalSpec": "R(S-R) = R(C-S) + R(C-R) | Корпус > 2-20 МОм | R(C-R) < R(C-S)",
          "points": [
            {
              "id": "cm1",
              "name": "Пара верхний <-> левый (C <-> R, рабочая)",
              "pin": "Pins 1-2",
              "reading": "14.2",
              "unit": "Ohm",
              "meterNote": "Рабочая обмотка показывает чистые 14.2 Ом."
            },
            {
              "id": "cm2",
              "name": "Пара верхний <-> правый (C <-> S, пусковая)",
              "pin": "Pins 1-3",
              "reading": "26.8",
              "unit": "Ohm",
              "meterNote": "Пусковая обмотка цела (закономерно больше рабочей)."
            },
            {
              "id": "cm3",
              "name": "Пара левый <-> правый (R <-> S)",
              "pin": "Pins 2-3",
              "reading": "41.0",
              "unit": "Ohm",
              "meterNote": "14.2 + 26.8 = 41.0 Ом! Межвиткового замыкания нет."
            },
            {
              "id": "cm4",
              "name": "Штырь C <-> Зачищенная медная трубка/корпус",
              "pin": "Winding-GND",
              "reading": "0.08",
              "unit": "MOhm (ПРОБОЙ!)",
              "meterNote": "Изоляция пробита на корпус (ниже нормы > 2 МОм)! Горшок под замену."
            }
          ],
          "faultId": "cm4",
          "hint": "Если сами обмотки звонятся по правилу суммы, что ещё необходимо измерить между штырьками и медной трубкой/корпусом?",
          "winRule": "Перед заменой реле всегда прозвоните обмотки на корпус! Изоляция ниже 2 МОм — гарантированный пробой и сработка автомата."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: Обмотки компрессора идеальны (пробоя нет), но при подаче 230В запускается и тут же рубится. Осмотри снятое пусковое реле PTC!",
          "artifactTitle": "Starter Relay Block — Inspection",
          "items": [
            {
              "id": "pt1",
              "code": "Klixon (Биметалл защиты): 0.2 Ом при комнатной 22°C",
              "label": "Холодный контакт тепловой защиты"
            },
            {
              "id": "pt2",
              "code": "PTC-реле (Позистор): гремит как погремушка, сопротивление ∞",
              "label": "Таблетка позистора внутри пластикового корпуса"
            },
            {
              "id": "pt3",
              "code": "Напряжение розетки на клеммах: 229 В AC",
              "label": "Сетевое питание холодильника"
            },
            {
              "id": "pt4",
              "code": "Рабочий конденсатор: 4.0 мкФ (по паспорту 4.0 uF)",
              "label": "Фазосдвигающий конденсатор"
            }
          ],
          "defectId": "pt2",
          "fixedCode": "Замена пускового PTC-реле (рассыпалась керамическая таблетка от старости/напряжения)!",
          "hint": "Встряхни позисторное реле рядом с ухом — рассыпавшаяся керамическая таблетка сразу выдаёт себя характерным звоном и обрывом пусковой цепи!",
          "winRule": "Если позистор рассыпался («погремушка»), пусковая обмотка S не получает ток на старте, ротор стоит и через 3-5 сек срабатывает теплозащита Klixon."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "CM-404",
          "speaker": "Стажёр Павел",
          "telemetry": [
            {
              "label": "Вилка питания",
              "val": "Вынул/Вставил за 3 сек",
              "bad": true
            },
            {
              "label": "Реакция PTC",
              "val": "Не запускается",
              "bad": true
            }
          ],
          "situation": "Холодильник работал исправно, мастер случайно выдернул вилку из розетки и сразу же через 2 секунды воткнул обратно. Компрессор гудит и не запускается! Надо срочно менять компрессор?",
          "choices": [
            {
              "id": "a",
              "text": "Да, компрессор заклинил",
              "outcome": "Ложная тревога — стажёры часто меняют живые компрессоры из-за этой ошибки!"
            },
            {
              "id": "b",
              "text": "Нет! Горячая таблетка PTC ещё не остыла (сопротивление тысячи Ом) И давление не выровнялось — выключите на 5–7 минут и дайте остыть!",
              "outcome": "Золотое правило холодильщика! После остывания позистора и выравнивания давлений в капиллярке мотор спокойно стартует."
            },
            {
              "id": "c",
              "text": "Постучать молотком по кожуху",
              "outcome": "Не помогает при горячем позисторе и высоком давлении на всасе."
            }
          ],
          "correctId": "b",
          "hint": "Сколько времени нужно позисторной таблетке (PTC) чтобы остыть и капиллярной трубке чтобы выровнять давление HP/LP?",
          "winRule": "Повторный пуск холодильника с PTC-реле и капилляркой возможен ТОЛЬКО через 5-10 минут паузы — для остывания позистора и выравнивания давлений."
        }
      ]
    },
    "5": {
      "title": "Пайка Медь-Медь vs Медь-Сталь и Поддув азотом",
      "instrument": "Brazing & Metallurgy Bench",
      "mechanic": "workshop_quest",
      "badge": "HVAC / Пайка",
      "brief": "Выбирай правильные припои и флюсы (CuP6 vs 40% Ag) и защищай контур сухим азотом от чёрной окалины.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "BRZ-502",
          "speaker": "Мастер холодильного цеха Аркадий",
          "telemetry": [
            {
              "label": "Трубка 1",
              "val": "Медь 6мм",
              "bad": false
            },
            {
              "label": "Трубка 2",
              "val": "Сталь конденсатора",
              "bad": false
            }
          ],
          "situation": "Нужно впаять медный фильтр-осушитель в стальную трубку решётки конденсатора. Какой припой и технологию вы возьмёте?",
          "choices": [
            {
              "id": "a",
              "text": "Обычный медно-фосфорный припой CuP6 без флюса — как для меди",
              "outcome": "Катастрофический брак! Фосфор со сталью образует хрупкий фосфид железа — шов лопнет от вибрации за пару недель!"
            },
            {
              "id": "b",
              "text": "Серебряный припой (30–45% Ag) с обязательным белым флюсом (типа FB3-A / бура) и защитой фильтра от перегрева",
              "outcome": "Безупречно! Серебряный припой с флюсом создаёт прочный пластичный стык Медь-Сталь на десятилетия."
            },
            {
              "id": "c",
              "text": "Припой олово-свинец ПОС-61 на обычном канифольном паяльнике",
              "outcome": "Олово не держит высокое давление холодильного контура HP 15-30 бар."
            }
          ],
          "correctId": "b",
          "hint": "Фосфор разрушает железо (хрупкость!), поэтому для стыка Медь + Сталь / Латунь берут дорогой серебряный пруток с флюсом...",
          "winRule": "Медь-Медь паяем медно-фосфорным припоем (можно без флюса), а Медь-Сталь или Медь-Латунь — ТОЛЬКО серебряным припоем (≥30-40% Ag) с флюсом!"
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Собери чистую технологию пайки трассы кондиционера/холодильной установки под защитой от окалины.",
          "chips": [
            {
              "id": "bz1",
              "text": "Очистить медь скотч-брайтом (не сдувая стружку внутрь!) и развальцевать стык"
            },
            {
              "id": "bz2",
              "text": "Подать слабый проточный ток сухого азота N2 (~0.1-0.2 бар) внутрь трассы"
            },
            {
              "id": "bz3",
              "text": "Равномерно прогреть стык до вишнёвого свечения и внести припой"
            },
            {
              "id": "bz4",
              "text": "Выдувать воздух в трубу кислородом под давлением во время пайки"
            }
          ],
          "correctOrder": [
            "bz1",
            "bz2",
            "bz3"
          ],
          "hint": "Без инертного азота при 700°C на внутренней стенке трубы вырастет чёрная сажа (окалина), которая мгновенно забьёт ТРВ и масло!",
          "winRule": "Пайка с проточным поддувом сухого азота (0.1–0.2 бар) полностью исключает образование чёрной медной окалины внутри контура."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: После замены компрессора сплит-системы (R410A) через 10 дней намертво забилась мелкая сетка ЭРВ/ТРВ чёрными хлопьями! Найди причину.",
          "artifactTitle": "Repair Report — Split R410A",
          "items": [
            {
              "id": "ok1",
              "code": "Шов Медь-Медь: медно-фосфорный припой 5% Ag",
              "label": "Тип припоя на медную трассу"
            },
            {
              "id": "ok2",
              "code": "Пайка стыков: выполнена в воздухе БЕЗ подачи азота N2",
              "label": "Атмосфера внутри нагретой медной трубы"
            },
            {
              "id": "ok3",
              "code": "Фильтр: новый двунаправленный жидкостный",
              "label": "Установлен свежий осушитель"
            },
            {
              "id": "ok4",
              "code": "Труборез: роликовый труборезом с снятием грата фаскоснимателем",
              "label": "Механическая подготовка края трубы"
            }
          ],
          "defectId": "ok2",
          "fixedCode": "Обязательный проточный поддув сухим азотом (N2) через всю паяемую магистраль!",
          "hint": "Откуда в чистой медной трубе при нагреве до 750°C в присутствии кислорода воздуха берутся хрупкие чёрные хлопья?",
          "winRule": "Чёрные хлопья внутри ЭРВ и фильтра — это оксид меди (окалина), возникший из-за пайки на горячую без инертного азота N2."
        }
      ]
    },
    "6": {
      "title": "Опрессовка Азотом N2 и Поиск Утечек",
      "instrument": "Nitrogen Leak Bench",
      "mechanic": "triage_radar",
      "badge": "HVAC / Опрессовка N2",
      "brief": "Опрессовывай контур сухим азотом 10–40 бар, помни строжайшее табу на кислород и находи микроутечки.",
      "rounds": [
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 1: Выбор газа для опрессовки под высоким давлением — отдели единственный правильный газ от смертельно опасных запретов!",
          "bins": [
            {
              "id": "safe_n2",
              "label": "✓ ОДОБРЕНО (Инертный/Безопасный)",
              "color": "emerald"
            },
            {
              "id": "boom",
              "label": "✗ КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО!",
              "color": "rose"
            }
          ],
          "cards": [
            {
              "tag": "Баллон 1",
              "specimen": "Сухой газообразный Азот (N2) через редуктор с манометром",
              "context": "Инертный газ без влаги и кислорода",
              "targetBin": "safe_n2",
              "rule": "Только сухой азот N2 (через редуктор!) допущен для опрессовки холодильных систем."
            },
            {
              "tag": "Баллон 2",
              "specimen": "Технический КИСЛОРОД (O2) из сварочного баллона",
              "context": "«Чтобы сэкономить — ведь он есть в машине»",
              "targetBin": "boom",
              "rule": "ВЗРЫВ! Кислород при контакте с компрессорным маслом под давлением моментально детонирует!"
            },
            {
              "tag": "Магистраль",
              "specimen": "Сжатый воздух от шиномонтажного компрессора",
              "context": "Содержит капли воды, масло и кислород",
              "targetBin": "boom",
              "rule": "Воздух заносит воду в систему и при сжатии с маслом также даёт риск взрыва."
            }
          ],
          "hint": "В контур перед запуском может заходить ТОЛЬКО сухой инертный газ через понижающий редуктор...",
          "winRule": "Опрессовку выполняют ИСКЛЮЧИТЕЛЬНО сухим азотом N2 (обязательно через редуктор 0-50 бар!). Кислород и воздух смертельно опасны."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: В мастерскую привезли новый компрессор и редуктор для проверки трассы кондиционера R410A. Найди критическое нарушение на рабочем месте!",
          "artifactTitle": "Leak Test Setup — R410A Split",
          "items": [
            {
              "id": "lk1",
              "code": "Тестовое давление азота: 38-40 бар на R410A",
              "label": "Высокое давление проверки вальцовок"
            },
            {
              "id": "lk2",
              "code": "Баллон 150 бар подключён НАПРЯМУЮ в коллектор БЕЗ редуктора!",
              "label": "Сборка газовой арматуры азотного поста"
            },
            {
              "id": "lk3",
              "code": "Проверка стыков пенным мыльным спреем + течеискатель",
              "label": "Метод локализации свищей"
            },
            {
              "id": "lk4",
              "code": "Контрольная выдержка трассы 12-24 часа с записью Т°C",
              "label": "Учёт температурного дрейфа давления"
            }
          ],
          "defectId": "lk2",
          "fixedCode": "Обязательный баллонный редуктор высокого давления (до 50-60 бар) с предохранительным клапаном!",
          "hint": "Давление в полном баллоне азота — 150 бар, а шланги и испаритель разорвёт как гранату уже на 50-60 барах!",
          "winRule": "Никогда не открывайте баллон азота без исправного редуктора: 150 бар разрывают теплообменники и манометры со смертельными осколками."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 3: Опрессовали систему сухим азотом до 12.0 бар вечером в тёплом цеху (+26°C). Утром при +12°C на улице смотрим на манометры — как отличить реальную утечку от физики газов?",
          "meterName": "NITROGEN PRESSURE LOG",
          "normalSpec": "Закон Шарля: падение 14 K снижает давление 12 бар всего на ~0.55 бар; резкое падение -> УТЕЧКА",
          "points": [
            {
              "id": "np1",
              "name": "Контур А (Холодильная камера №1)",
              "pin": "Manometer Ch1",
              "reading": "11.45",
              "unit": "bar (+12°C)",
              "meterNote": "13.0 бар (абс) * (285K/299K) = 12.4 - 1 = 11.4 бар! Небольшой температурный сдвиг строго по термодинамике, контур герметичен."
            },
            {
              "id": "np2",
              "name": "Контур Б (Морозильный ларь №2)",
              "pin": "Manometer Ch2",
              "reading": "3.20",
              "unit": "bar (+12°C)",
              "meterNote": "Давление рухнуло на 8.8 бара за ночь! Стопроцентная негерметичность в контуре Б — ищем утечку."
            },
            {
              "id": "np3",
              "name": "Редуктор баллона",
              "pin": "Test Vent",
              "reading": "Закрыт на ночь",
              "unit": "",
              "meterNote": "Шланг от баллона был отсечён."
            }
          ],
          "faultId": "np2",
          "hint": "Остывание воздуха в цеху на 14 градусов опускает 12 бар примерно на пол-атмосферы, а вот падение до 3 бар говорит однозначно о дыре...",
          "winRule": "При опрессовке всегда записывайте давление И температуру окружающего воздуха, чтобы отличать закон Шарля (~0.3-0.6 бар) от реальной утечки."
        }
      ]
    },
    "7": {
      "title": "Вакуумирование < 500 микрон и Ледяная пробка",
      "instrument": "Digital Micron Vacuum Gauge",
      "mechanic": "defect_inspector",
      "badge": "HVAC / Вакуум 500 мкм",
      "brief": "Удаляй влагу и неконденсируемые газы двухступенчатым вакууматором до 500 микрон и проводи Decay-тест.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: Мастер поменял компрессор на морозильнике, сэкономил 30 минут и «продул» систему парой порций фреона вместо вакуумного насоса. Найди неизбежное последствие!",
          "artifactTitle": "Compressor Swap Report — Freeze Blockage",
          "items": [
            {
              "id": "vc1",
              "code": "Установлен новый цеолитовый фильтр-осушитель на 15 г",
              "label": "Влагопоглотитель магистрали"
            },
            {
              "id": "vc2",
              "code": "Отказ от вакуумирования (Продувка паром фреона + воздух внутри)",
              "label": "Подготовка контура к заправке"
            },
            {
              "id": "vc3",
              "code": "Пайка стыков серебром/CuP6 под азотом",
              "label": "Соединение труб"
            },
            {
              "id": "vc4",
              "code": "Длина капиллярной трубки сохранена по паспорту",
              "label": "Калибровка дросселя"
            }
          ],
          "defectId": "vc2",
          "fixedCode": "Обязательное глубокое вакуумирование двухступенчатым насосом до < 500 микрон (0.5 Torr)!",
          "hint": "Капелька влаги из воздуха не сдувается обычной продувкой: на выходе капиллярки при -25°C она мгновенно замерзает в лёд!",
          "winRule": "Только глубокий вакуум (< 500 микрон / ~67 Па) заставляет воду вскипеть и испариться при комнатной температуре — иначе ледяная пробка закупорит капиллярку и воздух поднимет давление HP."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Настрой вакуумную станцию для пусконаладки новой системы с POE-маслом: целевой порог цифрового вакуумметра (микрон) и время удержания кранов (Decay Test).",
          "previewType": "scale_charge",
          "controls": [
            {
              "id": "pump",
              "kind": "pills",
              "label": "Тип вакуумного насоса",
              "options": [
                "От старого компрессора",
                "Двухступенчатый (2-stage)"
              ],
              "init": "От старого компрессора",
              "targetVal": "Двухступенчатый (2-stage)"
            },
            {
              "id": "micron",
              "kind": "range",
              "label": "Целевой предел на вакуумметре",
              "min": 200,
              "max": 2000,
              "step": 100,
              "init": 1600,
              "unit": " мкм",
              "targetMin": 200,
              "targetMax": 500
            },
            {
              "id": "hold",
              "kind": "range",
              "label": "Тест выдержки крана (минут)",
              "min": 1,
              "max": 20,
              "step": 1,
              "init": 1,
              "unit": " мин",
              "targetMin": 10,
              "targetMax": 20
            }
          ],
          "hint": "Старый поршневой компрессор не тянет даже 10000 мкм! Нужен 2-ступенчатый насос до 300-500 мкм и тест перекрытых вентилей на 10-15 минут.",
          "winRule": "Эталон чистоты трассы (особенно с POE) — вакуум < 500 микрон и стабильный Vacuum Decay Test (нет роста давления после отсечки насоса)."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "VAC-703",
          "speaker": "Сервисный инженер Илья",
          "telemetry": [
            {
              "label": "Насос качал",
              "val": "350 микрон",
              "bad": false
            },
            {
              "label": "Кран закрыт",
              "val": "Ползёт -> 4000 мкм ровно",
              "bad": true
            }
          ],
          "situation": "После перекрытия вентиля вакуумного насоса показания цифрового вакуумметра медленно поднялись с 350 до 1200 микрон, но затем ОСТАНОВИЛИСЬ на 1200 и дальше не растут! Что внутри трассы: дыра на улицу или остаточная влага?",
          "choices": [
            {
              "id": "a",
              "text": "Крупная дыра на улицу — воздух сосёт снаружи",
              "outcome": "Если бы сосал наружный воздух, давление бы росло бесконечно вплоть до 760 000 микрон (атмосферы)!"
            },
            {
              "id": "b",
              "text": "Остаточная влага в масле/трубах — она кипит и выравнивается на плато давления насыщенных паров воды",
              "outcome": "Блестяще! Если график упирается в плато и стабилизируется — это влага (качаем дальше и греем/меняем масло), а если ползёт вверх бесконечно — утечка!"
            },
            {
              "id": "c",
              "text": "Сломался цифровой экран вакуумметра",
              "outcome": "Поведение вакуумметра строго повторяет физику парообразования."
            }
          ],
          "correctId": "b",
          "hint": "Утечка тащит вакуум в атмосферу до упора (бесконечный линейный рост), а вода кипит только до точки насыщения при данной температуре...",
          "winRule": "График Vacuum Decay Test: стабильное плато (например, 800-1500 мкм) = остаточная влага; неудержимый рост к атмосфере = негерметичность!"
        }
      ]
    },
    "8": {
      "title": "Заправка по электронным весам ±1г и Жидкая фаза",
      "instrument": "Digital Precision Scale",
      "mechanic": "bench_tuner",
      "badge": "HVAC / Заправка по весам",
      "brief": "Отмеряй микродозы R600a до 1 грамма и заправляй многокомпонентные смеси R404A/R410A строго жидкой фазой.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: По шильдику витрины требуется заправка **420 г** многокомпонентного фреона **R404A**. Выбери точный вес на весах (±10г) и правильное положение баллона!",
          "previewType": "scale_charge",
          "controls": [
            {
              "id": "valve",
              "kind": "pills",
              "label": "Положение баллона R404A (смесь)",
              "options": [
                "Стоя (Паром)",
                "Вверх дном (Жидкостью)"
              ],
              "init": "Стоя (Паром)",
              "targetVal": "Вверх дном (Жидкостью)"
            },
            {
              "id": "mass",
              "kind": "range",
              "label": "Масса на электронных весах (г)",
              "min": 300,
              "max": 550,
              "step": 10,
              "init": 300,
              "unit": " г",
              "targetMin": 410,
              "targetMax": 430
            }
          ],
          "hint": "R404A, R407C, R410A — это смеси нескольких газов с разной летучестью! Если брать пар стоя, состав смеси расслоится (фракционирует).",
          "winRule": "Многокомпонентные хладагенты (R404A, R407C, R410A) заправляют ТОЛЬКО жидкой фазой (перевернув баллон вентилем вниз, если нет сифонной трубки) строго по шильдику!"
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: Мастер на глаз без весов заправил бытовой холодильник на R600a (паспорт 44 г) «по давлению всаса и обмерзанию». После ухода трубка к компрессору обросла глыбой льда! Где ошибка?",
          "artifactTitle": "Domestic Fridge R600a — Field Service",
          "items": [
            {
              "id": "wg1",
              "code": "Точность заправки: ±1 г (Требуется для R600a)",
              "label": "Паспортный допуск дозы изобутана"
            },
            {
              "id": "wg2",
              "code": "Способ дозирования: «на глаз по манометру» вместо весов -> перелив 75г!",
              "label": "Методика заправки микродоз R600a"
            },
            {
              "id": "wg3",
              "code": "Вакуум: выполнен до 400 микрон",
              "label": "Качество вакуумирования контура"
            },
            {
              "id": "wg4",
              "code": "Шов капиллярки в фильтр: проверен мылом под азотом",
              "label": "Герметичность пайки"
            }
          ],
          "defectId": "wg2",
          "fixedCode": "Заправка R600a ИСКЛЮЧИТЕЛЬНО по ювелирным/холодильным весам с точностью 1 г!",
          "hint": "Давление R600a в вакууме (-0.4..-0.6 бар) слишком нечувствительно, и даже +10..15 лишних грамм заливают компрессор жидкостью!",
          "winRule": "Бытовые системы с R600a (30–65г) невозможно точно заправить «по давлению»: только обнуление шланга и дозирование по весам ±1г."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери правильную последовательность заправки холодильника строго 48 граммами R600a, не теряя газ в шлангах.",
          "chips": [
            {
              "id": "sc1",
              "text": "Отвакуумировать систему И шланг до самого вентиля баллона (перекрыв коллектор)"
            },
            {
              "id": "sc2",
              "text": "Поставить баллон R600a на весы, открыть баллон (заполнив шланг) и нажать TARE (0.0 г)"
            },
            {
              "id": "sc3",
              "text": "Приоткрывать вентиль LP до -48.0 г на дисплее весов и закрыть кран"
            },
            {
              "id": "sc4",
              "text": "Налить сначала жидкий R410A поверх R600a для ускорения"
            }
          ],
          "correctOrder": [
            "sc1",
            "sc2",
            "sc3"
          ],
          "hint": "Если нажать TARE ДО заполнения заправочного шланга фреоном, то весь объём шланга (15-20г!) недопоступит в холодильник!",
          "winRule": "Золотой лайфхак весов: сначала отвакуумируйте шланг, затем пустите газ из баллона в шланг (при закрытом кране в холодильник) и ТОЛЬКО ПОТОМ жмите TARE = 0г!"
        }
      ]
    },
    "9": {
      "title": "Диагностика No Frost: ТЭН, Биметалл и Термофьюз",
      "instrument": "No-Frost Continuity Meter",
      "mechanic": "probe_diagnostic",
      "badge": "HVAC / No Frost",
      "brief": "Прозванивай цепочку автоматической оттайки No Frost: испаритель больше не зарастёт шубой.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: Морозилка No Frost работает, но нижняя холодильная камера тёплая (+14°C), а весь испаритель забит сплошной глыбой льда! Прозвони компоненты оттайки на холодном испарителе (-12°C).",
          "meterName": "NO-FROST OHM TESTER",
          "normalSpec": "ТЭН ~200-400 Ом | Термопредохранитель ~0 Ом | Биметалл при -12°C ~0 Ом",
          "points": [
            {
              "id": "nf1",
              "name": "Нагреватель оттайки (ТЭН)",
              "pin": "Heater Plug",
              "reading": "285.4",
              "unit": "Ohm",
              "meterNote": "Спираль/стеклянный ТЭН исправен (~180-200 Вт мощности)."
            },
            {
              "id": "nf2",
              "name": "Тепловой предохранитель (Thermal Fuse +72°C)",
              "pin": "Fuse Loop",
              "reading": "OL (Обрыв!)",
              "unit": "∞ Ohm",
              "meterNote": "Перегорел одноразовый термопредохранитель (обычно срабатывает при +72..77°C, если отказал биметалл и не отключил ТЭН)!"
            },
            {
              "id": "nf3",
              "name": "Биметалл оттайки (при льде -12°C)",
              "pin": "Bimetal Loop",
              "reading": "0.3",
              "unit": "Ohm",
              "meterNote": "На морозе биметаллический контакт замкнут — разрешает оттайку."
            },
            {
              "id": "nf4",
              "name": "Вентилятор испарителя и дренаж",
              "pin": "Fan / Drain",
              "reading": "Крутит / Дренаж чист",
              "unit": "",
              "meterNote": "Обдув и слив талой воды не перекрыты."
            }
          ],
          "faultId": "nf2",
          "hint": "ТЭН (285 Ом) и холодный биметалл (0.3 Ом) замкнуты, но один защитный элемент навсегда в обрыве (OL)...",
          "winRule": "Термопредохранитель (+72..+77°C) — одноразовая страховка от пожара! При его сгорании меняют его в паре с проверкой залипания биметалла/реле платы."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: После замены ТЭНа мастер проверил биметаллический термостат прямо в тёплой комнате (+24°C), увидел OL (обрыв) и выкинул совершенно рабочий биметалл! Почему он ошибся?",
          "artifactTitle": "Bimetal Defrost Thermostat Lab",
          "items": [
            {
              "id": "bm1",
              "code": "Паспорт биметалла: Замыкание <= -5°C | Размыкание >= +10°C",
              "label": "Температурная петля гистерезиса контактов"
            },
            {
              "id": "bm2",
              "code": "Тест стажёра: Измерил сопротивление при +24°C и решил что «сгорел»!",
              "label": "Методика диагностики биметаллического датчика"
            },
            {
              "id": "bm3",
              "code": "Герметичная заливка корпуса эпоксидным компаундом",
              "label": "Влагозащита клемм внутри морозилки"
            },
            {
              "id": "bm4",
              "code": "Пружинная клипса крепления плотно к трубке испарителя",
              "label": "Тепловой контакт для точного снятия конца оттайки"
            }
          ],
          "defectId": "bm2",
          "fixedCode": "Биметалл проверяют ЗАМОРОЖЕННЫМ (в льду при -10..-15°C должно стать 0 Ом!), при +24°C он ДОЛЖЕН быть разомкнут!",
          "hint": "Если бы биметалл был замкнут при +24°C, ТЭН грел бы холодильник круглосуточно как электроплитка!",
          "winRule": "Биметаллический датчик оттайки в тепле (> +10°C) ВСЕГДА разомкнут (OL)! Его прозванивают только охлаждённым на испарителе (или в ледяной ванне при -10°C -> ~0 Ом)."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Классифицируй показания щупа при диагностике No Frost (что норма, а что неисправность)!",
          "bins": [
            {
              "id": "norm",
              "label": "✓ Исправный узел",
              "color": "emerald"
            },
            {
              "id": "fault",
              "label": "✗ Неисправность (под замену)",
              "color": "rose"
            }
          ],
          "cards": [
            {
              "tag": "Предохранитель",
              "specimen": "Термопредохранитель показывает 0.2 Ома на омметре",
              "context": "Независимо от температуры в комнате",
              "targetBin": "norm",
              "rule": "Живой термопредохранитель звонится накоротко (~0 Ом) при любой рабочей температуре ниже +70°C."
            },
            {
              "tag": "Спираль",
              "specimen": "ТЭН оттайки показывает OL (бесконечное сопротивление)",
              "context": "Обрыв внутри стеклянной/металлической трубки",
              "targetBin": "fault",
              "rule": "У исправного ТЭНа сопротивление 200-400 Ом; обрыв OL требует замены нагревателя."
            },
            {
              "tag": "Заслонка",
              "specimen": "Замёрзший дренажный канал с лужей льда под ящиками",
              "context": "Талая вода льётся прямо на пол",
              "targetBin": "fault",
              "rule": "При засоре дренажа льдом система не отводит воду — нужно прочистить трубку тёплой водой/парогенератором."
            }
          ],
          "hint": "ТЭН должен показывать 200-400 Ом, термопредохранитель ~0 Ом, дренаж — свободно пропускать воду.",
          "winRule": "4 кита No Frost: Вентилятор (дуть холод), ТЭН + Таймер/Датчик (растапливать лёд), Биметалл+Фьюз (останавливать нагрев вовремя) и чистый Дренаж."
        }
      ]
    },
    "10": {
      "title": "Итоговая практика HVAC: Контроллер Eliwell и Запуск витрины",
      "instrument": "Eliwell ID974 Commissioning",
      "mechanic": "workshop_quest",
      "badge": "HVAC / Финал",
      "brief": "Выполни полную пусконаладку коммерческой среднетемпературной витрины: настрой уставку Set, дифференциал diF и цикл оттайки.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "HV-FIN",
          "speaker": "Директор магазина",
          "telemetry": [
            {
              "label": "Витрина",
              "val": "Молочка (+2..+4°C)",
              "bad": false
            },
            {
              "label": "Компрессор",
              "val": "Вкл/Выкл каждые 40 сек!",
              "bad": true
            }
          ],
          "situation": "Новую молочную витрину смонтировали, но компрессор дёргается и щёлкает каждые 40 секунд («короткие циклы»), при этом температура скачет. В контроллере Eliwell нашли параметр `diF = 0.2`. Что это и как спасти компрессор?",
          "choices": [
            {
              "id": "a",
              "text": "Отключить контроллер и пустить компрессор напрямую в розетку без термостата",
              "outcome": "Вся молочка в витрине превратится в кусок льда при -12°C!"
            },
            {
              "id": "b",
              "text": "Увеличить гистерезис (дифференциал) `diF = 2.0 K` (при `Set = +2°C`: выкл при +2°C, вкл при +4°C) и проверить паузу `OdO/dOn`",
              "outcome": "Мастерское решение! Теперь компрессор уверенно держит коридор +2..+4°C с нормальными паузами отдыха."
            },
            {
              "id": "c",
              "text": "Опустить `Set` до -18°C",
              "outcome": "Это заморозит напитки и не решит малый гистерезис."
            }
          ],
          "correctId": "b",
          "hint": "Какой параметр контроллеров Eliwell/Carel задаёт разницу градусов между температурой выключения (`Set`) и обратного включения компрессора?",
          "winRule": "Дифференциал `diF` (обычно 2–3 K) задаёт окно температуры (`Set` .. `Set + diF`), защищая компрессор от убийственных частых пусков."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Запрограммируй параметры контроллера для гастрономической витрины (+2°C .. +4°C) с автоматической оттайкой каждые 6 часов (длительностью 20-30 мин).",
          "previewType": "ph_cycle",
          "controls": [
            {
              "id": "setp",
              "kind": "range",
              "label": "Set (Уставка выключения °C)",
              "min": -10,
              "max": 10,
              "step": 1,
              "init": -6,
              "unit": "°C",
              "targetMin": 2,
              "targetMax": 2
            },
            {
              "id": "dif",
              "kind": "range",
              "label": "diF (Гистерезис / Разброс K)",
              "min": 0.5,
              "max": 5.0,
              "step": 0.5,
              "init": 0.5,
              "unit": " K",
              "targetMin": 2.0,
              "targetMax": 2.5
            },
            {
              "id": "dit",
              "kind": "pills",
              "label": "Интервал оттайки (dit)",
              "options": [
                "Отключена (0ч)",
                "6 часов",
                "96 часов"
              ],
              "init": "Отключена (0ч)",
              "targetVal": "6 часов"
            }
          ],
          "hint": "Среднетемпературная молочная витрина: Set = +2°C, diF = 2.0 K (то есть включение при +4°C), оттайка раз в 6 часов.",
          "winRule": "Проверенная база настройки Eliwell/Carel: `Set = +2°C`, `diF = 2.0 K`, `dit = 6h`, `dEt = 20-30 min` и ограничение `dSt = +8..+10°C`."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: Заключительный аудит сдачи объекта «под ключ». Найди единственную оставленную недоделку в пусконаладочном акте!",
          "artifactTitle": "Commissioning Sign-Off Sheet",
          "items": [
            {
              "id": "ch1",
              "code": "Вакуумирование < 400 мкм + Заправка по весам 480г",
              "label": "Подготовка и заправка хладагентом"
            },
            {
              "id": "ch2",
              "code": "Опрессовка N2 12 бар: 0 падения за 12ч",
              "label": "Проверка герметичности"
            },
            {
              "id": "ch3",
              "code": "Сетчатый датчик Pb1 висит прямо в струе холодного воздуха перед испарителем",
              "label": "Расположение термодатчика камеры"
            },
            {
              "id": "ch4",
              "code": "Ток компрессора I_work в номинале шильдика",
              "label": "Электрический замер токовыми клещами"
            }
          ],
          "defectId": "ch3",
          "fixedCode": "Перенести Pb1 на возвратный поток тёплого воздуха (всас испарителя), чтобы видеть реальную T°C витрины!",
          "hint": "Если датчик Pb1 висит на ВЫХОДЕ холодного воздуха с ламелей (-10°C), он отключит компрессор раньше, чем остынут продукты в витрине!",
          "winRule": "Датчик температуры воздуха Pb1 ставится на входе возвратного воздуха в испаритель — там он меряет реальную температуру камеры без ложных срабатываний."
        }
      ]
    },
    "11": {
      "title": "Инверторные компрессоры BLDC и IPM-модуль",
      "instrument": "BLDC Inverter Analyzer",
      "mechanic": "defect_inspector",
      "badge": "HVAC / Инверторы BLDC",
      "brief": "Проверяй симметрию обмоток U-V-W, импульс управления ШИМ и отличай пробой компрессора от IPM-платы.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: В цехе изучают диагностическую карту инверторного холодильника, который уходит в ошибку старта. Найди критическую неисправность в замерах узла!",
          "artifactTitle": "Протокол замеров — Инверторный агрегат BLDC (40..150 Гц)",
          "items": [
            {
              "id": "bl1",
              "code": "Шлейф MAIN -> INVERTER: импульсы ШИМ (PWM) 0..5 В стабильно присутствуют",
              "label": "Команда запуска с главной платы"
            },
            {
              "id": "bl2",
              "code": "Сопротивление между фазами компрессора: U-V = 9.4 Ом, V-W = 14.8 Ом, U-W = 4.2 Ом!",
              "label": "Симметрия трёхфазных обмоток BLDC"
            },
            {
              "id": "bl3",
              "code": "Мегаомметр 500В (фазы на корпус): > 200 МОм (пробоя изоляции нет)",
              "label": "Проверка изоляции статора на корпус"
            },
            {
              "id": "bl4",
              "code": "Питание +310 В DC на банках конденсатора платы инвертора в норме",
              "label": "Силовой выпрямитель инвертора"
            }
          ],
          "defectId": "bl2",
          "fixedCode": "Замена компрессора BLDC! У исправного статора U-V = V-W = U-W (строгая симметрия ~9.5 Ом каждая пара).",
          "hint": "У трёхфазного мотора BLDC с одинаковыми обмотками все три пары выводов (U-V, V-W, U-W) обязаны иметь ОДИНАКОВОЕ сопротивление!",
          "winRule": "Разброс сопротивлений U-V / V-W / U-W однозначно указывает на межвитковое замыкание или подгорание обмотки самого BLDC-компрессора.",
          "failReasons": {
            "bl1": "Наличие импульсов ШИМ говорит, что главная плата управления исправно шлёт команду.",
            "bl3": "Высокое мегаомное сопротивление (>200 МОм) на корпус подтверждает целостность изоляции от пробоя на землю.",
            "bl4": "+310 В на звене постоянного тока означает исправность диодного моста питания."
          }
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "BLDC-220V",
          "speaker": "Напарник в мастерской",
          "telemetry": [
            {
              "label": "Компрессор",
              "val": "3-фазн. BLDC",
              "bad": false
            },
            {
              "label": "Идея теста",
              "val": "В розетку 220В",
              "bad": true
            }
          ],
          "prompt": "Раунд 2: Напарник хочет быстро проверить инверторный трёхфазный компрессор (BLDC) тестовым шнуром, включив две клеммы прямо в розетку 220 В 50 Гц!",
          "situation": "Диагностика инверторного холодильника на столе мастера в лаборатории HVAC.",
          "choices": [
            {
              "id": "inv_stop",
              "text": "Срочно остановить! BLDC работает только от трёхфазного частотника IPM; от 220 В сгорят обмотки и размагнитится ротор",
              "outcome": "Компрессор спасён! Проверку BLDC выполняют мультиметром (симметрия U-V-W) и частотным инверторным тестером."
            },
            {
              "id": "inv_ok",
              "text": "Подключить на 3 секунды — если загудит, значит ротор не заклинил",
              "outcome": "Прямые 220 В 50 Гц мгновенно сжигают низкоомную статорную обмотку и портят неодимовые магниты ротора."
            },
            {
              "id": "inv_cap",
              "text": "Подбросить пусковое реле и конденсатор от обычного On/Off мотора",
              "outcome": "Несовместимо: у BLDC нет пусковой обмотки S и три вывода равнозначны (U-V-W)."
            }
          ],
          "correctId": "inv_stop",
          "hint": "Инверторный BLDC питается переменным по частоте 3-фазным сигналом (40–150 Гц) и не имеет обмоток Start/Run под сеть 50 Гц.",
          "winRule": "Включать инверторный компрессор BLDC в 220 В КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО! Тест ведут замером симметрии U-V-W, мегаомметром и IPM-тестером."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 3: Обмотки BLDC симметричны (9.5 / 9.5 / 9.5 Ом), ротор крутится инвертор-тестером! Но от родной платы мотор не стартует — проверь точки IPM-платы инвертора.",
          "meterName": "INVERTER IPM DIAGNOSTIC",
          "normalSpec": "ШИМ 5В + DC Link +310В + целые ключи IGBT без КЗ",
          "points": [
            {
              "id": "ipm_pwm",
              "name": "Шлейф MAIN -> INV",
              "pin": "Сигнал PWM",
              "reading": "5.0 В (импульсы)",
              "unit": "PWM OK",
              "meterNote": "Главный контроллер отправляет корректную команду запуска."
            },
            {
              "id": "ipm_dc",
              "name": "Звено постоянного тока",
              "pin": "DC-Link Caps",
              "reading": "+310",
              "unit": "В DC",
              "meterNote": "Сетевой выпрямитель и конденсаторы заряжены нормально."
            },
            {
              "id": "ipm_gate",
              "name": "Силовые ключи IPM (U/V/W)",
              "pin": "Фаза U -> GND",
              "reading": "0.8 Ом (КЗ!)",
              "unit": "ПРОБОЙ!",
              "meterNote": "Короткое замыкание одного плеча IGBT-транзистора внутри IPM-модуля!"
            },
            {
              "id": "ipm_ntc",
              "name": "Термодатчик радиатора",
              "pin": "NTC Sensor",
              "reading": "10.0",
              "unit": "кОм",
              "meterNote": "При +25°C датчик исправен, перегрева на радиаторе нет."
            }
          ],
          "faultId": "ipm_gate",
          "hint": "Если ШИМ-команда и 310 В на плате есть, а компрессор исправен — прозвони силовые IGBT-ключи IPM-модуля на короткое замыкание!",
          "winRule": "При исправном моторе BLDC и присутствии ШИМ-команды пробой IGBT-плеча IPM-модуля (0.8 Ом на землю) требует замены инвертора.",
          "failReasons": {
            "ipm_pwm": "Сигнал ШИМ доходит до инвертора.",
            "ipm_dc": "Звено постоянного тока +310 В заряжено нормально.",
            "ipm_ntc": "Термодатчик исправен и показывает штатные 10 кОм."
          }
        }
      ]
    },
    "12": {
      "title": "Квалификационная пусконаладка и Паспорт ГТО",
      "instrument": "Commissioning Passport Builder",
      "mechanic": "code_or_formula_builder",
      "badge": "HVAC / Паспорт ГТО",
      "brief": "Пройди 4 этапа сдачи холодильной камеры: азот, вакуум <500 мкм, весы и контроль перегрева 6–8 K.",
      "rounds": [
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 1: Расставь 4 строгих этапа приёмо-сдаточных испытаний холодильной камеры для оформления официального Паспорта ГТО!",
          "chips": [
            {
              "id": "gt1",
              "text": "1. Опрессовка сухим азотом (N2) + проверка спада давления на плотность"
            },
            {
              "id": "gt2",
              "text": "2. Глубокое вакуумирование (< 500 микрон) + тест удержания вакуума"
            },
            {
              "id": "gt3",
              "text": "3. Заправка хладагента строго по электронным весам (граммовка шильдика)"
            },
            {
              "id": "gt4",
              "text": "4. Вывод на режим: замер перегрева (6–8 K), тока и настройка контроллера"
            }
          ],
          "correctOrder": [
            "gt1",
            "gt2",
            "gt3",
            "gt4"
          ],
          "hint": "Сначала доказываем прочность/герметичность азотом, потом сушим и удаляем воздух вакуумом, далее точная заправка на весах и пуск в рабочий режим.",
          "winRule": "Каноническая цепь пусконаладки ГТО: Азот N2 -> Вакуум <500 мкм -> Весы -> Настройка перегрева 6–8 K и температурных порогов контроллера."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Выведи сдаваемую торговую камеру (+2°C) в идеальные нормы паспорта ГТО: полный перегрев 6–8 K, вакуум до заправки <= 400 микрон и герметичность N2.",
          "previewType": "ph_cycle",
          "controls": [
            {
              "id": "vac",
              "kind": "range",
              "label": "Глубина вакуума (перед заправкой)",
              "min": 200,
              "max": 2000,
              "step": 200,
              "init": 1600,
              "unit": " мкм",
              "targetMin": 200,
              "targetMax": 400
            },
            {
              "id": "sh",
              "kind": "range",
              "label": "Полный перегрев (Superheat) на режиме",
              "min": 1,
              "max": 15,
              "step": 1,
              "init": 1,
              "unit": " K",
              "targetMin": 6,
              "targetMax": 8
            },
            {
              "id": "leak",
              "kind": "pills",
              "label": "Протокол опрессовки N2 и ток компрессора",
              "options": [
                "Есть спад давления / Перегруз",
                "Контур герметичен / Ток в норме"
              ],
              "init": "Есть спад давления / Перегруз",
              "targetVal": "Контур герметичен / Ток в норме"
            }
          ],
          "hint": "Глубокий вакуум обязан быть глубже 500 мкм (лучше 200–400 мкм), оптимальный рабочий перегрев ТРВ — 6–8 K, утечек по N2 ноль.",
          "winRule": "Показания в допуске ГТО: герметичный контур, вакуум <500 микрон, рабочий перегрев 6–8 K и номинальный ток компрессора.",
          "failRule": "При перегреве 1 K опасность гидроудара, а при 1600 мкм в системе остаётся влага!"
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Реши по итогам приёмки, какие пункты позволяют подписать Акт допуска камеры, а какие отправляют объект на доработку!",
          "bins": [
            {
              "id": "gto_pass",
              "label": "Допуск ГТО разрешён",
              "color": "emerald"
            },
            {
              "id": "gto_hold",
              "label": "Запрет пуска (Устранить)",
              "color": "rose"
            }
          ],
          "cards": [
            {
              "tag": "Режим и тепло",
              "specimen": "Камера стабильно вышла на +2.0°C, перегрев 7 K, ток 3.1 A (паспорт 3.4 A)",
              "context": "Автоматика корректно отключает и запускает цикл",
              "targetBin": "gto_pass",
              "rule": "Выход на уставку, оптимальный перегрев и ток в пределах номинала подтверждают норму."
            },
            {
              "tag": "Защита от аварии",
              "specimen": "Сломан термофьюз защиты оттайки, нагреватель запитан мимо контроллера напрямую",
              "context": "Угроза расплавления поддона и пожара",
              "targetBin": "gto_hold",
              "rule": "Эксплуатация с неисправной аварийной защитой строго запрещена!"
            },
            {
              "tag": "Документ сдачи",
              "specimen": "В акте записаны давления LP/HP, масса фреона, вакуум 320 мкм и гистерезис",
              "context": "Заказчик проинструктирован, гарантийный паспорт подписан",
              "targetBin": "gto_pass",
              "rule": "Точные цифры замеров До/После делают паспорт ГТО юридически и технически полноценным."
            }
          ],
          "hint": "Исправные защитные цепи, рабочие параметры в допуске и документация -> допуск; обойдённые защиты -> категорический запрет!",
          "winRule": "Подпись мастера ГТО подтверждает: герметичность 100%, холод держится, номинал тока соблюдён, все аварийные защиты в работе."
        }
      ]
    },
    "13": {
      "title": "Тренажёр: Промышленные сплит-системы, VRF/VRV-мультизональные систем",
      "instrument": "Рефнеты (Y-ответвители)",
      "mechanic": "workshop_quest",
      "badge": "HVAC / Урок 13",
      "brief": "Архитектура мультизональных систем VRF/VRV: монтаж рефнетов в горизонте, маслоподъёмные петли и дозаправка хладагента по длине трассы.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-131",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 13/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Промышленные сплит-системы, VRF/VRV-мультизональные системы и расчёт трасс»: Как называется специальный Y-образный медный разветвитель в системах VRF/VRV?",
          "choices": [
            {
              "id": "a",
              "text": "Рефнет",
              "outcome": "Рефнеты обеспечивают равномерное деление потока хладагента."
            },
            {
              "id": "b",
              "text": "Термостат",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Ресивер",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Манометр",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Рефнеты обеспечивают равномерное деление потока хладагента.",
          "winRule": "Отлично! Примените правило: Рефнеты обеспечивают равномерное деление потока хладагента."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Промышленные сплит-системы, VRF/VRV-мультизональные системы и расчёт трасс».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Рефнеты (Y-ответвители))"
            },
            {
              "id": "s2",
              "text": "2. Указана правильная ориентация рефнета"
            },
            {
              "id": "s3",
              "text": "3. Объяснена роль маслоподъёмной петли"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Описан расчёт дозаправки по жидкостной линии"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-133",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Рефнеты (Y-ответвители",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Для чего на вертикальных стояках газовой линии устанавливают маслоподъёмную петлю?",
          "choices": [
            {
              "id": "a",
              "text": "Для возврата компрессорного масла в наружный блок при низких нагрузках",
              "outcome": "При падении скорости газа масло стекает вниз — петля создаёт пробку для его подъёма."
            },
            {
              "id": "b",
              "text": "Для слива конденсата",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Для охлаждения кабеля",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Для сброса воздуха",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "При падении скорости газа масло стекает вниз — петля создаёт пробку для его подъёма.",
          "winRule": "Зачёт по модулю №13 подтверждён!"
        }
      ]
    },
    "14": {
      "title": "Тренажёр: Инверторные компрессоры (BLDC) и силовые платы IPM: диагно",
      "instrument": "Мультиметр",
      "mechanic": "workshop_quest",
      "badge": "HVAC / Урок 14",
      "brief": "Проверка трёхфазных инверторных компрессоров: равенство сопротивления обмоток U-V-W, тест силового модуля IPM и термисторов NTC.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-141",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 14/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Инверторные компрессоры (BLDC) и силовые платы IPM: диагностика обмоток и датчиков»: Каким должно быть соотношение сопротивлений между клеммами U-V, V-W и U-W у исправного инверторного компрессора?",
          "choices": [
            {
              "id": "a",
              "text": "Абсолютно равным (симметричным)",
              "outcome": "Все три фазы BLDC-статора имеют одинаковое число витков."
            },
            {
              "id": "b",
              "text": "Различаться в 3 раза",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Равно нулю (0.0 Ом)",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Бесконечность",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Все три фазы BLDC-статора имеют одинаковое число витков.",
          "winRule": "Отлично! Примените правило: Все три фазы BLDC-статора имеют одинаковое число витков."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Инверторные компрессоры (BLDC) и силовые платы IPM: диагностика обмоток и датчиков».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Мультиметр)"
            },
            {
              "id": "s2",
              "text": "2. Указан замер равенства обмоток U-V-W"
            },
            {
              "id": "s3",
              "text": "3. Описана проверка пробоя на корпус мегомметром"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Упомянута проверка силового модуля IPM"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-143",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Мультиметр",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой узел платы наружного блока формирует 3-фазное переменное напряжение для инверторного компрессора?",
          "choices": [
            {
              "id": "a",
              "text": "Силовой модуль IPM (IGBT)",
              "outcome": "IPM (Intelligent Power Module) инвертирует постоянный ток шины DC в 3 фазы."
            },
            {
              "id": "b",
              "text": "Термистор NTC",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Трёхходовой клапан",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Капиллярная трубка",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "IPM (Intelligent Power Module) инвертирует постоянный ток шины DC в 3 фазы.",
          "winRule": "Зачёт по модулю №14 подтверждён!"
        }
      ]
    },
    "15": {
      "title": "Тренажёр: Электронные расширительные вентили (ЭРВ / EEV) и точное ре",
      "instrument": "Магнитный тест-индикатор ЭРВ",
      "mechanic": "workshop_quest",
      "badge": "HVAC / Урок 15",
      "brief": "Устройство шагового двигателя ЭРВ (5/6 проводов), проверка обмоток катушки и заклинивания иглы дросселя.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-151",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 15/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Электронные расширительные вентили (ЭРВ / EEV) и точное регулирование перегрева»: Какой привод перемещает запорную иглу внутри электронного расширительного вентиля (ЭРВ)?",
          "choices": [
            {
              "id": "a",
              "text": "Шаговый электродвигатель",
              "outcome": "Контроллер подаёт импульсы на обмотки шагового двигателя ЭРВ."
            },
            {
              "id": "b",
              "text": "Сильфон с газом",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Биметаллическая пружина",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Давление масла",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Контроллер подаёт импульсы на обмотки шагового двигателя ЭРВ.",
          "winRule": "Отлично! Примените правило: Контроллер подаёт импульсы на обмотки шагового двигателя ЭРВ."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Электронные расширительные вентили (ЭРВ / EEV) и точное регулирование перегрева».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Магнитный тест-индикатор ЭРВ)"
            },
            {
              "id": "s2",
              "text": "2. Указана проверка сопротивления обмоток шагового двигателя"
            },
            {
              "id": "s3",
              "text": "3. Описаны симптомы по давлению и перегреву"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Упомянут тест вращения магнитного поля"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-153",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Магнитный тест-индикат",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Как можно убедиться в механическом вращении ротора ЭРВ при подаче питания?",
          "choices": [
            {
              "id": "a",
              "text": "Снять катушку и приложить магнитный индикатор или прокрутить вручную магнитом",
              "outcome": "Магнитный тестер визуализирует вращение поля катушки."
            },
            {
              "id": "b",
              "text": "Нагреть горелкой",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Ударить молотком",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Замкнуть 220 В",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Магнитный тестер визуализирует вращение поля катушки.",
          "winRule": "Зачёт по модулю №15 подтверждён!"
        }
      ]
    },
    "16": {
      "title": "Тренажёр: Промышленные чиллеры и фанкойлы: гидравлический контур, гл",
      "instrument": "Реле протока (Flow Switch)",
      "mechanic": "workshop_quest",
      "badge": "HVAC / Урок 16",
      "brief": "Взаимодействие фреонового и водяного контуров через пластинчатый теплообменник, настройка реле протока и антифриза.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-161",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 16/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Промышленные чиллеры и фанкойлы: гидравлический контур, гликоль и защита от размораживания»: Какой датчик предотвращает запуск компрессора чиллера при остановке водяного насоса?",
          "choices": [
            {
              "id": "a",
              "text": "Реле протока (Flow Switch)",
              "outcome": "Без подтверждения протока воды контроллер не разрешает старт компрессора."
            },
            {
              "id": "b",
              "text": "Датчик освещённости",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Термостат оттайки",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Датчик CO2",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Без подтверждения протока воды контроллер не разрешает старт компрессора.",
          "winRule": "Отлично! Примените правило: Без подтверждения протока воды контроллер не разрешает старт компрессора."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Промышленные чиллеры и фанкойлы: гидравлический контур, гликоль и защита от размораживания».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Реле протока (Flow Switch))"
            },
            {
              "id": "s2",
              "text": "2. Указана проверка реле протока"
            },
            {
              "id": "s3",
              "text": "3. Упомянут контроль гликоля рефрактометром"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Описана защита пластинчатого теплообменника"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-163",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Реле протока (Flow Swi",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Каким прибором проверяют концентрацию гликоля (температуру замерзания) в контуре?",
          "choices": [
            {
              "id": "a",
              "text": "Рефрактометром",
              "outcome": "Рефрактометр по преломлению света точно определяет точку замерзания раствора."
            },
            {
              "id": "b",
              "text": "Омметром",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Анемометром",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Тахометром",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Рефрактометр по преломлению света точно определяет точку замерзания раствора.",
          "winRule": "Зачёт по модулю №16 подтверждён!"
        }
      ]
    },
    "17": {
      "title": "Тренажёр: Тепловые насосы воздух-вода и четырёхходовой клапан: режим",
      "instrument": "Манометрический коллектор",
      "mechanic": "workshop_quest",
      "badge": "HVAC / Урок 17",
      "brief": "Реверсирование холодильного цикла четырёхходовым клапаном, диагностика его перепуска и логика цикла размораживания наружного блока.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-171",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 17/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Тепловые насосы воздух-вода и четырёхходовой клапан: режим обогрева и оттайка (Defrost)»: Какой узел меняет направление движения хладагента для перехода из режима охлаждения в обогрев?",
          "choices": [
            {
              "id": "a",
              "text": "Четырёхходовой реверсивный клапан",
              "outcome": "Четырёхходовой клапан переключает нагнетание и всасывание между теплообменниками."
            },
            {
              "id": "b",
              "text": "Обратный клапан",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Фильтр-осушитель",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Смотровое стекло",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Четырёхходовой клапан переключает нагнетание и всасывание между теплообменниками.",
          "winRule": "Отлично! Примените правило: Четырёхходовой клапан переключает нагнетание и всасывание между теплообменниками."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Тепловые насосы воздух-вода и четырёхходовой клапан: режим обогрева и оттайка (Defrost)».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Манометрический коллектор)"
            },
            {
              "id": "s2",
              "text": "2. Указана проверка питания катушки клапана"
            },
            {
              "id": "s3",
              "text": "3. Описан метод замера температур на 4 патрубках"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Объяснены признаки перепуска или заклинивания"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-173",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Манометрический коллек",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Что происходит во время цикла оттайки (Defrost) наружного блока теплового насоса?",
          "choices": [
            {
              "id": "a",
              "text": "Вентилятор наружного блока останавливается, система кратковременно переходит в режим охлаждения для растопки льда",
              "outcome": "Горячий газ растапливает шубу инея на уличном теплообменнике."
            },
            {
              "id": "b",
              "text": "Включается максимальный обдув улицы",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Сбрасывается весь фреон",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Отключается питание дома",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Горячий газ растапливает шубу инея на уличном теплообменнике.",
          "winRule": "Зачёт по модулю №17 подтверждён!"
        }
      ]
    },
    "18": {
      "title": "Тренажёр: Холодильные камеры с контроллерами Eliwell / Dixell: настр",
      "instrument": "Контроллер Dixell XR60CX / Eliwell ID974",
      "mechanic": "workshop_quest",
      "badge": "HVAC / Урок 18",
      "brief": "Программирование параметров Setpoint, Hy (гистерезис), параметров оттайки ТЭНами (id, Md, dt) и времени каплепадения.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-181",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 18/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Холодильные камеры с контроллерами Eliwell / Dixell: настройка дифференциала и оттайки»: За что отвечает параметр Hy (дифференциал) в холодильном контроллере?",
          "choices": [
            {
              "id": "a",
              "text": "Задаёт температурный диапазон между выключением и включением компрессора",
              "outcome": "Слишком малый дифференциал вызывает частые пуски и перегрев компрессора."
            },
            {
              "id": "b",
              "text": "Устанавливает яркость дисплея",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Регулирует скорость вентилятора",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Сбрасывает пароль",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Слишком малый дифференциал вызывает частые пуски и перегрев компрессора.",
          "winRule": "Отлично! Примените правило: Слишком малый дифференциал вызывает частые пуски и перегрев компрессора."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Холодильные камеры с контроллерами Eliwell / Dixell: настройка дифференциала и оттайки».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Контроллер Dixell XR60CX / Eliwell ID974)"
            },
            {
              "id": "s2",
              "text": "2. Указаны Set (-18°C) и гистерезис Hy"
            },
            {
              "id": "s3",
              "text": "3. Описана роль датчика испарителя Pb2"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Учтено время каплепадения перед пуском вентилятора"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-183",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Контроллер Dixell XR60",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Куда устанавливается датчик Pb2?",
          "choices": [
            {
              "id": "a",
              "text": "Непосредственно в ламели испарителя для контроля окончания оттайки",
              "outcome": "Pb2 фиксирует момент, когда лёд на испарителе полностью растаял."
            },
            {
              "id": "b",
              "text": "На улицу",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "В щит питания",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "На компрессор",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Pb2 фиксирует момент, когда лёд на испарителе полностью растаял.",
          "winRule": "Зачёт по модулю №18 подтверждён!"
        }
      ]
    },
    "19": {
      "title": "Тренажёр: Рекуперация, сбор и регенерация хладагента: работа со стан",
      "instrument": "Станция рекуперации",
      "mechanic": "workshop_quest",
      "badge": "HVAC / Урок 19",
      "brief": "Экологичный сбор фреона без выброса в атмосферу, правило заполнения баллона не более 80% и продувка станции (Purge).",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-191",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 19/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Рекуперация, сбор и регенерация хладагента: работа со станцией эвакуации (Recovery)»: На сколько процентов максимум разрешено заполнять баллон при сборе жидкого хладагента?",
          "choices": [
            {
              "id": "a",
              "text": "Не более 80% от максимальной вместимости",
              "outcome": "20% газовой подушки необходимы для теплового расширения жидкости."
            },
            {
              "id": "b",
              "text": "На 100% до упора",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "На 10%",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "На 120%",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "20% газовой подушки необходимы для теплового расширения жидкости.",
          "winRule": "Отлично! Примените правило: 20% газовой подушки необходимы для теплового расширения жидкости."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Рекуперация, сбор и регенерация хладагента: работа со станцией эвакуации (Recovery)».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Станция рекуперации)"
            },
            {
              "id": "s2",
              "text": "2. Указано использование весов и лимит 80%"
            },
            {
              "id": "s3",
              "text": "3. Описано подключение станции через коллектор"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Упомянут режим Purge и средства защиты"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-193",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Станция рекуперации",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой прибор обязателен под баллоном во время эвакуации фреона?",
          "choices": [
            {
              "id": "a",
              "text": "Электронные заправочные весы",
              "outcome": "Весы контролируют массу собранного хладагента и не допускают переполнения."
            },
            {
              "id": "b",
              "text": "Мегомметр",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Анемометр",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Шумомер",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Весы контролируют массу собранного хладагента и не допускают переполнения.",
          "winRule": "Зачёт по модулю №19 подтверждён!"
        }
      ]
    },
    "20": {
      "title": "Тренажёр: Комплексная пусконаладка промышленного ХО, паспортизация и",
      "instrument": "Манометры",
      "mechanic": "workshop_quest",
      "badge": "HVAC / Урок 20",
      "brief": "Итоговая квалификационная защита инженера-холодильщика: опрессовка азотом, глубокое вакуумирование, перегрев/переохлаждение и расчёт COP.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-201",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 20/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Комплексная пусконаладка промышленного ХО, паспортизация и расчёт энергоэффективности (COP)»: Каким газом выполняется опрессовка фреоновой трассы на герметичность?",
          "choices": [
            {
              "id": "a",
              "text": "Сухим бескислородным азотом",
              "outcome": "Кислород при контакте с маслом взрывоопасен, а воздух содержит влагу."
            },
            {
              "id": "b",
              "text": "Кислородом",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Пропаном",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Сжатым воздухом с компрессора",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Кислород при контакте с маслом взрывоопасен, а воздух содержит влагу.",
          "winRule": "Отлично! Примените правило: Кислород при контакте с маслом взрывоопасен, а воздух содержит влагу."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Комплексная пусконаладка промышленного ХО, паспортизация и расчёт энергоэффективности (COP)».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Манометры)"
            },
            {
              "id": "s2",
              "text": "2. Указана опрессовка азотом"
            },
            {
              "id": "s3",
              "text": "3. Указан целевой вакуум < 500 микрон"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Приведены нормы перегрева/переохлаждения и COP"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "HVA-203",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Манометры",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Экзамен",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какое остаточное давление вакуумирования считается эталонным для систем на синтетических маслах POE?",
          "choices": [
            {
              "id": "a",
              "text": "Менее 500 микрон",
              "outcome": "Глубокий вакуум < 500 мкм полностью удаляет влагу и неконденсируемые газы."
            },
            {
              "id": "b",
              "text": "50 000 микрон",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "1 бар",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "10 бар",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Глубокий вакуум < 500 мкм полностью удаляет влагу и неконденсируемые газы.",
          "winRule": "Зачёт по модулю №20 подтверждён!"
        }
      ]
    }
  },
  "automechanic": {
    "1": {
      "title": "Компрессия ЦПГ, Мокрый тест и Пневмотестер",
      "instrument": "Cylinder Leak & Compression Rig",
      "mechanic": "bench_tuner",
      "badge": "Автомеханика / ЦПГ",
      "brief": "Измеряй компрессию бензинового двигателя (11-14 бар), вычисляй разброс ≤ 1 бар и отличай кольца от клапанов маслом и воздухом.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: Подготовь стенд правильного замера компрессии прогретого бензинового ДВС: максимальный допустимый разброс между цилиндрами, положение дросселя и отключение топливной/искровой цепи.",
          "previewType": "generic",
          "controls": [
            {
              "id": "spread",
              "kind": "range",
              "label": "Макс. допустимый разброс по цилиндрам",
              "min": 0.5,
              "max": 4.0,
              "step": 0.5,
              "init": 3.5,
              "unit": " бар",
              "targetMin": 0.5,
              "targetMax": 1.0
            },
            {
              "id": "throttle",
              "kind": "pills",
              "label": "Педаль газа (дроссель)",
              "options": [
                "Закрыт (0%)",
                "Выжат в пол (100%)"
              ],
              "init": "Закрыт (0%)",
              "targetVal": "Выжат в пол (100%)"
            },
            {
              "id": "fuel",
              "kind": "pills",
              "label": "Форсунки и Катушки",
              "options": [
                "Оставить включёнными",
                "Отключить (пред насоса/катушек)"
              ],
              "init": "Оставить включёнными",
              "targetVal": "Отключить (пред насоса/катушек)"
            }
          ],
          "hint": "С закрытой заслонкой цилиндру нечем наполняться! Газ жмём в пол (100%), форсунки/искру отключаем от пожара и смыва масла, а разброс не должен превышать 1.0 бар.",
          "winRule": "Правильный замер компрессии: ДВС прогрет, все свечи выкручены, форсунки/катушки отключены, дроссель на 100%, норма 11–14 бар с разбросом ≤ 1.0 бар."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 2: В 3-м цилиндре компрессия всего 7.2 бар (в остальных по 12.8 бар). Впрыснули шприцем 5 мл моторного масла в свечной колодец и замерили снова — проанализируй результат!",
          "meterName": "COMPRESSION TEST LOG",
          "normalSpec": "Норма: 11–14 бар | После масла рост -> Кольца/Гильза | Без роста -> Клапана/ГБЦ",
          "points": [
            {
              "id": "cp1",
              "name": "Цилиндр 1 (сухой замер)",
              "pin": "Cyl #1",
              "reading": "12.9",
              "unit": "bar",
              "meterNote": "Цилиндр полностью в норме."
            },
            {
              "id": "cp2",
              "name": "Цилиндр 2 (сухой замер)",
              "pin": "Cyl #2",
              "reading": "12.7",
              "unit": "bar",
              "meterNote": "Разброс с 1-м всего 0.2 бара — отлично."
            },
            {
              "id": "cp3",
              "name": "Цилиндр 3: Было 7.2 бар -> ПОСЛЕ МАСЛА стало 12.4 бар!",
              "pin": "Cyl #3 Wet",
              "reading": "+5.2 bar (Выросла!)",
              "unit": "",
              "meterNote": "Компрессия резко взлетела после капли масла! Масло уплотнило изношенные или залёгшие поршневые кольца/задир стенки."
            },
            {
              "id": "cp4",
              "name": "Цилиндр 4 (сухой замер)",
              "pin": "Cyl #4",
              "reading": "12.8",
              "unit": "bar",
              "meterNote": "Герметичность отличная."
            }
          ],
          "faultId": "cp3",
          "hint": "Куда попадает масло со дна поршня и почему после его заливки компрессия в одном из цилиндров либо резко растёт, либо остаётся прежней?",
          "winRule": "Если после добавления 5 мл масла компрессия резко выросла — проблема в поршневых кольцах/цилиндре. Если почти не изменилась — пропускают клапана или прокладка ГБЦ!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "MECH-102",
          "speaker": "Моторист Сергей",
          "telemetry": [
            {
              "label": "Cyl #2",
              "val": "Утечка 45%",
              "bad": true
            },
            {
              "label": "Звук воздуха",
              "val": "Булькает в бачке ОЖ",
              "bad": true
            }
          ],
          "situation": "Подключили пневмотестер (Leak-Down) и подали сжатый воздух в 2-й цилиндр в ВМТ такта сжатия. Куда только не слушали: в выхлопе тихо, во впуске тихо, щуп не шипит — а в расширительном бачке антифриза пошли пузыри и уровень поднялся! Диагноз?",
          "choices": [
            {
              "id": "a",
              "text": "Износ маслосъёмных колпачков",
              "outcome": "Колпачки не сообщаются с рубашкой охлаждения."
            },
            {
              "id": "b",
              "text": "Пробой прокладки ГБЦ (или микротрещина блока/головки) между 2-м цилиндром и каналом охлаждения",
              "outcome": "100% попадание! Пневмотестер безошибочно указал путь прорыва газов в антифриз еще до разборки мотора."
            },
            {
              "id": "c",
              "text": "Засорился воздушный фильтр",
              "outcome": "Никакого отношения к выходу воздуха в рубашку охлаждения."
            }
          ],
          "correctId": "b",
          "hint": "Подумай, куда физически выходит поданный в цилиндр воздух: щуп -> кольца, дроссель -> впускной клапан, глушитель -> выпускной, бачок антифриза -> ...",
          "winRule": "Пневмотестер (Leak-Down) сразу локализует точку утечки по звуку: щуп = кольца, впуск/выпуск = клапана, расширительный бачок = прокладка ГБЦ/трещина."
        }
      ]
    },
    "2": {
      "title": "Механизм ГРМ (2:1) и Тепловые зазоры клапанов",
      "instrument": "Timing & Valve Feeler Bench",
      "mechanic": "defect_inspector",
      "badge": "Автомеханика / ГРМ",
      "brief": "Выставляй фазы 2:1 без промаха на зуб и регулируй тепловые зазоры выпускных клапанов больше впускных.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: После замены ремня ГРМ мотор потерял тягу, тяжело крутится и бубнит в выпуск! Проинспектируй сборочную карту ГРМ.",
          "artifactTitle": "Timing Belt Assembly — B16 DOHC",
          "items": [
            {
              "id": "tm1",
              "code": "Передаточное отношение: 2 оборота КВ = 1 оборот РВ",
              "label": "Геометрия зубьев шкивов 4-тактного мотора"
            },
            {
              "id": "tm2",
              "code": "Шестерня выпуска: сдвинута на 1 зуб назад относительно метки ВМТ",
              "label": "Совпадение меток при затяжке натяжителя"
            },
            {
              "id": "tm3",
              "code": "Контрольная прокрутка на 2 полных оборота КВ от руки перед пуском",
              "label": "Проверка безопасного проворота и возврата меток"
            },
            {
              "id": "tm4",
              "code": "Затяжка болта ролика-натяжителя динамометрическим ключом",
              "label": "Момент затяжки крепёжного узла"
            }
          ],
          "defectId": "tm2",
          "fixedCode": "Ослабить натяжитель и строго совместить штифт/метку ВМТ на всех шкивах с контрольной прокруткой 720°!",
          "hint": "Даже 1 зуб смещения на ремне или цепи сбивает фазу открытия клапанов (а 2-3 зуба могут загнуть клапаны о поршень!).",
          "winRule": "Передаточное число ГРМ 4-тактного ДВС ровно 2:1, и после натяжения ремня ОБЯЗАТЕЛЬНО прокручивают коленвал вручную на 2 оборота (720°) для проверки меток!"
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Регулируем тепловые зазоры на холодном двигателе (+20°C): выбери плоский щуп для впускного клапана (0.15-0.25 мм) и для более горячего ВЫПУСКНОГО (0.30-0.40 мм).",
          "previewType": "generic",
          "controls": [
            {
              "id": "intake",
              "kind": "range",
              "label": "Щуп ВПУСКНОГО клапана (мм)",
              "min": 0.1,
              "max": 0.5,
              "step": 0.05,
              "init": 0.45,
              "unit": " мм",
              "targetMin": 0.15,
              "targetMax": 0.25
            },
            {
              "id": "exhaust",
              "kind": "range",
              "label": "Щуп ВЫПУСКНОГО клапана (мм)",
              "min": 0.1,
              "max": 0.5,
              "step": 0.05,
              "init": 0.1,
              "unit": " мм",
              "targetMin": 0.3,
              "targetMax": 0.4
            },
            {
              "id": "ratio",
              "kind": "pills",
              "label": "Соотношение оборотов Коленвал : Распредвал",
              "options": [
                "1:1",
                "2:1",
                "1:2"
              ],
              "init": "1:1",
              "targetVal": "2:1"
            }
          ],
          "hint": "Выпускной клапан обдувается раскалёнными выхлопными газами (~700°C), поэтому при нагреве удлиняется СИЛЬНЕЕ — ему нужен больший тепловой зазор!",
          "winRule": "Зазор выпускного клапана (~0.30-0.40 мм) всегда больше впускного (~0.15-0.25 мм) из-за большего теплового расширения; без зазора клапан прогорит!"
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Классифицируй последствия ошибок регулировки клапанных зазоров!",
          "bins": [
            {
              "id": "tight",
              "label": "Зазор МАЛ / Зажат (0.05 мм)",
              "color": "rose"
            },
            {
              "id": "loose",
              "label": "Зазор ВЕЛИК (>0.50 мм)",
              "color": "amber"
            }
          ],
          "cards": [
            {
              "tag": "Тепловой режим",
              "specimen": "Клапан перестаёт плотно садиться в седло при нагреве и ПРОГОРАЕТ",
              "context": "Выпускные газы продувают кромку тарелки",
              "targetBin": "tight",
              "rule": "Зажатый клапан не отдаёт тепло седлу и неизбежно прогорает — это намного опаснее цокота!"
            },
            {
              "tag": "Акустика",
              "specimen": "Характерный звонкий стук рокеров и повышенный износ кулачка",
              "context": "Кулачок бьёт по толкателю с разгону",
              "targetBin": "loose",
              "rule": "Избыточный зазор даёт ударную нагрузку, цокот и неполное наполнение цилиндра."
            },
            {
              "tag": "Компрессия",
              "specimen": "Падение компрессии на горячую из-за приоткрытой тарелки",
              "context": "ДВС троит именно после прогрева",
              "targetBin": "tight",
              "rule": "При прогреве стержень удлиняется и полностью «выбирает» слишком малый зазор."
            }
          ],
          "hint": "Слишком малый зазор не слышно на слух, но он незаметно сжигает тарелку клапана; слишком большой стучит.",
          "winRule": "Из двух зол зажатый клапан критически опасен прогаром тарелки и потерей компрессии, поэтому зазор всегда проверяют точным набором плоских щупов на остывшем моторе."
        }
      ]
    },
    "3": {
      "title": "Метрология ДВС: Микрометр 0.01, Нутромер и Plastigauge",
      "instrument": "Engine Metrology Bench",
      "mechanic": "code_or_formula_builder",
      "badge": "Автомеханика / Промеры",
      "brief": "Замеряй гильзы в 6 точках на овал/конус, калибруй нутромер по микрометру и читай масляный зазор Plastigauge.",
      "rounds": [
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 1: Собери правильный алгоритм замера диаметра, овальности и конусности цилиндра при капремонте.",
          "chips": [
            {
              "id": "mt1",
              "text": "Выставить микрометром номинальный размер (например 82.00 мм) для настройки нутромера на 0"
            },
            {
              "id": "mt2",
              "text": "Измерить каждый цилиндр нутромером в 3 поясах (верх, середина, низ)"
            },
            {
              "id": "mt3",
              "text": "В каждом поясе снять замер в 2 осях (вдоль и поперёк оси КВ — всего 6 точек!)"
            },
            {
              "id": "mt4",
              "text": "Замерить диаметр рулеткой на глаз по верхнему нагару"
            }
          ],
          "correctOrder": [
            "mt1",
            "mt2",
            "mt3"
          ],
          "hint": "Нутромер — сравнительный прибор (он показывает лишь +/- отклонение от нуля, настроенного по микрометру!). Минимум 3 пояса по 2 перпендикулярные оси.",
          "winRule": "Нутромер калибруется по микрометру (шаг 0.01 мм) и снимает 6 точек на цилиндр: разница поперёк/вдоль = Овальность, верх/низ = Конусность."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 2: Измеряем зазор в коренных и шатунных вкладышах калиброванной пластиковой нитью Plastigauge. Проверь замеры на шейках!",
          "meterName": "PLASTIGAUGE CRUSH SCALE",
          "normalSpec": "Рабочий масляный зазор вкладышей: 0.025 – 0.060 мм (в среднем ~0.04 мм)",
          "points": [
            {
              "id": "pg1",
              "name": "Шатунная шейка №1 (Ширина расплющенной полосы)",
              "pin": "Journal #1",
              "reading": "0.038",
              "unit": "mm",
              "meterNote": "Отличный рабочий зазор ровно 0.038 мм — масляный клин идеален."
            },
            {
              "id": "pg2",
              "name": "Шатунная шейка №2 (Очень тонкая нить — почти не сплющило)",
              "pin": "Journal #2",
              "reading": "0.110",
              "unit": "mm (ЗАЗОР ПРЕВЫШЕН)",
              "meterNote": "Нить почти не сплющилась! Зазор 0.11 мм вдвое выше допустимого: будет падать давление масла и застучит шатун."
            },
            {
              "id": "pg3",
              "name": "Коренная шейка №3",
              "pin": "Main #3",
              "reading": "0.045",
              "unit": "mm",
              "meterNote": "Зазор 0.045 мм чётко укладывается в заводской допуск."
            },
            {
              "id": "pg4",
              "name": "Точность микрометра (цена деления барабана)",
              "pin": "Scale Check",
              "reading": "0.01",
              "unit": "mm",
              "meterNote": "Штангенциркуль 0.05/0.1 мм сюда не годится — только микрометр 0.01 мм!"
            }
          ],
          "faultId": "pg2",
          "hint": "Чем ШИРЕ расплющена полоска Plastigauge — тем меньше зазор; чем УЖЕ (нетронутей) полоска — тем ОГРОМНЕЕ люфт!",
          "winRule": "Помни логику Plastigauge: узкая полоска = огромный прослабленный зазор (риск падения давления масла и проворота вкладышей!)."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: После протяжки шатуна с полоской Plastigauge коленвал чуть ли не заклинил на сборке! Найди ошибку моториста.",
          "artifactTitle": "Connecting Rod Cap Check — Log",
          "items": [
            {
              "id": "pl1",
              "code": "Поверхность шейки и вкладыша обезжирены насухо перед тестом",
              "label": "Подготовка под Plastigauge"
            },
            {
              "id": "pl2",
              "code": "Во время сжатия полоски Plastigauge провернули коленвал на 360°!",
              "label": "Действие при затяжке бугеля"
            },
            {
              "id": "pl3",
              "code": "Болты шатуна затянуты номинальным моментом динамометрическим ключом",
              "label": "Контроль усилия затяжки"
            },
            {
              "id": "pl4",
              "code": "Бугель установлен замком к замку строго по своим меткам",
              "label": "Ориентация крышки шатуна"
            }
          ],
          "defectId": "pl2",
          "fixedCode": "Никогда НЕ вращать коленвал с вложенным Plastigauge! Затянуть бугель -> открутить -> измерить бумажной шкалой -> стереть остатки!",
          "hint": "Если провернуть коленвал с пластиковой нитью внутри, она размажется по всему вкладышу и испортит показания...",
          "winRule": "Запрещено проворачивать коленвал при замере Plastigauge! Плюс: не путайте бугели коренных/шатунных опор местами и всегда ставьте замками по мануалу."
        }
      ]
    },
    "4": {
      "title": "Системы Смазки (bar) и Охлаждения (1.2 bar)",
      "instrument": "Oil & Coolant Pressure Rig",
      "mechanic": "probe_diagnostic",
      "badge": "Автомеханика / Масло и ОЖ",
      "brief": "Перепроверяй аварийную лампу масла механическим манометром, испытывай клапан крышки ОЖ и лови заклинивший термостат.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: Двигатель перегревается в пробке через 15 минут езды, а вентилятор даже не включается, хотя нижний патрубок ледяной! Промерь контур смазки и охлаждения.",
          "meterName": "PYROMETER & PRESSURE BENCH",
          "normalSpec": "Масло XX ≥ 1.2-1.5 бар | ОЖ крышка 1.1-1.4 бар | Термостат открыт при ~87-92°C",
          "points": [
            {
              "id": "oc1",
              "name": "Механический манометр масла на XX (90°C)",
              "pin": "Oil Port",
              "reading": "1.6",
              "unit": "bar",
              "meterNote": "Давление масла на горячем холостом ходу отличное (норма ≥ 1.2-1.5 бар)."
            },
            {
              "id": "oc2",
              "name": "Верхний патрубок ОЖ при T_ДВС = 104°C",
              "pin": "Upper Hose",
              "reading": "+102.0",
              "unit": "°C (Кипяток)",
              "meterNote": "Малый круг раскалён сверх нормы."
            },
            {
              "id": "oc3",
              "name": "Нижний патрубок радиатора при T_ДВС = 104°C",
              "pin": "Lower Hose",
              "reading": "+31.0",
              "unit": "°C (ХОЛОДНЫЙ!)",
              "meterNote": "Большой круг закрыт! Заклинил термостат в закрытом положении — антифриз не идёт в радиатор."
            },
            {
              "id": "oc4",
              "name": "Клапан сброса крышки расширительного бачка",
              "pin": "Cap Tester",
              "reading": "1.25",
              "unit": "bar",
              "meterNote": "Крышка штатно держит 1.25 бар (точка кипения сдвинута выше +120°C)."
            }
          ],
          "faultId": "oc3",
          "hint": "Если блок кипит (>100°C), а нижний шланг радиатора остаётся холодным (+30°C) — жидкость не пускают в радиатор!",
          "winRule": "Резкая разница температур между кипящим блоком (+102°C) и холодным радиатором/нижним патрубком — верный признак заклинившего в закрытом виде термостата."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: При резком торможении и в жару на приборке начинает моргать красная маслёнка, но клиент поменял уже 3 масляных фильтра! Найди прокол в диагностике.",
          "artifactTitle": "Low Oil Pressure Incident Report",
          "items": [
            {
              "id": "ol1",
              "code": "Уровень масла по щупу: ровно на отметке MAX",
              "label": "Визуальный уровень в картере"
            },
            {
              "id": "ol2",
              "code": "Слепо поверили лампе приборки (мех. манометр не вкручивали)",
              "label": "Действие диагноста при мигании маслёнки"
            },
            {
              "id": "ol3",
              "code": "Вязкость масла: свежая синтетика 5W-30 по допуску",
              "label": "Соответствие масла сезону"
            },
            {
              "id": "ol4",
              "code": "Замер на оборотах 3000 об/мин (цель 3.5-5.0 бар)",
              "label": "Контрольная проверка редукционного клапана"
            }
          ],
          "defectId": "ol2",
          "fixedCode": "Вкрутить МЕХАНИЧЕСКИЙ манометр вместо датчика аварийного давления и снять бар на горячем XX!",
          "hint": "Часто моргает копеечный датчик давления (подтекает через мембрану), либо действительно забита сетка маслоприёмника — отличить можно ТОЛЬКО механическим манометром!",
          "winRule": "При горении/моргании красной маслёнки ЗАПРЕЩЕНО гадать — сразу глушите мотор и вкручивайте механический манометр (горячий XX ≥ 1.2–1.5 бар, 3000 об/мин = 3–5 бар)."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "CL-408",
          "speaker": "Слесарь Андрей",
          "telemetry": [
            {
              "label": "Крышка ОЖ",
              "val": "Резинка порвана (0.0 бар)",
              "bad": true
            },
            {
              "label": "Стрелка T°C",
              "val": "98°C и закипел!",
              "bad": true
            }
          ],
          "situation": "Антифриз выплёскивает через бачок уже при 98°C (хотя вентилятор штатно включается на 102°C!). Почему система закипела раньше включения вентилятора?",
          "choices": [
            {
              "id": "a",
              "text": "Из-за негерметичной крышки бачка нет избыточного давления 1.1–1.4 бар — точка кипения упала обратно к ~100°C вместо +120..+125°C!",
              "outcome": "Абсолютно верно по физике! Именно рабочее давление ~1.2 бар под крышкой не даёт антифризу вскипеть до 105-110°C."
            },
            {
              "id": "b",
              "text": "Нужно снять крышку вообще, чтобы пару было проще выходить",
              "outcome": "Без крышки антифриз выкипит ещё быстрее уже при 95-100°C."
            },
            {
              "id": "c",
              "text": "Слишком новый радиатор",
              "outcome": "Новый радиатор только улучшает охлаждение."
            }
          ],
          "correctId": "a",
          "hint": "По закону физики в горах вода кипит при 85°C, а в скороварке под 1.3 бар не кипит и при +120°C...",
          "winRule": "Исправный клапан пробки (1.1–1.4 бар) повышает температуру закипания ОЖ выше +122°C — неисправная пробка гарантирует кипение ещё до включения вентилятора."
        }
      ]
    },
    "5": {
      "title": "Трансмиссия, МКПП и Сцепление: Износ и Центровка",
      "instrument": "Clutch & Gearbox Service Desk",
      "mechanic": "workshop_quest",
      "badge": "Автомеханика / МКПП",
      "brief": "Распознавай пробуксовку сцепления, утечки через сальник коленвала/КПП, проверяй толщину накладок (<1.5мм) и центруй диск оправкой.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "TR-501",
          "speaker": "Водитель такси Михаил",
          "telemetry": [
            {
              "label": "Обороты (4-5 пер.)",
              "val": "Ревут вверх 4500 об/мин",
              "bad": true
            },
            {
              "label": "Скорость авто",
              "val": "Не растёт",
              "bad": true
            }
          ],
          "situation": "При обгоне на 4-й передаче жму газ в пол — стрелка тахометра резко подскакивает вверх, запах гари, а машина не ускоряется! Сняли КПП: толщина фрикциона до заклёпок всего 0.8 мм и всё в масле. Что нужно менять в обязательном порядке?",
          "choices": [
            {
              "id": "a",
              "text": "Отмыть старый диск бензином и поставить обратно",
              "outcome": "Пропитанные маслом накладки с остатком <1.5 мм начнут буксовать и пилить маховик заклёпками в первый же день."
            },
            {
              "id": "b",
              "text": "Поменять комплектом (Диск + Корзина + Выжимной), устранить течь сальника коленвала/первичного вала и очистить маховик!",
              "outcome": "Золотое правило автосервиса! Если не заменить потекший сальник, новый комплект за 20 000 ₽ пропитается маслом через месяц."
            },
            {
              "id": "c",
              "text": "Подлить трансмиссионное масло в колокол сцепления",
              "outcome": "Сцепление работает на сухом трении — масло там враг номер один!"
            }
          ],
          "correctId": "b",
          "hint": "Просто поставить новый диск поверх потекшего сальника — это гарантированный возврат по рекламации!",
          "winRule": "При пробуксовке сцепления (остаток < 1.5 мм до заклёпок) меняют комплект полностью, проверяют плоскость маховика и обязательно устраняют течь заднего сальника коленвала или сальника КПП."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: Слесарь прикрутил новую корзину и диск, а потом вдвоём с напарником два часа не могут воткнуть коробку передач на место — первичный вал упирается в стену! Найди пропущенный инструмент.",
          "artifactTitle": "Clutch Mounting Steps — Lift #3",
          "items": [
            {
              "id": "cl1",
              "code": "Болты корзины притянуты равномерно крест-накрест",
              "label": "Протяжка кожуха сцепления без перекоса лепестков"
            },
            {
              "id": "cl2",
              "code": "Шлицы первичного вала смазаны тонкой каплей термостойкой смазки",
              "label": "Подготовка скольжения ступицы диска"
            },
            {
              "id": "cl3",
              "code": "Ведомый диск прикручен БЕЗ центрирующей оправки («на глазок»)",
              "label": "Соосность ступицы диска и подшипника коленвала"
            },
            {
              "id": "cl4",
              "code": "Вилка и направляющая выжимного без выработки",
              "label": "Механизм выжима сцепления"
            }
          ],
          "defectId": "cl3",
          "fixedCode": "Обязательная центровка диска специальной оправкой (или старым первичным валом) ДО затяжки корзины!",
          "hint": "Когда болты корзины затянуты, диск зажат намертво! Малейшее смещение на 2 мм не даст шлицам вала КПП попасть внутрь...",
          "winRule": "Перед затяжкой корзины ведомый диск ОБЯЗАТЕЛЬНО выставляют строго по центру специальной оправкой (Mandrel), иначе коробка не сядет (или погнёте диск рычагом)."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Быстрая диагностика жалоб по симптомам сцепления и МКПП!",
          "bins": [
            {
              "id": "slip",
              "label": "Буксует сцепление",
              "color": "rose"
            },
            {
              "id": "lead",
              "label": "Ведёт / Недовыжим",
              "color": "amber"
            },
            {
              "id": "noise",
              "label": "Выжимной подшипник",
              "color": "cyan"
            }
          ],
          "cards": [
            {
              "tag": "Жалоба 1",
              "specimen": "Передачи втыкаются с жутким хрустом, особенно задняя, машина ползёт с выжатой педалью",
              "context": "Воздух в гидроприводе / просели лепестки",
              "targetBin": "lead",
              "rule": "Когда сцепление «ведёт» (не полностью размыкает), валы КПП продолжают вращаться и синхронизаторы хрустят."
            },
            {
              "tag": "Жалоба 2",
              "specimen": "Появляется чёткий шелестящий шум ИМЕННО ПРИ НАЖАТИИ на педаль сцепления",
              "context": "На отпущенной педали тишина",
              "targetBin": "noise",
              "rule": "Шум, возникающий под нагрузкой нажатой педали, указывает на износ выжимного подшипника (на отпущенной часто шумит первичный вал)."
            },
            {
              "tag": "Жалоба 3",
              "specimen": "На подъёме мотор ревёт, пахнет палёными накладками, разгона нет",
              "context": "Схватывает в самом верху хода педали",
              "targetBin": "slip",
              "rule": "Изношенный или замасленный диск буксует под максимальным крутящим моментом на высших передачах."
            }
          ],
          "hint": "Недовыжим -> хруст и ползёт на выжатом; пробуксовка -> обороты растут без разгона; нажали педаль -> загудел выжимной.",
          "winRule": "Точная дифференциация «буксует» vs «ведёт» vs «выжимной» позволяет назвать верный вердикт владельцу ещё во время тестовой поездки."
        }
      ]
    },
    "6": {
      "title": "Ходовая часть: Протяжка под весом и Вибрация ШРУСа",
      "instrument": "Chassis & NVH Bench",
      "mechanic": "triage_radar",
      "badge": "Автомеханика / Ходовая",
      "brief": "Диагностируй стуки шаровых и тяг, лови вибрацию внутреннего ШРУСа под газом и затягивай сайлентблоки только под нагрузкой.",
      "rounds": [
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 1: Распознай источники стуков и вибраций ходовой части на тест-драйве и подъёмнике!",
          "bins": [
            {
              "id": "inner_cv",
              "label": "Внутренний ШРУС (Трипод)",
              "color": "purple"
            },
            {
              "id": "outer_cv",
              "label": "Наружный ШРУС",
              "color": "amber"
            },
            {
              "id": "bearing",
              "label": "Ступичный подшипник",
              "color": "cyan"
            }
          ],
          "cards": [
            {
              "tag": "Вибрация",
              "specimen": "Кузов дрожит и качается влево-вправо ТОЛЬКО при интенсивном разгоне под газом, накатом тихо",
              "context": "Усиливается на 40-80 км/ч под нагрузкой",
              "targetBin": "inner_cv",
              "rule": "Выработка в стакане внутреннего ШРУСа (трипода) даёт характерную раскачку/вибрацию при передаче тяги; при отпускании газа исчезает!"
            },
            {
              "tag": "Хруст",
              "specimen": "Ритмичный щелчок/хруст при вывороте руля в упор и старте по кругу",
              "context": "Часто после рваного внешнего пыльника",
              "targetBin": "outer_cv",
              "rule": "Наружный ШРУС выкручивается в поворотах — его выработка всегда хрустит при вывернутом руле."
            },
            {
              "tag": "Гул",
              "specimen": "Монотонный самолётный гул от 50 км/ч, меняющийся при змейке-поворотах рулём",
              "context": "При разгрузке больной стороны гул стихает",
              "targetBin": "bearing",
              "rule": "Гудящий ступичный подшипник усиливает вой, когда в повороте вес машины давит на него (а при разгрузке затихает)."
            }
          ],
          "hint": "Трясёт под газом на прямой — внутренний ШРУС; хруст в крутом повороте — наружный ШРУС; воет по скорости и меняется в змейке — ступичный.",
          "winRule": "Чёткое разделение внутреннего трипода, наружного ШРУСа и ступичного подшипника спасает клиента от лишней замены рабочих деталей."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: Новые дорогие сайлентблоки передних рычагов порвались и оторвались от втулок ровно через 2 недели после ремонта! Найди грубую ошибку слесаря.",
          "artifactTitle": "Control Arm Replacement — Service Error",
          "items": [
            {
              "id": "ch1",
              "code": "Болты рычагов затянуты насмерть НА ВЕСУ на двухстоечном подъёмнике (колёса висят вниз)!",
              "label": "Момент окончательной затяжки сайлентблоков"
            },
            {
              "id": "ch2",
              "code": "Рычаг очищен от коррозии, новые развальные болты смазаны",
              "label": "Подготовка посадочных мест"
            },
            {
              "id": "ch3",
              "code": "Болты шаровой опоры затянуты с нужным Н·м",
              "label": "Крепление поворотного кулака"
            },
            {
              "id": "ch4",
              "code": "Проверен зазор рулевой рейки и наконечников",
              "label": "Инспекция смежных узлов"
            }
          ],
          "defectId": "ch1",
          "fixedCode": "Сначала только наживить -> опустить машину на колёса (или подпереть ступицу гидростойкой под вес!) -> финальная протяжка!",
          "hint": "Когда авто опускают с подъёмника на асфальт, вывешенный рычаг поворачивается на 20° и мгновенно скручивает намертво затянутую резину!",
          "winRule": "Все резинометаллические сайлентблоки окончательно протягивают ТОЛЬКО под снаряжённым весом автомобиля на яме, 4-стоечном подъёмнике или со стойкой под ступицу!"
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 3: Скрип спереди на лежачих полицейских и глухой стук на мелких кочках. Осмотри узлы подвески на люфтомере/монтажкой.",
          "meterName": "SUSPENSION PLAY INSPECTOR",
          "normalSpec": "Шаровая / Наконечник = 0.0 мм люфта! Втулки без надрывов",
          "points": [
            {
              "id": "sp1",
              "name": "Передний сайлентблок рычага",
              "pin": "Pivot Bush",
              "reading": "Целый, упругий",
              "unit": "0 mm play",
              "meterNote": "Трещин и отслоений от обоймы нет."
            },
            {
              "id": "sp2",
              "name": "Нижняя шаровая опора (проверка монтажкой вверх/вниз)",
              "pin": "Lower Ball Joint",
              "reading": "3.2 mm осевой люфт!",
              "unit": "АВАРИЙНЫЙ",
              "meterNote": "Палец шаровой болтается в корпусе на 3 мм! Пыльник порван — есть риск вылета колеса на ходу!"
            },
            {
              "id": "sp3",
              "name": "Стойка стабилизатора (косточка)",
              "pin": "Sway Link",
              "reading": "Пыльник сухой, люфта нет",
              "unit": "",
              "meterNote": "Шарниры тяги стаба держатся туго."
            },
            {
              "id": "sp4",
              "name": "Пружина подвески",
              "pin": "Coil Spring",
              "reading": "Витки целые",
              "unit": "",
              "meterNote": "Нижний виток не обломлен."
            }
          ],
          "faultId": "sp2",
          "hint": "Любой осевой люфт шаровой опоры — критическая угроза безопасности (может вырвать палец из кулака на кочке!).",
          "winRule": "Шаровая опора не должна иметь даже 0.5 мм осевого люфта; при проверке монтажкой разгруженного рычага любой стук — немедленная замена."
        }
      ]
    },
    "7": {
      "title": "Развал-схождение 3D: Кастер, Развал и Схождение",
      "instrument": "3D Alignment Stand",
      "mechanic": "defect_inspector",
      "badge": "Автомеханика / Развал-Схождение",
      "brief": "Спасай шины от «пилообразного» износа (Схождение Toe) и выставляй 3D-углы строго в правильном порядке.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: Новая летняя резина спереди превратилась в лысые лохмотья с острой «пилой» на внутренней кромке протектора всего за 3000 км! Найди главный параметр-виновник и ошибку настройки.",
          "artifactTitle": "3D Wheel Alignment Report — Tire Wear",
          "items": [
            {
              "id": "al1",
              "code": "Кастер (Caster): +4°15' (ровно слева и справа)",
              "label": "Продольный наклон оси поворота стойки"
            },
            {
              "id": "al2",
              "code": "Суммарное схождение (Total Toe): -0°52' (вышло сильно в минус — жрёт резину!)",
              "label": "Угол направления колёс относительно оси движения"
            },
            {
              "id": "al3",
              "code": "Давление в передних шинах: 2.3 бар (как на табличке стойки)",
              "label": "Выравнивание давления перед калибровкой 3D"
            },
            {
              "id": "al4",
              "code": "Диагностика люфтов шаровых и наконечников: 0 мм",
              "label": "Обязательная подготовка перед стендом"
            }
          ],
          "defectId": "al2",
          "fixedCode": "Сначала устранить причину и выставить Схождение (Toe) строго в зелёный допуск (ок. +0°08' ±0°05')!",
          "hint": "Из всех трёх углов быстрее и агрессивнее всего стачивает резину протектора (с «пилообразной» кромкой) именно неправильное Схождение (колёса «скребут» боком по асфальту)!",
          "winRule": "За быстрый износ шин на 80% отвечает Схождение (Toe), за самовозврат руля — Кастер, за боковой упор в поворотах — Развал."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Собери безошибочный порядок операций мастера на 3D-стенде сход-развала.",
          "chips": [
            {
              "id": "st1",
              "text": "Выровнять давление в шинах и проверить отсутствие люфтов в ходовой/рулевой"
            },
            {
              "id": "st2",
              "text": "Настроить сначала ЗАДНЮЮ ось (вектор тяги Thrust Line)"
            },
            {
              "id": "st3",
              "text": "Отрегулировать переднюю ось в строгом порядке: Кастер -> Развал -> Схождение (Toe)"
            },
            {
              "id": "st4",
              "text": "Крутить тяги схождения ДО устранения люфта в шаровой и ДО настройки развала"
            }
          ],
          "correctOrder": [
            "st1",
            "st2",
            "st3"
          ],
          "hint": "Помни железное правило стенда: Зад -> Перед; впереди Схождение крутят ПОСЛЕДНИМ, так как изменение Кастера или Развала сбивает схождение!",
          "winRule": "Порядок 3D сход-развала: Люфты/Давление -> Задняя ось -> Кастер -> Развал -> Схождение (всегда финальным пунктом!) с ровным рулём по уровню."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 3: Настрой целевые допуски на клиентском автомобиле для ровной езды без увода и износа: правильный угол от которого зависит возврат руля в ноль, порядок настройки и максимальная разница давления слева/справа перед замером.",
          "previewType": "generic",
          "controls": [
            {
              "id": "wear",
              "kind": "pills",
              "label": "Что отвечает за самовозврат руля в «0»",
              "options": [
                "Схождение (Toe)",
                "Кастер (Caster)",
                "Вылет диска (ET)"
              ],
              "init": "Вылет диска (ET)",
              "targetVal": "Кастер (Caster)"
            },
            {
              "id": "last",
              "kind": "pills",
              "label": "Что регулируют САМЫМ ПОСЛЕДНИМ?",
              "options": [
                "Кастер",
                "Задний развал",
                "Переднее схождение"
              ],
              "init": "Кастер",
              "targetVal": "Переднее схождение"
            },
            {
              "id": "pdiff",
              "kind": "range",
              "label": "Допустимый разброс давления в шинах",
              "min": 0.0,
              "max": 0.8,
              "step": 0.1,
              "init": 0.6,
              "unit": " бар",
              "targetMin": 0.0,
              "targetMax": 0.1
            }
          ],
          "hint": "У тележки супермаркета колёсики сами выравниваются за осью поворота благодаря продольному наклону — это Кастер!",
          "winRule": "Кастер держит прямую и возвращает руль в ноль; Схождение (Toe) бережёт протектор и выставляется последним на выровненном давлении."
        }
      ]
    },
    "8": {
      "title": "Тормоза: Биение диска 0.04 мм и Влага DOT 4",
      "instrument": "Brake Runout & Boiling Bench",
      "mechanic": "bench_tuner",
      "badge": "Автомеханика / Тормоза",
      "brief": "Замеряй биение тормозного диска индикатором (≤ 0.04-0.05 мм), проверяй влагу в гигроскопичной DOT 4 и правильно прокачивай ABS.",
      "rounds": [
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 1: После замены передних дисков через 1000 км начало бить в руль при торможении, а педаль стала «ватной» в горах! Выставь заводские лимиты: допустимое боковое биение диска (часовой индикатор) и критический порог влаги в DOT 4.",
          "previewType": "generic",
          "controls": [
            {
              "id": "runout",
              "kind": "range",
              "label": "Макс. биение тормозного диска (мм)",
              "min": 0.02,
              "max": 0.2,
              "step": 0.02,
              "init": 0.16,
              "unit": " мм",
              "targetMin": 0.04,
              "targetMax": 0.05
            },
            {
              "id": "water",
              "kind": "pills",
              "label": "Предел воды в DOT 4 (замена!)",
              "options": [
                "0% (Сухая)",
                "от 3% (Вскипает!)",
                "от 25%"
              ],
              "init": "от 25%",
              "targetVal": "от 3% (Вскипает!)"
            },
            {
              "id": "bleed",
              "kind": "pills",
              "label": "Порядок прокачки контуров (классика)",
              "options": [
                "От самого дальнего к главному цилиндру",
                "От самого ближнего колеса"
              ],
              "init": "От самого ближнего колеса",
              "targetVal": "От самого дальнего к главному цилиндру"
            }
          ],
          "hint": "Всего 3-4% воды снижают точку кипения DOT 4 с 230°C ниже 160°C (педаль провалится при затяжном торможении!). А биение диска должно быть ≤ 0.04–0.05 мм.",
          "winRule": "Зачистите привалочную поверхность ступицы до блеска (биение диска ≤ 0.04-0.05 мм), меняйте DOT 4 каждые 2 года (< 3% воды) и качайте от дальнего контура (или по сканеру ABS)."
        },
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 2: Клиент жалуется на вибрацию в руль на торможении со 110 км/ч — поставили 2-й комплект новых дисков, а проблема вернулась! Проверь узел часовым индикатором и рефрактометром.",
          "meterName": "DIAL INDICATOR & DOT TEST",
          "normalSpec": "Биение ступицы/диска ≤ 0.04-0.05 мм | Влага DOT 4 < 2%",
          "points": [
            {
              "id": "br2",
              "name": "Толщина новых тормозных колодок",
              "pin": "Pad Gauge",
              "reading": "11.5",
              "unit": "mm",
              "meterNote": "Новые колодки без неравномерного клина."
            },
            {
              "id": "br1",
              "name": "Биение новой поверхности диска на 4 шпильках",
              "pin": "Rotor Runout",
              "reading": "0.14",
              "unit": "mm (В 3 РАЗА ВЫШЕ!)",
              "meterNote": "Биение 0.14 мм при норме до 0.04 мм! Под новый диск на ступице осталась ржавая окалина — диск встал с перекосом и сносился «волной»."
            },
            {
              "id": "br3",
              "name": "Влага в тормозной жидкости DOT 4 в бачке",
              "pin": "DOT Moisture",
              "reading": "0.8",
              "unit": "% H2O",
              "meterNote": "Жидкость свежая, точка кипения в норме."
            },
            {
              "id": "br4",
              "name": "Ход поршня суппорта и скобы",
              "pin": "Caliper Slide",
              "reading": "Свободный без клина",
              "unit": "",
              "meterNote": "Пыльники целые, скоба перемещается плавно."
            }
          ],
          "faultId": "br1",
          "hint": "Если при установке нового диска забыть зачистить коррозию с фланца ступицы (или сама ступица кривая) — любой новый диск тут же получает биение > 0.05 мм!",
          "winRule": "После установки тормозного диска ВСЕГДА проверяйте биение часовым индикатором (допуск ≤ 0.04–0.05 мм) на вычищенной до металла ступице."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 3: После замены колодок на задней оси левый диск посинел от жара, и колодка стёрлась в ноль за 2000 км! Найди халатность при сборке суппорта.",
          "artifactTitle": "Rear Caliper Service — Inspection",
          "items": [
            {
              "id": "cp1",
              "code": "Проверили уровень DOT 4 в бачке перед вдавливанием поршня",
              "label": "Предотвращение перелива через край"
            },
            {
              "id": "cp2",
              "code": "Установили новые колодки на намертво ЗАКИСШИЕ ржавые направляющие пальцы скобы!",
              "label": "Обслуживание подвижных пальцев суппорта"
            },
            {
              "id": "cp3",
              "code": "Противоскрипные пластины очищены в посадочных местах скобы",
              "label": "Подвижность колодок в пазах"
            },
            {
              "id": "cp4",
              "code": "Резиновый пыльник поршня осмотрен на целостность",
              "label": "Защита рабочего цилиндра от грязи"
            }
          ],
          "defectId": "cp2",
          "fixedCode": "Очистить и смазать направляющие пальцы ТОЛЬКО специальной высокотемпературной смазкой (например TRW PFG110 / силикон для суппортов)!",
          "hint": "Нельзя мазать направляющие обычной медной/графитовой смазкой (разбухнут резинки!) и тем более оставлять их заржавевшими — скоба перестанет отходить!",
          "winRule": "При каждой смене колодок проверяйте лёгкость хода направляющих пальцев и скоб — заклинивший палец перегревает диск и съедает внутреннюю/внешнюю колодку наискосок."
        }
      ]
    },
    "9": {
      "title": "Шиномонтаж, Балансировка и Момент 110–140 Н·м",
      "instrument": "Wheel Balance & Torque Bench",
      "mechanic": "probe_diagnostic",
      "badge": "Автомеханика / Шиномонтаж",
      "brief": "Лови резонансный дисбаланс на 90-120 км/ч, проверяй биение обода и тяни гайки/болты звёздочкой динамометрическим ключом.",
      "rounds": [
        {
          "mechanic": "probe_diagnostic",
          "prompt": "Раунд 1: В городе до 70 км/ч всё мягко, но на трассе строго в диапазоне 95–115 км/ч руль бьёт мелкой дрожью (выше 140 становится тише)! Проведи инструментальную проверку колеса.",
          "meterName": "BALANCER & TORQUE PROBE",
          "normalSpec": "Остаточный дисбаланс < 5 г | Очищенная плоскость | Затяжка 110–140 Н·м звёздочкой",
          "points": [
            {
              "id": "wh1",
              "name": "Давление в шинах (передняя ось)",
              "pin": "Tire Gauge",
              "reading": "2.20 / 2.20",
              "unit": "bar",
              "meterNote": "Давление выровнено точно по табличке."
            },
            {
              "id": "wh2",
              "name": "Дисбаланс передних колёс на балансировочном станке",
              "pin": "Balancer Out/In",
              "reading": "05 / 45 g (Динамический!)",
              "unit": "grams",
              "meterNote": "Отвалился наклеенный грузик весом 40г на внутренней полке (и засох ком грязи)! Ровно в резонансе 95-115 км/ч бьёт руль."
            },
            {
              "id": "wh3",
              "name": "Посадочный буртик ступицы (ЦО)",
              "pin": "Center Bore",
              "reading": "Центрирующее кольцо на месте",
              "unit": "",
              "meterNote": "Колесо отцентровано по ступичному выступу."
            },
            {
              "id": "wh4",
              "name": "Боковое биение литого диска",
              "pin": "Rim Check",
              "reading": "0.3",
              "unit": "mm (Ровный)",
              "meterNote": "Сам алюминиевый обод геометрически ровный."
            }
          ],
          "faultId": "wh2",
          "hint": "Резонансная тряска руля ровно на 90–120 км/ч (которая уходит на малой скорости) — визитная карточка дисбаланса или налипшей внутри диска грязи!",
          "winRule": "Динамический/статический дисбаланс колёс проявляется в резонансной зоне 90–120 км/ч (перед — в руль, зад — в пол и сиденье)."
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "TIR-903",
          "speaker": "Клиент на новом кроссовере",
          "telemetry": [
            {
              "label": "Гайковёрт цеха",
              "val": "900 Н·м на макс!",
              "bad": true
            },
            {
              "label": "Болты колеса",
              "val": "Вытянуты/сорваны",
              "bad": true
            }
          ],
          "situation": "После весенней переобувки водитель пробил колесо на трассе — ни один баллонник не берёт болты, вороток погнули! Оказалось, шиномонтажник лупил ударным гайковёртом до упора (~400-800 Н·м). Какова правильная процедура?",
          "choices": [
            {
              "id": "a",
              "text": "Так и нужно — затягивать ударным гайковёртом со всей дури, чтобы не открутилось",
              "outcome": "Опасно! Срывает резьбу в ступице, коробит тормозные диски и на трассе запаску не поставить."
            },
            {
              "id": "b",
              "text": "Наживить болты от руки (против срыва захода резьбы), слегка подтянуть гайковёртом с ограничителем, и финально затянуть ЗВЁЗДОЧКОЙ динамометрическим ключом ~110–140 Н·м!",
              "outcome": "Образцовый стандарт! Колесо не прикипит, не вытянет шпильки и не перекосит тормозной диск."
            },
            {
              "id": "c",
              "text": "Залить всю резьбу суперклеем",
              "outcome": "Абсурд и поломка крепления."
            }
          ],
          "correctId": "b",
          "hint": "В среднем легковом автомобиле заводской момент колёсных болтов/гаек (обычно 110–140 Н·м) требует финальной протяжки руками, а не гайковёртом...",
          "winRule": "Никогда не делайте финальную затяжку колёс ударным гайковёртом! Только наживление от руки + схема «звёздочка» + динамометрический ключ по мануалу (обычно 110–140 Н·м)."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери безошибочный протокол балансировки и установки колёса на авто.",
          "chips": [
            {
              "id": "wl1",
              "text": "Вымыть грязь, выковырять камни из протектора и содрать старые грузы с диска"
            },
            {
              "id": "wl2",
              "text": "Отбалансировать колесо до 0/0г и зачистить металлической щёткой привалочную плоскость ступицы"
            },
            {
              "id": "wl3",
              "text": "Наживить все болты от руки и протянуть крест-накрест динамометром (напр. 120 Н·м)"
            },
            {
              "id": "wl4",
              "text": "Наклеить новые грузы поверх слоя старых, балансируя на спущенной шине"
            }
          ],
          "correctOrder": [
            "wl1",
            "wl2",
            "wl3"
          ],
          "hint": "От грязного протектора или старых грузов станок обманет! А зачистка ступицы и звёздочка дают ровную посадку без перекосов.",
          "winRule": "Чистая покрышка без камней + удаление старых грузов + зачистка фланца + крест-накрест 110-140 Н·м = идеальный шиномонтаж без биения."
        }
      ]
    },
    "10": {
      "title": "Итоговое ТО-1/ТО-2 и Приёмка автомобиля",
      "instrument": "Full Bay Service Checklist",
      "mechanic": "workshop_quest",
      "badge": "Автомеханика / Финал ТО",
      "brief": "Проводи комплексное регламентное ТО без типичных провалов: двойной резинки масляного фильтра, сухой шайбы и скрытых критических износов.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "TO-FIN",
          "speaker": "Мастер-приёмщик Руслан",
          "telemetry": [
            {
              "label": "Остаток колодок",
              "val": "1.8 мм (к датчику)",
              "bad": true
            },
            {
              "label": "Антифриз",
              "val": "-18°C ареометром",
              "bad": true
            }
          ],
          "situation": "Проводим большое ТО-2 перед зимой (на улице скоро -30°C): заменили масло в ДВС, видим остаток тормозных колодок 1.8 мм и плотность антифриза всего до -18°C! Ваши рекомендации в акте приёмки?",
          "choices": [
            {
              "id": "a",
              "text": "Промолчать про колодки и антифриз — клиент просил только поменять масло",
              "outcome": "Халатность! При -30°C разморозит и разорвёт радиатор/блок, а колодки дотрут диски до металла через 500 км."
            },
            {
              "id": "b",
              "text": "Внести в 'Красную зону' рекомендаций: срочную замену колодок (< 2-3 мм критический предел!) и обновление антифриза до -40°C!",
              "outcome": "Профессионально! Качественное ТО включает контроль безопасности (колодки < 2-3 мм, плотность ОЖ, течи, люфты, приводные ремни)."
            },
            {
              "id": "c",
              "text": "Долить в антифриз обычной воды из-под крана",
              "outcome": "Вода еще сильнее поднимет температуру замерзания к 0°C и вызовет ржавчину!"
            }
          ],
          "correctId": "b",
          "hint": "Какой минимальный остаток тормозных накладок требует немедленной замены на ТО (чтобы не запороть диски и не лишиться тормозов)?",
          "winRule": "Регламентное ТО — это не только смена масла! Остаток колодок < 2–3 мм, замерзающая ОЖ, трещины тормозных шлангов и люфты шаровых всегда идут в красный приоритет безопасности."
        },
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 2: Сразу после замены масла мотор запустили — и через 10 секунд из-под капота ударил фонтан масла на весь пол бокса! Найди классическую фатальную ошибку замены фильтра!",
          "artifactTitle": "Oil Service Incident — Bay #1",
          "items": [
            {
              "id": "oi1",
              "code": "При откручивании старого фильтра на блоке прикипело старое резиновое кольцо — новый накрутили ПОВЕРХ!",
              "label": "Осмотр привалочной поверхности масляного фильтра"
            },
            {
              "id": "oi2",
              "code": "Уровень залитого свежего масла 5W-40 по паспорту 4.2 л",
              "label": "Заправочный объём картера"
            },
            {
              "id": "oi3",
              "code": "На сливной пробке поддона установлена новая медная шайба (момент 35 Н·м)",
              "label": "Уплотнение сливного отверстия"
            },
            {
              "id": "oi4",
              "code": "Воздушный и салонный фильтры заменены по регламенту",
              "label": "Обновление систем фильтрации воздуха"
            }
          ],
          "defectId": "oi1",
          "fixedCode": "Проверить рукой отсутствие старой резинки на блоке + слегка смазать кольцо НОВОГО фильтра свежим маслом!",
          "hint": "Две резиновые прокладки одна на другой мгновенно выдавливаются давлением масла 4-5 бар при первом же пуске!",
          "winRule": "Святое правило замены картриджа-фильтра: 1) убедись, что старая резинка снялась со старым фильтром; 2) смажь новое кольцо маслом и закручивай без лишнего перетяга."
        },
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 3: Заполни финальный лист осмотра клиента (Светофор сервиса: Красная срочность vs Жёлтый контроль vs Зелёная норма)!",
          "bins": [
            {
              "id": "red",
              "label": "КРАСНЫЙ (Нельзя ехать / Срочно!)",
              "color": "rose"
            },
            {
              "id": "yellow",
              "label": "ЖЁЛТЫЙ (План к следующему ТО)",
              "color": "amber"
            },
            {
              "id": "green",
              "label": "ЗЕЛЁНЫЙ (В допуске / Норма)",
              "color": "emerald"
            }
          ],
          "cards": [
            {
              "tag": "Тормоза",
              "specimen": "Грыжа и глубокие трещины до корда на переднем тормозном шланге, колодки 1.5мм",
              "context": "Прямой риск отказа тормозов",
              "targetBin": "red",
              "rule": "Трещины шлангов под давлением 100+ бар и колодки <2-3 мм — немедленный красный запрет эксплуатации!"
            },
            {
              "tag": "Ремень",
              "specimen": "Начальное запотевание прокладки клапанной крышки (уровень MAX) и износ колодок 45%",
              "context": "Течи нет, безопасность не нарушена",
              "targetBin": "yellow",
              "rule": "Умеренное запотевание и 45% остатка фиксируются в жёлтую карту планового внимания."
            },
            {
              "tag": "Замер",
              "specimen": "DOT 4 влага < 1%, антифриз -42°C, АКБ НРЦ 12.65В, шины 2.2 бар",
              "context": "Все узлы прошли контроль после ТО",
              "targetBin": "green",
              "rule": "Подтверждённые нормой замеры отражаются в зелёном бланке с полной уверенностью клиента."
            }
          ],
          "hint": "Угроза безопасности/обрыва — Красный; косметика/половинный износ — Жёлтый; эталонные замеры — Зелёный.",
          "winRule": "Профессиональный механик не просто крутит гайки, а выдаёт честную приборную карту осмотра (Красный/Жёлтый/Зелёный) без пропуска угроз!"
        }
      ]
    },
    "11": {
      "title": "Рулевое управление: Рейка, тяги и 3D Сход-развал",
      "instrument": "Steering Safety Inspector",
      "mechanic": "defect_inspector",
      "badge": "Автомеханика / Рулевое",
      "brief": "Находи критический износ пыльников рейки, люфт наконечников и выполняй пост-ремонтную регулировку.",
      "rounds": [
        {
          "mechanic": "defect_inspector",
          "prompt": "Раунд 1: Автомобиль прибыл со стуком на мелких кочках при повороте руля. Осмотри ведомость дефектовки на подъёмнике и отметь самый срочный аварийный дефект!",
          "artifactTitle": "Карта осмотра рулевого управления (ГУР / ЭУР)",
          "items": [
            {
              "id": "st1",
              "code": "Свободный люфт рулевого колеса ~3 градуса в пределах ГОСТ",
              "label": "Замер люфтомером на стоянке"
            },
            {
              "id": "st2",
              "code": "Уровень жидкости ГУР на отметке MAX, пены в бачке нет",
              "label": "Проверка гидравлики насоса"
            },
            {
              "id": "st3",
              "code": "Правый рулевой наконечник имеет осевой люфт 2 мм + порван гофрированный пыльник рулевой рейки!",
              "label": "Проверка шарниров и пыльников рейки"
            },
            {
              "id": "st4",
              "code": "Карданный вал рулевой колонки закреплён без проскальзывания шлицов",
              "label": "Осмотр рулевого вала"
            }
          ],
          "defectId": "st3",
          "fixedCode": "Заменить наконечник (съёмником!), заменить порванный пыльник рейки со смазкой штока -> 3D сход-развал!",
          "hint": "Любой люфт в шаровом пальце наконечника и рваный пыльник, пускающий воду с песком на шток рейки — немедленный ремонт!",
          "winRule": "Рваный пыльник мгновенно убивает зеркало штока рейки ржавчиной, а люфт наконечника грозит потерей управляемости. После замены строго обязателен 3D сход-развал!",
          "failReasons": {
            "st1": "Небольшой люфт 3 градуса укладывается в безопасный допуск.",
            "st2": "Чистая жидкость на отметке MAX без пены говорит об отсутствии подсоса воздуха в ГУР.",
            "st4": "Отсутствие люфта в карданчике рулевого вала подтверждает его исправность."
          }
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "MECH-STR-11",
          "speaker": "Механик подъёмника #2",
          "telemetry": [
            {
              "label": "Операция",
              "val": "Замена рул. тяги",
              "bad": false
            },
            {
              "label": "Сход-развал",
              "val": "Не запланирован",
              "bad": true
            }
          ],
          "prompt": "Раунд 2: Правая рулевая тяга и наконечник заменены (мастер посчитал обороты резьбы при накручивании). Какая операция строго обязательна перед выдачей авто?",
          "situation": "Автомобиль опускается с двухстоечного подъёмника после замены рулевого наконечника и тяги.",
          "choices": [
            {
              "id": "al_3d",
              "text": "Загнать машину на стенд 3D сход-развала и точно отрегулировать углы схождения колёс",
              "outcome": "Идеально! Подсчёт витков даёт лишь грубую геометрию — 3D стенд выставляет схождение до сотых долей градуса."
            },
            {
              "id": "al_turns",
              "text": "Отдать сразу — расчёт по виткам резьбы и штангенциркулю полностью заменяет стенд",
              "outcome": "ОШИБКА! Малейшая разница в длине нового наконечника за неделю съест протектор резины и потянет руль в сторону."
            },
            {
              "id": "al_hammer",
              "text": "Перед этим выбить старый палец кувалдой прямо по рычагу алюминиевого кулака",
              "outcome": "Удар кувалдой трескает или гнёт кулак — конусный палец снимают только винтовым съёмником!"
            }
          ],
          "correctId": "al_3d",
          "hint": "Даже две детали разных производителей отличаются по длине на 1–2 мм, что на 15 мм уводит схождение!",
          "winRule": "После ЛЮБОЙ замены рулевых тяг или наконечников (демонтируемых специальным винтовым съёмником) обязателен 3D сход-развал."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери правильную технологию замены рулевого наконечника без повреждения поворотного кулака и углов геометрии!",
          "chips": [
            {
              "id": "tr1",
              "text": "1. Ослабить контргайку тяги, открутить корончатую/самоконтрящуюся гайку пальца"
            },
            {
              "id": "tr2",
              "text": "2. Выпрессовать палец из поворотного кулака винтовым съёмником (без кувалды!)"
            },
            {
              "id": "tr3",
              "text": "3. Установить новый наконечник (и пыльник), затянуть динамометрическим ключом"
            },
            {
              "id": "tr4",
              "text": "4. Выполнить точную регулировку схождения колёс на 3D-стенде"
            }
          ],
          "correctOrder": [
            "tr1",
            "tr2",
            "tr3",
            "tr4"
          ],
          "hint": "Откручиваем гайку -> аккуратно выпрессовываем съёмником -> монтируем и тянем по моменту -> финальный стенд сход-развала.",
          "winRule": "Грамотная замена бережёт поворотный кулак (съёмником, а не кувалдой) и завершается точным 3D сход-развалом."
        }
      ]
    },
    "12": {
      "title": "Выпускной контроль ОТК: Финальный допуск автомобиля",
      "instrument": "OTK Release Checkpoint",
      "mechanic": "triage_radar",
      "badge": "Автомеханика / ОТК",
      "brief": "Проверь 4 контура безопасности: ДВС <=1.0 бар, тормоза, ходовая и динамометр 110–120 Н·м.",
      "rounds": [
        {
          "mechanic": "triage_radar",
          "prompt": "Раунд 1: Ты инженер ОТК на выпускном посту дилерского центра. Раздели результаты финальных замеров: что проходит контроль, а что запрещает выпуск авто!",
          "bins": [
            {
              "id": "otk_go",
              "label": "Норма ОТК (Штамп допуска)",
              "color": "emerald"
            },
            {
              "id": "otk_stop",
              "label": "Брак / Возврат в ремзону",
              "color": "rose"
            }
          ],
          "cards": [
            {
              "tag": "Компрессия ДВС",
              "specimen": "Цилиндры 1–4 показали: 12.8 / 12.6 / 12.9 / 12.5 бар (разброс 0.4 бар)",
              "context": "Давление масла на горячую в норме, течей снизу нет",
              "targetBin": "otk_go",
              "rule": "Максимально допустимый разброс компрессии по цилиндрам после ремонта — <= 1.0 бар."
            },
            {
              "tag": "Тормоза на стенде",
              "specimen": "Осевая разница тормозных усилий спереди 34%, влажная резьба штуцера прокачки",
              "context": "Увод вправо при экстренном торможении",
              "targetBin": "otk_stop",
              "rule": "Подтекание тормозной жидкости или перекос усилий > 20–25% смертельно опасны!"
            },
            {
              "tag": "Момент колёс",
              "specimen": "Все 20 колёсных болтов проверены щелчковым динамометрическим ключом на 115 Н·м",
              "context": "Контрольный проход после пневмопистолета",
              "targetBin": "otk_go",
              "rule": "Инженер ОТК лично перепроверяет момент затяжки колёс тарированным ключом 110–120 Н·м."
            },
            {
              "tag": "Компрессия #3",
              "specimen": "Один цилиндр просел: 13.0 / 12.9 / 9.2 / 12.8 бар (разброс 3.8 бар!)",
              "context": "ДВС слегка подтраивает на холодном пуске",
              "targetBin": "otk_stop",
              "rule": "Разница > 1.0 бар между цилиндрами не допускает выпуск мотора из ремзоны."
            }
          ],
          "hint": "Разброс компрессии <= 1.0 бар и динамометр 110–120 Н·м без течей — норма ОТК; разброс 3.8 бар или подтёки тормозов — стоп!",
          "winRule": "Акт ОТК закрывает 4 узла безопасности: ДВС (<= 1.0 бар разброс), тормоза, ходовая без люфтов и тарированная затяжка колёс."
        },
        {
          "mechanic": "bench_tuner",
          "prompt": "Раунд 2: Настрой выпускной стенд ОТК для 4-цилиндрового легкового автомобиля перед выдачей клиенту: разброс компрессии <= 1.0 бар, момент колёсного крепежа ~110–120 Н·м.",
          "previewType": "generic",
          "controls": [
            {
              "id": "diff",
              "kind": "range",
              "label": "Макс. допустимый разброс компрессии ДВС",
              "min": 0.5,
              "max": 4.0,
              "step": 0.5,
              "init": 3.0,
              "unit": " бар",
              "targetMin": 0.5,
              "targetMax": 1.0
            },
            {
              "id": "lug",
              "kind": "range",
              "label": "Момент затяжки колёсных болтов (ОТК)",
              "min": 60,
              "max": 180,
              "step": 10,
              "init": 170,
              "unit": " Н·м",
              "targetMin": 110,
              "targetMax": 120
            },
            {
              "id": "seal",
              "kind": "pills",
              "label": "Визуальный осмотр поддона/суппортов на подъёмнике",
              "options": [
                "Запотевания не проверялись",
                "Чисто — 0 подтёков"
              ],
              "init": "Запотевания не проверялись",
              "targetVal": "Чисто — 0 подтёков"
            }
          ],
          "hint": "Макс. разброс по цилиндрам — не более 1.0 бар, колёсный крепёж по стандарту ОТК ~110–120 Н·м (перетянутые 170 Н·м ломают шпильки!).",
          "winRule": "Контрольные пороги ОТК выставлены идеально: разброс компрессии <= 1.0 бар, момент 110–120 Н·м и полная герметичность агрегатов.",
          "failRule": "170 Н·м обрывает резьбу шпилек и деформирует тормозной диск, а 3.0 бар разброса означает поломку ЦПГ или клапанов!"
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 3: Собери итоговый регламент подписи квалификационного акта ОТК перед передачей ключей владельцу!",
          "chips": [
            {
              "id": "ot1",
              "text": "1. Инструментальные замеры ДВС (компрессия <= 1.0 бар разброс, давление масла)"
            },
            {
              "id": "ot2",
              "text": "2. Проверка на тормозном стенде и отсутствие люфтов в ходовой/рулевом"
            },
            {
              "id": "ot3",
              "text": "3. Контрольный проход колёс динамометрическим ключом 110–120 Н·м"
            },
            {
              "id": "ot4",
              "text": "4. Тест-драйв 0 течей + подпись штампа ОТК в заказ-наряде"
            }
          ],
          "correctOrder": [
            "ot1",
            "ot2",
            "ot3",
            "ot4"
          ],
          "hint": "ДВС на стенде -> Тормоза и подвеска -> Тарированный динамометрический ключ на колёсах -> Финальный выезд, отсутствие течей и штамп ОТК.",
          "winRule": "Штамп ОТК подписывается только после полного инструментального подтверждения безопасности всех систем автомобиля."
        }
      ]
    },
    "13": {
      "title": "Тренажёр: Турбонаддув и интеркулер: устройство турбокомпрессора, вес",
      "instrument": "Опрессовщик впуска (дымогенератор)",
      "mechanic": "workshop_quest",
      "badge": "AUTOMECHANIC / Урок 13",
      "brief": "Принцип работы турбины, клапана сброса (Wastegate / Blow-off), проверка люфта крыльчатки и поиск негерметичности патрубков наддува.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-131",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 13/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Турбонаддув и интеркулер: устройство турбокомпрессора, вестгейт и диагностика утечек буста»: Зачем в системе турбонаддува устанавливается интеркулер?",
          "choices": [
            {
              "id": "a",
              "text": "Для охлаждения сжатого воздуха и повышения его плотности",
              "outcome": "Холодный воздух плотнее и содержит больше кислорода в том же объёме."
            },
            {
              "id": "b",
              "text": "Для подогрева масла",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Для глушения звука выхлопа",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Для фильтрации топлива",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Холодный воздух плотнее и содержит больше кислорода в том же объёме.",
          "winRule": "Отлично! Примените правило: Холодный воздух плотнее и содержит больше кислорода в том же объёме."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Турбонаддув и интеркулер: устройство турбокомпрессора, вестгейт и диагностика утечек буста».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Опрессовщик впуска (дымогенератор))"
            },
            {
              "id": "s2",
              "text": "2. Описана опрессовка впуска и интеркулера"
            },
            {
              "id": "s3",
              "text": "3. Указана проверка осевого и радиального люфта"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Упомянута проверка клапана Wastegate"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-133",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Опрессовщик впуска (ды",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой люфт вала турбины является критическим и требует немедленного ремонта?",
          "choices": [
            {
              "id": "a",
              "text": "Ощутимый осевой (продольный) люфт или касание крыльчаткой корпуса",
              "outcome": "Осевой люфт быстро разрушает упорный подшипник и крыльчатку."
            },
            {
              "id": "b",
              "text": "Лёгкий радиальный люфт 0.05 мм без масла",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Вращение от руки без заеданий",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Отсутствие люфта",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Осевой люфт быстро разрушает упорный подшипник и крыльчатку.",
          "winRule": "Зачёт по модулю №13 подтверждён!"
        }
      ]
    },
    "14": {
      "title": "Тренажёр: Топливная система Common Rail (Дизель) и GDI (Бензин): ТНВ",
      "instrument": "Колбы для теста обратного слива",
      "mechanic": "workshop_quest",
      "badge": "AUTOMECHANIC / Урок 14",
      "brief": "Диагностика системы высокого давления Common Rail (до 2000 бар): тест форсунок на слив в обратку, регулятор давления и чистота сборки.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-141",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 14/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Топливная система Common Rail (Дизель) и GDI (Бензин): ТНВД, форсунки и обратный слив»: Что выявляет тест форсунок Common Rail с мерными колбами на обратном сливе?",
          "choices": [
            {
              "id": "a",
              "text": "Изношенную форсунку, сбрасывающую давление из топливной рампы",
              "outcome": "Сверхнормативный слив в обратку не даёт ТНВД набрать пусковое давление."
            },
            {
              "id": "b",
              "text": "Износ сцепления",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Состояние свечей накала",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Давление в расширительном бачке",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Сверхнормативный слив в обратку не даёт ТНВД набрать пусковое давление.",
          "winRule": "Отлично! Примените правило: Сверхнормативный слив в обратку не даёт ТНВД набрать пусковое давление."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Топливная система Common Rail (Дизель) и GDI (Бензин): ТНВД, форсунки и обратный слив».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Колбы для теста обратного слива)"
            },
            {
              "id": "s2",
              "text": "2. Описан тест мерными колбами"
            },
            {
              "id": "s3",
              "text": "3. Указана техника безопасности высокого давления"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Упомянута замена одноразовой медной шайбы и чистка колодца"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-143",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Колбы для теста обратн",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Почему смертельно опасно искать утечку дизеля рукой на работающем Common Rail?",
          "choices": [
            {
              "id": "a",
              "text": "Давление до 2000 бар пробивает кожу и вызывает тяжёлую травму",
              "outcome": "Осмотр выполняют только в очках, используя картон для поиска струи на заглушенном/защищённом узле."
            },
            {
              "id": "b",
              "text": "Дизель заморозит руку",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Сработает подушка безопасности",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Сгорит генератор",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Осмотр выполняют только в очках, используя картон для поиска струи на заглушенном/защищённом узле.",
          "winRule": "Зачёт по модулю №14 подтверждён!"
        }
      ]
    },
    "15": {
      "title": "Тренажёр: Автоматические трансмиссии (АКПП, вариатор CVT, робот DSG)",
      "instrument": "Установка замены ATF",
      "mechanic": "workshop_quest",
      "badge": "AUTOMECHANIC / Урок 15",
      "brief": "Контроль уровня и температуры жидкости ATF (обычно +35..+45°C), отличие масел ATF/CVT/DSG и адаптация сцеплений.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-151",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 15/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Автоматические трансмиссии (АКПП, вариатор CVT, робот DSG): замена ATF и диагностика»: При каком условии выставляется уровень масла через контрольную пробку на большинстве современных АКПП?",
          "choices": [
            {
              "id": "a",
              "text": "При работающем двигателе и температуре ATF +35..+45°C",
              "outcome": "Тепловое расширение ATF сильно влияет на уровень, а насос должен заполнить гидроблок."
            },
            {
              "id": "b",
              "text": "На холодном заглушенном двигателе -20°C",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "При 120°C",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "На скорости 100 км/ч",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Тепловое расширение ATF сильно влияет на уровень, а насос должен заполнить гидроблок.",
          "winRule": "Отлично! Примените правило: Тепловое расширение ATF сильно влияет на уровень, а насос должен заполнить гидроблок."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Автоматические трансмиссии (АКПП, вариатор CVT, робот DSG): замена ATF и диагностика».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Установка замены ATF)"
            },
            {
              "id": "s2",
              "text": "2. Указан осмотр поддона и магнитов на стружку"
            },
            {
              "id": "s3",
              "text": "3. Упомянут подбор точного допуска ATF/CVTF"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Описано выставление уровня при работающем ДВС и +35..+45°C"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-153",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Установка замены ATF",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Что произойдёт при заливке обычной ATF в ременной вариатор CVT?",
          "choices": [
            {
              "id": "a",
              "text": "Проскальзывание и быстрый износ ремня и конусов",
              "outcome": "CVT требует специальной жидкости с фрикционными присадками для стали."
            },
            {
              "id": "b",
              "text": "Увеличение ресурса вдвое",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Снижение расхода бензина",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Ничего не изменится",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "CVT требует специальной жидкости с фрикционными присадками для стали.",
          "winRule": "Зачёт по модулю №15 подтверждён!"
        }
      ]
    },
    "16": {
      "title": "Тренажёр: Развал-схождение (УУК): кастер, развал, схождение и 3D-сте",
      "instrument": "3D-стенд развал-схождения",
      "mechanic": "workshop_quest",
      "badge": "AUTOMECHANIC / Урок 16",
      "brief": "Физика углов установки колёс (развал, схождение, кастер), обязательная проверка подвески и давления в шинах перед регулировкой.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-161",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 16/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Развал-схождение (УУК): кастер, развал, схождение и 3D-стенд геометрии колёс»: Какой угол установки колёс быстрее всего «съедает» протектор шины при нарушении?",
          "choices": [
            {
              "id": "a",
              "text": "Схождение (Toe)",
              "outcome": "При нарушенном схождении колесо буквально волочится боком по асфальту."
            },
            {
              "id": "b",
              "text": "Кастер",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Давление запаски",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Вылет диска",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "При нарушенном схождении колесо буквально волочится боком по асфальту.",
          "winRule": "Отлично! Примените правило: При нарушенном схождении колесо буквально волочится боком по асфальту."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Развал-схождение (УУК): кастер, развал, схождение и 3D-стенд геометрии колёс».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (3D-стенд развал-схождения)"
            },
            {
              "id": "s2",
              "text": "2. Указана предварительная проверка люфтов и давления в шинах"
            },
            {
              "id": "s3",
              "text": "3. Верно описаны схождение, развал и кастер"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Упомянута калибровка руля в ноль"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-163",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "3D-стенд развал-схожде",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какой угол отвечает за стабилизацию и самовозврат руля в прямолинейное положение?",
          "choices": [
            {
              "id": "a",
              "text": "Кастер (Caster)",
              "outcome": "Положительный кастер создаёт стабилизирующий момент."
            },
            {
              "id": "b",
              "text": "Схождение задней оси",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Развал",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Диаметр ступицы",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Положительный кастер создаёт стабилизирующий момент.",
          "winRule": "Зачёт по модулю №16 подтверждён!"
        }
      ]
    },
    "17": {
      "title": "Тренажёр: Эндоскопия цилиндров, пневмотест (Leak-down) и безразборна",
      "instrument": "Видеоэндоскоп HD",
      "mechanic": "workshop_quest",
      "badge": "AUTOMECHANIC / Урок 17",
      "brief": "Оценка состояния хона цилиндров и клапанов эндоскопом, поиск точного места потери компрессии с помощью пневмотеста в ВМТ.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-171",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 17/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Эндоскопия цилиндров, пневмотест (Leak-down) и безразборная дефектовка ДВС»: О чём говорит выход воздуха из маслозаливной горловины при пневмотесте цилиндра в ВМТ?",
          "choices": [
            {
              "id": "a",
              "text": "О потере герметичности поршневых колец или задирах цилиндра",
              "outcome": "Воздух прорывается мимо поршневых колец в картер двигателя."
            },
            {
              "id": "b",
              "text": "О прогаре выпускного клапана",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "О трещине радиатора",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "О забитом катализаторе",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Воздух прорывается мимо поршневых колец в картер двигателя.",
          "winRule": "Отлично! Примените правило: Воздух прорывается мимо поршневых колец в картер двигателя."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Эндоскопия цилиндров, пневмотест (Leak-down) и безразборная дефектовка ДВС».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Видеоэндоскоп HD)"
            },
            {
              "id": "s2",
              "text": "2. Указана установка поршня в ВМТ такта сжатия"
            },
            {
              "id": "s3",
              "text": "3. Описана интерпретация утечек (картер / впуск / выпуск / ОЖ)"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Упомянут осмотр хона и клапанов эндоскопом"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-173",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Видеоэндоскоп HD",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Продвинутый",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Что показывает сетка «хона» на стенках цилиндра при видеоэндоскопии?",
          "choices": [
            {
              "id": "a",
              "text": "Сохранность заводской микроструктуры, удерживающей масляную плёнку",
              "outcome": "Отсутствие хона («зеркало») или вертикальные задиры говорят об износе ЦПГ."
            },
            {
              "id": "b",
              "text": "Трещину коленвала",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Износ ремня ГРМ",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Уровень тормозной жидкости",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Отсутствие хона («зеркало») или вертикальные задиры говорят об износе ЦПГ.",
          "winRule": "Зачёт по модулю №17 подтверждён!"
        }
      ]
    },
    "18": {
      "title": "Тренажёр: Система охлаждения и смазки ДВС: опрессовка, замер давлени",
      "instrument": "Механический манометр давления масла",
      "mechanic": "workshop_quest",
      "badge": "AUTOMECHANIC / Урок 18",
      "brief": "Проверка давления масла на горячую, диагностика прорыва газов в антифриз (тест CO2) и проверка клапана крышки расширительного бачка.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-181",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 18/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Система охлаждения и смазки ДВС: опрессовка, замер давления масла и промывка радиаторов»: Как точно проверить реальное давление масла в системе смазки ДВС?",
          "choices": [
            {
              "id": "a",
              "text": "Вкрутить механический манометр вместо датчика давления на прогретом ДВС",
              "outcome": "Только механический манометр даёт точное значение в барах на разных оборотах."
            },
            {
              "id": "b",
              "text": "Посмотреть на щуп",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "Открыть крышку бачка ОЖ",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Послушать стартер",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Только механический манометр даёт точное значение в барах на разных оборотах.",
          "winRule": "Отлично! Примените правило: Только механический манометр даёт точное значение в барах на разных оборотах."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Система охлаждения и смазки ДВС: опрессовка, замер давления масла и промывка радиаторов».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Механический манометр давления масла)"
            },
            {
              "id": "s2",
              "text": "2. Описана опрессовка системы охлаждения и проверка крышки"
            },
            {
              "id": "s3",
              "text": "3. Упомянут химический тест на CO2"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Описан замер давления масла манометром на горячем ДВС"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-183",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Механический манометр ",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Зачем в системе охлаждения поддерживается избыточное давление ~1.2 бара?",
          "choices": [
            {
              "id": "a",
              "text": "Для повышения температуры кипения антифриза до ~120°C",
              "outcome": "Под давлением точка кипения жидкости сдвигается вверх."
            },
            {
              "id": "b",
              "text": "Чтобы быстрее прогревался салон",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Для охлаждения тормозов",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Чтобы не замерзал омыватель",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Под давлением точка кипения жидкости сдвигается вверх.",
          "winRule": "Зачёт по модулю №18 подтверждён!"
        }
      ]
    },
    "19": {
      "title": "Тренажёр: Выхлопная система, катализатор, сажевый фильтр (DPF) и изм",
      "instrument": "Манометр противодавления выхлопа",
      "mechanic": "workshop_quest",
      "badge": "AUTOMECHANIC / Урок 19",
      "brief": "Проверка забитости катализатора манометром вместо первого лямбда-зонда, контроль дифференциального давления DPF и принудительная регенерация.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-191",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 19/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Выхлопная система, катализатор, сажевый фильтр (DPF) и измерение противодавления»: Куда подключают манометр для измерения противодавления катализатора?",
          "choices": [
            {
              "id": "a",
              "text": "В отверстие верхнего (первого) датчика кислорода",
              "outcome": "Первый лямбда-зонд расположен непосредственно перед сотами катализатора."
            },
            {
              "id": "b",
              "text": "В расширительный бачок",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "В маслозаливную горловину",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "В тормозной суппорт",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Первый лямбда-зонд расположен непосредственно перед сотами катализатора.",
          "winRule": "Отлично! Примените правило: Первый лямбда-зонд расположен непосредственно перед сотами катализатора."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Выхлопная система, катализатор, сажевый фильтр (DPF) и измерение противодавления».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Манометр противодавления выхлопа)"
            },
            {
              "id": "s2",
              "text": "2. Указано подключение манометра вместо 1-го лямбда-зонда"
            },
            {
              "id": "s3",
              "text": "3. Приведены пороговые значения в барах"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Описан визуальный осмотр сот эндоскопом"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-193",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Манометр противодавлен",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Средний",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Какое противодавление перед катализатором на 2500 об/мин указывает на его сильную забитость?",
          "choices": [
            {
              "id": "a",
              "text": "Выше 0.4–0.5 бар",
              "outcome": "Высокое противодавление запирает выхлопные газы в цилиндрах."
            },
            {
              "id": "b",
              "text": "0.02 бар",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "0.00 бар",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "-0.5 бар",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Высокое противодавление запирает выхлопные газы в цилиндрах.",
          "winRule": "Зачёт по модулю №19 подтверждён!"
        }
      ]
    },
    "20": {
      "title": "Тренажёр: Квалификационный экзамен: полный капитальный ремонт, затяж",
      "instrument": "Динамометрический ключ",
      "mechanic": "workshop_quest",
      "badge": "AUTOMECHANIC / Урок 20",
      "brief": "Финальная аттестация автомеханика: спиральная протяжка ГБЦ с доворотом на угол, дефектовка ЦПГ микрометром/нутромером и выходной контроль автомобиля.",
      "rounds": [
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-201",
          "speaker": "Куратор направления АМК",
          "telemetry": [
            {
              "label": "Модуль",
              "val": "Урок 20/20",
              "bad": false
            },
            {
              "label": "Статус",
              "val": "Требует решения",
              "bad": true
            }
          ],
          "situation": "Производственная ситуация по теме «Квалификационный экзамен: полный капитальный ремонт, затяжка ГБЦ и финальный контроль ОТК»: В каком порядке затягивают болты головки блока цилиндров (ГБЦ)?",
          "choices": [
            {
              "id": "a",
              "text": "От центра к краям по спирали или крест-накрест в несколько этапов",
              "outcome": "Схема от центра к краям равномерно обжимает прокладку без коробления ГБЦ."
            },
            {
              "id": "b",
              "text": "От краёв к центру сразу до упора",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "c",
              "text": "В случайном порядке",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            },
            {
              "id": "d",
              "text": "Только с одной стороны",
              "outcome": "Неверный выбор: проверьте регламент и повторите оценку ситуации."
            }
          ],
          "correctId": "a",
          "hint": "Схема от центра к краям равномерно обжимает прокладку без коробления ГБЦ.",
          "winRule": "Отлично! Примените правило: Схема от центра к краям равномерно обжимает прокладку без коробления ГБЦ."
        },
        {
          "mechanic": "code_or_formula_builder",
          "prompt": "Раунд 2: Соберите правильную технологическую последовательность для модуля «Квалификационный экзамен: полный капитальный ремонт, затяжка ГБЦ и финальный контроль ОТК».",
          "chips": [
            {
              "id": "s1",
              "text": "1. Подготовка и допуск (Динамометрический ключ)"
            },
            {
              "id": "s2",
              "text": "2. Указан замер ЦПГ нутромером/микрометром"
            },
            {
              "id": "s3",
              "text": "3. Описана поэтапная затяжка ГБЦ от центра к краям"
            },
            {
              "id": "s_bad",
              "text": "Пропустить проверку и сдать без контроля"
            },
            {
              "id": "s4",
              "text": "4. Включён финальный чек-лист ОТК (давление масла, течи, колёса)"
            }
          ],
          "correctOrder": [
            "s1",
            "s2",
            "s3",
            "s4"
          ],
          "hint": "Сначала допуск и инструмент, затем последовательные этапы и финальный контроль качества.",
          "winRule": "Технологическая карта собрана без нарушений регламента!"
        },
        {
          "mechanic": "workshop_quest",
          "ticketId": "AUT-203",
          "speaker": "Контролёр ОТК",
          "telemetry": [
            {
              "label": "Стек",
              "val": "Динамометрический ключ",
              "bad": false
            },
            {
              "label": "Допуск",
              "val": "Экзамен",
              "bad": false
            }
          ],
          "situation": "Финальный контрольный вопрос: Каким инструментом измеряют эллипсность и конусность цилиндра при капремонте?",
          "choices": [
            {
              "id": "a",
              "text": "Индикаторным нутромером",
              "outcome": "Нутромер измеряет внутренний диаметр с точностью до 0.01 мм."
            },
            {
              "id": "b",
              "text": "Рулеткой",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "c",
              "text": "Компрессометром",
              "outcome": "Параметр не соответствует промышленному стандарту."
            },
            {
              "id": "d",
              "text": "Мультиметром",
              "outcome": "Параметр не соответствует промышленному стандарту."
            }
          ],
          "correctId": "a",
          "hint": "Нутромер измеряет внутренний диаметр с точностью до 0.01 мм.",
          "winRule": "Зачёт по модулю №20 подтверждён!"
        }
      ]
    }
  }
};
