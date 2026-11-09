from server import app

client = app.test_client()

pages = [
    'about.html', 'admin.html', 'auth.html', 'career.html', 'features.html',
    'gradebook.html', 'index.html', 'lesson_player.html', 'mission.html',
    'pricing.html', 'profile.html', 'reviews.html', 'simulator.html',
    'student.html', 'tasks.html', 'teacher.html', 'tools.html', 'verify.html'
]

print("=== CHECKING ALL 18 HTML PAGES ===")
for p in pages:
    res = client.get(f'/{p}', follow_redirects=True)
    assert res.status_code == 200, f"Page {p} returned {res.status_code}"
    body = res.get_data(as_text=True)
    assert len(body) > 500, f"Page {p} seems truncated (len={len(body)})"
    assert "<!DOCTYPE html>" in body or "<html" in body
    print(f"[OK] /{p}: HTTP 200, size: {len(body):,} chars")

print("ALL 18 PAGES VERIFIED WITH ZERO ERRORS!")
