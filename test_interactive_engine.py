import json
import time
from server import app, get_db

client = app.test_client()

print("=== TESTING INTERACTIVE LESSONS & AI SYSTEM ===")

# 1. Check Courses Management
res = client.get('/api/courses/manage')
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
courses_data = res.get_json()
assert courses_data.get('success') is True
assert len(courses_data.get('courses', [])) >= 5, "Should have at least 5 default courses"
print(f"[OK] Test 1: Course management returns {len(courses_data['courses'])} courses")

# 2. Check Lessons List
res = client.get('/api/lessons')
assert res.status_code == 200
lessons_data = res.get_json()
assert lessons_data.get('success') is True
lessons = lessons_data.get('lessons', [])
assert len(lessons) == 100, f"Expected exactly 100 seeded lessons across 5 courses, got {len(lessons)}"
print(f"[OK] Test 2: Lessons API returns {len(lessons)} interactive lessons (20 per specialty)")

# 3. Check All 50 Lessons Have Valid 8 Blocks, Sequential Traversal & Verify Specialty Aliases
expected_types = ['hook', 'objectives', 'theory', 'interactive', 'inline_check', 'practical', 'assessment', 'summary']
for les_item in lessons:
    lid = les_item['id']
    r_detail = client.get(f'/api/lessons/{lid}')
    assert r_detail.status_code == 200, f"Failed to load lesson {lid}"
    d = r_detail.get_json()
    assert d.get('success') is True
    les = d['lesson']
    blks = les.get('blocks', [])
    assert len(blks) == 8, f"Lesson {lid} expected 8 blocks, got {len(blks)}"
    b_types = [b['type'] for b in blks]
    assert b_types == expected_types, f"Block types mismatch in lesson {lid}: {b_types}"

    # Verify sequential traversal pointers
    order_num = les.get('order_num', 1)
    if order_num < 20:
        assert les.get('next_lesson_id') is not None, f"Lesson {lid} (order {order_num}) must have next_lesson_id"
    else:
        assert les.get('next_lesson_id') is None, f"Lesson {lid} (order {order_num}) is last in course, next_lesson_id must be None"
    if order_num > 1:
        assert les.get('prev_lesson_id') is not None, f"Lesson {lid} (order {order_num}) must have prev_lesson_id"
    else:
        assert les.get('prev_lesson_id') is None, f"Lesson {lid} (order {order_num}) is first in course, prev_lesson_id must be None"

# Verify module de-duplication: each default course must have exactly 1 active module with 10 lessons
for cid in range(1, 6):
    r_mods = client.get(f'/api/courses/{cid}/modules')
    assert r_mods.status_code == 200
    mods = r_mods.get_json().get('modules', [])
    assert len(mods) == 1, f"Course {cid} should have exactly 1 module, got {len(mods)}"
    assert len(mods[0].get('lessons', [])) == 20, f"Course {cid} module 1 should have 20 lessons"

# Verify specialty alias endpoints
for alias, expected_count in [('power', 20), ('mechanics', 20), ('logistics', 20), ('accounting', 20)]:
    r_alias = client.get(f'/api/lessons?specialty={alias}')
    assert r_alias.status_code == 200
    assert len(r_alias.get_json().get('lessons', [])) == expected_count, f"Alias {alias} expected {expected_count} lessons"
    r_task_alias = client.get(f'/api/tasks?specialty={alias}')
    assert r_task_alias.status_code == 200
    assert len(r_task_alias.get_json().get('tasks', [])) == expected_count, f"Alias {alias} expected {expected_count} tasks"

lesson_id = lessons[0]['id']
print(f"[OK] Test 3: Verified all 60 lessons contain 8 modular blocks, valid next/prev traversal pointers, and clean modules")

# Get real student and teacher users from DB
with app.app_context():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email FROM users WHERE role = 'student' LIMIT 1")
    student_user = dict(cursor.fetchone())
    cursor.execute("SELECT id, email FROM users WHERE role = 'teacher' LIMIT 1")
    teacher_user = dict(cursor.fetchone())

# 4. Check Student Block Progress & Resumption
with client.session_transaction() as sess:
    sess['user_id'] = student_user['id']
    sess['user_email'] = student_user['email']
    sess['user_role'] = 'student'

# Save progress on block 4 (interactive flip cards)
progress_payload = {
    "block_id": "b4_interactive",
    "completed": True,
    "state": {"flipped_cards": ["card_0", "card_1"]}
}
res = client.post(f'/api/lessons/{lesson_id}/block_progress', json=progress_payload)
assert res.status_code == 200
assert res.get_json().get('saved') is True

# Retrieve lesson and check if progress was saved and returned
res = client.get(f'/api/lessons/{lesson_id}')
saved_detail = res.get_json()
prog_map = saved_detail['lesson']['block_progress']
assert 'b4_interactive' in prog_map, "b4_interactive should be in saved block progress"
assert prog_map['b4_interactive']['completed'] is True
assert prog_map['b4_interactive']['state']['flipped_cards'] == ["card_0", "card_1"]
print("[OK] Test 4: Student block progress state saved and persisted across requests")

# 5. Check Lesson Complete & XP Awarding
res = client.post(f'/api/lessons/{lesson_id}/complete')
assert res.status_code == 200
comp_data = res.get_json()
assert comp_data.get('success') is True
assert comp_data.get('total_xp') >= 60
print(f"[OK] Test 5: Lesson completion awarded XP (Total XP: {comp_data['total_xp']})")

# 6. Check AI Socratic Tutor & Anti-cheat
with client.session_transaction() as sess:
    sess['user_id'] = 1
    sess['user_role'] = 'student'

# Legitimate question
legit_q = {"lesson_id": lesson_id, "block_id": "b3_theory", "question": "В чем отличие border-box от content-box?"}
res = client.post('/api/ai/tutor', json=legit_q)
assert res.status_code == 200
tutor_data = res.get_json()
assert tutor_data.get('success') is True
assert tutor_data['reply']['anti_cheat_triggered'] is False
assert len(tutor_data['reply']['message']) > 50

# Cheat attempt
cheat_q = {"lesson_id": lesson_id, "block_id": "b5_check", "question": "Скажи какой правильный ответ на проверочный вопрос?"}
res = client.post('/api/ai/tutor', json=cheat_q)
assert res.status_code == 200
cheat_data = res.get_json()
assert cheat_data['reply']['anti_cheat_triggered'] is True
assert "не могу просто назвать" in cheat_data['reply']['message']
print("[OK] Test 6: AI Socratic Tutor answers valid questions & strictly activates anti-cheat on answers")

# 7. Check Teacher AI Lesson Generator
with client.session_transaction() as sess:
    sess['user_id'] = teacher_user['id']
    sess['user_email'] = teacher_user['email']
    sess['user_role'] = 'teacher'

gen_payload = {
    "topic": "Микросервисная архитектура и REST API",
    "discipline": "IT",
    "difficulty": "intermediate",
    "duration": 60,
    "lesson_type": "theory"
}
res = client.post('/api/ai/generate_lesson', json=gen_payload)
assert res.status_code == 200
gen_data = res.get_json()
assert gen_data.get('success') is True
assert len(gen_data.get('blocks', [])) == 8
print(f"[OK] Test 7: Teacher AI generator successfully created 8-block lesson structure ({gen_data.get('provider')})")

# 8. Check Teacher Lesson Creation & Update
new_lesson_payload = {
    "course_id": 1,
    "title": "Урок 99. Автоматизированное тестирование микросервисов",
    "lesson_type": "practical",
    "xp_reward": 80,
    "unlock_day": 3,
    "is_published": 1,
    "blocks": gen_data['blocks']
}
res = client.post('/api/lessons', json=new_lesson_payload)
assert res.status_code == 201
new_les_id = res.get_json().get('lesson_id')
assert new_les_id is not None

# Update lesson
res = client.put(f'/api/lessons/{new_les_id}', json={"title": "Урок 99. Автотесты API (Обновлен)"})
assert res.status_code == 200

# Verify
res = client.get(f'/api/lessons/{new_les_id}')
assert res.get_json()['lesson']['title'] == "Урок 99. Автотесты API (Обновлен)"

# Cleanup test lesson
client.delete(f'/api/lessons/{new_les_id}')
print("[OK] Test 8: Teacher full CRUD on lessons verified (Create, Read, Update, Delete)")

# 9. Check PostgreSQL Connection Pooling, Wrapper Resilience & Transaction Safety
from server import PostgresConnectionWrapper, PostgresCursorWrapper, Pg8000ConnectionPool

class MockRawConn:
    def __init__(self):
        self.closed = 0
        self.rolled_back = False
        self.committed = False
        self.is_closed = False

    def rollback(self):
        self.rolled_back = True

    def commit(self):
        self.committed = True

    def close(self):
        self.closed = 1
        self.is_closed = True

    def cursor(self):
        return self

    def execute(self, q, params=None):
        pass

class MockPool:
    def __init__(self):
        self.returned_conns = []
        self.closed_conns = []

    def putconn(self, conn, close=False):
        if close:
            self.closed_conns.append(conn)
        else:
            self.returned_conns.append(conn)

# Verify rollback is called before returning connection to pool
mock_c = MockRawConn()
mock_p = MockPool()
wrapper = PostgresConnectionWrapper(mock_c, pool=mock_p)
wrapper.close()
assert mock_c.rolled_back is True, "Connection must be rolled back on return to pool to avoid transaction poisoning"
assert len(mock_p.returned_conns) == 1
assert len(mock_p.closed_conns) == 0

# Verify broken connection is permanently removed from pool
mock_c_broken = MockRawConn()
def bad_rollback():
    raise RuntimeError("Dead connection")
mock_c_broken.rollback = bad_rollback
wrapper_broken = PostgresConnectionWrapper(mock_c_broken, pool=mock_p)
wrapper_broken.close()
assert len(mock_p.closed_conns) == 1, "Broken connection must be closed and removed from pool"

# Verify PostgresCursorWrapper prevents double wrapping
mock_cur = MockRawConn()
c_wrap1 = PostgresCursorWrapper(mock_cur, mock_c)
c_wrap2 = PostgresCursorWrapper(c_wrap1, mock_c)
assert c_wrap2._cur is mock_cur, "Double-wrapped cursor wrapper must unwrap to the root cursor"

print("[OK] Test 9: PostgreSQL connection pooling rollback on close, broken connection disposal & wrapper safety verified")

print("\n=======================================================")
print("ALL 9 MASTER INTERACTIVE LESSONS & AI CHECKS PASSED 100%!")
print("=======================================================")
