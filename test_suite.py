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
assert app.get('/student.html').status_code == 200, 'Student route failed'
assert app.get('/profile.html').status_code == 200, 'Profile route failed'
assert app.get('/tasks.html').status_code == 200, 'Tasks route failed'
assert app.get('/features.html').status_code == 200, 'Features route failed'
assert app.get('/about.html').status_code == 200, 'About route failed'
assert app.get('/pricing.html').status_code == 200, 'Pricing route failed'
assert app.get('/reviews.html').status_code == 200, 'Reviews route failed'
print('Test 8: Static HTML pages OK (All 11 Stitch pages return 200)')


# 9. Test Gradual Task Unlocking & Server-side Security
# On Day 1: Task 1 must be available, Task 2 must be locked
r = app.get('/api/tasks?specialty=it')
tasks = r.get_json()['tasks']
t1 = next(t for t in tasks if t['task_number'] == 1)
t2 = next(t for t in tasks if t['task_number'] == 2)
assert t1['is_locked'] == False, 'Task 1 should be unlocked on Day 1'
assert t2['is_locked'] == True, 'Task 2 should be LOCKED on Day 1'
print('Test 9: Schedule check OK (Task 1 unlocked, Task 2 locked)')

# 10. Attempting to submit locked Task 2 must return HTTP 403 Forbidden
r = app.post('/api/tasks/submit', json={
    'user_id': user['id'],
    'specialty_slug': 'it',
    'task_number': 2,
    'score': 100,
    'submitted_code': 'malicious bypass'
})
assert r.status_code == 403, 'Submitting locked task must be blocked with HTTP 403'
assert r.get_json()['is_locked'] == True, 'Response must confirm task is locked'
print('Test 10: Server-side Security OK (Locked task submission blocked with 403)')

# 11. Test Demo Reset to Day 1 (Absolute Zero)
r = app.post('/api/demo/reset')
assert r.status_code == 200, 'Demo reset failed'
r_stat = app.get('/api/demo/status')
status_data = r_stat.get_json()
assert status_data['progress_percent'] == 0, 'Progress must be 0% after reset'
assert status_data['completed_count'] == 0, 'Completed count must be 0'
assert status_data['current_study_day'] == 1, 'Current study day must be 1'
print('Test 11: Demo Reset OK (Starts from 0% on Day 1)')

# 12. Test Teacher Advance Day (Day 1 -> Day 2)
r = app.post('/api/teacher/advance_day', json={'day': 2})
assert r.status_code == 200, 'Advance day failed'
r = app.get('/api/tasks?specialty=it')
tasks = r.get_json()['tasks']
t2 = next(t for t in tasks if t['task_number'] == 2)
assert t2['is_locked'] == False, 'Task 2 should be UNLOCKED on Day 2'
print('Test 12: Teacher Advance Day OK (Task 2 now unlocked on Day 2)')

# Reset back to Day 1 for clean demo start
app.post('/api/demo/reset')
print('Demo reset back to Day 1')

print('SUCCESS: ALL 12 TESTS COMPLETED WITHOUT ERROR!')
