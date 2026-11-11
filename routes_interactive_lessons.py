"""
EduSpace Blueprint: Interactive Lessons, Course Management & AI Tutoring
Integrates modular 8-block lesson system, state persistence, teacher visual builder APIs, and safe AI.
"""
from flask import Blueprint, request, jsonify, session, send_file
import json
import time
import os

from eduspace_ai import generate_lesson_content, student_socratic_tutor, review_submission_ai

interactive_lessons_bp = Blueprint('interactive_lessons', __name__)

def _get_db():
    import server
    return server.get_db()

def _get_current_user():
    import server
    return server.get_current_user()

def _award_xp(conn, user_id, amount, source_type, source_id, description):
    import server
    return server.award_xp(conn, user_id, amount, source_type, source_id, description)

def _check_achievements(conn, user_id):
    import server
    return server.check_and_unlock_achievements(conn, user_id)

def _log_audit(conn, actor_id, actor_email, actor_role, action, target_type, target_id, details=""):
    import server
    return server.log_audit_event(conn, actor_id, actor_email, actor_role, action, target_type, target_id, details)

# ==========================================
# 1. COURSES & MODULES MANAGEMENT
# ==========================================

@interactive_lessons_bp.route('/api/courses/manage', methods=['GET'])
def list_managed_courses():
    """Returns complete course catalog with modules and lesson counts."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT c.id, c.slug, c.title, c.code, c.description, c.is_published, c.created_at,
           COUNT(DISTINCT m.id) AS module_count,
           COUNT(DISTINCT l.id) AS lesson_count
    FROM courses c
    LEFT JOIN course_modules m ON m.course_id = c.id
    LEFT JOIN lessons l ON l.course_id = c.id
    GROUP BY c.id
    ORDER BY c.id ASC
    """)
    courses = [dict(r) for r in cursor.fetchall()]
    return jsonify({"success": True, "courses": courses})

@interactive_lessons_bp.route('/api/courses', methods=['POST'])
def create_course():
    """Teacher/Admin endpoint to create a new course."""
    user = _get_current_user()
    if not user or user.get('role') not in ('teacher', 'admin'):
        return jsonify({"success": False, "message": "Доступ разрешён только преподавателям и администраторам", "code": "FORBIDDEN"}), 403

    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    slug = (data.get('slug') or '').strip().lower()
    code = (data.get('code') or '').strip()
    description = (data.get('description') or '').strip()

    if not title:
        return jsonify({"success": False, "message": "Укажите название курса"}), 400
    if not slug:
        slug = f"course_{int(time.time())}"

    conn = _get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO courses (slug, title, code, description, curator_id, is_published)
        VALUES (?, ?, ?, ?, ?, 1)
        """, (slug, title, code, description, user['id']))
        course_id = cursor.lastrowid
        
        # Create default module 1
        cursor.execute("""
        INSERT INTO course_modules (course_id, title, order_num, is_published)
        VALUES (?, 'Модуль 1. Фундаментальные основы', 1, 1)
        """, (course_id,))
        conn.commit()
        _log_audit(conn, user['id'], user['email'], user['role'], 'COURSE_CREATE', 'course', str(course_id), f"Создан курс {title}")
        return jsonify({"success": True, "message": "Курс успешно создан", "course_id": course_id, "slug": slug}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"Ошибка создания курса: {e}"}), 400

@interactive_lessons_bp.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    """Teacher/Admin endpoint to update course details."""
    user = _get_current_user()
    if not user or user.get('role') not in ('teacher', 'admin'):
        return jsonify({"success": False, "message": "Доступ запрещён", "code": "FORBIDDEN"}), 403

    data = request.get_json() or {}
    title = data.get('title')
    code = data.get('code')
    description = data.get('description')
    is_published = data.get('is_published', 1)

    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE courses SET
        title = COALESCE(?, title),
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        is_published = COALESCE(?, is_published)
    WHERE id = ?
    """, (title, code, description, is_published, course_id))
    conn.commit()
    return jsonify({"success": True, "message": "Курс обновлен"})

@interactive_lessons_bp.route('/api/courses/<int:course_id>/modules', methods=['GET'])
def get_course_modules(course_id):
    """Returns all modules and their contained lessons for a course."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, title, order_num, is_published, created_at
    FROM course_modules
    WHERE course_id = ?
    ORDER BY order_num ASC, id ASC
    """, (course_id,))
    modules = [dict(r) for r in cursor.fetchall()]

    for mod in modules:
        cursor.execute("""
        SELECT id, title, lesson_type, order_num, xp_reward, unlock_day, is_published
        FROM lessons
        WHERE module_id = ?
        ORDER BY order_num ASC, id ASC
        """, (mod['id'],))
        mod['lessons'] = [dict(r) for r in cursor.fetchall()]

    return jsonify({"success": True, "modules": modules})

@interactive_lessons_bp.route('/api/courses/<int:course_id>/modules', methods=['POST'])
def create_course_module(course_id):
    """Teacher/Admin endpoint to add a module to a course."""
    user = _get_current_user()
    if not user or user.get('role') not in ('teacher', 'admin'):
        return jsonify({"success": False, "message": "Доступ запрещён", "code": "FORBIDDEN"}), 403

    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    order_num = data.get('order_num', 1)
    if not title:
        return jsonify({"success": False, "message": "Укажите название модуля"}), 400

    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO course_modules (course_id, title, order_num, is_published)
    VALUES (?, ?, ?, 1)
    """, (course_id, title, order_num))
    module_id = cursor.lastrowid
    conn.commit()
    return jsonify({"success": True, "message": "Модуль создан", "module_id": module_id}), 201

# ==========================================
# 2. LESSONS CRUD & 8-BLOCK ENGINE
# ==========================================

SPECIALTY_ALIASES = {
    'logistics': 'graphic_design',
    'accounting': 'hvac',
    'power': 'autoelectric',
    'mechanics': 'automechanic',
    'design': 'graphic_design',
    'auto': 'autoelectric',
    'marketing': 'automechanic'
}

@interactive_lessons_bp.route('/api/lessons', methods=['GET'])
def list_lessons():
    """Lists lessons filtered by course_id, module_id, or specialty slug."""
    course_id = request.args.get('course_id', type=int)
    module_id = request.args.get('module_id', type=int)
    slug = request.args.get('specialty_slug') or request.args.get('specialty')

    conn = _get_db()
    cursor = conn.cursor()

    if slug and not course_id:
        norm_slug = SPECIALTY_ALIASES.get(slug.lower().strip(), slug.lower().strip())
        cursor.execute("SELECT id FROM courses WHERE slug = ? OR slug = ?", (norm_slug, slug))
        row = cursor.fetchone()
        if row:
            course_id = row['id']

    query = """
    SELECT l.id, l.course_id, l.module_id, l.title, l.lesson_type, l.order_num,
           l.xp_reward, l.unlock_day, l.is_published, c.title AS course_title, c.slug AS course_slug
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    WHERE 1=1
    """
    params = []
    if course_id:
        query += " AND l.course_id = ?"
        params.append(course_id)
    if module_id:
        query += " AND l.module_id = ?"
        params.append(module_id)

    query += " ORDER BY l.order_num ASC, l.id ASC"
    cursor.execute(query, tuple(params))
    lessons = [dict(r) for r in cursor.fetchall()]

    # If student is logged in, attach completion flag and drip-feed unlock status
    import server
    user = _get_current_user()
    current_day = server.get_current_day(user['id'] if user else None)
    completed_ids = set()
    if user:
        cursor.execute("""
        SELECT DISTINCT lesson_id FROM lesson_block_progress
        WHERE user_id = ? AND block_id = 'b8_summary' AND completed = 1
        """, (user['id'],))
        completed_ids = {r[0] for r in cursor.fetchall()}

    for les in lessons:
        unlock_day = int(les.get('unlock_day') or les.get('order_num') or 1)
        les['unlock_day'] = unlock_day
        les['current_study_day'] = current_day
        les['is_locked'] = bool(unlock_day > current_day)
        if user:
            les['is_completed'] = les['id'] in completed_ids

    return jsonify({"success": True, "current_study_day": current_day, "lessons": lessons})

@interactive_lessons_bp.route('/api/lessons/<int:lesson_id>', methods=['GET'])
def get_lesson_detail(lesson_id):
    """
    Returns full lesson details including the 8 modular blocks,
    and if user is authenticated, their saved block progress map.
    """
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT l.id, l.course_id, l.module_id, l.title, l.lesson_type, l.order_num,
           l.xp_reward, l.unlock_day, l.is_published, l.content_json,
           c.title AS course_title, c.slug AS course_slug,
           m.title AS module_title
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    LEFT JOIN course_modules m ON m.id = l.module_id
    WHERE l.id = ?
    """, (lesson_id,))
    row = cursor.fetchone()
    if not row:
        return jsonify({"success": False, "message": "Урок не найден"}), 404

    lesson = dict(row)
    try:
        lesson['blocks'] = json.loads(lesson['content_json'] or '[]')
    except Exception:
        lesson['blocks'] = []

    # Student Block Progression Map
    user = _get_current_user()
    block_progress = {}
    is_completed = False
    if user:
        cursor.execute("""
        SELECT block_id, completed, state_json
        FROM lesson_block_progress
        WHERE user_id = ? AND lesson_id = ?
        """, (user['id'], lesson_id))
        for r in cursor.fetchall():
            try:
                state = json.loads(r['state_json'] or '{}')
            except Exception:
                state = {}
            block_progress[r['block_id']] = {
                "completed": bool(r['completed']),
                "state": state
            }
        is_completed = block_progress.get('b8_summary', {}).get('completed', False)

    # Compute adjacent lesson navigation within the same course
    cursor.execute("""
    SELECT id, order_num FROM lessons
    WHERE course_id = ? AND is_published = 1
    ORDER BY order_num ASC, id ASC
    """, (lesson['course_id'],))
    sibling_lessons = cursor.fetchall()
    next_lesson_id = None
    prev_lesson_id = None
    for idx, s in enumerate(sibling_lessons):
        if s['id'] == lesson_id:
            if idx > 0:
                prev_lesson_id = sibling_lessons[idx - 1]['id']
            if idx < len(sibling_lessons) - 1:
                next_lesson_id = sibling_lessons[idx + 1]['id']
            break

    lesson['next_lesson_id'] = next_lesson_id
    lesson['prev_lesson_id'] = prev_lesson_id
    lesson['block_progress'] = block_progress
    lesson['is_completed'] = is_completed
    import server
    current_day = server.get_current_day(user['id'] if user else None)
    unlock_day = int(lesson.get('unlock_day') or lesson.get('order_num') or 1)
    lesson['unlock_day'] = unlock_day
    lesson['current_study_day'] = current_day
    lesson['is_locked'] = bool(unlock_day > current_day)
    return jsonify({"success": True, "lesson": lesson})

@interactive_lessons_bp.route('/api/lessons', methods=['POST'])
def create_lesson():
    """Teacher/Admin endpoint to create a lesson with 8 blocks."""
    user = _get_current_user()
    if not user or user.get('role') not in ('teacher', 'admin'):
        return jsonify({"success": False, "message": "Доступ запрещён", "code": "FORBIDDEN"}), 403

    data = request.get_json() or {}
    course_id = data.get('course_id')
    module_id = data.get('module_id')
    title = (data.get('title') or '').strip()
    lesson_type = data.get('lesson_type', 'theory')
    order_num = data.get('order_num', 1)
    xp_reward = data.get('xp_reward', 60)
    unlock_day = data.get('unlock_day', 1)
    is_published = data.get('is_published', 1)
    blocks = data.get('blocks') or []

    if not title or not course_id:
        return jsonify({"success": False, "message": "Укажите название и ID курса"}), 400

    content_json = json.dumps(blocks, ensure_ascii=False)
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO lessons (course_id, module_id, title, lesson_type, order_num, xp_reward, unlock_day, is_published, content_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (course_id, module_id, title, lesson_type, order_num, xp_reward, unlock_day, is_published, content_json))
    lesson_id = cursor.lastrowid
    conn.commit()
    _log_audit(conn, user['id'], user['email'], user['role'], 'LESSON_CREATE', 'lesson', str(lesson_id), f"Создан урок {title}")
    return jsonify({"success": True, "message": "Урок успешно создан", "lesson_id": lesson_id}), 201

@interactive_lessons_bp.route('/api/lessons/<int:lesson_id>', methods=['PUT'])
def update_lesson(lesson_id):
    """Teacher/Admin endpoint to update lesson structure and blocks."""
    user = _get_current_user()
    if not user or user.get('role') not in ('teacher', 'admin'):
        return jsonify({"success": False, "message": "Доступ запрещён", "code": "FORBIDDEN"}), 403

    data = request.get_json() or {}
    title = data.get('title')
    lesson_type = data.get('lesson_type')
    order_num = data.get('order_num')
    xp_reward = data.get('xp_reward')
    unlock_day = data.get('unlock_day')
    is_published = data.get('is_published')
    blocks = data.get('blocks')

    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM lessons WHERE id = ?", (lesson_id,))
    if not cursor.fetchone():
        return jsonify({"success": False, "message": "Урок не найден"}), 404

    updates = []
    params = []
    if title is not None:
        updates.append("title = ?")
        params.append(title)
    if lesson_type is not None:
        updates.append("lesson_type = ?")
        params.append(lesson_type)
    if order_num is not None:
        updates.append("order_num = ?")
        params.append(order_num)
    if xp_reward is not None:
        updates.append("xp_reward = ?")
        params.append(xp_reward)
    if unlock_day is not None:
        updates.append("unlock_day = ?")
        params.append(unlock_day)
    if is_published is not None:
        updates.append("is_published = ?")
        params.append(is_published)
    if blocks is not None:
        updates.append("content_json = ?")
        params.append(json.dumps(blocks, ensure_ascii=False))

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        query = f"UPDATE lessons SET {', '.join(updates)} WHERE id = ?"
        params.append(lesson_id)
        cursor.execute(query, tuple(params))
        conn.commit()

    _log_audit(conn, user['id'], user['email'], user['role'], 'LESSON_UPDATE', 'lesson', str(lesson_id), "Обновлены блоки урока")
    return jsonify({"success": True, "message": "Урок сохранён"})

@interactive_lessons_bp.route('/api/lessons/<int:lesson_id>', methods=['DELETE'])
def delete_lesson(lesson_id):
    """Teacher/Admin endpoint to delete a lesson."""
    user = _get_current_user()
    if not user or user.get('role') not in ('teacher', 'admin'):
        return jsonify({"success": False, "message": "Доступ запрещён", "code": "FORBIDDEN"}), 403

    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM lessons WHERE id = ?", (lesson_id,))
    cursor.execute("DELETE FROM lesson_block_progress WHERE lesson_id = ?", (lesson_id,))
    conn.commit()
    _log_audit(conn, user['id'], user['email'], user['role'], 'LESSON_DELETE', 'lesson', str(lesson_id), "Урок удален")
    return jsonify({"success": True, "message": "Урок удалён"})

# ==========================================
# 3. STUDENT INTERACTION & PROGRESS SAVING
# ==========================================

@interactive_lessons_bp.route('/api/academy/progress', methods=['GET', 'POST'])
def academy_progress():
    user = _get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Войдите для синхронизации прогресса.'}), 401
    conn = _get_db()
    cursor = conn.cursor()
    if request.method == 'GET':
        import server
        current_day = server.get_current_day(user['id'])
        cursor.execute("""
            SELECT c.slug, l.order_num
            FROM lesson_block_progress p
            JOIN lessons l ON l.id = p.lesson_id
            JOIN courses c ON c.id = l.course_id
            WHERE p.user_id = ? AND p.block_id = 'academy_reading' AND p.completed = 1
        """, (user['id'],))
        return jsonify({
            'success': True,
            'completed': [f"{row['slug']}:{row['order_num']}" for row in cursor.fetchall()],
            'current_study_day': current_day
        })
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'success': False, 'message': 'Укажите урок.'}), 400
    specialty, number = data.get('specialty'), data.get('lesson')
    if specialty not in ('it', 'graphic_design', 'autoelectric', 'hvac', 'automechanic') or type(number) is not int or not 1 <= number <= 12:
        return jsonify({'success': False, 'message': 'Укажите урок из учебника.'}), 400
    cursor.execute("""
        SELECT l.id FROM lessons l JOIN courses c ON c.id = l.course_id
        WHERE c.slug = ? AND l.order_num = ? AND l.is_published = 1
        ORDER BY l.id LIMIT 1
    """, (specialty, number))
    row = cursor.fetchone()
    if not row:
        return jsonify({'success': False, 'message': 'Урок не найден.'}), 404
    cursor.execute("""
        INSERT INTO lesson_block_progress (user_id, lesson_id, block_id, completed, state_json)
        VALUES (?, ?, 'academy_reading', 1, '{}')
        ON CONFLICT(user_id, lesson_id, block_id) DO UPDATE SET completed = 1
    """, (user['id'], row['id']))
    conn.commit()
    return jsonify({'success': True})


@interactive_lessons_bp.route('/api/lessons/<int:lesson_id>/block_progress', methods=['POST'])
def save_block_progress(lesson_id):
    """
    Saves student interaction state and completion on a specific block.
    Enables instant resume on page reload.
    """
    user = _get_current_user()
    if not user:
        return jsonify({"success": False, "message": "Авторизуйтесь для сохранения прогресса", "code": "UNAUTHORIZED"}), 401

    data = request.get_json() or {}
    block_id = data.get('block_id')
    completed = 1 if data.get('completed', True) else 0
    state = data.get('state') or {}

    if not block_id:
        return jsonify({"success": False, "message": "Укажите block_id"}), 400

    conn = _get_db()
    cursor = conn.cursor()
    state_json = json.dumps(state, ensure_ascii=False)

    cursor.execute("""
    INSERT INTO lesson_block_progress (user_id, lesson_id, block_id, completed, state_json, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, lesson_id, block_id) DO UPDATE SET
        completed = excluded.completed,
        state_json = excluded.state_json,
        updated_at = CURRENT_TIMESTAMP
    """, (user['id'], lesson_id, block_id, completed, state_json))
    conn.commit()

    return jsonify({"success": True, "saved": True, "block_id": block_id})

@interactive_lessons_bp.route('/api/lessons/<int:lesson_id>/complete', methods=['POST'])
def complete_lesson(lesson_id):
    """
    Student finishes the lesson: marks summary complete, awards XP idempotently,
    unlocks achievements and updates streak.
    """
    user = _get_current_user()
    if not user:
        return jsonify({"success": False, "message": "Авторизуйтесь", "code": "UNAUTHORIZED"}), 401

    conn = _get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT l.id, l.title, l.xp_reward, l.course_id, l.order_num, c.slug AS course_slug
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    WHERE l.id = ?
    """, (lesson_id,))
    les_row = cursor.fetchone()
    if not les_row:
        return jsonify({"success": False, "message": "Урок не найден"}), 404

    xp_reward = les_row['xp_reward'] or 60
    course_slug = les_row['course_slug']
    order_num = les_row['order_num'] or 1

    # Mark b8_summary completed
    cursor.execute("""
    INSERT INTO lesson_block_progress (user_id, lesson_id, block_id, completed, state_json, updated_at)
    VALUES (?, ?, 'b8_summary', 1, '{\"status\": \"completed\"}', CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, lesson_id, block_id) DO UPDATE SET
        completed = 1,
        updated_at = CURRENT_TIMESTAMP
    """, (user['id'], lesson_id))

    # Also update legacy lesson_progress table for backwards compatibility
    cursor.execute("""
    INSERT INTO lesson_progress (user_id, specialty_slug, task_number, status, updated_at)
    VALUES (?, ?, ?, 'completed', CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, specialty_slug, task_number) DO UPDATE SET
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
    """, (user['id'], course_slug, order_num))
    conn.commit()

    # Idempotent XP Awarding
    source_id = f"lesson_{lesson_id}_complete"
    awarded, total_xp, level_info = _award_xp(
        conn, user['id'], xp_reward, 'interactive_lesson', source_id, f"Прохождение интерактивного урока «{les_row['title']}»"
    )

    # Check and unlock achievements
    new_achievements = _check_achievements(conn, user['id'])

    return jsonify({
        "success": True,
        "message": f"Поздравляем! Урок «{les_row['title']}» успешно пройден!",
        "xp_awarded": xp_reward if awarded else 0,
        "total_xp": total_xp,
        "level_info": level_info,
        "new_achievements": new_achievements
    })

# ==========================================
# 4. AI INTEGRATION ENDPOINTS
# ==========================================

@interactive_lessons_bp.route('/api/ai/generate_lesson', methods=['POST'])
def ai_generate_lesson():
    """
    Teacher tool: generates a structured 8-block lesson outline & content
    using Gemini, OpenAI, or deterministic pedagogical heuristic engine.
    """
    user = _get_current_user()
    if not user or user.get('role') not in ('teacher', 'admin'):
        return jsonify({"success": False, "message": "Доступ разрешён только преподавателям", "code": "FORBIDDEN"}), 403

    data = request.get_json() or {}
    topic = (data.get('topic') or '').strip()
    if not topic:
        return jsonify({"success": False, "message": "Укажите тему урока"}), 400

    discipline = data.get('discipline', 'Информационные технологии')
    difficulty = data.get('difficulty', 'beginner')
    duration = data.get('duration', 45)
    objectives = data.get('objectives', '')
    lesson_type = data.get('lesson_type', 'theory')

    result = generate_lesson_content(
        topic=topic,
        discipline=discipline,
        difficulty=difficulty,
        duration=duration,
        objectives=objectives,
        lesson_type=lesson_type
    )

    conn = _get_db()
    _log_audit(conn, user['id'], user['email'], user['role'], 'AI_GENERATE_LESSON', 'ai', '', f"Генерация урока по теме: {topic}")
    return jsonify({
        "success": True,
        "provider": result.get("provider", "heuristic"),
        "blocks": result.get("blocks", [])
    })

@interactive_lessons_bp.route('/api/ai/tutor', methods=['POST'])
def ai_student_tutor():
    """
    Student Socratic Tutor: answers questions about current lesson block.
    Enforces strict anti-cheat: declines direct test answers and guides with hints.
    """
    user = _get_current_user()
    if not user:
        return jsonify({"success": False, "message": "Авторизуйтесь для использования AI Тьютора", "code": "UNAUTHORIZED"}), 401

    data = request.get_json() or {}
    lesson_id = data.get('lesson_id')
    block_id = data.get('block_id', '')
    student_question = (data.get('question') or '').strip()
    history = data.get('history') or []

    if not student_question:
        return jsonify({"success": False, "message": "Задайте вопрос"}), 400

    conn = _get_db()
    cursor = conn.cursor()

    lesson_data = {"title": "Интерактивный урок"}
    current_block = {"title": "Материал урока", "type": "theory"}

    if lesson_id:
        cursor.execute("SELECT title, content_json FROM lessons WHERE id = ?", (lesson_id,))
        l_row = cursor.fetchone()
        if l_row:
            lesson_data["title"] = l_row["title"]
            try:
                blocks = json.loads(l_row["content_json"] or "[]")
                for b in blocks:
                    if b.get("id") == block_id:
                        current_block = b
                        break
            except Exception:
                pass

    tutor_reply = student_socratic_tutor(lesson_data, current_block, student_question, history)

    # Persist into ai_conversations table
    try:
        cursor.execute("""
        INSERT INTO ai_conversations (user_id, context_type, context_id, user_message, assistant_message)
        VALUES (?, 'lesson_tutor', ?, ?, ?)
        """, (user['id'], str(lesson_id or ''), student_question, tutor_reply.get("message", "")))
        conn.commit()
    except Exception as e:
        print(f"[WARN] Failed to log AI conversation: {e}")

    return jsonify({
        "success": True,
        "reply": tutor_reply
    })

@interactive_lessons_bp.route('/api/ai/review_submission', methods=['POST'])
def ai_review_submission():
    """Teacher grading assistant: preliminary rubric analysis."""
    user = _get_current_user()
    if not user or user.get('role') not in ('teacher', 'admin'):
        return jsonify({"success": False, "message": "Доступ разрешён только преподавателям", "code": "FORBIDDEN"}), 403

    data = request.get_json() or {}
    submission_id = data.get('submission_id')
    code_or_text = data.get('code') or ''

    conn = _get_db()
    cursor = conn.cursor()
    task_data = {"title": "Практическое задание", "max_score": 100}

    if submission_id:
        cursor.execute("""
        SELECT task_title, submitted_code, student_comment FROM task_submissions WHERE id = ?
        """, (submission_id,))
        s_row = cursor.fetchone()
        if s_row:
            task_data["title"] = s_row["task_title"]
            code_or_text = s_row["submitted_code"] or s_row["student_comment"] or code_or_text

    review = review_submission_ai({"submitted_code": code_or_text}, task_data)
    return jsonify({"success": True, "review": review})

# ==========================================
# 5. LESSON PLAYER PAGE ROUTE
# ==========================================

@interactive_lessons_bp.route('/lesson_player')
@interactive_lessons_bp.route('/lesson_player.html')
def serve_lesson_player():
    """Serves the standalone focused lesson player."""
    from server import APP_DIR
    path = os.path.join(APP_DIR, 'lesson_player.html')
    if os.path.exists(path):
        return send_file(path)
    return send_file(os.path.join(APP_DIR, 'simulator.html'))
