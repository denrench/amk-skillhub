import os
import server

app = server.app.test_client()

# 1. Health
r = app.get('/api/health')
assert r.status_code == 200, 'Health check failed'
print('Test 1: Health OK')

# 2. Get Tasks
r = app.get('/api/tasks?specialty=it')
assert r.status_code == 200, 'Tasks query failed'
assert r.get_json()['count'] == 10, 'Should have 10 IT tasks'
print('Test 2: Tasks OK (10 IT tasks)')

# 3. Exam Mode Tasks
r = app.get('/api/tasks?mode=exam&ticket=1')
assert r.status_code == 200, 'Exam tasks failed'
assert r.get_json()['count'] == 5, 'Ticket 1 should have 5 tasks'
print('Test 3: Exam Ticket 1 OK (5 tasks)')

# 4. Auth: Login
r = app.post('/api/auth/login', json={'email': 'student@amk.kz', 'password': 'student123'})
assert r.status_code == 200, 'Login failed'
user = r.get_json()['user']
print('Test 4: Login OK')

# 5. Submit task
r = app.post('/api/tasks/submit', json={
    'user_id': user['id'],
    'student_id': user['student_id'],
    'specialty_slug': 'it',
    'task_number': 1,
    'task_title': 'QuickSort V8',
    'score': 100,
    'time_spent_seconds': 120,
    'submitted_code': 'function quickSort() { ... }'
})
assert r.status_code == 200, 'Submit task failed'
print('Test 5: Submit task OK')

# 6. Teacher Journal & Stats
r = app.get('/api/teacher/journal')
assert r.status_code == 200, 'Journal failed'
print('Test 6: Teacher journal OK')

r = app.get('/api/teacher/stats')
assert r.status_code == 200, 'Teacher stats failed'
print('Test 7: Teacher stats OK')

# 7. Check static routes
assert app.get('/').status_code == 200, 'Index route failed'
assert app.get('/simulator.html').status_code == 200, 'Simulator route failed'
assert app.get('/teacher.html').status_code == 200, 'Teacher route failed'
assert app.get('/auth.html').status_code == 200, 'Auth route failed'
print('Test 8: Static HTML pages OK (All 200)')

print('SUCCESS: ALL TESTS COMPLETED WITHOUT ERROR!')
