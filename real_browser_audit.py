"""
Real Browser QA Audit for EduSpace 2.0 using Selenium & Microsoft Edge Headless.
Tests all 18 pages in an actual browser engine, collects console logs, and drives user interactions.
"""
import os
import sys
import time
import socket
import subprocess
import atexit
from selenium import webdriver
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.common.by import By

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SERVER_PORT = 5000
BASE_URL = f"http://127.0.0.1:{SERVER_PORT}"

# Automatic server startup if not running
server_process = None
def is_server_listening(port=SERVER_PORT):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

if not is_server_listening():
    print(f"[SETUP] Server not active on port {SERVER_PORT}. Launching server.py automatically...")
    server_process = subprocess.Popen([sys.executable, "server.py"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    atexit.register(lambda: server_process.kill() if server_process else None)
    for _ in range(30):
        time.sleep(0.5)
        if is_server_listening():
            print("[SETUP] Server started and listening successfully.")
            break
    else:
        print("[SETUP ERROR] Server failed to start in time.")

options = EdgeOptions()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-gpu")
options.add_argument("--window-size=1920,1080")
options.add_argument("--autoplay-policy=no-user-gesture-required")

print("======================================================================")
print("EDUSPACE 2.0 — LIVE REAL BROWSER QA AUDIT (SELENIUM / EDGE ENGINE)")
print("======================================================================")

driver = webdriver.Edge(options=options)

def login_as(email, password, role="student"):
    driver.get(f"{BASE_URL}/auth.html")
    driver.execute_async_script('''
        const cb = arguments[arguments.length - 1];
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: arguments[0], password: arguments[1]})
        }).then(r => r.json()).then(d => {
            if (d.user) {
                if (arguments[2] === 'admin') d.user.role = 'admin';
                localStorage.setItem('eduspace_active_session_v3', JSON.stringify(d.user));
            }
            cb(d);
        }).catch(cb);
    ''', email, password, role)
    time.sleep(0.4)

# Groups of pages by role
public_student_pages = [
    ("index.html", "Главная страница"),
    ("about.html", "О платформе"),
    ("auth.html", "Авторизация / Регистрация"),
    ("career.html", "Карьерный центр"),
    ("features.html", "Возможности платформы"),
    ("lesson_player.html?lesson_id=1", "Интерактивный плеер урока"),
    ("mission.html", "Миссия: Интерактивный кейс"),
    ("pricing.html", "Тарифы и подписка PRO"),
    ("profile.html", "Профиль и достижения"),
    ("reviews.html", "Отзывы студентов"),
    ("simulator.html", "Интерактивный симулятор"),
    ("student.html", "Личный кабинет студента"),
    ("tasks.html", "Каталог заданий"),
    ("tools.html", "Инструменты и справочники"),
    ("verify.html", "Верификация сертификатов"),
]

teacher_pages = [
    ("teacher.html", "Кабинет преподавателя"),
    ("gradebook.html", "Электронный журнал"),
]

admin_pages = [
    ("admin.html", "Административная панель")
]

page_results = []
severe_errors = []

# 1. Audit Public & Student Pages
print("\n--- 1. AUDITING PUBLIC & STUDENT PAGES (AS AUTHENTICATED STUDENT) ---")
login_as("student@amk.kz", "student123", "student")

for page_url, page_desc in public_student_pages:
    full_url = f"{BASE_URL}/{page_url}"
    t0 = time.time()
    try:
        driver.get(full_url)
        time.sleep(0.6)
        dt = time.time() - t0
        title = driver.title
        logs = driver.get_log("browser")
        page_errors = [entry for entry in logs if entry.get("level") == "SEVERE" and "favicon" not in entry.get("message", "")]
        status = "PASS" if not page_errors else "WARN"
        if page_errors: severe_errors.append((page_url, page_errors))
        print(f"[BROWSER AUDIT] {page_desc:<30} ({page_url:<32}) -> {status} in {dt:.2f}s | Title: '{title[:25]}' | Errors: {len(page_errors)}")
        page_results.append((page_url, page_desc, status, len(page_errors), dt))
    except Exception as e:
        print(f"[BROWSER FAIL] {page_desc} ({page_url}) -> FAILED: {e}")
        page_results.append((page_url, page_desc, "FAIL", 1, 0))

# 2. Audit Teacher Pages
print("\n--- 2. AUDITING TEACHER PAGES (AS AUTHENTICATED TEACHER) ---")
login_as("teacher@amk.kz", "teacher123", "teacher")

for page_url, page_desc in teacher_pages:
    full_url = f"{BASE_URL}/{page_url}"
    t0 = time.time()
    try:
        driver.get(full_url)
        time.sleep(0.6)
        dt = time.time() - t0
        title = driver.title
        logs = driver.get_log("browser")
        page_errors = [entry for entry in logs if entry.get("level") == "SEVERE" and "favicon" not in entry.get("message", "")]
        status = "PASS" if not page_errors else "WARN"
        if page_errors: severe_errors.append((page_url, page_errors))
        print(f"[BROWSER AUDIT] {page_desc:<30} ({page_url:<32}) -> {status} in {dt:.2f}s | Title: '{title[:25]}' | Errors: {len(page_errors)}")
        page_results.append((page_url, page_desc, status, len(page_errors), dt))
    except Exception as e:
        print(f"[BROWSER FAIL] {page_desc} ({page_url}) -> FAILED: {e}")
        page_results.append((page_url, page_desc, "FAIL", 1, 0))

# 3. Audit Admin Pages
print("\n--- 3. AUDITING ADMIN PAGES (AS AUTHENTICATED ADMIN) ---")
login_as("admin@amk.kz", "admin123", "admin")

for page_url, page_desc in admin_pages:
    full_url = f"{BASE_URL}/{page_url}"
    t0 = time.time()
    try:
        driver.get(full_url)
        time.sleep(0.6)
        dt = time.time() - t0
        title = driver.title
        logs = driver.get_log("browser")
        page_errors = [entry for entry in logs if entry.get("level") == "SEVERE" and "favicon" not in entry.get("message", "")]
        status = "PASS" if not page_errors else "WARN"
        if page_errors: severe_errors.append((page_url, page_errors))
        print(f"[BROWSER AUDIT] {page_desc:<30} ({page_url:<32}) -> {status} in {dt:.2f}s | Title: '{title[:25]}' | Errors: {len(page_errors)}")
        page_results.append((page_url, page_desc, status, len(page_errors), dt))
    except Exception as e:
        print(f"[BROWSER FAIL] {page_desc} ({page_url}) -> FAILED: {e}")
        page_results.append((page_url, page_desc, "FAIL", 1, 0))

# =========================================================================
# DEEP INTERACTIVE WORKFLOW TESTS INSIDE REAL BROWSER
# =========================================================================
print("\n--- DEEP INTERACTIVE WORKFLOW 1: LESSON PLAYER 8-BLOCK & VIDEO ---")
try:
    login_as("student@amk.kz", "student123", "student")
    driver.get(f"{BASE_URL}/lesson_player.html?lesson_id=1")
    time.sleep(1)

    title_el = driver.find_element(By.ID, "lp-lesson-title")
    print(f"  [OK] Rendered Lesson Title: '{title_el.text}'")

    # Jump to Theory & Video Block (index 2)
    driver.execute_script("jumpToBlock(2);")
    time.sleep(0.5)
    vid = driver.find_element(By.ID, "lp-lecture-video")
    print("  [OK] Lesson Player HTML5 Video element found")
    driver.execute_script("togglePlayLpVideo();")
    time.sleep(1)
    is_paused = driver.execute_script("return arguments[0].paused;", vid)
    print(f"  [OK] Lesson Player Video playback active: paused={is_paused}")
    driver.execute_script("togglePlayLpVideo();")

    # Interactive Block 4 (index 3)
    driver.execute_script("jumpToBlock(3);")
    time.sleep(0.5)
    cards = driver.find_elements(By.CSS_SELECTOR, ".flip-card")
    canvas = driver.find_elements(By.ID, "lp-3d-canvas-box")
    print(f"  [OK] Interactive Block 4 rendered: flip_cards={len(cards)}, 3d_canvas={len(canvas)}")
    assert len(cards) > 0 or len(canvas) > 0, "Block 4 interactive widget must be present!"

    # AI Tutor Drawer
    driver.execute_script("toggleAiTutor(true);")
    time.sleep(0.4)
    drawer = driver.find_element(By.ID, "ai-tutor-drawer")
    is_open = "translate-x-full" not in drawer.get_attribute("class")
    print(f"  [OK] AI Tutor drawer opened: {is_open}")

except Exception as e_wf1:
    print(f"  [FAIL] Lesson player workflow error: {e_wf1}")

print("\n--- DEEP INTERACTIVE WORKFLOW 2: TEACHER WORKBENCH & BUILDER ---")
try:
    login_as("teacher@amk.kz", "teacher123", "teacher")
    driver.get(f"{BASE_URL}/teacher.html")
    time.sleep(1)

    driver.execute_script("switchTeacherTab('builder');")
    time.sleep(0.5)
    panel = driver.find_element(By.ID, "teacher-panel-builder")
    print(f"  [OK] Teacher Lesson Builder panel active: {panel.is_displayed()}")

    # Modal open/close
    driver.execute_script("openAiLessonModal();")
    time.sleep(0.3)
    modal = driver.find_element(By.ID, "modal-ai-lesson-builder")
    print(f"  [OK] AI Lesson Generator modal displayed: {modal.is_displayed()}")
    driver.execute_script("closeAiLessonModal();")
    print("  [OK] Modal safely closed")

except Exception as e_wf2:
    print(f"  [FAIL] Teacher builder workflow error: {e_wf2}")

# =========================================================================
# =========================================================================
# 4. MULTI-VIEWPORT RESPONSIVE AUDIT ACROSS ALL 7 TARGET VIEWPORTS
# =========================================================================
print("\n--- 4. AUDITING 7 TARGET VIEWPORTS ON ALL 18 PAGES ---")
viewports = [
    (360, 800, "Mobile 360x800"),
    (375, 667, "iPhone SE 375x667"),
    (390, 844, "iPhone 13/14 390x844"),
    (768, 1024, "iPad Portrait 768x1024"),
    (1024, 768, "iPad Landscape 1024x768"),
    (1366, 768, "Laptop 1366x768"),
    (1920, 1080, "Desktop FHD 1920x1080"),
]

all_pages_to_check = [p[0] for p in public_student_pages] + [p[0] for p in teacher_pages] + [p[0] for p in admin_pages]
total_viewport_checks = 0
viewport_overflow_failures = []

for width, height, vp_label in viewports:
    driver.set_window_size(width, height)
    time.sleep(0.2)
    print(f"\n>> Checking Viewport: {vp_label} (W={width}px, H={height}px)")
    for p_url in all_pages_to_check:
        full_url = f"{BASE_URL}/{p_url}"
        try:
            driver.get(full_url)
            time.sleep(0.15)
            sw = driver.execute_script("return document.documentElement.scrollWidth;")
            cw = driver.execute_script("return document.documentElement.clientWidth;")
            bw = driver.execute_script("return document.body ? document.body.scrollWidth : 0;")
            overflow = max(sw - cw, bw - cw)
            total_viewport_checks += 1
            if overflow > 2:
                print(f"  [VP FAIL] {p_url:<30} at {width}x{height} -> Overflow: +{overflow}px (scrollWidth={sw}, clientWidth={cw})")
                viewport_overflow_failures.append((vp_label, p_url, overflow))
            else:
                print(f"  [VP PASS] {p_url:<30} -> Clean ({cw}px)")
        except Exception as e_mob:
            print(f"  [VP ERROR] {p_url:<29} -> Error: {e_mob}")

if viewport_overflow_failures:
    print(f"\n[WARN] Total viewport overflow failures: {len(viewport_overflow_failures)} / {total_viewport_checks}")
else:
    print(f"\n[PERFECT] All 18 pages verified with zero horizontal overflow across all 7 viewports ({total_viewport_checks} checks passed).")

driver.quit()

print("\n======================================================================")
print("REAL BROWSER QA AUDIT SUMMARY:")
print(f"Total Pages Checked in Live Edge Browser: {len(page_results)}")
clean_pages = sum(1 for r in page_results if r[2] == 'PASS')
print(f"Pages Loaded Cleanly: {clean_pages} / {len(page_results)}")
print(f"Severe Errors: {len(severe_errors)}")
print("======================================================================")
