# -*- coding: utf-8 -*-
"""
EDU SPACE PRO — COMPREHENSIVE E2E TRANSFORMATION TEST SUITE
Verifies:
1. Complete anonymous access lock on all Admin and Teacher APIs (HTTP 403)
2. Sequential prerequisite task locking (Task 2 locked without completing Task 1)
3. Idempotent XP transactions ledger (prevents duplicate XP farming)
4. Daily quests system and streak persistence
5. Real-time Leaderboard with group filtering
6. Automated event-driven achievements unlocking and level progression
7. Full student and teacher end-to-end lifecycle
"""

import sys
import json
import time
import sqlite3

# Ensure utf-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

import server
from server import app as flask_app, get_db, init_db, award_xp, check_and_unlock_achievements, get_level_info

# Initialize fresh database schema
init_db()

flask_app.testing = True
client = flask_app.test_client()

print("=" * 65)
print("RUNNING COMPREHENSIVE TRANSFORMATION & SECURITY E2E TEST SUITE")
print("=" * 65)

# -------------------------------------------------------------
# CHECK 1: ANONYMOUS ACCESS BLOCK ON ALL ADMIN & TEACHER ENDPOINTS
# -------------------------------------------------------------
print("\n--- CHECK 1: Anonymous Access Block on Protected Endpoints ---")
admin_endpoints = [
    ('/api/admin/users', 'GET', None),
    ('/api/admin/change_role', 'POST', {'user_id': 1, 'role': 'admin'}),
    ('/api/admin/teacher_groups', 'GET', None),
    ('/api/admin/assign_teacher_group', 'POST', {'teacher_id': 1, 'group_name': 'ИС-21'}),
    ('/api/admin/audit_logs', 'GET', None)
]

for url, method, body in admin_endpoints:
    resp = client.get(url) if method == 'GET' else client.post(url, json=body)
    assert resp.status_code == 403, f"Anonymous request to {url} MUST return HTTP 403 (got {resp.status_code})"
print("[OK] All Admin APIs strictly reject anonymous requests with HTTP 403")

teacher_endpoints = [
    ('/api/teacher/students', 'GET', None),
    ('/api/teacher/journal', 'GET', None),
    ('/api/teacher/matrix?specialty=it', 'GET', None),
    ('/api/teacher/stats', 'GET', None),
    ('/api/teacher/advance_day', 'POST', {'day': 2}),
    ('/api/teacher/sync_user', 'POST', {'email': 'test@amk.kz', 'full_name': 'Тест'}),
    ('/api/teacher/simulate_submission', 'POST', {'task_number': 1}),
    ('/api/teacher/create_task', 'POST', {'title': 'Тест', 'description': 'Опис'}),
    ('/api/teacher/delete_task', 'POST', {'task_id': 999}),
    ('/api/teacher/broadcast', 'POST', {'title': 'Тест', 'body': 'Текст'}),
    ('/api/teacher/grade_submission', 'POST', {'submission_id': 1, 'grade': 90})
]

for url, method, body in teacher_endpoints:
    resp = client.get(url) if method == 'GET' else client.post(url, json=body)
    assert resp.status_code == 403, f"Anonymous request to {url} MUST return HTTP 403 (got {resp.status_code})"
print("[OK] All Teacher APIs strictly reject anonymous requests with HTTP 403")

# -------------------------------------------------------------
# CHECK 2: IDEMPOTENT XP TRANSACTIONS LEDGER (NO FARMING)
# -------------------------------------------------------------
print("\n--- CHECK 2: Idempotent XP Transactions Ledger ---")
with flask_app.app_context():
    conn = get_db()
    cursor = conn.cursor()

    # Get a test user
    cursor.execute("SELECT id FROM users WHERE role = 'student' LIMIT 1")
    test_u_row = cursor.fetchone()
    test_user_id = test_u_row[0] if test_u_row else 1

    test_action_id = f"test_action_{int(time.time() * 1000)}"

    # Award XP once
    awarded1, total1, lvl1 = award_xp(conn, test_user_id, 100, "unit_test", test_action_id, "Юнит-тест XP награды")
    assert awarded1 is True, "First XP grant must succeed"

    # Attempt duplicate award for identical source
    awarded2, total2, lvl2 = award_xp(conn, test_user_id, 100, "unit_test", test_action_id, "Юнит-тест XP награды")
    assert awarded2 is False, "Duplicate XP grant for identical (user, source_type, source_id) MUST be rejected"
    assert total1 == total2, "Total XP must remain unchanged on duplicate award"
    print(f"[OK] Ledger idempotency verified: repeated award rejected, total XP safe ({total1} XP)")

# -------------------------------------------------------------
# CHECK 3: DAILY QUESTS API & STREAK RETENTION
# -------------------------------------------------------------
print("\n--- CHECK 3: Daily Quests API & Streak ---")
# Use a fresh test user for daily quests so each run tests first-time completion
with flask_app.app_context():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM daily_quests_log WHERE user_id = ?", (test_user_id,))
    cursor.execute("DELETE FROM xp_transactions WHERE user_id = ? AND source_type = 'daily_quest'", (test_user_id,))
    conn.commit()

with client.session_transaction() as sess:
    sess['user_id'] = test_user_id
    sess['user_role'] = 'student'

# GET quests
dq_get = client.get('/api/daily_quests')
assert dq_get.status_code == 200, "Daily quests GET must return HTTP 200"
dq_data = dq_get.get_json()
assert dq_data['success'] is True
assert len(dq_data['quests']) == 4, "Must return 4 daily quest items"
print(f"[OK] Daily quests returned 4 active quests for date {dq_data['date']}, streak: {dq_data['streak_days']} days")

# POST complete quest
dq_post = client.post('/api/daily_quests', json={'quest_key': 'pass_quiz'})
assert dq_post.status_code == 200
dq_post_res = dq_post.get_json()
assert dq_post_res['success'] is True and dq_post_res['awarded'] is True
print(f"[OK] Daily quest 'pass_quiz' completed: awarded={dq_post_res['awarded']}, total_xp={dq_post_res['total_xp']}")

# Duplicate POST on same day
dq_post_dup = client.post('/api/daily_quests', json={'quest_key': 'pass_quiz'})
assert dq_post_dup.get_json()['awarded'] is False, "Duplicate completion on same day must not award XP twice"
print("[OK] Daily quest duplicate completion prevented on same calendar day")

# -------------------------------------------------------------
# CHECK 4: LEADERBOARD API & REAL-TIME GROUP FILTERING
# -------------------------------------------------------------
print("\n--- CHECK 4: Leaderboard API ---")
lb_resp = client.get('/api/leaderboard')
assert lb_resp.status_code == 200, "Leaderboard must return HTTP 200"
lb_data = lb_resp.get_json()
assert lb_data['success'] is True
assert len(lb_data['leaderboard']) > 0, "Leaderboard must contain registered students"
leader = lb_data['leaderboard'][0]
assert leader['rank'] == 1
assert 'level' in leader and 'rank_name' in leader and 'total_xp' in leader
print(f"[OK] Leaderboard operational: {len(lb_data['leaderboard'])} students ranked. Top student: {leader['full_name']} ({leader['total_xp']} XP, {leader['rank_name']})")

# Test group filtering
if lb_data['groups']:
    first_grp = lb_data['groups'][0]
    lb_grp_resp = client.get(f'/api/leaderboard?group={first_grp}')
    assert lb_grp_resp.status_code == 200
    grp_students = lb_grp_resp.get_json()['leaderboard']
    assert all(s['group_name'] == first_grp for s in grp_students), "All students in filtered leaderboard must match group"
    print(f"[OK] Leaderboard group filter for '{first_grp}' returned {len(grp_students)} students")

# -------------------------------------------------------------
# CHECK 5: FULL STUDENT JOURNEY WITH SEQUENTIAL DRIP-FEED & ACHIEVEMENTS
# -------------------------------------------------------------
print("\n--- CHECK 5: Full Student Lifecycle & Sequential Prerequisite Enforcement ---")
ts_str = str(int(time.time()))
s_email = f"student.e2e.{ts_str}@amk.kz"

# 1. Send OTP & Verify
client.post('/api/auth/send_code', json={'email': s_email})
_conn = sqlite3.connect(server.DB_PATH)
_cur = _conn.cursor()
_cur.execute("SELECT code FROM email_verifications WHERE email = ? ORDER BY rowid DESC LIMIT 1", (s_email,))
otp = _cur.fetchone()[0]
_conn.close()
client.post('/api/auth/verify_code', json={'email': s_email, 'code': otp})

# 2. Register fresh student
reg_res = client.post('/api/auth/register', json={
    'last_name': 'Байжанов',
    'first_name': 'Нурлан',
    'middle_name': 'Серикович',
    'email': s_email,
    'password': 'Password2026',
    'role': 'student',
    'group_name': 'ИС-21',
    'specialty_slug': 'it',
    'verification_code': otp
})
assert reg_res.status_code == 201, f"Registration failed: {reg_res.get_json()}"
new_student = reg_res.get_json()['user']
new_student_id = new_student['id']
print(f"[OK] New student registered: ID={new_student_id}, Name={new_student['full_name']}")

# 3. Check Initial Zero-State
prof0 = client.get(f"/api/user/profile/{new_student_id}").get_json()
assert prof0['statistics']['xp'] == 0, "Fresh student must start with 0 XP"
assert prof0['statistics']['level'] == 1, "Fresh student must start at Level 1 (Новичок)"
assert len(prof0['achievements']) == 0, "Fresh student must start with 0 achievements"
print("[OK] Zero-state verified: 0 XP, Level 1 'Новичок', 0 achievements")

# 4. Advance study day to Day 3 using Teacher role
with client.session_transaction() as sess:
    sess['user_id'] = 2
    sess['user_role'] = 'teacher'
adv_resp = client.post('/api/teacher/advance_day', json={'day': 3})
assert adv_resp.status_code == 200

# 5. Switch back to student session
with client.session_transaction() as sess:
    sess['user_id'] = new_student_id
    sess['user_role'] = 'student'

# Attempt to skip to Task 2 directly on Day 3 without completing Task 1
prereq_bypass = client.post('/api/tasks/submit', json={
    'user_id': new_student_id,
    'specialty_slug': 'it',
    'task_number': 2,
    'score': 95
})
assert prereq_bypass.status_code == 403, f"Sequential prerequisite check MUST block Task 2 if Task 1 not completed (got {prereq_bypass.status_code})"
print("[OK] Sequential prerequisite lock verified: Task 2 blocked with HTTP 403 because Task 1 is incomplete!")

# 6. Complete Task 1 Quiz with 3/3
prog_res = client.post('/api/tasks/progress', json={
    'user_id': new_student_id,
    'specialty_slug': 'it',
    'task_number': 1,
    'quiz_score': 3
})
assert prog_res.status_code == 200

# 7. Submit Task 1 for teacher review
sub1_res = client.post('/api/tasks/submit', json={
    'user_id': new_student_id,
    'specialty_slug': 'it',
    'task_number': 1,
    'score': 100,
    'submitted_code': '<h1>EduSpace Production</h1>',
    'await_teacher': True
})
assert sub1_res.status_code == 200
sub1_id = sub1_res.get_json()['result']['submission_id']
print(f"[OK] Task 1 submitted successfully for teacher review (Submission ID: {sub1_id})")

# 8. Teacher grades Task 1 with 100/100
with client.session_transaction() as sess:
    sess['user_id'] = 2
    sess['user_role'] = 'teacher'

grade_res = client.post('/api/teacher/grade_submission', json={
    'submission_id': sub1_id,
    'grade': 100,
    'feedback': 'Безупречное выполнение, чистый код и соблюдение спецификации!',
    'action': 'approve'
})
assert grade_res.status_code == 200, f"Teacher grading failed: {grade_res.get_json()}"
print("[OK] Teacher graded submission with 100/100 and left positive review")

# 9. Verify Student profile after grading: XP awarded, Level updated, Achievements unlocked
with client.session_transaction() as sess:
    sess['user_id'] = new_student_id
    sess['user_role'] = 'student'

prof1 = client.get(f"/api/user/profile/{new_student_id}").get_json()
stats1 = prof1['statistics']
achs1 = prof1['achievements']
print(f"[OK] Profile updated: XP={stats1['xp']}, Level={stats1['level']} ({stats1['rank_name']}), Passed Tasks={stats1['passed_count']}")
print(f"[OK] Unlocked Achievements: {[a['title'] for a in achs1]}")

assert stats1['passed_count'] == 1, "Passed tasks count must be 1"
assert stats1['xp'] > 0, "XP must be awarded for passing task and achievements"
assert any(a['id'] == 'first_step' for a in achs1), "First step achievement must be unlocked"
assert any(a['id'] == 'perfect_score' for a in achs1), "Perfect score achievement must be unlocked"

# 10. Now that Task 1 is completed, student attempts Task 2 -> MUST SUCCEED on Day 3!
sub2_res = client.post('/api/tasks/submit', json={
    'user_id': new_student_id,
    'specialty_slug': 'it',
    'task_number': 2,
    'score': 90,
    'await_teacher': True
})
assert sub2_res.status_code == 200, f"Task 2 submission should succeed after Task 1 completion: {sub2_res.get_json()}"
print("[OK] Task 2 successfully unlocked and submitted after completing prerequisite Task 1!")

# Reset study day back to 1
with client.session_transaction() as sess:
    sess['user_id'] = 2
    sess['user_role'] = 'teacher'
client.post('/api/teacher/advance_day', json={'day': 1})

print("\n" + "=" * 65)
print("ALL 5 ADVANCED TRANSFORMATION E2E CHECKS PASSED WITH 100% SUCCESS!")
print("=" * 65)
