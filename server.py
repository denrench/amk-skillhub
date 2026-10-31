# -*- coding: utf-8 -*-
"""
АМК Практикум — Полнофункциональный сервер аутентификации и базы данных
Алматинский многопрофильный колледж (amk.edu.kz)
Стек: Python 3, Flask, SQLite3, Werkzeug Security
Дизайн-система: Google Stitch (Google Sans, Material Symbols, Dark Canvas, Obsidian UI)
"""

import os
import sqlite3
import random
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(APP_DIR, 'database.db')

# Секретный код для регистрации преподавателей колледжа
TEACHER_SECRET_KEY = "AMK-TEACHER-2026"

app = Flask(__name__, static_folder=APP_DIR)
CORS(app)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# 50 практических заданий колледжа (по 10 на специальность) для предзагрузки в БД
SEED_TASKS = [
    # --- 1. Программное обеспечение (IT) ---
    ("it", 1, "Быстрая сортировка QuickSort для V8", "Hard", "15 мин", "Оптимизация алгоритма QuickSort с выбором медианы из трех для минимизации расхода стека памяти в V8.", "JavaScript, V8 Profiler, Node.js", 100, "both", 1),
    ("it", 2, "Транзакционная блокировка в SQLite (ACID)", "Medium", "12 мин", "Реализация механизма BEGIN IMMEDIATE TRANSACTION для предотвращения взаимоблокировок deadlocks.", "SQL, SQLite3 CLI, WAL mode", 100, "free", None),
    ("it", 3, "JWT Аутентификация с ротацией Refresh Token", "Hard", "20 мин", "Настройка безопасного обновления сессионных токенов через HTTP-Only cookies с проверкой отпечатка.", "Web Crypto API, JWT, Express/Flask", 100, "both", 4),
    ("it", 4, "Защита от XSS и инъекций в DOM-дереве", "Medium", "10 мин", "Экранирование пользовательского ввода через DOMPurify и настройка заголовков CSP.", "DOMPurify, OWASP Top-10, CSP", 100, "free", None),
    ("it", 5, "Индексация B-Tree и оптимизация EXPLAIN QUERY PLAN", "Hard", "15 мин", "Устранение полного сканирования таблицы SCAN TABLE с помощью составных индексов.", "EXPLAIN QUERY PLAN, B-Tree", 100, "both", 8),
    ("it", 6, "Асинхронный пул запросов (Concurrency Limiter)", "Medium", "15 мин", "Создание очереди задач с ограничением 5 одновременных сетевых соединений.", "Promises, Async/Await, Queue", 100, "free", None),
    ("it", 7, "WebSocket двусторонний протокол телеметрии", "Medium", "15 мин", "Сбор телеметрии с датчиков колледжа через WebSocket с авто-переподключением.", "WebSocket RFC 6455, Heartbeat ping", 100, "free", None),
    ("it", 8, "Парсинг JSON-логов и фильтрация Regex", "Easy", "8 мин", "Извлечение критических инцидентов HTTP 5xx из потокового журнала сервера.", "Regex, JSON Stream Parser", 100, "free", None),
    ("it", 9, "Мемоизация тяжелых математических вычислений", "Medium", "12 мин", "Оптимизация рекурсивного расчета чисел Фибоначчи и матриц через LRU-кэш.", "LRU Cache, Hash Map, Big-O", 100, "free", None),
    ("it", 10, "Сборка Docker-контейнера для микросервиса", "Hard", "18 мин", "Многоэтапный Multi-stage билд Dockerfile с минимизацией размера образа до 25 МБ.", "Docker, Alpine Linux, Multi-stage", 100, "free", None),

    # --- 2. Автодиагностика (AUTO) ---
    ("auto", 1, "Диагностика датчика MAF (ДМРВ) сканером OBD-II", "Medium", "12 мин", "Чтение ошибки P0101, анализ потока данных расхода воздуха (2.0-2.5 г/с на холостых).", "OBD-II Launch/Autel, Мультиметр", 100, "both", 1),
    ("auto", 2, "Осциллограмма синхронизации ДПКВ и ДПРВ", "Hard", "18 мин", "Анализ сдвига фаз газораспределения на 2-канальном осциллографе при растяжении цепи ГРМ.", "2-кан. Осциллограф, Спецификации OEM", 100, "both", 4),
    ("auto", 3, "Поиск пропусков зажигания в цилиндре №3", "Medium", "10 мин", "Локализация кода P0303: перекрестная проверка свечи, катушки зажигания и компрессии.", "Мотортестер, Свечной ключ, Эндоскоп", 100, "both", 8),
    ("auto", 4, "Замер давления в топливной рампе бензинового ДВС", "Medium", "12 мин", "Подключение механического манометра к штуцеру рампы (норма 3.8-4.2 бар).", "Топливный манометр, Сброс давления", 100, "free", None),
    ("auto", 5, "Диагностика датчика кислорода (Лямбда-зонд B1S1)", "Hard", "15 мин", "Проверка синусоиды напряжения 0.1-0.9 В и частоты отклика петли обратной связи.", "Осциллограф, Сканер OBD Live Data", 100, "free", None),
    ("auto", 6, "Проверка сопротивления обмотки форсунок MPI", "Easy", "8 мин", "Замер мультиметром сопротивления катушек форсунок (норма 12-16 Ом при 20°C).", "Цифровой мультиметр Fluke", 100, "free", None),
    ("auto", 7, "Диагностика шины данных CAN-bus (High/Low)", "Hard", "15 мин", "Замер сопротивления терминаторов (норма 60 Ом) и формы сигналов CAN-H и CAN-L.", "Осциллограф, Распиновка DLC-16", 100, "free", None),
    ("auto", 8, "Проверка падения напряжения в силовой цепи стартера", "Medium", "10 мин", "Замер падения напряжения на плюсовом кабеле АКБ-стартер под нагрузкой (<0.5 В).", "Мультиметр с пиковым захватом", 100, "free", None),
    ("auto", 9, "Калибровка датчика угла поворота руля SAS", "Medium", "10 мин", "Выставление нулевой точки после регулировки углов установки колес развал-схождение.", "Диагностический стенд, Уровень", 100, "free", None),
    ("auto", 10, "Эндоскопия камеры сгорания и клапанов ДВС", "Hard", "15 мин", "Осмотр хона цилиндра, нагара на впускных клапанах и состояния днища поршня.", "Управляемый поворотный эндоскоп", 100, "free", None),

    # --- 3. Холодильные установки (CRYO) ---
    ("cryo", 1, "Балансировка перегрева терморегулирующего вентиля ТРВ", "Hard", "15 мин", "Настройка перегрева паров на выходе из испарителя R134a в диапазоне 5-7 К.", "Манометрический коллектор, Термопара", 100, "both", 1),
    ("cryo", 2, "Глубокая вакуумация контура до 500 микрон", "Medium", "15 мин", "Удаление влаги и неконденсируемых газов перед заправкой хладагентом R404A.", "Двухступенчатый вакуум-насос, Вакуумметр", 100, "both", 4),
    ("cryo", 3, "Поиск микроутечки электронным течеискателем", "Medium", "12 мин", "Опрессовка сухим азотом 25 бар и обследование паяных стыков контура.", "Течеискатель фреона, Азотный редуктор", 100, "both", 8),
    ("cryo", 4, "Заправка хладагента R404A по электронным весам", "Medium", "10 мин", "Жидкая фаза в ресивер строго по шильдику агрегата с точностью до 5 грамм.", "Электронные весы, Шланги с шаровыми кранами", 100, "free", None),
    ("cryo", 5, "Настройка реле низкого и высокого давления РД", "Hard", "12 мин", "Установка точек отключения компрессора (Cut-out) и дифференциала (Diff).", "Двухблочное реле давления Danfoss KP15", 100, "free", None),
    ("cryo", 6, "Замена антикислотного фильтра-осушителя", "Medium", "15 мин", "Эвакуация фреона, пайка медно-фосфорным припоем в среде азота без окалины.", "Горелка кислород-МАПП, Азот, Зеркало", 100, "free", None),
    ("cryo", 7, "Тепловой расчет холодильного коэффициента COP", "Hard", "15 мин", "Построение цикла на диаграмме p-h (давление-энтальпия) и расчет COP установки.", "Диаграмма Log p-h, Формулы термодинамики", 100, "free", None),
    ("cryo", 8, "Проверка кислотности синтетического масла POE", "Easy", "8 мин", "Химический тест на продукты деструкции обмотки герметичного компрессора.", "Тест-набор масла TotalTest", 100, "free", None),
    ("cryo", 9, "Настройка контроллера оттайки воздухоохладителя", "Medium", "10 мин", "Параметрирование цикла ТЭНов оттайки, задержки вентиляторов (FST) в Eliwell.", "Микропроцессорный контроллер Eliwell/Dixell", 100, "free", None),
    ("cryo", 10, "Балансировка расхода воды в чиллере с фанкойлами", "Hard", "18 мин", "Регулировка статического балансировочного клапана по перепаду давлений дельта P.", "Дифференциальный манометр Testo", 100, "free", None),

    # --- 4. Графический и UI/UX дизайн (DESIGN) ---
    ("design", 1, "Аудит контрастности по стандарту WCAG 2.1 AA", "Easy", "8 мин", "Проверка коэффициента контрастности текста (норма от 4.5:1 для обычного текста).", "Figma Contrast Checker, Color Tool", 100, "both", 1),
    ("design", 2, "Построение адаптивной 12-колоночной сетки", "Medium", "12 мин", "Расчет колонок, межколонников (gutter 24px) и боковых полей для десктопа и планшета.", "Figma Layout Grid, Auto Layout", 100, "both", 4),
    ("design", 3, "Типографическая шкала с модульным шагом 1.25", "Medium", "10 мин", "Формирование иерархии стилей текста (H1, H2, H3, Body, Caption) по Major Third.", "Type Scale Calculator, Google Fonts", 100, "both", 8),
    ("design", 4, "Проектирование интерактивной дизайн-системы", "Hard", "18 мин", "Создание мастер-компонентов кнопок со всеми вариантами состояний (Hover, Active, Focus, Disabled).", "Figma Components, Variants, Boolean Props", 100, "free", None),
    ("design", 5, "Векторная оптимизация SVG-логотипа колледжа", "Easy", "8 мин", "Очистка паразитных кривых Безье, замыкание контуров и компрессия SVG до 4 КБ.", "Adobe Illustrator / Inkscape, SVGOMG", 100, "free", None),
    ("design", 6, "Подготовка полиграфического макета к печати (CMYK)", "Hard", "15 мин", "Конвертация цветового профиля в Coated FOGRA39, выставление вылетов под обрез 3 мм.", "Adobe InDesign, Preflight CMYK 300 DPI", 100, "free", None),
    ("design", 7, "CJM карта пути студента в мобильном портале", "Medium", "15 мин", "Визуализация шагов, эмоциональных триггеров и барьеров при сдаче экзамена.", "Miro / FigJam, UX Research Framework", 100, "free", None),
    ("design", 8, "Микроанимация загрузки и интерактивного отклика", "Medium", "12 мин", "Настройка кривых Безье cubic-bezier(0.16, 1, 0.3, 1) для приятного отклика UI.", "CSS Keyframes, Smart Animate", 100, "free", None),
    ("design", 9, "Юзабилити-тестирование навигационного меню", "Medium", "12 мин", "Анализ древовидной структуры каталога и методика карточной сортировки.", "OptimalSort, Maze, Heatmaps", 100, "free", None),
    ("design", 10, "Создание темной и светлой темы оформления (Dark Mode)", "Hard", "15 мин", "Настройка семантических токенов цвета и проверка читаемости в инверсии.", "Design Tokens, CSS Variables W3C", 100, "free", None),

    # --- 5. ЧПУ Раскрой и мебель (FURNITURE) ---
    ("furniture", 1, "Оптимизация 2D раскроя ЛДСП 2800x2070 с учетом текстуры", "Hard", "15 мин", "Минимизация процента отходов до <8% и учет направления древесной текстуры.", "Базис-Раскрой / Astra S-Nesting", 100, "both", 1),
    ("furniture", 2, "Расчет толщины пропила пильного диска ЧПУ", "Medium", "10 мин", "Компенсация ширины пропила основной пилы (4.4 мм) и подрезного узла.", "Форматно-раскроечный ЧПУ центр", 100, "both", 4),
    ("furniture", 3, "Карта присадки фурнитуры Minifix и шкантов", "Medium", "12 мин", "Схема отверстий диаметром 5, 8 и 15 мм по Системе 32 с торца и пласти плиты.", "Сверлильно-присадочный станок ЧПУ", 100, "both", 8),
    ("furniture", 4, "Подбор толщины кромки ПВХ и припуска на фрезеровку", "Easy", "8 мин", "Расчет чистового габарита детали после наклейки кромки 0.4 мм и 2.0 мм.", "Кромкооблицовочный станок ЧПУ", 100, "free", None),
    ("furniture", 5, "Программирование G-кода для криволинейного фрезерования", "Hard", "18 мин", "Написание управляющей программы с круговой интерполяцией G02/G03 и врезанием.", "G-code, CAM-система, ЧПУ фрезер", 100, "free", None),
    ("furniture", 6, "Расчет полезной нагрузки на полки шкафа (Sagulator)", "Medium", "10 мин", "Оценка прогиба полки длиной 900 мм из ЛДСП 16 мм при распределенной нагрузке 30 кг.", "Sagulator, Калькулятор сопротивления материалов", 100, "free", None),
    ("furniture", 7, "Балансировка выдвижных систем Tandembox", "Medium", "12 мин", "Монтаж направляющих скрытого монтажа с доводчиком Blumotion и регулировка зазоров.", "Монтажный шаблон Blum, Динамометр", 100, "free", None),
    ("furniture", 8, "Настройка пылеудаления аспирации ЧПУ станка", "Easy", "8 мин", "Проверка скорости воздушного потока в воздуховоде (норма 28-32 м/с) для отвода стружки.", "Анемометр, Аспирационная установка", 100, "free", None),
    ("furniture", 9, "Составление производственной сметы и спецификации", "Medium", "12 мин", "Расчет потребности плитных материалов, крепежа, упаковки и себестоимости заказа.", "1С:Мебельное производство / Excel", 100, "free", None),
    ("furniture", 10, "Контроль геометрии диагоналей корпуса мебели", "Easy", "6 мин", "Проверка равенства диагоналей короба при сборке с допуском не более +/- 1 мм.", "Лазерная рулетка, Угольник 90 градусов", 100, "free", None)
]

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Таблица пользователей
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
        group_name TEXT,
        student_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 2. Таблица сводных оценок
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        student_id TEXT NOT NULL,
        specialty_slug TEXT NOT NULL,
        specialty_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        status TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')

    # 3. Таблица каталога 50 практических заданий
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        specialty_slug TEXT NOT NULL,
        task_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        time_limit TEXT,
        description TEXT,
        tools_required TEXT,
        max_score INTEGER DEFAULT 100,
        mode TEXT DEFAULT 'both',
        ticket_number INTEGER,
        UNIQUE(specialty_slug, task_number)
    )
    ''')

    # 4. Таблица детальных отправок заданий студентами (журнал сдачи работ)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS task_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        group_name TEXT NOT NULL,
        task_id INTEGER,
        specialty_slug TEXT NOT NULL,
        task_title TEXT NOT NULL,
        score INTEGER NOT NULL,
        grade_letter TEXT NOT NULL,
        status TEXT NOT NULL,
        time_spent_seconds INTEGER DEFAULT 0,
        submitted_code TEXT,
        teacher_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')

    # Проверяем и предзаполняем задания
    cursor.execute('SELECT COUNT(*) FROM tasks')
    if cursor.fetchone()[0] == 0:
        cursor.executemany('''
            INSERT OR IGNORE INTO tasks 
            (specialty_slug, task_number, title, difficulty, time_limit, description, tools_required, max_score, mode, ticket_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', SEED_TASKS)
        conn.commit()

    # Начальные демо-аккаунты
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        seed_users = [
            ("teacher@amk.kz", generate_password_hash("admin123"), "Иванов Сергей Павлович", "teacher", "Кафедра ТиПО", "TEACHER-AMK-01"),
            ("student@amk.kz", generate_password_hash("student123"), "Асылхан Бауыржанұлы", "student", "ПО-22", "KZ-AMK-2026-98421"),
            ("danil@amk.kz", generate_password_hash("123456"), "Данил Панин", "student", "ПО-22", "KZ-AMK-2026-98422"),
            ("alina@amk.kz", generate_password_hash("123456"), "Алина Сейдалиева", "student", "ПО-22", "KZ-AMK-2026-98423"),
            ("arman@amk.kz", generate_password_hash("123456"), "Арман Исаев", "student", "АВ-21", "KZ-AMK-2026-77101"),
            ("zhanibek@amk.kz", generate_password_hash("123456"), "Жанибек Оразов", "student", "ХО-20", "KZ-AMK-2026-55201")
        ]
        cursor.executemany(
            '''INSERT INTO users (email, password_hash, full_name, role, group_name, student_id)
               VALUES (?, ?, ?, ?, ?, ?)''',
            seed_users
        )

        seed_grades = [
            (2, "KZ-AMK-2026-98421", "it", "Программное обеспечение", 98, "Сдано на отлично"),
            (2, "KZ-AMK-2026-98421", "auto", "Автодиагностика ДВС", 94, "Сдано на отлично"),
            (2, "KZ-AMK-2026-98421", "cryo", "Холодильные установки", 92, "Сдано на отлично"),
            (2, "KZ-AMK-2026-98421", "design", "Графический дизайн", 90, "Сдано на отлично"),
            (2, "KZ-AMK-2026-98421", "furniture", "Раскрой мебели", 88, "Сдано хорошо"),

            (3, "KZ-AMK-2026-98422", "it", "Программное обеспечение", 95, "Сдано на отлично"),
            (3, "KZ-AMK-2026-98422", "auto", "Автодиагностика ДВС", 85, "Сдано хорошо"),
            (4, "KZ-AMK-2026-98423", "it", "Программное обеспечение", 80, "Сдано хорошо"),
            (5, "KZ-AMK-2026-77101", "auto", "Автодиагностика ДВС", 96, "Сдано на отлично")
        ]
        cursor.executemany(
            '''INSERT INTO grades (user_id, student_id, specialty_slug, specialty_name, score, status)
               VALUES (?, ?, ?, ?, ?, ?)''',
            seed_grades
        )

        # Начальные отправки в журнал для наглядности
        seed_submissions = [
            (2, "KZ-AMK-2026-98421", "Асылхан Бауыржанұлы", "ПО-22", 1, "it", "Быстрая сортировка QuickSort для V8", 100, "A", "Зачтено", 340, "function quickSort(arr){...}", "Отличная реализация выбора медианы."),
            (2, "KZ-AMK-2026-98421", "Асылхан Бауыржанұлы", "ПО-22", 2, "auto", "Осциллограмма синхронизации ДПКВ и ДПРВ", 95, "A-", "Зачтено", 480, "OBD-II Code: P0101 Checked", "Параметры укладываются в допуск OEM."),
            (3, "KZ-AMK-2026-98422", "Данил Панин", "ПО-22", 1, "it", "Быстрая сортировка QuickSort для V8", 90, "B+", "Зачтено", 420, "const sort = (a) => ...", "Обратите внимание на граничные случаи."),
            (5, "KZ-AMK-2026-77101", "Арман Исаев", "АВ-21", 1, "auto", "Диагностика датчика MAF (ДМРВ)", 96, "A", "Зачтено", 290, "V=2.1 g/s; Lambda=1.00", "Точная калибровка датчика.")
        ]
        cursor.executemany('''
            INSERT INTO task_submissions 
            (user_id, student_id, student_name, group_name, task_id, specialty_slug, task_title, score, grade_letter, status, time_spent_seconds, submitted_code, teacher_comment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_submissions)
        conn.commit()

    conn.close()

# ========================================================
# REST API: АУТЕНТИФИКАЦИЯ
# ========================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()
    role = data.get('role', 'student').strip().lower()
    group_name = data.get('group_name', 'ПО-22').strip()
    teacher_key = data.get('teacher_key', '').strip()

    if not email or not password or not full_name:
        return jsonify({"success": False, "message": "Заполните все обязательные поля"}), 400

    if len(password) < 4:
        return jsonify({"success": False, "message": "Пароль должен быть не менее 4 символов"}), 400

    if role == 'teacher':
        if teacher_key != TEACHER_SECRET_KEY:
            return jsonify({
                "success": False,
                "message": f"Неверный секретный код преподавателя! (Подсказка для комиссии: {TEACHER_SECRET_KEY})"
            }), 403
        student_id = f"TEACHER-AMK-{random.randint(10, 99)}"
        group_name = group_name or "Преподавательский состав"
    else:
        role = 'student'
        student_id = f"KZ-AMK-2026-{random.randint(10000, 99999)}"

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"success": False, "message": "Пользователь с таким Email уже зарегистрирован"}), 409

    hashed_pw = generate_password_hash(password)
    try:
        cursor.execute(
            '''INSERT INTO users (email, password_hash, full_name, role, group_name, student_id)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (email, hashed_pw, full_name, role, group_name, student_id)
        )
        user_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Ошибка базы данных: {str(e)}"}), 500

    conn.close()

    return jsonify({
        "success": True,
        "message": "Регистрация успешно пройдена!",
        "user": {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
            "group_name": group_name,
            "student_id": student_id
        }
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({"success": False, "message": "Введите Email и пароль"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({"success": False, "message": "Неверный Email или пароль"}), 401

    return jsonify({
        "success": True,
        "message": f"Добро пожаловать, {user['full_name']}!",
        "user": {
            "id": user['id'],
            "email": user['email'],
            "full_name": user['full_name'],
            "role": user['role'],
            "group_name": user['group_name'],
            "student_id": user['student_id']
        }
    })

@app.route('/api/user/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, email, full_name, role, group_name, student_id, created_at FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"success": False, "message": "Пользователь не найден"}), 404

    cursor.execute('SELECT specialty_slug, specialty_name, score, status, updated_at FROM grades WHERE user_id = ?', (user_id,))
    grades = [dict(r) for r in cursor.fetchall()]

    cursor.execute('''
        SELECT id, specialty_slug, task_title, score, grade_letter, status, created_at, teacher_comment
        FROM task_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
    ''', (user_id,))
    submissions = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "user": dict(user),
        "grades": grades,
        "recent_submissions": submissions
    })

# ========================================================
# REST API: КАТАЛОГ 50 ЗАДАНИЙ И СИМУЛЯТОР
# ========================================================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    specialty = request.args.get('specialty')
    mode = request.args.get('mode')
    ticket = request.args.get('ticket')

    conn = get_db()
    cursor = conn.cursor()

    query = 'SELECT * FROM tasks WHERE 1=1'
    params = []

    if specialty:
        query += ' AND specialty_slug = ?'
        params.append(specialty)

    if mode == 'exam':
        if ticket:
            query += ' AND ticket_number = ?'
            params.append(int(ticket))
        else:
            query += ' AND ticket_number IS NOT NULL'

    query += ' ORDER BY specialty_slug, task_number'
    cursor.execute(query, params)
    tasks = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(tasks),
        "tasks": tasks
    })

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
    task = cursor.fetchone()
    conn.close()

    if not task:
        return jsonify({"success": False, "message": "Задание не найдено"}), 404

    return jsonify({"success": True, "task": dict(task)})

# Отправка решения задания из симулятора
@app.route('/api/tasks/submit', methods=['POST'])
def submit_task():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    student_id = data.get('student_id', 'KZ-AMK-2026-98421')
    specialty_slug = data.get('specialty_slug', 'it')
    task_number = int(data.get('task_number', 1))
    task_title = data.get('task_title', f"Задание #{task_number}")
    score = int(data.get('score', 100))
    time_spent = int(data.get('time_spent_seconds', 0))
    submitted_code = data.get('submitted_code', '')
    student_name = data.get('student_name', 'Студент АМК')
    group_name = data.get('group_name', 'ПО-22')

    if score >= 90:
        grade_letter = "A"
        status = "Сдано на отлично"
    elif score >= 75:
        grade_letter = "B"
        status = "Сдано хорошо"
    elif score >= 60:
        grade_letter = "C"
        status = "Удовлетворительно"
    else:
        grade_letter = "F"
        status = "Требует доработки"

    conn = get_db()
    cursor = conn.cursor()

    # Если user_id указан, уточняем имя и группу
    if user_id:
        cursor.execute('SELECT full_name, group_name, student_id FROM users WHERE id = ?', (user_id,))
        u = cursor.fetchone()
        if u:
            student_name = u['full_name']
            group_name = u['group_name']
            student_id = u['student_id']
    else:
        cursor.execute('SELECT id, full_name, group_name FROM users WHERE student_id = ?', (student_id,))
        u = cursor.fetchone()
        if u:
            user_id = u['id']
            student_name = u['full_name']
            group_name = u['group_name']
        else:
            user_id = 2  # demo fallback

    # Находим ID задания
    cursor.execute('SELECT id FROM tasks WHERE specialty_slug = ? AND task_number = ?', (specialty_slug, task_number))
    t_row = cursor.fetchone()
    task_id = t_row['id'] if t_row else None

    # Вставляем отправку в историю
    cursor.execute('''
        INSERT INTO task_submissions
        (user_id, student_id, student_name, group_name, task_id, specialty_slug, task_title, score, grade_letter, status, time_spent_seconds, submitted_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, student_id, student_name, group_name, task_id, specialty_slug, task_title, score, grade_letter, status, time_spent, submitted_code))

    submission_id = cursor.lastrowid

    # Обновляем сводную оценку по предмету в таблице grades
    specialty_names = {
        "it": "Программное обеспечение",
        "auto": "Автодиагностика ДВС",
        "cryo": "Холодильные установки",
        "design": "Графический дизайн",
        "furniture": "Раскрой мебели"
    }
    spec_name = specialty_names.get(specialty_slug, specialty_slug)

    cursor.execute('SELECT id FROM grades WHERE user_id = ? AND specialty_slug = ?', (user_id, specialty_slug))
    existing_grade = cursor.fetchone()
    if existing_grade:
        cursor.execute('''
            UPDATE grades SET score = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        ''', (score, status, existing_grade['id']))
    else:
        cursor.execute('''
            INSERT INTO grades (user_id, student_id, specialty_slug, specialty_name, score, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, student_id, specialty_slug, spec_name, score, status))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "submission_id": submission_id,
        "score": score,
        "grade_letter": grade_letter,
        "status": status,
        "message": f"Работа успешно отправлена и зафиксирована в журнале преподавателя! Оценка: {score}/100 ({grade_letter})"
    })

# ========================================================
# REST API: КАБИНЕТ ПРЕПОДАВАТЕЛЯ И ЖУРНАЛ
# ========================================================

@app.route('/api/teacher/journal', methods=['GET'])
def get_teacher_journal():
    group_filter = request.args.get('group', 'all')
    search_term = request.args.get('q', '').strip().lower()

    conn = get_db()
    cursor = conn.cursor()

    query = '''
    SELECT 
        u.id as user_id,
        u.student_id,
        u.full_name,
        u.full_name as name,
        u.group_name,
        u.email,
        ROUND(AVG(g.score), 1) as avg_score,
        COUNT(g.id) as tests_passed
    FROM users u
    LEFT JOIN grades g ON u.id = g.user_id
    WHERE u.role = 'student'
    '''
    params = []

    if group_filter != 'all':
        query += ' AND u.group_name = ?'
        params.append(group_filter)

    if search_term:
        query += ' AND (LOWER(u.full_name) LIKE ? OR LOWER(u.student_id) LIKE ?)'
        params.extend([f'%{search_term}%', f'%{search_term}%'])

    query += ' GROUP BY u.id ORDER BY avg_score DESC'

    cursor.execute(query, params)
    students = [dict(r) for r in cursor.fetchall()]

    for s in students:
        cursor.execute(
            'SELECT specialty_slug, score, status FROM grades WHERE user_id = ?',
            (s['user_id'],)
        )
        s['grades'] = [dict(g) for g in cursor.fetchall()]
        s['avg_score'] = s['avg_score'] or 0

    conn.close()

    return jsonify({
        "success": True,
        "total_students": len(students),
        "students": students
    })

# Список детальных отправок работ для проверки преподавателем
@app.route('/api/teacher/submissions', methods=['GET'])
def get_teacher_submissions():
    group = request.args.get('group')
    specialty = request.args.get('specialty')
    limit = int(request.args.get('limit', 50))

    conn = get_db()
    cursor = conn.cursor()

    query = 'SELECT * FROM task_submissions WHERE 1=1'
    params = []

    if group and group != 'all':
        query += ' AND group_name = ?'
        params.append(group)

    if specialty and specialty != 'all':
        query += ' AND specialty_slug = ?'
        params.append(specialty)

    query += ' ORDER BY created_at DESC LIMIT ?'
    params.append(limit)

    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(rows),
        "submissions": rows
    })

# Выставление или корректировка оценки преподавателем
@app.route('/api/teacher/grade_submission', methods=['POST'])
def grade_submission():
    data = request.get_json() or {}
    submission_id = data.get('submission_id')
    score = int(data.get('score', 0))
    comment = data.get('teacher_comment', '').strip()

    if not submission_id:
        return jsonify({"success": False, "message": "Не указан ID работы"}), 400

    grade_letter = "A" if score >= 90 else ("B" if score >= 75 else ("C" if score >= 60 else "F"))
    status = "Зачтено" if score >= 60 else "На доработку"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE task_submissions 
        SET score = ?, grade_letter = ?, status = ?, teacher_comment = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (score, grade_letter, status, comment, submission_id))

    cursor.execute('SELECT user_id, specialty_slug FROM task_submissions WHERE id = ?', (submission_id,))
    sub = cursor.fetchone()
    if sub:
        cursor.execute('''
            UPDATE grades SET score = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND specialty_slug = ?
        ''', (score, f"Сдано ({status})", sub['user_id'], sub['specialty_slug']))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Оценка {score} баллов ({grade_letter}) и комментарий успешно сохранены!",
        "score": score,
        "grade_letter": grade_letter
    })

# Общая сводная аналитика для дашборда преподавателя
@app.route('/api/teacher/stats', methods=['GET'])
def get_teacher_stats():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'student'")
    total_students = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM task_submissions")
    total_submissions = cursor.fetchone()[0]

    cursor.execute("SELECT ROUND(AVG(score), 1) FROM grades")
    avg_score = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(DISTINCT user_id) FROM grades WHERE score >= 90")
    excellent_students = cursor.fetchone()[0]

    cursor.execute('''
        SELECT group_name, ROUND(AVG(score), 1) as avg_score, COUNT(DISTINCT user_id) as student_count
        FROM users u
        JOIN grades g ON u.id = g.user_id
        WHERE u.role = 'student'
        GROUP BY group_name
        ORDER BY avg_score DESC
    ''')
    group_stats = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return jsonify({
        "success": True,
        "total_students": total_students,
        "total_submissions": total_submissions,
        "average_score": avg_score,
        "excellent_students": excellent_students,
        "groups": group_stats
    })

# Сохранение результата из простого режима тренажера
@app.route('/api/grades/save', methods=['POST'])
def save_grade():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    student_id = data.get('student_id', 'KZ-AMK-2026-98421')
    specialty_slug = data.get('specialty_slug')
    specialty_name = data.get('specialty_name', specialty_slug)
    score = int(data.get('score', 0))

    if not specialty_slug:
        return jsonify({"success": False, "message": "Не указан тренажер"}), 400

    status = "Сдано на отлично" if score >= 90 else ("Сдано хорошо" if score >= 75 else "Требует доработки")

    conn = get_db()
    cursor = conn.cursor()

    if not user_id:
        cursor.execute('SELECT id FROM users WHERE student_id = ?', (student_id,))
        row = cursor.fetchone()
        user_id = row['id'] if row else 2

    cursor.execute(
        'SELECT id FROM grades WHERE user_id = ? AND specialty_slug = ?',
        (user_id, specialty_slug)
    )
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            '''UPDATE grades 
               SET score = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE id = ?''',
            (score, status, existing['id'])
        )
    else:
        cursor.execute(
            '''INSERT INTO grades (user_id, student_id, specialty_slug, specialty_name, score, status)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (user_id, student_id, specialty_slug, specialty_name, score, status)
        )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Оценка {score} баллов записана в базу данных студента ID {user_id}",
        "score": score,
        "status": status
    })

# 6. Проверка здоровья API
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "platform": "АМК Практикум (Google Stitch Edition)",
        "design_system": "Google Sans + Material Symbols",
        "auth_engine": "Werkzeug Security OK",
        "database": "SQLite3 (50 tasks catalog loaded)",
        "tasks_total": 50,
        "teacher_code": TEACHER_SECRET_KEY,
        "timestamp": datetime.now().isoformat()
    })

# ========================================================
# СТАТИЧЕСКИЕ СТРАНИЦЫ
# ========================================================
@app.route('/')
def index():
    return send_from_directory(APP_DIR, 'index.html')

@app.route('/auth')
@app.route('/auth.html')
def auth_page():
    return send_from_directory(APP_DIR, 'auth.html')

@app.route('/simulator')
@app.route('/simulator.html')
def simulator_page():
    return send_from_directory(APP_DIR, 'simulator.html')

@app.route('/teacher')
@app.route('/teacher.html')
def teacher_page():
    return send_from_directory(APP_DIR, 'teacher.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(APP_DIR, path)

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print("=" * 65)
    print("🚀 СЕРВЕР «АМК ПРАКТИКУМ» ЗАПУЩЕН! (Google Stitch Edition)")
    print(f"🌐 Главная страница:        http://127.0.0.1:{port}/")
    print(f"🔑 Страница входа/рег.:     http://127.0.0.1:{port}/auth.html")
    print(f"💻 Интерактивные тренажеры: http://127.0.0.1:{port}/simulator.html")
    print(f"👨‍🏫 Журнал преподавателя:   http://127.0.0.1:{port}/teacher.html")
    print(f"🗄️ База данных:            {DB_PATH} (SQLite3 - 50 заданий)")
    print(f"🔐 Код регистрации препода: {TEACHER_SECRET_KEY}")
    print("=" * 65)
    app.run(host='0.0.0.0', port=port, debug=False)
