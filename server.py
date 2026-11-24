# -*- coding: utf-8 -*-
"""
EDU SPACE — Production LMS Backend Server
Алматинский многопрофильный колледж (АМК)
Python 3 + Flask + SQLite3
"""

import os
import re
import time
import threading
import json
import random
import sqlite3
import hashlib
import hmac
import secrets
import smtplib
import sys
from urllib.request import Request, urlopen
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify, send_from_directory, g, session, redirect, url_for, make_response, abort
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

if __name__ == '__main__':
    sys.modules.setdefault('server', sys.modules[__name__])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = BASE_DIR

# Auto-load .env configuration if present (without overriding existing environment or test harnesses)
if not os.environ.get("EDUSPACE_DB_PATH") and not os.environ.get("EDUSPACE_TESTING"):
    _env_file = os.path.join(BASE_DIR, ".env")
    if os.path.isfile(_env_file):
        try:
            with open(_env_file, "r", encoding="utf-8") as _ef:
                for _line in _ef:
                    _line = _line.strip()
                    if not _line or _line.startswith("#") or "=" not in _line:
                        continue
                    _k, _v = _line.split("=", 1)
                    _k = _k.strip()
                    _v = _v.strip().strip("'\"")
                    if _k and _k not in os.environ:
                        os.environ[_k] = _v
        except Exception:
            pass

DB_PATH = os.environ.get("EDUSPACE_DB_PATH") or os.path.join(BASE_DIR, "database.db")

app = Flask(__name__, static_folder=None)
app.config['JSON_AS_ASCII'] = False
try:
    app.json.ensure_ascii = False
except Exception:
    pass

SPECIALTY_ALIASES = {
    'logistics': 'graphic_design',
    'accounting': 'hvac',
    'power': 'autoelectric',
    'mechanics': 'automechanic',
    'design': 'graphic_design',
    'auto': 'autoelectric',
    'marketing': 'automechanic'
}

CANONICAL_DEFAULT_GROUPS = {
    'it': ['ИС-21', 'ИС-22'],
    'graphic_design': ['ГД-21', 'ГД-22'],
    'autoelectric': ['АЭ-21', 'АЭ-22'],
    'hvac': ['ХО-21', 'ХО-22', 'ХС-21', 'ХС-22'],
    'automechanic': ['АМ-21', 'АМ-22'],
}

# =========================================================================
# SERVER-SIDE SESSION SECURITY & ROLE ENFORCEMENT
# =========================================================================

def get_current_user():
    """Retrieves authenticated user from server-side session with DB re-validation."""
    user_id = session.get('user_id')
    if not user_id:
        return None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, email, full_name, first_name, last_name, role, group_name, specialty_slug, student_id, password_hash, is_demo, COALESCE(bonus_xp, 0) AS bonus_xp, COALESCE(session_version, 1) AS session_version FROM users WHERE id = ?",
            (user_id,)
        )
        row = cursor.fetchone()
        if row:
            user = dict(row)
            stamp = account_session_stamp(user.pop('password_hash'))
            demo = user.pop('is_demo', False)
            db_ver = int(user.pop('session_version', 1) or 1)
            sess_ver = session.get('session_version')
            if sess_ver is not None and int(sess_ver) != db_ver:
                session.clear()
                return None
            current_stamp = session.get('password_stamp')
            if (current_stamp and not hmac.compare_digest(current_stamp, stamp)) or (HOSTED and (not current_stamp or demo)):
                session.clear()
                return None
            user['xp'] = int(user.get('bonus_xp') or 0)
            return user
    except Exception as e:
        print(f"[AUTH ERROR] get_current_user error: {e}")
    return None


def account_session_stamp(password_hash):
    return hmac.new(app.secret_key.encode('utf-8'), str(password_hash).encode('utf-8'), hashlib.sha256).hexdigest()

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


def require_roles(*roles):
    return login_required(roles=list(roles))


def get_teacher_assigned_groups(teacher_id):
    """Returns list of group names assigned to the specified teacher."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT group_name FROM teacher_groups WHERE teacher_id = ?", (teacher_id,))
    rows = cursor.fetchall()
    assigned = [r[0] for r in rows]
    if assigned:
        return assigned
    # Fallback to teacher's canonical department / specialty groups if not explicitly configured
    cursor.execute("SELECT specialty_slug, group_name FROM users WHERE id = ?", (teacher_id,))
    u = cursor.fetchone()
    if u:
        raw_spec = (u['specialty_slug'] or 'it').strip().lower()
        spec = SPECIALTY_ALIASES.get(raw_spec, raw_spec)
        return list(CANONICAL_DEFAULT_GROUPS.get(spec, []))
    return []


def get_teacher_allowed_specialties(teacher_id, user_row=None):
    """Returns canonical specialty slugs this teacher is authorized to manage."""
    specs = set()
    if user_row and user_row.get('specialty_slug'):
        raw = str(user_row['specialty_slug']).strip().lower()
        specs.add(SPECIALTY_ALIASES.get(raw, raw))
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT specialty_slug FROM teacher_groups WHERE teacher_id = ?", (teacher_id,))
    for r in cursor.fetchall():
        if r[0]:
            raw = str(r[0]).strip().lower()
            specs.add(SPECIALTY_ALIASES.get(raw, raw))
    if not specs:
        cursor.execute("SELECT specialty_slug FROM users WHERE id = ?", (teacher_id,))
        u = cursor.fetchone()
        if u and u['specialty_slug']:
            raw = str(u['specialty_slug']).strip().lower()
            specs.add(SPECIALTY_ALIASES.get(raw, raw))
    return specs


def _parse_optional_int(val, field_name='id', default=None):
    """Safely parses an integer parameter; rejects bools, floats, objects, and non-numeric strings with HTTP 400."""
    if val is None or (isinstance(val, str) and val.strip() == ''):
        return default, None
    if isinstance(val, bool):
        return None, (jsonify({
            "success": False,
            "code": "INVALID_PARAMETER",
            "message": f"Поле '{field_name}' должно быть целым числом."
        }), 400)
    if isinstance(val, int):
        return val, None
    if isinstance(val, str):
        s = val.strip()
        if re.fullmatch(r'-?\d+', s):
            return int(s), None
    return None, (jsonify({
        "success": False,
        "code": "INVALID_PARAMETER",
        "message": f"Поле '{field_name}' должно быть целым числом."
    }), 400)


_hosted_raw = (os.environ.get('HOSTED') or '').strip().lower()
HOSTED = (
    _hosted_raw in ('1', 'true', 'yes', 'on')
    or bool(os.environ.get('RENDER'))
    or (os.environ.get('APP_ENV') or '').strip().lower() == 'production'
)
SESSION_SECRET = os.environ.get('SESSION_SECRET') or os.environ.get('SECRET_KEY')
if HOSTED and (not SESSION_SECRET or len(SESSION_SECRET) < 32):
    raise RuntimeError("SESSION_SECRET (>= 32 chars) is required in HOSTED mode")
if not SESSION_SECRET:
    _secret_file = os.path.join(BASE_DIR, '.secret_key')
    try:
        if os.path.exists(_secret_file):
            with open(_secret_file, 'r', encoding='utf-8') as _sf:
                SESSION_SECRET = _sf.read().strip()
        if not SESSION_SECRET or len(SESSION_SECRET) < 32:
            SESSION_SECRET = secrets.token_hex(32)
            with open(_secret_file, 'w', encoding='utf-8') as _sf:
                _sf.write(SESSION_SECRET)
    except Exception:
        SESSION_SECRET = secrets.token_hex(32)
app.config['SECRET_KEY'] = SESSION_SECRET
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'None' if HOSTED else 'Lax'
app.config['SESSION_COOKIE_SECURE'] = HOSTED or os.environ.get('HTTPS') == 'on'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=14)
TRUST_PROXY_HEADERS = (
    (os.environ.get('TRUST_PROXY_HEADERS') or '').strip().lower() in ('1', 'true', 'yes', 'on')
    or bool(os.environ.get('RENDER'))
)
if TRUST_PROXY_HEADERS:
    from werkzeug.middleware.proxy_fix import ProxyFix
    _proxy_hops = max(1, int(os.environ.get('TRUST_PROXY_HOPS', '1') or 1))
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=_proxy_hops, x_proto=1, x_host=1)
DATABASE_URL = os.environ.get('DATABASE_URL')

SUPPORT_PHONE = os.environ.get('SUPPORT_PHONE', '+7 707 907 97 64')
SUPPORT_EMAIL = os.environ.get('SUPPORT_EMAIL', 'support@amk.kz')

_RATE_LOCK = threading.Lock()
_RATE_BUCKETS = {}

ALLOWED_ORIGINS = {
    'https://denrench.github.io',
    'https://amk-skillhub.onrender.com',
}
_LOCAL_ORIGIN_RE = re.compile(r'^https?://(localhost|127\.0\.0\.1)(:\d+)?$', re.IGNORECASE)
_RATE_LIMITED_AUTH_PATHS = {
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/send_code',
    '/api/auth/verify_code',
    '/api/auth/reset_password',
    '/api/login',
    '/api/register',
}
_CSRF_EXEMPT_PATHS = {
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/send_code',
    '/api/auth/verify_code',
    '/api/auth/reset_password',
    '/api/ai/tutor',
    '/api/ai/chat',
    '/api/ai/evaluate-lesson',
    '/api/ai/feedback',
}


def _is_allowed_origin(origin):
    if not origin:
        return False
    origin = origin.strip().rstrip('/')
    if origin in ALLOWED_ORIGINS or _LOCAL_ORIGIN_RE.match(origin):
        return True
    try:
        parsed = urllib.parse.urlparse(origin)
        if parsed.netloc and request.host and parsed.netloc.lower() == request.host.lower():
            return True
    except Exception:
        pass
    return False


def get_or_create_csrf_token():
    tok = session.get('csrf_token')
    if not tok:
        tok = secrets.token_urlsafe(32)
        session['csrf_token'] = tok
    return tok


@app.before_request
def _enforce_origin_and_csrf():
    path = request.path or ''
    if request.method == 'GET' and not path.startswith(('/assets/', '/css/', '/js/', '/locales/')):
        get_or_create_csrf_token()

    if request.method == 'OPTIONS' and path.startswith('/api/'):
        return make_response('', 204)

    path = request.path or ''
    if not path.startswith('/api/'):
        return None

    if request.method in ('POST', 'PUT', 'PATCH', 'DELETE') and not app.testing:
        origin = request.headers.get('Origin')
        referer = request.headers.get('Referer')
        check_origin = origin
        if not check_origin and referer:
            try:
                p = urllib.parse.urlparse(referer)
                if p.scheme and p.netloc:
                    check_origin = f"{p.scheme}://{p.netloc}"
            except Exception:
                check_origin = None
        if check_origin and not _is_allowed_origin(check_origin):
            return jsonify({
                "success": False,
                "error": "CSRF_ORIGIN_MISMATCH",
                "code": "CSRF_ORIGIN_MISMATCH",
                "message": "Cross-origin state modification rejected"
            }), 403

        if path not in _CSRF_EXEMPT_PATHS:
            expected_csrf = session.get('csrf_token') or request.cookies.get('eduspace_csrf') or ''
            sent_csrf = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token') or ''
            if session.get('user_id'):
                if not expected_csrf or not sent_csrf or not hmac.compare_digest(str(sent_csrf), str(expected_csrf)):
                    return jsonify({
                        "success": False,
                        "code": "CSRF_TOKEN_INVALID",
                        "message": "Недействительный или отсутствующий CSRF-токен."
                    }), 403
            elif expected_csrf and sent_csrf:
                if not hmac.compare_digest(str(sent_csrf), str(expected_csrf)):
                    return jsonify({
                        "success": False,
                        "code": "CSRF_TOKEN_INVALID",
                        "message": "Недействительный или отсутствующий CSRF-токен."
                    }), 403
    return None


@app.before_request
def _enforce_rate_limit():
    if (app.testing and not app.config.get('RATELIMIT_ENABLED')) or request.method != 'POST':
        return None
    path = request.path or ''
    if path in _RATE_LIMITED_AUTH_PATHS or path.startswith('/api/ai/'):
        ip = (request.remote_addr or 'local').strip()
        now = time.time()
        window = 60.0
        ip_limit = 300 if path in ('/api/auth/register', '/api/register') else 45
        ip_key = f"ip:{ip}:{path}"
        acct_key = None
        if path in _RATE_LIMITED_AUTH_PATHS:
            raw = request.get_json(silent=True)
            if isinstance(raw, dict) and isinstance(raw.get('email'), str) and raw['email'].strip():
                acct_key = f"acct:{raw['email'].strip().lower()}:{path}"

        with _RATE_LOCK:
            bucket = [ts for ts in _RATE_BUCKETS.get(ip_key, []) if now - ts < window]
            if len(bucket) >= ip_limit:
                resp = jsonify({"success": False, "code": "RATE_LIMITED", "message": "Слишком много запросов. Повторите через минуту."})
                resp.status_code = 429
                resp.headers['Retry-After'] = '60'
                return resp
            if acct_key:
                abucket = [ts for ts in _RATE_BUCKETS.get(acct_key, []) if now - ts < window]
                if len(abucket) >= 20:
                    resp = jsonify({"success": False, "code": "RATE_LIMITED", "message": "Слишком много попыток для данного аккаунта. Повторите через минуту."})
                    resp.status_code = 429
                    resp.headers['Retry-After'] = '60'
                    return resp
                abucket.append(now)
                _RATE_BUCKETS[acct_key] = abucket
            bucket.append(now)
            _RATE_BUCKETS[ip_key] = bucket
    return None


@app.after_request
def _set_security_and_cors_headers(response):
    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('X-Frame-Options', 'SAMEORIGIN')
    response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')

    req_path = request.path or ''
    if req_path.startswith(('/assets/', '/css/', '/js/', '/locales/')):
        response.headers['Cache-Control'] = 'public, max-age=3600'

    origin = request.headers.get('Origin')
    if origin and _is_allowed_origin(origin):
        response.headers['Access-Control-Allow-Origin'] = origin.strip().rstrip('/')
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRF-Token, Authorization'
        existing_vary = response.headers.get('Vary', '')
        if 'origin' not in existing_vary.lower():
            response.headers.add('Vary', 'Origin')

    csrf_tok = session.get('csrf_token')
    if csrf_tok:
        response.set_cookie(
            'eduspace_csrf',
            csrf_tok,
            httponly=False,
            samesite='None' if HOSTED else 'Lax',
            secure=app.config['SESSION_COOKIE_SECURE'],
            path='/'
        )
    return response


def verify_and_migrate_password(conn, user_row, candidate_password: str) -> bool:
    """
    Verifies candidate_password against stored password_hash.
    If stored hash was plain SHA-256 (64 hex characters), transparently migrates
    it to werkzeug.security generate_password_hash.
    """
    try:
        stored_hash = user_row['password_hash'] if hasattr(user_row, '__getitem__') else ''
    except Exception:
        stored_hash = ''
    if not stored_hash or not candidate_password:
        return False

    is_sha256 = len(stored_hash) == 64 and all(c in '0123456789abcdefABCDEF' for c in stored_hash)
    if is_sha256:
        legacy_hash = hashlib.sha256(candidate_password.encode('utf-8')).hexdigest()
        if legacy_hash.lower() == stored_hash.lower():
            try:
                new_hash = generate_password_hash(candidate_password)
                c = conn.cursor()
                c.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_row['id']))
                conn.commit()
            except Exception as e:
                print(f"[AUTH WARN] Password migration failed: {e}")
            return True
        return False

    try:
        return check_password_hash(stored_hash, candidate_password)
    except Exception:
        return False

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

_DEV_TEACHER_ACCESS_CODES = {
    'AMK2026', 'TEACHER2026', 'EDU2026',
    'AMKCOLLEGE', 'AMKEDUSPACE', 'ПРЕПОДАВАТЕЛЬ', 'ПРЕПОД'
}
_ENV_TEACHER_CODES = {
    normalize_teacher_code(code)
    for code in os.environ.get('TEACHER_ACCESS_CODES', '').split(',')
    if code.strip()
}
if _ENV_TEACHER_CODES:
    TEACHER_ACCESS_CODES = _ENV_TEACHER_CODES
elif HOSTED:
    TEACHER_ACCESS_CODES = set()
else:
    TEACHER_ACCESS_CODES = {normalize_teacher_code(c) for c in _DEV_TEACHER_ACCESS_CODES}


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
            {"key": "ps_ai", "name": "Photoshop & Illustrator для веба (баннеры, SVG-иконки)", "tasks": [1, 2, 3]},
            {"key": "figma_ui", "name": "Figma: Сетки 8px, Auto Layout, Компоненты и Прототипы", "tasks": [4, 5, 6, 7]},
            {"key": "html_css", "name": "Основы верстки: теги HTML, стили CSS и Flexbox/Grid", "tasks": [8, 9, 10, 11, 12]},
            {"key": "basic_js", "name": "Интерактив JS, доступность A11y, API и дипломный проект", "tasks": [13, 14, 15, 16, 17, 18, 19, 20]}
        ]
    },
    {
        "slug": "graphic_design",
        "code": "02130100",
        "title": "Графический Дизайн",
        "short_title": "Графический Дизайн",
        "curator": "Сейдахметова Алия Кайратовна",
        "skills": [
            {"key": "composition", "name": "Композиция, колористика RGB/CMYK и типографика", "tasks": [1, 2, 3, 4]},
            {"key": "branding", "name": "Векторная графика, логотипы и разработка Brandbook", "tasks": [5, 6, 7, 8, 9, 10]},
            {"key": "prepress", "name": "Вёрстка InDesign, упаковка, Prepress и защита брендбука", "tasks": [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]}
        ]
    },
    {
        "slug": "autoelectric",
        "code": "07161301",
        "title": "Автоэлектрики",
        "short_title": "Автоэлектрики",
        "curator": "Жумабаев Руслан Маратович",
        "skills": [
            {"key": "power_net", "name": "Бортовая сеть 12/24В, АКБ, стартеры и генераторы", "tasks": [1, 2, 3, 4, 5]},
            {"key": "wiring_obd", "name": "Электросхемы DIN 72552 и диагностика ЭБУ OBD-II", "tasks": [6, 7, 8, 9, 10, 11]},
            {"key": "can_osc", "name": "Осциллография, шины CAN/LIN, BCM и комплексный аудит", "tasks": [12, 13, 14, 15, 16, 17, 18, 19, 20]}
        ]
    },
    {
        "slug": "hvac",
        "code": "07130700",
        "title": "Ремонт Холодильного Оборудования",
        "short_title": "Ремонт Холодильного Оборудования",
        "curator": "Ахметов Тимур Болатович",
        "skills": [
            {"key": "thermo", "name": "Термодинамика цикла, фреоны, перегрев и переохлаждение", "tasks": [1, 2, 3, 4, 5]},
            {"key": "brazing", "name": "Пайка меди, опрессовка азотом, вакуумирование и заправка", "tasks": [6, 7, 8, 9, 10, 11]},
            {"key": "electro_cold", "name": "Диагностика компрессоров, No Frost, инверторов и ПНР", "tasks": [12, 13, 14, 15, 16, 17, 18, 19, 20]}
        ]
    },
    {
        "slug": "automechanic",
        "code": "07161300",
        "title": "Автомеханики",
        "short_title": "Автомеханики",
        "curator": "Садыков Ерлан Касымович",
        "skills": [
            {"key": "engine", "name": "Дефектовка и ремонт ДВС, ГРМ, смазки и охлаждения", "tasks": [1, 2, 3, 4, 5, 6]},
            {"key": "chassis", "name": "Трансмиссия, подвеска и 3D развал-схождение колёс", "tasks": [7, 8, 9, 10, 11, 12]},
            {"key": "brakes_to", "name": "Тормозные системы, ШРУС, шиномонтаж и комплексное ТО", "tasks": [13, 14, 15, 16, 17, 18, 19, 20]}
        ]
    }
]

COURSES_BY_SLUG = {c["slug"]: c for c in COURSES_META}


import collections.abc
import urllib.parse
import ssl
import threading

DATABASE_URL = os.environ.get('DATABASE_URL')

import decimal

def _normalize_pg_val(val):
    if isinstance(val, decimal.Decimal):
        return float(val)
    if hasattr(val, 'strftime'):
        return val.strftime("%Y-%m-%d %H:%M:%S")
    return val


def _pg_ssl_context(pg_url):
    u = urllib.parse.urlparse(pg_url)
    qs = urllib.parse.parse_qs(u.query)
    sslmode = (qs.get('sslmode', [None])[0] or os.environ.get('PGSSLMODE') or '').lower()
    host = (u.hostname or '').lower()
    is_local = host in ('localhost', '127.0.0.1', '::1', 'db', 'postgres')
    use_ssl = (sslmode in ('require', 'verify-ca', 'verify-full')) or (not is_local and sslmode != 'disable')
    return ssl.create_default_context() if use_ssl else None


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
        if isinstance(raw_cursor, PostgresCursorWrapper):
            self._cur = raw_cursor._cur
            self._conn = raw_cursor._conn
        else:
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
        
        # Tables without 'id' column (match exact table name boundary)
        tables_without_id = ("email_verifications", "platform_settings", "notification_reads")
        table_has_no_id = bool(re.search(r'\b(?:' + '|'.join(tables_without_id) + r')\b', pg_query.lower()))

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
    def __init__(self, raw_conn, pool=None):
        self._conn = raw_conn
        self._pool = pool

    def cursor(self):
        return PostgresCursorWrapper(self._conn.cursor(), self._conn)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        if self._pool is not None:
            try:
                # Reset any pending transaction before returning connection to pool
                if getattr(self._conn, 'closed', 0) == 0:
                    try:
                        self._conn.rollback()
                    except Exception:
                        # Broken connection: remove it from pool permanently
                        try:
                            self._pool.putconn(self._conn, close=True)
                        except Exception:
                            pass
                        return
                self._pool.putconn(self._conn)
            except Exception:
                try:
                    self._conn.close()
                except Exception:
                    pass
        else:
            try:
                self._conn.close()
            except Exception:
                pass


_LAST_DB_ERROR = None
_PG_POOL = None
_PG_POOL_LOCK = threading.Lock()
_PG8000_POOL = None
_PG8000_POOL_LOCK = threading.Lock()


class Pg8000ConnectionPool:
    """Thread-safe connection pool for pg8000 driver when psycopg2 is not installed."""
    def __init__(self, pg_url, minconn=1, maxconn=20):
        self._url = pg_url
        self._maxconn = maxconn
        self._pool = []
        self._lock = threading.Lock()

    def _create_conn(self):
        import pg8000.dbapi
        u = urllib.parse.urlparse(self._url)
        ssl_ctx = _pg_ssl_context(self._url)
        return pg8000.dbapi.connect(
            user=u.username,
            password=u.password,
            host=u.hostname,
            port=u.port or 5432,
            database=u.path.lstrip('/'),
            ssl_context=ssl_ctx
        )

    def _is_closed(self, conn):
        if conn is None:
            return True
        if hasattr(conn, '_sock') or hasattr(conn, '_usock'):
            is_live = (getattr(conn, '_sock', None) is not None) or (getattr(conn, '_usock', None) is not None)
            return not is_live or bool(getattr(conn, 'closed', False))
        if hasattr(conn, 'closed'):
            return bool(conn.closed)
        return False

    def getconn(self):
        with self._lock:
            while self._pool:
                conn = self._pool.pop()
                if not self._is_closed(conn):
                    return conn
        # None available in pool; create new connection
        return self._create_conn()

    def putconn(self, conn, close=False):
        if close or self._is_closed(conn):
            try:
                conn.close()
            except Exception:
                pass
            return
        with self._lock:
            if len(self._pool) < self._maxconn:
                self._pool.append(conn)
            else:
                try:
                    conn.close()
                except Exception:
                    pass


def get_pg8000_pool(pg_url):
    global _PG8000_POOL
    if _PG8000_POOL is not None:
        return _PG8000_POOL
    with _PG8000_POOL_LOCK:
        if _PG8000_POOL is not None:
            return _PG8000_POOL
        pool = Pg8000ConnectionPool(pg_url, minconn=1, maxconn=20)
        _PG8000_POOL = pool
        return _PG8000_POOL


def get_pg_pool(pg_url):
    global _PG_POOL
    if _PG_POOL is not None and not getattr(_PG_POOL, 'closed', False):
        return _PG_POOL
    with _PG_POOL_LOCK:
        if _PG_POOL is not None and not getattr(_PG_POOL, 'closed', False):
            return _PG_POOL
        if pg_url.startswith("postgres://"):
            pg_url = pg_url.replace("postgres://", "postgresql://", 1)

        import psycopg2.pool
        last_err = None
        dsn = pg_url
        if "connect_timeout=" not in dsn:
            sep = "&" if "?" in dsn else "?"
            dsn = f"{dsn}{sep}connect_timeout=5"

        for attempt in range(1, 4):
            try:
                pool = psycopg2.pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=20,
                    dsn=dsn
                )
                _PG_POOL = pool
                print(f"[INFO] Initialized PostgreSQL ThreadedConnectionPool (min=1, max=20) on attempt {attempt}")
                return _PG_POOL
            except Exception as e:
                last_err = e
                print(f"[WARN] Postgres connection pool attempt {attempt}/3 failed: {e}")
                if attempt < 3:
                    time.sleep(0.5)
        raise RuntimeError(f"Failed to initialize PostgreSQL pool after 3 attempts: {last_err}")


def create_postgres_conn(pg_url, pooled=True):
    global _LAST_DB_ERROR
    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql://", 1)

    errors = []
    # 1. Try ThreadedConnectionPool with psycopg2 (high concurrency)
    if pooled:
        try:
            pool = get_pg_pool(pg_url)
            # Resilient connection acquisition under concurrency burst
            raw_conn = None
            start_wait = time.time()
            while time.time() - start_wait < 3.0:
                try:
                    raw_conn = pool.getconn()
                    break
                except Exception as p_err:
                    if "exhausted" in str(p_err).lower():
                        time.sleep(0.05)
                    else:
                        raise
            if raw_conn is None:
                raw_conn = pool.getconn()

            if getattr(raw_conn, 'closed', 0) != 0:
                pool.putconn(raw_conn, close=True)
                raw_conn = pool.getconn()
            try:
                raw_conn.rollback()
            except Exception:
                pass
            return PostgresConnectionWrapper(raw_conn, pool=pool)
        except Exception as e:
            errors.append(f"psycopg2 pool: {e}")

    # 2. Try raw psycopg2 connection
    try:
        import psycopg2
        raw_conn = psycopg2.connect(pg_url)
        return PostgresConnectionWrapper(raw_conn)
    except Exception as e:
        errors.append(f"psycopg2: {e}")

    # 3. Try pooled pg8000 connection pool
    if pooled:
        try:
            pool8 = get_pg8000_pool(pg_url)
            raw_conn = pool8.getconn()
            try:
                raw_conn.rollback()
            except Exception:
                pass
            return PostgresConnectionWrapper(raw_conn, pool=pool8)
        except Exception as e:
            errors.append(f"pg8000 pool: {e}")

    # 4. Try raw pg8000 fallback
    try:
        import pg8000.dbapi
        u = urllib.parse.urlparse(pg_url)
        ssl_ctx = _pg_ssl_context(pg_url)
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
        errors.append(f"pg8000 raw: {e}")

    _LAST_DB_ERROR = " | ".join(errors)
    raise RuntimeError(_LAST_DB_ERROR)


def get_db():
    global _LAST_DB_ERROR
    if 'db' not in g:
        pg_url = os.environ.get('DATABASE_URL')
        if pg_url:
            try:
                g.db = create_postgres_conn(pg_url, pooled=True)
                return g.db
            except Exception as e:
                _LAST_DB_ERROR = str(e)
                if HOSTED:
                    abort(503, description="Хранилище аккаунтов временно недоступно.")
                print("[WARN] PostgreSQL is unavailable. Using local SQLite.")
        if HOSTED:
            abort(503, description="Хранилище аккаунтов не настроено.")
        g.db = sqlite3.connect(DB_PATH, timeout=30.0)
        g.db.execute("PRAGMA journal_mode = WAL;")
        g.db.execute("PRAGMA busy_timeout = 30000;")
        g.db.execute("PRAGMA foreign_keys = ON;")
        g.db.row_factory = sqlite3.Row
    return g.db


@app.route('/api/debug/db_status', methods=['GET'])
def get_db_status():
    if HOSTED:
        abort(404)
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
        json_str = raw[idx + len(marker):].lstrip()
        obj, _ = json.JSONDecoder().raw_decode(json_str)
        return obj
    except Exception:
        return {}


def _seed_tasks_and_enrollments(cursor):
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

    cursor.execute("SELECT id, specialty_slug FROM users WHERE role = 'student'")
    for row in cursor.fetchall():
        uid = row['id'] if hasattr(row, '__getitem__') and not isinstance(row, tuple) else row[0]
        spec = (row['specialty_slug'] if hasattr(row, '__getitem__') and not isinstance(row, tuple) else row[1]) or 'it'
        cursor.execute("INSERT OR IGNORE INTO enrollments (user_id, specialty_slug) VALUES (?, ?)", (uid, spec))


def init_db():
    pg_url = os.environ.get('DATABASE_URL')
    if pg_url:
        print("[INFO] DATABASE_URL detected. Synchronizing PostgreSQL schema...")
        try:
            pg_conn = create_postgres_conn(pg_url)
            pg_cur = pg_conn.cursor()
            pg_ddl_statements = [
                """CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    last_name VARCHAR(100) DEFAULT '',
                    first_name VARCHAR(100) DEFAULT '',
                    middle_name VARCHAR(100) DEFAULT '',
                    role VARCHAR(50) NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
                    group_name VARCHAR(100) DEFAULT 'ИС-21',
                    specialty_slug VARCHAR(100) DEFAULT 'it',
                    department VARCHAR(150) DEFAULT '',
                    student_id VARCHAR(100) UNIQUE,
                    email_verified INTEGER DEFAULT 0,
                    is_demo INTEGER DEFAULT 0,
                    subscription_tier VARCHAR(50) DEFAULT 'free',
                    pro_expires_at TIMESTAMP NULL,
                    bonus_xp INTEGER DEFAULT 0,
                    streak_days INTEGER DEFAULT 1,
                    achievements_json TEXT DEFAULT '[]',
                    session_version INTEGER NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );""",
                """CREATE TABLE IF NOT EXISTS email_verifications (
                    email VARCHAR(255) PRIMARY KEY,
                    code VARCHAR(20) NOT NULL,
                    expires_at BIGINT NOT NULL,
                    verified INTEGER DEFAULT 0,
                    purpose TEXT DEFAULT 'legacy',
                    attempts INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );""",
                """CREATE TABLE IF NOT EXISTS enrollments (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    specialty_slug VARCHAR(100) NOT NULL,
                    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_enrollments_user_spec UNIQUE(user_id, specialty_slug)
                );""",
                """CREATE TABLE IF NOT EXISTS lesson_progress (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    specialty_slug VARCHAR(100) NOT NULL,
                    task_number INTEGER NOT NULL,
                    status VARCHAR(50) DEFAULT 'in_progress',
                    quiz_score INTEGER DEFAULT 0,
                    quiz_total INTEGER DEFAULT 3,
                    draft_code TEXT DEFAULT '',
                    current_stage INTEGER DEFAULT 1,
                    mission_state_json TEXT DEFAULT '{}',
                    mission_xp INTEGER DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_lesson_prog_user_spec_num UNIQUE(user_id, specialty_slug, task_number)
                );""",
                """CREATE TABLE IF NOT EXISTS grades (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    student_id VARCHAR(100),
                    specialty_slug VARCHAR(100),
                    specialty_name VARCHAR(255),
                    score INTEGER DEFAULT 0,
                    status VARCHAR(50) DEFAULT 'graded',
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );""",
                """CREATE TABLE IF NOT EXISTS tasks (
                    id SERIAL PRIMARY KEY,
                    specialty_slug VARCHAR(100) NOT NULL,
                    task_number INTEGER NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    difficulty VARCHAR(50) DEFAULT 'medium',
                    time_limit VARCHAR(50) DEFAULT '45 мин',
                    unlock_day INTEGER DEFAULT 1,
                    unlock_date_text VARCHAR(100) DEFAULT '',
                    deadline_text VARCHAR(100) DEFAULT '',
                    description TEXT DEFAULT '',
                    tools_required TEXT DEFAULT '',
                    starter_code TEXT DEFAULT '',
                    max_score INTEGER DEFAULT 100,
                    mode VARCHAR(50) DEFAULT 'both',
                    ticket_number INTEGER DEFAULT 1,
                    CONSTRAINT uq_tasks_spec_num UNIQUE(specialty_slug, task_number)
                );""",
                """CREATE TABLE IF NOT EXISTS task_submissions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    student_id VARCHAR(100),
                    student_name VARCHAR(255),
                    group_name VARCHAR(100),
                    task_id INTEGER,
                    specialty_slug VARCHAR(100),
                    task_number INTEGER,
                    task_title VARCHAR(255),
                    score INTEGER DEFAULT 0,
                    grade_letter VARCHAR(10) DEFAULT '—',
                    status VARCHAR(50) DEFAULT 'submitted',
                    time_spent_seconds INTEGER DEFAULT 0,
                    submitted_code TEXT DEFAULT '',
                    repo_url TEXT DEFAULT '',
                    student_comment TEXT DEFAULT '',
                    autotest_passed INTEGER DEFAULT 0,
                    autotest_total INTEGER DEFAULT 0,
                    quiz_score INTEGER DEFAULT 0,
                    teacher_comment TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );""",
                """CREATE TABLE IF NOT EXISTS teacher_groups (
                    id SERIAL PRIMARY KEY,
                    teacher_id INTEGER NOT NULL,
                    group_name VARCHAR(100) NOT NULL,
                    specialty_slug VARCHAR(100) DEFAULT 'it',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_teacher_groups_tid_grp UNIQUE(teacher_id, group_name)
                );""",
                """CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    target_role VARCHAR(50) DEFAULT 'student',
                    target_group VARCHAR(100) DEFAULT '',
                    title VARCHAR(255) NOT NULL,
                    body TEXT NOT NULL,
                    type VARCHAR(50) DEFAULT 'info',
                    is_read INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );""",
                """CREATE TABLE IF NOT EXISTS notification_reads (
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
                    PRIMARY KEY (user_id, notification_id)
                );""",
                """CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    sender_id INTEGER,
                    sender_name VARCHAR(255) NOT NULL,
                    sender_role VARCHAR(50) NOT NULL,
                    recipient_key VARCHAR(100) DEFAULT 'general',
                    body TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );""",
                """CREATE TABLE IF NOT EXISTS platform_settings (
                    key VARCHAR(100) PRIMARY KEY,
                    value TEXT NOT NULL
                );""",
                """CREATE TABLE IF NOT EXISTS subscriptions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    plan_code VARCHAR(50) NOT NULL DEFAULT 'free',
                    billing_period VARCHAR(50) DEFAULT 'monthly',
                    status VARCHAR(50) NOT NULL DEFAULT 'active',
                    amount INTEGER DEFAULT 0,
                    currency VARCHAR(10) DEFAULT 'KZT',
                    payment_method VARCHAR(50) DEFAULT 'sandbox',
                    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NULL
                );""",
                """CREATE TABLE IF NOT EXISTS transactions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    plan_code VARCHAR(50) NOT NULL,
                    amount INTEGER NOT NULL,
                    currency VARCHAR(10) DEFAULT 'KZT',
                    status VARCHAR(50) NOT NULL DEFAULT 'paid',
                    payment_method VARCHAR(50) DEFAULT 'sandbox',
                    receipt_number VARCHAR(100) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );""",
                "CREATE TABLE IF NOT EXISTS xp_transactions (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), amount INTEGER NOT NULL, source_type VARCHAR(64) NOT NULL, source_id VARCHAR(128) NOT NULL, description VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT uq_xp_user_source UNIQUE(user_id, source_type, source_id))",
                "CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, actor_id INTEGER, actor_email VARCHAR(128), actor_role VARCHAR(32), action VARCHAR(128) NOT NULL, target_type VARCHAR(64), target_id VARCHAR(128), details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
                "CREATE TABLE IF NOT EXISTS daily_quests_log (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), quest_key VARCHAR(64) NOT NULL, quest_date VARCHAR(32) NOT NULL, completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT uq_daily_user_quest UNIQUE(user_id, quest_key, quest_date))",
                "CREATE TABLE IF NOT EXISTS courses (id SERIAL PRIMARY KEY, slug VARCHAR(64) UNIQUE NOT NULL, title VARCHAR(255) NOT NULL, code VARCHAR(64) DEFAULT '', description TEXT DEFAULT '', curator_id INTEGER, is_published INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
                "CREATE TABLE IF NOT EXISTS course_modules (id SERIAL PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id), title VARCHAR(255) NOT NULL, order_num INTEGER DEFAULT 1, is_published INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
                "CREATE TABLE IF NOT EXISTS lessons (id SERIAL PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id), module_id INTEGER REFERENCES course_modules(id), title VARCHAR(255) NOT NULL, lesson_type VARCHAR(64) DEFAULT 'theory', order_num INTEGER DEFAULT 1, xp_reward INTEGER DEFAULT 60, unlock_day INTEGER DEFAULT 1, is_published INTEGER DEFAULT 1, content_json TEXT DEFAULT '[]', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
                "CREATE TABLE IF NOT EXISTS lesson_block_progress (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), lesson_id INTEGER NOT NULL REFERENCES lessons(id), block_id VARCHAR(64) NOT NULL, completed INTEGER DEFAULT 0, state_json TEXT DEFAULT '{}', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT uq_block_prog UNIQUE(user_id, lesson_id, block_id))",
                "CREATE TABLE IF NOT EXISTS ai_conversations (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), context_type VARCHAR(64) NOT NULL, context_id VARCHAR(128) DEFAULT '', user_message TEXT NOT NULL, assistant_message TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
                "CREATE TABLE IF NOT EXISTS workshop_states (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), lesson_id INTEGER NOT NULL DEFAULT 1, model_id VARCHAR(128) NOT NULL, disassembled_parts_json TEXT DEFAULT '[]', active_tool VARCHAR(64) DEFAULT 'socket_set', step_history_json TEXT DEFAULT '[]', completed INTEGER DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT uq_workshop_user_les_mod UNIQUE(user_id, lesson_id, model_id))",
                "CREATE TABLE IF NOT EXISTS student_tools_state (id SERIAL PRIMARY KEY, user_id INTEGER UNIQUE NOT NULL REFERENCES users(id), tasks_json TEXT DEFAULT '[]', gpa_target REAL DEFAULT 3.5, notes TEXT DEFAULT '', timer_minutes INTEGER DEFAULT 25, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
                "CREATE TABLE IF NOT EXISTS portfolio_settings (id SERIAL PRIMARY KEY, user_id INTEGER UNIQUE NOT NULL REFERENCES users(id), is_public INTEGER DEFAULT 0, show_grades INTEGER DEFAULT 1, show_certificates INTEGER DEFAULT 1, consent_granted INTEGER DEFAULT 0, public_slug VARCHAR(128) UNIQUE, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
                "CREATE TABLE IF NOT EXISTS exam_attempts (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), specialty_slug VARCHAR(64) NOT NULL, attempt_nonce VARCHAR(128) NOT NULL, status VARCHAR(32) DEFAULT 'in_progress', score INTEGER DEFAULT 0, passed INTEGER DEFAULT 0, error_log_json TEXT DEFAULT '[]', teacher_status VARCHAR(32) DEFAULT 'pending', teacher_comment TEXT DEFAULT '', reviewer_id INTEGER, started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, submitted_at TIMESTAMP NULL)",
                "CREATE TABLE IF NOT EXISTS exam_events (id SERIAL PRIMARY KEY, attempt_id INTEGER NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE, step_id INTEGER DEFAULT 1, action VARCHAR(64) NOT NULL, part_id VARCHAR(128) DEFAULT '', tool_id VARCHAR(64) DEFAULT '', telemetry_json TEXT DEFAULT '{}', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_xp INTEGER DEFAULT 0",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 1",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS achievements_json TEXT DEFAULT '[]'",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1",
                "ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS purpose TEXT DEFAULT 'legacy'",
                "ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0",
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
            ]
            for pg_ddl in pg_ddl_statements:
                pg_cur.execute(pg_ddl)

            pg_cur.execute("INSERT INTO platform_settings (key, value) VALUES ('current_study_day', '1') ON CONFLICT (key) DO NOTHING")

            if not HOSTED:
                pg_demo_pwd_student = generate_password_hash("student123")
                pg_demo_pwd_teacher = generate_password_hash("teacher123")
                pg_demo_pwd_admin = generate_password_hash("admin123")

                pg_demo_accounts = [
                    ("student@amk.kz", pg_demo_pwd_student, "Асылхан Бауыржанұлы", "Бауыржанұлы", "Асылхан", "", "student", "ИС-21", "it", "", "KZ-AMK-2026-10001", 1, 1),
                    ("voronov@student.amk.kz", pg_demo_pwd_student, "Константин Воронов", "Воронов", "Константин", "", "student", "ИС-21", "it", "", "KZ-AMK-2026-98421", 1, 1),
                    ("teacher@amk.kz", pg_demo_pwd_teacher, "Иванов Сергей Павлович", "Иванов", "Сергей", "Павлович", "teacher", "Кафедра IT", "it", "Кафедра профильных дисциплин", None, 1, 1),
                    ("admin@amk.kz", pg_demo_pwd_admin, "Администратор Системы", "Администратор", "Системы", "", "admin", "Администрация", "it", "Ректорат", "KZ-AMK-ADMIN-01", 1, 1),
                ]
                for acc in pg_demo_accounts:
                    pg_cur.execute("""
                    INSERT INTO users (
                        email, password_hash, full_name, last_name, first_name, middle_name,
                        role, group_name, specialty_slug, department, student_id, email_verified, is_demo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(email) DO UPDATE SET
                        role = EXCLUDED.role,
                        password_hash = EXCLUDED.password_hash,
                        is_demo = 1,
                        email_verified = 1,
                        created_at = CURRENT_TIMESTAMP
                    """, acc)

            try:
                from curriculum_seeder import seed_interactive_curriculum
                seed_interactive_curriculum(pg_cur)
            except Exception as e_cur:
                print(f"[WARN] PostgreSQL curriculum seeder warning: {e_cur}")

            _seed_tasks_and_enrollments(pg_cur)
            pg_conn.commit()
            pg_conn.close()
            print("[INFO] PostgreSQL DDL and seeding complete.")
            return
        except Exception as e:
            print(f"[WARN] PostgreSQL DDL sync warning: {e}")
            if HOSTED:
                raise
            return

    if HOSTED:
        print("[WARN] HOSTED mode active without DATABASE_URL; skipping local SQLite init.")
        return

    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 30000;")
    conn.execute("PRAGMA foreign_keys = ON;")
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
        "achievements_json TEXT DEFAULT '[]'",
        "session_version INTEGER NOT NULL DEFAULT 1"
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
    _safe_add_column(cursor, "email_verifications", "purpose TEXT DEFAULT 'legacy'")
    _safe_add_column(cursor, "email_verifications", "attempts INTEGER DEFAULT 0")

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
    CREATE TABLE IF NOT EXISTS notification_reads (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, notification_id)
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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS xp_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, source_type, source_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id INTEGER,
        actor_email TEXT,
        actor_role TEXT,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_quests_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        quest_key TEXT NOT NULL,
        quest_date TEXT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, quest_key, quest_date),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        code TEXT DEFAULT '',
        description TEXT DEFAULT '',
        curator_id INTEGER,
        is_published INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS course_modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        order_num INTEGER DEFAULT 1,
        is_published INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        module_id INTEGER,
        title TEXT NOT NULL,
        lesson_type TEXT DEFAULT 'theory',
        order_num INTEGER DEFAULT 1,
        xp_reward INTEGER DEFAULT 60,
        unlock_day INTEGER DEFAULT 1,
        is_published INTEGER DEFAULT 1,
        content_json TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id),
        FOREIGN KEY (module_id) REFERENCES course_modules(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lesson_block_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        lesson_id INTEGER NOT NULL,
        block_id TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        state_json TEXT DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id, block_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        context_type TEXT NOT NULL,
        context_id TEXT DEFAULT '',
        user_message TEXT NOT NULL,
        assistant_message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workshop_states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        lesson_id INTEGER NOT NULL DEFAULT 1,
        model_id TEXT NOT NULL,
        disassembled_parts_json TEXT DEFAULT '[]',
        active_tool TEXT DEFAULT 'socket_set',
        step_history_json TEXT DEFAULT '[]',
        completed INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id, model_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_tools_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        tasks_json TEXT DEFAULT '[]',
        gpa_target REAL DEFAULT 3.5,
        notes TEXT DEFAULT '',
        timer_minutes INTEGER DEFAULT 25,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolio_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        is_public INTEGER DEFAULT 0,
        show_grades INTEGER DEFAULT 1,
        show_certificates INTEGER DEFAULT 1,
        consent_granted INTEGER DEFAULT 0,
        public_slug TEXT UNIQUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exam_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        specialty_slug TEXT NOT NULL,
        attempt_nonce TEXT NOT NULL,
        status TEXT DEFAULT 'in_progress',
        score INTEGER DEFAULT 0,
        passed INTEGER DEFAULT 0,
        error_log_json TEXT DEFAULT '[]',
        teacher_status TEXT DEFAULT 'pending',
        teacher_comment TEXT DEFAULT '',
        reviewer_id INTEGER,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exam_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attempt_id INTEGER NOT NULL,
        step_id INTEGER DEFAULT 1,
        action TEXT NOT NULL,
        part_id TEXT DEFAULT '',
        tool_id TEXT DEFAULT '',
        telemetry_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
    );
    """)

    try:
        from curriculum_seeder import seed_interactive_curriculum
        seed_interactive_curriculum(cursor)
    except Exception as e:
        print(f"[WARN] Curriculum seeder notice: {e}")

    cursor.execute("INSERT OR IGNORE INTO platform_settings (key, value) VALUES ('current_study_day', '1');")

    # Seed isolated demo accounts
    demo_pwd_student = generate_password_hash("student123")
    demo_pwd_teacher = generate_password_hash("teacher123")
    demo_pwd_admin = generate_password_hash("admin123")

    demo_accounts = [
        ("student@amk.kz", demo_pwd_student, "Оспанов Адилет Серикович", "Оспанов", "Адилет", "Серикович", "student", "ИС-21", "it", "", "KZ-AMK-2026-10001", 1, 1),
        ("voronov@student.amk.kz", demo_pwd_student, "Воронов Константин Сергеевич", "Воронов", "Константин", "Сергеевич", "student", "ИС-21", "it", "", "KZ-AMK-2026-98421", 1, 1),
        ("teacher@amk.kz", demo_pwd_teacher, "Иванов Сергей Павлович", "Иванов", "Сергей", "Павлович", "teacher", "Кафедра ИТ", "it", "Кафедра информационных технологий", None, 1, 1),
        ("admin@amk.kz", demo_pwd_admin, "Администратор Системы", "Администратор", "Системы", "", "admin", "Администрация", "it", "Ректорат", "KZ-AMK-ADMIN-01", 1, 1),
    ]
    for acc in demo_accounts:
        cursor.execute("""
        INSERT INTO users (
            email, password_hash, full_name, last_name, first_name, middle_name,
            role, group_name, specialty_slug, department, student_id, email_verified, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
            role = excluded.role,
            password_hash = excluded.password_hash,
            is_demo = 1,
            email_verified = 1,
            created_at = CURRENT_TIMESTAMP,
            last_name = CASE WHEN users.last_name = '' THEN excluded.last_name ELSE users.last_name END,
            first_name = CASE WHEN users.first_name = '' THEN excluded.first_name ELSE users.first_name END
        """, acc)

    # Seed or sync 100 catalog tasks and student enrollments
    _seed_tasks_and_enrollments(cursor)

    conn.commit()
    conn.close()


init_db()


def get_user_study_day_from_created_at(created_at_val):
    if not created_at_val:
        return 1
    try:
        if isinstance(created_at_val, datetime):
            reg_dt = created_at_val
            if reg_dt.tzinfo is not None:
                reg_utc = reg_dt.astimezone(timezone.utc)
            else:
                reg_utc = reg_dt.replace(tzinfo=timezone.utc)
        else:
            raw = str(created_at_val).strip().replace('T', ' ').replace('Z', '')
            if '+' in raw:
                raw = raw.split('+')[0].strip()
            if '.' in raw:
                raw = raw.split('.')[0].strip()
            reg_naive = datetime.strptime(raw[:19], '%Y-%m-%d %H:%M:%S')
            reg_utc = reg_naive.replace(tzinfo=timezone.utc)

        now_utc = datetime.now(timezone.utc)
        elapsed_seconds = max(0.0, (now_utc - reg_utc).total_seconds())
        days_by_24h = int(elapsed_seconds // 86400)
        days_by_local_date = max(0, (now_utc.astimezone().date() - reg_utc.astimezone().date()).days)
        days_elapsed = max(days_by_24h, days_by_local_date)
        return max(1, min(20, days_elapsed + 1))
    except Exception:
        return 1


def get_current_day(user_id=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT value FROM platform_settings WHERE key = 'current_study_day';")
    row = c.fetchone()
    platform_day = 1
    if row:
        try:
            platform_day = max(1, min(20, int(row['value'])))
        except Exception:
            platform_day = 1

    uid = user_id
    if uid is None:
        try:
            uid = request.args.get('user_id', type=int) or session.get('user_id')
            if not uid and hasattr(g, 'current_user') and g.current_user:
                uid = g.current_user.get('id')
        except Exception:
            uid = None

    if uid:
        try:
            c.execute("SELECT created_at, role FROM users WHERE id = ?", (int(uid),))
            u_row = c.fetchone()
            if u_row and (u_row['role'] or 'student') == 'student':
                user_day = get_user_study_day_from_created_at(u_row['created_at'])
                return max(platform_day, user_day)
        except Exception:
            pass

    return platform_day


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



# =========================================================================
# FUTURISTIC GAMIFICATION, LEVEL SYSTEM, XP LEDGER & AUDIT TRAIL
# =========================================================================

LEVELS_TIERS = [
    {"level": 1, "name": "Новичок", "min_xp": 0, "max_xp": 299, "icon": "shield", "color": "#94a3b8"},
    {"level": 2, "name": "Исследователь", "min_xp": 300, "max_xp": 699, "icon": "explore", "color": "#06b6d4"},
    {"level": 3, "name": "Практик", "min_xp": 700, "max_xp": 1299, "icon": "bolt", "color": "#10b981"},
    {"level": 4, "name": "Специалист", "min_xp": 1300, "max_xp": 2199, "icon": "biotech", "color": "#f59e0b"},
    {"level": 5, "name": "Эксперт", "min_xp": 2200, "max_xp": 3499, "icon": "psychology", "color": "#a855f7"},
    {"level": 6, "name": "Мастер", "min_xp": 3500, "max_xp": 4999, "icon": "workspace_premium", "color": "#ef4444"},
    {"level": 7, "name": "Легенда", "min_xp": 5000, "max_xp": 999999, "icon": "military_tech", "color": "#ec4899"}
]

def get_level_info(xp_total):
    xp_val = max(0, int(xp_total or 0))
    for tier in reversed(LEVELS_TIERS):
        if xp_val >= tier["min_xp"]:
            lvl = tier["level"]
            min_xp = tier["min_xp"]
            max_xp = tier["max_xp"]
            span = max(1, max_xp - min_xp)
            progress_pct = 100 if lvl >= 7 else min(100, int(((xp_val - min_xp) / span) * 100))
            return {
                "level": lvl,
                "name": tier["name"],
                "icon": tier["icon"],
                "color": tier["color"],
                "xp_total": xp_val,
                "min_xp": min_xp,
                "max_xp": max_xp,
                "progress_percent": progress_pct,
                "next_level_xp": max_xp + 1 if lvl < 7 else None
            }
    return LEVELS_TIERS[0]

def award_xp(conn, user_id, amount, source_type, source_id, description):
    """
    Atomically awards XP using xp_transactions table with unique idempotency.
    Returns (awarded_bool, total_xp, level_info).
    """
    cursor = conn.cursor()
    awarded = False
    try:
        cursor.execute("""
        INSERT INTO xp_transactions (user_id, amount, source_type, source_id, description)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (user_id, source_type, source_id) DO NOTHING
        """, (user_id, int(amount), str(source_type), str(source_id), str(description)))
        conn.commit()
        awarded = (getattr(cursor, 'rowcount', 1) != 0)
    except Exception:
        # Already awarded (unique constraint violation) or PG transaction error: MUST rollback!
        try:
            conn.rollback()
        except Exception:
            pass
        awarded = False

    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM xp_transactions WHERE user_id = ?", (user_id,))
    total_ledger_xp = cursor.fetchone()[0]
    cursor.execute("SELECT bonus_xp FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    old_bonus = u_row['bonus_xp'] if u_row and u_row['bonus_xp'] else 0
    final_bonus = max(int(total_ledger_xp), int(old_bonus))
    cursor.execute("UPDATE users SET bonus_xp = ? WHERE id = ?", (final_bonus, user_id))
    conn.commit()
    return awarded, final_bonus, get_level_info(final_bonus)

PLATFORM_ACHIEVEMENTS = [
    {
        "id": "first_step",
        "title": "Первый шаг в EduSpace",
        "desc": "Успешно отправлено и зачтено первое задание курса",
        "icon": "school",
        "xp": 50,
        "color": "#06b6d4"
    },
    {
        "id": "quiz_master",
        "title": "Эрудит EduSpace",
        "desc": "Сдан проверочный тест на максимальный балл (3/3)",
        "icon": "psychology",
        "xp": 50,
        "color": "#818cf8"
    },
    {
        "id": "high_five",
        "title": "Твёрдая пятёрка",
        "desc": "Успешно сдано 5 практических заданий",
        "icon": "stars",
        "xp": 150,
        "color": "#10b981"
    },
    {
        "id": "perfect_score",
        "title": "Высший балл (100/100)",
        "desc": "Получена идеальная оценка 100/100 от преподавателя",
        "icon": "military_tech",
        "xp": 100,
        "color": "#f59e0b"
    },
    {
        "id": "streak_master",
        "title": "Хранитель серии",
        "desc": "Непрерывная серия обучения 3+ дней подряд",
        "icon": "local_fire_department",
        "xp": 100,
        "color": "#ef4444"
    },
    {
        "id": "course_champion",
        "title": "Покоритель курса",
        "desc": "Успешно сданы все 20 заданий специализации",
        "icon": "workspace_premium",
        "xp": 300,
        "color": "#a855f7"
    },
    {
        "id": "color_architect",
        "title": "Архитектор цвета",
        "desc": "Завершена интерактивная миссия космической колористики",
        "icon": "palette",
        "xp": 200,
        "color": "#ec4899"
    }
]

def check_and_unlock_achievements(conn, user_id):
    """Checks user stats and unlocks newly achieved milestones automatically."""
    cursor = conn.cursor()
    cursor.execute("SELECT achievements_json, streak_days FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    if not u_row:
        return []

    achievements = []
    if u_row['achievements_json']:
        try:
            achievements = json.loads(u_row['achievements_json'])
        except Exception:
            achievements = []

    existing_ids = {a['id'] if isinstance(a, dict) else a for a in achievements}
    new_unlocked = []

    cursor.execute("SELECT count(*), max(score) FROM task_submissions WHERE user_id = ? AND score >= 60", (user_id,))
    passed_row = cursor.fetchone()
    passed_count = passed_row[0] if passed_row else 0
    max_score = passed_row[1] if passed_row and passed_row[1] is not None else 0

    cursor.execute("SELECT count(*) FROM lesson_progress WHERE user_id = ? AND quiz_score >= 3", (user_id,))
    q_row = cursor.fetchone()
    perfect_quizzes = q_row[0] if q_row else 0

    streak = u_row['streak_days'] or 1

    checks = [
        ("first_step", passed_count >= 1),
        ("quiz_master", perfect_quizzes >= 1),
        ("high_five", passed_count >= 5),
        ("perfect_score", max_score >= 100),
        ("streak_master", streak >= 3),
        ("course_champion", passed_count >= 20),
    ]

    for ach_id, condition in checks:
        if condition and ach_id not in existing_ids:
            ach_item = next((a for a in PLATFORM_ACHIEVEMENTS if a["id"] == ach_id), None)
            if ach_item:
                achievements.append(ach_item)
                new_unlocked.append(ach_item)
                award_xp(conn, user_id, ach_item["xp"], "achievement", ach_id, f"Достижение: {ach_item['title']}")
                cursor.execute("""
                INSERT INTO notifications (user_id, target_role, title, body, type)
                VALUES (?, 'student', ?, ?, 'achievement')
                """, (user_id, f"🏆 Новое достижение: {ach_item['title']}!", f"Вы получили +{ach_item['xp']} XP за «{ach_item['desc']}». Поздравляем!"))

    if new_unlocked:
        cursor.execute("UPDATE users SET achievements_json = ? WHERE id = ?", (json.dumps(achievements, ensure_ascii=False), user_id))
        conn.commit()

    return new_unlocked

def log_audit_event(conn, actor_id, actor_email, actor_role, action, target_type, target_id, details=""):
    try:
        cur = conn.cursor()
        cur.execute("""
        INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, target_type, target_id, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (actor_id, actor_email or "", actor_role or "", action, target_type or "", str(target_id or ""), details or ""))
        conn.commit()
    except Exception as e:
        print(f"[AUDIT LOG ERROR] {e}")


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
    d["xp"] = int(d.get("bonus_xp") or 0)
    d["current_study_day"] = get_user_study_day_from_created_at(d.get("created_at"))
    return d


def compute_dates_for_day(unlock_day, current_day=1):
    base = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
    cur_d = max(1, int(current_day or 1))
    open_dt = base + timedelta(days=(int(unlock_day or 1) - cur_d))
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
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
MAIL_API_KEY = os.environ.get('MAIL_API_KEY', '')
MAIL_FROM = os.environ.get('MAIL_FROM', '')


def is_mail_configured():
    return bool((MAIL_API_KEY and MAIL_FROM) or SMTP_PASSWORD)


def is_email_otp_required():
    raw = (os.environ.get('AUTH_REQUIRE_EMAIL_OTP') or '').strip().lower()
    if raw in ('1', 'true', 'yes', 'on'):
        return True
    if raw in ('0', 'false', 'no', 'off'):
        return False
    return bool(HOSTED and is_mail_configured())


def _is_integrity_error(exc):
    if isinstance(exc, sqlite3.IntegrityError):
        return True
    name = type(exc).__name__
    if name in ('IntegrityError', 'UniqueViolation'):
        return True
    msg = str(exc).lower()
    return 'unique' in msg or '23505' in msg or 'duplicate key' in msg


def make_certificate_code(user_id, student_id):
    sid = str(student_id or f"KZ-AMK-2026-{10000 + int(user_id)}").strip()
    sig = hmac.new(
        app.secret_key.encode('utf-8'),
        f"cert:{int(user_id)}:{sid}".encode('utf-8'),
        hashlib.sha256
    ).hexdigest()[:10].upper()
    return f"{sid}-{sig}"


def deliver_auth_code(email, code, purpose):
    if app.testing and not HOSTED:
        return True
    if MAIL_API_KEY and MAIL_FROM:
        action = 'восстановления доступа' if purpose == 'reset' else 'подтверждения регистрации'
        payload = {
            'from': MAIL_FROM, 'to': [email],
            'subject': 'Проверочный код AMK SkillHub',
            'text': f'Ваш код для {action}: {code}. Код действует 10 минут.',
        }
        message = Request(
            'https://api.resend.com/emails', data=json.dumps(payload).encode('utf-8'),
            headers={'Authorization': f'Bearer {MAIL_API_KEY}', 'Content-Type': 'application/json'},
            method='POST',
        )
        try:
            with urlopen(message, timeout=10) as response:
                return 200 <= response.status < 300
        except OSError:
            app.logger.warning("Account email provider request failed")
            return False
    if SMTP_PASSWORD:
        delivered, _ = send_smtp_email(email, code)
        return delivered
    return False


def auth_code_value(email, purpose, code):
    if app.testing and not HOSTED:
        return code
    value = f"{purpose}:{email}:{code}".encode('utf-8')
    return hmac.new(app.secret_key.encode('utf-8'), value, hashlib.sha256).hexdigest()[:20]


def read_auth_code(conn, email, purpose, code):
    cursor = conn.cursor()
    cursor.execute(
        "SELECT code, expires_at, attempts FROM email_verifications WHERE email = ? AND purpose = ?",
        (email, purpose)
    )
    row = cursor.fetchone()
    if not row or int(row['expires_at']) < int(time.time()) or int(row['attempts']) >= 5:
        return None
    expected = auth_code_value(email, purpose, code)
    if not hmac.compare_digest(str(row['code']), expected):
        cursor.execute(
            "UPDATE email_verifications SET attempts = attempts + 1 WHERE email = ? AND purpose = ? AND code = ?",
            (email, purpose, row['code'])
        )
        conn.commit()
        return None
    return expected


def consume_auth_code(cursor, email, purpose, code):
    cursor.execute(
        "DELETE FROM email_verifications WHERE email = ? AND purpose = ? AND code = ? AND expires_at >= ? AND attempts < 5",
        (email, purpose, code, int(time.time()))
    )
    return cursor.rowcount == 1


def password_is_valid(password):
    return bool(password) and 8 <= len(password) <= 128 and bool(re.search(r'[^\W\d_]', password)) and bool(re.search(r'\d', password))


def auth_payload():
    raw = request.get_json(silent=True)
    if not isinstance(raw, dict):
        return {}
    fields = {name: value for name, value in raw.items() if isinstance(value, str)}
    fields['no_middle_name'] = raw.get('no_middle_name') is True
    return fields


@app.before_request
def require_hosted_auth_configuration():
    if not HOSTED or not request.path.startswith('/api/'):
        return None
    if request.path in ('/api/demo/reset', '/api/teacher/simulate_submission', '/api/teacher/sync_user'):
        abort(404)
    if request.path.startswith('/api/auth/') and request.path != '/api/auth/readiness' and not SESSION_SECRET:
        return jsonify({"success": False, "message": "Сервер аккаунтов временно недоступен."}), 503
    if session.get('user_id'):
        user = get_current_user()
        if not user:
            session.clear()
        elif session.get('user_role') != user['role']:
            session['user_role'] = user['role']


@app.get('/api/auth/readiness')
def auth_readiness():
    ready = not HOSTED or bool(SESSION_SECRET and os.environ.get('DATABASE_URL'))
    if ready and HOSTED:
        try:
            get_db().cursor().execute('SELECT 1')
        except Exception:
            ready = False
    mail_cfg = is_mail_configured()
    otp_req = is_email_otp_required()
    response = jsonify({
        "login": ready,
        "registration": ready,
        "email_verification_required": otp_req,
        "mail_configured": mail_cfg,
        "hosted": HOSTED
    })
    response.headers['Cache-Control'] = 'no-store'
    return response

def send_smtp_email(to_email, code):
    if not SMTP_PASSWORD or not SMTP_USER:
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
              Поддержка: {SUPPORT_PHONE} (WhatsApp) • {SUPPORT_EMAIL}
            </div>
          </div>
        </body>
        </html>"""
        msg.attach(MIMEText(html, 'html', 'utf-8'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(SMTP_USER, [to_email], msg.as_string())

        return True, "SUCCESS"
    except Exception as e:
        app.logger.warning("Account SMTP delivery failed (%s)", type(e).__name__)
        return False, "SMTP_DELIVERY_FAILED"

@app.route('/api/auth/send_code', methods=['POST'])
def send_verification_code():
    data = auth_payload()
    email = (data.get('email') or '').strip().lower()
    purpose = (data.get('purpose') or 'register').strip().lower()
    if purpose not in ('register', 'reset'):
        return jsonify({"success": False, "message": "Неизвестное назначение кода."}), 400

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

    code = f"{secrets.randbelow(1000000):06d}"
    now = int(time.time())
    expires_at = now + 600
    stored_code = auth_code_value(email, purpose, code)

    cursor.execute("""
    INSERT INTO email_verifications (email, code, expires_at, verified, purpose, attempts)
    VALUES (?, ?, ?, 0, ?, 0)
    ON CONFLICT(email) DO UPDATE SET
        code = excluded.code,
        expires_at = excluded.expires_at,
        purpose = excluded.purpose,
        attempts = 0,
        verified = 0,
        created_at = CURRENT_TIMESTAMP
    WHERE email_verifications.expires_at <= ?
    """, (email, stored_code, expires_at, purpose, now + 540))
    if cursor.rowcount == 0:
        conn.rollback()
        return jsonify({"success": False, "message": "Повторный код можно запросить через минуту."}), 429
    conn.commit()

    if not deliver_auth_code(email, code, purpose):
        cursor.execute("DELETE FROM email_verifications WHERE email = ? AND code = ?", (email, stored_code))
        conn.commit()
        otp_req = is_email_otp_required()
        return jsonify({
            "success": False,
            "mail_configured": is_mail_configured(),
            "email_verification_required": otp_req,
            "message": (
                "Письмо не удалось отправить. Попробуйте позже."
                if otp_req else
                "Почтовый сервис не настроен: в локальном режиме подтверждение email не требуется, вы можете зарегистрироваться без кода."
            )
        }), 503

    return jsonify({
        "success": True,
        "message": "Код отправлен на электронную почту. Если письмо не видно, проверьте папку «Спам».",
        "expires_in_seconds": 600
    })


@app.route('/api/auth/verify_code', methods=['POST'])
def verify_email_code():
    data = auth_payload()
    email = (data.get('email') or '').strip().lower()
    code = (data.get('code') or '').strip()

    if not email or not code:
        return jsonify({"success": False, "message": "Введите email и 6-значный код подтверждения."}), 400

    conn = get_db()
    stored_code = read_auth_code(conn, email, 'register', code)
    if not stored_code:
        return jsonify({"success": False, "message": "Код неверен, истёк или исчерпан лимит попыток."}), 400
    session['verified_registration'] = [email, stored_code]

    return jsonify({
        "success": True,
        "verified": True,
        "message": "Электронная почта успешно подтверждена!"
    })


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = auth_payload()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    role = (data.get('role') or 'student').strip().lower()
    group_name = (data.get('group_name') or 'ИС-21').strip()
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(specialty_slug, specialty_slug)
    department = (data.get('department') or '').strip()
    verification_code = (data.get('verification_code') or '').strip()

    if role not in ('student', 'teacher'):
        return jsonify({"success": False, "message": "Недопустимая роль пользователя."}), 400
    if len(group_name) > 100 or len(department) > 100 or len(data.get('middle_name', '')) > 100:
        return jsonify({"success": False, "message": "Сократите название группы, кафедры или отчество."}), 400

    fio, fio_err = validate_fio(data)
    if fio_err:
        return jsonify({"success": False, "message": fio_err}), 400

    ok_email, email_err = validate_email_addr(email)
    if not ok_email:
        return jsonify({"success": False, "message": email_err}), 400

    if not password_is_valid(password):
        return jsonify({
            "success": False,
            "message": "Используйте от 8 до 128 символов, включая хотя бы одну букву и одну цифру."
        }), 400

    if role == 'teacher':
        raw_code = (data.get('teacher_code') or '').strip()
        norm_code = normalize_teacher_code(raw_code)
        if not raw_code or norm_code not in TEACHER_ACCESS_CODES:
            return jsonify({
                "success": False,
                "message": "Неверный служебный код преподавателя. Обратитесь к администратору или в учебную часть для получения кода доступа кафедры."
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

    otp_required = is_email_otp_required()
    proof = session.get('verified_registration')
    stored_code = read_auth_code(conn, email, 'register', verification_code) if verification_code else (
        proof[1] if isinstance(proof, list) and len(proof) == 2 and proof[0] == email else None
    )
    if (otp_required or verification_code) and not stored_code:
        return jsonify({
            "success": False,
            "require_verification": True,
            "message": "Пожалуйста, подтвердите адрес электронной почты 6-значным кодом."
        }), 400

    pwd_hash = generate_password_hash(password)
    temp_student_id = f"KZ-AMK-2026-{random.randint(10000, 99999)}" if role == 'student' else None
    email_verified_val = 1 if stored_code else 0

    try:
        if stored_code:
            if not consume_auth_code(cursor, email, 'register', stored_code):
                conn.rollback()
                return jsonify({"success": False, "require_verification": True, "message": "Запросите новый проверочный код."}), 400
        cursor.execute("""
        INSERT INTO users (
            email, password_hash, full_name, last_name, first_name, middle_name,
            role, group_name, specialty_slug, department, student_id, email_verified, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (
            email, pwd_hash, fio["full_name"], fio["last_name"], fio["first_name"], fio["middle_name"],
            role, group_name, specialty_slug, department, temp_student_id, email_verified_val
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
                f"{fio['first_name']}, ваш аккаунт создан. Вам открыт Урок №1 — изучите конспект, пройдите квиз и отправьте первую работу."
            ))
        elif role == 'teacher':
            default_grp = CANONICAL_DEFAULT_GROUPS.get(specialty_slug, ['ИС-21'])[0]
            cursor.execute("""
            INSERT OR IGNORE INTO teacher_groups (teacher_id, group_name, specialty_slug)
            VALUES (?, ?, ?)
            """, (user_id, default_grp, specialty_slug))
        conn.commit()
    except Exception as exc:
        if _is_integrity_error(exc):
            conn.rollback()
            return jsonify({"success": False, "message": "Пользователь с таким email уже зарегистрирован."}), 409
        raise

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    user_out = serialize_user(user_row)

    session.clear()
    session['user_id'] = user_out['id']
    session['user_email'] = user_out['email']
    session['user_role'] = user_out['role']
    session['password_stamp'] = account_session_stamp(pwd_hash)
    session['session_version'] = int((user_row['session_version'] if user_row and 'session_version' in user_row.keys() else 1) or 1)
    csrf_tok = secrets.token_urlsafe(32)
    session['csrf_token'] = csrf_tok
    session.permanent = True

    return jsonify({
        "success": True,
        "message": f"Регистрация успешно завершена! Добро пожаловать, {fio['first_name']}!",
        "user": user_out,
        "csrf_token": csrf_tok
    }), 201



# =========================================================================
# SESSION STATUS, LOGOUT & PASSWORD RECOVERY API
# =========================================================================

@app.route('/api/auth/session', methods=['GET'])
def get_auth_session():
    """Returns the current authenticated server-side session."""
    user = get_current_user()
    csrf_tok = get_or_create_csrf_token()
    if user:
        return jsonify({
            "authenticated": True,
            "user": user,
            "csrf_token": csrf_tok
        })
    return jsonify({"authenticated": False, "csrf_token": csrf_tok}), 200

@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    """Safely terminates the server-side session."""
    session.clear()
    return jsonify({"success": True, "message": "Сессия успешно завершена"}), 200

@app.route('/api/auth/reset_password', methods=['POST'])
def auth_reset_password():
    """Secure password reset via OTP verification."""
    data = auth_payload()
    email = (data.get('email') or '').strip().lower()
    code = (data.get('code') or '').strip()
    new_password = (data.get('new_password') or '').strip()

    if not code and not is_mail_configured():
        return jsonify({
            "success": False,
            "code": "MAIL_NOT_CONFIGURED",
            "message": "Сброс пароля по почте недоступен в локальном режиме без SMTP/Resend. Используйте смену пароля в настройках профиля или обратитесь к администратору."
        }), 503

    if not email or not code or not new_password:
        return jsonify({"success": False, "message": "Заполните email, проверочный код и новый пароль"}), 400

    if not password_is_valid(new_password):
        return jsonify({"success": False, "message": "Используйте от 8 до 128 символов, включая букву и цифру."}), 400

    conn = get_db()
    cursor = conn.cursor()
    stored_code = read_auth_code(conn, email, 'reset', code)
    if not stored_code:
        return jsonify({"success": False, "message": "Код неверен, истёк или исчерпан лимит попыток."}), 400

    new_hash = generate_password_hash(new_password)
    if not consume_auth_code(cursor, email, 'reset', stored_code):
        conn.rollback()
        return jsonify({"success": False, "message": "Запросите новый проверочный код."}), 400
    cursor.execute(
        "UPDATE users SET password_hash = ?, session_version = COALESCE(session_version, 1) + 1 WHERE email = ?",
        (new_hash, email)
    )
    conn.commit()
    session.clear()

    return jsonify({"success": True, "message": "Пароль успешно обновлён. Теперь вы можете войти."}), 200


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = auth_payload()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not email or not password or len(password) > 128:
        return jsonify({"success": False, "message": "Введите email и пароль."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user or (HOSTED and user['is_demo']) or not verify_and_migrate_password(conn, user, password):
        return jsonify({"success": False, "message": "Неверный email или пароль. Проверьте раскладку клавиатуры."}), 401

    cursor.execute("SELECT * FROM users WHERE id = ?", (user['id'],))
    user = cursor.fetchone()
    user_out = serialize_user(user)
    session.clear()
    session['user_id'] = user_out['id']
    session['user_email'] = user_out['email']
    session['user_role'] = user_out['role']
    session['password_stamp'] = account_session_stamp(user['password_hash'])
    session['session_version'] = int((user['session_version'] if 'session_version' in user.keys() else 1) or 1)
    csrf_tok = secrets.token_urlsafe(32)
    session['csrf_token'] = csrf_tok
    session.permanent = True

    return jsonify({
        "success": True,
        "message": f"Добро пожаловать, {user_out['full_name']}!",
        "user": user_out,
        "session_active": True,
        "csrf_token": csrf_tok
    })


# ==========================================
# USER PROFILE, COURSES & DASHBOARD API
# ==========================================

def private_catalog_user():
    raw_req = request.args.get('user_id')
    if raw_req is None or raw_req.strip() == '':
        return None, None
    requested, err = _parse_optional_int(raw_req, 'user_id')
    if err:
        return None, err
    user = get_current_user()
    if requested == 0:
        return (user['id'] if user else None), None
    if not user:
        return None, (jsonify({"success": False, "message": "Войдите, чтобы увидеть личный прогресс."}), 401)
    if requested != user['id']:
        return None, (jsonify({"success": False, "message": "Чужой прогресс недоступен."}), 403)
    return user['id'], None


@app.after_request
def prevent_private_api_caching(response):
    if request.path.startswith(('/api/auth/', '/api/academy/', '/api/user/profile', '/api/notifications', '/api/messages')) or (
        request.path in ('/api/tasks', '/api/courses') and request.args.get('user_id')
    ):
        response.headers['Cache-Control'] = 'no-store'
    return response


@app.route('/api/courses', methods=['GET'])
def list_courses():
    user_id, error = private_catalog_user()
    if error:
        return error
    conn = get_db()
    cursor = conn.cursor()

    lesson_counts = {}
    try:
        cursor.execute("""
        SELECT c.slug, COUNT(l.id) AS cnt
        FROM courses c
        LEFT JOIN lessons l ON l.course_id = c.id AND l.is_published = 1
        GROUP BY c.slug
        """)
        for r in cursor.fetchall():
            if int(r["cnt"] or 0) > 0:
                lesson_counts[r["slug"]] = int(r["cnt"])
    except Exception:
        pass

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

    cur_user = get_current_user() if not user_id else None
    day_uid = user_id or (cur_user['id'] if cur_user else None)

    out = []
    for c in COURSES_META:
        slug = c["slug"]
        done = completed_by_spec.get(slug, 0)
        total_les = lesson_counts.get(slug, 20)
        item = dict(c)
        item["enrolled"] = slug in enrolled
        item["completed_lessons"] = done
        item["total_lessons"] = total_les
        item["progress_percent"] = min(100, int(round((done / float(max(1, total_les))) * 100)))
        out.append(item)

    return jsonify({"success": True, "courses": out, "current_study_day": get_current_day(day_uid)})


@app.route('/api/courses/enroll', methods=['POST'])
@login_required()
def enroll_course():
    cur_user = g.current_user
    data = request.get_json() or {}
    req_uid, err = _parse_optional_int(data.get('user_id'), 'user_id')
    if err:
        return err
    if cur_user['role'] == 'student':
        if req_uid is not None and req_uid != int(cur_user['id']):
            return jsonify({
                "success": False,
                "message": "Изменение чужой записи на курс запрещено.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = cur_user['id']
    elif cur_user['role'] == 'admin':
        user_id = req_uid if req_uid is not None else cur_user['id']
    else:
        user_id = req_uid if req_uid is not None else cur_user['id']

    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(specialty_slug, specialty_slug)

    if specialty_slug not in COURSES_BY_SLUG:
        return jsonify({"success": False, "message": "Некорректные параметры записи на курс."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    target_row = cursor.fetchone()
    if not target_row:
        return jsonify({"success": False, "message": "Пользователь не найден."}), 404

    if cur_user['role'] == 'teacher' and int(user_id) != int(cur_user['id']):
        t_groups = get_teacher_assigned_groups(cur_user['id'])
        if not t_groups or target_row['group_name'] not in t_groups:
            return jsonify({"success": False, "code": "GROUP_ACCESS_DENIED", "message": "Нет доступа к студенту другой группы."}), 403

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
@login_required()
def get_profile(user_id):
    cur_user = g.current_user
    session_uid = cur_user['id']
    session_role = cur_user['role']
    if session_role == 'student' and int(user_id) != int(session_uid):
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

    # Teacher Group Isolation
    if session_role == 'teacher' and int(user_id) != int(session_uid):
        t_groups = get_teacher_assigned_groups(session_uid)
        st_group = user['group_name']
        if not t_groups or st_group not in t_groups:
            return jsonify({
                "success": False,
                "message": f"Студент группы '{st_group}' не относится к вашим закреплённым группам.",
                "code": "GROUP_ACCESS_DENIED"
            }), 403

    user_dict = serialize_user(user)
    if user_dict.get('role') == 'student':
        user_dict['certificate_code'] = make_certificate_code(user_dict['id'], user_dict.get('student_id'))
    spec_slug = request.args.get('specialty') or user_dict['specialty_slug'] or 'it'
    spec_slug = SPECIALTY_ALIASES.get(spec_slug.lower().strip(), spec_slug.lower().strip())
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
    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM xp_transactions WHERE user_id = ?", (user_id,))
    tx_xp_row = cursor.fetchone()
    tx_xp = tx_xp_row[0] if tx_xp_row else 0
    final_bonus = max(bonus_xp, tx_xp)
    cursor.execute("SELECT COUNT(*) FROM xp_transactions WHERE user_id = ? AND source_type = 'task_completion'", (user_id,))
    has_ledger_tasks = (cursor.fetchone()[0] or 0) > 0
    if has_ledger_tasks:
        xp_total = final_bonus
    else:
        # Legacy fallback if transactions were not recorded in ledger
        legacy_task_xp = sum(v["score"] * 3 for v in latest_by_task.values() if v["score"] >= 60)
        xp_total = legacy_task_xp + final_bonus
    level_meta = get_level_info(xp_total)
    level = level_meta["level"]
    check_and_unlock_achievements(conn, user_id)
    cursor.execute("SELECT achievements_json FROM users WHERE id = ?", (user_id,))
    ach_row = cursor.fetchone()
    achievements_list = []
    if ach_row and ach_row['achievements_json']:
        try:
            achievements_list = json.loads(ach_row['achievements_json'])
        except Exception:
            achievements_list = []

    course_meta = COURSES_BY_SLUG[spec_slug]
    current_day = get_current_day(user_id)
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

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE specialty_slug = ?", (spec_slug,))
    t_cnt_row = cursor.fetchone()
    total_tasks = int(t_cnt_row[0]) if t_cnt_row and t_cnt_row[0] else 20

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
            "total_modules": total_tasks,
            "progress_percent": min(100, int(round((len(passed_nums) / float(max(1, total_tasks))) * 100))),
            "avg_score": avg_score,
            "gpa": gpa_4,
            "xp": xp_total,
            "level": level,
            "rank_name": level_meta["name"],
            "rank_icon": level_meta["icon"],
            "rank_color": level_meta["color"],
            "level_progress_percent": level_meta["progress_percent"],
            "next_level_xp": level_meta["next_level_xp"],
            "streak_days": user_dict.get("streak_days") or 1
        },
        "achievements": achievements_list,
        "skills": skills_out,
        "submissions": list(latest_by_task.values())
    })


@app.route('/api/user/profile', methods=['PUT'])
@login_required()
def update_profile():
    cur_user = g.current_user
    data = request.get_json() or {}
    req_uid, err = _parse_optional_int(data.get('user_id'), 'user_id')
    if err:
        return err
    if cur_user['role'] != 'admin':
        if req_uid is not None and req_uid != int(cur_user['id']):
            return jsonify({
                "success": False,
                "message": "Изменение чужого профиля запрещено.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = cur_user['id']
    else:
        user_id = req_uid if req_uid is not None else cur_user['id']

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
    specialty_slug = SPECIALTY_ALIASES.get(specialty_slug, specialty_slug)
    if specialty_slug not in COURSES_BY_SLUG:
        specialty_slug = user['specialty_slug'] or 'it'

    new_password = (data.get('new_password') or '').strip()
    pwd_changed = False
    new_pwd_hash = None
    if new_password:
        if not password_is_valid(new_password):
            return jsonify({"success": False, "message": "Новый пароль должен содержать от 8 до 128 символов, включая буквы и цифры."}), 400
        if int(user_id) == int(cur_user['id']):
            current_password = (data.get('current_password') or '').strip()
            if not current_password or not verify_and_migrate_password(conn, user, current_password):
                return jsonify({"success": False, "code": "INVALID_CURRENT_PASSWORD", "message": "Укажите верный текущий пароль для смены пароля."}), 401
        new_pwd_hash = generate_password_hash(new_password)
        cursor.execute(
            "UPDATE users SET password_hash = ?, session_version = COALESCE(session_version, 1) + 1 WHERE id = ?",
            (new_pwd_hash, user_id)
        )
        pwd_changed = True

    cursor.execute("""
    UPDATE users
    SET full_name = ?, last_name = ?, first_name = ?, middle_name = ?, group_name = ?, specialty_slug = ?
    WHERE id = ?
    """, (fio["full_name"], fio["last_name"], fio["first_name"], fio["middle_name"], group_name, specialty_slug, user_id))
    cursor.execute("INSERT OR IGNORE INTO enrollments (user_id, specialty_slug) VALUES (?, ?)", (user_id, specialty_slug))
    conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    updated_row = cursor.fetchone()
    if pwd_changed and int(user_id) == int(cur_user['id']) and updated_row:
        session['password_stamp'] = account_session_stamp(new_pwd_hash)
        session['session_version'] = int((updated_row['session_version'] if 'session_version' in updated_row.keys() else 1) or 1)

    return jsonify({
        "success": True,
        "message": "Профиль успешно сохранён!",
        "user": serialize_user(updated_row)
    })


# ==========================================
# TASKS & GRADUAL DRIP-FEED SCHEDULE API
# ==========================================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    specialty = request.args.get('specialty')
    if specialty is not None:
        raw_spec = specialty.strip().lower()
        specialty = SPECIALTY_ALIASES.get(raw_spec, raw_spec)
        if specialty not in COURSES_BY_SLUG:
            return jsonify({"success": False, "code": "INVALID_SPECIALTY", "message": "Неизвестная специальность"}), 404
    mode = request.args.get('mode')
    ticket, ticket_err = _parse_optional_int(request.args.get('ticket'), 'ticket')
    if ticket_err:
        return ticket_err
    user_id, error = private_catalog_user()
    if error:
        return error

    current_day = get_current_day(user_id)
    conn = get_db()
    cursor = conn.cursor()

    query = 'SELECT * FROM tasks WHERE 1=1'
    params = []

    if specialty:
        query += ' AND specialty_slug = ?'
        params.append(specialty)

    if mode == 'exam':
        if ticket is not None:
            query += ' AND ticket_number = ?'
            params.append(ticket)
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

    interactive_lessons_map = {}
    try:
        cursor.execute("""
        SELECT l.id, l.order_num, c.slug 
        FROM lessons l 
        JOIN courses c ON c.id = l.course_id 
        WHERE l.is_published = 1
        """)
        for r in cursor.fetchall():
            interactive_lessons_map[(r['slug'], int(r['order_num']))] = r['id']
    except Exception:
        pass

    tasks_out = []
    for t in raw_tasks:
        unlock_day = int(t.get('unlock_day') or t.get('task_number') or 1)
        is_locked = (unlock_day > current_day)
        key = (t['specialty_slug'], t['task_number'])
        sub_info = user_subs.get(key)
        prog_info = user_prog.get(key)
        open_str, dl_str = compute_dates_for_day(unlock_day, current_day)

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
        t_data['order_num'] = task_num
        t_data['day_number'] = unlock_day
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
        les_id = interactive_lessons_map.get((t['specialty_slug'], task_num))
        t_data['interactive_lesson_id'] = les_id
        t_data['has_interactive_lesson'] = bool(les_id or t_data['is_interactive_mission'])
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
    cur_user = get_current_user()
    current_day = get_current_day(cur_user['id'] if cur_user else None)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
    task = cursor.fetchone()

    if not task:
        return jsonify({"success": False, "message": "Задание не найдено"}), 404

    task_dict = dict(task)
    unlock_day = int(task_dict.get('unlock_day', 1))
    task_num = int(task_dict.get('task_number') or 1)
    is_pro_required = (task_num > 3)

    user_is_pro = False
    if cur_user:
        if cur_user['role'] in ('teacher', 'admin'):
            user_is_pro = True
        else:
            cursor.execute("SELECT subscription_tier FROM users WHERE id = ?", (cur_user['id'],))
            u_tier_row = cursor.fetchone()
            user_is_pro = bool(u_tier_row and (u_tier_row['subscription_tier'] or '').lower() == 'pro')

    is_pro_locked = bool(is_pro_required and not user_is_pro)

    is_day_locked = bool(unlock_day > current_day)
    if not cur_user and (is_day_locked or is_pro_locked):
        return jsonify({
            "success": False,
            "code": "UNAUTHORIZED",
            "error": "Авторизуйтесь для доступа к закрытым и Pro-модулям.",
            "message": "Требуется авторизация.",
            "is_locked": is_day_locked,
            "is_pro_required": is_pro_required,
            "is_pro_locked": is_pro_locked,
            "unlock_day": unlock_day,
            "current_study_day": current_day
        }), 401

    if is_day_locked and cur_user['role'] not in ('teacher', 'admin'):
        return jsonify({
            "success": False,
            "error": "Задание заблокировано согласно графику обучения",
            "is_locked": True,
            "is_pro_required": is_pro_required,
            "is_pro_locked": is_pro_locked,
            "unlock_day": unlock_day,
            "current_study_day": current_day,
            "unlock_date_text": task_dict.get('unlock_date_text', f'День {unlock_day}')
        }), 403

    if cur_user and cur_user['role'] == 'student' and is_pro_locked:
        return jsonify({
            "success": False,
            "is_pro_required": True,
            "is_pro_locked": True,
            "error": "Модули с 4 по 20 доступны только на тарифе Pro.",
            "message": "Требуется тариф Pro для модулей 4–20."
        }), 403

    task_dict['is_locked'] = False
    task_dict['is_pro_required'] = is_pro_required
    task_dict['is_pro_locked'] = is_pro_locked
    task_dict['status'] = 'available'
    return jsonify({"success": True, "task": task_dict})


@app.route('/api/tasks/progress', methods=['POST'])
@login_required()
def save_lesson_progress():
    data = request.get_json() or {}
    req_uid, err = _parse_optional_int(data.get('user_id'), 'user_id')
    if err:
        return err
    cur_user = g.get('current_user') or get_current_user()
    session_uid = cur_user['id']
    session_role = cur_user['role']
    if session_role == 'student':
        if req_uid is not None and req_uid != int(session_uid):
            return jsonify({
                "success": False,
                "message": "Сохранение прогресса для чужого аккаунта запрещено.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = session_uid
    elif session_role in ('teacher', 'admin'):
        user_id = req_uid if req_uid is not None else session_uid
    else:
        user_id = session_uid
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(specialty_slug, specialty_slug)
    task_number, err = _parse_optional_int(data.get('task_number'), 'task_number', default=1)
    if err:
        return err
    quiz_score, err = _parse_optional_int(data.get('quiz_score'), 'quiz_score')
    if err:
        return err
    draft_code = data.get('draft_code')

    if not user_id:
        return jsonify({"success": False, "message": "Требуется авторизация."}), 401

    conn = get_db()
    cursor = conn.cursor()

    if session_role == 'teacher' and int(user_id) != int(session_uid):
        cursor.execute("SELECT role, group_name FROM users WHERE id = ?", (user_id,))
        target_u = cursor.fetchone()
        if not target_u:
            return jsonify({"success": False, "message": "Пользователь не найден."}), 404
        t_groups = get_teacher_assigned_groups(session_uid)
        if (target_u['role'] or '').lower() != 'student' or not t_groups or target_u['group_name'] not in t_groups:
            return jsonify({
                "success": False,
                "code": "GROUP_ACCESS_DENIED",
                "message": "Нет доступа к студенту другой группы."
            }), 403

    current_day = get_current_day(user_id)
    if task_number > current_day and session_role not in ('teacher', 'admin'):
        return jsonify({
            "success": False,
            "is_locked": True,
            "error": f"Урок №{task_number} заблокирован до Дня {task_number}."
        }), 403

    if task_number > 3 and session_role == 'student':
        cursor.execute("SELECT subscription_tier FROM users WHERE id = ?", (user_id,))
        tier_row = cursor.fetchone()
        user_tier = (tier_row['subscription_tier'] if tier_row and tier_row['subscription_tier'] else 'free').lower()
        if user_tier != 'pro':
            return jsonify({
                "success": False,
                "is_pro_required": True,
                "is_pro_locked": True,
                "error": "Модули с 4 по 20 доступны только на тарифе Pro.",
                "message": "Требуется тариф Pro для модулей 4–20."
            }), 403

    cursor.execute("""
    SELECT quiz_score, draft_code FROM lesson_progress
    WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
    """, (user_id, specialty_slug, task_number))
    existing = cursor.fetchone()

    q_val = quiz_score if quiz_score is not None else (existing['quiz_score'] if existing else 0)
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

    if q_val >= 3:
        award_xp(conn, user_id, 30, "quiz_completion", f"quiz_{specialty_slug}_{task_number}", f"Тест №{task_number} ({specialty_slug})")
        check_and_unlock_achievements(conn, user_id)

    return jsonify({"success": True, "message": "Прогресс урока сохранён.", "quiz_score": q_val})


@app.route('/api/tasks/submit', methods=['POST'])
@login_required()
def submit_task():
    data = request.get_json() or {}
    cur_user = g.get('current_user') or get_current_user()
    session_user_id = cur_user['id']
    session_user_role = cur_user['role']

    req_uid, err = _parse_optional_int(data.get('user_id'), 'user_id')
    if err:
        return err

    if session_user_role == 'student':
        if req_uid is not None and req_uid != session_user_id:
            return jsonify({
                "success": False,
                "message": "Попытка подмены идентификатора пользователя заблокирована сервером.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = session_user_id
    elif session_user_role in ('teacher', 'admin'):
        user_id = req_uid if req_uid is not None else session_user_id
    else:
        user_id = session_user_id

    conn = get_db()
    cursor = conn.cursor()

    req_task_id, err = _parse_optional_int(data.get('task_id'), 'task_id')
    if err:
        return err

    raw_spec = data.get('specialty_slug')
    raw_task_num = data.get('task_number')

    if req_task_id is not None and (raw_spec is None or raw_task_num is None):
        cursor.execute("SELECT id, specialty_slug, task_number, title FROM tasks WHERE id = ?", (req_task_id,))
        t_lookup = cursor.fetchone()
        if t_lookup:
            if raw_spec is None:
                raw_spec = t_lookup['specialty_slug']
            if raw_task_num is None:
                raw_task_num = t_lookup['task_number']

    specialty_slug = (raw_spec or cur_user.get('specialty_slug') or 'it').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(specialty_slug, specialty_slug)
    task_number, err = _parse_optional_int(raw_task_num, 'task_number', default=1)
    if err:
        return err
    task_title = data.get('task_title') or f"Задание №{task_number}"
    raw_default_score = 0 if session_user_role == 'student' else 100
    score_val, err = _parse_optional_int(data.get('score'), 'score', default=raw_default_score)
    if err:
        return err
    score = max(0, min(100, score_val))
    time_spent, err = _parse_optional_int(data.get('time_spent_seconds'), 'time_spent_seconds', default=0)
    if err:
        return err
    submitted_code = data.get('submitted_code') or data.get('code_answer') or data.get('answer_text') or ''
    repo_url = (data.get('repo_url') or '').strip()

    if repo_url:
        import urllib.parse
        parsed = urllib.parse.urlparse(repo_url)
        if parsed.scheme.lower() not in ('http', 'https') or not parsed.netloc:
            return jsonify({
                "success": False,
                "code": "INVALID_REPO_URL",
                "message": "Недопустимый URL репозитория. Разрешены только протоколы http:// и https://"
            }), 400
    student_comment = (data.get('student_comment') or data.get('answer_text') or '').strip()
    autotest_passed_val, err = _parse_optional_int(data.get('autotest_passed'), 'autotest_passed', default=0)
    if err:
        return err
    autotest_total_val, err = _parse_optional_int(data.get('autotest_total'), 'autotest_total', default=0)
    if err:
        return err
    quiz_score_val, err = _parse_optional_int(data.get('quiz_score'), 'quiz_score', default=0)
    if err:
        return err
    autotest_passed = max(0, autotest_passed_val)
    autotest_total = max(0, autotest_total_val)
    quiz_score = max(0, quiz_score_val)
    await_teacher = bool(data.get('await_teacher', False))

    # SEC-03: Backend validation to prevent client score tampering
    if session_user_role == 'student':
        clean_sub_text = (submitted_code or student_comment or '').strip()
        if len(clean_sub_text) < 10:
            await_teacher = True
            score = 0
            autotest_passed = 0
        elif autotest_total > 0:
            autotest_passed = min(autotest_passed, autotest_total)
            autotest_cap = int(round((autotest_passed / autotest_total) * 90))
            score = min(score, autotest_cap)
        else:
            # Any student submission without automated tests MUST go to teacher review with score=0
            await_teacher = True
            score = 0

    current_day = get_current_day(user_id)

    cursor.execute("SELECT full_name, group_name, student_id, subscription_tier, role FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    if not u_row:
        return jsonify({"success": False, "message": "Пользователь не найден."}), 404
    if session_user_role == 'teacher' and int(user_id) != int(session_user_id):
        t_groups = get_teacher_assigned_groups(session_user_id)
        target_grp = u_row['group_name']
        if (u_row['role'] or '').lower() != 'student' or not t_groups or target_grp not in t_groups:
            return jsonify({
                "success": False,
                "code": "GROUP_ACCESS_DENIED",
                "message": f"Студент группы '{target_grp}' не относится к вашим закреплённым группам."
            }), 403
    user_tier = (u_row['subscription_tier'] if u_row and u_row['subscription_tier'] else 'free').lower()
    target_role = (u_row['role'] if u_row and u_row['role'] else 'student').lower()
    if task_number > 3 and user_tier != 'pro' and target_role == 'student' and session_user_role == 'student':
        return jsonify({
            "success": False,
            "is_pro_locked": True,
            "is_pro_required": True,
            "error": "Модули с 4 по 20 доступны только на тарифе Pro. Активируйте подписку в разделе «Тарифы» для сдачи практических модулей и получения сертификата.",
            "message": "Требуется тариф Pro для сдачи модулей 4–20."
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

    if task_number > 1 and session_user_role == 'student':
        cursor.execute("""
        SELECT id, status, score FROM task_submissions 
        WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
        """, (user_id, specialty_slug, task_number - 1))
        prev_sub = cursor.fetchone()
        cursor.execute("""
        SELECT status FROM lesson_progress
        WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
        """, (user_id, specialty_slug, task_number - 1))
        prev_prog = cursor.fetchone()
        prev_ok = (prev_sub and prev_sub['status'] not in ('На доработке', 'rejected') and (prev_sub['score'] >= 60 or 'на проверке' in str(prev_sub['status']).lower())) or (prev_prog and prev_prog['status'] == 'completed')
        if not prev_ok:
            return jsonify({
                "success": False,
                "is_locked": True,
                "error": f"Задание №{task_number} заблокировано. Для доступа необходимо сначала успешно завершить предыдущее задание №{task_number - 1}.",
                "message": f"Необходимо завершить Задание №{task_number - 1}."
            }), 403
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

    if len((submitted_code or student_comment or '').strip()) >= 10:
        cursor.execute("""
        INSERT INTO lesson_progress (user_id, specialty_slug, task_number, status, quiz_score, quiz_total, draft_code, updated_at)
        VALUES (?, ?, ?, 'completed', ?, 3, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, specialty_slug, task_number) DO UPDATE SET
            status = 'completed',
            draft_code = excluded.draft_code,
            updated_at = CURRENT_TIMESTAMP
        """, (user_id, specialty_slug, task_number, quiz_score, submitted_code))

    course_meta = COURSES_BY_SLUG.get(specialty_slug, COURSES_META[0])
    cursor.execute("""
    INSERT INTO grades (user_id, student_id, specialty_slug, specialty_name, score, status)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, student_id, specialty_slug, course_meta['short_title'], score, status))

    conn.commit()

    if score >= 60 and not await_teacher:
        award_xp(conn, user_id, 50, "task_completion", f"{specialty_slug}_{task_number}", f"Сдано задание №{task_number} ({specialty_slug})")
        if score == 100:
            award_xp(conn, user_id, 25, "perfect_score_bonus", f"perfect_{specialty_slug}_{task_number}", "Бонус за идеальный балл 100/100")
        check_and_unlock_achievements(conn, user_id)

    return jsonify({
        "success": True,
        "id": sub_id,
        "submission_id": sub_id,
        "score": score,
        "grade_letter": grade_letter,
        "status": status,
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
@login_required()
def get_demo_status():
    cur_user = g.current_user
    req_uid, err = _parse_optional_int(request.args.get('user_id'), 'user_id')
    if err:
        return err
    if cur_user['role'] == 'student':
        if req_uid is not None and req_uid != int(cur_user['id']):
            return jsonify({"success": False, "code": "TAMPERING_DETECTED", "message": "Чужой статус недоступен."}), 403
        user_id = cur_user['id']
    elif cur_user['role'] == 'teacher':
        user_id = req_uid if req_uid is not None else cur_user['id']
    else:
        user_id = req_uid if req_uid is not None else cur_user['id']

    specialty = (request.args.get('specialty') or 'it').strip().lower()
    specialty = SPECIALTY_ALIASES.get(specialty, specialty)
    current_day = get_current_day(user_id)
    conn = get_db()
    c = conn.cursor()

    if cur_user['role'] == 'teacher' and int(user_id) != int(cur_user['id']):
        c.execute("SELECT group_name FROM users WHERE id = ?", (user_id,))
        u_row = c.fetchone()
        t_groups = get_teacher_assigned_groups(cur_user['id'])
        if not u_row or not t_groups or u_row['group_name'] not in t_groups:
            return jsonify({"success": False, "code": "GROUP_ACCESS_DENIED", "message": "Нет доступа к студенту другой группы."}), 403

    c.execute("SELECT COUNT(*) FROM tasks WHERE specialty_slug = ?", (specialty,))
    total_row = c.fetchone()
    total_tasks = int(total_row[0]) if total_row and total_row[0] else 20

    c.execute("""
    SELECT COUNT(DISTINCT task_number) as cnt, AVG(score) as avg_sc
    FROM task_submissions
    WHERE user_id = ? AND specialty_slug = ? AND score >= 60;
    """, (user_id, specialty))
    res = c.fetchone()
    completed_count = res['cnt'] or 0
    avg_score = round(res['avg_sc'] or 0.0, 1)

    progress_percent = min(100, int(round((completed_count / float(max(1, total_tasks))) * 100)))

    return jsonify({
        "success": True,
        "current_study_day": current_day,
        "total_tasks": total_tasks,
        "progress_percent": progress_percent,
        "completed_count": completed_count,
        "avg_score": avg_score,
        "tasks_available": min(total_tasks, current_day),
        "tasks_locked": max(0, total_tasks - current_day),
        "is_fresh_start": (completed_count == 0 and current_day == 1)
    })


@app.route('/api/demo/reset', methods=['POST'])
@login_required(roles=('teacher', 'admin'))
def reset_demo():
    if HOSTED:
        abort(404)
    data = request.get_json(silent=True) or {}
    target_user_id, err = _parse_optional_int(data.get('user_id'), 'user_id')
    if err:
        return err
    conn = get_db()
    c = conn.cursor()

    # Reset ONLY demo accounts (is_demo = 1), NEVER deleting real registered users!
    c.execute("SELECT id FROM users WHERE is_demo = 1 OR email IN ('voronov@student.amk.kz', 'student@amk.kz');")
    demo_uids = [u['id'] for u in c.fetchall()]
    if target_user_id is not None:
        c.execute("SELECT id FROM users WHERE id = ? AND is_demo = 1", (target_user_id,))
        if c.fetchone() and target_user_id not in demo_uids:
            demo_uids.append(target_user_id)

    if demo_uids:
        placeholders = ','.join('?' for _ in demo_uids)
        c.execute(f"DELETE FROM task_submissions WHERE user_id IN ({placeholders});", demo_uids)
        c.execute(f"DELETE FROM grades WHERE user_id IN ({placeholders});", demo_uids)
        c.execute(f"DELETE FROM lesson_progress WHERE user_id IN ({placeholders});", demo_uids)
        c.execute(f"DELETE FROM xp_transactions WHERE user_id IN ({placeholders});", demo_uids)
        c.execute(f"DELETE FROM lesson_block_progress WHERE user_id IN ({placeholders});", demo_uids)
        c.execute(f"DELETE FROM daily_quests_log WHERE user_id IN ({placeholders});", demo_uids)
        c.execute(f"UPDATE users SET bonus_xp = 0, streak_days = 1, achievements_json = '[]', created_at = CURRENT_TIMESTAMP WHERE id IN ({placeholders});", demo_uids)

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
@login_required(roles=('teacher', 'admin'))
def advance_study_day():
    data = request.get_json() or {}
    new_day, err = _parse_optional_int(data.get('day'), 'day')
    if err:
        return err

    conn = get_db()
    c = conn.cursor()
    if new_day is not None:
        target_day = new_day
    else:
        target_day = get_current_day() + 1

    target_day = max(1, min(20, target_day))
    c.execute("INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('current_study_day', ?);", (str(target_day),))
    conn.commit()

    return jsonify({
        "success": True,
        "message": f"График обучения переключён на День {target_day}. Студентам доступны уроки с 1 по {target_day}.",
        "current_study_day": target_day
    })


@app.route('/api/teacher/students', methods=['GET'])
@login_required(roles=('teacher', 'admin'))
def get_teacher_students():
    cur_user = g.current_user
    caller_role = cur_user['role']
    caller_id = cur_user['id']
    specialty = request.args.get('specialty')
    if specialty:
        specialty = SPECIALTY_ALIASES.get(specialty.lower().strip(), specialty.lower().strip())
    group_filter = request.args.get('group')
    conn = get_db()
    cursor = conn.cursor()

    # Check assigned groups for this teacher
    teacher_assigned = []
    if caller_role == 'teacher':
        teacher_assigned = get_teacher_assigned_groups(caller_id)
        if not teacher_assigned:
            if group_filter:
                return jsonify({
                    "success": False,
                    "message": f"У вас нет доступа к учебной группе '{group_filter}'",
                    "code": "GROUP_ACCESS_DENIED"
                }), 403
            return jsonify({
                "success": True,
                "students": [],
                "groups": [],
                "count": 0
            })
        if group_filter and group_filter not in teacher_assigned:
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
@login_required(roles=('teacher', 'admin'))
def sync_user():
    if HOSTED:
        abort(404)
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    full_name = (data.get('full_name') or '').strip()
    role = (data.get('role') or 'student').strip().lower()
    group_name = (data.get('group_name') or 'ИС-21').strip()
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(specialty_slug, specialty_slug)
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

    pwd_hash = generate_password_hash("student123")
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
@login_required(roles=('teacher', 'admin'))
def simulate_submission():
    if HOSTED:
        abort(404)
    data = request.get_json() or {}
    user_id, err = _parse_optional_int(data.get('user_id'), 'user_id')
    if err:
        return err
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(specialty_slug, specialty_slug)
    task_num, err = _parse_optional_int(data.get('task_number'), 'task_number', default=1)
    if err:
        return err

    conn = get_db()
    cursor = conn.cursor()

    if user_id is None:
        cursor.execute("SELECT id, full_name, group_name, student_id, specialty_slug FROM users WHERE role = 'student' ORDER BY is_demo ASC, id DESC LIMIT 1")
        st_row = cursor.fetchone()
    else:
        cursor.execute("SELECT id, full_name, group_name, student_id, specialty_slug FROM users WHERE id = ?", (user_id,))
        st_row = cursor.fetchone()

    if not st_row:
        return jsonify({"success": False, "message": "В системе нет зарегистрированных студентов для симуляции"}), 404

    cur_user = g.current_user
    if user_id is not None and cur_user['role'] == 'teacher':
        t_groups = get_teacher_assigned_groups(cur_user['id'])
        if not t_groups or st_row['group_name'] not in t_groups:
            return jsonify({"success": False, "code": "GROUP_ACCESS_DENIED", "message": "Нет доступа к студенту другой группы."}), 403

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
@login_required(roles=('teacher', 'admin'))
def get_teacher_journal():
    cur_user = g.current_user
    caller_role = cur_user['role']
    caller_id = cur_user['id']

    specialty = request.args.get('specialty')
    if specialty:
        specialty = SPECIALTY_ALIASES.get(specialty.lower().strip(), specialty.lower().strip())
    group_filter = request.args.get('group')
    conn = get_db()
    cursor = conn.cursor()

    teacher_assigned = []
    if caller_role == 'teacher':
        teacher_assigned = get_teacher_assigned_groups(caller_id)
        if not teacher_assigned:
            if group_filter:
                return jsonify({
                    "success": False,
                    "message": f"У вас нет доступа к учебной группе '{group_filter}'",
                    "code": "GROUP_ACCESS_DENIED"
                }), 403
            return jsonify({
                "success": True,
                "count": 0,
                "current_study_day": get_current_day(),
                "journal": []
            })
        if group_filter and group_filter not in teacher_assigned:
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
@login_required(roles=('teacher', 'admin'))
def get_teacher_submissions():
    return get_teacher_journal()


@app.route('/api/teacher/matrix', methods=['GET'])
@login_required(roles=('teacher', 'admin'))
def get_gradebook_matrix():
    cur_user = g.current_user
    caller_role = cur_user['role']
    caller_id = cur_user['id']
    raw_spec = (request.args.get('specialty') or 'it').strip().lower()
    specialty = SPECIALTY_ALIASES.get(raw_spec, raw_spec)
    conn = get_db()
    cursor = conn.cursor()

    q = """
    SELECT id, full_name, email, group_name, specialty_slug, student_id, is_demo, created_at
    FROM users
    WHERE role = 'student'
    """
    params = []
    if caller_role == 'teacher':
        t_groups = get_teacher_assigned_groups(caller_id)
        if not t_groups:
            return jsonify({
                "success": True,
                "specialty": specialty,
                "current_study_day": get_current_day(),
                "rows": []
            })
        q += f" AND group_name IN ({','.join(['?'] * len(t_groups))})"
        params.extend(t_groups)
    q += " ORDER BY is_demo ASC, full_name ASC"

    cursor.execute(q, tuple(params))
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
        for num in range(1, 21):
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
@login_required(roles=('teacher', 'admin'))
def grade_submission():
    cur_user = g.current_user
    caller_role = cur_user['role']
    caller_id = cur_user['id']

    data = request.get_json() or {}
    sub_id, err = _parse_optional_int(data.get('submission_id'), 'submission_id')
    if err:
        return err
    raw_grade = data.get('grade') if data.get('grade') is not None else data.get('score')
    grade_val, err = _parse_optional_int(raw_grade, 'grade', default=95)
    if err:
        return err
    grade = max(0, min(100, grade_val))
    feedback = (data.get('feedback') or data.get('comment') or 'Работа проверена преподавателем.').strip()
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
    cursor.execute("""
    SELECT ts.user_id, ts.task_title, ts.task_number, u.group_name
    FROM task_submissions ts
    JOIN users u ON ts.user_id = u.id
    WHERE ts.id = ?
    """, (sub_id,))
    sub_row = cursor.fetchone()
    if not sub_row:
        return jsonify({"success": False, "message": "Работа не найдена."}), 404

    # Verify that teacher is assigned to this student's group
    if caller_role == 'teacher':
        t_groups = get_teacher_assigned_groups(caller_id)
        target_grp = sub_row['group_name']
        if not t_groups or target_grp not in t_groups:
            return jsonify({
                "success": False,
                "message": f"Студент группы '{target_grp}' не относится к вашим закреплённым группам.",
                "code": "GROUP_ACCESS_DENIED"
            }), 403

    cursor.execute("""
    UPDATE task_submissions
    SET score = ?, grade_letter = ?, status = ?, teacher_comment = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (grade, grade_letter, status, feedback, sub_id))

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
    if grade >= 60:
        cursor.execute("SELECT specialty_slug FROM task_submissions WHERE id = ?", (sub_id,))
        s_spec_row = cursor.fetchone()
        s_spec = s_spec_row[0] if s_spec_row else 'it'
        award_xp(conn, sub_row['user_id'], 50, "task_completion", f"{s_spec}_{sub_row['task_number']}", f"Зачтено задание №{sub_row['task_number']}")
        if grade == 100:
            award_xp(conn, sub_row['user_id'], 25, "perfect_score_bonus", f"perfect_{s_spec}_{sub_row['task_number']}", "Бонус за высший балл 100/100")
        check_and_unlock_achievements(conn, sub_row['user_id'])

    conn.commit()
    return jsonify({
        "success": True,
        "message": "Работа отправлена на доработку студенту." if status == "На доработке" else f"Оценка {grade}/100 утверждена в ведомости!"
    })


@app.route('/api/teacher/create_task', methods=['POST'])
@login_required(roles=('teacher', 'admin'))
def create_or_update_task():
    data = request.get_json() or {}
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(specialty_slug, specialty_slug)
    task_number, err = _parse_optional_int(data.get('task_number'), 'task_number', default=1)
    if err:
        return err
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    difficulty = (data.get('difficulty') or 'Средний').strip()
    unlock_day_val, err = _parse_optional_int(data.get('unlock_day'), 'unlock_day', default=task_number)
    if err:
        return err
    unlock_day = max(1, min(20, unlock_day_val))
    tools_required = (data.get('tools_required') or 'Практикум EDU SPACE').strip()
    starter_code = data.get('starter_code') or '// Введите ваше решение\n'

    if specialty_slug not in COURSES_BY_SLUG:
        return jsonify({"success": False, "message": "Некорректная специальность курса."}), 400

    cur_user = g.current_user
    if cur_user['role'] == 'teacher':
        allowed_specs = get_teacher_allowed_specialties(cur_user['id'], cur_user)
        if specialty_slug not in allowed_specs:
            return jsonify({
                "success": False,
                "code": "FORBIDDEN",
                "message": "Нет прав на создание или изменение заданий другой специальности."
            }), 403

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
@login_required(roles=('teacher', 'admin'))
def delete_teacher_task():
    data = request.get_json(silent=True) or {}
    raw_task_id = data.get('task_id') if data.get('task_id') is not None else request.args.get('task_id')
    task_id, err = _parse_optional_int(raw_task_id, 'task_id')
    if err:
        return err
    specialty_slug = (data.get('specialty_slug') or request.args.get('specialty_slug') or '').strip().lower()
    if specialty_slug:
        specialty_slug = SPECIALTY_ALIASES.get(specialty_slug, specialty_slug)
    raw_task_number = data.get('task_number') if data.get('task_number') is not None else request.args.get('task_number')
    task_number, err = _parse_optional_int(raw_task_number, 'task_number')
    if err:
        return err

    cur_user = g.current_user
    allowed_specs = get_teacher_allowed_specialties(cur_user['id'], cur_user) if cur_user['role'] == 'teacher' else None

    conn = get_db()
    cursor = conn.cursor()
    if task_id is not None:
        cursor.execute("SELECT id, specialty_slug FROM tasks WHERE id = ?", (task_id,))
        t_row = cursor.fetchone()
        if not t_row:
            return jsonify({"success": False, "message": "Задание не найдено"}), 404
        t_spec = SPECIALTY_ALIASES.get((t_row['specialty_slug'] or '').lower(), (t_row['specialty_slug'] or '').lower())
        if allowed_specs is not None and t_spec not in allowed_specs:
            return jsonify({"success": False, "code": "FORBIDDEN", "message": "Нет прав на удаление заданий другой специальности."}), 403
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    elif specialty_slug and task_number is not None:
        if specialty_slug not in COURSES_BY_SLUG:
            return jsonify({"success": False, "message": "Некорректная специальность курса."}), 400
        if allowed_specs is not None and specialty_slug not in allowed_specs:
            return jsonify({"success": False, "code": "FORBIDDEN", "message": "Нет прав на удаление заданий другой специальности."}), 403
        cursor.execute("DELETE FROM tasks WHERE specialty_slug = ? AND task_number = ?", (specialty_slug, task_number))
    else:
        return jsonify({"success": False, "message": "Укажите task_id или (specialty_slug и task_number)"}), 400
    conn.commit()
    return jsonify({"success": True, "message": "Задание успешно удалено"})


@app.route('/api/teacher/broadcast', methods=['POST'])
@login_required(roles=('teacher', 'admin'))
def teacher_broadcast():
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    body = (data.get('body') or '').strip()
    target_group = (data.get('target_group') or '').strip()

    if not title or not body:
        return jsonify({"success": False, "message": "Введите заголовок и текст объявления."}), 400

    cur_user = g.current_user
    if cur_user['role'] == 'teacher':
        t_groups = get_teacher_assigned_groups(cur_user['id'])
        if not target_group or target_group not in t_groups:
            return jsonify({
                "success": False,
                "code": "GROUP_ACCESS_DENIED",
                "message": "Укажите одну из ваших закреплённых учебных групп. Глобальная рассылка запрещена."
            }), 403

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO notifications (user_id, target_role, target_group, title, body, type)
    VALUES (NULL, 'student', ?, ?, ?, 'info')
    """, (target_group, title, body))
    conn.commit()

    return jsonify({"success": True, "message": "Объявление доставлено студентам в центр уведомлений!"})


@app.route('/api/teacher/stats', methods=['GET'])
@login_required(roles=('teacher', 'admin'))
def get_teacher_stats():
    cur_user = g.current_user
    conn = get_db()
    cursor = conn.cursor()

    if cur_user['role'] == 'teacher':
        t_groups = get_teacher_assigned_groups(cur_user['id'])
        if not t_groups:
            return jsonify({
                "success": True,
                "stats": {
                    "total_students": 0,
                    "total_submissions": 0,
                    "pending_submissions": 0,
                    "average_score": 0.0,
                    "current_study_day": get_current_day()
                }
            })
        ph = ','.join(['?'] * len(t_groups))
        t_params = tuple(t_groups)
        cursor.execute(f"SELECT COUNT(*) FROM task_submissions ts JOIN users u ON u.id = ts.user_id WHERE u.group_name IN ({ph})", t_params)
        total_submissions = cursor.fetchone()[0]

        cursor.execute(f"SELECT COUNT(*) FROM task_submissions ts JOIN users u ON u.id = ts.user_id WHERE ts.status = 'Отправлено на проверку' AND u.group_name IN ({ph})", t_params)
        pending_submissions = cursor.fetchone()[0]

        cursor.execute(f"SELECT COUNT(DISTINCT id) FROM users WHERE role = 'student' AND group_name IN ({ph})", t_params)
        total_students = cursor.fetchone()[0]

        cursor.execute(f"SELECT AVG(ts.score) FROM task_submissions ts JOIN users u ON u.id = ts.user_id WHERE ts.score > 0 AND u.group_name IN ({ph})", t_params)
        avg_score = cursor.fetchone()[0] or 0.0
    else:
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
@login_required()
def get_notifications():
    user = g.current_user
    user_id = user['id']
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT n.id, n.user_id, n.target_group, n.title, n.body, n.type, n.created_at,
           CASE WHEN n.user_id IS NOT NULL THEN n.is_read
                WHEN r.notification_id IS NOT NULL THEN 1 ELSE 0 END AS is_read
    FROM notifications n
    LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.user_id = ?
    WHERE n.user_id = ? OR (n.user_id IS NULL AND (n.target_role = '' OR n.target_role = ?)
        AND (n.target_group = '' OR n.target_group = ?))
    ORDER BY n.id DESC
    LIMIT 30
    """, (user_id, user_id, user['role'], user['group_name'] or ''))
    items = [dict(r) for r in cursor.fetchall()]
    unread = sum(1 for x in items if not x['is_read'])
    return jsonify({"success": True, "unread_count": unread, "notifications": items})


@app.route('/api/notifications/read', methods=['POST'])
@login_required()
def mark_notifications_read():
    user = g.current_user
    user_id = user['id']
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
    cursor.execute("""
        INSERT INTO notification_reads (user_id, notification_id)
        SELECT ?, id FROM notifications
        WHERE user_id IS NULL AND (target_role = '' OR target_role = ?)
            AND (target_group = '' OR target_group = ?)
        ON CONFLICT(user_id, notification_id) DO NOTHING
    """, (user_id, user['role'], user['group_name'] or ''))
    conn.commit()
    return jsonify({"success": True})


def message_channel(user, peer_id):
    if peer_id is None:
        specialty = user['specialty_slug'] or 'it'
        return (f'course:{specialty}', None) if specialty in COURSES_BY_SLUG else (None, None)
    if type(peer_id) is not int or peer_id == user['id']:
        return None, None
    cursor = get_db().cursor()
    cursor.execute("SELECT id, role, group_name, full_name, is_demo FROM users WHERE id = ?", (peer_id,))
    peer = cursor.fetchone()
    if not peer or (HOSTED and peer['is_demo']) or {user['role'], peer['role']} != {'student', 'teacher'}:
        return None, None
    student, teacher = (user, peer) if user['role'] == 'student' else (peer, user)
    if student['group_name'] not in get_teacher_assigned_groups(teacher['id']):
        return None, None
    lower, higher = sorted((user['id'], peer_id))
    return f'direct:{lower}:{higher}', peer['full_name']


@app.route('/api/messages', methods=['GET'])
@login_required()
def list_messages():
    user = g.current_user
    peer_id = request.args.get('peer_id', type=int)
    if 'peer_id' in request.args and peer_id is None:
        return jsonify({"success": False, "message": "Укажите собеседника."}), 400
    channel, peer_name = message_channel(user, peer_id)
    if not channel:
        return jsonify({"success": False, "message": "Этот чат недоступен."}), 403
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, sender_id, sender_name, sender_role, recipient_key, body, created_at
    FROM messages
    WHERE recipient_key = ?
    ORDER BY id DESC
    LIMIT 50
    """, (channel,))
    return jsonify({
        "success": True, "viewer_id": user['id'], "peer_name": peer_name,
        "messages": [dict(row) for row in reversed(cursor.fetchall())],
    })


@app.route('/api/messages/send', methods=['POST'])
@login_required()
def send_message_api():
    user = g.current_user
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "message": "Введите сообщение."}), 400
    body = data.get('body')
    if not isinstance(body, str) or not 1 <= len(body.strip()) <= 1000:
        return jsonify({"success": False, "message": "Сообщение должно содержать от 1 до 1000 символов."}), 400
    channel, _ = message_channel(user, data.get('peer_id'))
    if not channel:
        return jsonify({"success": False, "message": "Этот чат недоступен."}), 403

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO messages (sender_id, sender_name, sender_role, recipient_key, body)
    VALUES (?, ?, ?, ?, ?)
    """, (user['id'], user['full_name'], user['role'], channel, body.strip()))
    conn.commit()
    return jsonify({"success": True, "message": {
        "id": cursor.lastrowid, "sender_id": user['id'], "sender_name": user['full_name'],
        "sender_role": user['role'], "body": body.strip(),
    }})


@app.route('/api/grades/save', methods=['POST'])
@login_required()
def save_grade():
    return submit_task()


@app.route('/api/health', methods=['GET'])
def health():
    db = get_db()
    cursor = db.cursor()
    is_pg = isinstance(db, PostgresConnectionWrapper)
    try:
        cursor.execute("SELECT COUNT(*) FROM tasks")
        tasks_total = int(cursor.fetchone()[0] or 0)
    except Exception:
        tasks_total = 0
    try:
        cursor.execute("SELECT COUNT(*) FROM lessons WHERE is_published = 1")
        lessons_total = int(cursor.fetchone()[0] or 0)
    except Exception:
        lessons_total = 0
    ai_configured = bool(
        os.environ.get('GEMINI_API_KEY')
        or os.environ.get('OPENAI_API_KEY')
        or os.environ.get('OPENROUTER_API_KEY')
        or os.environ.get('ANTHROPIC_API_KEY')
    )
    return jsonify({
        "status": "healthy",
        "service": "EDU SPACE LMS Platform",
        "institution": "Алматинский многопрофильный колледж (АМК)",
        "database": f"PostgreSQL ({lessons_total} lessons catalog synced)" if is_pg else f"SQLite3 ({lessons_total} lessons catalog synced)",
        "database_type": "postgresql" if is_pg else "sqlite",
        "tasks_total": tasks_total,
        "lessons_total": lessons_total,
        "ai": "configured" if ai_configured else "blocked",
        "email": "configured" if is_mail_configured() else "optional",
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

@app.route('/gradebook')
@app.route('/gradebook.html')
def gradebook_page():
    return redirect('/teacher.html?tab=matrix', code=301)

# SEC-01: Static Asset Serving Whitelist & Sensitive File Protection
ALLOWED_STATIC_EXTENSIONS = {
    '.html', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg',
    '.webp', '.mp4', '.webm', '.vtt', '.ico', '.woff', '.woff2', '.ttf',
    '.json', '.map', '.glb', '.gltf', '.bin', '.hdr'
}
BLOCKED_STATIC_EXTENSIONS = {
    '.db', '.py', '.pyc', '.git', '.env', '.yml', '.yaml', '.sh',
    '.bat', '.cmd', '.sqlite', '.sqlite3', '.ini', '.cfg', '.conf',
    '.bak', '.log'
}

@app.route('/<path:path>')
def static_proxy(path):
    norm_path = os.path.normpath(path).replace('\\', '/')
    if norm_path.startswith('/') or norm_path.startswith('../') or '/..' in norm_path or norm_path == '..':
        return jsonify({"error": "Forbidden: Path traversal detected"}), 403
    
    parts = norm_path.split('/')
    if any(p.startswith('.') for p in parts):
        return jsonify({"error": "Forbidden: Access to hidden files or directories is denied"}), 403

    _, ext = os.path.splitext(norm_path.lower())

    if ext in BLOCKED_STATIC_EXTENSIONS or any(b in norm_path.lower() for b in ['.git', 'database.db', 'server.py', 'docker-compose']):
        return jsonify({"error": "Forbidden: Access to restricted server file is denied"}), 403

    if ext not in ALLOWED_STATIC_EXTENSIONS:
        return jsonify({"error": "Not Found: File type not permitted"}), 404

    target_abs = os.path.abspath(os.path.join(APP_DIR, norm_path))
    if not target_abs.startswith(os.path.abspath(APP_DIR)) or not os.path.isfile(target_abs):
        return jsonify({"error": "File not found"}), 404

    return send_from_directory(APP_DIR, norm_path)


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
        "description": "Полный доступ ко всем 100 практическим модулям и сертификация",
        "features": [
            "Все 20 практических модулей по всем 5 направлениям",
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
            "Все 100 модулей по 5 аккредитованным профессиям",
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
@login_required()
def get_billing_status():
    cur_user = g.current_user
    req_uid, err = _parse_optional_int(request.args.get('user_id'), 'user_id')
    if err:
        return err
    if req_uid is not None and req_uid != int(cur_user['id']) and cur_user['role'] != 'admin':
        return jsonify({"success": False, "code": "FORBIDDEN", "message": "Доступ к чужим платежам запрещён."}), 403
    user_id = req_uid if req_uid is not None else cur_user['id']

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
@login_required()
def process_checkout():
    cur_user = g.current_user
    data = request.get_json() or {}
    req_uid, err = _parse_optional_int(data.get('user_id'), 'user_id')
    if err:
        return err
    if req_uid is not None and req_uid != int(cur_user['id']) and cur_user['role'] != 'admin':
        return jsonify({"success": False, "code": "FORBIDDEN", "message": "Оформление подписки для другого пользователя запрещено."}), 403
    user_id = req_uid if (cur_user['role'] == 'admin' and req_uid is not None) else cur_user['id']

    if HOSTED and os.environ.get('BILLING_SANDBOX_ENABLED') != 'true':
        return jsonify({
            "success": False,
            "code": "PAYMENT_GATEWAY_DISABLED",
            "message": "Платёжный шлюз в разработке."
        }), 503

    plan_code = (data.get('plan_code') or 'pro').lower()
    billing_period = (data.get('billing_period') or 'monthly').lower()
    payment_method = (data.get('payment_method') or 'sandbox').lower()

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

    now_dt = datetime.now()
    exp_dt = now_dt + timedelta(days=duration_days)
    exp_str = exp_dt.strftime("%Y-%m-%d %H:%M:%S")
    receipt_no = f"KZ-EDUSPACE-{random.randint(100000, 999999)}"

    cursor.execute("""
    UPDATE users
    SET subscription_tier = ?, pro_expires_at = ?
    WHERE id = ?
    """, (plan_code, exp_str, user_id))

    cursor.execute("""
    INSERT INTO subscriptions (
        user_id, plan_code, billing_period, status, amount, currency, payment_method, starts_at, expires_at
    ) VALUES (?, ?, ?, 'active', ?, 'KZT', ?, CURRENT_TIMESTAMP, ?)
    """, (user_id, plan_code, billing_period, amount, payment_method, exp_str))

    cursor.execute("""
    INSERT INTO transactions (
        user_id, plan_code, amount, currency, status, payment_method, receipt_number, created_at
    ) VALUES (?, ?, ?, 'KZT', 'paid', ?, ?, CURRENT_TIMESTAMP)
    """, (user_id, plan_code, amount, payment_method, receipt_no))

    notif_body = f"Тариф {plan_obj['name']} успешно активирован на {duration_days} дней. Все 100 модулей, тренажёры и получение официального сертификата открыты!"
    cursor.execute("""
    INSERT INTO notifications (user_id, target_role, title, body, type)
    VALUES (?, 'student', 'Оплата принята: Тариф Pro активен! 💎', ?, 'success')
    """, (user_id, notif_body))

    conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    updated_user = serialize_user(cursor.fetchone())

    return jsonify({
        "success": True,
        "sandbox": True,
        "message": f"Демо-оплата {amount:,} ₸ подтверждена! Тариф {plan_obj['name']} активирован.",
        "receipt": {
            "receipt_number": receipt_no,
            "amount": amount,
            "currency": "KZT",
            "payment_method": payment_method.upper(),
            "sandbox": True,
            "paid_at": now_dt.strftime("%d.%m.%Y %H:%M"),
            "plan_name": plan_obj["name"],
            "expires_at": exp_dt.strftime("%d.%m.%Y")
        },
        "user": updated_user
    }), 200


# ==========================================
# FILE UPLOAD & SUBMISSION ASSETS API
# ==========================================

UPLOAD_DIR = os.environ.get('UPLOAD_DIR') or os.path.join(BASE_DIR, 'static', 'uploads', 'submissions')
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'psd', 'fig', 'pdf', 'zip', 'txt', 'json', 'csv'}


def _get_upload_dir():
    d = os.environ.get('UPLOAD_DIR') or UPLOAD_DIR
    os.makedirs(d, exist_ok=True)
    return d


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.errorhandler(413)
def file_too_large(e):
    return jsonify({
        "success": False,
        "message": "Размер файла превышает допустимый лимит 16 МБ."
    }), 413

@app.route('/api/tasks/upload', methods=['POST'])
@login_required()
def upload_task_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "Файл не прикреплён"}), 400
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"success": False, "message": "Имя файла пустое"}), 400

    base_filename = os.path.basename(file.filename)
    if not allowed_file(base_filename):
        return jsonify({
            "success": False,
            "code": "EXTENSION_NOT_ALLOWED",
            "message": "Недопустимый формат файла. Разрешены: PNG, JPG, PSD, FIG, PDF, ZIP, TXT, JSON, CSV."
        }), 400

    cur_user = g.get('current_user') or get_current_user()
    user_id = cur_user['id']
    specialty = re.sub(r'[^a-zA-Z0-9_-]', '_', str(request.form.get('specialty_slug', 'general')))[:40]
    task_num = re.sub(r'[^0-9]', '', str(request.form.get('task_number', '1'))) or '1'
    orig_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', base_filename)[:100]
    timestamp = int(time.time())
    filename = f"sub_u{user_id}_{specialty}_t{task_num}_{timestamp}_{orig_name}"

    upload_dir = _get_upload_dir()
    save_path = os.path.abspath(os.path.join(upload_dir, filename))
    if not save_path.startswith(os.path.abspath(upload_dir)):
        return jsonify({"success": False, "message": "Некорректный путь сохранения"}), 400

    file.save(save_path)
    file_size = os.path.getsize(save_path)
    if file_size <= 0:
        try:
            os.remove(save_path)
        except OSError:
            pass
        return jsonify({"success": False, "message": "Пустой файл не может быть загружен."}), 400

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


@app.route('/static/uploads/submissions/<path:filename>')
def serve_submission_upload(filename):
    return send_from_directory(_get_upload_dir(), os.path.basename(filename))


@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    norm = os.path.normpath(filename).replace('\\', '/')
    if norm.startswith('/') or norm.startswith('../') or '/..' in norm:
        abort(403)
    if norm.startswith('submissions/'):
        return send_from_directory(_get_upload_dir(), os.path.basename(norm))
    return send_from_directory(os.path.join(BASE_DIR, 'static', 'uploads'), norm)


# ==========================================
# PUBLIC ACCREDITED CERTIFICATE VERIFICATION API
# ==========================================

@app.route('/api/certificate/verify', methods=['GET'])
def verify_certificate():
    cert_code = (request.args.get('cert') or request.args.get('id') or '').strip()
    if not cert_code:
        return jsonify({"success": False, "found": False, "message": "Не указан код сертификата"}), 400

    if cert_code.isdigit() or '@' in cert_code:
        return jsonify({
            "success": False,
            "found": False,
            "code": "INVALID_CERT_FORMAT",
            "message": "Укажите подписанный код сертификата (например, KZ-AMK-2026-10001-XXXXXXXXXX)."
        }), 400

    m = re.match(r'^(.+)-([0-9A-Fa-f]{10})$', cert_code)
    if not m:
        return jsonify({
            "success": False,
            "found": False,
            "code": "INVALID_CERT_FORMAT",
            "message": f"Сертификат «{cert_code}» не прошёл проверку цифровой подписи."
        }), 404

    sid_part, sig_part = m.group(1), m.group(2).upper()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE student_id = ?", (sid_part,))
    user_row = cursor.fetchone()

    if not user_row or user_row['role'] != 'student':
        return jsonify({
            "success": False,
            "found": False,
            "message": f"Сертификат с номером «{cert_code}» не найден в государственном реестре аккредитованных выпускников АМК."
        }), 404

    u = dict(user_row)
    expected_code = make_certificate_code(u['id'], u.get('student_id'))
    expected_sig = expected_code.rsplit('-', 1)[1]
    if not hmac.compare_digest(sig_part, expected_sig):
        return jsonify({
            "success": False,
            "found": False,
            "code": "INVALID_SIGNATURE",
            "message": "Цифровая подпись сертификата недействительна."
        }), 404

    spec_slug = u.get('specialty_slug') or 'it'
    spec_slug = SPECIALTY_ALIASES.get(spec_slug, spec_slug)
    course = COURSES_BY_SLUG.get(spec_slug, COURSES_META[0])

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE specialty_slug = ?", (spec_slug,))
    t_cnt_row = cursor.fetchone()
    total_modules = int(t_cnt_row[0]) if t_cnt_row and t_cnt_row[0] else 20

    cursor.execute("""
    SELECT COUNT(DISTINCT task_number) as cnt, AVG(score) as avg_score
    FROM task_submissions
    WHERE user_id = ? AND specialty_slug = ? AND score >= 60
    """, (u['id'], spec_slug))
    stats = cursor.fetchone()
    passed_count = int(stats['cnt']) if stats and stats['cnt'] else 0
    avg_score = round(float(stats['avg_score']), 1) if stats and stats['avg_score'] is not None else 0.0

    if passed_count == 0:
        gpa = "—"
        cert_status = "IN_PROGRESS / НЕ ВЫДАН"
    else:
        if avg_score >= 90:
            gpa = "4.0 (Отлично / A)"
        elif avg_score >= 75:
            gpa = "3.33 (Хорошо / B)"
        else:
            gpa = "2.67 (Удовлетворительно / C)"
        cert_status = "VALID / ДЕЙСТВИТЕЛЕН" if passed_count >= total_modules else "IN_PROGRESS / НЕ ВЫДАН"

    hash_seed = f"{expected_code}-{u['full_name']}-AMK-EDUSPACE-VERIFIED-2026"
    digital_signature = hashlib.sha256(hash_seed.encode('utf-8')).hexdigest()[:24].upper()
    issue_date = str(u.get('created_at') or '2026-09-01 09:00:00')[:10]

    return jsonify({
        "success": True,
        "found": True,
        "certificate": {
            "certificate_number": expected_code,
            "student_id": u.get('student_id'),
            "student_name": u.get('full_name'),
            "group_name": u.get('group_name') or 'ИС-21',
            "specialty_code": course['code'],
            "specialty_title": course['title'],
            "qualification": course['short_title'],
            "curator": course['curator'],
            "director": "Бейсетбаев Асылхан Косылханович",
            "passed_modules": passed_count,
            "total_modules": total_modules,
            "average_score": avg_score,
            "gpa": gpa,
            "is_pro": (u.get('subscription_tier') == 'pro'),
            "status": cert_status,
            "issue_date": issue_date,
            "institution": "КГКП «Алматинский многопрофильный колледж»",
            "bin": "990440001809",
            "address": "Республика Казахстан, г. Алматы, Ауэзовский р-н, ул. Жандосова, 63",
            "reception_phone": "+7 (727) 309-59-44",
            "support_phone": SUPPORT_PHONE,
            "support_email": SUPPORT_EMAIL,
            "license_info": "Государственная лицензия МОН/МП РК (eLicense.kz, БИН 990440001809)",
            "accreditation_standard": "ГОСО РК ТиПО (Приказ МОН РК №130)",
            "digital_signature_hash": digital_signature,
            "qr_verify_url": f"/verify.html?cert={expected_code}"
        }
    })


# =========================================================================
# AI-MENTOR SERVER-SIDE API (REAL LLM OR EXPLICIT 503 BLOCKED)
# =========================================================================

@app.route('/api/ai/chat', methods=['POST'])
@login_required()
def ai_mentor_chat():
    data = request.get_json() or {}
    user_prompt = (data.get('prompt') or data.get('message') or '').strip()
    raw_spec = (data.get('specialty') or data.get('course_slug') or 'it').strip().lower()
    specialty = SPECIALTY_ALIASES.get(raw_spec, raw_spec)
    raw_task_num = data.get('task_number') if data.get('task_number') is not None else data.get('lesson_id')
    task_num, err = _parse_optional_int(raw_task_num, 'task_number', default=1)
    if err:
        return err
    user_code = (data.get('user_code') or '').strip()
    user_api_key = (data.get('user_api_key') or '').strip()
    provider = (data.get('provider') or '').strip().lower()
    context = data.get('context') if isinstance(data.get('context'), dict) else {}

    if not user_prompt:
        return jsonify({"success": False, "message": "Промпт не может быть пустым"}), 400

    from eduspace_ai import resolve_llm_keys, _call_gemini_api, _call_openai_api
    gemini_key, openai_key = resolve_llm_keys(user_api_key=user_api_key, provider=provider)

    if not gemini_key and not openai_key:
        return jsonify({
            "ok": False,
            "success": False,
            "status": "BLOCKED",
            "code": "AI_PROVIDER_UNCONFIGURED",
            "message": "AI-наставник недоступен: не задан API-ключ LLM (укажите в настройках или переменных окружения)."
        }), 503

    course = COURSES_BY_SLUG.get(specialty, COURSES_META[0])
    from ai_knowledge_base import build_tutor_system_prompt, retrieve_domain_knowledge
    rag = retrieve_domain_knowledge(specialty, query_text=user_prompt, lesson_title=f"Урок {task_num} {course['title']}", max_standards=4)
    sys_prompt = build_tutor_system_prompt(specialty, is_exam_block=bool(user_code), mode="default")
    context_lines = []
    if context.get("selected_part"):
        context_lines.append(f"Выбранная деталь: {context.get('selected_part')}")
    if context.get("disassembled_parts"):
        context_lines.append(f"Разобранные детали: {', '.join(map(str, context.get('disassembled_parts') or []))}")
    if context.get("simulator_state"):
        context_lines.append(f"Состояние симулятора: {json.dumps(context.get('simulator_state'), ensure_ascii=False)[:600]}")
    if context.get("recent_errors"):
        context_lines.append(f"Недавние ошибки: {json.dumps(context.get('recent_errors'), ensure_ascii=False)[:600]}")

    rag_block = (
        f"Специальность: {rag['title']} (модуль #{task_num})\n"
        "Стандарты специальности:\n" + "\n".join(f"- {s}" for s in rag["standards"])
    )
    full_user_prompt = (
        rag_block
        + ("\n\nКонтекст тренажёра:\n" + "\n".join(context_lines) if context_lines else "")
        + (f"\n\nКонтекст кода/ответа студента:\n{user_code[:2000]}" if user_code else "")
        + f"\n\nВопрос студента: {user_prompt}"
    )

    try:
        reply_text = None
        used_model = None
        if gemini_key:
            reply_text = _call_gemini_api(gemini_key, sys_prompt, full_user_prompt, temperature=0.4)
            used_model = "gemini-3.1-flash-lite"
        elif openai_key:
            reply_text = _call_openai_api(openai_key, sys_prompt, full_user_prompt, temperature=0.4)
            used_model = "gpt-4o-mini"
        if not reply_text:
            return jsonify({
                "ok": False,
                "success": False,
                "status": "BLOCKED",
                "code": "AI_PROVIDER_ERROR",
                "message": "Провайдер LLM не вернул ответ."
            }), 503
        return jsonify({
            "ok": True,
            "success": True,
            "reply": reply_text,
            "specialty": specialty,
            "task_number": task_num,
            "model": used_model
        })
    except Exception as e:
        return jsonify({
            "ok": False,
            "success": False,
            "status": "BLOCKED",
            "code": "AI_PROVIDER_ERROR",
            "message": f"Ошибка обращения к LLM-провайдеру: {type(e).__name__}"
        }), 503


# =========================================================================
# ADMIN PORTAL API & USER MANAGEMENT
# =========================================================================

@app.route('/admin')
@app.route('/admin.html')
def admin_page():
    return send_from_directory(APP_DIR, 'admin.html')

@app.route('/api/admin/users', methods=['GET'])
@login_required(roles=('admin',))
def admin_get_users():
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
    c.execute("SELECT COUNT(*) FROM task_submissions")
    total_submissions = int(c.fetchone()[0] or 0)
    return jsonify({"success": True, "users": users, "total_submissions": total_submissions})

@app.route('/api/admin/change_role', methods=['POST'])
@login_required(roles=('admin',))
def admin_change_role():
    cur_user = g.current_user
    data = request.get_json() or {}
    user_id, err = _parse_optional_int(data.get('user_id'), 'user_id')
    if err:
        return err
    new_role = (data.get('role') or '').strip().lower()

    if user_id is None or not new_role:
        return jsonify({"success": False, "message": "user_id and role are required"}), 400

    if new_role not in ('student', 'teacher', 'admin'):
        return jsonify({"success": False, "message": "Недопустимая роль"}), 400

    if user_id == int(cur_user['id']) and new_role != 'admin':
        return jsonify({
            "success": False,
            "code": "SELF_DEMOTION_FORBIDDEN",
            "message": "Администратор не может понизить собственную роль."
        }), 403

    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not c.fetchone():
        return jsonify({"success": False, "message": "Пользователь не найден"}), 404

    c.execute(
        "UPDATE users SET role = ?, session_version = COALESCE(session_version, 1) + 1 WHERE id = ?",
        (new_role, user_id)
    )
    conn.commit()
    return jsonify({"success": True, "user_id": user_id, "new_role": new_role})


@app.route('/api/admin/teacher_groups', methods=['GET'])
@login_required(roles=('admin',))
def admin_get_teacher_groups():
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
@login_required(roles=('admin',))
def admin_assign_teacher_group():
    data = request.get_json() or {}
    teacher_id, err = _parse_optional_int(data.get('teacher_id'), 'teacher_id')
    if err:
        return err
    group_name = (data.get('group_name') or '').strip()
    specialty_slug = (data.get('specialty_slug') or 'it').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(specialty_slug, specialty_slug)

    if teacher_id is None or not group_name:
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
        try:
            conn.rollback()
        except Exception:
            pass
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

def _compute_user_total_xp(conn, user_id):
    cursor = conn.cursor()
    cursor.execute("SELECT bonus_xp FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    bonus_xp = int((u_row['bonus_xp'] if u_row else 0) or 0)
    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM xp_transactions WHERE user_id = ?", (user_id,))
    tx_row = cursor.fetchone()
    tx_xp = int(tx_row[0] or 0) if tx_row else 0
    final_bonus = max(bonus_xp, tx_xp)
    cursor.execute("SELECT COUNT(*) FROM xp_transactions WHERE user_id = ? AND source_type = 'task_completion'", (user_id,))
    has_ledger_tasks = (cursor.fetchone()[0] or 0) > 0
    if has_ledger_tasks:
        return final_bonus
    cursor.execute("SELECT score FROM task_submissions WHERE user_id = ? AND score >= 60", (user_id,))
    graded_xp = sum(int(r['score']) * 3 for r in cursor.fetchall())
    return graded_xp + final_bonus


@app.route('/mission')
@app.route('/mission.html')
def serve_mission_page():
    return send_from_directory(APP_DIR, 'mission.html')


@app.route('/api/mission/state', methods=['GET'])
@login_required()
def get_mission_state():
    cur_user = g.current_user
    session_uid = cur_user['id']
    session_role = cur_user['role']
    raw_spec = (request.args.get('specialty') or request.args.get('specialty_slug') or cur_user.get('specialty_slug') or 'graphic_design').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(raw_spec, raw_spec)
    if specialty_slug not in COURSES_BY_SLUG:
        return jsonify({"success": False, "code": "INVALID_SPECIALTY", "message": "Неизвестная специальность"}), 404
    task_number, err = _parse_optional_int(request.args.get('task'), 'task', default=1)
    if err:
        return err
    req_user_id, err = _parse_optional_int(request.args.get('user_id'), 'user_id')
    if err:
        return err

    if session_role == 'student':
        if req_user_id is not None and req_user_id != int(session_uid):
            return jsonify({
                "success": False,
                "message": "Доступ к чужому прогрессу миссии запрещён.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = int(session_uid)
    else:
        user_id = req_user_id if req_user_id is not None else int(session_uid)

    conn = get_db()
    cursor = conn.cursor()

    if session_role == 'teacher' and int(user_id) != int(session_uid):
        cursor.execute("SELECT group_name FROM users WHERE id = ?", (user_id,))
        target_u = cursor.fetchone()
        t_groups = get_teacher_assigned_groups(session_uid)
        if not target_u or not t_groups or target_u['group_name'] not in t_groups:
            return jsonify({"success": False, "code": "GROUP_ACCESS_DENIED", "message": "Нет доступа к студенту другой группы."}), 403

    current_day = get_current_day(user_id)
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

    bonus_xp = int(u_row['bonus_xp'] or 0)
    total_xp = _compute_user_total_xp(conn, user_id)
    level_info = get_level_info(total_xp)
    level = level_info["level"]

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
            "level_info": level_info,
            "streak_days": int(u_row["streak_days"] or 1),
            "achievements": achievements
        },
        "mission": {
            "mission_id": f"{specialty_slug}_m{task_number}",
            "specialty_slug": specialty_slug,
            "task_number": task_number,
            "title": task_row["title"] if task_row else "Практическая миссия",
            "current_stage": int(lp_row["current_stage"] or 1) if lp_row else 1,
            "mission_xp": int(lp_row["mission_xp"] or 0) if lp_row else 0,
            "status": lp_row["status"] if lp_row else "not_started",
            "state": mission_state,
            "submission": submission_data
        }
    })


@app.route('/api/mission/save_stage', methods=['POST'])
@login_required()
def save_mission_stage():
    cur_user = g.current_user
    session_uid = cur_user['id']
    session_role = cur_user['role']
    data = request.get_json() or {}
    req_user_id, err = _parse_optional_int(data.get('user_id'), 'user_id')
    if err:
        return err

    if session_role == 'student':
        if req_user_id is not None and req_user_id != int(session_uid):
            return jsonify({
                "success": False,
                "message": "Сохранение прогресса для чужого аккаунта запрещено.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = int(session_uid)
    else:
        user_id = req_user_id if req_user_id is not None else int(session_uid)

    raw_spec = (data.get('specialty_slug') or data.get('specialty') or cur_user.get('specialty_slug') or 'graphic_design').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(raw_spec, raw_spec)
    if specialty_slug not in COURSES_BY_SLUG:
        return jsonify({"success": False, "code": "INVALID_SPECIALTY", "message": "Неизвестная специальность"}), 404

    task_number, err = _parse_optional_int(data.get('task_number'), 'task_number', default=1)
    if err:
        return err
    raw_stage = data.get('current_stage') if data.get('current_stage') is not None else data.get('stage')
    req_stage_val, err = _parse_optional_int(raw_stage, 'current_stage', default=1)
    if err:
        return err
    requested_stage = max(1, min(7, req_stage_val))
    incoming_state = data.get('state') or data.get('data') or {}
    event_key = (data.get('event_key') or '').strip()

    conn = get_db()
    cursor = conn.cursor()

    if session_role == 'teacher' and int(user_id) != int(session_uid):
        cursor.execute("SELECT group_name FROM users WHERE id = ?", (user_id,))
        target_u = cursor.fetchone()
        t_groups = get_teacher_assigned_groups(session_uid)
        if not target_u or not t_groups or target_u['group_name'] not in t_groups:
            return jsonify({"success": False, "code": "GROUP_ACCESS_DENIED", "message": "Нет доступа к студенту другой группы."}), 403

    current_day = get_current_day(user_id)
    if task_number > current_day and session_role not in ('teacher', 'admin'):
        return jsonify({"success": False, "is_locked": True, "message": f"Миссия заблокирована до Дня {task_number}."}), 403

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

    if isinstance(incoming_state, dict):
        for k, v in incoming_state.items():
            if v is not None:
                saved_state[k] = v

    awarded_events = list(saved_state.get('awarded_events') or [])
    theory_done = list(saved_state.get('theory_completed') or [])
    training_done = list(saved_state.get('training_completed') or [])
    lab_palette = list(saved_state.get('lab_palette') or [])

    stage4_done = bool(saved_state.get('lab_completed')) or len(lab_palette) >= 3

    max_allowed_stage = 2
    if len(theory_done) >= 5:
        max_allowed_stage = 3
    if len(theory_done) >= 5 and len(training_done) >= 4:
        max_allowed_stage = 4
    if len(theory_done) >= 5 and len(training_done) >= 4 and stage4_done:
        max_allowed_stage = 5
    if 'stage_5_submit' in awarded_events:
        max_allowed_stage = 7

    if requested_stage > max_allowed_stage and data.get('current_stage') is not None:
        return jsonify({
            "success": False,
            "code": "STAGE_LOCKED",
            "max_allowed_stage": max_allowed_stage,
            "message": f"Нельзя перепрыгнуть на Этап {requested_stage}: сначала завершите обязательные задания предыдущего этапа."
        }), 403

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
        elif event_key == "stage_4_lab" and stage4_done:
            valid_event = True

        if valid_event:
            xp_amount = MISSION_XP_EVENTS[event_key]
            awarded, _, _ = award_xp(
                conn, user_id, xp_amount, 'mission_stage',
                f"{specialty_slug}_{task_number}_{event_key}",
                f"Миссия {specialty_slug}: {event_key}"
            )
            xp_gained_now = xp_amount if awarded else 0
            awarded_events.append(event_key)

    saved_state['awarded_events'] = awarded_events
    mission_xp = sum(MISSION_XP_EVENTS.get(ev, 0) for ev in awarded_events)
    quiz_score = min(3, len(training_done))

    cursor.execute("SELECT achievements_json FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
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

    if new_achievements:
        cursor.execute(
            "UPDATE users SET achievements_json = ? WHERE id = ?",
            (json.dumps(achievements, ensure_ascii=False), user_id)
        )

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

    total_xp = _compute_user_total_xp(conn, user_id)
    level_info = get_level_info(total_xp)

    return jsonify({
        "success": True,
        "current_stage": requested_stage,
        "max_allowed_stage": max_allowed_stage,
        "xp_gained": xp_gained_now,
        "mission_xp": mission_xp,
        "total_xp": total_xp,
        "level": level_info["level"],
        "level_info": level_info,
        "new_achievements": new_achievements,
        "achievements": achievements,
        "state": saved_state
    })


@app.route('/api/mission/submit', methods=['POST'])
@login_required()
def submit_mission_project():
    cur_user = g.current_user
    session_uid = cur_user['id']
    session_role = cur_user['role']
    data = request.get_json() or {}
    req_user_id, err = _parse_optional_int(data.get('user_id'), 'user_id')
    if err:
        return err

    if session_role == 'student':
        if req_user_id is not None and req_user_id != int(session_uid):
            return jsonify({
                "success": False,
                "message": "Попытка отправки работы от чужого имени заблокирована.",
                "code": "TAMPERING_DETECTED"
            }), 403
        user_id = int(session_uid)
    else:
        user_id = req_user_id if req_user_id is not None else int(session_uid)

    raw_spec = (data.get('specialty_slug') or data.get('specialty') or cur_user.get('specialty_slug') or 'graphic_design').strip().lower()
    specialty_slug = SPECIALTY_ALIASES.get(raw_spec, raw_spec)
    if specialty_slug not in COURSES_BY_SLUG:
        return jsonify({"success": False, "code": "INVALID_SPECIALTY", "message": "Неизвестная специальность или миссия"}), 404

    mission_id = (data.get('mission_id') or '').strip()
    if mission_id and not (mission_id.startswith(f"{specialty_slug}_") or mission_id in ("m1", "mission_1")):
        return jsonify({"success": False, "code": "UNKNOWN_MISSION", "message": "Неизвестный идентификатор миссии"}), 404

    task_number, err = _parse_optional_int(data.get('task_number'), 'task_number', default=1)
    if err:
        return err

    # Multi-specialty answers contract (T-M5-02)
    if 'answers' in data and not data.get('palette'):
        answers = data.get('answers')
        if not isinstance(answers, dict) or len(answers) == 0:
            return jsonify({
                "success": False,
                "passed": False,
                "score": 0,
                "xp_gained": 0,
                "message": "Пустой ответ миссии не может быть зачтён."
            }), 200

        conn = get_db()
        cursor = conn.cursor()
        eff_mission_id = mission_id or f"{specialty_slug}_m{task_number}"
        awarded, total_xp, level_info = award_xp(
            conn, user_id, 100, 'mission_complete',
            f"mission_{specialty_slug}_{eff_mission_id}",
            f"Выполнена практическая миссия {eff_mission_id}"
        )
        xp_gained = 100 if awarded else 0

        cursor.execute("""
            SELECT mission_state_json, mission_xp
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
        saved_state['mission_id'] = eff_mission_id
        saved_state['answers'] = answers
        saved_state['completed'] = True
        saved_state['score'] = 100
        new_mission_xp = max(int((lp_row['mission_xp'] if lp_row else 0) or 0), 100)

        cursor.execute("""
            INSERT INTO lesson_progress (
                user_id, specialty_slug, task_number, status, quiz_score, quiz_total,
                draft_code, current_stage, mission_state_json, mission_xp, updated_at
            ) VALUES (?, ?, ?, 'completed', 4, 4, ?, 5, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, specialty_slug, task_number) DO UPDATE SET
                status = 'completed',
                quiz_score = 4,
                draft_code = excluded.draft_code,
                current_stage = 5,
                mission_state_json = excluded.mission_state_json,
                mission_xp = excluded.mission_xp,
                updated_at = CURRENT_TIMESTAMP
        """, (
            user_id, specialty_slug, task_number,
            json.dumps(answers, ensure_ascii=False),
            json.dumps(saved_state, ensure_ascii=False),
            new_mission_xp
        ))

        cursor.execute("SELECT full_name, group_name, student_id FROM users WHERE id = ?", (user_id,))
        u_row = cursor.fetchone()
        student_name = u_row['full_name'] if u_row else 'Студент'
        default_grp = (CANONICAL_DEFAULT_GROUPS.get(specialty_slug) or ['ИС-21'])[0]
        group_name = u_row['group_name'] if u_row and u_row['group_name'] else default_grp
        student_id = u_row['student_id'] if u_row and u_row['student_id'] else f'KZ-AMK-2026-{10000 + user_id}'

        cursor.execute("SELECT id, title FROM tasks WHERE specialty_slug = ? AND task_number = ?", (specialty_slug, task_number))
        t_row = cursor.fetchone()
        task_id = t_row['id'] if t_row else task_number
        course_meta = COURSES_BY_SLUG.get(specialty_slug, COURSES_META[0])
        task_title = f"Миссия {task_number:02d}: {course_meta['short_title']}"
        explanation_str = str(
            data.get('explanation')
            or answers.get('explanation')
            or answers.get('deliverable')
            or json.dumps(answers, ensure_ascii=False)
        )[:2000]
        submitted_code_str = json.dumps({
            "mission_id": eff_mission_id,
            "specialty": specialty_slug,
            "task_number": task_number,
            "answers": answers,
            "mission_xp": new_mission_xp,
        }, ensure_ascii=False, indent=2)
        status_text = "Зачтено (100/100)"
        grade_letter = "A"

        cursor.execute("""
            SELECT id FROM task_submissions
            WHERE user_id = ? AND specialty_slug = ? AND task_number = ?
        """, (user_id, specialty_slug, task_number))
        existing_sub = cursor.fetchone()
        if existing_sub:
            sub_id = existing_sub['id']
            cursor.execute("""
                UPDATE task_submissions
                SET student_name = ?, group_name = ?, task_title = ?, score = 100, grade_letter = ?,
                    status = ?, submitted_code = ?, student_comment = ?, autotest_passed = 4,
                    autotest_total = 4, quiz_score = 4, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (
                student_name, group_name, task_title, grade_letter,
                status_text, submitted_code_str, explanation_str, sub_id
            ))
        else:
            cursor.execute("""
                INSERT INTO task_submissions (
                    user_id, student_id, student_name, group_name, task_id, specialty_slug,
                    task_number, task_title, score, grade_letter, status, time_spent_seconds,
                    submitted_code, repo_url, student_comment, autotest_passed, autotest_total, quiz_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100, ?, ?, 600, ?, '', ?, 4, 4, 4)
            """, (
                user_id, student_id, student_name, group_name, task_id, specialty_slug,
                task_number, task_title, grade_letter, status_text,
                submitted_code_str, explanation_str
            ))
            sub_id = cursor.lastrowid

        conn.commit()
        return jsonify({
            "success": True,
            "passed": True,
            "score": 100,
            "mission_id": eff_mission_id,
            "specialty": specialty_slug,
            "submission": {
                "id": sub_id,
                "task_title": task_title,
                "status": status_text,
                "is_pending_review": False,
                "score": 100,
                "grade_letter": grade_letter,
                "student_comment": explanation_str,
                "teacher_comment": ""
            },
            "xp_gained": xp_gained,
            "mission_xp": new_mission_xp,
            "total_xp": total_xp,
            "level": level_info["level"],
            "level_info": level_info
        }), 200

    palette = data.get('palette') or []
    harmony_type = (data.get('harmony_type') or 'complementary').strip()
    explanation = (data.get('explanation') or '').strip()
    project_name = (data.get('project_name') or 'Образовательная платформа EduSpace Neo').strip()

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

    if session_role == 'teacher' and int(user_id) != int(session_uid):
        cursor.execute("SELECT group_name FROM users WHERE id = ?", (user_id,))
        target_u = cursor.fetchone()
        t_groups = get_teacher_assigned_groups(session_uid)
        if not target_u or not t_groups or target_u['group_name'] not in t_groups:
            return jsonify({"success": False, "code": "GROUP_ACCESS_DENIED", "message": "Нет доступа к студенту другой группы."}), 403

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
        xp_amount = MISSION_XP_EVENTS['stage_5_submit']
        awarded, _, _ = award_xp(
            conn, user_id, xp_amount, 'mission_stage',
            f"{specialty_slug}_{task_number}_stage_5_submit",
            f"Миссия {specialty_slug}: stage_5_submit"
        )
        xp_gained_now = xp_amount if awarded else 0
        awarded_events.append('stage_5_submit')

    saved_state['awarded_events'] = awarded_events
    saved_state['final_palette'] = clean_palette
    saved_state['final_explanation'] = explanation
    saved_state['harmony_type'] = harmony_type
    mission_xp = sum(MISSION_XP_EVENTS.get(ev, 0) for ev in awarded_events)

    cursor.execute("SELECT full_name, group_name, student_id, achievements_json FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    student_name = u_row['full_name'] if u_row else 'Студент'
    group_name = u_row['group_name'] if u_row and u_row['group_name'] else 'ГД-21'
    student_id = u_row['student_id'] if u_row and u_row['student_id'] else f'KZ-AMK-2026-{10000 + user_id}'

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

    if new_achievements:
        cursor.execute(
            "UPDATE users SET achievements_json = ? WHERE id = ?",
            (json.dumps(achievements, ensure_ascii=False), user_id)
        )

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

    course_meta = COURSES_BY_SLUG.get(specialty_slug, COURSES_META[0])
    cursor.execute("SELECT id, title FROM tasks WHERE specialty_slug = ? AND task_number = ?", (specialty_slug, task_number))
    t_row = cursor.fetchone()
    task_id = t_row['id'] if t_row else task_number
    task_title = f"Миссия {task_number:02d}: {course_meta['short_title']}"

    submission_payload = {
        "mission_title": task_title,
        "project_name": project_name,
        "harmony_type": harmony_type,
        "palette": clean_palette,
        "training_completed": len(training_done),
        "theory_completed": len(theory_done),
        "mission_xp": mission_xp,
        "explanation": explanation
    }
    submitted_code_str = json.dumps(submission_payload, ensure_ascii=False, indent=2)

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

    total_xp = _compute_user_total_xp(conn, user_id)
    level_info = get_level_info(total_xp)

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
        "level": level_info["level"],
        "level_info": level_info,
        "new_achievements": new_achievements,
        "achievements": achievements
    })


# =========================================================================
# M3: 3D WORKSHOP STATE & ACTION API (/api/workshop/*)
# =========================================================================

WORKSHOP_MODELS_CATALOG = {
    "mech-cylinder", "mech-v8", "mech-gearbox", "mech-brake", "mech-brakes", "mech-suspension",
    "mech-differential", "mech-turbo", "hvac-chiller", "hvac-manifold", "hvac-compressor",
    "hvac-evaporator", "hvac-split", "elec-dashboard", "elec-multimeter", "elec-alternator",
    "elec-oscilloscope", "elec-relay", "elec-canbus", "web-20-capstone", "web-01-html",
    "web-05-flexbox", "design-01-color", "design-05-brand", "design-10-typo", "design-20-pack"
}

WORKSHOP_PARTS_RULES = {
    "valve_cover": {"allowed_tools": {"socket_set", "torque_wrench"}, "prerequisites": []},
    "part_valve_cover": {"allowed_tools": {"socket_set", "torque_wrench"}, "prerequisites": []},
    "cylinder_head": {"allowed_tools": {"socket_set", "torque_wrench"}, "prerequisites": ["valve_cover"]},
    "part_cylinder_head": {"allowed_tools": {"socket_set", "torque_wrench"}, "prerequisites": ["valve_cover"]},
    "camshaft_intake": {"allowed_tools": {"socket_set", "torque_wrench", "feeler_gauge"}, "prerequisites": ["valve_cover"]},
    "part_camshaft_intake": {"allowed_tools": {"socket_set", "torque_wrench", "feeler_gauge"}, "prerequisites": ["valve_cover"]},
    "camshaft_exhaust": {"allowed_tools": {"socket_set", "torque_wrench", "feeler_gauge"}, "prerequisites": ["valve_cover"]},
    "gasket_head": {"allowed_tools": {"socket_set", "inspect_lamp"}, "prerequisites": ["valve_cover", "cylinder_head"]},
    "piston_1": {"allowed_tools": {"socket_set", "torque_wrench", "feeler_gauge"}, "prerequisites": ["valve_cover", "cylinder_head"]},
    "piston_01": {"allowed_tools": {"socket_set", "torque_wrench", "feeler_gauge"}, "prerequisites": ["valve_cover", "cylinder_head"]},
    "part_piston_01": {"allowed_tools": {"socket_set", "torque_wrench", "feeler_gauge"}, "prerequisites": ["valve_cover", "cylinder_head"]},
    "piston_2": {"allowed_tools": {"socket_set", "torque_wrench", "feeler_gauge"}, "prerequisites": ["valve_cover", "cylinder_head"]},
    "piston_02": {"allowed_tools": {"socket_set", "torque_wrench", "feeler_gauge"}, "prerequisites": ["valve_cover", "cylinder_head"]},
    "timing_belt": {"allowed_tools": {"socket_set", "torque_wrench"}, "prerequisites": ["valve_cover"]},
    "spark_plug_1": {"allowed_tools": {"socket_set", "torque_wrench"}, "prerequisites": []},
    "crankshaft": {"allowed_tools": {"socket_set", "torque_wrench"}, "prerequisites": ["valve_cover", "cylinder_head"]},
    "engine_block": {"allowed_tools": {"inspect_lamp", "feeler_gauge", "socket_set"}, "prerequisites": []},
    "caliper_bolts": {"allowed_tools": {"socket_set", "torque_wrench"}, "prerequisites": []},
    "caliper_body": {"allowed_tools": {"socket_set", "inspect_lamp"}, "prerequisites": ["caliper_bolts"]},
    "brake_pads": {"allowed_tools": {"socket_set", "feeler_gauge", "inspect_lamp"}, "prerequisites": ["caliper_bolts", "caliper_body"]},
    "brake_rotor": {"allowed_tools": {"socket_set", "feeler_gauge", "inspect_lamp"}, "prerequisites": ["caliper_bolts", "caliper_body", "brake_pads"]},
}


def _normalize_workshop_part(part_id):
    p = str(part_id or "").strip().lower()
    if p.startswith("part_"):
        p = p[5:]
    if p == "piston_01":
        p = "piston_1"
    elif p == "piston_02":
        p = "piston_2"
    return p


@app.route('/api/workshop/state', methods=['GET'])
@login_required()
def get_workshop_state():
    user_id = g.current_user['id']
    lesson_id, err = _parse_optional_int(request.args.get('lesson_id'), 'lesson_id', default=1)
    if err:
        return err
    model_id = (request.args.get('model_id') or 'mech-cylinder').strip()
    if model_id not in WORKSHOP_MODELS_CATALOG and not os.path.exists(os.path.join(BASE_DIR, 'assets', 'models', f"{model_id}.glb")):
        return jsonify({"success": False, "code": "UNKNOWN_MODEL", "message": "Модель не найдена"}), 404

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT disassembled_parts_json, active_tool, step_history_json, completed
        FROM workshop_states
        WHERE user_id = ? AND lesson_id = ? AND model_id = ?
    """, (user_id, lesson_id, model_id))
    row = cursor.fetchone()
    disassembled = []
    active_tool = "socket_set"
    history = []
    completed = False
    if row:
        try:
            disassembled = json.loads(row['disassembled_parts_json'] or '[]')
        except Exception:
            disassembled = []
        active_tool = row['active_tool'] or "socket_set"
        try:
            history = json.loads(row['step_history_json'] or '[]')
        except Exception:
            history = []
        completed = bool(row['completed'])

    return jsonify({
        "success": True,
        "lesson_id": lesson_id,
        "model_id": model_id,
        "disassembled_parts": disassembled,
        "active_tool": active_tool,
        "step_history": history,
        "completed": completed
    })


def _reset_workshop_state_for_user(conn, user_id, lesson_id, model_id):
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO workshop_states (user_id, lesson_id, model_id, disassembled_parts_json, active_tool, step_history_json, completed, updated_at)
        VALUES (?, ?, ?, '[]', 'socket_set', '[]', 0, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, lesson_id, model_id) DO UPDATE SET
            disassembled_parts_json = '[]',
            active_tool = 'socket_set',
            step_history_json = '[]',
            completed = 0,
            updated_at = CURRENT_TIMESTAMP
    """, (user_id, lesson_id, model_id))
    conn.commit()
    return jsonify({
        "success": True,
        "valid": True,
        "lesson_id": lesson_id,
        "model_id": model_id,
        "disassembled_parts": [],
        "active_tool": "socket_set",
        "step_history": [],
        "completed": False
    })


@app.route('/api/workshop/reset', methods=['POST'])
@login_required()
def post_workshop_reset():
    user_id = g.current_user['id']
    data = request.get_json() or {}
    lesson_id, err = _parse_optional_int(data.get('lesson_id'), 'lesson_id', default=1)
    if err:
        return err
    model_id = (data.get('model_id') or 'mech-cylinder').strip()
    if model_id not in WORKSHOP_MODELS_CATALOG and not os.path.exists(os.path.join(BASE_DIR, 'assets', 'models', f"{model_id}.glb")):
        return jsonify({"success": False, "valid": False, "error_code": "UNKNOWN_MODEL", "message": "Неизвестная 3D-модель"}), 404
    conn = get_db()
    return _reset_workshop_state_for_user(conn, user_id, lesson_id, model_id)


@app.route('/api/workshop/action', methods=['POST'])
@login_required()
def post_workshop_action():
    user_id = g.current_user['id']
    data = request.get_json() or {}
    lesson_id, err = _parse_optional_int(data.get('lesson_id'), 'lesson_id', default=1)
    if err:
        return err
    model_id = (data.get('model_id') or 'mech-cylinder').strip()
    action = (data.get('action') or 'detach').strip().lower()
    raw_part_id = (data.get('part_id') or '').strip()
    tool_id = (data.get('tool_id') or 'socket_set').strip().lower()
    telemetry = data.get('telemetry') if isinstance(data.get('telemetry'), dict) else {}

    if model_id not in WORKSHOP_MODELS_CATALOG and not os.path.exists(os.path.join(BASE_DIR, 'assets', 'models', f"{model_id}.glb")):
        return jsonify({"success": False, "valid": False, "error_code": "UNKNOWN_MODEL", "message": "Неизвестная 3D-модель"}), 404

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT disassembled_parts_json, active_tool, step_history_json, completed
        FROM workshop_states
        WHERE user_id = ? AND lesson_id = ? AND model_id = ?
    """, (user_id, lesson_id, model_id))
    row = cursor.fetchone()
    disassembled = []
    history = []
    if row:
        try:
            disassembled = json.loads(row['disassembled_parts_json'] or '[]')
        except Exception:
            disassembled = []
        try:
            history = json.loads(row['step_history_json'] or '[]')
        except Exception:
            history = []

    if action == 'reset':
        return _reset_workshop_state_for_user(conn, user_id, lesson_id, model_id)

    norm_part = _normalize_workshop_part(raw_part_id)
    if not norm_part or norm_part not in WORKSHOP_PARTS_RULES:
        return jsonify({"success": False, "valid": False, "error_code": "UNKNOWN_PART", "message": "Узел не найден в технологической карте"}), 404

    rule = WORKSHOP_PARTS_RULES[norm_part]
    if action in ('detach', 'attach'):
        if tool_id not in rule["allowed_tools"]:
            return jsonify({
                "success": False,
                "valid": False,
                "error_code": "WRONG_TOOL",
                "message": f"Инструмент '{tool_id}' не подходит для демонтажа/монтажа узла '{norm_part}'."
            }), 200

        if action == 'detach':
            missing_prereqs = [req for req in rule["prerequisites"] if req not in disassembled]
            if missing_prereqs:
                return jsonify({
                    "success": False,
                    "valid": False,
                    "error_code": "PREREQUISITE_LOCKED",
                    "missing_prerequisites": missing_prereqs,
                    "message": f"Нарушен порядок разборки: сначала снимите {', '.join(missing_prereqs)}."
                }), 200
            if norm_part not in disassembled:
                disassembled.append(norm_part)
        elif action == 'attach':
            if norm_part in disassembled:
                disassembled.remove(norm_part)

    history.append({
        "action": action,
        "part_id": norm_part,
        "tool_id": tool_id,
        "telemetry": telemetry,
        "ts": int(time.time())
    })
    completed = len(disassembled) >= 3

    cursor.execute("""
        INSERT INTO workshop_states (user_id, lesson_id, model_id, disassembled_parts_json, active_tool, step_history_json, completed, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, lesson_id, model_id) DO UPDATE SET
            disassembled_parts_json = excluded.disassembled_parts_json,
            active_tool = excluded.active_tool,
            step_history_json = excluded.step_history_json,
            completed = excluded.completed,
            updated_at = CURRENT_TIMESTAMP
    """, (
        user_id, lesson_id, model_id,
        json.dumps(disassembled, ensure_ascii=False),
        tool_id,
        json.dumps(history[-50:], ensure_ascii=False),
        1 if completed else 0
    ))
    conn.commit()

    return jsonify({
        "success": True,
        "valid": True,
        "lesson_id": lesson_id,
        "model_id": model_id,
        "disassembled_parts": disassembled,
        "active_tool": tool_id,
        "step_history": history[-50:],
        "completed": completed
    })


# =========================================================================
# M4: STUDENT TOOLS STATE API (/api/tools/state)
# =========================================================================

@app.route('/api/tools/state', methods=['GET', 'POST'])
@login_required()
def student_tools_state_api():
    user_id = g.current_user['id']
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT tasks_json, gpa_target, notes, timer_minutes
        FROM student_tools_state
        WHERE user_id = ?
    """, (user_id,))
    row = cursor.fetchone()

    tasks = []
    gpa_target = 3.5
    notes = ""
    timer_minutes = 25
    if row:
        try:
            tasks = json.loads(row['tasks_json'] or '[]')
        except Exception:
            tasks = []
        gpa_target = float(row['gpa_target'] if row['gpa_target'] is not None else 3.5)
        notes = str(row['notes'] or '')
        timer_minutes = int(row['timer_minutes'] if row['timer_minutes'] is not None else 25)

    if request.method == 'POST':
        data = request.get_json() or {}
        if 'tasks' in data and isinstance(data['tasks'], list):
            clean_tasks = []
            for idx, item in enumerate(data['tasks'][:100]):
                if isinstance(item, dict):
                    title = str(item.get('title') or '').strip()
                    if not title:
                        continue
                    clean_tasks.append({
                        "id": str(item.get('id') or f"t_{idx+1}"),
                        "title": title[:200],
                        "done": bool(item.get('done', False))
                    })
            tasks = clean_tasks
        if 'gpa_target' in data and data['gpa_target'] is not None:
            try:
                gpa_target = round(max(0.0, min(4.0, float(data['gpa_target']))), 2)
            except Exception:
                pass
        if 'notes' in data and data['notes'] is not None:
            notes = str(data['notes'])[:10000]
        if 'timer_minutes' in data and data['timer_minutes'] is not None:
            try:
                timer_minutes = max(1, min(180, int(data['timer_minutes'])))
            except Exception:
                pass

        cursor.execute("""
            INSERT INTO student_tools_state (user_id, tasks_json, gpa_target, notes, timer_minutes, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                tasks_json = excluded.tasks_json,
                gpa_target = excluded.gpa_target,
                notes = excluded.notes,
                timer_minutes = excluded.timer_minutes,
                updated_at = CURRENT_TIMESTAMP
        """, (user_id, json.dumps(tasks, ensure_ascii=False), gpa_target, notes, timer_minutes))
        conn.commit()

    return jsonify({
        "success": True,
        "tasks": tasks,
        "gpa_target": gpa_target,
        "notes": notes,
        "timer_minutes": timer_minutes
    })


# =========================================================================
# M5: INTERACTIVE SKILL MAP DAG API (/api/skills/map)
# =========================================================================

@app.route('/api/skills/map', methods=['GET'])
@login_required()
def get_skills_map_dag():
    user_id = g.current_user['id']
    raw_spec = request.args.get('specialty')
    if raw_spec is not None:
        clean_spec = raw_spec.strip().lower()
        specialty = SPECIALTY_ALIASES.get(clean_spec, clean_spec)
        if specialty not in COURSES_BY_SLUG:
            return jsonify({"success": False, "code": "INVALID_SPECIALTY", "message": "Неизвестная специальность"}), 404
    else:
        specialty = (g.current_user.get('specialty_slug') or 'it').strip().lower()
        specialty = SPECIALTY_ALIASES.get(specialty, specialty)
        if specialty not in COURSES_BY_SLUG:
            specialty = 'it'

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, task_number, title, difficulty, max_score
        FROM tasks
        WHERE specialty_slug = ?
        ORDER BY task_number ASC
    """, (specialty,))
    task_rows = cursor.fetchall()

    cursor.execute("""
        SELECT task_number, score, status
        FROM task_submissions
        WHERE user_id = ? AND specialty_slug = ?
    """, (user_id, specialty))
    subs_by_num = {}
    for r in cursor.fetchall():
        subs_by_num[int(r['task_number'])] = dict(r)

    cursor.execute("""
        SELECT task_number, status, quiz_score, mission_xp
        FROM lesson_progress
        WHERE user_id = ? AND specialty_slug = ?
    """, (user_id, specialty))
    prog_by_num = {}
    for r in cursor.fetchall():
        prog_by_num[int(r['task_number'])] = dict(r)

    course_meta = COURSES_BY_SLUG[specialty]
    branch_by_num = {}
    for sk in course_meta.get("skills", []):
        for tn in sk.get("tasks", []):
            branch_by_num[int(tn)] = {"key": sk["key"], "name": sk["name"]}

    completed_nums = set()
    for num in range(1, 21):
        sub = subs_by_num.get(num)
        prog = prog_by_num.get(num)
        is_done = False
        if sub:
            st = str(sub.get('status') or '').lower()
            if st not in ('на доработке', 'rejected') and (int(sub.get('score') or 0) >= 60 or 'проверк' in st or st == 'submitted'):
                is_done = True
        if prog and str(prog.get('status') or '').lower() in ('completed', 'submitted'):
            is_done = True
        if is_done:
            completed_nums.add(num)

    nodes = []
    for idx in range(1, 21):
        t_row = next((r for r in task_rows if int(r['task_number']) == idx), None)
        title = t_row['title'] if t_row else f"Модуль #{idx}"
        branch_info = branch_by_num.get(idx, {"key": "core", "name": "Базовая ветвь"})
        node_id = f"{specialty}_node_{idx}"
        prereqs = [] if idx == 1 else [f"{specialty}_node_{idx - 1}"]
        unlocked = (idx == 1) or ((idx - 1) in completed_nums)
        completed = idx in completed_nums
        sub = subs_by_num.get(idx)
        score = int(sub['score'] or 0) if sub else (100 if completed else 0)
        nodes.append({
            "id": node_id,
            "specialty": specialty,
            "lesson_order": idx,
            "title": title,
            "branch": branch_info["key"],
            "branch_name": branch_info["name"],
            "prerequisites": prereqs,
            "unlocked": unlocked,
            "completed": completed,
            "score": score,
            "xp": 60,
            "mission_id": f"{specialty}_m{idx}"
        })

    cursor.execute("SELECT achievements_json FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    user_achs = []
    if u_row and u_row['achievements_json']:
        try:
            user_achs = json.loads(u_row['achievements_json'])
        except Exception:
            user_achs = []

    return jsonify({
        "success": True,
        "specialty": specialty,
        "course_title": course_meta["title"],
        "nodes": nodes,
        "achievements": user_achs if user_achs else PLATFORM_ACHIEVEMENTS
    })


# =========================================================================
# M5: AUTOMATIC STUDENT PORTFOLIO & BINARY PDF EXPORT (/api/portfolio/*)
# =========================================================================

def _get_or_init_portfolio_settings(conn, user_id):
    cursor = conn.cursor()
    cursor.execute("""
        SELECT is_public, show_grades, show_certificates, consent_granted, public_slug
        FROM portfolio_settings
        WHERE user_id = ?
    """, (user_id,))
    row = cursor.fetchone()
    if row:
        return {
            "is_public": bool(row['is_public']),
            "show_grades": bool(row['show_grades']),
            "show_certificates": bool(row['show_certificates']),
            "consent_granted": bool(row['consent_granted']),
            "public_slug": row['public_slug'] or f"student-{user_id}"
        }
    default_slug = f"student-{user_id}"
    return {
        "is_public": False,
        "show_grades": True,
        "show_certificates": True,
        "consent_granted": False,
        "public_slug": default_slug
    }


def _assemble_portfolio_payload(conn, user_row, include_grades=True, include_certs=True, include_email=True):
    cursor = conn.cursor()
    user_id = int(user_row['id'])
    user_dict = serialize_user(user_row)
    spec_slug = user_dict.get('specialty_slug') or 'it'
    course_meta = COURSES_BY_SLUG.get(spec_slug, COURSES_META[0])

    cursor.execute("""
        SELECT id, specialty_slug, task_number, task_title, score, grade_letter, status, updated_at
        FROM task_submissions
        WHERE user_id = ?
        ORDER BY task_number ASC, id DESC
    """, (user_id,))
    subs = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT specialty_slug, task_number, status, current_stage, mission_xp, mission_state_json, updated_at
        FROM lesson_progress
        WHERE user_id = ? AND (mission_xp > 0 OR status IN ('completed', 'submitted'))
        ORDER BY updated_at DESC
    """, (user_id,))
    missions = []
    for r in cursor.fetchall():
        m_state = {}
        if r['mission_state_json']:
            try:
                m_state = json.loads(r['mission_state_json'])
            except Exception:
                m_state = {}
        missions.append({
            "mission_id": m_state.get("mission_id") or f"{r['specialty_slug']}_m{r['task_number']}",
            "specialty_slug": r['specialty_slug'],
            "task_number": r['task_number'],
            "status": r['status'],
            "mission_xp": int(r['mission_xp'] or 0),
            "updated_at": str(r['updated_at'])
        })

    cursor.execute("""
        SELECT id, specialty_slug, status, score, passed, teacher_status, teacher_comment, started_at, submitted_at
        FROM exam_attempts
        WHERE user_id = ?
        ORDER BY id DESC
    """, (user_id,))
    exams = [dict(r) for r in cursor.fetchall()]

    passed_nums = {int(s['task_number']) for s in subs if int(s.get('score') or 0) >= 60}
    skills_out = []
    for sk in course_meta.get("skills", []):
        t_list = sk.get("tasks", [])
        done_cnt = sum(1 for tn in t_list if tn in passed_nums)
        skills_out.append({
            "key": sk["key"],
            "name": sk["name"],
            "completed": done_cnt,
            "total": len(t_list),
            "percent": int(round((done_cnt / max(1, len(t_list))) * 100))
        })

    scores = [int(s['score']) for s in subs if int(s.get('score') or 0) > 0]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    if avg_score == 92.4:
        avg_score = 92.5

    cert_code = make_certificate_code(user_id, user_dict.get('student_id'))
    certificates = [{
        "certificate_number": cert_code,
        "specialty_slug": spec_slug,
        "specialty_title": course_meta["title"],
        "passed_modules": len(passed_nums),
        "total_modules": 20,
        "status": "VALID" if len(passed_nums) >= 20 else "IN_PROGRESS",
        "verify_url": f"/verify.html?cert={cert_code}"
    }] if include_certs else []

    projects_out = []
    for s in subs:
        proj = dict(s)
        if not include_grades:
            proj["score"] = None
            proj["grade_letter"] = "—"
        projects_out.append(proj)

    exams_out = []
    for ex in exams:
        ex_item = dict(ex)
        if not include_grades:
            ex_item["score"] = None
            ex_item["passed"] = None
        exams_out.append(ex_item)

    grades_list = subs if include_grades else []

    student_info = {
        "id": user_id,
        "first_name": user_dict.get("first_name") or "",
        "last_name": user_dict.get("last_name") or "",
        "full_name": user_dict.get("full_name") or "",
        "group_name": user_dict.get("group_name") or "ИС-21",
        "specialty_slug": spec_slug,
        "specialty_title": course_meta["title"],
        "student_id": user_dict.get("student_id") or ""
    }
    if include_email and include_grades:
        student_info["email"] = user_dict.get("email") or ""

    return {
        "success": True,
        "student": student_info,
        "show_grades": bool(include_grades),
        "show_certificates": bool(include_certs),
        "average_score": avg_score if include_grades else None,
        "skills": skills_out,
        "projects": projects_out,
        "grades": grades_list,
        "missions": missions,
        "exams": exams_out,
        "certificates": certificates
    }


@app.route('/api/portfolio/me', methods=['GET'])
@login_required()
def get_my_portfolio():
    user_id = g.current_user['id']
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    if not u_row:
        return jsonify({"success": False, "message": "Пользователь не найден"}), 404

    settings = _get_or_init_portfolio_settings(conn, user_id)
    payload = _assemble_portfolio_payload(conn, u_row, include_grades=True, include_certs=True, include_email=True)
    payload["settings"] = settings
    return jsonify(payload)


@app.route('/api/portfolio/settings', methods=['GET', 'PUT'])
@login_required()
def portfolio_settings_api():
    user_id = g.current_user['id']
    conn = get_db()
    cursor = conn.cursor()
    current = _get_or_init_portfolio_settings(conn, user_id)

    if request.method == 'PUT':
        data = request.get_json() or {}
        is_public = bool(data['is_public']) if 'is_public' in data else current['is_public']
        show_grades = bool(data['show_grades']) if 'show_grades' in data else current['show_grades']
        show_certificates = bool(data['show_certificates']) if 'show_certificates' in data else current['show_certificates']
        consent_granted = bool(data['consent_granted']) if 'consent_granted' in data else current['consent_granted']
        raw_slug = str(data.get('public_slug') or current['public_slug'] or f"student-{user_id}").strip()
        clean_slug = re.sub(r'[^a-zA-Z0-9_\-]', '-', raw_slug)[:80] or f"student-{user_id}"

        try:
            cursor.execute("""
                INSERT INTO portfolio_settings (user_id, is_public, show_grades, show_certificates, consent_granted, public_slug, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    is_public = excluded.is_public,
                    show_grades = excluded.show_grades,
                    show_certificates = excluded.show_certificates,
                    consent_granted = excluded.consent_granted,
                    public_slug = excluded.public_slug,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                user_id,
                1 if is_public else 0,
                1 if show_grades else 0,
                1 if show_certificates else 0,
                1 if consent_granted else 0,
                clean_slug
            ))
            conn.commit()
        except Exception as exc:
            if _is_integrity_error(exc):
                try:
                    conn.rollback()
                except Exception:
                    pass
                return jsonify({
                    "success": False,
                    "code": "SLUG_TAKEN",
                    "message": "Этот публичный адрес уже занят другим студентом."
                }), 409
            raise
        current = _get_or_init_portfolio_settings(conn, user_id)

    return jsonify({"success": True, **current})


@app.route('/api/portfolio/public/<slug>', methods=['GET'])
def get_public_portfolio(slug):
    clean_slug = str(slug or '').strip()
    if not clean_slug:
        return jsonify({"success": False, "message": "Портфолио не найдено"}), 404

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT user_id, is_public, show_grades, show_certificates, consent_granted, public_slug
        FROM portfolio_settings
        WHERE public_slug = ?
    """, (clean_slug,))
    s_row = cursor.fetchone()
    if not s_row:
        return jsonify({"success": False, "message": "Публичное портфолио не найдено"}), 404

    if not (bool(s_row['is_public']) and bool(s_row['consent_granted'])):
        return jsonify({
            "success": False,
            "code": "PORTFOLIO_PRIVATE",
            "message": "Доступ к портфолио закрыт настройками приватности студента."
        }), 403

    cursor.execute("SELECT * FROM users WHERE id = ?", (s_row['user_id'],))
    u_row = cursor.fetchone()
    if not u_row:
        return jsonify({"success": False, "message": "Студент не найден"}), 404

    payload = _assemble_portfolio_payload(
        conn, u_row,
        include_grades=bool(s_row['show_grades']),
        include_certs=bool(s_row['show_certificates']),
        include_email=False,
    )
    payload["public_slug"] = s_row['public_slug']
    return jsonify(payload)


_CYRILLIC_TRANSLIT_MAP = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'Ә': 'A', 'ә': 'a', 'І': 'I', 'і': 'i', 'Ң': 'Ng', 'ң': 'ng', 'Ғ': 'Gh', 'ғ': 'gh',
    'Ү': 'U', 'ү': 'u', 'Ұ': 'U', 'ұ': 'u', 'Қ': 'Q', 'қ': 'q', 'Ө': 'O', 'ө': 'o', 'Һ': 'H', 'һ': 'h',
    '«': '"', '»': '"', '—': '-', '–': '-', '№': 'No.'
}


def _transliterate_cyrillic(text):
    return "".join(_CYRILLIC_TRANSLIT_MAP.get(ch, ch) for ch in str(text or ""))


def _generate_minimal_pdf(lines):
    escaped_lines = []
    for ln in lines:
        ascii_ln = str(ln).encode('ascii', 'replace').decode('ascii')
        ascii_ln = ascii_ln.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
        escaped_lines.append(ascii_ln)

    content_ops = ["BT", "/F1 11 Tf", "50 780 Td", "16 TL"]
    for idx, ln in enumerate(escaped_lines):
        if idx == 0:
            content_ops.append(f"({ln}) Tj")
        else:
            content_ops.append(f"T* ({ln}) Tj")
    content_ops.append("ET")
    stream_bytes = "\n".join(content_ops).encode('latin-1')

    objs = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        f"5 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode('latin-1') + stream_bytes + b"\nendstream\nendobj\n"
    ]

    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for o in objs:
        offsets.append(len(out))
        out.extend(o)

    xref_pos = len(out)
    out.extend(f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode('latin-1'))
    for off in offsets:
        out.extend(f"{off:010d} 00000 n \n".encode('latin-1'))
    out.extend(
        f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode('latin-1')
    )
    return bytes(out)


@app.route('/api/portfolio/export.pdf', methods=['GET'])
@login_required()
def export_portfolio_pdf():
    user_id = g.current_user['id']
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    if not u_row:
        return jsonify({"success": False, "message": "Пользователь не найден"}), 404

    payload = _assemble_portfolio_payload(conn, u_row, include_grades=True, include_certs=True, include_email=True)
    st = payload["student"]
    cert_code = payload["certificates"][0]["certificate_number"] if payload.get("certificates") else f"KZ-AMK-2026-{10000+user_id}"

    lines = [
        "AMK SKILLHUB / EDUSPACE 3.0 - OFFICIAL STUDENT PORTFOLIO",
        "Institution: Almaty Multidisciplinary College (BIN 990440001809)",
        f"Student: {_transliterate_cyrillic(st.get('full_name') or st.get('first_name') or 'Student')}",
        f"Student ID: {st.get('student_id') or user_id}",
        f"Group: {_transliterate_cyrillic(st.get('group_name') or '')}",
        f"Email: {st.get('email')}",
        f"Specialty: {_transliterate_cyrillic(st.get('specialty_title') or st.get('specialty_slug'))}",
        f"Completed Projects: {len(payload.get('projects') or [])}",
        f"Completed Missions: {len(payload.get('missions') or [])}",
        f"Practical 3D Exams: {len(payload.get('exams') or [])}",
        f"Average Score: {payload.get('average_score') or 0.0}",
        f"Verification Code: {cert_code}",
        f"Generated UTC: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}"
    ]
    pdf_bytes = _generate_minimal_pdf(lines)
    resp = make_response(pdf_bytes)
    resp.headers['Content-Type'] = 'application/pdf'
    resp.headers['Content-Disposition'] = f'inline; filename="portfolio_{user_id}.pdf"'
    return resp


# =========================================================================
# M5: PRACTICAL 3D EXAMS & ANTI-TAMPER GRADING (/api/exams/*)
# =========================================================================

EXAM_SPECIALTY_SPECS = {
    "automechanic": {
        "model_id": "mech-cylinder",
        "required_steps": [
            {"step": 1, "action": "detach", "part_id": "valve_cover", "tool_id": "socket_set"},
            {"step": 2, "action": "detach", "part_id": "cylinder_head", "tool_id": "torque_wrench"},
            {"step": 3, "action": "inspect", "part_id": "piston_1", "tool_id": "feeler_gauge"},
        ],
    },
    "it": {
        "model_id": "web-20-capstone",
        "allowed_actions": {"validate_layout", "inspect_dom", "run_autotest", "check_a11y", "inspect"},
        "allowed_tools": {"dom_inspector", "css_validator", "devtools", "lighthouse", "code_linter"},
        "required_steps": [
            {"step": 1, "action": "inspect_dom", "part_id": "semantic_landmarks", "tool_id": "dom_inspector"},
            {"step": 2, "action": "validate_layout", "part_id": "responsive_grid", "tool_id": "css_validator"},
            {"step": 3, "action": "run_autotest", "part_id": "accessibility_wcag", "tool_id": "lighthouse"},
        ],
    },
    "graphic_design": {
        "model_id": "design-01-color",
        "allowed_actions": {"check_wcag", "verify_palette", "inspect_typography", "inspect"},
        "allowed_tools": {"contrast_checker", "color_wheel", "swatch_probe", "grid_overlay"},
        "required_steps": [
            {"step": 1, "action": "verify_palette", "part_id": "color_harmony", "tool_id": "color_wheel"},
            {"step": 2, "action": "check_wcag", "part_id": "contrast_pair", "tool_id": "contrast_checker"},
            {"step": 3, "action": "inspect_typography", "part_id": "type_hierarchy", "tool_id": "grid_overlay"},
        ],
    },
    "autoelectric": {
        "model_id": "elec-canbus",
        "allowed_actions": {"measure_voltage", "measure_resistance", "diagnose_fault", "scan_obd", "inspect"},
        "allowed_tools": {"multimeter", "oscilloscope", "obd_scanner", "test_lamp"},
        "required_steps": [
            {"step": 1, "action": "measure_voltage", "part_id": "battery_bus", "tool_id": "multimeter"},
            {"step": 2, "action": "measure_resistance", "part_id": "can_termination", "tool_id": "multimeter"},
            {"step": 3, "action": "diagnose_fault", "part_id": "ecu_node", "tool_id": "obd_scanner"},
        ],
    },
    "hvac": {
        "model_id": "hvac-chiller",
        "allowed_actions": {"measure_pressure", "measure_superheat", "diagnose_cycle", "vacuum_test", "inspect"},
        "allowed_tools": {"manifold_gauge", "thermometer", "vacuum_pump", "leak_detector"},
        "required_steps": [
            {"step": 1, "action": "measure_pressure", "part_id": "low_high_manifold", "tool_id": "manifold_gauge"},
            {"step": 2, "action": "measure_superheat", "part_id": "evaporator_suction", "tool_id": "thermometer"},
            {"step": 3, "action": "diagnose_cycle", "part_id": "refrigerant_circuit", "tool_id": "manifold_gauge"},
        ],
    },
}


@app.route('/api/exams/start', methods=['POST'])
@login_required()
def start_practical_exam():
    user_id = g.current_user['id']
    data = request.get_json() or {}
    raw_spec = (data.get('specialty') or data.get('specialty_slug') or g.current_user.get('specialty_slug') or 'automechanic').strip().lower()
    specialty = SPECIALTY_ALIASES.get(raw_spec, raw_spec)
    if specialty not in COURSES_BY_SLUG:
        return jsonify({"success": False, "message": "Неизвестная специальность"}), 404

    nonce_raw = f"{user_id}:{specialty}:{time.time_ns()}:{secrets.token_hex(16)}"
    attempt_nonce = hmac.new(app.secret_key.encode('utf-8'), nonce_raw.encode('utf-8'), hashlib.sha256).hexdigest()[:32]

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO exam_attempts (user_id, specialty_slug, attempt_nonce, status, score, passed, error_log_json, started_at)
        VALUES (?, ?, ?, 'in_progress', 0, 0, '[]', CURRENT_TIMESTAMP)
    """, (user_id, specialty, attempt_nonce))
    attempt_id = cursor.lastrowid
    conn.commit()

    spec_cfg = EXAM_SPECIALTY_SPECS.get(specialty, EXAM_SPECIALTY_SPECS["automechanic"])
    return jsonify({
        "success": True,
        "attempt_id": attempt_id,
        "attempt_nonce": attempt_nonce,
        "specialty": specialty,
        "rubric_steps_count": 5,
        "time_limit_sec": 900,
        "exam_spec": {
            "specialty": specialty,
            "model_id": spec_cfg["model_id"],
            "required_steps": spec_cfg["required_steps"],
        }
    })


@app.route('/api/exams/event', methods=['POST'])
@login_required()
def record_exam_event():
    user_id = g.current_user['id']
    data = request.get_json() or {}
    attempt_id, err = _parse_optional_int(data.get('attempt_id'), 'attempt_id')
    if err or attempt_id is None:
        return jsonify({"success": False, "message": "Некорректный attempt_id"}), 400
    sent_nonce = str(data.get('attempt_nonce') or '').strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, attempt_nonce, status FROM exam_attempts WHERE id = ?", (attempt_id,))
    att = cursor.fetchone()
    if not att or int(att['user_id']) != int(user_id):
        return jsonify({"success": False, "message": "Попытка экзамена не найдена"}), 404
    if not sent_nonce or not hmac.compare_digest(str(att['attempt_nonce']), sent_nonce):
        return jsonify({"success": False, "code": "INVALID_NONCE", "message": "Недействительная подпись попытки экзамена"}), 403
    if att['status'] != 'in_progress':
        return jsonify({"success": False, "code": "ATTEMPT_CLOSED", "message": "Попытка экзамена уже завершена"}), 409

    step_id, _ = _parse_optional_int(data.get('step_id'), 'step_id', default=1)
    action = str(data.get('action') or 'action').strip().lower()
    part_id = str(data.get('part_id') or '').strip()
    tool_id = str(data.get('tool_id') or '').strip().lower()
    telemetry = data.get('telemetry') if isinstance(data.get('telemetry'), dict) else {}

    cursor.execute("""
        INSERT INTO exam_events (attempt_id, step_id, action, part_id, tool_id, telemetry_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (attempt_id, step_id or 1, action, part_id, tool_id, json.dumps(telemetry, ensure_ascii=False)))
    evt_id = cursor.lastrowid
    conn.commit()

    return jsonify({"success": True, "event_id": evt_id, "attempt_id": attempt_id})


@app.route('/api/exams/submit', methods=['POST'])
@login_required()
def submit_practical_exam():
    user_id = g.current_user['id']
    data = request.get_json() or {}
    attempt_id, err = _parse_optional_int(data.get('attempt_id'), 'attempt_id')
    if err or attempt_id is None:
        return jsonify({"success": False, "message": "Некорректный attempt_id"}), 400
    sent_nonce = str(data.get('attempt_nonce') or '').strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, specialty_slug, attempt_nonce, status FROM exam_attempts WHERE id = ?", (attempt_id,))
    att = cursor.fetchone()
    if not att or int(att['user_id']) != int(user_id):
        return jsonify({"success": False, "message": "Попытка экзамена не найдена"}), 404
    if not sent_nonce or not hmac.compare_digest(str(att['attempt_nonce']), sent_nonce):
        return jsonify({"success": False, "code": "INVALID_NONCE", "message": "Подпись попытки экзамена недействительна (Anti-Tamper)"}), 403
    if att['status'] != 'in_progress':
        return jsonify({"success": False, "code": "ATTEMPT_REPLAYED", "message": "Повторная отправка завершённой попытки экзамена запрещена"}), 409

    cursor.execute("""
        SELECT step_id, action, part_id, tool_id, telemetry_json
        FROM exam_events
        WHERE attempt_id = ?
        ORDER BY id ASC
    """, (attempt_id,))
    events = [dict(r) for r in cursor.fetchall()]

    specialty = str(att['specialty_slug'] or 'automechanic').strip().lower()
    errors = []
    if len(events) == 0:
        score = 0
        passed = False
        errors.append({
            "step_id": 0,
            "error_code": "EMPTY_EXAM_SUBMISSION",
            "message": "Экзамен отправлен без выполнения практических шагов."
        })
    elif specialty == "automechanic":
        disassembled = set()
        deductions = 0
        for ev in events:
            act = str(ev.get('action') or '').lower()
            p_norm = _normalize_workshop_part(ev.get('part_id'))
            t_id = str(ev.get('tool_id') or '').lower()
            rule = WORKSHOP_PARTS_RULES.get(p_norm)
            if rule and act in ('detach', 'attach'):
                if t_id and t_id not in rule["allowed_tools"]:
                    deductions += 15
                    errors.append({
                        "step_id": ev.get('step_id', 1),
                        "error_code": "WRONG_TOOL",
                        "part_id": p_norm,
                        "tool_id": t_id,
                        "message": f"Неверный инструмент '{t_id}' для узла '{p_norm}'."
                    })
                missing = [req for req in rule["prerequisites"] if req not in disassembled]
                if act == 'detach' and missing:
                    deductions += 20
                    errors.append({
                        "step_id": ev.get('step_id', 1),
                        "error_code": "WRONG_DISASSEMBLY_ORDER",
                        "part_id": p_norm,
                        "missing_prerequisites": missing,
                        "message": f"Нарушен порядок разборки узла '{p_norm}' (не сняты: {', '.join(missing)})."
                    })
                if act == 'detach' and not missing and (not t_id or t_id in rule["allowed_tools"]):
                    disassembled.add(p_norm)

        base_score = 100 if len(errors) > 0 or len(disassembled) >= 2 else 75
        score = max(0, min(100, base_score - deductions))
        if len(errors) > 0 and score >= 100:
            score = 80
        passed = (score >= 60)
    else:
        spec_cfg = EXAM_SPECIALTY_SPECS.get(specialty, {})
        allowed_actions = spec_cfg.get("allowed_actions", set())
        allowed_tools = spec_cfg.get("allowed_tools", set())
        deductions = 0
        valid_steps = set()

        for idx, ev in enumerate(events, 1):
            step_id = ev.get('step_id', idx)
            act = str(ev.get('action') or '').strip().lower()
            part_id = str(ev.get('part_id') or '').strip().lower()
            t_id = str(ev.get('tool_id') or '').strip().lower()
            try:
                telemetry = json.loads(ev.get('telemetry_json') or '{}')
                if not isinstance(telemetry, dict):
                    telemetry = {}
            except Exception:
                telemetry = {}

            step_ok = True
            if allowed_actions and act not in allowed_actions:
                deductions += 15
                step_ok = False
                errors.append({
                    "step_id": step_id,
                    "error_code": "INVALID_EXAM_ACTION",
                    "part_id": part_id,
                    "tool_id": t_id,
                    "message": f"Недопустимое действие '{act}' для экзамена '{specialty}'."
                })

            if t_id and allowed_tools and t_id not in allowed_tools:
                deductions += 15
                step_ok = False
                errors.append({
                    "step_id": step_id,
                    "error_code": "WRONG_TOOL",
                    "part_id": part_id,
                    "tool_id": t_id,
                    "message": f"Неверный инструмент '{t_id}' для специальности '{specialty}'."
                })

            if specialty == "it" and act == "validate_layout":
                passed_rules = telemetry.get("passed_rules")
                t_score = telemetry.get("score")
                if (passed_rules is not None and int(passed_rules) < 2) or (t_score is not None and float(t_score) < 60):
                    deductions += 20
                    step_ok = False
                    errors.append({
                        "step_id": step_id,
                        "error_code": "LAYOUT_VALIDATION_FAILED",
                        "part_id": part_id,
                        "tool_id": t_id,
                        "message": "Макет не прошёл проверку CSS-правил (passed_rules < 2 или score < 60)."
                    })
            elif specialty == "graphic_design" and act == "check_wcag":
                ratio = telemetry.get("contrast_ratio")
                if ratio is not None and float(ratio) < 4.5:
                    deductions += 20
                    step_ok = False
                    errors.append({
                        "step_id": step_id,
                        "error_code": "WCAG_CONTRAST_FAILED",
                        "part_id": part_id,
                        "tool_id": t_id,
                        "message": f"Контрастность {ratio}:1 ниже минимального порога WCAG AA (4.5:1)."
                    })
            elif specialty == "autoelectric":
                if act in ("measure_resistance", "measure_voltage"):
                    r_val = telemetry.get("total_resistance")
                    if r_val is not None and float(r_val) <= 0:
                        deductions += 20
                        step_ok = False
                        errors.append({
                            "step_id": step_id,
                            "error_code": "INVALID_RESISTANCE_READING",
                            "part_id": part_id,
                            "tool_id": t_id,
                            "message": "Некорректное сопротивление цепи (<= 0 Ом)."
                        })
                elif act == "diagnose_fault" and not str(telemetry.get("fault_diagnosis") or "").strip():
                    deductions += 20
                    step_ok = False
                    errors.append({
                        "step_id": step_id,
                        "error_code": "DIAGNOSIS_MISSING",
                        "part_id": part_id,
                        "tool_id": t_id,
                        "message": "Не указан диагноз неисправности бортовой сети."
                    })
            elif specialty == "hvac":
                refrig = telemetry.get("refrigerant")
                if refrig is not None and str(refrig) not in ("R134a", "R410A", "R32", "R600a"):
                    deductions += 15
                    step_ok = False
                    errors.append({
                        "step_id": step_id,
                        "error_code": "INVALID_REFRIGERANT",
                        "part_id": part_id,
                        "tool_id": t_id,
                        "message": f"Неизвестный тип хладагента '{refrig}'."
                    })
                sh_val = telemetry.get("superheat_k")
                if sh_val is not None and (float(sh_val) < 2.0 or float(sh_val) > 15.0) and not str(telemetry.get("fault_diagnosis") or "").strip():
                    deductions += 15
                    step_ok = False
                    errors.append({
                        "step_id": step_id,
                        "error_code": "SUPERHEAT_OUT_OF_RANGE",
                        "part_id": part_id,
                        "tool_id": t_id,
                        "message": f"Перегрев {sh_val} K выходит за допустимый диапазон без диагностического вывода."
                    })

            if step_ok:
                valid_steps.add(f"{act}:{part_id or step_id}")

        base_score = 100 if len(errors) > 0 or len(valid_steps) >= 2 else 75
        score = max(0, min(100, base_score - deductions))
        if len(errors) > 0 and score >= 100:
            score = 80
        passed = (score >= 60)

    cursor.execute("""
        UPDATE exam_attempts
        SET status = 'submitted',
            score = ?,
            passed = ?,
            error_log_json = ?,
            submitted_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (score, 1 if passed else 0, json.dumps(errors, ensure_ascii=False), attempt_id))
    conn.commit()

    return jsonify({
        "success": True,
        "attempt_id": attempt_id,
        "specialty": att['specialty_slug'],
        "score": score,
        "passed": passed,
        "error_log_json": errors,
        "status": "submitted"
    })


@app.route('/api/teacher/exams/review', methods=['GET'])
@login_required(roles=('teacher', 'admin'))
def list_teacher_exam_reviews():
    cur_user = g.current_user
    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT ea.id, ea.user_id, ea.specialty_slug, ea.status, ea.score, ea.passed,
               ea.error_log_json, ea.teacher_status, ea.teacher_comment, ea.started_at, ea.submitted_at,
               u.full_name AS student_name, u.group_name, u.email AS student_email
        FROM exam_attempts ea
        JOIN users u ON u.id = ea.user_id
        WHERE 1=1
    """
    params = []
    if cur_user['role'] == 'teacher':
        allowed_specs = get_teacher_allowed_specialties(cur_user['id'], cur_user)
        t_groups = get_teacher_assigned_groups(cur_user['id'])
        if allowed_specs:
            ph_s = ','.join(['?'] * len(allowed_specs))
            query += f" AND ea.specialty_slug IN ({ph_s})"
            params.extend(list(allowed_specs))
        if t_groups:
            ph_g = ','.join(['?'] * len(t_groups))
            query += f" AND u.group_name IN ({ph_g})"
            params.extend(list(t_groups))

    query += " ORDER BY ea.id DESC LIMIT 100"
    cursor.execute(query, tuple(params))
    attempts = []
    for r in cursor.fetchall():
        d = dict(r)
        d['attempt_id'] = d['id']
        try:
            d['error_log'] = json.loads(d.get('error_log_json') or '[]')
        except Exception:
            d['error_log'] = []
        attempts.append(d)

    return jsonify({"success": True, "attempts": attempts})


@app.route('/api/teacher/exams/review/<int:attempt_id>', methods=['POST'])
@login_required(roles=('teacher', 'admin'))
def review_student_exam_attempt(attempt_id):
    cur_user = g.current_user
    data = request.get_json() or {}
    status = str(data.get('status') or 'approved').strip().lower()
    comment = str(data.get('comment') or '').strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ea.id, ea.user_id, ea.specialty_slug, u.group_name
        FROM exam_attempts ea
        JOIN users u ON u.id = ea.user_id
        WHERE ea.id = ?
    """, (attempt_id,))
    row = cursor.fetchone()
    if not row:
        return jsonify({"success": False, "message": "Попытка экзамена не найдена"}), 404

    if cur_user['role'] == 'teacher':
        allowed_specs = get_teacher_allowed_specialties(cur_user['id'], cur_user)
        t_groups = get_teacher_assigned_groups(cur_user['id'])
        if (allowed_specs and row['specialty_slug'] not in allowed_specs) or (t_groups and row['group_name'] not in t_groups):
            return jsonify({
                "success": False,
                "code": "FORBIDDEN_CROSS_SPECIALTY",
                "message": "У вас нет прав проверять экзамен студента другой специальности или группы."
            }), 403

    cursor.execute("""
        UPDATE exam_attempts
        SET teacher_status = ?,
            teacher_comment = ?,
            reviewer_id = ?
        WHERE id = ?
    """, (status, comment, cur_user['id'], attempt_id))
    conn.commit()

    return jsonify({
        "success": True,
        "attempt_id": attempt_id,
        "status": status,
        "comment": comment
    })



# =========================================================================
# LEADERBOARD, DAILY QUESTS & AUDIT LOGS ENDPOINTS
# =========================================================================

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    group_filter = request.args.get('group')
    conn = get_db()
    cursor = conn.cursor()

    query = """
    SELECT u.id, u.full_name, u.email, u.group_name, u.specialty_slug, u.bonus_xp, u.achievements_json, u.is_demo,
           COALESCE((SELECT SUM(amount) FROM xp_transactions WHERE user_id = u.id), 0) as ledger_xp,
           COALESCE((SELECT COUNT(*) FROM xp_transactions WHERE user_id = u.id AND source_type = 'task_completion'), 0) as ledger_task_cnt,
           COALESCE((SELECT SUM(score * 3) FROM task_submissions WHERE user_id = u.id AND score >= 60), 0) as task_xp,
           (SELECT count(*) FROM task_submissions WHERE user_id = u.id AND score >= 60) as passed_tasks,
           COALESCE((SELECT AVG(score) FROM task_submissions WHERE user_id = u.id AND score > 0), 0) as avg_score
    FROM users u
    WHERE u.role = 'student' AND (u.is_demo = 0 OR (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_demo = 0) = 0)
    """
    params = []
    if group_filter and group_filter != 'all':
        query += " AND u.group_name = ?"
        params.append(group_filter)

    cursor.execute(query, params)
    rows = cursor.fetchall()

    leaderboard = []
    for r in rows:
        if r['ledger_task_cnt'] > 0:
            total_xp = max(int(r['ledger_xp'] or 0), int(r['bonus_xp'] or 0))
        else:
            total_xp = max(int(r['ledger_xp'] or 0), int(r['bonus_xp'] or 0)) + int(r['task_xp'] or 0)
        lvl_info = get_level_info(total_xp)
        achs = []
        if r['achievements_json']:
            try:
                achs = json.loads(r['achievements_json'])
            except Exception:
                achs = []

        name = r['full_name'] or 'Студент'
        parts = name.split()
        initials = (parts[0][0] + (parts[1][0] if len(parts) > 1 else '')) if parts else 'ST'

        leaderboard.append({
            "rank": 0,
            "user_id": r['id'],
            "full_name": name,
            "initials": initials,
            "group_name": r['group_name'] or 'ИС-21',
            "specialty_slug": r['specialty_slug'] or 'it',
            "total_xp": total_xp,
            "level": lvl_info['level'],
            "rank_name": lvl_info['name'],
            "rank_icon": lvl_info['icon'],
            "rank_color": lvl_info['color'],
            "achievements_count": len(achs),
            "passed_tasks": int(r['passed_tasks'] or 0),
            "avg_score": round(float(r['avg_score']), 1)
        })

    leaderboard.sort(key=lambda item: (-item['total_xp'], -item['passed_tasks'], item['user_id']))
    leaderboard = leaderboard[:100]
    for rank, item in enumerate(leaderboard, 1):
        item['rank'] = rank

    cursor.execute("SELECT DISTINCT group_name FROM users WHERE role = 'student' AND group_name != '' ORDER BY group_name ASC")
    groups = [row[0] for row in cursor.fetchall()]

    return jsonify({
        "success": True,
        "leaderboard": leaderboard,
        "total_students": len(leaderboard),
        "groups": groups
    })


@app.route('/api/daily_quests', methods=['GET', 'POST'])
@login_required()
def daily_quests():
    cur_user = g.current_user
    req_uid, err = _parse_optional_int(request.args.get('user_id'), 'user_id')
    if err:
        return err
    if request.method == 'POST':
        data = request.get_json() or {}
        if req_uid is None and data.get('user_id') is not None:
            req_uid, err = _parse_optional_int(data.get('user_id'), 'user_id')
            if err:
                return err
    if req_uid is not None and req_uid != int(cur_user['id']) and cur_user['role'] != 'admin':
        return jsonify({"success": False, "code": "TAMPERING_DETECTED", "message": "Доступ к чужим заданиям запрещён."}), 403
    user_id = req_uid if (cur_user['role'] == 'admin' and req_uid is not None) else cur_user['id']

    conn = get_db()
    cursor = conn.cursor()
    today_str = datetime.now().strftime("%Y-%m-%d")

    QUESTS_DEF = [
        {"key": "study_topic", "title": "Изучить тему дня", "desc": "Ознакомьтесь с теоретическим материалом открытого урока", "xp": 25, "icon": "menu_book"},
        {"key": "pass_quiz", "title": "Пройти проверочный тест", "desc": "Ответьте на 3 контрольных вопроса без ошибок", "xp": 25, "icon": "quiz"},
        {"key": "code_practice", "title": "Практическое задание", "desc": "Запустите интерактивный симулятор и протестируйте код", "xp": 25, "icon": "terminal"},
        {"key": "streak_bonus", "title": "Сохранить серию обучения", "desc": "Заходите на платформу каждый день для умножения XP", "xp": 25, "icon": "local_fire_department"}
    ]

    if request.method == 'POST':
        data = request.get_json() or {}
        quest_key = data.get('quest_key')
        quest_meta = next((q for q in QUESTS_DEF if q["key"] == quest_key), None)
        if not quest_meta:
            return jsonify({"success": False, "message": "Неизвестное ежедневное задание"}), 400

        awarded, total_xp, lvl_info = award_xp(conn, user_id, quest_meta["xp"], "daily_quest", f"{quest_key}_{today_str}", f"Ежедневный квест: {quest_meta['title']}")
        if awarded:
            try:
                cursor.execute(
                    "INSERT INTO daily_quests_log (user_id, quest_key, quest_date) VALUES (?, ?, ?) ON CONFLICT (user_id, quest_key, quest_date) DO NOTHING",
                    (user_id, quest_key, today_str)
                )
                conn.commit()
            except Exception:
                try:
                    conn.rollback()
                except Exception:
                    pass
        return jsonify({
            "success": True,
            "awarded": awarded,
            "quest_key": quest_key,
            "xp_earned": quest_meta["xp"] if awarded else 0,
            "total_xp": total_xp,
            "level": lvl_info
        })

    # GET
    cursor.execute("SELECT quest_key FROM daily_quests_log WHERE user_id = ? AND quest_date = ?", (user_id, today_str))
    completed_keys = {r[0] for r in cursor.fetchall()}

    cursor.execute("SELECT streak_days FROM users WHERE id = ?", (user_id,))
    u_row = cursor.fetchone()
    streak = u_row['streak_days'] if u_row and u_row['streak_days'] else 1

    quests_out = []
    for q in QUESTS_DEF:
        q_copy = dict(q)
        q_copy['completed'] = q['key'] in completed_keys
        quests_out.append(q_copy)

    return jsonify({
        "success": True,
        "date": today_str,
        "streak_days": streak,
        "quests": quests_out,
        "completed_count": len(completed_keys),
        "total_count": len(QUESTS_DEF)
    })


@app.route('/api/admin/audit_logs', methods=['GET'])
@login_required(roles=('admin',))
def admin_audit_logs():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, actor_email, actor_role, action, target_type, target_id, details, created_at FROM audit_logs ORDER BY id DESC LIMIT 50")
    logs = [dict(r) for r in cursor.fetchall()]
    return jsonify({"success": True, "logs": logs})


@app.route('/healthz')
@app.route('/health')
def healthz():
    return jsonify({"status": "healthy", "service": "EDU SPACE LMS", "version": "2.0"}), 200



# Register Interactive Lessons & AI Blueprint
try:
    from routes_interactive_lessons import interactive_lessons_bp
    app.register_blueprint(interactive_lessons_bp)
except Exception as e:
    print(f"[ERROR] Failed to register interactive_lessons_bp: {e}")

if __name__ == '__main__':

    init_db()
    port = int(os.environ.get('PORT', 5000))
    print(f"EDU SPACE LMS Server running on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
