# -*- coding: utf-8 -*-
"""
AMK Практикум — Серверная часть (Backend REST API)
Алматинский многопрофильный колледж (amk.edu.kz)
Стек: Python 3, Flask, SQLite3
"""

import os
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(APP_DIR, 'database.db')

app = Flask(__name__, static_folder=APP_DIR)
CORS(app)

# ========================================================
# БАЗА ДАННЫХ SQLITE3 (Инициализация и таблицы)
# ========================================================
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Таблица студентов
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        group_name TEXT NOT NULL,
        student_id TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Таблица результатов прохождения тренажеров
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        specialty_slug TEXT NOT NULL,
        specialty_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        status TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
    )
    ''')

    # Начальное наполнение учебных групп колледжа АМК
    cursor.execute('SELECT COUNT(*) FROM students')
    if cursor.fetchone()[0] == 0:
        seed_students = [
            ("Асылхан Бауыржанұлы", "ПО-22", "KZ-AMK-2026-98421", "student"),
            ("Данил Панин", "ПО-22", "KZ-AMK-2026-98422", "student"),
            ("Алина Сейдалиева", "ПО-22", "KZ-AMK-2026-98423", "student"),
            ("Нурсултан Кенес", "ПО-22", "KZ-AMK-2026-98424", "student"),
            ("Арман Исаев", "АВ-21", "KZ-AMK-2026-77101", "student"),
            ("Берик Садыков", "АВ-21", "KZ-AMK-2026-77102", "student"),
            ("Жанибек Оразов", "ХО-20", "KZ-AMK-2026-55201", "student"),
            ("Максим Волков", "ХО-20", "KZ-AMK-2026-55202", "student"),
            ("Преподаватель (Зав. отделением)", "Кафедра ТиПО", "TEACHER-AMK-01", "teacher")
        ]
        cursor.executemany(
            'INSERT INTO students (name, group_name, student_id, role) VALUES (?, ?, ?, ?)',
            seed_students
        )

        # Начальные оценки для демонстрации преподавателю
        seed_grades = [
            ("KZ-AMK-2026-98421", "it", "Программное обеспечение", 100, "Сдано на отлично"),
            ("KZ-AMK-2026-98421", "auto", "Автодиагностика ДВС", 100, "Сдано на отлично"),
            ("KZ-AMK-2026-98421", "cryo", "Холодильные установки", 100, "Сдано на отлично"),
            ("KZ-AMK-2026-98421", "design", "Графический дизайн", 100, "Сдано на отлично"),
            ("KZ-AMK-2026-98421", "furniture", "Раскрой мебели", 100, "Сдано на отлично"),

            ("KZ-AMK-2026-98422", "it", "Программное обеспечение", 95, "Сдано на отлично"),
            ("KZ-AMK-2026-98422", "auto", "Автодиагностика ДВС", 85, "Сдано хорошо"),
            ("KZ-AMK-2026-98422", "cryo", "Холодильные установки", 90, "Сдано на отлично"),

            ("KZ-AMK-2026-98423", "it", "Программное обеспечение", 80, "Сдано хорошо"),
            ("KZ-AMK-2026-98423", "design", "Графический дизайн", 95, "Сдано на отлично"),

            ("KZ-AMK-2026-77101", "auto", "Автодиагностика ДВС", 100, "Сдано на отлично"),
            ("KZ-AMK-2026-55201", "cryo", "Холодильные установки", 95, "Сдано на отлично")
        ]
        cursor.executemany(
            'INSERT INTO grades (student_id, specialty_slug, specialty_name, score, status) VALUES (?, ?, ?, ?, ?)',
            seed_grades
        )
        conn.commit()

    conn.close()

# ========================================================
# REST API МАРШРУТЫ
# ========================================================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "platform": "АМК Практикум (Алматинский многопрофильный колледж)",
        "version": "3.0.0",
        "database": "SQLite3 OK",
        "timestamp": datetime.now().isoformat()
    })

# 1. Авторизация (Студент / Преподаватель)
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    name = data.get('name', '').strip()

    conn = get_db()
    cursor = conn.cursor()

    if student_id:
        cursor.execute('SELECT * FROM students WHERE student_id = ?', (student_id,))
    elif name:
        cursor.execute('SELECT * FROM students WHERE name LIKE ?', (f'%{name}%',))
    else:
        # Default student
        cursor.execute('SELECT * FROM students WHERE student_id = ?', ('KZ-AMK-2026-98421',))

    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({
            "success": True,
            "user": {
                "name": user["name"],
                "group": user["group_name"],
                "student_id": user["student_id"],
                "role": user["role"]
            }
        })
    return jsonify({"success": False, "message": "Студент не найден в базе колледжа"}), 404

# 2. Получение электронного журнала для преподавателя
@app.route('/api/grades', methods=['GET'])
def get_grades():
    group_filter = request.args.get('group', 'all')
    conn = get_db()
    cursor = conn.cursor()

    query = '''
    SELECT 
        s.student_id,
        s.name,
        s.group_name,
        ROUND(AVG(g.score), 1) as avg_score,
        COUNT(g.id) as tests_passed,
        GROUP_CONCAT(g.specialty_slug || ':' || g.score) as details
    FROM students s
    LEFT JOIN grades g ON s.student_id = g.student_id
    WHERE s.role = 'student'
    '''

    params = []
    if group_filter != 'all':
        query += ' AND s.group_name = ?'
        params.append(group_filter)

    query += ' GROUP BY s.student_id ORDER BY avg_score DESC'

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append({
            "student_id": r["student_id"],
            "name": r["name"],
            "group": r["group_name"],
            "avg_score": r["avg_score"] or 0,
            "tests_passed": r["tests_passed"],
            "details": r["details"] or ""
        })

    return jsonify({"success": True, "students": result})

# 3. Сохранение оценки за прохождение тренажера
@app.route('/api/grades/save', methods=['POST'])
def save_grade():
    data = request.get_json() or {}
    student_id = data.get('student_id', 'KZ-AMK-2026-98421')
    specialty_slug = data.get('specialty_slug')
    specialty_name = data.get('specialty_name', specialty_slug)
    score = int(data.get('score', 0))

    if not specialty_slug:
        return jsonify({"success": False, "message": "Не указан тренажер"}), 400

    status = "Сдано на отлично" if score >= 90 else ("Сдано хорошо" if score >= 75 else "Требует доработки")

    conn = get_db()
    cursor = conn.cursor()

    # Проверка, сдавал ли студент ранее этот тренажер
    cursor.execute(
        'SELECT id FROM grades WHERE student_id = ? AND specialty_slug = ?',
        (student_id, specialty_slug)
    )
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            'UPDATE grades SET score = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            (score, status, existing["id"])
        )
    else:
        cursor.execute(
            'INSERT INTO grades (student_id, specialty_slug, specialty_name, score, status) VALUES (?, ?, ?, ?, ?)',
            (student_id, specialty_slug, specialty_name, score, status)
        )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Оценка {score} баллов сохранена в базе данных АМК",
        "status": status
    })

# 4. Список групп колледжа
@app.route('/api/groups', methods=['GET'])
def get_groups():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT group_name FROM students WHERE role = 'student'")
    groups = [r[0] for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "groups": groups})

# ========================================================
# МАРШРУТЫ ДЛЯ СТАТИКИ (HTML, CSS, JS)
# ========================================================
@app.route('/')
def serve_index():
    return send_from_directory(APP_DIR, 'index.html')

@app.route('/simulator')
@app.route('/simulator.html')
def serve_simulator():
    return send_from_directory(APP_DIR, 'simulator.html')

@app.route('/teacher')
@app.route('/teacher.html')
def serve_teacher():
    return send_from_directory(APP_DIR, 'teacher.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(APP_DIR, path)

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print(f"=======================================================")
    print(f"🚀 Сервер «АМК Практикум» успешно запущен!")
    print(f"🌐 Главная страница:        http://127.0.0.1:{port}/")
    print(f"💻 Интерактивные тренажеры: http://127.0.0.1:{port}/simulator.html")
    print(f"📊 Кабинет преподавателя:   http://127.0.0.1:{port}/teacher.html")
    print(f"🗄️ База данных:            {DB_PATH} (SQLite3)")
    print(f"=======================================================")
    app.run(host='0.0.0.0', port=port, debug=False)
