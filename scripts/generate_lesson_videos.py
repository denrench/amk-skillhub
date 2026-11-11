#!/usr/bin/env python3
"""
Generates 10-second visual explainer MP4 videos, JPG posters, and VTT captions
for all 59 AMK SkillHub catalog lessons (excluding autoelectric-3 starter pilot).

Each 10.0s video (300 frames @ 30fps, 1280x720 H.264) explains the topic visually
across 3 acts:
  0.0s - 3.0s: Problem / "Before" state with animated defect visual
  3.0s - 7.0s: Mechanism / "How it works" live animated schematic/diagram
  7.0s - 10.0s: Target / "After" verified standard & key numeric rule
"""
import json
import math
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "lesson-intros"
CATALOG_JS = ROOT / "js" / "courses-catalog.js"
MEDIA_JS = ROOT / "js" / "lesson-media.js"

W, H = 1280, 720
FPS = 30
DURATION = 10
TOTAL_FRAMES = FPS * DURATION  # 300 frames = exact 10.00s

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REG = "C:/Windows/Fonts/segoeui.ttf"
FONT_MONO = "C:/Windows/Fonts/consolab.ttf"

SPECIALTY_META = {
    "it": ("WEB DESIGN", (99, 102, 241), (56, 189, 248)),
    "graphic_design": ("GRAPHIC DESIGN", (168, 85, 247), (244, 114, 182)),
    "autoelectric": ("AUTOELECTRIC", (245, 158, 11), (34, 211, 238)),
    "hvac": ("HVAC SYSTEMS", (14, 165, 233), (52, 211, 153)),
    "automechanic": ("AUTOMECHANICS", (249, 115, 22), (250, 204, 21)),
}

# Per-lesson visual storyboard:
# (scene_type, before_title, before_metric, mech_formula, after_title, after_metric, cue1, cue2, cue3)
LESSON_STORYBOARDS = {
    # === IT / WEB DESIGN ===
    "it-1": ("web_optimize", "Тяжёлый PNG 300 ppi", "4.2 MB • Долгая загрузка", "72 ppi + сжатие WebP", "Лёгкий веб-баннер", "94 KB • Загрузка 0.2с",
             "Проблема: картинка 300 ppi весит 4.2 МБ и тормозит сайт.",
             "Переводим в 72 ppi и сжимаем в WebP без потери чёткости.",
             "Итог: 94 КБ при сохранении резкого текста на баннере."),
    "it-2": ("web_optimize", "Растровая иконка PNG", "Пиксели при зуме 400%", "Кривые Безье в SVG", "Векторный SVG-код", "1.8 KB • Любой экран",
             "Проблема: растр размывается на Retina-экранах при увеличении.",
             "Строим контур векторными кривыми и задаём viewBox 24x24.",
             "Итог: иконка SVG весит 1.8 КБ и остаётся идеальной на 4K."),
    "it-3": ("ui_grid", "Хаотичные отступы", "11px / 17px / 23px", "Модульная сетка 8px", "Ровный Frame-макет", "8px • 16px • 24px",
             "Проблема: случайные отступы ломают визуальный ритм интерфейса.",
             "Включаем сетку Layout Grid с базовым шагом 8 пикселей.",
             "Итог: все карточки и поля выровнены по единой сетке."),
    "it-4": ("ui_grid", "Ручной сдвиг блоков", "Текст наезжает на край", "Auto Layout (Shift + A)", "Гибкая кнопка/карточка", "Padding 16px • Gap 8px",
             "Проблема: при изменении текста кнопка ломается и не тянется.",
             "Auto Layout автоматически подстраивает ширину под контент.",
             "Итог: компонент сам держит отступы при любой длине текста."),
    "it-5": ("ui_grid", "10 копий одной кнопки", "Правка каждой вручную", "Master + Variants", "Единый дизайн-токен", "Default / Hover / Active",
             "Проблема: смена цвета требует правки десятков отдельных экранов.",
             "Создаём мастер-компонент и варианты состояний Hover/Disabled.",
             "Итог: одно изменение в мастере обновляет весь проект."),
    "it-6": ("code_preview", "Сплошной <div>-суп", "Нет структуры для SEO", "Семантика HTML5", "Чистый DOM-каркас", "<h1> + <p> + <button>",
             "Проблема: браузер и скринридеры не понимают структуру <div>.",
             "Размечаем контент смысловыми тегами h1, p, img и button.",
             "Итог: доступный и понятный документ для поиска и стилей."),
    "it-7": ("code_preview", "Текст прилип к краю", "Нет padding и radius", "CSS Box Model", "Аккуратная карточка", "padding: 16px; radius: 12px",
             "Проблема: голый HTML выглядит как сырой текст без воздуха.",
             "Добавляем background, внутренний padding и border-radius.",
             "Итог: читаемый блок с чётким контрастом и мягкими углами."),
    "it-8": ("code_preview", "Меню в столбик", "Элементы не в ряд", "display: flex; space-between", "Ровная шапка Header", "Лого слева • Меню справа",
             "Проблема: логотип и ссылки падают друг под друга.",
             "Flexbox выстраивает элементы по горизонтальной и вертикальной осям.",
             "Итог: адаптивный Header с ровным выравниванием по центру."),
    "it-9": ("code_preview", "Мёртвая кнопка", "Клик ничего не делает", "addEventListener('click')", "Живой отклик UI", "DOM реагирует на клик",
             "Проблема: без JS кнопка остаётся просто статичной картинкой.",
             "Находим элемент через querySelector и вешаем обработчик click.",
             "Итог: интерфейс отвечает на действия пользователя мгновенно."),
    "it-10": ("code_preview", "Макет только в Figma", "Статичная картинка", "HTML + CSS + Hover", "Рабочая карточка товара", "Макет 1-в-1 в браузере",
              "Проблема: дизайн в Figma нельзя кликнуть и открыть в браузере.",
              "Переносим размеры, цвета и шрифты из макета в HTML и CSS.",
              "Итог: готовая карточка продукта с анимацией наведения."),
    "it-11": ("ui_grid", "Горизонтальный скролл", "Ломается на 375px", "@media (max-width: 768px)", "Адаптивный Mobile-First", "100% под смартфон",
              "Проблема: десктопная сетка не помещается на экран телефона.",
              "Применяем media-запросы и перестраиваем колонки в стек.",
              "Итог: чистая вёрстка без скролла на любом устройстве."),
    "it-12": ("web_optimize", "Разрозненные файлы", "Ошибки Lighthouse", "Сборка + GitHub Pages", "Готовый продакшн-сайт", "Lighthouse 95+ • HTTPS",
              "Проблема: локальный проект ещё не доступен пользователям.",
              "Собираем лендинг, проверяем скорость и публикуем в репозиторий.",
              "Итог: живой сайт по ссылке с высокой оценкой качества."),

    # === GRAPHIC DESIGN ===
    "graphic_design-1": ("design_color", "Перегруженный центр", "Глаз не находит фокус", "Сетка третей 3×3", "Оптический баланс", "Фокус в узле силы",
                         "Проблема: все элементы свалены в центр без иерархии.",
                         "Делим холст сеткой третей и размещаем акцент на пересечении.",
                         "Итог: взгляд зрителя сразу считывает главный объект."),
    "graphic_design-2": ("design_color", "Кислотный RGB в печати", "Тусклый серый оттиск", "Конвертация RGB → CMYK", "Точный тиражный цвет", "CMYK FOGRA39 / Pantone",
                         "Проблема: яркий экранный RGB тускнеет на бумаге при печати.",
                         "Переводим макет в цветовой профиль CMYK с проверкой охвата.",
                         "Итог: предсказуемый чистый цвет на готовой полиграфии."),
    "graphic_design-3": ("design_color", "4 разных шрифта", "Слипшиеся строки", "Кернинг + Интерлиньяж 1.4", "Шрифтовая пара", "Контраст + Воздух",
                         "Проблема: мелкий интерлиньяж и случайные шрифты трудно читать.",
                         "Сочетаем 2 гарнитуры, настраиваем трекинг и высоту строки.",
                         "Итог: лёгкая типографика с чёткой иерархией заголовков."),
    "graphic_design-4": ("design_vector", "Ломаный контур", "50 лишних опорных точек", "Безье + Pathfinder", "Чистая векторная форма", "Минимум точек • 1 контур",
                         "Проблема: лишние точки делают кривую волнистой и тяжёлой.",
                         "Управляем касательными Безье и объединяем фигуры Pathfinder.",
                         "Итог: геометрически безупречный логотип или иллюстрация."),
    "graphic_design-5": ("design_vector", "Логотип впритык к краю", "Текст режет знак", "Охранное поле = X", "Защищённый Brandbook", "Отступ X со всех сторон",
                         "Проблема: без отступов соседние объекты визуально «съедают» знак.",
                         "Задаём охранное поле кратное элементу логотипа (модуль X).",
                         "Итог: логотип всегда читается чётко на любом носителе."),
    "graphic_design-6": ("design_vector", "Разные поля страниц", "Прыгающие заголовки", "Master Pages + Baseline", "Единый макет издания", "Сквозная модульная сетка",
                         "Проблема: ручная вёрстка каждой страницы даёт сдвиги строк.",
                         "Настраиваем мастер-шаблон и привязку к базовой сетке.",
                         "Итог: аккуратная многостраничная книга или журнал."),
    "graphic_design-7": ("design_color", "Стирание ластиком", "Потеря пикселей навсегда", "Слой-маска (Layer Mask)", "Неразрушающая ретушь", "Правка в 1 клик",
                         "Проблема: ластик безвозвратно удаляет часть фотографии.",
                         "Используем чёрно-белую маску слоя и смарт-объекты.",
                         "Итог: фон аккуратно скрыт, но исходник всегда можно вернуть."),
    "graphic_design-8": ("design_vector", "Текст на линии сгиба", "Брак при вырубке", "Dieline: Рез + Биговка", "Готовый штамп упаковки", "Точная 3D-развёртка",
                         "Проблема: без учёта сгибов графика заминается на клапанах.",
                         "Разделяем линии реза и биговки, проверяем грань на 3D-модели.",
                         "Итог: коробка собирается стык-в-стык без брака."),
    "graphic_design-9": ("design_vector", "Нет вылетов (Bleed)", "Белая полоса по краю", "300 dpi + Bleed 3 мм", "Файл PDF/X-1a готов", "300 dpi • CMYK • +3мм",
                         "Проблема: нож гильотины оставляет белую щель без вылетов.",
                         "Продлеваем фон на 3 мм за обрез и проверяем 300 dpi.",
                         "Итог: типография принимает макет без доработок."),
    "graphic_design-10": ("design_vector", "Разрозненные макеты", "Нет единого стиля", "Система айдентики", "Полный пакет бренда", "Лого + Носители + Гайд",
                          "Проблема: визитка, сайт и упаковка выглядят как разные фирмы.",
                          "Связываем носители общими цветами, сеткой и шрифтами.",
                          "Итог: цельный узнаваемый брендбук для заказчика."),
    "graphic_design-11": ("design_vector", "Один квадратный баннер", "Обрезан в Stories 9:16", "Ресайз-сетка SMM", "Пакет форматов 1:1 / 9:16", "Безопасные зоны UI",
                          "Проблема: текст перекрывается иконками интерфейса в Reels/Stories.",
                          "Адаптируем композицию под форматы 1:1, 4:5 и 9:16 с отступами.",
                          "Итог: креативы читаются идеально во всех соцсетях."),
    "graphic_design-12": ("design_vector", "Плоский PDF-экран", "Заказчик не видит масштаб", "Мокапы + Спецификация", "Защита дизайн-системы", "Mockup + Гайдлайн 100%",
                          "Проблема: без мокапов заказчику трудно оценить дизайн в жизни.",
                          "Наносим айдентику на реальные носители и собираем спецификацию.",
                          "Итог: убедительная презентация готового бренд-проекта."),

    # === AUTOELECTRIC ===
    "autoelectric-1": ("elec_circuit", "Окисленный контакт", "Падение ΔU = 2.4 В", "U = I × R (Закон Ома)", "Исправная силовая цепь", "Потери ≤ 0.2 В • Норма",
                       "Проблема: окисел повышает сопротивление, и нагрузка теряет напряжение.",
                       "Замеряем падение напряжения под нагрузкой между клеммами.",
                       "Итог: находим плохой контакт и возвращаем потери в норму ≤ 0.2 В."),
    "autoelectric-2": ("elec_circuit", "АКБ садится за ночь", "Ток утечки 0.85 A!", "Замер в разрыв минуса", "Причина утечки найдена", "Ток покоя ≤ 0.03 A",
                       "Проблема: неисправный блок не засыпает и высаживает батарею.",
                       "Ставим мультиметр в разрыв массы и проверяем цепи по предохранителям.",
                       "Итог: проблемная цепь найдена, ток покоя падает до 0.03 А."),
    "autoelectric-4": ("elec_circuit", "Недозаряд / Перезаряд", "11.8 В или 15.9 В на АКБ", "3 фазы → Диодный мост", "Стабильная зарядка", "14.2 В при нагрузке",
                       "Проблема: пробой диода или износ щёток срывает заряд аккумулятора.",
                       "Проверяем напряжение на ХХ и под нагрузкой фар и печки.",
                       "Итог: исправный генератор стабильно держит 13.8–14.4 В."),
    "autoelectric-5": ("elec_circuit", "Обрыв в жгуте DIN", "Неясна схема реле", "30/87 Сила • 85/86 Обмотка", "Точное чтение схемы", "Цепь прозвонена 100%",
                       "Проблема: без знания клемм DIN 72552 легко перепутать цепи реле.",
                       "Разделяем управляющую обмотку 85–86 и силовой контакт 30–87.",
                       "Итог: схема читается уверенно, неисправный узел найден сразу."),
    "autoelectric-6": ("elec_waveform", "Горит Check Engine", "Код P0171 (Бедная смесь)", "OBD-II + Freeze Frame", "Точный диагноз ЭБУ", "Коррекции STFT/LTFT ±5%",
                       "Проблема: слепая замена датчиков по одному коду не решает сбой.",
                       "Считываем Live Data и топливные коррекции на разных режимах.",
                       "Итог: найден подсос воздуха или сбой давления без лишних трат."),
    "autoelectric-7": ("elec_waveform", "Плавают обороты / Троение", "Ошибок в ЭБУ ещё нет", "Осциллограф ДПКВ / Лямбда", "Живая осциллограмма", "Чёткий фронт импульса",
                       "Проблема: мультиметр слишком медленный для быстрых сигналов датчиков.",
                       "Снимаем форму импульсов ДПКВ, ДПРВ и отклик лямбда-зонда.",
                       "Итог: мгновенно виден пропуск зуба или «уставший» датчик."),
    "autoelectric-8": ("elec_waveform", "Блоки не выходят на связь", "Шина CAN молчит (120 Ω)", "CAN-H + CAN-L (60 Ω)", "Зеркальный сигнал CAN", "2.5В±1В • Сопрот. 60 Ω",
                       "Проблема: обрыв одного терминатора меняет сопротивление шины на 120 Ω.",
                       "Измеряем 60 Ом между CAN-H и CAN-L и смотрим дифференциальный сигнал.",
                       "Итог: целостность мультиплексной шины подтверждена."),
    "autoelectric-9": ("elec_circuit", "Мерцает LED / Сбой BCM", "Неверная скважность ШИМ", "PWM-сигнал от блока BCM", "Стабильная работа оптики", "Плавный ШИМ без ошибок",
                       "Проблема: блок BCM управляет яркостью импульсами ШИМ, а не вольтажом.",
                       "Контролируем скважность PWM и целостность силовых ключей.",
                       "Итог: фары и климат работают штатно без перегрева цепей."),
    "autoelectric-10": ("elec_circuit", "Выбивает предохранитель", "Скрытое КЗ на массу", "Контрольная лампа + Жгут", "КЗ устранено + Термоусадка", "Сопротивление > 10 МОм",
                        "Проблема: жгут перетёрся о кузов и сразу сжигает новый предохранитель.",
                        "Ставим лампу вместо предохранителя и пошагово размыкаем разъёмы.",
                        "Итог: место замыкания найдено, провод восстановлен по стандарту."),
    "autoelectric-11": ("elec_waveform", "Горит индикатор SRS / ABS", "Потеря сигнала колеса", "Тест датчиков ABS + SRS", "Системы безопасности OK", "Ровный импульс на 4 колёсах",
                        "Проблема: обрыв провода датчика ABS отключает стабилизацию и тормоза.",
                        "Сравниваем сигналы скорости всех колёс и проверяем цепи подушек.",
                        "Итог: безопасность восстановлена, активные ошибки сброшены."),
    "autoelectric-12": ("elec_waveform", "Комплексный отказ авто", "Сразу 5 симптомов", "Протокол АМК: Схема→Замер", "Оформленный протокол", "100% точность дефектовки",
                        "Проблема: хаотичная проверка при комплексном отказе тратит часы.",
                        "Идём по алгоритму: питание АКБ → CAN → датчики → акт дефектовки.",
                        "Итог: выявлены все поломки и оформлен профессиональный протокол."),

    # === HVAC ===
    "hvac-1": ("hvac_loop", "Контур не охлаждает", "Непонятна фаза фреона", "4 такта: Сжатие→Испарение", "Замкнутый цикл Карно", "Холод в камере -18 °C",
               "Проблема: без понимания фазовых переходов нельзя диагностировать холод.",
               "Фреон сжимается, отдаёт тепло в конденсаторе, кипит в испарителе.",
               "Итог: тепло стабильно переносится из камеры наружу."),
    "hvac-2": ("hvac_loop", "Ошибка масла / фреона", "Заклинивший компрессор", "R600a / R134a + POE масло", "Точный подбор пары", "Совместимость 100%",
               "Проблема: смешивание несовместимых масел и газов разрушает компрессор.",
               "Подбираем масло (минеральное или POE) и учитываем горючесть R600a.",
               "Итог: система работает тихо и служит весь расчётный ресурс."),
    "hvac-3": ("hvac_loop", "Гидроудар или недозаправ", "Перегрев 1.5 K или 18 K", "SH = T_трубки - T_кипения", "Идеальный баланс контура", "Перегрев SH: 5–8 K",
               "Проблема: низкий перегрев грозит гидроударом, высокий — потерей холода.",
               "Считаем разницу между температурой трубки и кипением по манометру.",
               "Итог: перегрев в зелёной зоне 5–8 K — контур настроен идеально."),
    "hvac-4": ("hvac_service", "Компрессор гудит и греется", "Срабатывает тепловушка", "Обмотки C, S, R (R_CS < R_CR)", "Точная прозвонка клемм", "Исправное пусковое реле",
               "Проблема: перепутанные клеммы C, S, R сжигают обмотку при пуске.",
               "Измеряем сопротивление между тремя штырьками для поиска Common, Start, Run.",
               "Итог: обмотки целы, реле подключено правильно."),
    "hvac-5": ("hvac_service", "Окалина внутри трубы", "Засор капилляра / ТРВ", "Пайка с поддувом азота", "Чистый герметичный шов", "0% окислов внутри меди",
               "Проблема: пайка на воздухе даёт чёрную окалину, забивающую ТРВ.",
               "Подаём слабый поток сухого азота внутрь трубы при пайке медью.",
               "Итог: зеркально чистый внутренний канал и прочный паяный стык."),
    "hvac-6": ("hvac_service", "Ушёл фреон за неделю", "Микротрещина на вальцовке", "Опрессовка сухим азотом", "Утечка локализована", "Давление держит 24ч",
               "Проблема: искать утечку фреоном запрещено — малые поры не видны.",
               "Даём давление азота и проверяем стыки пеной и течеискателем.",
               "Итог: контур полностью герметичен перед вакуумированием."),
    "hvac-7": ("hvac_loop", "Влага и воздух в системе", "Лёд забивает дроссель", "Двухступенчатый вакуум-насос", "Глубокий вакуум < 500 мкм", "Влага удалена 100%",
               "Проблема: воздух повышает давление, а влага замерзает в капилляре.",
               "Откачиваем контур с контролем электронным вакуумметром до 500 микрон.",
               "Итог: система сухая, чистая и готова к точной заправке."),
    "hvac-8": ("hvac_loop", "Заправка «на глаз»", "Шуба на всасе / Перегруз", "Заправка по весам (граммы)", "Заводская доза по шильду", "Точность ±1 грамм",
               "Проблема: лишние 20 г R600a перегружают компрессор и губят охлаждение.",
               "Заправляем хладагент строго в жидкой/газовой фазе по электронным весам.",
               "Итог: паспортные давления и выход на режим за 20 минут."),
    "hvac-9": ("hvac_service", "Испаритель оброс шубой", "Тёплая холодильная камера", "Цепь No Frost: Таймер→ТЭН", "Штатная оттайка испарителя", "Чистые соты • Цикл 8ч",
               "Проблема: сгоревший ТЭН или термопредохранитель блокирует поток воздуха.",
               "Прозваниваем таймер, биметалл дефроста, ТЭН и вентилятор.",
               "Итог: автоматическая оттайка запускается и очищает испаритель."),
    "hvac-10": ("hvac_loop", "Торговая витрина встала", "Температура +12 °C в зале", "Комплекс: Замер→Опрессовка→Пуск", "Витрина сдана в работу", "Стабильно +2 °C • Акт",
                "Проблема: простой торговой витрины приводит к порче продукции.",
                "Выполняем полный цикл сервиса от поиска утечки до настройки контроллера.",
                "Итог: витрина держит температуру и передана заказчику."),
    "hvac-11": ("hvac_waveform" if False else "hvac_service", "Сбой инвертора BLDC", "Компрессор не стартует", "Проверка 3 фаз U-V-W + ШИМ", "Плавный частотный пуск", "Равные обмотки • Инвертор OK",
                "Проблема: инверторный компрессор нельзя включать напрямую в 220 В.",
                "Проверяем равенство сопротивлений U-V-W и импульсы платы управления.",
                "Итог: диагностика платы и инвертора без риска сжечь узел."),
    "hvac-12": ("hvac_loop", "Сдача холодильной камеры", "Неизвестен реальный КПД", "Пусконаладка + Паспорт ГТО", "Объект аттестован", "Все параметры в допуске",
                "Проблема: запуск без замера токов, вакуума и перегрева ведёт к аварии.",
                "Фиксируем давление, перегрев, переохлаждение и поток воздуха.",
                "Итог: камера запущена надёжно и оформлен технический паспорт."),

    # === AUTOMECHANIC ===
    "automechanic-1": ("mech_engine", "Мотор троит и не тянет", "Компрессия 6.5 бар в #2", "Компрессометр + Leak-Down", "Точный диагноз ЦПГ", "Утечка < 10% • Норма",
                        "Проблема: низкая компрессия может быть из-за клапанов или колец.",
                        "Подаём воздух пневмотестером и слушаем: выпуск, впуск или сапун.",
                        "Итог: точно определяем неисправный узел без разборки мотора."),
    "automechanic-2": ("mech_engine", "Сбиты фазы ГРМ", "Риск встречи клапанов!", "Метки КВ/РВ + Щуп зазора", "Идеальная синхронизация", "ВМТ точно • Зазор 0.25мм",
                        "Проблема: сдвиг ремня на 1–2 зуба вызывает потерю тяги или удар.",
                        "Совмещаем метки коленвала и распредвала, проверяем натяжитель и зазор.",
                        "Итог: фазы газораспределения выставлены по заводскому регламенту."),
    "automechanic-3": ("mech_engine", "Стук вкладышей / Износ", "Эллипс цилиндра > 0.08 мм", "Нутромер + Plastigauge", "Точный замер микрометром", "Зазор 0.03–0.05 мм",
                        "Проблема: сборка двигателя без промера приводит к масляному голоданию.",
                        "Измеряем нутромером геометрию цилиндра и пластигейджем — зазор шеек.",
                        "Итог: подтверждены допуски для долгой работы после капиталки."),
    "automechanic-4": ("mech_engine", "Перегрев / Лампа масла", "Давление 0.5 бар на ХХ", "Манометр + Рефрактометр", "Штатное охлаждение/смазка", "Давление >1.5 бар • -40°C",
                        "Проблема: слабый антифриз замерзает, а низкое давление убивает мотор.",
                        "Замеряем давление мех. манометром и плотность антифриза рефрактометром.",
                        "Итог: системы смазки и охлаждения защищают двигатель на 100%."),
    "automechanic-5": ("mech_engine", "Буксует сцепление / Хруст", "Износ диска до заклёпок", "Дефектовка + Центровка", "Мягкое включение МКПП", "Биение маховика < 0.1мм",
                        "Проблема: кривая установка диска без оправки не даёт поставить КПП.",
                        "Проверяем толщину диска, лепестки корзины и центрируем ведомый диск.",
                        "Итог: трансмиссия собрана ровно, передачи включаются мягко."),
    "automechanic-6": ("mech_engine", "Стук и увод на кочках", "Люфт шаровой / Сайлента", "Монтажка + Индикатор ИЧ", "Тихая собранная подвеска", "Люфт 0.0 мм • Ресурс OK",
                        "Проблема: незамеченный люфт шаровой опоры опасен отрывом колеса.",
                        "Проверяем сайлентблоки, амортизаторы и осевой люфт ступицы.",
                        "Итог: составлена точная карта ремонта ходовой части."),
    "automechanic-7": ("mech_engine", "Жрёт резину с края", "Развал -2.5° / Увод руля", "3D Сход-Развал (Camber/Toe)", "Ровный ход и руль", "Схождение 0°05′ • Норма",
                        "Проблема: сбитое схождение стирает новую покрышку за одну тысячу км.",
                        "Калибруем мишени 3D-стенда и регулируем Развал, Кастор и Схождение.",
                        "Итог: машина едет ровно, шины изнашиваются равномерно."),
    "automechanic-8": ("mech_engine", "Бьёт руль при торможении", "Биение диска 0.15 мм", "Индикатор ИЧ + Прокачка", "Чёткие тормоза с ABS", "Биение < 0.05 мм",
                        "Проблема: воздух в контуре и кривой диск увеличивают тормозной путь.",
                        "Замеряем биение диска, ревизируем суппорт и прокачиваем от дальнего.",
                        "Итог: жёсткая педаль и равномерное торможение без вибраций."),
    "automechanic-9": ("mech_engine", "Вибрация руля на 90 км/ч", "Дисбаланс колеса 45 г", "Статика + Динамика грузов", "Плавный ход на скорости", "Дисбаланс 0 г / 0 г",
                        "Проблема: дисбаланс разбивает ступичные подшипники и рулевую рейку.",
                        "Очищаем диск, калибруем станок и устанавливаем грузики по плоскостям.",
                        "Итог: идеальный ноль на балансировочном станке."),
    "automechanic-10": ("mech_engine", "Авто перед дальней дорогой", "Пропуски регламента ТО", "Регламент ТО-1 / ТО-2", "Подписанный заказ-наряд", "Затянуто по моменту",
                        "Проблема: поверхностный осмотр пропускает скрытые течи и износ.",
                        "Проходим по чек-листу: жидкости, фильтры, тормоза, подвеска, момент.",
                        "Итог: безопасный автомобиль и прозрачный заказ-наряд клиенту."),
    "automechanic-11": ("mech_engine", "Стук и тугой руль", "Люфт рейки > 5°", "Люфтомер + Сход-развал", "Точная управляемость ЭУР", "Люфт < 2° • Тяги целы",
                        "Проблема: разбитый рулевой наконечник вызывает рыскание на трассе.",
                        "Оцениваем люфт рейки, состояние пыльников, тяг и калибровку ЭУР.",
                        "Итог: острое и безопасное рулевое управление."),
    "automechanic-12": ("mech_engine", "Финальная приёмка ОТК", "Комплекс узлов на посту", "ДВС + Ходовая + Тормоза", "Акт выпускного контроля", "Готов к выдаче клиенту",
                        "Проблема: выпуск авто без финального контроля ОТК ведёт к возвратам.",
                        "Сводим замеры компрессии, тормозного стенда и геометрии в единый акт.",
                        "Итог: автомобиль прошёл все посты диагностики на 100%."),
}


def load_fonts():
    return {
        "h1": ImageFont.truetype(FONT_BOLD, 44),
        "h2": ImageFont.truetype(FONT_BOLD, 30),
        "h3": ImageFont.truetype(FONT_BOLD, 23),
        "body": ImageFont.truetype(FONT_REG, 22),
        "small": ImageFont.truetype(FONT_REG, 18),
        "mono": ImageFont.truetype(FONT_MONO, 22),
        "mono_lg": ImageFont.truetype(FONT_MONO, 34),
        "badge": ImageFont.truetype(FONT_BOLD, 16),
    }


def lerp(a, b, t):
    return a + (b - a) * max(0.0, min(1.0, t))


def ease_out(t):
    t = max(0.0, min(1.0, t))
    return 1.0 - (1.0 - t) ** 3


def blend(c1, c2, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def draw_round_rect(draw, box, radius, fill=None, outline=None, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_arrow(draw, x1, y1, x2, y2, color, width=4, head=14):
    draw.line([(x1, y1), (x2, y2)], fill=color, width=width)
    ang = math.atan2(y2 - y1, x2 - x1)
    p1 = (x2 - head * math.cos(ang - 0.45), y2 - head * math.sin(ang - 0.45))
    p2 = (x2 - head * math.cos(ang + 0.45), y2 - head * math.sin(ang + 0.45))
    draw.polygon([(x2, y2), p1, p2], fill=color)


def fit_text(draw, text, font, max_width):
    if draw.textlength(text, font=font) <= max_width:
        return text
    t = text
    while len(t) > 3 and draw.textlength(t + "...", font=font) > max_width:
        t = t[:-1]
    return t.rstrip() + "..."


def draw_centered_text(draw, box, text, font, fill):
    x1, y1, x2, y2 = box
    tw = draw.textlength(text, font=font)
    bbox = draw.textbbox((0, 0), text, font=font)
    th = bbox[3] - bbox[1]
    tx = x1 + (x2 - x1 - tw) / 2
    ty = y1 + (y2 - y1 - th) / 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill=fill)


def draw_scene_visual(draw, fonts, spec, num, sb, t_sec):
    """Draws the center animated visual diagram inside (70, 155, 1210, 585) based on scene_type."""
    scene_type, b_title, b_metric, formula, a_title, a_metric, _, _, _ = sb
    _, accent1, accent2 = SPECIALTY_META[spec]

    # Phase: 0 = Problem (0-3s), 1 = Mechanism (3-7s), 2 = Result (7-10s)
    if t_sec < 3.0:
        phase = 0
        pt = ease_out(t_sec / 3.0)
    elif t_sec < 7.0:
        phase = 1
        pt = ease_out((t_sec - 3.0) / 4.0)
    else:
        phase = 2
        pt = ease_out((t_sec - 7.0) / 3.0)

    cx, cy = 640, 370
    red = (239, 68, 68)
    amber = (245, 158, 11)
    green = (16, 185, 129)
    cyan = (34, 211, 238)
    slate_bg = (22, 32, 46)
    slate_border = (56, 76, 102)

    # Subtle animated grid inside viewport
    for gx in range(90, 1200, 45):
        draw.line([(gx, 160), (gx, 575)], fill=(255, 255, 255, 10) if False else (20, 30, 42), width=1)
    for gy in range(165, 575, 45):
        draw.line([(75, gy), (1205, gy)], fill=(20, 30, 42), width=1)

    if scene_type == "web_optimize":
        # Left card: BEFORE (Heavy / Pixelated)
        draw_round_rect(draw, (110, 210, 450, 520), 22, fill=(38, 22, 28), outline=red, width=3)
        draw.text((140, 232), "ДО: ПРОБЛЕМА", font=fonts["badge"], fill=red)
        draw.text((140, 262), b_title[:24], font=fonts["h3"], fill=(255, 255, 255))
        # Animated size bar (shrinks in phase 1-2)
        bar_w = int(lerp(270, 270 if phase == 0 else 80, pt if phase > 0 else 0))
        draw_round_rect(draw, (140, 315, 420, 345), 10, fill=(24, 15, 18))
        draw_round_rect(draw, (140, 315, 140 + bar_w, 345), 10, fill=red)
        # Pixel grid inside "before" box
        px_step = 24
        for ix in range(145, 410, px_step):
            for iy in range(370, 460, px_step):
                c = (200, 70, 80) if ((ix + iy) // px_step) % 2 == 0 else (120, 45, 55)
                draw.rectangle((ix, iy, ix + px_step - 3, iy + px_step - 3), fill=c)
        draw.text((140, 475), b_metric[:28], font=fonts["mono"], fill=(252, 165, 165))

        # Center pipeline
        prog = pt if phase == 1 else (1.0 if phase == 2 else 0.25 * pt)
        draw_arrow(draw, 470, 365, 810, 365, blend(amber, cyan, prog), width=6, head=18)
        pill_box = (478, 286, 802, 342)
        draw_round_rect(draw, pill_box, 16, fill=(20, 42, 62), outline=cyan, width=2)
        draw_centered_text(draw, pill_box, fit_text(draw, formula, fonts["mono"], 300), fonts["mono"], cyan)
        # Moving packet dot
        dot_x = int(475 + ((t_sec * 180) % 320))
        draw.ellipse((dot_x - 9, 356, dot_x + 9, 374), fill=(255, 255, 255))

        # Right card: AFTER (Optimized)
        act = 1.0 if phase == 2 else (0.35 + 0.65 * pt if phase == 1 else 0.2)
        border_c = green if phase == 2 else slate_border
        draw_round_rect(draw, (830, 210, 1170, 520), 22, fill=(16, 38, 32) if phase >= 1 else slate_bg, outline=border_c, width=3)
        draw.text((860, 232), "ПОСЛЕ: ЭТАЛОН", font=fonts["badge"], fill=green if phase == 2 else (148, 163, 184))
        draw.text((860, 262), fit_text(draw, a_title, fonts["h3"], 285), font=fonts["h3"], fill=(255, 255, 255))
        fill_w = int(lerp(40, 260, act))
        draw_round_rect(draw, (860, 315, 1140, 345), 10, fill=(14, 24, 22))
        draw_round_rect(draw, (860, 315, 860 + fill_w, 345), 10, fill=green)
        # Crisp vector preview circle + checkmark
        r_ring = int(34 * (0.7 + 0.3 * act))
        draw.ellipse((1000 - r_ring, 415 - r_ring, 1000 + r_ring, 415 + r_ring), fill=(16, 185, 129), outline=(167, 243, 208), width=3)
        draw_centered_text(draw, (966, 381, 1034, 449), "OK", fonts["h3"], (255, 255, 255))
        draw.text((860, 475), fit_text(draw, a_metric, fonts["mono"], 285), font=fonts["mono"], fill=(110, 231, 183))

    elif scene_type == "ui_grid":
        # Animated wireframe artboard snapping to 8px/responsive grid
        draw_round_rect(draw, (140, 195, 1140, 535), 24, fill=slate_bg, outline=accent1, width=2)
        # Grid lines appear in phase 1 & 2
        if phase >= 1:
            for gx in range(180, 1120, 60):
                draw.line([(gx, 205), (gx, 525)], fill=(56, 189, 248) if gx % 120 == 0 else (35, 52, 74), width=1)
        # Three UI blocks that align smoothly from crooked -> aligned
        snap = 0.0 if phase == 0 else (pt if phase == 1 else 1.0)
        offsets = [(-26, 22), (18, -18), (-14, 28)]
        for idx, (ox, oy) in enumerate(offsets):
            bx = int(200 + idx * 300 + ox * (1.0 - snap))
            by = int(250 + oy * (1.0 - snap))
            bw = int(240 - idx * 10 * (1.0 - snap))
            bh = int(170 + (idx % 2) * 25 * (1.0 - snap))
            col = blend(red, green if phase == 2 else accent2, snap)
            draw_round_rect(draw, (bx, by, bx + bw, by + bh), 16, fill=(28, 42, 64), outline=col, width=3)
            draw_round_rect(draw, (bx + 18, by + 20, bx + bw - 40, by + 40), 6, fill=col)
            draw_round_rect(draw, (bx + 18, by + 55, bx + bw - 70, by + 70), 5, fill=(148, 163, 184))
            draw_round_rect(draw, (bx + 18, by + bh - 48, bx + 130, by + bh - 18), 8, fill=accent1)
        # Bottom measurement pill
        msg = b_metric if phase == 0 else (formula if phase == 1 else a_metric)
        pill_col = red if phase == 0 else (cyan if phase == 1 else green)
        draw_round_rect(draw, (370, 470, 910, 515), 14, fill=(15, 23, 42), outline=pill_col, width=2)
        draw.text((400, 480), msg[:38], font=fonts["mono"], fill=pill_col)

    elif scene_type == "code_preview":
        # Left: Code editor panel; Right: Live UI preview reacting
        draw_round_rect(draw, (110, 200, 610, 530), 20, fill=(15, 20, 30), outline=accent1, width=2)
        draw.text((135, 218), "EDITOR • HTML / CSS / JS", font=fonts["badge"], fill=cyan)
        code_lines = [
            ".card {",
            f"  {formula[:28]}",
            "  padding: 16px;",
            "  border-radius: 14px;",
            "  transition: 0.2s ease;",
            "}"
        ]
        typed_chars = int(lerp(18, sum(len(l) for l in code_lines), (t_sec - 0.5) / 4.0))
        acc = 0
        for li, line in enumerate(code_lines):
            y_pos = 260 + li * 38
            take = max(0, min(len(line), typed_chars - acc))
            acc += len(line)
            c_col = cyan if li == 1 else ((226, 232, 240) if li in (0, 5) else (167, 243, 208))
            draw.text((140, y_pos), fit_text(draw, line[:take], fonts["mono"], 445), font=fonts["mono"], fill=c_col)

        # Animated arrow
        draw_arrow(draw, 620, 365, 685, 365, cyan if phase >= 1 else amber, width=5, head=14)

        # Right: Live Preview Card transforming from broken -> styled
        morph = 0.0 if phase == 0 else (pt if phase == 1 else 1.0)
        draw_round_rect(draw, (700, 200, 1170, 530), 20, fill=(22, 32, 46), outline=green if phase == 2 else slate_border, width=2)
        draw.text((725, 218), "LIVE БРАУЗЕР", font=fonts["badge"], fill=green if phase == 2 else (148, 163, 184))
        pad = int(lerp(4, 26, morph))
        rad = int(lerp(0, 18, morph))
        draw_round_rect(draw, (730, 260, 1140, 495), rad, fill=blend((45, 30, 35), (30, 41, 72), morph), outline=blend(red, green, morph), width=3)
        # Header blocks inside preview align side-by-side as morph -> 1
        bx2 = int(lerp(740, 960, morph))
        by2 = int(lerp(335, 285, morph))
        draw_round_rect(draw, (735 + pad // 2, 285, 865, 325), 8, fill=accent1)
        draw_round_rect(draw, (bx2, by2, bx2 + 140, by2 + 40), 8, fill=blend(amber, cyan, morph))
        draw.text((740, 435), (b_metric if phase == 0 else a_metric)[:30], font=fonts["mono"], fill=green if phase == 2 else (252, 165, 165))

    elif scene_type == "design_color":
        # Left: RGB/Crowded/Unbalanced vs Right: CMYK/Balanced/Masked
        draw_round_rect(draw, (110, 205, 590, 525), 22, fill=slate_bg, outline=red if phase == 0 else slate_border, width=3)
        draw.text((135, 225), "ДО: " + b_title[:22], font=fonts["h3"], fill=(252, 165, 165))
        # Animated color swatches / rule of thirds
        swatches_bad = [(255, 0, 128), (0, 255, 255), (255, 255, 0)]
        for si, col in enumerate(swatches_bad):
            draw.ellipse((150 + si * 120, 295, 250 + si * 120, 395), fill=col, outline=(255, 255, 255), width=2)
        draw.text((135, 450), b_metric[:30], font=fonts["mono"], fill=(252, 165, 165))

        draw_arrow(draw, 600, 365, 680, 365, cyan, width=5, head=15)

        act = pt if phase == 1 else (1.0 if phase == 2 else 0.15)
        draw_round_rect(draw, (690, 205, 1170, 525), 22, fill=(18, 36, 36), outline=green if phase == 2 else accent1, width=3)
        draw.text((715, 225), "ПОСЛЕ: " + a_title[:20], font=fonts["h3"], fill=(110, 231, 183))
        # Rule of thirds grid + balanced swatches
        for gx in (850, 1010):
            draw.line([(gx, 280), (gx, 440)], fill=(100, 116, 139), width=1)
        for gy in (333, 386):
            draw.line([(720, gy), (1140, gy)], fill=(100, 116, 139), width=1)
        fx = int(lerp(930, 850, act))
        fy = int(lerp(360, 333, act))
        draw.ellipse((fx - 42, fy - 42, fx + 42, fy + 42), fill=accent1, outline=(167, 243, 208), width=3)
        draw.text((715, 450), a_metric[:30], font=fonts["mono"], fill=(110, 231, 183))

    elif scene_type == "design_vector":
        # Animated Vector Canvas with Bezier Handles / Bleed 3mm / Dieline
        draw_round_rect(draw, (140, 195, 1140, 535), 22, fill=slate_bg, outline=accent1, width=2)
        # Bleed zone outer dashed/colored frame
        bleed_col = red if phase == 0 else green
        draw_round_rect(draw, (220, 225, 1060, 505), 14, fill=(24, 34, 52), outline=bleed_col, width=3)
        draw_round_rect(draw, (255, 255, 1025, 475), 10, fill=(30, 44, 68), outline=cyan, width=2)
        # Animated Bezier curve / Anchor points
        pts = [(330, 410), (490, 290), (680, 420), (880, 300), (960, 370)]
        wave = math.sin(t_sec * 3.0) * (18 if phase < 2 else 0)
        anim_pts = [(x, int(y + (wave if i % 2 == 1 else -wave * 0.5))) for i, (x, y) in enumerate(pts)]
        draw.line(anim_pts, fill=accent2, width=5)
        for px, py in anim_pts:
            draw.rectangle((px - 7, py - 7, px + 7, py + 7), fill=(255, 255, 255), outline=accent1, width=2)
        draw.text((275, 268), formula[:38], font=fonts["mono"], fill=cyan)
        draw.text((275, 440), (b_metric if phase == 0 else a_metric)[:38], font=fonts["mono"], fill=green if phase == 2 else (252, 165, 165))

    elif scene_type == "elec_circuit":
        # Animated Automotive 12V Circuit: Battery -> Fuse/Relay -> Load -> Ground + Moving Electrons + Multimeter
        draw_round_rect(draw, (110, 195, 800, 535), 22, fill=slate_bg, outline=accent1, width=2)
        # Circuit loop coordinates
        wire_col = red if phase == 0 else (amber if phase == 1 else green)
        draw.line([(200, 260), (690, 260), (690, 465), (200, 465), (200, 260)], fill=wire_col, width=6)
        # Battery block
        draw_round_rect(draw, (145, 315, 255, 410), 12, fill=(30, 41, 59), outline=amber, width=3)
        draw.text((168, 340), "12.6V", font=fonts["h3"], fill=amber)
        draw.text((170, 372), "АКБ", font=fonts["small"], fill=(203, 213, 225))
        # Fuse/Contact node on top wire
        node_col = red if phase == 0 else green
        draw_round_rect(draw, (395, 232, 515, 288), 10, fill=(45, 20, 25) if phase == 0 else (16, 48, 36), outline=node_col, width=3)
        draw.text((412, 248), "УЗЕЛ" if phase > 0 else "СБОЙ!", font=fonts["badge"], fill=(255, 255, 255))
        # Load block on right
        draw_round_rect(draw, (625, 315, 755, 410), 12, fill=(30, 41, 59), outline=cyan, width=3)
        draw.text((642, 348), "НАГРУЗКА", font=fonts["badge"], fill=cyan)
        # Moving current pulses along the loop
        speed = 0.4 if phase == 0 else 1.3
        for k in range(6):
            p = ((t_sec * speed + k / 6.0) % 1.0)
            if p < 0.3:
                px, py = int(lerp(200, 690, p / 0.3)), 260
            elif p < 0.5:
                px, py = 690, int(lerp(260, 465, (p - 0.3) / 0.2))
            elif p < 0.8:
                px, py = int(lerp(690, 200, (p - 0.5) / 0.3)), 465
            else:
                px, py = 200, int(lerp(465, 260, (p - 0.8) / 0.2))
            draw.ellipse((px - 7, py - 7, px + 7, py + 7), fill=(255, 255, 255))

        # Right: Digital Multimeter LCD
        draw_round_rect(draw, (830, 195, 1170, 535), 22, fill=(14, 24, 34), outline=cyan, width=3)
        draw.text((860, 220), "FLUKE TRUE RMS", font=fonts["badge"], fill=cyan)
        lcd_box = (855, 260, 1145, 385)
        draw_round_rect(draw, lcd_box, 14, fill=(10, 32, 38), outline=(34, 211, 238), width=2)
        val_txt = b_metric.split("•")[0].strip() if phase == 0 else a_metric.split("•")[0].strip()
        draw_centered_text(draw, lcd_box, fit_text(draw, val_txt, fonts["h2"], 265), fonts["h2"], red if phase == 0 else green)
        draw.text((855, 410), fit_text(draw, formula, fonts["mono"], 290), font=fonts["mono"], fill=(226, 232, 240))
        draw.text((855, 455), "Щуп (+) -> Щуп (COM)", font=fonts["small"], fill=(148, 163, 184))

    elif scene_type == "elec_waveform":
        # Live animated Oscilloscope / CAN-Bus differential trace
        draw_round_rect(draw, (110, 195, 1170, 535), 22, fill=(10, 18, 28), outline=cyan, width=3)
        draw.text((140, 215), f"ОСЦИЛЛОГРАФ / ШИНА • {formula[:34]}", font=fonts["badge"], fill=cyan)
        # Scope grid
        for gx in range(140, 1140, 80):
            draw.line([(gx, 255), (gx, 470)], fill=(22, 42, 58), width=1)
        for gy in range(255, 475, 50):
            draw.line([(140, gy), (1140, gy)], fill=(22, 42, 58), width=1)
        # Wave 1 (CAN-H / CKP) and Wave 2 (CAN-L)
        pts_h, pts_l = [], []
        for x in range(145, 1135, 10):
            u = (x - 145) / 45.0 + t_sec * 4.5
            sq = 1.0 if math.sin(u) > 0 else 0.0
            noise = 0.35 * math.sin(u * 3.7) if phase == 0 else 0.0
            yh = int(350 - (sq + noise) * 65)
            yl = int(370 + (sq - noise) * 65)
            pts_h.append((x, yh))
            pts_l.append((x, yl))
        draw.line(pts_h, fill=amber if phase < 2 else green, width=4)
        draw.line(pts_l, fill=red if phase == 0 else cyan, width=4)
        status_msg = b_metric if phase == 0 else a_metric
        draw.text((145, 488), status_msg[:46], font=fonts["mono"], fill=red if phase == 0 else green)

    elif scene_type == "hvac_loop":
        # 4-stage Refrigeration Loop + Gauges + Superheat
        draw_round_rect(draw, (110, 195, 810, 535), 22, fill=slate_bg, outline=cyan, width=2)
        # Loop pipe
        draw.line([(230, 275), (690, 275)], fill=red, width=8)     # High pressure hot
        draw.line([(690, 275), (690, 455)], fill=amber, width=8)   # Condenser -> TXV
        draw.line([(690, 455), (230, 455)], fill=cyan, width=8)    # Low pressure cold
        draw.line([(230, 455), (230, 275)], fill=(59, 130, 246), width=8)  # Suction
        # Animated refrigerant particles (drawn on pipes before node cards)
        for k in range(6):
            p = (t_sec * 0.45 + k / 6.0) % 1.0
            if p < 0.25:
                px, py = int(lerp(230, 690, p / 0.25)), 275
            elif p < 0.5:
                px, py = 690, int(lerp(275, 455, (p - 0.25) / 0.25))
            elif p < 0.75:
                px, py = int(lerp(690, 230, (p - 0.5) / 0.25)), 455
            else:
                px, py = 230, int(lerp(455, 275, (p - 0.75) / 0.25))
            draw.ellipse((px - 7, py - 7, px + 7, py + 7), fill=(255, 255, 255))
        # 4 Nodes
        nodes = [
            (150, 240, 310, 310, "1. КОМПРЕССОР", red),
            (600, 240, 770, 310, "2. КОНДЕНСАТОР", amber),
            (600, 420, 770, 490, "3. ТРВ / ВЕНТИЛЬ", cyan),
            (150, 420, 310, 490, "4. ИСПАРИТЕЛЬ", (56, 189, 248)),
        ]
        for x1, y1, x2, y2, lbl, col in nodes:
            draw_round_rect(draw, (x1, y1, x2, y2), 12, fill=(18, 28, 42), outline=col, width=3)
            draw_centered_text(draw, (x1, y1, x2, y2), lbl, fonts["badge"], (255, 255, 255))

        # Right: Manifold Gauge + Superheat readout
        draw_round_rect(draw, (835, 195, 1170, 535), 22, fill=(14, 24, 34), outline=green if phase == 2 else cyan, width=3)
        draw.text((860, 220), "МАНОМЕТР / SUPERHEAT", font=fonts["badge"], fill=cyan)
        # Dial gauge
        gx, gy, gr = 1002, 330, 78
        draw.ellipse((gx - gr, gy - gr, gx + gr, gy + gr), fill=(18, 32, 48), outline=slate_border, width=4)
        ang = lerp(-2.3, -0.2 if phase == 0 else 0.7, pt if phase > 0 else 0.3)
        nx = int(gx + math.cos(ang) * (gr - 14))
        ny = int(gy + math.sin(ang) * (gr - 14))
        draw.line([(gx, gy), (nx, ny)], fill=red if phase == 0 else green, width=5)
        draw.ellipse((gx - 8, gy - 8, gx + 8, gy + 8), fill=(255, 255, 255))
        draw.text((855, 430), fit_text(draw, formula, fonts["small"], 295), font=fonts["small"], fill=(226, 232, 240))
        draw.text((855, 470), fit_text(draw, b_metric if phase == 0 else a_metric, fonts["small"], 295), font=fonts["small"], fill=red if phase == 0 else green)

    elif scene_type == "hvac_service":
        # Animated Pipe Brazing / Nitrogen Purge / CSR Ohmmeter / No Frost Test
        draw_round_rect(draw, (110, 195, 1170, 535), 22, fill=slate_bg, outline=accent1, width=2)
        # Copper tube or compressor triangle
        draw_round_rect(draw, (170, 285, 830, 355), 14, fill=(138, 75, 45), outline=(217, 119, 6), width=3)
        # Flowing protective gas / test pulse
        gas_col = red if phase == 0 else cyan
        for k in range(7):
            px = int(190 + ((t_sec * 240 + k * 90) % 620))
            draw.ellipse((px - 8, 312, px + 8, 328), fill=gas_col)
        draw_round_rect(draw, (860, 235, 1130, 495), 18, fill=(15, 25, 38), outline=green if phase == 2 else amber, width=3)
        draw.text((885, 260), "КОНТРОЛЬ", font=fonts["badge"], fill=cyan)
        draw.text((885, 310), (b_metric if phase == 0 else a_metric)[:16], font=fonts["h2"], fill=red if phase == 0 else green)
        draw.text((170, 405), formula[:42], font=fonts["mono"], fill=cyan)
        draw.text((170, 455), (b_title if phase == 0 else a_title)[:42], font=fonts["h3"], fill=(255, 255, 255))

    else:  # mech_engine
        # Animated Cylinder & Piston + Timing Gear / Torque / Gauge
        draw_round_rect(draw, (110, 195, 700, 535), 22, fill=slate_bg, outline=accent1, width=2)
        # Cylinder walls
        draw_round_rect(draw, (250, 235, 450, 495), 8, fill=(15, 23, 36), outline=(148, 163, 184), width=4)
        # Moving piston
        stroke = math.sin(t_sec * (2.2 if phase == 0 else 4.2))
        py = int(345 + stroke * 55)
        p_col = red if phase == 0 else (amber if phase == 1 else green)
        draw_round_rect(draw, (262, py, 438, py + 64), 8, fill=(71, 85, 105), outline=p_col, width=3)
        draw.line([(350, py + 64), (350, 485)], fill=(203, 213, 225), width=8)
        # Spark / Compression flash at TDC
        if stroke < -0.6:
            draw.ellipse((325, 245, 375, 285), fill=amber if phase > 0 else red)
        # Valves
        draw_round_rect(draw, (285, 218, 325, 245), 4, fill=cyan)
        draw_round_rect(draw, (375, 218, 415, 245), 4, fill=amber)
        draw.text((480, 260), "ДВС / УЗЕЛ", font=fonts["badge"], fill=amber)
        draw.text((480, 305), "ВМТ / Замер", font=fonts["h3"], fill=(255, 255, 255))
        draw.text((480, 355), fit_text(draw, formula, fonts["small"], 200), font=fonts["small"], fill=cyan)

        # Right: Diagnostic Gauge / Torque Readout
        draw_round_rect(draw, (730, 195, 1170, 535), 22, fill=(16, 24, 34), outline=green if phase == 2 else amber, width=3)
        draw.text((760, 225), "ПРИБОРНЫЙ КОНТРОЛЬ", font=fonts["badge"], fill=amber)
        gauge_box = (755, 275, 1145, 385)
        draw_round_rect(draw, gauge_box, 14, fill=(10, 18, 26), outline=slate_border, width=2)
        draw_centered_text(draw, gauge_box, fit_text(draw, b_metric if phase == 0 else a_metric, fonts["h2"], 365), fonts["h2"], red if phase == 0 else green)
        draw.text((760, 420), fit_text(draw, b_title if phase == 0 else a_title, fonts["h3"], 385), font=fonts["h3"], fill=(255, 255, 255))
        draw.text((760, 465), fit_text(draw, formula, fonts["small"], 385), font=fonts["small"], fill=cyan)


def render_frame(fonts, spec, num, title, sb, frame_idx):
    t_sec = frame_idx / FPS
    img = Image.new("RGB", (W, H), (11, 16, 26))
    draw = ImageDraw.Draw(img)
    spec_label, accent1, accent2 = SPECIALTY_META[spec]

    # Top header bar
    draw_round_rect(draw, (40, 26, W - 40, 134), 20, fill=(18, 26, 40), outline=(45, 62, 88), width=2)
    draw_round_rect(draw, (64, 42, 300, 74), 10, fill=accent1)
    draw_centered_text(draw, (64, 42, 300, 74), f"{spec_label} • #{num:02d}", fonts["badge"], (255, 255, 255))

    clean_title = re.sub(r"^Урок\s*\d+\.\s*", "", title).strip()
    clean_title = fit_text(draw, clean_title, fonts["h2"], W - 360)
    draw.text((64, 84), clean_title, font=fonts["h2"], fill=(248, 250, 252))

    # Timer badge (00:XX / 00:10)
    sec_i = min(10, int(t_sec))
    timer_box = (W - 260, 40, W - 64, 80)
    draw_round_rect(draw, timer_box, 12, fill=(12, 18, 28), outline=accent2, width=2)
    draw_centered_text(draw, timer_box, f"00:{sec_i:02d} / 00:10", fonts["mono"], accent2)

    # Center animated visual scene
    draw_scene_visual(draw, fonts, spec, num, sb, t_sec)

    # Bottom explainer caption + 3-act progress strip
    if t_sec < 3.0:
        act_lbl = "1. ПРОБЛЕМА"
        act_col = (239, 68, 68)
        caption = sb[6]
    elif t_sec < 7.0:
        act_lbl = "2. КАК РАБОТАЕТ"
        act_col = (34, 211, 238)
        caption = sb[7]
    else:
        act_lbl = "3. ЭТАЛОН"
        act_col = (16, 185, 129)
        caption = sb[8]

    draw_round_rect(draw, (40, 600, W - 40, 694), 18, fill=(16, 24, 36), outline=act_col, width=2)
    act_box = (60, 616, 260, 650)
    draw_round_rect(draw, act_box, 10, fill=act_col)
    draw_centered_text(draw, act_box, act_lbl, fonts["badge"], (10, 15, 22))
    caption_fit = fit_text(draw, caption, fonts["body"], W - 340)
    draw.text((280, 619), caption_fit, font=fonts["body"], fill=(241, 245, 249))

    # Smooth 10-second timeline progress bar
    bar_x1, bar_x2, bar_y = 60, W - 60, 668
    draw_round_rect(draw, (bar_x1, bar_y, bar_x2, bar_y + 10), 5, fill=(30, 41, 59))
    prog_x = int(bar_x1 + (bar_x2 - bar_x1) * (frame_idx / max(1, TOTAL_FRAMES - 1)))
    draw_round_rect(draw, (bar_x1, bar_y, max(bar_x1 + 10, prog_x), bar_y + 10), 5, fill=act_col)

    return img


def load_catalog():
    raw = CATALOG_JS.read_text(encoding="utf-8")
    marker = "window.EDU_LESSONS = "
    idx = raw.find(marker)
    json_str = raw[idx + len(marker):].strip().rstrip(";")
    return json.loads(json_str)


def generate_one(args):
    spec, num, title, sb, fonts = args
    key = f"{spec}-{num}"
    mp4_path = OUT_DIR / f"{key}.mp4"
    jpg_path = OUT_DIR / f"{key}.jpg"
    vtt_path = OUT_DIR / f"{key}.vtt"

    cmd = [
        FFMPEG, "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{W}x{H}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-an",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "24",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(mp4_path),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    poster_img = None
    for f_idx in range(TOTAL_FRAMES):
        frame = render_frame(fonts, spec, num, title, sb, f_idx)
        if f_idx == 150:  # crisp midpoint poster
            poster_img = frame.copy()
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    _, err = proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg failed for {key}: {err.decode('utf-8', 'ignore')}")

    if poster_img:
        poster_img.save(jpg_path, format="JPEG", quality=88)

    vtt_content = (
        "WEBVTT\n\n"
        f"00:00:00.000 --> 00:00:03.000\n{sb[6]}\n\n"
        f"00:00:03.000 --> 00:00:07.000\n{sb[7]}\n\n"
        f"00:00:07.000 --> 00:00:10.000\n{sb[8]}\n"
    )
    vtt_path.write_text(vtt_content, encoding="utf-8")
    return key


def main():
    only = set(sys.argv[1:]) if len(sys.argv) > 1 else None
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    catalog = load_catalog()
    fonts = load_fonts()

    tasks = []
    lesson_media_map = {}
    for spec, items in catalog.items():
        for it in items:
            num = int(it["num"])
            key = f"{spec}-{num}"
            if key == "autoelectric-3":
                continue
            clean_title = re.sub(r"^Урок\s*\d+\.\s*", "", it["title"]).strip()
            lesson_media_map[key] = [clean_title, 3, 7]
            if only and key not in only:
                continue
            sb = LESSON_STORYBOARDS[key]
            tasks.append((spec, num, it["title"], sb, fonts))

    print(f"Generating {len(tasks)} 10-second explainer videos (1280x720 @ 30fps)...")
    done = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = [pool.submit(generate_one, t) for t in tasks]
        for fut in as_completed(futs):
            key = fut.result()
            done += 1
            if done % 10 == 0 or done == len(tasks):
                print(f"  [{done}/{len(tasks)}] generated {key}")

    if not only:
        media_js = (
            "// Indexed by course slug and catalog lesson number.\n"
            "// Format: [cleanTitle, secMechanism, secResult] for 10-second visual explainers.\n"
            "window.LessonMedia = " + json.dumps(lesson_media_map, ensure_ascii=False, indent=2) + ";\n"
        )
        MEDIA_JS.write_text(media_js, encoding="utf-8")
        print(f"Updated {MEDIA_JS} with {len(lesson_media_map)} entries.")


if __name__ == "__main__":
    main()
