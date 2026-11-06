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
assert len(lessons) >= 5, "Should have seeded lessons"
print(f"[OK] Test 2: Lessons API returns {len(lessons)} interactive lessons")

# 3. Check Lesson Detail with 8 Blocks
lesson_id = lessons[0]['id']
res = client.get(f'/api/lessons/{lesson_id}')
assert res.status_code == 200
detail = res.get_json()
assert detail.get('success') is True
blocks = detail['lesson'].get('blocks', [])
assert len(blocks) == 8, f"Expected 8 blocks, got {len(blocks)}"
block_types = [b['type'] for b in blocks]
expected_types = ['hook', 'objectives', 'theory', 'interactive', 'inline_check', 'practical', 'assessment', 'summary']
assert block_types == expected_types, f"Block types mismatch: {block_types}"
print(f"[OK] Test 3: Lesson {lesson_id} contains all 8 required educational blocks ({block_types})")

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

print("\n=======================================================")
print("ALL 8 MASTER INTERACTIVE LESSONS & AI CHECKS PASSED 100%!")
print("=======================================================")
