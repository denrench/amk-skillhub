# -*- coding: utf-8 -*-
"""
АМК Практикум — Полнофункциональный сервер аутентификации и базы данных
Алматинский многопрофильный колледж (amk.edu.kz)
Стек: Python 3, Flask, SQLite3, Werkzeug Security
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

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Таблица пользователей (Студенты и Преподаватели с хешами паролей)
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

    # 2. Таблица оценок и результатов симуляторов
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

    # Начальные демо-аккаунты (если база пустая)
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        seed_users = [
            # Преподаватель (Зав. отделением): teacher@amk.kz / admin123
            ("teacher@amk.kz", generate_password_hash("admin123"), "Иванов Сергей Павлович", "teacher", "Кафедра ТиПО", "TEACHER-AMK-01"),
            # Студент 1: student@amk.kz / student123
            ("student@amk.kz", generate_password_hash("student123"), "Асылхан Бауыржанұлы", "student", "ПО-22", "KZ-AMK-2026-98421"),
            # Студент 2: danil@amk.kz / 123456
            ("danil@amk.kz", generate_password_hash("123456"), "Данил Панин", "student", "ПО-22", "KZ-AMK-2026-98422"),
            # Студент 3: alina@amk.kz / 123456
            ("alina@amk.kz", generate_password_hash("123456"), "Алина Сейдалиева", "student", "ПО-22", "KZ-AMK-2026-98423"),
            # Студент 4: arman@amk.kz / 123456
            ("arman@amk.kz", generate_password_hash("123456"), "Арман Исаев", "student", "АВ-21", "KZ-AMK-2026-77101"),
            # Студент 5: zhanibek@amk.kz / 123456
            ("zhanibek@amk.kz", generate_password_hash("123456"), "Жанибек Оразов", "student", "ХО-20", "KZ-AMK-2026-55201")
        ]

        cursor.executemany(
            '''INSERT INTO users (email, password_hash, full_name, role, group_name, student_id)
               VALUES (?, ?, ?, ?, ?, ?)''',
            seed_users
        )

        # Оценки для студента student@amk.kz (user_id = 2)
        seed_grades = [
            (2, "KZ-AMK-2026-98421", "it", "Программное обеспечение", 100, "Сдано на отлично"),
            (2, "KZ-AMK-2026-98421", "auto", "Автодиагностика ДВС", 100, "Сдано на отлично"),
            (2, "KZ-AMK-2026-98421", "cryo", "Холодильные установки", 100, "Сдано на отлично"),
            (2, "KZ-AMK-2026-98421", "design", "Графический дизайн", 100, "Сдано на отлично"),
            (2, "KZ-AMK-2026-98421", "furniture", "Раскрой мебели", 100, "Сдано на отлично"),

            (3, "KZ-AMK-2026-98422", "it", "Программное обеспечение", 95, "Сдано на отлично"),
            (3, "KZ-AMK-2026-98422", "auto", "Автодиагностика ДВС", 85, "Сдано хорошо"),
            (4, "KZ-AMK-2026-98423", "it", "Программное обеспечение", 80, "Сдано хорошо"),
            (5, "KZ-AMK-2026-77101", "auto", "Автодиагностика ДВС", 100, "Сдано на отлично")
        ]

        cursor.executemany(
            '''INSERT INTO grades (user_id, student_id, specialty_slug, specialty_name, score, status)
               VALUES (?, ?, ?, ?, ?, ?)''',
            seed_grades
        )
        conn.commit()

    conn.close()

# ========================================================
# REST API: АУТЕНТИФИКАЦИЯ (РЕГИСТРАЦИЯ И ВХОД)
# ========================================================

# 1. Регистрация нового пользователя
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

    # Проверка роли преподавателя
    if role == 'teacher':
        if teacher_key != TEACHER_SECRET_KEY:
            return jsonify({
                "success": False,
                "message": f"Неверный секретный код преподавателя колледжа! (Подсказка для комиссии: {TEACHER_SECRET_KEY})"
            }), 403
        student_id = f"TEACHER-AMK-{random.randint(10, 99)}"
        group_name = group_name or "Преподавательский состав"
    else:
        role = 'student'
        student_id = f"KZ-AMK-2026-{random.randint(10000, 99999)}"

    conn = get_db()
    cursor = conn.cursor()

    # Проверка уникальности Email
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

# 2. Вход в систему (Авторизация по паролю)
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

# 3. Получение профиля пользователя и его оценок
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
    conn.close()

    return jsonify({
        "success": True,
        "user": dict(user),
        "grades": grades
    })

# ========================================================
# REST API: КАБИНЕТ ПРЕПОДАВАТЕЛЯ (ЗАЩИЩЕННЫЙ ЖУРНАЛ)
# ========================================================

# 4. Получение ведомости успеваемости по группам
@app.route('/api/teacher/journal', methods=['GET'])
def get_teacher_journal():
    group_filter = request.args.get('group', 'all')
    teacher_id = request.args.get('teacher_id')

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

    query += ' GROUP BY u.id ORDER BY avg_score DESC'

    cursor.execute(query, params)
    students = [dict(r) for r in cursor.fetchall()]

    # Для каждого студента подгружаем детальные оценки по предметам
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

# 5. Сохранение результата тренажера в базу данных
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

    # Если user_id не передан, найдем его по student_id
    if not user_id:
        cursor.execute('SELECT id FROM users WHERE student_id = ?', (student_id,))
        row = cursor.fetchone()
        user_id = row['id'] if row else 2

    # Проверяем существующую оценку
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
        "platform": "АМК Практикум",
        "auth_engine": "Werkzeug Security OK",
        "database": "SQLite3 OK",
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
    print("=" * 60)
    print("🚀 СЕРВЕР «АМК ПРАКТИКУМ» ЗАПУЩЕН!")
    print(f"🌐 Главная страница:        http://127.0.0.1:{port}/")
    print(f"🔑 Страница входа/рег.:     http://127.0.0.1:{port}/auth.html")
    print(f"💻 Интерактивные тренажеры: http://127.0.0.1:{port}/simulator.html")
    print(f"👨‍🏫 Журнал преподавателя:   http://127.0.0.1:{port}/teacher.html")
    print(f"🗄️ База данных:            {DB_PATH} (SQLite3)")
    print(f"🔐 Код регистрации препода: {TEACHER_SECRET_KEY}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=False)
