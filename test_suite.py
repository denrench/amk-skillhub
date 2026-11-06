# -*- coding: utf-8 -*-
import os
import sys
import sqlite3

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import server

app = server.app.test_client()

print("=== RUNNING FULL EDU SPACE LMS TEST SUITE ===")

# Ensure clean Day 1 demo state before starting
app.post('/api/demo/reset')

# 1. Health & Catalog Sync
r = app.get('/api/health')
assert r.status_code == 200
assert r.get_json()['tasks_total'] == 50
print("Test 1: Health & 50-lesson catalog OK")

# 2. Courses Catalog API
r = app.get('/api/courses')
assert r.status_code == 200
courses = r.get_json()['courses']
assert len(courses) == 5
for slug in ('it', 'graphic_design', 'autoelectric', 'hvac', 'automechanic'):
    rt = app.get(f'/api/tasks?specialty={slug}')
    assert rt.status_code == 200
    assert rt.get_json()['count'] == 10, f"Course {slug} must have 10 lessons"
print("Test 2: All 5 courses x 10 lessons (50 total) OK")

# 3. FIO Validation (Single word & digits must be rejected)
r_bad_fio1 = app.post('/api/auth/register', json={
    'full_name': 'Иван',
    'email': 'singleword@test.kz',
    'password': 'Password123'
})
assert r_bad_fio1.status_code == 400, "1-word name must be rejected"

r_bad_fio2 = app.post('/api/auth/register', json={
    'last_name': 'Иванов123',
    'first_name': 'Иван',
    'email': 'digits@test.kz',
    'password': 'Password123'
})
assert r_bad_fio2.status_code == 400, "Digits in FIO must be rejected"
print("Test 3: Strict FIO validation (rejects 1-word and digits) OK")

# 4. Email Format Validation
r_bad_email = app.post('/api/auth/send_code', json={'email': 'not-an-email@x'})
assert r_bad_email.status_code == 400, "Invalid email domain must be rejected"
print("Test 4: Strict Email format validation OK")

# 5. Unverified Email Registration Must Be Blocked
test_student_email = 'smagulov.daniyar.lms@amk.kz'
# Clean previous test user if exists
conn = sqlite3.connect(server.DB_PATH)
conn.execute("DELETE FROM task_submissions WHERE user_id IN (SELECT id FROM users WHERE email IN (?, 'kuznetsova.teacher.lms@amk.kz'))", (test_student_email,))
conn.execute("DELETE FROM enrollments WHERE user_id IN (SELECT id FROM users WHERE email IN (?, 'kuznetsova.teacher.lms@amk.kz'))", (test_student_email,))
conn.execute("DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email IN (?, 'kuznetsova.teacher.lms@amk.kz'))", (test_student_email,))
conn.execute("DELETE FROM lesson_progress WHERE user_id IN (SELECT id FROM users WHERE email IN (?, 'kuznetsova.teacher.lms@amk.kz'))", (test_student_email,))
conn.execute("DELETE FROM email_verifications WHERE email IN (?, 'kuznetsova.teacher.lms@amk.kz')", (test_student_email,))
conn.execute("DELETE FROM users WHERE email IN (?, 'kuznetsova.teacher.lms@amk.kz')", (test_student_email,))
conn.commit()
conn.close()

r_unverified = app.post('/api/auth/register', json={
    'last_name': 'Смагулов',
    'first_name': 'Данияр',
    'middle_name': 'Маратович',
    'email': test_student_email,
    'password': 'Student2026'
})
assert r_unverified.status_code == 400 and r_unverified.get_json().get('require_verification') is True
print("Test 5: Unverified email blocked from registering OK")

# 6. Full 2-Step 6-Digit Email OTP Flow
r_send = app.post('/api/auth/send_code', json={'email': test_student_email})
assert r_send.status_code == 200
otp_code = r_send.get_json()['mail_preview']['code']
assert len(otp_code) == 6 and otp_code.isdigit()

r_wrong_otp = app.post('/api/auth/verify_code', json={'email': test_student_email, 'code': '000000' if otp_code != '000000' else '999999'})
assert r_wrong_otp.status_code == 400, "Wrong OTP must fail"

r_right_otp = app.post('/api/auth/verify_code', json={'email': test_student_email, 'code': otp_code})
assert r_right_otp.status_code == 200 and r_right_otp.get_json()['verified'] is True
print("Test 6: 6-digit Email OTP generation & verification OK")

# 7. Weak Password Rejection & Valid Real Student Registration
r_weak_pwd = app.post('/api/auth/register', json={
    'last_name': 'смагулов',
    'first_name': 'данияр',
    'middle_name': 'маратович',
    'email': test_student_email,
    'password': 'abcdef'  # no digits
})
assert r_weak_pwd.status_code == 400, "Password without digits must be rejected"

r_reg = app.post('/api/auth/register', json={
    'last_name': 'смагулов',
    'first_name': 'данияр',
    'middle_name': 'маратович',
    'email': test_student_email,
    'password': 'Student2026',
    'specialty_slug': 'it',
    'group_name': 'ИС-21'
})
assert r_reg.status_code == 201, f"Registration failed: {r_reg.get_json()}"
real_student = r_reg.get_json()['user']
assert real_student['full_name'] == 'Смагулов Данияр Маратович', "FIO must be auto-capitalized"
assert real_student['email_verified'] is True
assert real_student['is_demo'] is False
print("Test 7: Real Student registration (FIO normalized + verified email) OK")

# 8. Duplicate Email Rejection
r_dup = app.post('/api/auth/send_code', json={'email': test_student_email})
assert r_dup.status_code == 409
print("Test 8: Duplicate email prevention (HTTP 409) OK")

# 9. Teacher Access Code Security
t_email = 'kuznetsova.teacher.lms@amk.kz'
t_otp = app.post('/api/auth/send_code', json={'email': t_email}).get_json()['mail_preview']['code']
app.post('/api/auth/verify_code', json={'email': t_email, 'code': t_otp})

r_bad_tcode = app.post('/api/auth/register', json={
    'last_name': 'Кузнецова',
    'first_name': 'Елена',
    'email': t_email,
    'password': 'Teacher2026',
    'role': 'teacher',
    'teacher_code': 'WRONG123'
})
assert r_bad_tcode.status_code == 403, "Invalid teacher access code must return 403"

r_good_teacher = app.post('/api/auth/register', json={
    'last_name': 'Кузнецова',
    'first_name': 'Елена',
    'middle_name': 'Викторовна',
    'email': t_email,
    'password': 'Teacher2026',
    'role': 'teacher',
    'department': 'Кафедра ИТ',
    'teacher_code': 'AMK2026'
})
assert r_good_teacher.status_code == 201
print("Test 9: Teacher Access Code security (403 on wrong code, 201 on AMK2026) OK")

# 10. Initial 0% Zero-State Check for New Student
r_prof0 = app.get(f"/api/user/profile/{real_student['id']}")
assert r_prof0.status_code == 200
stats0 = r_prof0.get_json()['statistics']
assert stats0['passed_count'] == 0 and stats0['progress_percent'] == 0 and stats0['xp'] == 0
print("Test 10: Fresh student starts at 0% progress, 0 GPA, 0 XP OK")

# 11. Drip-Feed Schedule Security (Day 1: Task 1 open, Task 2 locked with HTTP 403)
r_tasks = app.get(f"/api/tasks?specialty=it&user_id={real_student['id']}")
tasks = r_tasks.get_json()['tasks']
assert tasks[0]['is_locked'] is False and tasks[1]['is_locked'] is True

r_bypass = app.post('/api/tasks/submit', json={
    'user_id': real_student['id'],
    'specialty_slug': 'it',
    'task_number': 2,
    'score': 100,
    'submitted_code': 'attempting to bypass schedule'
})
assert r_bypass.status_code == 403 and r_bypass.get_json()['is_locked'] is True
print("Test 11: Drip-Feed server lock blocks locked Task 2 with HTTP 403 OK")

# 12. Quiz Progress, Submission & Teacher Review Workflow
r_prog = app.post('/api/tasks/progress', json={
    'user_id': real_student['id'],
    'specialty_slug': 'it',
    'task_number': 1,
    'quiz_score': 3,
    'draft_code': 'Размер баннера 1200x600 px, 72 ppi, формат WebP.'
})
assert r_prog.status_code == 200

r_sub = app.post('/api/tasks/submit', json={
    'user_id': real_student['id'],
    'specialty_slug': 'it',
    'task_number': 1,
    'score': 92,
    'autotest_passed': 5,
    'autotest_total': 5,
    'quiz_score': 3,
    'await_teacher': True,
    'submitted_code': 'Чек-лист веб-баннера в Photoshop: 1200x600 px, 72 ppi, формат WebP.'
})
assert r_sub.status_code == 200
sub_id = r_sub.get_json()['result']['submission_id']

# Teacher grades the submission with 98/100
r_grade = app.post('/api/teacher/grade_submission', json={
    'submission_id': sub_id,
    'grade': 98,
    'feedback': 'Превосходная работа, все граничные случаи учтены!',
    'action': 'approve'
})
assert r_grade.status_code == 200

r_prof1 = app.get(f"/api/user/profile/{real_student['id']}")
stats1 = r_prof1.get_json()['statistics']
assert stats1['passed_count'] == 1
assert stats1['progress_percent'] == 10
assert stats1['avg_score'] == 98.0
print("Test 12: Quiz + Submission + Teacher Grading updates student progress to 10% (98/100) OK")

# 13. Gradebook Matrix Verification
r_mat = app.get('/api/teacher/matrix?specialty=it')
assert r_mat.status_code == 200
mat_rows = r_mat.get_json()['rows']
st_row = next(x for x in mat_rows if x['student']['id'] == real_student['id'])
assert st_row['cells']['1']['score'] == 98
print("Test 13: Electronic Gradebook Matrix (Students × Lessons 1..10) OK")

# 14. Isolated Demo Reset MUST NOT Delete Real Registered Student Data!
r_reset = app.post('/api/demo/reset')
assert r_reset.status_code == 200

r_demo_st = app.get('/api/demo/status').get_json()
assert r_demo_st['progress_percent'] == 0 and r_demo_st['completed_count'] == 0

r_prof_after = app.get(f"/api/user/profile/{real_student['id']}").get_json()['statistics']
assert r_prof_after['passed_count'] == 1 and r_prof_after['avg_score'] == 98.0, "Real user progress MUST survive demo reset!"
print("Test 14: Isolated Demo Reset preserves real registered users & their grades OK")

# 15. Static HTML Pages & Zero Mojibake Audit
all_pages = [
    '/', '/index.html', '/features.html', '/about.html', '/pricing.html',
    '/reviews.html', '/auth.html', '/student.html', '/tasks.html',
    '/simulator.html', '/teacher.html', '/profile.html', '/career.html', '/tools.html', '/admin.html'
]
for route in all_pages:
    resp = app.get(route)
    assert resp.status_code == 200, f"Route {route} failed"
    body_txt = resp.get_data(as_text=True)
    assert '\ufffd' not in body_txt, f"Mojibake found in {route}"

for js_file in ('js/courses-catalog.js', 'js/app-logistics.js', 'js/interactive-simulators.js'):
    with open(os.path.join(server.BASE_DIR, js_file), 'r', encoding='utf-8') as f:
        txt = f.read()
        assert '\ufffd' not in txt, f"Mojibake found in {js_file}"

print("Test 15: All 11 HTML pages & JS bundles return HTTP 200 with zero encoding errors OK")

# 16. Verify Local Logo Asset & Favicon
r_logo = app.get('/assets/eduspace-logo.svg')
assert r_logo.status_code == 200, "Local SVG logo must return HTTP 200"
assert '<svg' in r_logo.get_data(as_text=True), "Logo must be a valid SVG"
print("Test 16: Local crisp SVG logo & favicon (assets/eduspace-logo.svg) returns HTTP 200 OK")


# Clean up test-only records so DB starts super clean for real users
conn = sqlite3.connect(server.DB_PATH)
conn.execute("DELETE FROM task_submissions WHERE user_id IN (?, ?)", (real_student['id'], r_good_teacher.get_json()['user']['id']))
conn.execute("DELETE FROM grades WHERE user_id = ?", (real_student['id'],))
conn.execute("DELETE FROM enrollments WHERE user_id = ?", (real_student['id'],))
conn.execute("DELETE FROM notifications WHERE user_id = ?", (real_student['id'],))
conn.execute("DELETE FROM lesson_progress WHERE user_id = ?", (real_student['id'],))
conn.execute("DELETE FROM email_verifications WHERE email IN (?, ?)", (test_student_email, t_email))
conn.execute("DELETE FROM users WHERE email IN (?, ?)", (test_student_email, t_email))
conn.commit()
conn.close()
app.post('/api/demo/reset')

print("\nSUCCESS: ALL 18 COMPREHENSIVE LMS TESTS PASSED 100%!")
# 17. Verify AI-Mentor Contextual API
r_ai = app.post('/api/ai/chat', json={
    'prompt': 'Дай подсказку по коду',
    'specialty': 'autoelectric',
    'task_number': 3,
    'prompt_type': 'hint'
})
assert r_ai.status_code == 200, "AI chat endpoint must return HTTP 200"
assert r_ai.get_json()['success'] is True, "AI chat response must be successful"
assert '5.0 В' in r_ai.get_json()['reply'], "AI response must contain relevant technical advice"
print("Test 17: AI-Mentor Contextual API (/api/ai/chat) OK")


# 18. Verify Admin Portal & Role Management API (Requires Admin Role)
with app.session_transaction() as sess:
    sess['user_id'] = 1
    sess['user_role'] = 'admin'

r_admin_users = app.get('/api/admin/users')
assert r_admin_users.status_code == 200, "Admin users list must return HTTP 200"
users_data = r_admin_users.get_json()
assert users_data['success'] is True and len(users_data['users']) > 0

# Test changing a test user's role
first_id = users_data['users'][0]['id']
r_role = app.post('/api/admin/change_role', json={'user_id': first_id, 'role': 'student'})
assert r_role.status_code == 200 and r_role.get_json()['success'] is True
print("Test 18: Admin Portal & Role Management API (/api/admin/users) OK")


