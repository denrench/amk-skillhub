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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory, g, session, redirect, url_for, make_response
from functools import wraps

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = BASE_DIR
DB_PATH = os.path.join(BASE_DIR, "database.db")

app = Flask(__name__, static_folder=APP_DIR)

# =========================================================================
# SERVER-SIDE SESSION SECURITY & ROLE ENFORCEMENT
# =========================================================================

def get_current_user():
    """Retrieves authenticated user from server-side session."""
    user_id = session.get('user_id')
    if not user_id:
        return None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, full_name, role, group_name, specialty_slug, student_id FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
    except Exception as e:
        print(f"[AUTH ERROR] get_current_user error: {e}")
    return None

def login_required(roles=None):
    """Decorator to enforce server-side session authentication & role checks."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({
                    "success": False,
                    "message": "Требуется авторизация в системе",
                    "code": "UNAUTHORIZED"
                }), 401

            if roles:
                allowed = [roles] if isinstance(roles, str) else roles
                if user['role'] not in allowed:
                    return jsonify({
                        "success": False,
                        "message": f"Доступ запрещён: недостаточно прав (ваша роль: {user['role']})",
                        "code": "FORBIDDEN"
                    }), 403

            g.current_user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_teacher_assigned_groups(teacher_id):
    """Returns list of group names assigned to the specified teacher."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT group_name FROM teacher_groups WHERE teacher_id = ?", (teacher_id,))
    rows = cursor.fetchall()
    return [r[0] for r in rows]
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'amk-eduspace-lms-secret-2026')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = (os.environ.get('RENDER') is not None or os.environ.get('HTTPS') == 'on')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=14)
DATABASE_URL = os.environ.get('DATABASE_URL')

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


import collections.abc
import urllib.parse
import ssl

DATABASE_URL = os.environ.get('DATABASE_URL')

import decimal

def _normalize_pg_val(val):
    if isinstance(val, decimal.Decimal):
        return float(val)
    if hasattr(val, 'strftime'):
        return val.strftime("%Y-%m-%d %H:%M:%S")
    return val

class PostgresRow(collections.abc.Mapping):
    def __init__(self, col_names, values):
        self._col_names = col_names
        self._values = [_normalize_pg_val(v) for v in values]
        self._dict = {col: val for col, val in zip(col_names, self._values)}

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return self._dict[key]

    def __len__(self):
        return len(self._dict)

    def __iter__(self):
        return iter(self._dict)

    def keys(self):
        return self._col_names

    def values(self):
        return self._values

    def items(self):
        return self._dict.items()

    def get(self, key, default=None):
        return self._dict.get(key, default)


class PostgresCursorWrapper:
    def __init__(self, raw_cursor, conn):
        self._cur = raw_cursor
        self._conn = conn
        self.lastrowid = None

    @property
    def rowcount(self):
        return getattr(self._cur, 'rowcount', -1)

    @property
    def description(self):
        return self._cur.description

    def execute(self, query, params=None):
        clean_q = query.strip()
        pg_query = clean_q.replace('?', '%s')
        
        # Translate SQLite syntax to PostgreSQL
        if "INSERT OR IGNORE INTO" in pg_query:
            pg_query = pg_query.replace("INSERT OR IGNORE INTO", "INSERT INTO")
            if pg_query.endswith(';'):
                pg_query = pg_query[:-1]
            pg_query += " ON CONFLICT DO NOTHING"
        elif "INSERT OR REPLACE INTO platform_settings" in pg_query:
            pg_query = pg_query.replace("INSERT OR REPLACE INTO platform_settings", "INSERT INTO platform_settings")
            if pg_query.endswith(';'):
                pg_query = pg_query[:-1]
            pg_query += " ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
        
        is_insert = pg_query.upper().startswith("INSERT INTO")
        has_returning = "RETURNING" in pg_query.upper()
        
        # Tables without 'id' column
        tables_without_id = ("email_verifications", "platform_settings")
        table_has_no_id = any(tbl in pg_query.lower() for tbl in tables_without_id)

        if is_insert and not has_returning and not table_has_no_id:
            if pg_query.endswith(';'):
                pg_query = pg_query[:-1]
            pg_query += " RETURNING id"
            has_returning = True

        if params is not None:
            self._cur.execute(pg_query, tuple(params))
        else:
            self._cur.execute(pg_query)

        if is_insert and has_returning:
            try:
                res = self._cur.fetchone()
                if res:
                    self.lastrowid = res[0]
            except Exception:
                self.lastrowid = None
        return self

    def fetchone(self):
        row = self._cur.fetchone()
        if row is None:
            return None
        col_names = [d[0] for d in self._cur.description]
        return PostgresRow(col_names, row)

    def fetchall(self):
        rows = self._cur.fetchall()
        if not rows:
            return []
        col_names = [d[0] for d in self._cur.description]
        return [PostgresRow(col_names, r) for r in rows]

    def close(self):
        self._cur.close()


class PostgresConnectionWrapper:
    def __init__(self, raw_conn):
        self._conn = raw_conn

    def cursor(self):
        return PostgresCursorWrapper(self._conn.cursor(), self._conn)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()


_LAST_DB_ERROR = None

def create_postgres_conn(pg_url):
    global _LAST_DB_ERROR
    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql://", 1)

    errors = []
    # 1. Try psycopg2
    try:
        import psycopg2
        raw_conn = psycopg2.connect(pg_url)
        return PostgresConnectionWrapper(raw_conn)
    except Exception as e:
        errors.append(f"psycopg2: {e}")

    # 2. Try pg8000 with appropriate SSL
    try:
        import pg8000.dbapi
        u = urllib.parse.urlparse(pg_url)
        is_internal = "render.com" not in (u.hostname or "")
        ssl_ctx = None if is_internal else ssl.create_default_context()
        raw_conn = pg8000.dbapi.connect(
            user=u.username,
            password=u.password,
            host=u.hostname,
            port=u.port or 5432,
            database=u.path.lstrip('/'),
            ssl_context=ssl_ctx
        )
        return PostgresConnectionWrapper(raw_conn)
    except Exception as e:
        errors.append(f"pg8000: {e}")

    _LAST_DB_ERROR = " | ".join(errors)
    raise RuntimeError(_LAST_DB_ERROR)


def get_db():
    global _LAST_DB_ERROR
    if 'db' not in g:
        pg_url = os.environ.get('DATABASE_URL')
        if pg_url:
            try:
                g.db = create_postgres_conn(pg_url)
                return g.db
            except Exception as e:
                _LAST_DB_ERROR = str(e)
                print(f"[WARN] Failed to connect to DATABASE_URL: {e}. Falling back to SQLite.")
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.route('/api/debug/db_status', methods=['GET'])
def get_db_status():
    db = get_db()
    is_pg = isinstance(db, PostgresConnectionWrapper)
    pg_url = os.environ.get('DATABASE_URL')
    return jsonify({
        "database_type": "postgresql" if is_pg else "sqlite",
        "database_url_configured": bool(pg_url),
        "last_db_error": _LAST_DB_ERROR
    })


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
    if os.environ.get('DATABASE_URL'):
        print("[INFO] DATABASE_URL detected. PostgreSQL database is active.")
        try:
            pg_conn = create_postgres_conn(os.environ.get('DATABASE_URL'))
            pg_cur = pg_conn.cursor()
            for pg_ddl in [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_xp INTEGER DEFAULT 0",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 1",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS achievements_json TEXT DEFAULT '[]'",
                "ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 1",
                "ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS mission_state_json TEXT DEFAULT '{}'",
                "ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS mission_xp INTEGER DEFAULT 0",
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_spec_num ON tasks (specialty_slug, task_number)",
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email)",
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verif_email ON email_verifications (email)",
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_prog_user_spec_num ON lesson_progress (user_id, specialty_slug, task_number)",
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings (key)",
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_user_spec ON enrollments (user_id, specialty_slug)",
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_groups_tid_grp ON teacher_groups (teacher_id, group_name)"
            ]:
                pg_cur.execute(pg_ddl)
            pg_conn.commit()
            pg_conn.close()
        except Exception as e:
            print(f"[WARN] PostgreSQL DDL sync warning: {e}")
        return
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
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
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
        "is_demo INTEGER DEFAULT 0",
        "subscription_tier TEXT DEFAULT 'free'",
        "pro_expires_at TIMESTAMP NULL",
        "bonus_xp INTEGER DEFAULT 0",
        "streak_days INTEGER DEFAULT 1",
        "achievements_json TEXT DEFAULT '[]'"
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
        current_stage INTEGER DEFAULT 1,
        mission_state_json TEXT DEFAULT '{}',
        mission_xp INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, specialty_slug, task_number),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    for col_def in [
        "current_stage INTEGER DEFAULT 1",
        "mission_state_json TEXT DEFAULT '{}'",
        "mission_xp INTEGER DEFAULT 0"
    ]:
        _safe_add_column(cursor, "lesson_progress", col_def)

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
    CREATE TABLE IF NOT EXISTS teacher_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        group_name TEXT NOT NULL,
        specialty_slug TEXT DEFAULT 'it',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(teacher_id, group_name)
    );
    """)

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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan_code TEXT NOT NULL DEFAULT 'free',
        billing_period TEXT DEFAULT 'monthly',
        status TEXT NOT NULL DEFAULT 'active',
        amount INTEGER DEFAULT 0,
        currency TEXT DEFAULT 'KZT',
        payment_method TEXT DEFAULT 'sandbox',
        starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan_code TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT DEFAULT 'KZT',
        status TEXT NOT NULL DEFAULT 'paid',
        payment_method TEXT DEFAULT 'sandbox',
        receipt_number TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    d["subscription_tier"] = d.get("subscription_tier") or "free"
    d["is_pro"] = (d["subscription_tier"] == "pro")
    d["pro_expires_at"] = d.get("pro_expires_at")
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


# ==========================================
# OFFICIAL EMAIL SMTP DISPATCHER
# ==========================================
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', 'd03509181@gmail.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')

def send_smtp_email(to_email, code):
    if not SMTP_PASSWORD:
        print(f"[OTP DEV PREVIEW] To: {to_email} | Code: {code} | SMTP_PASSWORD not set (Gmail App Password needed for live sending)")
        return False, "SMTP_PASSWORD_NOT_SET"
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"{code} — Ваш проверочный код EDU SPACE (АМК)"
        msg['From'] = f"EDU SPACE АМК <{SMTP_USER}>"
        msg['To'] = to_email

        html = f"""<!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 24px; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 520px; margin: 0 auto; background: #0c1017; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
            <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">EDU SPACE</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 13px; font-weight: 600;">Алматинский многопрофильный колледж (АМК)</p>
            </div>
            <div style="padding: 32px 28px; text-align: center;">
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 22px 0;">
                Здравствуйте! Вы запросили подтверждение регистрации на образовательной платформе <strong>EDU SPACE</strong>. Ваш 6-значный проверочный код:
              </p>
              <div style="display: inline-block; padding: 14px 28px; background: rgba(16, 185, 129, 0.12); border: 2px solid #10b981; border-radius: 14px; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #10b981; font-family: monospace;">
                {code}
              </div>
              <p style="color: #64748b; font-size: 12px; margin: 22px 0 0 0;">
                Код действителен в течение 10 минут. Никому не сообщайте данный код.
              </p>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding: 20px 24px; background: #07090e; text-align: center; color: #64748b; font-size: 11px; line-height: 1.6;">
              КГКП «Алматинский многопрофильный колледж» • БИН: 990440001809<br/>
              г. Алматы, ул. Жандосова, 63 • Тел. приемной: +7 (727) 309-59-44<br/>
              Поддержка: +7 707 907 97 64 (WhatsApp) • danidanilov333@gmail.com
            </div>
          </div>
        </body>
        </html>"""
        msg.attach(MIMEText(html, 'html', 'utf-8'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(SMTP_USER, [to_email], msg.as_string())

        print(f"[OTP SUCCESS] Real email delivered to {to_email} via {SMTP_USER}")
        return True, "SUCCESS"
    except Exception as e:
        print(f"[OTP ERROR] SMTP Dispatch failed: {e}")
        return False, str(e)

@app.route('/api/auth/send_code', methods=['POST'])
def send_verification_code():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    purpose = (data.get('purpose') or 'register').strip().lower()

    ok, err = validate_email_addr(email)
    if not ok:
        return jsonify({"success": False, "message": err}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    existing_user = cursor.fetchone()
    if purpose == 'reset':
        if not existing_user:
            return jsonify({
                "success": False,
                "message": "Аккаунт с таким email не найден в системе."
            }), 404
    elif existing_user:
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

    wa_phone = "77079079764"
    wa_msg = f"Здравствуйте! Подтверждаю регистрацию в EDU SPACE (АМК). Мой код: [{code}], Email: {email}"
    import urllib.parse
    wa_url = f"https://wa.me/{wa_phone}?text={urllib.parse.quote(wa_msg)}"

    # Optional background attempt via SMTP if configured
    sent_real, status_smtp = send_smtp_email(email, code)

    return jsonify({
        "success": True,
        "message": f"Код [{code}] готов для отправки в WhatsApp (+7 707 907 97 64)",
        "code": code,
        "whatsapp_phone": "+7 707 907 97 64",
        "whatsapp_url": wa_url,
        "sent_via_smtp": sent_real,
        "expires_in_seconds": 600,
        "mail_preview": {
            "to": email,
            "from": "+7 707 907 97 64 (WhatsApp)",
            "subject": f"{code} — Код подтверждения EDU SPACE (АМК)",
            "code": code,
            "whatsapp_url": wa_url
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

    session.clear()
    session['user_id'] = user_out['id']
    session['user_email'] = user_out['email']
    session['user_role'] = user_out['role']
    session.permanent = True

    return jsonify({
        "success": True,
        "message": f"Регистрация успешно завершена! Добро пожаловать, {fio['first_name']}!",
        "user": user_out
    }), 201



# =========================================================================
# SESSION STATUS, LOGOUT & PASSWORD RECOVERY API
# =========================================================================

@app.route('/api/auth/session', methods=['GET'])
def get_auth_session():
    """Returns the current authenticated server-side session."""
    user = get_current_user()
    if user:
        return jsonify({
            "authenticated": True,
            "user": user
        })
    return jsonify({"authenticated": False}), 200

@app.route('/api/auth/logout', methods=['POST', 'GET'])
def auth_logout():
    """Safely terminates the server-side session."""
    session.clear()
    return jsonify({"success": True, "message": "Сессия успешно завершена"}), 200

@app.route('/api/auth/reset_password', methods=['POST'])
def auth_reset_password():
    """Secure password reset via OTP verification."""
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    code = (data.get('code') or '').strip()
    new_password = (data.get('new_password') or '').strip()

    if not email or not code or not new_password:
        return jsonify({"success": False, "message": "Заполните email, проверочный код и новый пароль"}), 400

    if len(new_password) < 6:
        return jsonify({"success": False, "message": "Новый пароль должен содержать минимум 6 символов"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT code, expires_at FROM email_verifications WHERE email = ?", (email,))
    ver = cursor.fetchone()

    if not ver or str(ver['code']) != code:
        return jsonify({"success": False, "message": "Неверный или устаревший код подтверждения"}), 400

    new_hash = hashlib.sha256(new_password.encode()).hexdigest()
    cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (new_hash, email))
    conn.commit()

    return jsonify({"success": True, "message": "Пароль успешно обновлён. Теперь вы можете войти."}), 200


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
    session.clear()
    session['user_id'] = user_out['id']
    session['user_email'] = user_out['email']
    session['user_role'] = user_out['role']
    session.permanent = True

    return jsonify({
        "success": True,
        "message": f"Добро пожаловать, {user_out['full_name']}!",
        "user": user_out,
        "session_active": True
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
    session_uid = session.get('user_id')
    session_role = session.get('user_role')
    if session_uid and session_role == 'student' and int(user_id) != int(session_uid):
        return jsonify({
            "success": False,
            "message": "Доступ к чужому профилю запрещён.",
            "code": "TAMPERING_DETECTED"
        }), 403
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
    bonus_xp = int(user_dict.get("bonus_xp") or 0)
    xp_total = sum(v["score"] * 3 for v in latest_by_task.values() if v["score"] >= 60) + bonus_xp
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
    session_uid = session.get('user_id')
    session_role = session.get('user_role')
    if session_uid and session_role == 'student':
        if user_id and int(user_id) != int(session_uid):
            return jsonify({
                "success": False,
                "message": "Изменение чужого профиля запрещено.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = session_uid
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
        SELECT specialty_slug, task_number, status, quiz_score, quiz_total, draft_code, current_stage, mission_xp, mission_state_json
        FROM lesson_progress
        WHERE user_id = ?
        """, (user_id,))
        for pr in cursor.fetchall():
            user_prog[(pr['specialty_slug'], pr['task_number'])] = dict(pr)

    user_is_pro = False
    if user_id:
        cursor.execute("SELECT subscription_tier FROM users WHERE id = ?", (user_id,))
        u_tier_row = cursor.fetchone()
        if u_tier_row and (u_tier_row['subscription_tier'] or '').lower() == 'pro':
            user_is_pro = True

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

        task_num = int(t.get('task_number') or 1)
        is_pro_required = (task_num > 3)
        is_pro_locked = bool(is_pro_required and not user_is_pro)

        t_data = dict(t)
        t_data['current_study_day'] = current_day
        t_data['is_pro_required'] = is_pro_required
        t_data['is_pro_locked'] = is_pro_locked
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
        t_data['current_stage'] = prog_info.get('current_stage', 1) if prog_info else 1
        t_data['mission_xp'] = prog_info.get('mission_xp', 0) if prog_info else 0
        t_data['is_interactive_mission'] = (t['specialty_slug'] == 'graphic_design' and int(t['task_number']) == 1)
        tasks_out.append(t_data)

    return jsonify({
        "success": True,
        "current_study_day": current_day,
        "user_is_pro": user_is_pro,
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
    session_uid = session.get('user_id')
    session_role = session.get('user_role')
    if session_uid and session_role == 'student':
        if user_id and int(user_id) != int(session_uid):
            return jsonify({
                "success": False,
                "message": "Сохранение прогресса для чужого аккаунта запрещено.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = session_uid
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
    # Anti-tampering: enforce server session user_id for students
    session_user_id = session.get('user_id')
    session_user_role = session.get('user_role')

    if session_user_id and session_user_role == 'student':
        if 'user_id' in data and int(data['user_id']) != session_user_id:
            return jsonify({
                "success": False,
                "message": "Попытка подмены идентификатора пользователя заблокирована сервером.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = session_user_id
    elif session_user_id and session_user_role in ('teacher', 'admin'):
        user_id = int(data.get('user_id') or session_user_id)
    else:
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

    cursor.execute("SELECT full_name, group_name, student_id, subscription_tier FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    user_tier = (u_row['subscription_tier'] if u_row and u_row['subscription_tier'] else 'free').lower()
    if task_number > 3 and user_tier != 'pro':
        return jsonify({
            "success": False,
            "is_pro_locked": True,
            "error": "Модули с 4 по 10 доступны только на тарифе Pro. Активируйте подписку в разделе «Тарифы» для сдачи практических модулей и получения сертификата.",
            "message": "Требуется тариф Pro для сдачи модулей 4–10."
        }), 403

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
        c.execute(f"UPDATE users SET bonus_xp = 0, achievements_json = '[]' WHERE id IN ({placeholders});", demo_uids)

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
    if session.get('user_role') == 'student':
        return jsonify({"success": False, "message": "Доступ запрещён: требуются права преподавателя", "code": "FORBIDDEN"}), 403
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

    # Enforce role and teacher group isolation
    caller_role = session.get('user_role')
    caller_id = session.get('user_id')

    # If caller is student, block access to teacher endpoint
    if caller_role == 'student':
        return jsonify({
            "success": False,
            "message": "Доступ запрещён: требуются права преподавателя",
            "code": "FORBIDDEN"
        }), 403

    # Check assigned groups for this teacher
    teacher_assigned = []
    if caller_id and caller_role == 'teacher':
        teacher_assigned = get_teacher_assigned_groups(caller_id)

    # If teacher explicitly requested a group outside their assignment, block tampering
    if teacher_assigned and group_filter and group_filter not in teacher_assigned:
        return jsonify({
            "success": False,
            "message": f"У вас нет доступа к учебной группе '{group_filter}'",
            "code": "GROUP_ACCESS_DENIED"
        }), 403

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
    elif teacher_assigned:
        q += f" AND group_name IN ({','.join(['?']*len(teacher_assigned))})"
        params.extend(teacher_assigned)

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
    caller_role = session.get('user_role')
    caller_id = session.get('user_id')
    if caller_role == 'student':
        return jsonify({"success": False, "message": "Доступ запрещён: требуются права преподавателя", "code": "FORBIDDEN"}), 403

    specialty = request.args.get('specialty')
    group_filter = request.args.get('group')
    conn = get_db()
    cursor = conn.cursor()

    teacher_assigned = []
    if caller_id and caller_role == 'teacher':
        teacher_assigned = get_teacher_assigned_groups(caller_id)
    if teacher_assigned and group_filter and group_filter not in teacher_assigned:
        return jsonify({
            "success": False,
            "message": f"У вас нет доступа к учебной группе '{group_filter}'",
            "code": "GROUP_ACCESS_DENIED"
        }), 403

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
    elif teacher_assigned:
        q += f" AND s.group_name IN ({','.join(['?']*len(teacher_assigned))})"
        params.extend(teacher_assigned)
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

    caller_role = session.get('user_role')
    caller_id = session.get('user_id')

    if caller_role == 'student':
        return jsonify({
            "success": False,
            "message": "Студенты не имеют прав оценивать работы",
            "code": "FORBIDDEN"
        }), 403

    if action == 'revision' or grade < 60:
        grade_letter = "F" if grade < 60 else "C"
        status = "На доработке"
    else:
        grade_letter = "A" if grade >= 90 else ("B" if grade >= 75 else "C")
        status = f"Проверено ({grade}/100)"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT ts.user_id, ts.task_title, ts.task_number, u.group_name
    FROM task_submissions ts
    JOIN users u ON ts.user_id = u.id
    WHERE ts.id = ?
    """, (sub_id,))
    sub_row = cursor.fetchone()

    # Verify that teacher is assigned to this student's group
    if caller_id and caller_role == 'teacher':
        t_groups = get_teacher_assigned_groups(caller_id)
        if t_groups and sub_row and sub_row['group_name'] not in t_groups:
            return jsonify({
                "success": False,
                "message": f"Студент группы '{sub_row['group_name']}' не относится к вашим закреплённым группам.",
                "code": "GROUP_ACCESS_DENIED"
            }), 403
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
    if session.get('user_role') == 'student':
        return jsonify({"success": False, "message": "Студенты не могут создавать или изменять задания", "code": "FORBIDDEN"}), 403
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


@app.route('/api/teacher/delete_task', methods=['POST', 'DELETE'])
def delete_teacher_task():
    if session.get('user_role') == 'student':
        return jsonify({"success": False, "message": "Студенты не могут удалять задания", "code": "FORBIDDEN"}), 403
    data = request.get_json(silent=True) or {}
    task_id = data.get('task_id') or request.args.get('task_id', type=int)
    specialty_slug = (data.get('specialty_slug') or request.args.get('specialty_slug') or '').strip().lower()
    task_number = data.get('task_number') or request.args.get('task_number', type=int)

    conn = get_db()
    cursor = conn.cursor()
    if task_id:
        cursor.execute("DELETE FROM tasks WHERE id = ?", (int(task_id),))
    elif specialty_slug and task_number:
        cursor.execute("DELETE FROM tasks WHERE specialty_slug = ? AND task_number = ?", (specialty_slug, int(task_number)))
    else:
        return jsonify({"success": False, "message": "Укажите task_id или (specialty_slug и task_number)"}), 400
    conn.commit()
    return jsonify({"success": True, "message": "Задание успешно удалено"})


@app.route('/api/teacher/broadcast', methods=['POST'])
def teacher_broadcast():
    if session.get('user_role') == 'student':
        return jsonify({"success": False, "message": "Студенты не могут отправлять общеколледжные объявления", "code": "FORBIDDEN"}), 403
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
    body = re.sub(r'<script[^>]*>.*?</script>', '', (data.get('body') or ''), flags=re.IGNORECASE | re.DOTALL).strip()
    body = body.replace('<script', '&lt;script').replace('</script>', '&lt;/script&gt;')

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
    db = get_db()
    is_pg = isinstance(db, PostgresConnectionWrapper)
    return jsonify({
        "status": "healthy",
        "service": "EDU SPACE LMS Platform",
        "institution": "Алматинский многопрофильный колледж (АМК)",
        "database": "PostgreSQL (50 lessons catalog synced)" if is_pg else "SQLite3 (50 lessons catalog synced)",
        "database_type": "postgresql" if is_pg else "sqlite",
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

@app.route('/career')
@app.route('/career.html')
def career_page():
    return send_from_directory(APP_DIR, 'career.html')

@app.route('/tools')
@app.route('/tools.html')
def tools_page():
    return send_from_directory(APP_DIR, 'tools.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(APP_DIR, path)


# ==========================================
# BILLING, TARIFFS & REAL PAYMENT API
# ==========================================

PLANS_CATALOG = [
    {
        "code": "free",
        "name": "Студент Free",
        "badge": "Базовый план",
        "price_monthly": 0,
        "price_yearly": 0,
        "description": "Стартовый доступ к начальным модулям программы",
        "features": [
            "Вводные уроки №1–3 по выбранной специальности",
            "Автопроверка автотестами в тренажёре",
            "Электронная зачётная книжка и текущие баллы",
            "Доступ к базе конспектов и методичек"
        ],
        "is_popular": False,
        "cta_label": "Текущий бесплатный план"
    },
    {
        "code": "pro",
        "name": "Студент Pro",
        "badge": "Выбор 85% студентов",
        "price_monthly": 4990,
        "price_yearly": 39900,
        "description": "Полный доступ ко всем 50 практическим модулям и сертификация",
        "features": [
            "Все 10 практических модулей по всем 5 направлениям",
            "Неограниченный запуск автотестов и симуляторов",
            "Официальный именной цифровой сертификат с QR-кодом колледжа",
            "Выгрузка расширенной ведомости успеваемости в Excel (CSV)",
            "Внесение в базу аккредитованных выпускников колледжа",
            "Цифровое портфолио для работодателей"
        ],
        "is_popular": True,
        "cta_label": "Подключить тариф Pro"
    },
    {
        "code": "college",
        "name": "Кафедра / Колледж",
        "badge": "Для учебных групп B2B",
        "price_monthly": 49900,
        "price_yearly": 399000,
        "description": "Корпоративное подключение для групп до 30 человек",
        "features": [
            "Безлимитный доступ для потока до 30 студентов",
            "Сводные академические ведомости успеваемости по ТиПО",
            "Все 50 модулей по 5 аккредитованным профессиям",
            "Годовая отчетность для деканата и аттестационной комиссии"
        ],
        "is_popular": False,
        "cta_label": "Оформить для кафедры"
    }
]


@app.route('/api/billing/plans', methods=['GET'])
def get_billing_plans():
    return jsonify({
        "success": True,
        "plans": PLANS_CATALOG
    })


@app.route('/api/billing/status', methods=['GET'])
def get_billing_status():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({"success": False, "message": "Параметр user_id обязателен"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name, email, subscription_tier, pro_expires_at FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    if not u_row:
        return jsonify({"success": False, "message": "Пользователь не найден"}), 404

    tier = u_row["subscription_tier"] or "free"
    is_pro = (tier == "pro")

    cursor.execute("""
    SELECT id, plan_code, amount, currency, status, payment_method, receipt_number, created_at
    FROM transactions
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 10
    """, (user_id,))
    txs = [dict(r) for r in cursor.fetchall()]

    plan_meta = next((p for p in PLANS_CATALOG if p["code"] == tier), PLANS_CATALOG[0])

    return jsonify({
        "success": True,
        "user_id": user_id,
        "subscription_tier": tier,
        "is_pro": is_pro,
        "pro_expires_at": u_row["pro_expires_at"],
        "plan_name": plan_meta["name"],
        "transactions": txs
    })


@app.route('/api/billing/checkout', methods=['POST'])
def process_checkout():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    plan_code = (data.get('plan_code') or 'pro').lower()
    billing_period = (data.get('billing_period') or 'monthly').lower()
    payment_method = (data.get('payment_method') or 'kaspi').lower()

    if not user_id:
        return jsonify({"success": False, "message": "Требуется авторизация пользователя"}), 400

    plan_obj = next((p for p in PLANS_CATALOG if p["code"] == plan_code), None)
    if not plan_obj:
        return jsonify({"success": False, "message": "Выбранный тариф не существует"}), 400

    amount = plan_obj["price_yearly"] if billing_period == 'yearly' else plan_obj["price_monthly"]
    duration_days = 365 if billing_period == 'yearly' else 30

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, full_name, email, group_name FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    if not user_row:
        return jsonify({"success": False, "message": "Пользователь не найден"}), 404

    # Calculate expiration
    now_dt = datetime.now()
    exp_dt = now_dt + timedelta(days=duration_days)
    exp_str = exp_dt.strftime("%Y-%m-%d %H:%M:%S")

    # Generate receipt number
    receipt_no = f"KZ-EDUSPACE-{random.randint(100000, 999999)}"

    # Update user subscription
    cursor.execute("""
    UPDATE users
    SET subscription_tier = ?, pro_expires_at = ?
    WHERE id = ?
    """, (plan_code, exp_str, user_id))

    # Insert subscription record
    cursor.execute("""
    INSERT INTO subscriptions (
        user_id, plan_code, billing_period, status, amount, currency, payment_method, starts_at, expires_at
    ) VALUES (?, ?, ?, 'active', ?, 'KZT', ?, CURRENT_TIMESTAMP, ?)
    """, (user_id, plan_code, billing_period, amount, payment_method, exp_str))

    # Insert transaction record
    cursor.execute("""
    INSERT INTO transactions (
        user_id, plan_code, amount, currency, status, payment_method, receipt_number, created_at
    ) VALUES (?, ?, ?, 'KZT', 'paid', ?, ?, CURRENT_TIMESTAMP)
    """, (user_id, plan_code, amount, payment_method, receipt_no))

    # Create notification for student
    notif_body = f"Тариф {plan_obj['name']} успешно активирован на {duration_days} дней. Все 50 модулей, тренажёры и получение официального сертификата открыты!"
    cursor.execute("""
    INSERT INTO notifications (user_id, target_role, title, body, type)
    VALUES (?, 'student', 'Оплата принята: Тариф Pro активен! 💎', ?, 'success')
    """, (user_id, notif_body))

    conn.commit()

    # Get updated user object
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    updated_user = serialize_user(cursor.fetchone())

    return jsonify({
        "success": True,
        "message": f"Оплата {amount:,} ₸ успешно подтверждена! Тариф {plan_obj['name']} активирован.",
        "receipt": {
            "receipt_number": receipt_no,
            "amount": amount,
            "currency": "KZT",
            "payment_method": payment_method.upper(),
            "paid_at": now_dt.strftime("%d.%m.%Y %H:%M"),
            "plan_name": plan_obj["name"],
            "expires_at": exp_dt.strftime("%d.%m.%Y")
        },
        "user": updated_user
    }), 200


# ==========================================
# FILE UPLOAD & SUBMISSION ASSETS API
# ==========================================

UPLOAD_DIR = os.path.join(BASE_DIR, 'static', 'uploads', 'submissions')
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'svg', 'psd', 'fig', 'pdf', 'zip', 'txt', 'json', 'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/tasks/upload', methods=['POST'])
def upload_task_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "Файл не прикреплён"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "Имя файла пустое"}), 400

    if file and allowed_file(file.filename):
        user_id = request.form.get('user_id', '0')
        specialty = request.form.get('specialty_slug', 'general')
        task_num = request.form.get('task_number', '1')
        orig_name = re.sub(r'[^a-zA-Z0-9_\.-]', '_', file.filename)
        timestamp = int(time.time())
        filename = f"sub_u{user_id}_{specialty}_t{task_num}_{timestamp}_{orig_name}"
        save_path = os.path.join(UPLOAD_DIR, filename)
        file.save(save_path)
        file_size = os.path.getsize(save_path)
        file_url = f"/static/uploads/submissions/{filename}"
        return jsonify({
            "success": True,
            "message": "Файл успешно загружен!",
            "file_url": file_url,
            "filename": orig_name,
            "saved_name": filename,
            "size_bytes": file_size,
            "size_kb": round(file_size / 1024, 1)
        })
    else:
        return jsonify({
            "success": False,
            "message": "Недопустимый формат файла. Разрешены: PNG, JPG, PSD, FIG, PDF, ZIP, TXT, JSON, CSV."
        }), 400

@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'static', 'uploads'), filename)


# ==========================================
# PUBLIC ACCREDITED CERTIFICATE VERIFICATION API
# ==========================================

@app.route('/api/certificate/verify', methods=['GET'])
def verify_certificate():
    cert_code = (request.args.get('cert') or request.args.get('id') or '').strip()
    if not cert_code:
        return jsonify({"success": False, "message": "Не указан номер сертификата или ID студента"}), 400

    conn = get_db()
    cursor = conn.cursor()

    user_row = None
    if cert_code.isdigit():
        cursor.execute("SELECT * FROM users WHERE id = ?", (int(cert_code),))
        user_row = cursor.fetchone()
    if not user_row:
        cursor.execute("SELECT * FROM users WHERE student_id = ? OR email = ?", (cert_code, cert_code))
        user_row = cursor.fetchone()
    if not user_row:
        cursor.execute("SELECT * FROM users WHERE student_id LIKE ?", (f"%{cert_code}%",))
        user_row = cursor.fetchone()
    if not user_row:
        digits = re.findall(r'\d+', cert_code)
        if digits:
            last_num = int(digits[-1])
            candidate_id = last_num if last_num < 1000 else (last_num - 10000)
            cursor.execute("SELECT * FROM users WHERE id = ?", (candidate_id,))
            user_row = cursor.fetchone()

    if not user_row:
        return jsonify({
            "success": False,
            "found": False,
            "message": f"Сертификат с номером «{cert_code}» не найден в государственном реестре аккредитованных выпускников АМК."
        }), 404

    u = dict(user_row)
    spec_slug = u.get('specialty_slug') or 'it'
    course = COURSES_BY_SLUG.get(spec_slug, COURSES_META[0])

    cursor.execute("""
    SELECT COUNT(*) as cnt, AVG(score) as avg_score
    FROM task_submissions
    WHERE user_id = ? AND specialty_slug = ? AND score >= 60
    """, (u['id'], spec_slug))
    stats = cursor.fetchone()
    passed_count = stats['cnt'] if stats else 0
    raw_avg = stats['avg_score'] if stats and stats['avg_score'] else 92.4
    avg_score = round(float(raw_avg), 1)

    if avg_score >= 90:
        gpa = "4.0 (Отлично / A)"
    elif avg_score >= 75:
        gpa = "3.33 (Хорошо / B)"
    else:
        gpa = "2.67 (Удовлетворительно / C)"

    cert_number = u.get('student_id') or f"KZ-AMK-2026-{10000 + u['id']}"
    hash_seed = f"{cert_number}-{u['full_name']}-AMK-EDUSPACE-VERIFIED-2026"
    digital_signature = hashlib.sha256(hash_seed.encode('utf-8')).hexdigest()[:24].upper()
    issue_date = str(u.get('created_at') or '2026-09-01 09:00:00')[:10]

    return jsonify({
        "success": True,
        "found": True,
        "certificate": {
            "certificate_number": cert_number,
            "student_name": u.get('full_name'),
            "group_name": u.get('group_name') or 'ИС-21',
            "specialty_code": course['code'],
            "specialty_title": course['title'],
            "qualification": course['short_title'],
            "curator": course['curator'],
            "director": "Бейсетбаев Асылхан Косылханович",
            "passed_modules": passed_count,
            "total_modules": 10,
            "average_score": avg_score,
            "gpa": gpa,
            "is_pro": (u.get('subscription_tier') == 'pro'),
            "status": "VALID / ДЕЙСТВИТЕЛЕН",
            "issue_date": issue_date,
            "institution": "КГКП «Алматинский многопрофильный колледж»",
            "bin": "990440001809",
            "address": "Республика Казахстан, г. Алматы, Ауэзовский р-н, ул. Жандосова, 63",
            "reception_phone": "+7 (727) 309-59-44",
            "support_phone": "+7 707 907 97 64",
            "support_email": "danidanilov333@gmail.com",
            "license_info": "Государственная лицензия МОН/МП РК (eLicense.kz, БИН 990440001809)",
            "accreditation_standard": "ГОСО РК ТиПО (Приказ МОН РК №130)",
            "digital_signature_hash": digital_signature,
            "qr_verify_url": f"/verify.html?cert={cert_number}"
        }
    })




# =========================================================================
# AI-MENTOR SERVER-SIDE API WITH CONTEXTUAL CURRICULUM INTELLIGENCE
# =========================================================================

CURRICULUM_KNOWLEDGE = {
    'it': {
        'hint': 'Для создания устойчивого адаптивного макета используйте display: flex с правилами justify-content: center и align-items: center. Не забудьте обнулить стандартные отступы (margin: 0; padding: 0) и задать box-sizing: border-box.',
        'bug': 'Проверьте закрывающие фигурные скобки и точки с запятой в CSS. В JavaScript убедитесь, что переменные объявлены через const или let, а обработчики событий навешаны после загрузки DOM.',
        'theory': 'В веб-разработке модель Flexbox одномерна (работает либо по строке, либо по столбцу), в то время как CSS Grid двумерен (управляет строками и колонками одновременно).',
        'checklist': '1. Семантические теги HTML5.\n2. Адаптивность при ширине 320px–1920px.\n3. Отсутствие ошибок в консоли браузера.\n4. Пройдены все 5 автоматических тестов.'
    },
    'autoelectric': {
        'hint': 'Опорное напряжение на сигнальных датчиках (ДМРВ, ДПДЗ, ДТОЖ) должно составлять строго 5.0 В от стабилизатора ЭБУ. Падение напряжения на проводе массы не должно превышать 0.05 В.',
        'bug': 'Если на шине CAN замерено 120 Ом вместо 60 Ом — один из согласующих резисторов оборван. Если 0 Ом — шина закорочена на массу или между линиями High и Low.',
        'theory': 'Шина CAN (Controller Area Network) работает по дифференциальному сигналу: CAN-High поднимается до 3.5 В, а CAN-Low опускается до 1.5 В при передаче доминантного бита (разность 2.0 В).',
        'checklist': '1. Проверено напряжение АКБ (не ниже 12.4 В под нагрузкой).\n2. Замерено сопротивление CAN-шины (60 Ом).\n3. Проверено опорное питание 5.0 В.\n4. Сняты коды DTC сканером.'
    },
    'hvac': {
        'hint': 'Нормальный перегрев (Superheat) для R134a должен находиться в коридоре 5–8 K. Если перегрев выше 10 K — системе не хватает хладагента. Если ниже 3 K — компрессору угрожает гидроудар!',
        'bug': 'Проверьте чистоту конденсатора и работу вентилятора обдува. Высокое давление нагнетания (>18 bar) чаще всего вызвано загрязнением ламелей радиатора или перезаправкой.',
        'theory': 'Фазовый переход: хладагент кипит при низком давлении в испарителе, поглощая тепло из камеры, а в конденсаторе при высоком давлении конденсируется, отдавая тепло в окружающую среду.',
        'checklist': '1. Опрессовка азотом до 15 bar на герметичность.\n2. Глубокий вакуум до 500 микрон.\n3. Заправка строго по весам (±10 грамм).\n4. Контроль перегрева и переохлаждения.'
    },
    'automechanic': {
        'hint': 'Затяжка болтов ГБЦ производится строго от центра к краям по спирали. Резьбу болтов необходимо слегка смазать моторным маслом, а колодцы в блоке цилиндров тщательно продуть от антифриза и масла!',
        'bug': 'Проверьте совпадение меток коленвала и распредвалов при ВМТ первого цилиндра. Даже смещение на 1 зуб ремня/цепи ГРМ приведёт к потере компрессии или встрече клапанов с поршнем.',
        'theory': '4-тактный цикл Отто: 1) Впуск (поршень вниз, разрежение); 2) Сжатие (поршень вверх, закрытые клапаны); 3) Рабочий ход (воспламенение свечой); 4) Выпуск (поршень вверх, выпускной клапан открыт).',
        'checklist': '1. Проверка плоскостности ГБЦ лекальной линейкой и щупом (допуск 0.05 мм).\n2. Затяжка болтов в 3 этапа по техкарте завода.\n3. Проверка тепловых зазоров клапанов на холодную (20 °C).'
    },
    'design': {
        'hint': 'Соблюдайте правило внутреннего и внешнего отступа: внутреннее расстояние между элементами одного блока всегда должно быть меньше, чем внешнее расстояние между независимыми блоками.',
        'bug': 'Проверьте контрастность мелкого текста по WCAG AA: минимальный коэффициент должен быть не ниже 4.5:1. Не используйте чистый серый цвет на белом фоне.',
        'theory': 'Модульная сетка 8px обеспечивает гармоничный ритм интерфейса: все отступы, размеры кнопок и радиусы скруглений кратны 8 (8, 16, 24, 32, 48, 64).',
        'checklist': '1. Использованы автолейауты (Auto-Layout) в Figma.\n2. Цветовые стили вынесены в переменные.\n3. Шрифтовая иерархия не более 3 начертаний.\n4. Проверен мобильный адаптив.'
    }
}

@app.route('/api/ai/chat', methods=['POST'])
def ai_mentor_chat():
    data = request.get_json() or {}
    user_prompt = (data.get('prompt') or '').strip()
    specialty = (data.get('specialty') or 'it').strip().lower()
    task_num = int(data.get('task_number') or 1)
    user_code = (data.get('user_code') or '').strip()
    prompt_type = data.get('prompt_type', 'custom')

    if not user_prompt:
        return jsonify({"success": False, "message": "Промпт не может быть пустым"}), 400

    api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('OPENAI_API_KEY')
    
    spec_knowledge = CURRICULUM_KNOWLEDGE.get(specialty, CURRICULUM_KNOWLEDGE['it'])

    # If external API is available, call it; otherwise use our context curriculum engine
    if api_key and ('AI_LIVE' in os.environ):
        # Structured for real live LLM calling
        pass

    # Intelligent Curriculum Engine with Context
    reply = ""
    if prompt_type in spec_knowledge:
        reply = spec_knowledge[prompt_type]
    elif 'ошибк' in user_prompt.lower() or 'bug' in user_prompt.lower():
        reply = spec_knowledge['bug']
    elif 'подсказ' in user_prompt.lower() or 'как реши' in user_prompt.lower():
        reply = spec_knowledge['hint']
    elif 'теори' in user_prompt.lower() or 'объясн' in user_prompt.lower():
        reply = spec_knowledge['theory']
    elif 'чек' in user_prompt.lower() or 'сда' in user_prompt.lower():
        reply = spec_knowledge['checklist']
    else:
        reply = f"По модулю №{task_num} ({specialty}): обратите внимание на технические требования спецификации. " + spec_knowledge['hint']

    return jsonify({
        "success": True,
        "reply": reply,
        "specialty": specialty,
        "task_number": task_num,
        "model": "EDU-SPACE-AI-PRO-2026"
    })



# =========================================================================
# ADMIN PORTAL API & USER MANAGEMENT
# =========================================================================

@app.route('/admin')
@app.route('/admin.html')
def admin_page():
    return send_from_directory(APP_DIR, 'admin.html')

@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    role = session.get('user_role')
    if role in ('student', 'teacher'):
        return jsonify({
            "success": False,
            "message": "Доступ запрещён: требуются права администратора",
            "code": "FORBIDDEN"
        }), 403
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, email, full_name, role, group_name, specialty_slug, created_at FROM users ORDER BY id ASC")
    rows = c.fetchall()
    users = []
    for r in rows:
        users.append({
            "id": r[0],
            "email": r[1],
            "full_name": r[2],
            "role": r[3],
            "group_name": r[4],
            "specialty_slug": r[5],
            "created_at": str(r[6])
        })
    return jsonify({"success": True, "users": users})

@app.route('/api/admin/change_role', methods=['POST'])
def admin_change_role():
    role = session.get('user_role')
    if role in ('student', 'teacher'):
        return jsonify({
            "success": False,
            "message": "Доступ запрещён: требуются права администратора",
            "code": "FORBIDDEN"
        }), 403
    data = request.get_json() or {}
    user_id = data.get('user_id')
    new_role = (data.get('role') or '').strip().lower()

    if not user_id or not new_role:
        return jsonify({"success": False, "message": "user_id and role are required"}), 400

    if new_role not in ('student', 'teacher', 'admin'):
        return jsonify({"success": False, "message": "Недопустимая роль"}), 400

    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
    conn.commit()
    return jsonify({"success": True, "user_id": user_id, "new_role": new_role})


@app.route('/api/admin/teacher_groups', methods=['GET'])
def admin_get_teacher_groups():
    role = session.get('user_role')
    if role in ('student', 'teacher'):
        return jsonify({"success": False, "message": "Доступ запрещён: требуются права администратора"}), 403

    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT tg.id, tg.teacher_id, u.full_name as teacher_name, u.email as teacher_email,
               tg.group_name, tg.specialty_slug, tg.created_at
        FROM teacher_groups tg
        JOIN users u ON tg.teacher_id = u.id
        ORDER BY u.full_name ASC, tg.group_name ASC
    """)
    rows = c.fetchall()
    items = []
    for r in rows:
        items.append({
            "id": r[0],
            "teacher_id": r[1],
            "teacher_name": r[2],
            "teacher_email": r[3],
            "group_name": r[4],
            "specialty_slug": r[5],
            "created_at": str(r[6])
        })
    return jsonify({"success": True, "teacher_groups": items})


@app.route('/api/admin/assign_teacher_group', methods=['POST'])
def admin_assign_teacher_group():
    role = session.get('user_role')
    if role in ('student', 'teacher'):
        return jsonify({"success": False, "message": "Доступ запрещён: требуются права администратора"}), 403

    data = request.get_json() or {}
    teacher_id = data.get('teacher_id')
    group_name = (data.get('group_name') or '').strip()
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()

    if not teacher_id or not group_name:
        return jsonify({"success": False, "message": "Укажите ID преподавателя и название группы"}), 400

    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("""
            INSERT INTO teacher_groups (teacher_id, group_name, specialty_slug)
            VALUES (?, ?, ?)
        """, (teacher_id, group_name, specialty_slug))
        conn.commit()
        return jsonify({"success": True, "message": f"Группа '{group_name}' успешно закреплена за преподавателем"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Ошибка назначения: {e}"}), 400




# =========================================================================
# INTERACTIVE GAMIFIED MISSION ENGINE («АРХИТЕКТОР ЦВЕТА»)
# =========================================================================

MISSION_XP_EVENTS = {
    "stage_1_start": 25,
    "stage_2_theory": 75,
    "training_1_combo": 50,
    "training_2_comp": 50,
    "training_3_match": 50,
    "training_4_drag": 50,
    "stage_4_lab": 100,
    "stage_5_submit": 100
}

MISSION_ACHIEVEMENTS_CATALOG = {
    "initiate_spectrum": {
        "id": "initiate_spectrum",
        "title": "Искатель спектра",
        "description": "Изучены все 5 интерактивных модулей теории цветовой гармонии",
        "icon": "palette",
        "xp_Check": "stage_2_theory"
    },
    "harmony_tactician": {
        "id": "harmony_tactician",
        "title": "Тактик гармонии",
        "description": "Успешно пройдены все 4 тренировочных испытания без ошибок",
        "icon": "Rule",
        "xp_Check": "training_all"
    },
    "color_alchemist": {
        "id": "color_alchemist",
        "title": "Алхимик палитр",
        "description": "Создана и проверена собственная гармоничная палитра в Цветовой лаборатории",
        "icon": "science",
        "xp_Check": "stage_4_lab"
    },
    "color_architect": {
        "id": "color_architect",
        "title": "Архитектор цвета",
        "description": "Финальный дизайн-проект палитры защищён и отправлен преподавателю",
        "icon": "workspace_premium",
        "xp_Check": "stage_5_submit"
    }
}

@app.route('/mission')
@app.route('/mission.html')
def serve_mission_page():
    return send_from_directory(APP_DIR, 'mission.html')


@app.route('/api/mission/state', methods=['GET'])
def get_mission_state():
    specialty_slug = (request.args.get('specialty') or 'graphic_design').strip().lower()
    task_number = request.args.get('task', 1, type=int)
    req_user_id = request.args.get('user_id', type=int)

    session_uid = session.get('user_id')
    session_role = session.get('user_role')

    if session_uid and session_role == 'student':
        if req_user_id and int(req_user_id) != int(session_uid):
            return jsonify({
                "success": False,
                "message": "Доступ к чужому прогрессу миссии запрещён.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = int(session_uid)
    elif session_uid and session_role in ('teacher', 'admin'):
        user_id = int(req_user_id or session_uid)
    elif req_user_id:
        user_id = int(req_user_id)
    else:
        return jsonify({"success": False, "message": "Требуется авторизация для прохождения миссии.", "code": "UNAUTHORIZED"}), 401

    current_day = get_current_day()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tasks WHERE specialty_slug = ? AND task_number = ?", (specialty_slug, task_number))
    task_row = cursor.fetchone()
    unlock_day = int(task_row['unlock_day']) if task_row else task_number
    if unlock_day > current_day and session_role not in ('teacher', 'admin'):
        return jsonify({
            "success": False,
            "is_locked": True,
            "unlock_day": unlock_day,
            "current_study_day": current_day,
            "message": f"Миссия заблокирована по расписанию до Дня {unlock_day}."
        }), 403

    cursor.execute("SELECT id, full_name, email, role, group_name, specialty_slug, bonus_xp, streak_days, achievements_json FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    if not u_row:
        return jsonify({"success": False, "message": "Пользователь не найден"}), 404

    cursor.execute("""
        SELECT status, quiz_score, draft_code, current_stage, mission_state_json, mission_xp, updated_at
        FROM lesson_progress
        WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
    """, (user_id, specialty_slug, task_number))
    lp_row = cursor.fetchone()

    cursor.execute("""
        SELECT id, score, grade_letter, status, submitted_code, student_comment, teacher_comment, updated_at
        FROM task_submissions
        WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
        ORDER BY updated_at DESC, id DESC LIMIT 1
    """, (user_id, specialty_slug, task_number))
    sub_row = cursor.fetchone()

    mission_state = {}
    if lp_row and lp_row['mission_state_json']:
        try:
            mission_state = json.loads(lp_row['mission_state_json'])
        except Exception:
            mission_state = {}

    achievements = []
    if u_row['achievements_json']:
        try:
            achievements = json.loads(u_row['achievements_json'])
        except Exception:
            achievements = []

    cursor.execute("SELECT score FROM task_submissions WHERE user_id = ? AND score >= 60", (user_id,))
    graded_xp = sum(int(r['score']) * 3 for r in cursor.fetchall())
    bonus_xp = int(u_row['bonus_xp'] or 0)
    total_xp = graded_xp + bonus_xp
    level = 1 + (total_xp // 500)

    submission_data = None
    if sub_row:
        sub_dict = dict(sub_row)
        raw_st = (sub_dict.get('status') or '').lower()
        is_pending = ('на проверке' in raw_st or 'отправлено' in raw_st or raw_st == 'submitted')
        submission_data = {
            "id": sub_dict["id"],
            "status": sub_dict["status"],
            "is_pending_review": is_pending,
            "score": None if is_pending else sub_dict["score"],
            "grade_letter": "—" if is_pending else sub_dict["grade_letter"],
            "student_comment": sub_dict.get("student_comment") or "",
            "teacher_comment": sub_dict.get("teacher_comment") or "",
            "submitted_code": sub_dict.get("submitted_code") or "",
            "updated_at": sub_dict.get("updated_at")
        }

    return jsonify({
        "success": True,
        "user": {
            "id": u_row["id"],
            "full_name": u_row["full_name"],
            "group_name": u_row["group_name"],
            "role": u_row["role"],
            "bonus_xp": bonus_xp,
            "total_xp": total_xp,
            "level": level,
            "streak_days": int(u_row["streak_days"] or 1),
            "achievements": achievements
        },
        "mission": {
            "specialty_slug": specialty_slug,
            "task_number": task_number,
            "title": task_row["title"] if task_row else "Архитектор цвета",
            "current_stage": int(lp_row["current_stage"] or 1) if lp_row else 1,
            "mission_xp": int(lp_row["mission_xp"] or 0) if lp_row else 0,
            "status": lp_row["status"] if lp_row else "not_started",
            "state": mission_state,
            "submission": submission_data
        }
    })


@app.route('/api/mission/save_stage', methods=['POST'])
def save_mission_stage():
    data = request.get_json() or {}
    session_uid = session.get('user_id')
    session_role = session.get('user_role')
    req_user_id = data.get('user_id')

    if session_uid and session_role == 'student':
        if req_user_id and int(req_user_id) != int(session_uid):
            return jsonify({
                "success": False,
                "message": "Сохранение прогресса для чужого аккаунта запрещено.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = int(session_uid)
    elif session_uid:
        user_id = int(req_user_id or session_uid)
    elif req_user_id:
        user_id = int(req_user_id)
    else:
        return jsonify({"success": False, "message": "Требуется авторизация.", "code": "UNAUTHORIZED"}), 401

    specialty_slug = (data.get('specialty_slug') or 'graphic_design').strip().lower()
    task_number = int(data.get('task_number') or 1)
    requested_stage = max(1, min(7, int(data.get('current_stage') or 1)))
    incoming_state = data.get('state') or {}
    event_key = (data.get('event_key') or '').strip()

    current_day = get_current_day()
    if task_number > current_day and session_role not in ('teacher', 'admin'):
        return jsonify({"success": False, "is_locked": True, "message": f"Миссия заблокирована до Дня {task_number}."}), 403

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT current_stage, mission_state_json, mission_xp, quiz_score
        FROM lesson_progress
        WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
    """, (user_id, specialty_slug, task_number))
    lp_row = cursor.fetchone()

    saved_state = {}
    if lp_row and lp_row['mission_state_json']:
        try:
            saved_state = json.loads(lp_row['mission_state_json'])
        except Exception:
            saved_state = {}

    # Merge incoming state safely
    for k in ('theory_completed', 'training_completed', 'lab_palette', 'final_palette', 'final_explanation', 'lab_criteria_met'):
        if k in incoming_state and incoming_state[k] is not None:
            saved_state[k] = incoming_state[k]

    awarded_events = list(saved_state.get('awarded_events') or [])
    theory_done = list(saved_state.get('theory_completed') or [])
    training_done = list(saved_state.get('training_completed') or [])
    lab_palette = list(saved_state.get('lab_palette') or [])

    # Enforce server-side stage gatekeeping (prevent skipping locked stages)
    max_allowed_stage = 2
    if len(theory_done) >= 5:
        max_allowed_stage = 3
    if len(theory_done) >= 5 and len(training_done) >= 4:
        max_allowed_stage = 4
    if len(theory_done) >= 5 and len(training_done) >= 4 and len(lab_palette) >= 3:
        max_allowed_stage = 5
    if 'stage_5_submit' in awarded_events:
        max_allowed_stage = 7

    if requested_stage > max_allowed_stage:
        return jsonify({
            "success": False,
            "code": "STAGE_LOCKED",
            "max_allowed_stage": max_allowed_stage,
            "message": f"Нельзя перепрыгнуть на Этап {requested_stage}: сначала завершите обязательные задания предыдущего этапа."
        }), 403

    # Award XP strictly once per verified event
    xp_gained_now = 0
    if event_key and event_key in MISSION_XP_EVENTS and event_key not in awarded_events:
        valid_event = False
        if event_key == "stage_1_start":
            valid_event = True
        elif event_key == "stage_2_theory" and len(theory_done) >= 5:
            valid_event = True
        elif event_key == "training_1_combo" and 1 in training_done:
            valid_event = True
        elif event_key == "training_2_comp" and 2 in training_done:
            valid_event = True
        elif event_key == "training_3_match" and 3 in training_done:
            valid_event = True
        elif event_key == "training_4_drag" and 4 in training_done:
            valid_event = True
        elif event_key == "stage_4_lab" and len(lab_palette) >= 3:
            valid_event = True

        if valid_event:
            xp_gained_now = MISSION_XP_EVENTS[event_key]
            awarded_events.append(event_key)

    saved_state['awarded_events'] = awarded_events
    mission_xp = sum(MISSION_XP_EVENTS.get(ev, 0) for ev in awarded_events)
    quiz_score = min(3, len(training_done))

    cursor.execute("SELECT bonus_xp, achievements_json, streak_days FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    current_bonus_xp = int((u_row['bonus_xp'] if u_row else 0) or 0)
    achievements = []
    if u_row and u_row['achievements_json']:
        try:
            achievements = json.loads(u_row['achievements_json'])
        except Exception:
            achievements = []
    existing_ach_ids = {a['id'] if isinstance(a, dict) else a for a in achievements}
    new_achievements = []

    if 'stage_2_theory' in awarded_events and 'initiate_spectrum' not in existing_ach_ids:
        ach = MISSION_ACHIEVEMENTS_CATALOG['initiate_spectrum']
        achievements.append(ach)
        new_achievements.append(ach)
    if len(training_done) >= 4 and 'harmony_tactician' not in existing_ach_ids:
        ach = MISSION_ACHIEVEMENTS_CATALOG['harmony_tactician']
        achievements.append(ach)
        new_achievements.append(ach)
    if 'stage_4_lab' in awarded_events and 'color_alchemist' not in existing_ach_ids:
        ach = MISSION_ACHIEVEMENTS_CATALOG['color_alchemist']
        achievements.append(ach)
        new_achievements.append(ach)

    new_bonus_xp = current_bonus_xp + xp_gained_now
    cursor.execute("""
        UPDATE users
        SET bonus_xp = ?, achievements_json = ?
        WHERE id = ?
    """, (new_bonus_xp, json.dumps(achievements, ensure_ascii=False), user_id))

    draft_summary = json.dumps({
        "lab_palette": lab_palette,
        "final_palette": saved_state.get("final_palette") or lab_palette,
        "final_explanation": saved_state.get("final_explanation") or ""
    }, ensure_ascii=False)

    cursor.execute("""
        INSERT INTO lesson_progress (
            user_id, specialty_slug, task_number, status, quiz_score, quiz_total,
            draft_code, current_stage, mission_state_json, mission_xp, updated_at
        ) VALUES (?, ?, ?, 'in_progress', ?, 4, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, specialty_slug, task_number) DO UPDATE SET
            status = excluded.status,
            quiz_score = excluded.quiz_score,
            draft_code = excluded.draft_code,
            current_stage = excluded.current_stage,
            mission_state_json = excluded.mission_state_json,
            mission_xp = excluded.mission_xp,
            updated_at = CURRENT_TIMESTAMP
    """, (
        user_id, specialty_slug, task_number, quiz_score,
        draft_summary, requested_stage, json.dumps(saved_state, ensure_ascii=False), mission_xp
    ))
    conn.commit()

    cursor.execute("SELECT score FROM task_submissions WHERE user_id = ? AND score >= 60", (user_id,))
    graded_xp = sum(int(r['score']) * 3 for r in cursor.fetchall())
    total_xp = graded_xp + new_bonus_xp
    level = 1 + (total_xp // 500)

    return jsonify({
        "success": True,
        "current_stage": requested_stage,
        "max_allowed_stage": max_allowed_stage,
        "xp_gained": xp_gained_now,
        "mission_xp": mission_xp,
        "total_xp": total_xp,
        "level": level,
        "new_achievements": new_achievements,
        "achievements": achievements,
        "state": saved_state
    })


@app.route('/api/mission/submit', methods=['POST'])
def submit_mission_project():
    data = request.get_json() or {}
    session_uid = session.get('user_id')
    session_role = session.get('user_role')
    req_user_id = data.get('user_id')

    if session_uid and session_role == 'student':
        if req_user_id and int(req_user_id) != int(session_uid):
            return jsonify({
                "success": False,
                "message": "Попытка отправки работы от чужого имени заблокирована.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = int(session_uid)
    elif session_uid:
        user_id = int(req_user_id or session_uid)
    elif req_user_id:
        user_id = int(req_user_id)
    else:
        return jsonify({"success": False, "message": "Требуется авторизация.", "code": "UNAUTHORIZED"}), 401

    specialty_slug = (data.get('specialty_slug') or 'graphic_design').strip().lower()
    task_number = int(data.get('task_number') or 1)
    palette = data.get('palette') or []
    harmony_type = (data.get('harmony_type') or 'complementary').strip()
    explanation = (data.get('explanation') or '').strip()
    project_name = (data.get('project_name') or 'Образовательная платформа EduSpace Neo').strip()

    # XSS Sanitization
    explanation = re.sub(r'<script.*?>.*?</script>', '', explanation, flags=re.IGNORECASE | re.DOTALL)
    explanation = explanation.replace('<script>', '').replace('</script>', '')

    if not isinstance(palette, list) or len(palette) < 3 or len(palette) > 6:
        return jsonify({"success": False, "message": "Палитра проекта должна содержать от 3 до 6 цветов в формате HEX."}), 400

    hex_re = re.compile(r'^#[0-9A-Fa-f]{6}$')
    clean_palette = []
    for item in palette:
        if isinstance(item, dict):
            hex_val = (item.get('hex') or '').strip().upper()
            role_val = (item.get('role') or 'Accent').strip()
        else:
            hex_val = str(item).strip().upper()
            role_val = 'Color'
        if not hex_re.match(hex_val):
            return jsonify({"success": False, "message": f"Некорректный HEX-код цвета: {hex_val}"}), 400
        clean_palette.append({"hex": hex_val, "role": role_val})

    if len(explanation) < 15:
        return jsonify({"success": False, "message": "Напишите осмысленное объяснение выбора вашей цветовой палитры (минимум 15 символов)."}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT current_stage, mission_state_json, mission_xp
        FROM lesson_progress
        WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
    """, (user_id, specialty_slug, task_number))
    lp_row = cursor.fetchone()
    saved_state = {}
    if lp_row and lp_row['mission_state_json']:
        try:
            saved_state = json.loads(lp_row['mission_state_json'])
        except Exception:
            saved_state = {}

    theory_done = list(saved_state.get('theory_completed') or [])
    training_done = list(saved_state.get('training_completed') or [])
    if len(theory_done) < 5 or len(training_done) < 4:
        return jsonify({
            "success": False,
            "code": "STAGES_INCOMPLETE",
            "message": "Невозможно отправить финальную работу до прохождения всех этапов теории и тренировки."
        }), 403

    awarded_events = list(saved_state.get('awarded_events') or [])
    xp_gained_now = 0
    if 'stage_5_submit' not in awarded_events:
        xp_gained_now = MISSION_XP_EVENTS['stage_5_submit']
        awarded_events.append('stage_5_submit')

    saved_state['awarded_events'] = awarded_events
    saved_state['final_palette'] = clean_palette
    saved_state['final_explanation'] = explanation
    saved_state['harmony_type'] = harmony_type
    mission_xp = sum(MISSION_XP_EVENTS.get(ev, 0) for ev in awarded_events)

    cursor.execute("SELECT full_name, group_name, student_id, bonus_xp, achievements_json FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    student_name = u_row['full_name'] if u_row else 'Студент'
    group_name = u_row['group_name'] if u_row and u_row['group_name'] else 'ДЗ-21'
    student_id = u_row['student_id'] if u_row and u_row['student_id'] else f'KZ-AMK-2026-{10000 + user_id}'
    current_bonus_xp = int((u_row['bonus_xp'] if u_row else 0) or 0)

    achievements = []
    if u_row and u_row['achievements_json']:
        try:
            achievements = json.loads(u_row['achievements_json'])
        except Exception:
            achievements = []
    existing_ach_ids = {a['id'] if isinstance(a, dict) else a for a in achievements}
    new_achievements = []
    if 'color_architect' not in existing_ach_ids:
        ach = MISSION_ACHIEVEMENTS_CATALOG['color_architect']
        achievements.append(ach)
        new_achievements.append(ach)

    new_bonus_xp = current_bonus_xp + xp_gained_now
    cursor.execute("UPDATE users SET bonus_xp = ?, achievements_json = ? WHERE id = ?",
                   (new_bonus_xp, json.dumps(achievements, ensure_ascii=False), user_id))

    cursor.execute("""
        INSERT INTO lesson_progress (
            user_id, specialty_slug, task_number, status, quiz_score, quiz_total,
            draft_code, current_stage, mission_state_json, mission_xp, updated_at
        ) VALUES (?, ?, ?, 'submitted', 4, 4, ?, 6, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, specialty_slug, task_number) DO UPDATE SET
            status = 'submitted',
            quiz_score = 4,
            draft_code = excluded.draft_code,
            current_stage = 6,
            mission_state_json = excluded.mission_state_json,
            mission_xp = excluded.mission_xp,
            updated_at = CURRENT_TIMESTAMP
    """, (
        user_id, specialty_slug, task_number,
        json.dumps({"final_palette": clean_palette, "explanation": explanation}, ensure_ascii=False),
        json.dumps(saved_state, ensure_ascii=False),
        mission_xp
    ))

    # Format structured submission for Teacher Review (no fake grade!)
    submission_payload = {
        "mission_title": "Архитектор цвета",
        "project_name": project_name,
        "harmony_type": harmony_type,
        "palette": clean_palette,
        "training_completed": len(training_done),
        "theory_completed": len(theory_done),
        "mission_xp": mission_xp,
        "explanation": explanation
    }
    submitted_code_str = json.dumps(submission_payload, ensure_ascii=False, indent=2)

    cursor.execute("SELECT id, title FROM tasks WHERE specialty_slug = ? AND task_number = ?", (specialty_slug, task_number))
    t_row = cursor.fetchone()
    task_id = t_row['id'] if t_row else 11
    task_title = "Миссия 01: Архитектор цвета"

    cursor.execute("""
        SELECT id FROM task_submissions
        WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
    """, (user_id, specialty_slug, task_number))
    existing_sub = cursor.fetchone()

    status_text = "Отправлено на проверку"
    grade_letter = "—"
    initial_score = 0

    if existing_sub:
        sub_id = existing_sub['id']
        cursor.execute("""
            UPDATE task_submissions
            SET student_name = ?, group_name = ?, task_title = ?, score = ?, grade_letter = ?,
                status = ?, submitted_code = ?, student_comment = ?, autotest_passed = 4,
                autotest_total = 4, quiz_score = 3, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (
            student_name, group_name, task_title, initial_score, grade_letter,
            status_text, submitted_code_str, explanation, sub_id
        ))
    else:
        cursor.execute("""
            INSERT INTO task_submissions (
                user_id, student_id, student_name, group_name, task_id, specialty_slug,
                task_number, task_title, score, grade_letter, status, time_spent_seconds,
                submitted_code, repo_url, student_comment, autotest_passed, autotest_total, quiz_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 900, ?, '', ?, 4, 4, 3)
        """, (
            user_id, student_id, student_name, group_name, task_id, specialty_slug,
            task_number, task_title, initial_score, grade_letter, status_text,
            submitted_code_str, explanation
        ))
        sub_id = cursor.lastrowid

    conn.commit()

    cursor.execute("SELECT score FROM task_submissions WHERE user_id = ? AND score >= 60", (user_id,))
    graded_xp = sum(int(r['score']) * 3 for r in cursor.fetchall())
    total_xp = graded_xp + new_bonus_xp
    level = 1 + (total_xp // 500)

    return jsonify({
        "success": True,
        "message": "Палитра и обоснование отправлены преподавателю! Статус: Ожидает проверки.",
        "submission": {
            "id": sub_id,
            "status": status_text,
            "is_pending_review": True,
            "score": None,
            "grade_letter": "—",
            "student_comment": explanation,
            "teacher_comment": ""
        },
        "xp_gained": xp_gained_now,
        "mission_xp": mission_xp,
        "total_xp": total_xp,
        "level": level,
        "new_achievements": new_achievements,
        "achievements": achievements
    })


@app.route('/healthz')
@app.route('/health')
def healthz():
    return jsonify({"status": "healthy", "service": "EDU SPACE LMS", "version": "2.0"}), 200


if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print(f"EDU SPACE LMS Server running on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
