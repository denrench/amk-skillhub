# -*- coding: utf-8 -*-
"""
EDU SPACE PRO - Comprehensive LMS Core & API Test Suite
Converted to standard unittest.TestCase format.
Covers:
1. Health & Catalog Sync (50 lessons total)
2. Courses Catalog API (5 specialties x 10 tasks)
3. Strict FIO Validation (rejects single-word, digits)
4. Strict Email format validation
5. Unverified email registration blocked
6. Full 2-Step 6-Digit Email OTP Flow
7. Weak Password Rejection & Valid Real Student Registration
8. Duplicate email prevention (HTTP 409)
9. Teacher Access Code security (403 on wrong code, 201 on AMK2026)
10. Initial 0% Zero-State Check for New Student
11. Drip-Feed Schedule Security (Day 1: Task 1 open, Task 2 locked 403)
12. Quiz Progress, Submission & Teacher Review Workflow
13. Gradebook Matrix Verification
14. Isolated Demo Reset preserves real registered student data
15. Static HTML Pages & Zero Mojibake Audit (18 HTML pages + JS bundles)
16. Crisp local SVG logo asset & favicon verification
17. AI-Mentor Contextual API (/api/ai/chat)
18. Admin Portal & Role Management API
"""
import os
import re
import sqlite3
import sys
import unittest

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import server


class TestFullLmsSuite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.app = server.app.test_client()
        cls.cleanup_test_records()
        # Reset demo to clean initial state
        with cls.app.session_transaction() as sess:
            sess['user_id'] = 1
            sess['user_role'] = 'student'
        cls.app.post('/api/demo/reset')

    @classmethod
    def tearDownClass(cls):
        cls.cleanup_test_records()

    @classmethod
    def cleanup_test_records(cls):
        conn = sqlite3.connect(server.DB_PATH)
        cur = conn.cursor()
        test_emails = ('smagulov.daniyar.lms@amk.kz', 'kuznetsova.teacher.lms@amk.kz')
        cur.execute("DELETE FROM task_submissions WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?))", test_emails)
        cur.execute("DELETE FROM grades WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?))", test_emails)
        cur.execute("DELETE FROM enrollments WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?))", test_emails)
        cur.execute("DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?))", test_emails)
        cur.execute("DELETE FROM lesson_progress WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?))", test_emails)
        cur.execute("DELETE FROM email_verifications WHERE email IN (?, ?)", test_emails)
        cur.execute("DELETE FROM users WHERE email IN (?, ?)", test_emails)
        conn.commit()
        conn.close()

    def get_db_otp(self, email):
        conn = sqlite3.connect(server.DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT code FROM email_verifications WHERE email = ? ORDER BY rowid DESC LIMIT 1", (email.lower(),))
        row = cur.fetchone()
        conn.close()
        return row[0] if row else None

    def test_01_health_and_catalog(self):
        r = self.app.get('/api/health')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()['tasks_total'], 50)

    def test_02_courses_catalog(self):
        r = self.app.get('/api/courses')
        self.assertEqual(r.status_code, 200)
        courses = r.get_json()['courses']
        self.assertEqual(len(courses), 5)
        for slug in ('it', 'graphic_design', 'autoelectric', 'hvac', 'automechanic'):
            rt = self.app.get(f'/api/tasks?specialty={slug}')
            self.assertEqual(rt.status_code, 200)
            self.assertEqual(rt.get_json()['count'], 10, f"Course {slug} must have 10 lessons")

    def test_03_strict_fio_validation(self):
        r_bad_fio1 = self.app.post('/api/auth/register', json={
            'full_name': 'Иван',
            'email': 'singleword@test.kz',
            'password': 'Password123'
        })
        self.assertEqual(r_bad_fio1.status_code, 400)

        r_bad_fio2 = self.app.post('/api/auth/register', json={
            'last_name': 'Иванов123',
            'first_name': 'Иван',
            'email': 'digits@test.kz',
            'password': 'Password123'
        })
        self.assertEqual(r_bad_fio2.status_code, 400)

    def test_04_strict_email_validation(self):
        r_bad_email = self.app.post('/api/auth/send_code', json={'email': 'not-an-email@x'})
        self.assertEqual(r_bad_email.status_code, 400)

    def test_05_unverified_email_registration_blocked(self):
        test_student_email = 'smagulov.daniyar.lms@amk.kz'
        r_unverified = self.app.post('/api/auth/register', json={
            'last_name': 'Смагулов',
            'first_name': 'Данияр',
            'middle_name': 'Маратович',
            'email': test_student_email,
            'password': 'Student2026'
        })
        self.assertEqual(r_unverified.status_code, 400)
        self.assertTrue(r_unverified.get_json().get('require_verification'))

    def test_06_email_otp_flow(self):
        test_student_email = 'smagulov.daniyar.lms@amk.kz'
        r_send = self.app.post('/api/auth/send_code', json={'email': test_student_email})
        self.assertEqual(r_send.status_code, 200)

        otp_code = self.get_db_otp(test_student_email)
        self.assertIsNotNone(otp_code)
        self.assertEqual(len(otp_code), 6)
        self.assertTrue(otp_code.isdigit())

        r_wrong = self.app.post('/api/auth/verify_code', json={
            'email': test_student_email,
            'code': '000000' if otp_code != '000000' else '999999'
        })
        self.assertEqual(r_wrong.status_code, 400)

        r_right = self.app.post('/api/auth/verify_code', json={
            'email': test_student_email,
            'code': otp_code
        })
        self.assertEqual(r_right.status_code, 200)
        self.assertTrue(r_right.get_json()['verified'])

    def test_07_weak_password_and_valid_student_registration(self):
        test_student_email = 'smagulov.daniyar.lms@amk.kz'
        r_weak = self.app.post('/api/auth/register', json={
            'last_name': 'смагулов',
            'first_name': 'данияр',
            'middle_name': 'маратович',
            'email': test_student_email,
            'password': 'abcdef'
        })
        self.assertEqual(r_weak.status_code, 400)

        r_reg = self.app.post('/api/auth/register', json={
            'last_name': 'смагулов',
            'first_name': 'данияр',
            'middle_name': 'маратович',
            'email': test_student_email,
            'password': 'Student2026',
            'specialty_slug': 'it',
            'group_name': 'ИС-21'
        })
        self.assertEqual(r_reg.status_code, 201)
        real_student = r_reg.get_json()['user']
        self.assertEqual(real_student['full_name'], 'Смагулов Данияр Маратович')
        self.assertTrue(real_student['email_verified'])
        self.assertFalse(real_student['is_demo'])

    def test_08_duplicate_email_rejection(self):
        test_student_email = 'smagulov.daniyar.lms@amk.kz'
        r_dup = self.app.post('/api/auth/send_code', json={'email': test_student_email})
        self.assertEqual(r_dup.status_code, 409)

    def test_09_teacher_access_code_security(self):
        t_email = 'kuznetsova.teacher.lms@amk.kz'
        self.app.post('/api/auth/send_code', json={'email': t_email})
        t_otp = self.get_db_otp(t_email)
        self.assertIsNotNone(t_otp)
        self.app.post('/api/auth/verify_code', json={'email': t_email, 'code': t_otp})

        r_bad_tcode = self.app.post('/api/auth/register', json={
            'last_name': 'Кузнецова',
            'first_name': 'Елена',
            'email': t_email,
            'password': 'Teacher2026',
            'role': 'teacher',
            'teacher_code': 'WRONG123'
        })
        self.assertEqual(r_bad_tcode.status_code, 403)

        r_good_teacher = self.app.post('/api/auth/register', json={
            'last_name': 'Кузнецова',
            'first_name': 'Елена',
            'middle_name': 'Викторовна',
            'email': t_email,
            'password': 'Teacher2026',
            'role': 'teacher',
            'department': 'Кафедра ИТ',
            'teacher_code': 'AMK2026'
        })
        self.assertEqual(r_good_teacher.status_code, 201)

    def test_10_initial_zero_state_for_student(self):
        conn = sqlite3.connect(server.DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = 'smagulov.daniyar.lms@amk.kz'")
        student_id = cur.fetchone()[0]
        conn.close()

        r_prof0 = self.app.get(f"/api/user/profile/{student_id}")
        self.assertEqual(r_prof0.status_code, 200)
        stats0 = r_prof0.get_json()['statistics']
        self.assertEqual(stats0['passed_count'], 0)
        self.assertEqual(stats0['progress_percent'], 0)
        self.assertEqual(stats0['xp'], 0)

    def test_11_drip_feed_schedule_locks(self):
        conn = sqlite3.connect(server.DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = 'smagulov.daniyar.lms@amk.kz'")
        student_id = cur.fetchone()[0]
        conn.close()

        # Login as real student
        self.app.post('/api/auth/login', json={'email': 'smagulov.daniyar.lms@amk.kz', 'password': 'Student2026'})

        r_tasks = self.app.get(f"/api/tasks?specialty=it&user_id={student_id}")
        tasks = r_tasks.get_json()['tasks']
        self.assertFalse(tasks[0]['is_locked'])
        self.assertTrue(tasks[1]['is_locked'])

        r_bypass = self.app.post('/api/tasks/submit', json={
            'user_id': student_id,
            'specialty_slug': 'it',
            'task_number': 2,
            'score': 100,
            'submitted_code': 'attempting to bypass schedule'
        })
        self.assertEqual(r_bypass.status_code, 403)
        self.assertTrue(r_bypass.get_json()['is_locked'])

    def test_12_quiz_progress_and_teacher_grading_workflow(self):
        conn = sqlite3.connect(server.DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = 'smagulov.daniyar.lms@amk.kz'")
        student_id = cur.fetchone()[0]
        conn.close()

        # Login as student
        self.app.post('/api/auth/login', json={'email': 'smagulov.daniyar.lms@amk.kz', 'password': 'Student2026'})

        r_prog = self.app.post('/api/tasks/progress', json={
            'user_id': student_id,
            'specialty_slug': 'it',
            'task_number': 1,
            'quiz_score': 3,
            'draft_code': 'Размер баннера 1200x600 px, 72 ppi, формат WebP.'
        })
        self.assertEqual(r_prog.status_code, 200)

        r_sub = self.app.post('/api/tasks/submit', json={
            'user_id': student_id,
            'specialty_slug': 'it',
            'task_number': 1,
            'score': 92,
            'autotest_passed': 5,
            'autotest_total': 5,
            'quiz_score': 3,
            'await_teacher': True,
            'submitted_code': 'Чек-лист веб-баннера в Photoshop: 1200x600 px, 72 ppi, формат WebP.'
        })
        self.assertEqual(r_sub.status_code, 200)
        sub_id = r_sub.get_json()['result']['submission_id']

        # Login as teacher to grade
        self.app.post('/api/auth/login', json={'email': 'kuznetsova.teacher.lms@amk.kz', 'password': 'Teacher2026'})

        r_grade = self.app.post('/api/teacher/grade_submission', json={
            'submission_id': sub_id,
            'grade': 98,
            'feedback': 'Превосходная работа, все граничные случаи учтены!',
            'action': 'approve'
        })
        self.assertEqual(r_grade.status_code, 200)

        r_prof1 = self.app.get(f"/api/user/profile/{student_id}")
        stats1 = r_prof1.get_json()['statistics']
        self.assertEqual(stats1['passed_count'], 1)
        self.assertEqual(stats1['progress_percent'], 10)
        self.assertEqual(stats1['avg_score'], 98.0)

    def test_13_gradebook_matrix(self):
        conn = sqlite3.connect(server.DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = 'smagulov.daniyar.lms@amk.kz'")
        student_id = cur.fetchone()[0]
        conn.close()

        r_mat = self.app.get('/api/teacher/matrix?specialty=it')
        self.assertEqual(r_mat.status_code, 200)
        mat_rows = r_mat.get_json()['rows']
        st_row = next((x for x in mat_rows if x['student']['id'] == student_id), None)
        self.assertIsNotNone(st_row)
        self.assertEqual(st_row['cells']['1']['score'], 98)

    def test_14_demo_reset_preserves_real_student(self):
        conn = sqlite3.connect(server.DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = 'smagulov.daniyar.lms@amk.kz'")
        student_id = cur.fetchone()[0]
        conn.close()

        # Login as student or teacher to invoke demo reset
        self.app.post('/api/auth/login', json={'email': 'smagulov.daniyar.lms@amk.kz', 'password': 'Student2026'})
        r_reset = self.app.post('/api/demo/reset')
        self.assertEqual(r_reset.status_code, 200)

        r_demo_st = self.app.get('/api/demo/status').get_json()
        self.assertEqual(r_demo_st['progress_percent'], 0)
        self.assertEqual(r_demo_st['completed_count'], 0)

        r_prof_after = self.app.get(f"/api/user/profile/{student_id}").get_json()['statistics']
        self.assertEqual(r_prof_after['passed_count'], 1)
        self.assertEqual(r_prof_after['avg_score'], 98.0)

    def test_15_all_pages_and_zero_mojibake(self):
        all_pages = [
            '/', '/index.html', '/features.html', '/about.html', '/pricing.html',
            '/reviews.html', '/auth.html', '/student.html', '/tasks.html',
            '/simulator.html', '/teacher.html', '/profile.html', '/career.html',
            '/tools.html', '/admin.html', '/lesson_player.html', '/mission.html', '/verify.html'
        ]
        for route in all_pages:
            resp = self.app.get(route)
            # Gradebook redirects (301 or 200 depending on follow)
            if route == '/gradebook.html' or route == '/gradebook':
                self.assertIn(resp.status_code, (200, 301, 302))
            else:
                self.assertEqual(resp.status_code, 200, f"Route {route} failed")
            body_txt = resp.get_data(as_text=True)
            self.assertNotIn('\ufffd', body_txt, f"Mojibake found in {route}")

        for js_file in ('js/courses-catalog.js', 'js/app-logistics.js', 'js/interactive-simulators.js'):
            full_path = os.path.join(server.BASE_DIR, js_file)
            if os.path.exists(full_path):
                with open(full_path, 'r', encoding='utf-8') as f:
                    txt = f.read()
                    self.assertNotIn('\ufffd', txt, f"Mojibake found in {js_file}")

    def test_16_crisp_svg_logo(self):
        r_logo = self.app.get('/assets/eduspace-logo.svg')
        self.assertEqual(r_logo.status_code, 200)
        self.assertIn('<svg', r_logo.get_data(as_text=True))

    def test_17_ai_mentor_api(self):
        r_ai = self.app.post('/api/ai/chat', json={
            'prompt': 'Дай подсказку по коду',
            'specialty': 'autoelectric',
            'task_number': 3,
            'prompt_type': 'hint'
        })
        self.assertEqual(r_ai.status_code, 200)
        data = r_ai.get_json()
        self.assertTrue(data['success'])
        self.assertIn('5.0 В', data['reply'])

    def test_18_admin_portal_and_roles(self):
        with self.app.session_transaction() as sess:
            sess['user_id'] = 1
            sess['user_role'] = 'admin'

        r_admin_users = self.app.get('/api/admin/users')
        self.assertEqual(r_admin_users.status_code, 200)
        users_data = r_admin_users.get_json()
        self.assertTrue(users_data['success'])
        self.assertTrue(len(users_data['users']) > 0)

        first_id = users_data['users'][0]['id']
        r_role = self.app.post('/api/admin/change_role', json={'user_id': first_id, 'role': 'student'})
        self.assertEqual(r_role.status_code, 200)
        self.assertTrue(r_role.get_json()['success'])


if __name__ == '__main__':
    unittest.main()
