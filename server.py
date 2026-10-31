# -*- coding: utf-8 -*-
"""
EDU SPACE Backend Server
Алматинский многопрофильный колледж (АМК)
Python 3 + Flask + SQLite3
"""

import os
import sqlite3
import hashlib
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, g

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = BASE_DIR
DB_PATH = os.path.join(BASE_DIR, "database.db")

app = Flask(__name__, static_folder=APP_DIR)
app.config['SECRET_KEY'] = 'amk-eduspace-secret-2026'

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

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
        group_name TEXT,
        student_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        grade_letter TEXT NOT NULL DEFAULT 'F',
        status TEXT NOT NULL DEFAULT 'submitted',
        time_spent_seconds INTEGER DEFAULT 0,
        submitted_code TEXT,
        teacher_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS platform_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)
    cursor.execute("INSERT OR IGNORE INTO platform_settings (key, value) VALUES ('current_study_day', '1');")

    conn.commit()
    conn.close()

def get_current_day():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT value FROM platform_settings WHERE key = 'current_study_day';")
    row = c.fetchone()
    if row:
        try:
            return int(row['value'])
        except Exception:
            return 1
    return 1

# ==========================================
# AUTH API
# ==========================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()
    role = data.get('role', 'student').strip().lower()
    group_name = data.get('group_name', 'ИС-21').strip()

    if not email or not password or not full_name:
        return jsonify({"success": False, "message": "Все обязательные поля должны быть заполнены"}), 400

    if role not in ('student', 'teacher'):
        return jsonify({"success": False, "message": "Недопустимая роль пользователя"}), 400

    pwd_hash = hashlib.sha256(password.encode()).hexdigest()
    student_id = f"KZ-AMK-2026-{abs(hash(email)) % 90000 + 10000}" if role == 'student' else None

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, role, group_name, student_id)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (email, pwd_hash, full_name, role, group_name, student_id))
        conn.commit()
        user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Пользователь с таким email уже зарегистрирован"}), 409

    return jsonify({
        "success": True,
        "message": "Регистрация успешно завершена!",
        "user": {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
            "group_name": group_name,
            "student_id": student_id
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({"success": False, "message": "Введите email и пароль"}), 400

    pwd_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, email, full_name, role, group_name, student_id
    FROM users
    WHERE email = ? AND password_hash = ?
    """, (email, pwd_hash))
    user = cursor.fetchone()

    if not user:
        return jsonify({"success": False, "message": "Неверный email или пароль"}), 401

    return jsonify({
        "success": True,
        "message": f"Добро пожаловать, {user['full_name']}!",
        "user": dict(user)
    })

@app.route('/api/user/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, email, full_name, role, group_name, student_id, created_at FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    if not user:
        return jsonify({"success": False, "message": "Пользователь не найден"}), 404

    cursor.execute("""
    SELECT COUNT(*) as total_submitted,
           AVG(score) as avg_score,
           SUM(CASE WHEN score >= 60 THEN 1 ELSE 0 END) as passed_count
    FROM task_submissions
    WHERE user_id = ?
    """, (user_id,))
    stats = cursor.fetchone()

    return jsonify({
        "success": True,
        "profile": dict(user),
        "statistics": {
            "total_submitted": stats['total_submitted'] or 0,
            "avg_score": round(stats['avg_score'] or 0.0, 1),
            "passed_count": stats['passed_count'] or 0
        }
    })

# ==========================================
# TASKS & GRADUAL DRIP-FEED SCHEDULE API
# ==========================================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    specialty = request.args.get('specialty')
    mode = request.args.get('mode')
    ticket = request.args.get('ticket')
    user_id = request.args.get('user_id')

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
    if user_id:
        cursor.execute('SELECT task_number, specialty_slug, score, status, grade_letter FROM task_submissions WHERE user_id = ?', (user_id,))
        for sub in cursor.fetchall():
            user_subs[(sub['specialty_slug'], sub['task_number'])] = dict(sub)

    tasks_out = []
    for t in raw_tasks:
        unlock_day = t.get('unlock_day', 1)
        is_locked = (unlock_day > current_day)
        sub_info = user_subs.get((t['specialty_slug'], t['task_number']))

        if is_locked:
            status = 'locked'
            score = 0
            grade_letter = '—'
        elif sub_info:
            status = sub_info['status']
            score = sub_info['score']
            grade_letter = sub_info['grade_letter']
        else:
            status = 'available'
            score = 0
            grade_letter = '—'

        t_data = dict(t)
        t_data['current_study_day'] = current_day
        t_data['is_locked'] = is_locked
        t_data['status'] = status
        t_data['student_score'] = score
        t_data['grade_letter'] = grade_letter
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
    unlock_day = task_dict.get('unlock_day', 1)

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

@app.route('/api/tasks/submit', methods=['POST'])
def submit_task():
    data = request.get_json() or {}
    user_id = data.get('user_id', 1)
    student_id = data.get('student_id', 'KZ-AMK-2026-98421')
    specialty_slug = data.get('specialty_slug', 'it')
    task_number = int(data.get('task_number', 1))
    task_title = data.get('task_title', f"Задание #{task_number}")
    score = int(data.get('score', 100))
    time_spent = int(data.get('time_spent_seconds', 0))
    submitted_code = data.get('submitted_code', '')
    student_name = data.get('student_name', 'Константин Воронов')
    group_name = data.get('group_name', 'ИС-21')

    current_day = get_current_day()

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT id, title, unlock_day, unlock_date_text FROM tasks WHERE specialty_slug = ? AND task_number = ?', (specialty_slug, task_number))
    task = cursor.fetchone()

    if task:
        task_id = task['id']
        task_title = task['title']
        unlock_day = task['unlock_day']

        if unlock_day > current_day:
            return jsonify({
                "success": False,
                "error": f"Нельзя сдать заблокированное задание! Оно откроется согласно графику: {task['unlock_date_text']} (День {unlock_day}).",
                "is_locked": True
            }), 403
    else:
        task_id = task_number

    if score >= 90:
        grade_letter = "A"
        status = "Проверено (Отлично)"
    elif score >= 75:
        grade_letter = "B"
        status = "Проверено (Хорошо)"
    elif score >= 60:
        grade_letter = "C"
        status = "Проверено (Удовл.)"
    else:
        grade_letter = "F"
        status = "Требует доработки"

    cursor.execute("""
    INSERT INTO task_submissions (
        user_id, student_id, student_name, group_name, task_id, specialty_slug,
        task_number, task_title, score, grade_letter, status, time_spent_seconds, submitted_code
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, student_id, student_name, group_name, task_id, specialty_slug,
          task_number, task_title, score, grade_letter, status, time_spent, submitted_code))

    spec_names = {
        'it': 'Программное обеспечение',
        'design': 'Дизайн и UI/UX',
        'accounting': 'Учет и аудит',
        'auto': 'Автодиагностика',
        'marketing': 'Маркетинг и коммерция'
    }
    spec_name = spec_names.get(specialty_slug, specialty_slug.upper())

    cursor.execute("""
    INSERT INTO grades (user_id, student_id, specialty_slug, specialty_name, score, status)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, student_id, specialty_slug, spec_name, score, status))

    conn.commit()

    return jsonify({
        "success": True,
        "message": f"Работа успешно отправлена и проверена! Получено {score}/100 баллов ({grade_letter}).",
        "result": {
            "score": score,
            "grade_letter": grade_letter,
            "status": status,
            "task_title": task_title,
            "submission_id": cursor.lastrowid
        }
    })

# ==========================================
# DEMO MODE RESET & STATUS
# ==========================================

@app.route('/api/demo/status', methods=['GET'])
def get_demo_status():
    current_day = get_current_day()
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT id FROM users WHERE email IN ('voronov@student.amk.kz', 'student@amk.kz') LIMIT 1;")
    user = c.fetchone()
    user_id = user['id'] if user else 1

    c.execute("SELECT COUNT(*) as cnt, AVG(score) as avg_sc FROM task_submissions WHERE user_id = ?;", (user_id,))
    res = c.fetchone()
    completed_count = res['cnt'] or 0
    avg_score = round(res['avg_sc'] or 0.0, 1)

    progress_percent = min(100, int((completed_count / 10.0) * 100))

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
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT id FROM users WHERE email IN ('voronov@student.amk.kz', 'student@amk.kz');")
    users = c.fetchall()
    uids = [u['id'] for u in users] or [1, 2]

    placeholders = ','.join('?' for _ in uids)
    c.execute(f"DELETE FROM task_submissions WHERE user_id IN ({placeholders});", uids)
    c.execute(f"DELETE FROM grades WHERE user_id IN ({placeholders});", uids)

    c.execute("INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('current_study_day', '1');")

    conn.commit()

    return jsonify({
        "success": True,
        "message": "Демоверсия успешно сброшена! Обучение начинается с абсолютного нуля: 0% прогресса, открыто только Задание №1.",
        "status": {
            "progress_percent": 0,
            "completed_count": 0,
            "current_study_day": 1
        }
    })

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
        "message": f"График обучения переключен на День {target_day}. Разблокированы задания до Дня {target_day} включительно.",
        "current_study_day": target_day
    })

# ==========================================
# TEACHER API
# ==========================================

@app.route('/api/teacher/journal', methods=['GET'])
def get_teacher_journal():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.id, s.user_id, s.student_name, s.group_name, s.specialty_slug,
           s.task_title, s.score, s.grade_letter, s.status, s.created_at, s.teacher_comment
    FROM task_submissions s
    ORDER BY s.created_at DESC
    """)
    submissions = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        "success": True,
        "count": len(submissions),
        "journal": submissions
    })

@app.route('/api/teacher/submissions', methods=['GET'])
def get_teacher_submissions():
    return get_teacher_journal()

@app.route('/api/teacher/grade_submission', methods=['POST'])
def grade_submission():
    data = request.get_json() or {}
    sub_id = data.get('submission_id')
    grade = int(data.get('grade', 95))
    feedback = data.get('feedback', 'Работа проверена преподавателем.')

    if not sub_id:
        return jsonify({"success": False, "message": "ID работы не указан"}), 400

    grade_letter = "A" if grade >= 90 else ("B" if grade >= 75 else ("C" if grade >= 60 else "F"))
    status = f"Проверено ({grade}/100)"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE task_submissions
    SET score = ?, grade_letter = ?, status = ?, teacher_comment = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (grade, grade_letter, status, feedback, sub_id))
    conn.commit()

    return jsonify({
        "success": True,
        "message": f"Оценка {grade} утверждена преподавателем!"
    })

@app.route('/api/teacher/stats', methods=['GET'])
def get_teacher_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM task_submissions')
    total_submissions = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT id) FROM users WHERE role = 'student'")
    total_students = cursor.fetchone()[0]

    cursor.execute('SELECT AVG(score) FROM task_submissions')
    avg_score = cursor.fetchone()[0] or 0.0

    return jsonify({
        "success": True,
        "stats": {
            "total_students": total_students,
            "total_submissions": total_submissions,
            "average_score": round(avg_score, 1),
            "current_study_day": get_current_day()
        }
    })

@app.route('/api/grades/save', methods=['POST'])
def save_grade():
    return submit_task()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "EDU SPACE Platform",
        "institution": "Алматинский многопрофильный колледж (АМК)",
        "database": "SQLite3 (50 tasks catalog loaded)",
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
    print(f"EDU SPACE Server started at http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
