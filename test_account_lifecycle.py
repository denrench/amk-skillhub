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


if __name__ == '__main__':
    unittest.main()
