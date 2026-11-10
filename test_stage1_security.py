# -*- coding: utf-8 -*-
"""
EDU SPACE PRO - Stage 1 Security & Architecture Verification Suite
Standard unittest.TestCase implementation verifying:
1. Registration of new student with server session
2. Relogin after session / persistent auth state
3. user_id tampering attempt blocked with HTTP 403
4. Student accessing Admin API blocked with HTTP 403
5. Teacher accessing unauthorized group blocked with HTTP 403
6. Persistence of student progress and grades
7. Password reset workflow
8. Empty or invalid teacher access code registration rejection (403)
9. repo_url with javascript: scheme rejection (400)
10. SVG upload rejection (400)
11. Unauthenticated access to protected endpoints rejection (401)
12. Demo reset thoroughness (clears xp_transactions, quests, etc.)
"""
import io
import os
import sqlite3
import time
import unittest

import server


class TestStage1Security(unittest.TestCase):

    def setUp(self):
        previous_testing = server.app.testing
        server.app.testing = True
        self.addCleanup(setattr, server.app, 'testing', previous_testing)
        self.app = server.app.test_client()
        self.cleanup_test_records()

    def tearDown(self):
        self.cleanup_test_records()

    def cleanup_test_records(self):
        conn = sqlite3.connect(server.DB_PATH)
        cur = conn.cursor()
        cur.execute("DELETE FROM xp_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@stage1.kz')")
        cur.execute("DELETE FROM daily_quests_log WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@stage1.kz')")
        cur.execute("DELETE FROM lesson_block_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@stage1.kz')")
        cur.execute("DELETE FROM ai_conversations WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@stage1.kz')")
        cur.execute("DELETE FROM audit_logs WHERE actor_id IN (SELECT id FROM users WHERE email LIKE '%@stage1.kz')")
        cur.execute("DELETE FROM task_submissions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@stage1.kz')")
        cur.execute("DELETE FROM grades WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@stage1.kz')")
        cur.execute("DELETE FROM enrollments WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@stage1.kz')")
        cur.execute("DELETE FROM lesson_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@stage1.kz')")
        cur.execute("DELETE FROM teacher_groups WHERE teacher_id IN (SELECT id FROM users WHERE email LIKE '%@stage1.kz')")
        cur.execute("DELETE FROM email_verifications WHERE email LIKE '%@stage1.kz'")
        cur.execute("DELETE FROM users WHERE email LIKE '%@stage1.kz'")
        conn.commit()
        conn.close()

    def get_db_otp(self, email):
        conn = sqlite3.connect(server.DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT code FROM email_verifications WHERE email = ? ORDER BY rowid DESC LIMIT 1", (email,))
        row = cur.fetchone()
        conn.close()
        return row[0] if row else None

    def register_and_login_student(self, email="student.stage1@stage1.kz"):
        self.app.post('/api/auth/send_code', json={'email': email})
        otp = self.get_db_otp(email)
        self.app.post('/api/auth/verify_code', json={'email': email, 'code': otp})
        resp = self.app.post('/api/auth/register', json={
            'last_name': 'Алиев',
            'first_name': 'Арман',
            'middle_name': 'Серикович',
            'email': email,
            'password': 'Password2026',
            'specialty_slug': 'it',
            'group_name': 'ИС-21'
        })
        self.assertEqual(resp.status_code, 201)
        user = resp.get_json()['user']
        return user

    def test_01_student_registration_and_session(self):
        st_email = "student.stage1@stage1.kz"
        send_resp = self.app.post('/api/auth/send_code', json={'email': st_email})
        self.assertEqual(send_resp.status_code, 200)
        otp = self.get_db_otp(st_email)
        self.assertIsNotNone(otp)

        v_resp = self.app.post('/api/auth/verify_code', json={'email': st_email, 'code': otp})
        self.assertEqual(v_resp.status_code, 200)

        reg_resp = self.app.post('/api/auth/register', json={
            'last_name': 'Алиев',
            'first_name': 'Арман',
            'middle_name': 'Серикович',
            'email': st_email,
            'password': 'Password2026',
            'specialty_slug': 'it',
            'group_name': 'ИС-21'
        })
        self.assertEqual(reg_resp.status_code, 201)
        st_user = reg_resp.get_json()['user']
        student_id = st_user['id']

        sess_resp = self.app.get('/api/auth/session')
        self.assertEqual(sess_resp.status_code, 200)
        sess_data = sess_resp.get_json()
        self.assertTrue(sess_data['authenticated'])
        self.assertEqual(sess_data['user']['id'], student_id)

    def test_02_relogin_after_session_logout(self):
        st_email = "student.stage1@stage1.kz"
        self.register_and_login_student(st_email)

        self.app.post('/api/auth/logout')
        logged_out_sess = self.app.get('/api/auth/session').get_json()
        self.assertFalse(logged_out_sess['authenticated'])

        login_resp = self.app.post('/api/auth/login', json={
            'email': st_email,
            'password': 'Password2026'
        })
        self.assertEqual(login_resp.status_code, 200)
        self.assertEqual(login_resp.get_json()['user']['email'], st_email)

        sess_after = self.app.get('/api/auth/session').get_json()
        self.assertTrue(sess_after['authenticated'])
        self.assertEqual(sess_after['user']['email'], st_email)

    def test_03_tamper_user_id_blocked(self):
        self.register_and_login_student("student.stage1@stage1.kz")
        tamper_resp = self.app.post('/api/tasks/submit', json={
            'user_id': 99999,
            'specialty_slug': 'it',
            'task_number': 1,
            'score': 100,
            'submitted_code': 'tampered code submission'
        })
        self.assertEqual(tamper_resp.status_code, 403)
        self.assertEqual(tamper_resp.get_json().get('code'), 'TAMPERING_DETECTED')

    def test_04_student_accessing_admin_api_blocked(self):
        st_user = self.register_and_login_student("student.stage1@stage1.kz")
        admin_users_resp = self.app.get('/api/admin/users')
        self.assertEqual(admin_users_resp.status_code, 403)
        self.assertEqual(admin_users_resp.get_json().get('code'), 'FORBIDDEN')

        admin_role_resp = self.app.post('/api/admin/change_role', json={'user_id': st_user['id'], 'role': 'admin'})
        self.assertEqual(admin_role_resp.status_code, 403)

        admin_groups_resp = self.app.get('/api/admin/teacher_groups')
        self.assertEqual(admin_groups_resp.status_code, 403)

    def test_05_teacher_isolation_unauthorized_group_blocked(self):
        tA_email = "teachera.stage1@stage1.kz"
        self.app.post('/api/auth/send_code', json={'email': tA_email})
        tA_otp = self.get_db_otp(tA_email)
        self.app.post('/api/auth/verify_code', json={'email': tA_email, 'code': tA_otp})

        tA_reg = self.app.post('/api/auth/register', json={
            'last_name': 'Ахметов',
            'first_name': 'Бахыт',
            'middle_name': 'Кайратович',
            'email': tA_email,
            'password': 'TeacherPass1',
            'role': 'teacher',
            'teacher_code': 'AMK2026',
            'department': 'Кафедра ИТ'
        })
        self.assertEqual(tA_reg.status_code, 201)
        tA_id = tA_reg.get_json()['user']['id']

        conn = sqlite3.connect(server.DB_PATH)
        conn.execute("INSERT OR REPLACE INTO teacher_groups (teacher_id, group_name, specialty_slug) VALUES (?, ?, ?)",
                     (tA_id, 'ИС-21', 'it'))
        conn.commit()
        conn.close()

        self.app.post('/api/auth/login', json={'email': tA_email, 'password': 'TeacherPass1'})

        allowed_group_resp = self.app.get('/api/teacher/students?group=ИС-21')
        self.assertEqual(allowed_group_resp.status_code, 200)

        forbidden_group_resp = self.app.get('/api/teacher/students?group=ХО-20')
        self.assertEqual(forbidden_group_resp.status_code, 403)
        self.assertEqual(forbidden_group_resp.get_json().get('code'), 'GROUP_ACCESS_DENIED')

    def test_06_persistence_of_student_progress_and_grades(self):
        st_email = "student.stage1@stage1.kz"
        st_user = self.register_and_login_student(st_email)
        student_id = st_user['id']

        sub_res = self.app.post('/api/tasks/submit', json={
            'user_id': student_id,
            'specialty_slug': 'it',
            'task_number': 1,
            'score': 95,
            'autotest_passed': 5,
            'autotest_total': 5,
            'submitted_code': 'Valid HTML & CSS project'
        })
        self.assertEqual(sub_res.status_code, 200)
        submission_id = sub_res.get_json()['result']['submission_id']

        t_email = "teacher6.stage1@stage1.kz"
        self.app.post('/api/auth/send_code', json={'email': t_email})
        t_otp = self.get_db_otp(t_email)
        self.app.post('/api/auth/verify_code', json={'email': t_email, 'code': t_otp})
        t_reg = self.app.post('/api/auth/register', json={
            'last_name': 'Ахметов',
            'first_name': 'Бахыт',
            'middle_name': 'Кайратович',
            'email': t_email,
            'password': 'TeacherPass1',
            'role': 'teacher',
            'teacher_code': 'AMK2026',
            'department': 'Кафедра ИТ'
        })
        self.assertEqual(t_reg.status_code, 201)
        self.app.post('/api/auth/login', json={'email': t_email, 'password': 'TeacherPass1'})

        grade_res = self.app.post('/api/teacher/grade_submission', json={
            'submission_id': submission_id,
            'grade': 95,
            'feedback': 'Отличная реализация!',
            'action': 'approve'
        })
        self.assertEqual(grade_res.status_code, 200)

        direct_conn = sqlite3.connect(server.DB_PATH)
        direct_cur = direct_conn.cursor()
        direct_cur.execute("SELECT score, status FROM task_submissions WHERE user_id = ? AND task_number = 1", (student_id,))
        sub_record = direct_cur.fetchone()
        direct_conn.close()

        self.assertIsNotNone(sub_record)
        self.assertEqual(sub_record[0], 95)

        prof_resp = self.app.get(f"/api/user/profile/{student_id}")
        self.assertEqual(prof_resp.status_code, 200)
        stats = prof_resp.get_json()['statistics']
        self.assertEqual(stats['passed_count'], 1)
        self.assertEqual(stats['progress_percent'], 10)
        self.assertEqual(stats['avg_score'], 95.0)

    def test_07_password_reset_workflow(self):
        st_email = "student.stage1@stage1.kz"
        self.register_and_login_student(st_email)

        # Expired OTP code must be rejected with 400
        conn = sqlite3.connect(server.DB_PATH)
        expired_code = "112233"
        conn.execute("INSERT OR REPLACE INTO email_verifications (email, code, expires_at, verified, purpose) VALUES (?, ?, ?, 0, 'reset')",
                     (st_email, expired_code, int(time.time()) - 300))
        conn.commit()
        conn.close()

        expired_reset = self.app.post('/api/auth/reset_password', json={
            'email': st_email,
            'code': expired_code,
            'new_password': 'ExpiredPass2026!'
        })
        self.assertEqual(expired_reset.status_code, 400)

        # Now insert valid unexpired OTP
        conn = sqlite3.connect(server.DB_PATH)
        reset_code = "778899"
        conn.execute("INSERT OR REPLACE INTO email_verifications (email, code, expires_at, verified, purpose) VALUES (?, ?, ?, 0, 'reset')",
                     (st_email, reset_code, int(time.time()) + 900))
        conn.commit()
        conn.close()

        bad_reset = self.app.post('/api/auth/reset_password', json={
            'email': st_email,
            'code': '000000',
            'new_password': 'NewPassword2026!'
        })
        self.assertEqual(bad_reset.status_code, 400)

        # Valid OTP reset
        reset_resp = self.app.post('/api/auth/reset_password', json={
            'email': st_email,
            'code': reset_code,
            'new_password': 'NewPassword2026!'
        })
        self.assertEqual(reset_resp.status_code, 200)

        # Replay attack: using same OTP code again must fail with 400
        replay_reset = self.app.post('/api/auth/reset_password', json={
            'email': st_email,
            'code': reset_code,
            'new_password': 'ReplayPassword2026!'
        })
        self.assertEqual(replay_reset.status_code, 400)

        old_login = self.app.post('/api/auth/login', json={'email': st_email, 'password': 'Password2026'})
        self.assertEqual(old_login.status_code, 401)

        new_login = self.app.post('/api/auth/login', json={'email': st_email, 'password': 'NewPassword2026!'})
        self.assertEqual(new_login.status_code, 200)

    def test_08_empty_or_invalid_teacher_code_rejected_403(self):
        t_email = "teacher_bad.stage1@stage1.kz"
        self.app.post('/api/auth/send_code', json={'email': t_email})
        otp = self.get_db_otp(t_email)
        self.app.post('/api/auth/verify_code', json={'email': t_email, 'code': otp})

        # Test empty teacher code
        r1 = self.app.post('/api/auth/register', json={
            'last_name': 'Тестовый',
            'first_name': 'Преподаватель',
            'email': t_email,
            'password': 'TeacherPass1',
            'role': 'teacher',
            'teacher_code': ''
        })
        self.assertEqual(r1.status_code, 403)

        # Test wrong teacher code
        r2 = self.app.post('/api/auth/register', json={
            'last_name': 'Тестовый',
            'first_name': 'Преподаватель',
            'email': t_email,
            'password': 'TeacherPass1',
            'role': 'teacher',
            'teacher_code': 'HACKER_CODE_999'
        })
        self.assertEqual(r2.status_code, 403)

        # Test substring backdoor attempts (must be rejected!)
        for loose_code in ['AMK_HACKER', 'MY_2026_CODE', 'TEACHER_PRO', 'AMK999']:
            r_sub = self.app.post('/api/auth/register', json={
                'last_name': 'Тестовый',
                'first_name': 'Преподаватель',
                'email': t_email,
                'password': 'TeacherPass1',
                'role': 'teacher',
                'teacher_code': loose_code
            })
            self.assertEqual(r_sub.status_code, 403, f"Code '{loose_code}' should have been rejected with 403")

        # Test valid Cyrillic teacher access codes (must succeed!)
        for idx, valid_cyrillic in enumerate(['ПРЕПОД', 'ПРЕПОДАВАТЕЛЬ', 'АМК2026']):
            c_email = f"teacher_cyr_{idx}.stage1@stage1.kz"
            self.app.post('/api/auth/send_code', json={'email': c_email})
            c_otp = self.get_db_otp(c_email)
            self.app.post('/api/auth/verify_code', json={'email': c_email, 'code': c_otp})
            r_cyr = self.app.post('/api/auth/register', json={
                'last_name': 'Преподаватель',
                'first_name': 'Кафедральный',
                'email': c_email,
                'password': 'TeacherPass1',
                'role': 'teacher',
                'teacher_code': valid_cyrillic
            })
            self.assertEqual(r_cyr.status_code, 201, f"Valid Cyrillic code '{valid_cyrillic}' should have succeeded with 201, got: {r_cyr.get_json()}")

    def test_09_repo_url_xss_javascript_rejected_400(self):
        st_user = self.register_and_login_student("student.stage1@stage1.kz")
        r = self.app.post('/api/tasks/submit', json={
            'user_id': st_user['id'],
            'specialty_slug': 'it',
            'task_number': 1,
            'score': 100,
            'repo_url': 'javascript:alert(1)'
        })
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.get_json().get('code'), 'INVALID_REPO_URL')

    def test_10_svg_upload_rejected_400(self):
        self.register_and_login_student("student.stage1@stage1.kz")
        svg_content = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert('xss')</script></svg>"
        data = {
            'file': (io.BytesIO(svg_content), 'payload.svg')
        }
        r = self.app.post('/api/tasks/upload', data=data, content_type='multipart/form-data')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.get_json().get('code'), 'EXTENSION_NOT_ALLOWED')

    def test_11_unauthenticated_protected_endpoints_rejected_401(self):
        self.app.post('/api/auth/logout')

        # 1. /api/tasks/progress
        r1 = self.app.post('/api/tasks/progress', json={'task_number': 1})
        self.assertEqual(r1.status_code, 401)

        # 2. /api/tasks/submit
        r2 = self.app.post('/api/tasks/submit', json={'task_number': 1})
        self.assertEqual(r2.status_code, 401)

        # 3. /api/demo/reset
        r3 = self.app.post('/api/demo/reset')
        self.assertEqual(r3.status_code, 401)

        # 4. /api/tasks/upload
        r4 = self.app.post('/api/tasks/upload', data={'file': (io.BytesIO(b'test'), 'test.png')}, content_type='multipart/form-data')
        self.assertEqual(r4.status_code, 401)

    def test_12_demo_reset_clears_xp_and_quests(self):
        st_user = self.register_and_login_student("student.stage1@stage1.kz")
        uid = st_user['id']

        # Add mock XP and log records for demo student
        conn = sqlite3.connect(server.DB_PATH)
        try:
            conn.execute("INSERT INTO xp_transactions (user_id, amount, source_type, source_id, description, created_at) VALUES (?, 100, 'test', 's1', 'Test XP', 1700000000)", (uid,))
            conn.execute("INSERT INTO daily_quests_log (user_id, quest_key, quest_date, completed_at) VALUES (?, 'q1', '2026-11-07', 1700000000)", (uid,))
            conn.execute("UPDATE users SET is_demo = 1, bonus_xp = 100, streak_days = 5 WHERE id = ?", (uid,))
            conn.commit()
        finally:
            conn.close()

        reset_resp = self.app.post('/api/demo/reset', json={'user_id': uid})
        self.assertEqual(reset_resp.status_code, 200)

        conn = sqlite3.connect(server.DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM xp_transactions WHERE user_id = ?", (uid,))
        xp_cnt = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM daily_quests_log WHERE user_id = ?", (uid,))
        quest_cnt = cur.fetchone()[0]
        cur.execute("SELECT bonus_xp, streak_days FROM users WHERE id = ?", (uid,))
        user_row = cur.fetchone()
        conn.close()

        self.assertEqual(xp_cnt, 0)
        self.assertEqual(quest_cnt, 0)
        self.assertEqual(user_row[0], 0)
        self.assertEqual(user_row[1], 1)


if __name__ == '__main__':
    unittest.main()
