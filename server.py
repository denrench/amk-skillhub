# -*- coding: utf-8 -*-
"""
EDU SPACE — Production LMS Backend Server
Алматинский многопрофильный колледж (АМК)
Python 3 + Flask + SQLite3
"""

import os
import re
import time
import json
import random
import sqlite3
import hashlib
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory, g

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = BASE_DIR
DB_PATH = os.path.join(BASE_DIR, "database.db")

app = Flask(__name__, static_folder=APP_DIR)
app.config['SECRET_KEY'] = 'amk-eduspace-lms-secret-2026'

def normalize_teacher_code(code_str):
    if not code_str:
        return ""
    tr = str.maketrans({
        'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H',
        'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X',
        'а': 'A', 'в': 'B', 'е': 'E', 'к': 'K', 'м': 'M', 'н': 'H',
        'о': 'O', 'р': 'P', 'с': 'C', 'т': 'T', 'х': 'X',
    })
    return re.sub(r'[\s\-_]', '', str(code_str)).translate(tr).upper()

TEACHER_ACCESS_CODES = {
    'AMK2026', 'TEACHER2026', 'EDU2026', 'AMK', 'TEACHER', 'EDU', '2026',
    'AMKCOLLEGE', 'AMKEDUSPACE', 'ПРЕПОДАВАТЕЛЬ', 'ПРЕПОД'
}

NAME_WORD_RE = re.compile(r'^[А-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһA-Za-z\-]{2,40}$')
EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,12}$')

COURSES_META = [
    {
        "slug": "it",
        "code": "06130100",
        "title": "Программное обеспечение (Web Design)",
        "short_title": "Программное обеспечение (Web Design)",
        "curator": "Власов Михаил Григорьевич",
        "skills": [
            {"key": "ps_ai", "name": "Photoshop & Illustrator для веба (баннеры, SVG-иконки)", "tasks": [1, 2]},
            {"key": "figma_ui", "name": "Figma: Сетки 8px, Auto Layout, Компоненты и Прототипы", "tasks": [3, 4, 5]},
            {"key": "html_css", "name": "Основы верстки: теги HTML, стили CSS и Flexbox", "tasks": [6, 7, 8]},
            {"key": "basic_js", "name": "Простой интерактив (клик JS) и дипломная карточка", "tasks": [9, 10]}
        ]
    },
    {
        "slug": "graphic_design",
        "code": "02130100",
        "title": "Графический Дизайн",
        "short_title": "Графический Дизайн",
        "curator": "Сейдахметова Алия Кайратовна",
        "skills": [
            {"key": "composition", "name": "Композиция, колористика RGB/CMYK и типографика", "tasks": [1, 2, 3]},
            {"key": "branding", "name": "Векторная графика, логотипы и разработка Brandbook", "tasks": [4, 5, 7]},
            {"key": "prepress", "name": "Вёрстка InDesign, упаковка и допечатная подготовка Prepress", "tasks": [6, 8, 9, 10]}
        ]
    },
    {
        "slug": "autoelectric",
        "code": "07161301",
        "title": "Автоэлектрики",
        "short_title": "Автоэлектрики",
        "curator": "Жумабаев Руслан Маратович",
        "skills": [
            {"key": "power_net", "name": "Бортовая сеть 12/24В, АКБ, стартеры и генераторы", "tasks": [1, 2, 3, 4]},
            {"key": "wiring_obd", "name": "Электросхемы DIN 72552 и диагностика ЭБУ OBD-II", "tasks": [5, 6, 9]},
            {"key": "can_osc", "name": "Осциллография датчиков и мультиплексные шины CAN/LIN", "tasks": [7, 8, 10]}
        ]
    },
    {
        "slug": "hvac",
        "code": "07130700",
        "title": "Ремонт Холодильного Оборудования",
        "short_title": "Ремонт Холодильного Оборудования",
        "curator": "Ахметов Тимур Болатович",
        "skills": [
            {"key": "thermo", "name": "Термодинамика цикла, фреоны, перегрев и переохлаждение", "tasks": [1, 2, 3, 4]},
            {"key": "brazing", "name": "Пайка меди, опрессовка азотом, вакуумирование и заправка", "tasks": [6, 7, 8]},
            {"key": "electro_cold", "name": "Диагностика компрессоров, No Frost и контроллеров Eliwell", "tasks": [5, 9, 10]}
        ]
    },
    {
        "slug": "automechanic",
        "code": "07161300",
        "title": "Автомеханики",
        "short_title": "Автомеханики",
        "curator": "Садыков Ерлан Касымович",
        "skills": [
            {"key": "engine", "name": "Дефектовка и ремонт ДВС, ГРМ, смазки и охлаждения", "tasks": [1, 2, 3, 4]},
            {"key": "chassis", "name": "Трансмиссия, подвеска и 3D развал-схождение колёс", "tasks": [5, 6, 7]},
            {"key": "brakes_to", "name": "Тормозные системы, шиномонтаж и регламентное ТО", "tasks": [8, 9, 10]}
        ]
    }
]

COURSES_BY_SLUG = {c["slug"]: c for c in COURSES_META}


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def _safe_add_column(cursor, table, col_def):
    col_name = col_def.split()[0]
    cursor.execute(f"PRAGMA table_info({table})")
    existing = {row[1] for row in cursor.fetchall()}
    if col_name not in existing:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")


def _load_catalog_lessons():
    catalog_path = os.path.join(BASE_DIR, "js", "courses-catalog.js")
    if not os.path.exists(catalog_path):
        return {}
    try:
        with open(catalog_path, "r", encoding="utf-8") as f:
            raw = f.read()
        marker = "window.EDU_LESSONS = "
        idx = raw.find(marker)
        if idx == -1:
            return {}
        json_str = raw[idx + len(marker):].strip()
        if json_str.endswith(";"):
            json_str = json_str[:-1]
        return json.loads(json_str)
    except Exception:
        return {}


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        last_name TEXT DEFAULT '',
        first_name TEXT DEFAULT '',
        middle_name TEXT DEFAULT '',
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
        group_name TEXT DEFAULT 'ИС-21',
        specialty_slug TEXT DEFAULT 'it',
        department TEXT DEFAULT '',
        student_id TEXT UNIQUE,
        email_verified INTEGER DEFAULT 0,
        is_demo INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    for col_def in [
        "last_name TEXT DEFAULT ''",
        "first_name TEXT DEFAULT ''",
        "middle_name TEXT DEFAULT ''",
        "specialty_slug TEXT DEFAULT 'it'",
        "department TEXT DEFAULT ''",
        "email_verified INTEGER DEFAULT 0",
        "is_demo INTEGER DEFAULT 0"
    ]:
        _safe_add_column(cursor, "users", col_def)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS email_verifications (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        verified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        specialty_slug TEXT NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, specialty_slug),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lesson_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        specialty_slug TEXT NOT NULL,
        task_number INTEGER NOT NULL,
        status TEXT DEFAULT 'in_progress',
        quiz_score INTEGER DEFAULT 0,
        quiz_total INTEGER DEFAULT 3,
        draft_code TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, specialty_slug, task_number),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    cursor.execute("""
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
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        specialty_slug TEXT NOT NULL,
        task_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        time_limit TEXT NOT NULL,
        unlock_day INTEGER NOT NULL DEFAULT 1,
        unlock_date_text TEXT NOT NULL,
        deadline_text TEXT NOT NULL,
        description TEXT NOT NULL,
        tools_required TEXT NOT NULL,
        starter_code TEXT NOT NULL,
        max_score INTEGER DEFAULT 100,
        mode TEXT DEFAULT 'both',
        ticket_number INTEGER,
        UNIQUE(specialty_slug, task_number)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS task_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        group_name TEXT NOT NULL,
        task_id INTEGER NOT NULL,
        specialty_slug TEXT NOT NULL,
        task_number INTEGER NOT NULL,
        task_title TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        grade_letter TEXT NOT NULL DEFAULT '—',
        status TEXT NOT NULL DEFAULT 'submitted',
        time_spent_seconds INTEGER DEFAULT 0,
        submitted_code TEXT,
        repo_url TEXT DEFAULT '',
        student_comment TEXT DEFAULT '',
        autotest_passed INTEGER DEFAULT 0,
        autotest_total INTEGER DEFAULT 0,
        quiz_score INTEGER DEFAULT 0,
        teacher_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id)
    );
    """)

    for col_def in [
        "repo_url TEXT DEFAULT ''",
        "student_comment TEXT DEFAULT ''",
        "autotest_passed INTEGER DEFAULT 0",
        "autotest_total INTEGER DEFAULT 0",
        "quiz_score INTEGER DEFAULT 0",
        "teacher_comment TEXT"
    ]:
        _safe_add_column(cursor, "task_submissions", col_def)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        target_role TEXT DEFAULT 'student',
        target_group TEXT DEFAULT '',
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        sender_name TEXT NOT NULL,
        sender_role TEXT NOT NULL,
        recipient_key TEXT NOT NULL DEFAULT 'general',
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS platform_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)
    cursor.execute("INSERT OR IGNORE INTO platform_settings (key, value) VALUES ('current_study_day', '1');")
    # Clean out obsolete tasks & migrate legacy slugs
    cursor.execute("DELETE FROM tasks WHERE specialty_slug NOT IN ('it', 'graphic_design', 'autoelectric', 'hvac', 'automechanic');")
    cursor.execute("UPDATE users SET specialty_slug = 'graphic_design' WHERE specialty_slug = 'design';")
    cursor.execute("UPDATE users SET specialty_slug = 'hvac' WHERE specialty_slug = 'accounting';")
    cursor.execute("UPDATE users SET specialty_slug = 'autoelectric' WHERE specialty_slug = 'auto';")
    cursor.execute("UPDATE users SET specialty_slug = 'automechanic' WHERE specialty_slug = 'marketing';")
    cursor.execute("UPDATE enrollments SET specialty_slug = 'graphic_design' WHERE specialty_slug = 'design';")
    cursor.execute("UPDATE enrollments SET specialty_slug = 'hvac' WHERE specialty_slug = 'accounting';")
    cursor.execute("UPDATE enrollments SET specialty_slug = 'autoelectric' WHERE specialty_slug = 'auto';")
    cursor.execute("UPDATE enrollments SET specialty_slug = 'automechanic' WHERE specialty_slug = 'marketing';")
    cursor.execute("DELETE FROM enrollments WHERE specialty_slug NOT IN ('it', 'graphic_design', 'autoelectric', 'hvac', 'automechanic');")


    # Seed or sync 50 catalog tasks
    lessons_map = _load_catalog_lessons()
    if lessons_map:
        for slug, items in lessons_map.items():
            for item in items:
                num = int(item["num"])
                unlock_day = num
                unlock_txt = "Доступно в День 1" if num == 1 else f"Откроется в День {num}"
                deadline_txt = f"День {num + 2}, 23:59"
                ticket_num = ((num - 1) % 2) + 1
                cursor.execute("""
                INSERT INTO tasks (
                    specialty_slug, task_number, title, difficulty, time_limit,
                    unlock_day, unlock_date_text, deadline_text, description,
                    tools_required, starter_code, max_score, mode, ticket_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100, 'both', ?)
                ON CONFLICT(specialty_slug, task_number) DO UPDATE SET
                    title = excluded.title,
                    difficulty = excluded.difficulty,
                    time_limit = excluded.time_limit,
                    unlock_day = excluded.unlock_day,
                    description = excluded.description,
                    tools_required = excluded.tools_required,
                    starter_code = excluded.starter_code
                """, (
                    slug, num, item["title"], item["difficulty"], item["time_limit"],
                    unlock_day, unlock_txt, deadline_txt, item["task_prompt"],
                    item["tools"], item["starter_code"], ticket_num
                ))

    # Seed isolated demo accounts
    demo_pwd_student = hashlib.sha256("student123".encode()).hexdigest()
    demo_pwd_teacher = hashlib.sha256("teacher123".encode()).hexdigest()

    demo_accounts = [
        ("student@amk.kz", demo_pwd_student, "Оспанов Адилет Серикович", "Оспанов", "Адилет", "Серикович", "student", "ИС-21", "it", "", "KZ-AMK-2026-10001", 1, 1),
        ("voronov@student.amk.kz", demo_pwd_student, "Воронов Константин Сергеевич", "Воронов", "Константин", "Сергеевич", "student", "ИС-21", "it", "", "KZ-AMK-2026-98421", 1, 1),
        ("teacher@amk.kz", demo_pwd_teacher, "Иванов Сергей Павлович", "Иванов", "Сергей", "Павлович", "teacher", "Кафедра ИТ", "it", "Кафедра информационных технологий", None, 1, 1),
    ]
    for acc in demo_accounts:
        cursor.execute("""
        INSERT INTO users (
            email, password_hash, full_name, last_name, first_name, middle_name,
            role, group_name, specialty_slug, department, student_id, email_verified, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
            is_demo = 1,
            email_verified = 1,
            last_name = CASE WHEN users.last_name = '' THEN excluded.last_name ELSE users.last_name END,
            first_name = CASE WHEN users.first_name = '' THEN excluded.first_name ELSE users.first_name END
        """, acc)

    cursor.execute("SELECT id, specialty_slug FROM users WHERE role = 'student'")
    for row in cursor.fetchall():
        cursor.execute("INSERT OR IGNORE INTO enrollments (user_id, specialty_slug) VALUES (?, ?)", (row[0], row[1] or 'it'))

    conn.commit()
    conn.close()


init_db()


def get_current_day():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT value FROM platform_settings WHERE key = 'current_study_day';")
    row = c.fetchone()
    if row:
        try:
            return max(1, min(10, int(row['value'])))
        except Exception:
            return 1
    return 1


def _capitalize_name_part(part):
    part = part.strip()
    if not part:
        return ""
    return "-".join(seg[:1].upper() + seg[1:].lower() for seg in part.split("-") if seg)


def validate_fio(data):
    last_name = (data.get('last_name') or '').strip()
    first_name = (data.get('first_name') or '').strip()
    middle_name = (data.get('middle_name') or '').strip()
    no_middle = bool(data.get('no_middle_name', False))
    raw_full = (data.get('full_name') or '').strip()

    if not last_name and not first_name and raw_full:
        parts = [p for p in re.split(r'\s+', raw_full) if p]
        if len(parts) >= 2:
            last_name = parts[0]
            first_name = parts[1]
            middle_name = " ".join(parts[2:]) if len(parts) > 2 else ""

    if not last_name or not first_name:
        return None, "Пожалуйста, укажите полные Фамилию и Имя (минимум два слова)."

    if not NAME_WORD_RE.match(last_name):
        return None, "Фамилия должна содержать минимум 2 буквы (только кириллица или латиница, без цифр и спецсимволов)."

    if not NAME_WORD_RE.match(first_name):
        return None, "Имя должно содержать минимум 2 буквы (только кириллица или латиница, без цифр и спецсимволов)."

    if not no_middle and middle_name:
        for mp in middle_name.split():
            if not NAME_WORD_RE.match(mp):
                return None, "Отчество должно содержать только буквы (минимум 2 символа) без цифр."
    elif no_middle:
        middle_name = ""

    last_c = _capitalize_name_part(last_name)
    first_c = _capitalize_name_part(first_name)
    mid_c = " ".join(_capitalize_name_part(m) for m in middle_name.split()) if middle_name else ""
    full_c = " ".join(p for p in [last_c, first_c, mid_c] if p)

    return {
        "last_name": last_c,
        "first_name": first_c,
        "middle_name": mid_c,
        "full_name": full_c
    }, None


def validate_email_addr(email):
    if not email or len(email) > 120 or not EMAIL_RE.match(email):
        return False, "Введите корректный адрес электронной почты (например: name@domain.kz)."
    local_part, domain_part = email.rsplit("@", 1)
    if local_part.startswith(".") or local_part.endswith(".") or ".." in email:
        return False, "Некорректный формат электронной почты."
    if len(domain_part) < 4 or domain_part.startswith("-") or domain_part.endswith("-"):
        return False, "Указан некорректный почтовый домен."
    return True, None


def serialize_user(row):
    d = dict(row)
    d.pop("password_hash", None)
    spec_slug = d.get("specialty_slug") or "it"
    course = COURSES_BY_SLUG.get(spec_slug, COURSES_META[0])
    d["specialty_slug"] = spec_slug
    d["specialty_name"] = f"{course['code']} — {course['short_title']}"
    d["course_title"] = course["title"]
    name_parts = [p for p in (d.get("full_name") or "").split() if p]
    if len(name_parts) >= 2:
        initials = (name_parts[0][0] + name_parts[1][0]).upper()
    elif name_parts:
        initials = name_parts[0][:2].upper()
    else:
        initials = "СТ"
    d["initials"] = initials
    d["email_verified"] = bool(d.get("email_verified", 0))
    d["is_demo"] = bool(d.get("is_demo", 0))
    return d


def compute_dates_for_day(unlock_day):
    base = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
    open_dt = base + timedelta(days=max(0, unlock_day - 1))
    deadline_dt = open_dt + timedelta(days=2)
    months_ru = [
        "", "января", "февраля", "марта", "апреля", "мая", "июня",
        "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ]
    open_str = f"{open_dt.day} {months_ru[open_dt.month]}, 09:00"
    dl_str = f"{deadline_dt.day} {months_ru[deadline_dt.month]}, 23:59"
    return open_str, dl_str


# ==========================================
# AUTH & EMAIL VERIFICATION API
# ==========================================

@app.route('/api/auth/send_code', methods=['POST'])
def send_verification_code():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()

    ok, err = validate_email_addr(email)
    if not ok:
        return jsonify({"success": False, "message": err}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        return jsonify({
            "success": False,
            "message": "Пользователь с таким email уже зарегистрирован. Перейдите на вкладку «Вход»."
        }), 409

    code = f"{random.randint(100000, 999999)}"
    expires_at = int(time.time()) + 600

    cursor.execute("""
    INSERT INTO email_verifications (email, code, expires_at, verified)
    VALUES (?, ?, ?, 0)
    ON CONFLICT(email) DO UPDATE SET
        code = excluded.code,
        expires_at = excluded.expires_at,
        verified = 0,
        created_at = CURRENT_TIMESTAMP
    """, (email, code, expires_at))
    conn.commit()

    return jsonify({
        "success": True,
        "message": f"6-значный код подтверждения отправлен на {email}",
        "expires_in_seconds": 600,
        "mail_preview": {
            "to": email,
            "from": "noreply@eduspace.amk.kz",
            "subject": "Подтверждение электронной почты EDU SPACE",
            "code": code
        }
    })


@app.route('/api/auth/verify_code', methods=['POST'])
def verify_email_code():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    code = (data.get('code') or '').strip()

    if not email or not code:
        return jsonify({"success": False, "message": "Введите email и 6-значный код подтверждения."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT code, expires_at FROM email_verifications WHERE email = ?", (email,))
    row = cursor.fetchone()

    if not row:
        return jsonify({"success": False, "message": "Сначала запросите код подтверждения на почту."}), 400

    if int(time.time()) > int(row["expires_at"]):
        return jsonify({"success": False, "message": "Срок действия кода истёк. Отправьте новый код."}), 400

    if str(row["code"]) != code:
        return jsonify({"success": False, "message": "Неверный код подтверждения. Проверьте письмо и попробуйте снова."}), 400

    cursor.execute("UPDATE email_verifications SET verified = 1 WHERE email = ?", (email,))
    conn.commit()

    return jsonify({
        "success": True,
        "verified": True,
        "message": "Электронная почта успешно подтверждена!"
    })


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    role = (data.get('role') or 'student').strip().lower()
    group_name = (data.get('group_name') or 'ИС-21').strip()
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    department = (data.get('department') or '').strip()
    teacher_code = (data.get('teacher_code') or '').strip().upper()
    verification_code = (data.get('verification_code') or '').strip()

    if role not in ('student', 'teacher'):
        return jsonify({"success": False, "message": "Недопустимая роль пользователя."}), 400

    fio, fio_err = validate_fio(data)
    if fio_err:
        return jsonify({"success": False, "message": fio_err}), 400

    ok_email, email_err = validate_email_addr(email)
    if not ok_email:
        return jsonify({"success": False, "message": email_err}), 400

    if len(password) < 6 or not re.search(r'[A-Za-zА-Яа-яЁё]', password) or not re.search(r'\d', password):
        return jsonify({
            "success": False,
            "message": "Пароль должен содержать минимум 6 символов, включая хотя бы одну букву и одну цифру."
        }), 400

    if role == 'teacher':
        raw_code = (data.get('teacher_code') or '').strip()
        norm_code = normalize_teacher_code(raw_code)
        is_valid_code = (
            not raw_code or
            norm_code in TEACHER_ACCESS_CODES or
            'AMK' in norm_code or
            'TEACHER' in norm_code or
            'ПРЕПОД' in norm_code or
            norm_code.startswith('AMK') or
            norm_code == '2026' or
            '2026' in norm_code
        )
        if not is_valid_code:
            return jsonify({
                "success": False,
                "message": "Неверный служебный код преподавателя. Код кафедры: AMK2026 (можно вводить русскими или латинскими буквами)."
            }), 403
        if not department:
            department = "Кафедра профильных дисциплин АМК"
        group_name = department

    if specialty_slug not in COURSES_BY_SLUG:
        specialty_slug = 'it'

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        return jsonify({"success": False, "message": "Пользователь с таким email уже зарегистрирован."}), 409

    cursor.execute("SELECT code, expires_at, verified FROM email_verifications WHERE email = ?", (email,))
    ver_row = cursor.fetchone()
    if not ver_row:
        return jsonify({
            "success": False,
            "require_verification": True,
            "message": "Пожалуйста, подтвердите адрес электронной почты 6-значным кодом."
        }), 400

    if not ver_row["verified"]:
        if verification_code and str(ver_row["code"]) == verification_code and int(time.time()) <= int(ver_row["expires_at"]):
            cursor.execute("UPDATE email_verifications SET verified = 1 WHERE email = ?", (email,))
        else:
            return jsonify({
                "success": False,
                "require_verification": True,
                "message": "Электронная почта не подтверждена или введён неверный код."
            }), 400

    pwd_hash = hashlib.sha256(password.encode()).hexdigest()
    temp_student_id = f"KZ-AMK-2026-{random.randint(10000, 99999)}" if role == 'student' else None

    try:
        cursor.execute("""
        INSERT INTO users (
            email, password_hash, full_name, last_name, first_name, middle_name,
            role, group_name, specialty_slug, department, student_id, email_verified, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
        """, (
            email, pwd_hash, fio["full_name"], fio["last_name"], fio["first_name"], fio["middle_name"],
            role, group_name, specialty_slug, department, temp_student_id
        ))
        user_id = cursor.lastrowid
        if role == 'student':
            student_id = f"KZ-AMK-2026-{10000 + user_id}"
            cursor.execute("UPDATE users SET student_id = ? WHERE id = ?", (student_id, user_id))
            cursor.execute("INSERT OR IGNORE INTO enrollments (user_id, specialty_slug) VALUES (?, ?)", (user_id, specialty_slug))
            course_obj = COURSES_BY_SLUG[specialty_slug]
            cursor.execute("""
            INSERT INTO notifications (user_id, target_role, title, body, type)
            VALUES (?, 'student', ?, ?, 'success')
            """, (
                user_id,
                f"Добро пожаловать на курс «{course_obj['short_title']}»!",
                f"{fio['first_name']}, ваш аккаунт и почта подтверждены. Вам открыт Урок №1 — изучите конспект, пройдите квиз и отправьте первую работу."
            ))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Пользователь с таким email уже зарегистрирован."}), 409

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_out = serialize_user(cursor.fetchone())

    return jsonify({
        "success": True,
        "message": f"Регистрация успешно завершена! Добро пожаловать, {fio['first_name']}!",
        "user": user_out
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return jsonify({"success": False, "message": "Введите email и пароль."}), 400

    pwd_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? AND password_hash = ?", (email, pwd_hash))
    user = cursor.fetchone()

    if not user:
        return jsonify({"success": False, "message": "Неверный email или пароль. Проверьте раскладку клавиатуры."}), 401

    user_out = serialize_user(user)
    return jsonify({
        "success": True,
        "message": f"Добро пожаловать, {user_out['full_name']}!",
        "user": user_out
    })


# ==========================================
# USER PROFILE, COURSES & DASHBOARD API
# ==========================================

@app.route('/api/courses', methods=['GET'])
def list_courses():
    user_id = request.args.get('user_id', type=int)
    conn = get_db()
    cursor = conn.cursor()

    enrolled = set()
    completed_by_spec = {}
    if user_id:
        cursor.execute("SELECT specialty_slug FROM enrollments WHERE user_id = ?", (user_id,))
        enrolled = {r["specialty_slug"] for r in cursor.fetchall()}
        cursor.execute("""
        SELECT specialty_slug, COUNT(DISTINCT task_number) AS cnt
        FROM task_submissions
        WHERE user_id = ? AND score >= 60
        GROUP BY specialty_slug
        """, (user_id,))
        completed_by_spec = {r["specialty_slug"]: r["cnt"] for r in cursor.fetchall()}

    out = []
    for c in COURSES_META:
        slug = c["slug"]
        done = completed_by_spec.get(slug, 0)
        item = dict(c)
        item["enrolled"] = slug in enrolled
        item["completed_lessons"] = done
        item["total_lessons"] = 10
        item["progress_percent"] = min(100, int(round((done / 10.0) * 100)))
        out.append(item)

    return jsonify({"success": True, "courses": out, "current_study_day": get_current_day()})


@app.route('/api/courses/enroll', methods=['POST'])
def enroll_course():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()

    if not user_id or specialty_slug not in COURSES_BY_SLUG:
        return jsonify({"success": False, "message": "Некорректные параметры записи на курс."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO enrollments (user_id, specialty_slug) VALUES (?, ?)", (user_id, specialty_slug))
    cursor.execute("UPDATE users SET specialty_slug = ? WHERE id = ?", (specialty_slug, user_id))
    conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    return jsonify({
        "success": True,
        "message": f"Вы записаны на курс «{COURSES_BY_SLUG[specialty_slug]['title']}»!",
        "user": serialize_user(row) if row else None
    })


@app.route('/api/user/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        return jsonify({"success": False, "message": "Пользователь не найден"}), 404

    user_dict = serialize_user(user)
    spec_slug = request.args.get('specialty') or user_dict['specialty_slug'] or 'it'
    if spec_slug not in COURSES_BY_SLUG:
        spec_slug = 'it'

    cursor.execute("""
    SELECT id, specialty_slug, task_number, task_title, score, grade_letter, status,
           teacher_comment, autotest_passed, autotest_total, quiz_score, repo_url, created_at, updated_at
    FROM task_submissions
    WHERE user_id = ?
    ORDER BY updated_at DESC, id DESC
    """, (user_id,))
    all_subs = [dict(r) for r in cursor.fetchall()]

    # Latest submission per (specialty_slug, task_number)
    latest_by_task = {}
    for s in all_subs:
        key = (s["specialty_slug"], s["task_number"])
        if key not in latest_by_task:
            latest_by_task[key] = s

    spec_subs = [v for (sp, _), v in latest_by_task.items() if sp == spec_slug]
    passed_nums = {v["task_number"] for v in spec_subs if v["score"] >= 60}
    scores = [v["score"] for v in spec_subs if v["score"] > 0]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    gpa_4 = round((avg_score / 100.0) * 4.0, 2) if scores else 0.0
    xp_total = sum(v["score"] * 3 for v in latest_by_task.values() if v["score"] >= 60)
    level = 1 + (xp_total // 500)

    course_meta = COURSES_BY_SLUG[spec_slug]
    current_day = get_current_day()
    skills_out = []
    for sk in course_meta["skills"]:
        t_list = sk["tasks"]
        done_cnt = sum(1 for tn in t_list if tn in passed_nums)
        pct = int(round((done_cnt / len(t_list)) * 100)) if t_list else 0
        min_unlock = min(t_list) if t_list else 1
        skills_out.append({
            "key": sk["key"],
            "name": sk["name"],
            "tasks": t_list,
            "completed": done_cnt,
            "total": len(t_list),
            "percent": pct,
            "unlocked": current_day >= min_unlock,
            "unlock_day": min_unlock
        })

    cursor.execute("SELECT specialty_slug FROM enrollments WHERE user_id = ?", (user_id,))
    enrolled_slugs = [r["specialty_slug"] for r in cursor.fetchall()]

    return jsonify({
        "success": True,
        "profile": user_dict,
        "active_course": course_meta,
        "enrolled_courses": enrolled_slugs,
        "current_study_day": current_day,
        "statistics": {
            "total_submitted": len(spec_subs),
            "passed_count": len(passed_nums),
            "progress_percent": min(100, int(round((len(passed_nums) / 10.0) * 100))),
            "avg_score": avg_score,
            "gpa": gpa_4,
            "xp": xp_total,
            "level": level
        },
        "skills": skills_out,
        "submissions": list(latest_by_task.values())
    })


@app.route('/api/user/profile', methods=['PUT'])
def update_profile():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Не указан ID пользователя."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        return jsonify({"success": False, "message": "Пользователь не найден."}), 404

    fio, fio_err = validate_fio(data)
    if fio_err:
        return jsonify({"success": False, "message": fio_err}), 400

    group_name = (data.get('group_name') or user['group_name'] or 'ИС-21').strip()
    specialty_slug = (data.get('specialty_slug') or user['specialty_slug'] or 'it').strip().lower()
    if specialty_slug not in COURSES_BY_SLUG:
        specialty_slug = user['specialty_slug'] or 'it'

    new_password = (data.get('new_password') or '').strip()
    if new_password:
        if len(new_password) < 6 or not re.search(r'[A-Za-zА-Яа-яЁё]', new_password) or not re.search(r'\d', new_password):
            return jsonify({"success": False, "message": "Новый пароль должен быть не короче 6 символов и содержать буквы и цифры."}), 400
        pwd_hash = hashlib.sha256(new_password.encode()).hexdigest()
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (pwd_hash, user_id))

    cursor.execute("""
    UPDATE users
    SET full_name = ?, last_name = ?, first_name = ?, middle_name = ?, group_name = ?, specialty_slug = ?
    WHERE id = ?
    """, (fio["full_name"], fio["last_name"], fio["first_name"], fio["middle_name"], group_name, specialty_slug, user_id))
    cursor.execute("INSERT OR IGNORE INTO enrollments (user_id, specialty_slug) VALUES (?, ?)", (user_id, specialty_slug))
    conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    return jsonify({
        "success": True,
        "message": "Профиль успешно сохранён!",
        "user": serialize_user(cursor.fetchone())
    })


# ==========================================
# TASKS & GRADUAL DRIP-FEED SCHEDULE API
# ==========================================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    specialty = request.args.get('specialty')
    mode = request.args.get('mode')
    ticket = request.args.get('ticket')
    user_id = request.args.get('user_id', type=int)

    current_day = get_current_day()
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
    raw_tasks = [dict(r) for r in cursor.fetchall()]

    user_subs = {}
    user_prog = {}
    if user_id:
        cursor.execute("""
        SELECT task_number, specialty_slug, score, status, grade_letter, teacher_comment,
               submitted_code, repo_url, autotest_passed, autotest_total, quiz_score, updated_at
        FROM task_submissions
        WHERE user_id = ?
        ORDER BY updated_at ASC, id ASC
        """, (user_id,))
        for sub in cursor.fetchall():
            user_subs[(sub['specialty_slug'], sub['task_number'])] = dict(sub)

        cursor.execute("""
        SELECT specialty_slug, task_number, status, quiz_score, quiz_total, draft_code
        FROM lesson_progress
        WHERE user_id = ?
        """, (user_id,))
        for pr in cursor.fetchall():
            user_prog[(pr['specialty_slug'], pr['task_number'])] = dict(pr)

    tasks_out = []
    for t in raw_tasks:
        unlock_day = int(t.get('unlock_day') or t.get('task_number') or 1)
        is_locked = (unlock_day > current_day)
        key = (t['specialty_slug'], t['task_number'])
        sub_info = user_subs.get(key)
        prog_info = user_prog.get(key)
        open_str, dl_str = compute_dates_for_day(unlock_day)

        if is_locked:
            status_code = 'locked'
            status_label = 'Заблокировано'
            score = 0
            grade_letter = '—'
        elif sub_info:
            raw_st = (sub_info.get('status') or '').lower()
            score = sub_info['score']
            grade_letter = sub_info['grade_letter']
            if 'на проверке' in raw_st or raw_st == 'submitted':
                status_code = 'submitted'
                status_label = 'Отправлено на проверку'
            elif 'доработ' in raw_st or score < 60:
                status_code = 'revision'
                status_label = 'На доработке'
            else:
                status_code = 'graded'
                status_label = sub_info['status']
        elif prog_info:
            status_code = 'in_progress'
            status_label = 'В процессе'
            score = 0
            grade_letter = '—'
        else:
            status_code = 'available'
            status_label = 'Доступно'
            score = 0
            grade_letter = '—'

        t_data = dict(t)
        t_data['current_study_day'] = current_day
        t_data['is_locked'] = is_locked
        t_data['status_code'] = status_code
        t_data['status'] = status_label if status_code != 'available' and status_code != 'locked' else status_code
        t_data['status_label'] = status_label
        t_data['student_score'] = score
        t_data['grade_letter'] = grade_letter
        t_data['unlock_date_exact'] = open_str
        t_data['deadline_exact'] = dl_str
        t_data['teacher_comment'] = sub_info.get('teacher_comment') if sub_info else None
        t_data['quiz_score'] = (sub_info.get('quiz_score') if sub_info else None) or (prog_info.get('quiz_score') if prog_info else 0)
        t_data['draft_code'] = prog_info.get('draft_code') if prog_info else None
        tasks_out.append(t_data)

    return jsonify({
        "success": True,
        "current_study_day": current_day,
        "count": len(tasks_out),
        "tasks": tasks_out
    })


@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    current_day = get_current_day()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
    task = cursor.fetchone()

    if not task:
        return jsonify({"success": False, "message": "Задание не найдено"}), 404

    task_dict = dict(task)
    unlock_day = int(task_dict.get('unlock_day', 1))

    if unlock_day > current_day:
        return jsonify({
            "success": False,
            "error": "Задание заблокировано согласно графику обучения",
            "is_locked": True,
            "unlock_day": unlock_day,
            "current_study_day": current_day,
            "unlock_date_text": task_dict.get('unlock_date_text', f'День {unlock_day}')
        }), 403

    task_dict['is_locked'] = False
    task_dict['status'] = 'available'
    return jsonify({"success": True, "task": task_dict})


@app.route('/api/tasks/progress', methods=['POST'])
def save_lesson_progress():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    task_number = int(data.get('task_number') or 1)
    quiz_score = data.get('quiz_score')
    draft_code = data.get('draft_code')

    if not user_id:
        return jsonify({"success": False, "message": "Требуется авторизация."}), 401

    current_day = get_current_day()
    if task_number > current_day:
        return jsonify({
            "success": False,
            "is_locked": True,
            "error": f"Урок №{task_number} заблокирован до Дня {task_number}."
        }), 403

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT quiz_score, draft_code FROM lesson_progress
    WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
    """, (user_id, specialty_slug, task_number))
    existing = cursor.fetchone()

    q_val = int(quiz_score) if quiz_score is not None else (existing['quiz_score'] if existing else 0)
    d_val = draft_code if draft_code is not None else (existing['draft_code'] if existing else '')

    cursor.execute("""
    INSERT INTO lesson_progress (user_id, specialty_slug, task_number, status, quiz_score, quiz_total, draft_code, updated_at)
    VALUES (?, ?, ?, 'in_progress', ?, 3, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, specialty_slug, task_number) DO UPDATE SET
        status = 'in_progress',
        quiz_score = excluded.quiz_score,
        draft_code = excluded.draft_code,
        updated_at = CURRENT_TIMESTAMP
    """, (user_id, specialty_slug, task_number, q_val, d_val))
    conn.commit()

    return jsonify({"success": True, "message": "Прогресс урока сохранён.", "quiz_score": q_val})


@app.route('/api/tasks/submit', methods=['POST'])
def submit_task():
    data = request.get_json() or {}
    user_id = int(data.get('user_id') or 1)
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    task_number = int(data.get('task_number') or 1)
    task_title = data.get('task_title') or f"Задание №{task_number}"
    score = max(0, min(100, int(data.get('score', 100))))
    time_spent = int(data.get('time_spent_seconds') or 0)
    submitted_code = data.get('submitted_code') or ''
    repo_url = (data.get('repo_url') or '').strip()
    student_comment = (data.get('student_comment') or '').strip()
    autotest_passed = int(data.get('autotest_passed') or 0)
    autotest_total = int(data.get('autotest_total') or 0)
    quiz_score = int(data.get('quiz_score') or 0)
    await_teacher = bool(data.get('await_teacher', False))

    current_day = get_current_day()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT id, title, unlock_day, unlock_date_text FROM tasks WHERE specialty_slug = ? AND task_number = ?', (specialty_slug, task_number))
    task = cursor.fetchone()

    if task:
        task_id = task['id']
        task_title = task['title']
        unlock_day = int(task['unlock_day'])
        if unlock_day > current_day:
            return jsonify({
                "success": False,
                "error": f"Нельзя отправить заблокированное задание! Оно откроется по расписанию: {task['unlock_date_text']} (День {unlock_day}).",
                "is_locked": True
            }), 403
    else:
        if task_number > current_day:
            return jsonify({"success": False, "error": "Задание заблокировано по графику.", "is_locked": True}), 403
        task_id = task_number

    cursor.execute("SELECT full_name, group_name, student_id FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    student_name = u_row['full_name'] if u_row else (data.get('student_name') or 'Студент')
    group_name = u_row['group_name'] if u_row and u_row['group_name'] else (data.get('group_name') or 'ИС-21')
    student_id = u_row['student_id'] if u_row and u_row['student_id'] else (data.get('student_id') or f'KZ-AMK-2026-{10000 + user_id}')

    if await_teacher:
        grade_letter = "—"
        status = "Отправлено на проверку"
    elif score >= 90:
        grade_letter = "A"
        status = "Проверено (Отлично)"
    elif score >= 75:
        grade_letter = "B"
        status = "Проверено (Хорошо)"
    elif score >= 60:
        grade_letter = "C"
        status = "Проверено (Зачтено)"
    else:
        grade_letter = "F"
        status = "На доработке"

    cursor.execute("""
    SELECT id FROM task_submissions
    WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
    """, (user_id, specialty_slug, task_number))
    existing_sub = cursor.fetchone()

    if existing_sub:
        sub_id = existing_sub['id']
        cursor.execute("""
        UPDATE task_submissions
        SET student_name = ?, group_name = ?, task_title = ?, score = ?, grade_letter = ?,
            status = ?, time_spent_seconds = ?, submitted_code = ?, repo_url = ?,
            student_comment = ?, autotest_passed = ?, autotest_total = ?, quiz_score = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """, (
            student_name, group_name, task_title, score, grade_letter,
            status, time_spent, submitted_code, repo_url,
            student_comment, autotest_passed, autotest_total, quiz_score, sub_id
        ))
    else:
        cursor.execute("""
        INSERT INTO task_submissions (
            user_id, student_id, student_name, group_name, task_id, specialty_slug,
            task_number, task_title, score, grade_letter, status, time_spent_seconds,
            submitted_code, repo_url, student_comment, autotest_passed, autotest_total, quiz_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, student_id, student_name, group_name, task_id, specialty_slug,
            task_number, task_title, score, grade_letter, status, time_spent,
            submitted_code, repo_url, student_comment, autotest_passed, autotest_total, quiz_score
        ))
        sub_id = cursor.lastrowid

    course_meta = COURSES_BY_SLUG.get(specialty_slug, COURSES_META[0])
    cursor.execute("""
    INSERT INTO grades (user_id, student_id, specialty_slug, specialty_name, score, status)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, student_id, specialty_slug, course_meta['short_title'], score, status))

    conn.commit()

    return jsonify({
        "success": True,
        "message": (
            f"Работа отправлена преподавателю на проверку (автотесты: {score}/100)!"
            if await_teacher else
            f"Работа проверена! Результат: {score}/100 баллов (оценка {grade_letter})."
        ),
        "result": {
            "score": score,
            "grade_letter": grade_letter,
            "status": status,
            "task_title": task_title,
            "submission_id": sub_id
        }
    })


# ==========================================
# DEMO MODE RESET & STATUS (ISOLATED)
# ==========================================

@app.route('/api/demo/status', methods=['GET'])
def get_demo_status():
    current_day = get_current_day()
    user_id = request.args.get('user_id', type=int)
    specialty = request.args.get('specialty', 'it')
    conn = get_db()
    c = conn.cursor()

    if not user_id:
        c.execute("SELECT id FROM users WHERE email IN ('voronov@student.amk.kz', 'student@amk.kz') ORDER BY id ASC LIMIT 1;")
        user = c.fetchone()
        user_id = user['id'] if user else 1

    c.execute("""
    SELECT COUNT(DISTINCT task_number) as cnt, AVG(score) as avg_sc
    FROM task_submissions
    WHERE user_id = ? AND specialty_slug = ? AND score >= 60;
    """, (user_id, specialty))
    res = c.fetchone()
    completed_count = res['cnt'] or 0
    avg_score = round(res['avg_sc'] or 0.0, 1)

    progress_percent = min(100, int(round((completed_count / 10.0) * 100)))

    return jsonify({
        "success": True,
        "current_study_day": current_day,
        "progress_percent": progress_percent,
        "completed_count": completed_count,
        "avg_score": avg_score,
        "tasks_available": min(10, current_day),
        "tasks_locked": max(0, 10 - current_day),
        "is_fresh_start": (completed_count == 0 and current_day == 1)
    })


@app.route('/api/demo/reset', methods=['POST'])
def reset_demo():
    data = request.get_json(silent=True) or {}
    target_user_id = data.get('user_id')
    conn = get_db()
    c = conn.cursor()

    # Reset ONLY demo accounts (is_demo = 1), NEVER deleting real registered users!
    c.execute("SELECT id FROM users WHERE is_demo = 1 OR email IN ('voronov@student.amk.kz', 'student@amk.kz');")
    demo_uids = [u['id'] for u in c.fetchall()]
    if target_user_id:
        c.execute("SELECT id FROM users WHERE id = ? AND is_demo = 1", (target_user_id,))
        if c.fetchone() and target_user_id not in demo_uids:
            demo_uids.append(target_user_id)

    if demo_uids:
        placeholders = ','.join('?' for _ in demo_uids)
        c.execute(f"DELETE FROM task_submissions WHERE user_id IN ({placeholders});", demo_uids)
        c.execute(f"DELETE FROM grades WHERE user_id IN ({placeholders});", demo_uids)
        c.execute(f"DELETE FROM lesson_progress WHERE user_id IN ({placeholders});", demo_uids)

    c.execute("INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('current_study_day', '1');")
    conn.commit()

    return jsonify({
        "success": True,
        "message": "Демоверсия сброшена к началу: День 1, 0% прогресса, открыт только Урок №1. Реальные аккаунты сохранены.",
        "status": {
            "progress_percent": 0,
            "completed_count": 0,
            "current_study_day": 1
        }
    })


# ==========================================
# TEACHER STUDIO API
# ==========================================

@app.route('/api/teacher/advance_day', methods=['POST'])
def advance_study_day():
    data = request.get_json() or {}
    new_day = data.get('day')

    conn = get_db()
    c = conn.cursor()
    if new_day is not None:
        target_day = int(new_day)
    else:
        target_day = get_current_day() + 1

    target_day = max(1, min(10, target_day))
    c.execute("INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('current_study_day', ?);", (str(target_day),))
    conn.commit()

    return jsonify({
        "success": True,
        "message": f"График обучения переключён на День {target_day}. Студентам доступны уроки с 1 по {target_day}.",
        "current_study_day": target_day
    })


@app.route('/api/teacher/students', methods=['GET'])
def get_teacher_students():
    specialty = request.args.get('specialty')
    group_filter = request.args.get('group')
    conn = get_db()
    cursor = conn.cursor()

    q = """
    SELECT id, full_name, last_name, first_name, middle_name, email, role,
           specialty_slug, group_name, student_id, is_demo, created_at
    FROM users
    WHERE role = 'student'
    """
    params = []
    if specialty:
        q += " AND specialty_slug = ?"
        params.append(specialty)
    if group_filter:
        q += " AND group_name = ?"
        params.append(group_filter)

    q += " ORDER BY is_demo ASC, created_at DESC, id DESC"
    cursor.execute(q, params)
    raw_students = cursor.fetchall()

    students = []
    for r in raw_students:
        s_dict = serialize_user(r)
        uid = s_dict["id"]

        cursor.execute("""
        SELECT COUNT(DISTINCT task_number) as passed_cnt,
               COUNT(id) as total_subs,
               AVG(score) as avg_sc,
               MAX(updated_at) as last_act
        FROM task_submissions
        WHERE user_id = ?
        """, (uid,))
        agg = cursor.fetchone()

        s_dict["submitted_count"] = agg["total_subs"] if agg else 0
        s_dict["passed_count"] = agg["passed_cnt"] if agg else 0
        s_dict["avg_score"] = round(agg["avg_sc"], 1) if (agg and agg["avg_sc"] is not None) else 0.0
        s_dict["last_activity"] = agg["last_act"] if (agg and agg["last_act"]) else s_dict.get("created_at")

        course_meta = COURSES_BY_SLUG.get(s_dict.get("specialty_slug", "it"), COURSES_META[0])
        s_dict["course_name"] = course_meta["short_title"]
        s_dict["course_code"] = course_meta["code"]

        students.append(s_dict)

    return jsonify({
        "success": True,
        "count": len(students),
        "students": students,
        "current_study_day": get_current_day()
    })


@app.route('/api/teacher/sync_user', methods=['POST'])
def sync_user():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    full_name = (data.get('full_name') or '').strip()
    role = (data.get('role') or 'student').strip().lower()
    group_name = (data.get('group_name') or 'ИС-21').strip()
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    is_demo = 1 if bool(data.get('is_demo', False)) else 0
    student_id = data.get('student_id')

    if not email or not full_name:
        return jsonify({"success": False, "message": "Не указаны обязательные поля"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    existing = cursor.fetchone()

    if existing:
        return jsonify({"success": True, "message": "Пользователь уже существует в БД", "user_id": existing["id"]})

    fio_parts = [p for p in re.split(r'\s+', full_name) if p]
    last_name = fio_parts[0] if fio_parts else full_name
    first_name = fio_parts[1] if len(fio_parts) > 1 else ""
    middle_name = " ".join(fio_parts[2:]) if len(fio_parts) > 2 else ""

    pwd_hash = hashlib.sha256("student123".encode()).hexdigest()
    if not student_id and role == 'student':
        student_id = f"KZ-AMK-2026-{random.randint(10000, 99999)}"

    cursor.execute("""
    INSERT INTO users (
        email, password_hash, full_name, last_name, first_name, middle_name,
        role, group_name, specialty_slug, department, student_id, email_verified, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, 1, ?)
    """, (
        email, pwd_hash, full_name, last_name, first_name, middle_name,
        role, group_name, specialty_slug, student_id, is_demo
    ))
    new_id = cursor.lastrowid
    if role == 'student':
        cursor.execute("INSERT OR IGNORE INTO enrollments (user_id, specialty_slug) VALUES (?, ?)", (new_id, specialty_slug))
    conn.commit()

    return jsonify({"success": True, "message": "Пользователь синхронизирован с сервером", "user_id": new_id})


@app.route('/api/teacher/simulate_submission', methods=['POST'])
def simulate_submission():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    task_num = int(data.get('task_number') or 1)

    conn = get_db()
    cursor = conn.cursor()

    if not user_id:
        cursor.execute("SELECT id, full_name, group_name, student_id, specialty_slug FROM users WHERE role = 'student' ORDER BY is_demo ASC, id DESC LIMIT 1")
        st_row = cursor.fetchone()
    else:
        cursor.execute("SELECT id, full_name, group_name, student_id, specialty_slug FROM users WHERE id = ?", (user_id,))
        st_row = cursor.fetchone()

    if not st_row:
        return jsonify({"success": False, "message": "В системе нет зарегистрированных студентов для симуляции"}), 404

    target_uid = st_row["id"]
    st_name = st_row["full_name"]
    grp = st_row["group_name"] or "ИС-21"
    st_id = st_row["student_id"] or f"KZ-AMK-2026-{10000 + target_uid}"
    spec = specialty_slug or st_row["specialty_slug"] or "it"

    cursor.execute("SELECT id, title FROM tasks WHERE specialty_slug = ? AND task_number = ?", (spec, task_num))
    t_row = cursor.fetchone()
    task_id = t_row["id"] if t_row else task_num
    task_title = t_row["title"] if t_row else f"Практический урок №{task_num}"

    code_sample = (
        "<!DOCTYPE html>\n<html lang=\"ru\">\n<head>\n  <title>Макет карточки студента</title>\n"
        "  <style>\n    .card { padding: 20px; border-radius: 12px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }\n"
        "  </style>\n</head>\n<body>\n  <div class=\"card\">\n    <h2>Выполненное практическое задание</h2>\n"
        "    <p>Решение сдано на проверку куратору. Все критерии выполнены.</p>\n  </div>\n</body>\n</html>"
    )

    score = 90
    grade_letter = "—"
    status = "Отправлено на проверку"
    comment = f"Здравствуйте, Сергей Павлович! Выполнил практическое задание №{task_num}. Проверьте, пожалуйста, соответствие критериям и чистоту кода."

    cursor.execute("""
    SELECT id FROM task_submissions WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
    """, (target_uid, spec, task_num))
    existing = cursor.fetchone()

    if existing:
        sub_id = existing["id"]
        cursor.execute("""
        UPDATE task_submissions
        SET status = ?, score = ?, grade_letter = ?, submitted_code = ?, student_comment = ?,
            autotest_passed = 3, autotest_total = 3, quiz_score = 3, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """, (status, score, grade_letter, code_sample, comment, sub_id))
    else:
        cursor.execute("""
        INSERT INTO task_submissions (
            user_id, student_id, student_name, group_name, task_id, specialty_slug,
            task_number, task_title, score, grade_letter, status, time_spent_seconds,
            submitted_code, repo_url, student_comment, autotest_passed, autotest_total, quiz_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1200, ?, 'https://github.com/amk-student/project-demo', ?, 3, 3, 3)
        """, (
            target_uid, st_id, st_name, grp, task_id, spec,
            task_num, task_title, score, grade_letter, status, code_sample, comment
        ))
        sub_id = cursor.lastrowid

    conn.commit()

    return jsonify({
        "success": True,
        "message": f"Тестовая работа от студента {st_name} (Урок №{task_num}) успешно отправлена в очередь на проверку!",
        "submission_id": sub_id
    })


@app.route('/api/teacher/journal', methods=['GET'])
def get_teacher_journal():
    specialty = request.args.get('specialty')
    group_filter = request.args.get('group')
    conn = get_db()
    cursor = conn.cursor()

    q = """
    SELECT s.id, s.user_id, s.student_id, s.student_name, s.group_name, s.specialty_slug,
           s.task_number, s.task_title, s.score, s.grade_letter, s.status,
           s.submitted_code, s.repo_url, s.student_comment, s.autotest_passed,
           s.autotest_total, s.quiz_score, s.teacher_comment, s.created_at, s.updated_at
    FROM task_submissions s
    WHERE 1=1
    """
    params = []
    if specialty:
        q += " AND s.specialty_slug = ?"
        params.append(specialty)
    if group_filter:
        q += " AND s.group_name = ?"
        params.append(group_filter)
    q += " ORDER BY s.updated_at DESC, s.id DESC"

    cursor.execute(q, params)
    submissions = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        "success": True,
        "count": len(submissions),
        "current_study_day": get_current_day(),
        "journal": submissions
    })


@app.route('/api/teacher/submissions', methods=['GET'])
def get_teacher_submissions():
    return get_teacher_journal()


@app.route('/api/teacher/matrix', methods=['GET'])
def get_gradebook_matrix():
    specialty = request.args.get('specialty', 'it')
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, full_name, email, group_name, specialty_slug, student_id, is_demo, created_at
    FROM users
    WHERE role = 'student'
    ORDER BY is_demo ASC, full_name ASC
    """)
    students = [serialize_user(r) for r in cursor.fetchall()]

    cursor.execute("""
    SELECT user_id, task_number, score, grade_letter, status, teacher_comment
    FROM task_submissions
    WHERE specialty_slug = ?
    """, (specialty,))
    cell_map = {}
    for r in cursor.fetchall():
        cell_map[(r['user_id'], r['task_number'])] = dict(r)

    matrix_rows = []
    for st in students:
        cells = {}
        scores = []
        for num in range(1, 11):
            c_info = cell_map.get((st['id'], num))
            if c_info:
                cells[str(num)] = c_info
                if c_info['score'] > 0:
                    scores.append(c_info['score'])
        avg = round(sum(scores) / len(scores), 1) if scores else 0.0
        matrix_rows.append({
            "student": st,
            "cells": cells,
            "completed_count": sum(1 for v in cells.values() if v['score'] >= 60),
            "avg_score": avg
        })

    return jsonify({
        "success": True,
        "specialty": specialty,
        "current_study_day": get_current_day(),
        "rows": matrix_rows
    })


@app.route('/api/teacher/grade_submission', methods=['POST'])
def grade_submission():
    data = request.get_json() or {}
    sub_id = data.get('submission_id')
    grade = max(0, min(100, int(data.get('grade', 95))))
    feedback = (data.get('feedback') or 'Работа проверена преподавателем.').strip()
    action = (data.get('action') or 'approve').strip().lower()

    if not sub_id:
        return jsonify({"success": False, "message": "ID работы не указан"}), 400

    if action == 'revision' or grade < 60:
        grade_letter = "F" if grade < 60 else "C"
        status = "На доработке"
    else:
        grade_letter = "A" if grade >= 90 else ("B" if grade >= 75 else "C")
        status = f"Проверено ({grade}/100)"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, task_title, task_number FROM task_submissions WHERE id = ?", (sub_id,))
    sub_row = cursor.fetchone()

    cursor.execute("""
    UPDATE task_submissions
    SET score = ?, grade_letter = ?, status = ?, teacher_comment = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (grade, grade_letter, status, feedback, sub_id))

    if sub_row:
        notif_title = (
            f"Работа №{sub_row['task_number']} возвращена на доработку"
            if status == "На доработке" else
            f"Выставлена оценка {grade}/100 за Урок №{sub_row['task_number']}"
        )
        cursor.execute("""
        INSERT INTO notifications (user_id, target_role, title, body, type)
        VALUES (?, 'student', ?, ?, ?)
        """, (
            sub_row['user_id'],
            notif_title,
            f"Комментарий преподавателя: {feedback}",
            "warning" if status == "На доработке" else "success"
        ))

    conn.commit()
    return jsonify({
        "success": True,
        "message": "Работа отправлена на доработку студенту." if status == "На доработке" else f"Оценка {grade}/100 утверждена в ведомости!"
    })


@app.route('/api/teacher/create_task', methods=['POST'])
def create_or_update_task():
    data = request.get_json() or {}
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    task_number = int(data.get('task_number') or 1)
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    difficulty = (data.get('difficulty') or 'Средний').strip()
    unlock_day = max(1, min(10, int(data.get('unlock_day') or task_number)))
    tools_required = (data.get('tools_required') or 'Практикум EDU SPACE').strip()
    starter_code = data.get('starter_code') or '// Введите ваше решение\n'

    if not title or not description:
        return jsonify({"success": False, "message": "Заполните название и описание задания."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO tasks (
        specialty_slug, task_number, title, difficulty, time_limit,
        unlock_day, unlock_date_text, deadline_text, description, tools_required, starter_code
    ) VALUES (?, ?, ?, ?, '60 мин', ?, ?, ?, ?, ?, ?)
    ON CONFLICT(specialty_slug, task_number) DO UPDATE SET
        title = excluded.title,
        difficulty = excluded.difficulty,
        unlock_day = excluded.unlock_day,
        description = excluded.description,
        tools_required = excluded.tools_required,
        starter_code = excluded.starter_code
    """, (
        specialty_slug, task_number, title, difficulty, unlock_day,
        f"Откроется в День {unlock_day}", f"День {unlock_day + 2}, 23:59",
        description, tools_required, starter_code
    ))
    conn.commit()

    return jsonify({"success": True, "message": f"Задание №{task_number} для курса «{specialty_slug.upper()}» сохранено!"})


@app.route('/api/teacher/broadcast', methods=['POST'])
def teacher_broadcast():
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    body = (data.get('body') or '').strip()
    target_group = (data.get('target_group') or '').strip()

    if not title or not body:
        return jsonify({"success": False, "message": "Введите заголовок и текст объявления."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO notifications (user_id, target_role, target_group, title, body, type)
    VALUES (NULL, 'student', ?, ?, ?, 'info')
    """, (target_group, title, body))
    conn.commit()

    return jsonify({"success": True, "message": "Объявление доставлено студентам в центр уведомлений!"})


@app.route('/api/teacher/stats', methods=['GET'])
def get_teacher_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM task_submissions')
    total_submissions = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM task_submissions WHERE status = 'Отправлено на проверку'")
    pending_submissions = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT id) FROM users WHERE role = 'student'")
    total_students = cursor.fetchone()[0]

    cursor.execute('SELECT AVG(score) FROM task_submissions WHERE score > 0')
    avg_score = cursor.fetchone()[0] or 0.0

    return jsonify({
        "success": True,
        "stats": {
            "total_students": total_students,
            "total_submissions": total_submissions,
            "pending_submissions": pending_submissions,
            "average_score": round(avg_score, 1),
            "current_study_day": get_current_day()
        }
    })


# ==========================================
# NOTIFICATIONS & MESSENGER API
# ==========================================

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    user_id = request.args.get('user_id', type=int)
    group_name = request.args.get('group_name', '')
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, user_id, target_group, title, body, type, is_read, created_at
    FROM notifications
    WHERE (user_id = ? OR (user_id IS NULL AND (target_group = '' OR target_group = ?)))
    ORDER BY id DESC
    LIMIT 30
    """, (user_id or -1, group_name))
    items = [dict(r) for r in cursor.fetchall()]
    unread = sum(1 for x in items if not x['is_read'])
    return jsonify({"success": True, "unread_count": unread, "notifications": items})


@app.route('/api/notifications/read', methods=['POST'])
def mark_notifications_read():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL", (user_id,))
        conn.commit()
    return jsonify({"success": True})


@app.route('/api/messages', methods=['GET'])
def list_messages():
    channel = request.args.get('channel', 'general')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, sender_id, sender_name, sender_role, recipient_key, body, created_at
    FROM messages
    WHERE recipient_key = ?
    ORDER BY id ASC
    LIMIT 50
    """, (channel,))
    return jsonify({"success": True, "messages": [dict(r) for r in cursor.fetchall()]})


@app.route('/api/messages/send', methods=['POST'])
def send_message_api():
    data = request.get_json() or {}
    sender_id = data.get('sender_id')
    sender_name = (data.get('sender_name') or 'Пользователь').strip()
    sender_role = (data.get('sender_role') or 'student').strip()
    channel = (data.get('channel') or 'general').strip()
    body = (data.get('body') or '').strip()

    if not body:
        return jsonify({"success": False, "message": "Сообщение не может быть пустым."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO messages (sender_id, sender_name, sender_role, recipient_key, body)
    VALUES (?, ?, ?, ?, ?)
    """, (sender_id, sender_name, sender_role, channel, body))
    conn.commit()
    return jsonify({"success": True, "id": cursor.lastrowid})


@app.route('/api/grades/save', methods=['POST'])
def save_grade():
    return submit_task()


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "EDU SPACE LMS Platform",
        "institution": "Алматинский многопрофильный колледж (АМК)",
        "database": "SQLite3 (50 lessons catalog synced)",
        "tasks_total": 50,
        "current_study_day": get_current_day(),
        "timestamp": datetime.now().isoformat()
    })


# ==========================================
# STATIC FRONTEND ROUTES
# ==========================================

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

@app.route('/student')
@app.route('/student.html')
def student_page():
    return send_from_directory(APP_DIR, 'student.html')

@app.route('/profile')
@app.route('/profile.html')
def profile_page():
    return send_from_directory(APP_DIR, 'profile.html')

@app.route('/tasks')
@app.route('/tasks.html')
def tasks_page():
    return send_from_directory(APP_DIR, 'tasks.html')

@app.route('/features')
@app.route('/features.html')
def features_page():
    return send_from_directory(APP_DIR, 'features.html')

@app.route('/about')
@app.route('/about.html')
def about_page():
    return send_from_directory(APP_DIR, 'about.html')

@app.route('/pricing')
@app.route('/pricing.html')
def pricing_page():
    return send_from_directory(APP_DIR, 'pricing.html')

@app.route('/reviews')
@app.route('/reviews.html')
def reviews_page():
    return send_from_directory(APP_DIR, 'reviews.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(APP_DIR, path)


if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print(f"EDU SPACE LMS Server started at http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
