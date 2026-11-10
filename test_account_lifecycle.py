import unittest
from unittest.mock import patch

import server


def database_query(statement, parameters, *, fetch=False):
    with server.app.app_context():
        db = server.get_db()
        cursor = db.cursor()
        cursor.execute(statement, parameters)
        result = cursor.fetchone() if fetch else None
        db.commit()
        return result


class AccountLifecycleTest(unittest.TestCase):
    def test_database_file_is_not_a_public_asset(self):
        client = server.app.test_client()
        self.assertIn(client.get('/database.db').status_code, (403, 404))
        root = server.BASE_DIR.replace('\\', '/').split('/')[-1]
        self.assertIn(client.get(f'/{root}/database.db').status_code, (403, 404))

    def test_registration_recovery_and_sessions(self):
        email = 'skillhub.lifecycle@example.org'
        password = 'InitialPass2026!'
        replacement = 'ChangedPass2026!'
        messages = []
        registered = {}

        def deliver(address, code, purpose):
            messages.append((address, code, purpose))
            return True

        def clean():
            if registered:
                user_id = registered['id']
                database_query("DELETE FROM lesson_block_progress WHERE user_id = ?", (user_id,))
                database_query("DELETE FROM notifications WHERE user_id = ?", (user_id,))
                database_query("DELETE FROM enrollments WHERE user_id = ?", (user_id,))
                database_query("DELETE FROM users WHERE id = ?", (user_id,))
            database_query("DELETE FROM email_verifications WHERE email = ?", (email,))

        self.addCleanup(clean)
        client = server.app.test_client()
        second = server.app.test_client()
        outsider = server.app.test_client()
        info = {
            'email': email, 'password': password,
            'first_name': 'Данияр', 'last_name': 'Тестов',
        }
        with patch.object(server, 'deliver_auth_code', side_effect=deliver):
            sent = client.post('/api/auth/send_code', json={'email': email})
            self.assertEqual(sent.status_code, 200)
            self.assertEqual(len(messages), 1)
            code = messages[0][1]
            self.assertNotIn(code, sent.get_data(as_text=True))
            stored = database_query("SELECT code FROM email_verifications WHERE email = ?", (email,), fetch=True)['code']
            self.assertNotEqual(stored, code)
            self.assertEqual(client.post('/api/auth/send_code', json={'email': email}).status_code, 429)
            self.assertEqual(client.post('/api/auth/verify_code', json={'email': email, 'code': code}).status_code, 200)
            self.assertEqual(outsider.post('/api/auth/register', json=info).status_code, 400)
            result = client.post('/api/auth/register', json=info)
            self.assertEqual(result.status_code, 201, result.get_json())
            registered.update(result.get_json()['user'])
            self.assertTrue(client.get('/api/auth/session').get_json()['authenticated'])
            self.assertEqual(second.post('/api/auth/login', json={'email': email, 'password': password}).status_code, 200)
            self.assertEqual(outsider.get('/api/academy/progress').status_code, 401)
            lesson = {'specialty': 'it', 'lesson': 1}
            self.assertEqual(client.post('/api/academy/progress', json=lesson).status_code, 200)
            self.assertEqual(second.get('/api/academy/progress').get_json()['completed'], ['it:1'])

            self.assertEqual(second.post('/api/auth/send_code', json={'email': email, 'purpose': 'reset'}).status_code, 200)
            reset_code = messages[-1][1]
            self.assertEqual(second.post('/api/auth/verify_code', json={'email': email, 'code': reset_code}).status_code, 400)
            reset = {'email': email, 'code': reset_code, 'new_password': replacement}
            self.assertEqual(second.post('/api/auth/reset_password', json=reset).status_code, 200)
            self.assertFalse(client.get('/api/auth/session').get_json()['authenticated'])
            self.assertEqual(second.post('/api/auth/reset_password', json=reset).status_code, 400)
            self.assertEqual(second.post('/api/auth/login', json={'email': email, 'password': password}).status_code, 401)
            self.assertEqual(second.post('/api/auth/login', json={'email': email, 'password': replacement}).status_code, 200)
            self.assertEqual(second.post('/api/auth/logout').status_code, 200)
            self.assertFalse(second.get('/api/auth/session').get_json()['authenticated'])

    def test_failed_delivery_and_wrong_attempt_limit(self):
        email = 'skillhub.attempts@example.org'
        codes = []

        def clean():
            database_query("DELETE FROM email_verifications WHERE email = ?", (email,))

        clean()
        self.addCleanup(clean)
        client = server.app.test_client()
        with patch.object(server, 'deliver_auth_code', return_value=False):
            self.assertEqual(client.post('/api/auth/send_code', json={'email': email}).status_code, 503)
        with patch.object(server, 'deliver_auth_code', side_effect=lambda _, code, purpose: codes.append(code) or True):
            self.assertEqual(client.post('/api/auth/send_code', json={'email': email}).status_code, 200)
        wrong = '111111' if codes[0] != '111111' else '222222'
        for _ in range(5):
            self.assertEqual(client.post('/api/auth/verify_code', json={'email': email, 'code': wrong}).status_code, 400)
        self.assertEqual(client.post('/api/auth/verify_code', json={'email': email, 'code': codes[0]}).status_code, 400)

    def test_student_data_and_broadcast_read_receipts_are_isolated(self):
        code = {}
        members = []
        title = 'SkillHub isolated notification check'

        def clean():
            database_query("DELETE FROM notifications WHERE title = ?", (title,))
            for member in members:
                database_query("DELETE FROM messages WHERE sender_id = ?", (member['id'],))
                database_query("DELETE FROM teacher_groups WHERE teacher_id = ?", (member['id'],))
                database_query("DELETE FROM notifications WHERE user_id = ?", (member['id'],))
                database_query("DELETE FROM enrollments WHERE user_id = ?", (member['id'],))
                database_query("DELETE FROM users WHERE id = ?", (member['id'],))
            for email in code:
                database_query("DELETE FROM email_verifications WHERE email = ?", (email,))

        def deliver(email, otp, _purpose):
            code[email] = otp
            return True

        self.addCleanup(clean)
        clients = [server.app.test_client(), server.app.test_client()]
        with patch.object(server, 'deliver_auth_code', side_effect=deliver):
            for number, client in enumerate(clients, 1):
                email = f'skillhub.privacy.{number}@example.org'
                self.assertEqual(client.post('/api/auth/send_code', json={'email': email}).status_code, 200)
                registered = client.post('/api/auth/register', json={
                    'email': email, 'password': 'InitialPass2026!', 'first_name': 'Тест',
                    'last_name': 'Учебный', 'group_name': 'Проверка', 'verification_code': code[email],
                })
                self.assertEqual(registered.status_code, 201, registered.get_json())
                members.append(registered.get_json()['user'])

        first, second = clients
        first_id, second_id = [member['id'] for member in members]
        guest = server.app.test_client()
        for path in ('/api/tasks', '/api/courses'):
            self.assertEqual(guest.get(path).status_code, 200)
            self.assertEqual(guest.get(f'{path}?user_id={first_id}').status_code, 401)
            self.assertEqual(first.get(f'{path}?user_id={second_id}').status_code, 403)
            own = first.get(f'{path}?user_id={first_id}')
            self.assertEqual(own.status_code, 200)
            self.assertEqual(own.headers['Cache-Control'], 'no-store')

        database_query("""
            INSERT INTO notifications (user_id, target_role, target_group, title, body)
            VALUES (NULL, 'student', 'Проверка', ?, 'Уведомление группы')
        """, (title,))
        self.assertEqual(guest.get('/api/notifications').status_code, 401)
        self.assertEqual(guest.post('/api/notifications/read').status_code, 401)
        first_items = first.get(f'/api/notifications?user_id={second_id}').get_json()['notifications']
        self.assertIn(first_id, {notice['user_id'] for notice in first_items})
        self.assertNotIn(second_id, {notice['user_id'] for notice in first_items})

        def is_broadcast_read(client):
            notices = client.get('/api/notifications').get_json()['notifications']
            return next(item['is_read'] for item in notices if item['title'] == title)

        self.assertEqual(is_broadcast_read(first), 0)
        self.assertEqual(is_broadcast_read(second), 0)
        self.assertEqual(first.post('/api/notifications/read', json={'user_id': second_id}).status_code, 200)
        self.assertEqual(first.post('/api/notifications/read').status_code, 200)
        self.assertEqual(is_broadcast_read(first), 1)
        self.assertEqual(is_broadcast_read(second), 0)

        self.assertEqual(guest.get('/api/messages').status_code, 401)
        self.assertEqual(guest.post('/api/messages/send', json={'body': 'Test'}).status_code, 401)
        self.assertEqual(first.get(f'/api/messages?peer_id={second_id}').status_code, 403)
        sent = first.post('/api/messages/send', json={
            'body': 'Тестовое обсуждение', 'sender_id': second_id,
            'sender_role': 'teacher', 'recipient_key': 'general',
        })
        self.assertEqual(sent.status_code, 200, sent.get_json())
        message = sent.get_json()['message']
        self.assertEqual(message['sender_id'], first_id)
        self.assertEqual(message['sender_role'], 'student')
        discussion = second.get('/api/messages?recipient_key=general')
        self.assertEqual(discussion.headers['Cache-Control'], 'no-store')
        self.assertIn(message['id'], {item['id'] for item in discussion.get_json()['messages']})

        database_query("UPDATE users SET role = 'teacher' WHERE id = ?", (second_id,))
        database_query("""
            INSERT INTO teacher_groups (teacher_id, group_name, specialty_slug)
            VALUES (?, 'Проверка', 'it')
        """, (second_id,))
        private = second.post('/api/messages/send', json={'body': 'Личное сообщение', 'peer_id': first_id})
        self.assertEqual(private.status_code, 200, private.get_json())
        private_id = private.get_json()['message']['id']
        direct = first.get(f'/api/messages?peer_id={second_id}').get_json()['messages']
        self.assertIn(private_id, {item['id'] for item in direct})
        course = first.get('/api/messages').get_json()['messages']
        self.assertNotIn(private_id, {item['id'] for item in course})


if __name__ == '__main__':
    unittest.main()
