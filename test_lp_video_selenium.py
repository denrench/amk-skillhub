import time
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By

def run_test():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1440,900")
    options.add_argument("--autoplay-policy=no-user-gesture-required")

    driver = webdriver.Edge(options=options)
    try:
        # 1. Establish session
        driver.get("http://127.0.0.1:5000/auth.html")
        time.sleep(1)

        login_res = driver.execute_async_script("""
            const cb = arguments[arguments.length - 1];
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email: 'student@amk.kz', password: 'student123'})
            }).then(r => r.json()).then(data => {
                if (data.success && data.user) {
                    localStorage.setItem('eduspace_active_session_v3', JSON.stringify(data.user));
                }
                cb(data);
            }).catch(e => cb({error: e.toString()}));
        """)
        assert login_res.get('success') is True, f"Login failed: {login_res}"
        print("[OK] Logged in student for Lesson Player QA")

        url = "http://127.0.0.1:5000/lesson_player.html?lesson_id=1"
        print(f"Navigating to {url}...")
        driver.get(url)
        time.sleep(2)

        # 1. Verify Lesson Title
        h1_title = driver.find_element(By.ID, "lp-lesson-title").text
        print(f"[OK] Lesson Title: '{h1_title}'")
        assert len(h1_title) > 5, "Lesson title not loaded!"

        # 2. Jump directly to Theory & Video Block (index 2)
        print("Jumping directly to Block 2 (Theory & Video)...")
        driver.execute_script("jumpToBlock(2);")
        time.sleep(1)

        # 3. Check Video element
        vid = driver.find_element(By.ID, "lp-lecture-video")
        assert vid is not None, "Video element #lp-lecture-video not found!"
        src = driver.execute_script("return arguments[0].currentSrc || arguments[0].src;", vid)
        print(f"[OK] Lp Video source: {src}")

        # 4. Play video
        print("Playing lesson video...")
        driver.execute_script("togglePlayLpVideo();")
        time.sleep(1.5)

        is_paused = driver.execute_script("return arguments[0].paused;", vid)
        cur_time = driver.execute_script("return arguments[0].currentTime;", vid)
        print(f"[OK] Video state: paused={is_paused}, currentTime={cur_time:.2f}s")
        assert not is_paused, "Lesson player video failed to play!"
        assert cur_time >= 0.05, "Current time did not advance!"

        # 5. Speed switch
        print("Setting speed to 1.5x...")
        driver.execute_script("setLpVideoSpeed(1.5);")
        time.sleep(0.5)
        rate = driver.execute_script("return arguments[0].playbackRate;", vid)
        assert rate == 1.5, f"Expected 1.5x speed, got {rate}"
        print(f"[OK] Video rate: {rate}")

        # 6. Seek timecode
        print("Seeking timecode 15s...")
        driver.execute_script("seekLpLectureTime(15);")
        time.sleep(1)
        cur_after_seek = driver.execute_script("return arguments[0].currentTime;", vid)
        print(f"[OK] Time after seek(15): {cur_after_seek:.2f}s")
        assert cur_after_seek >= 14.0, f"Seek did not reach ~15s: {cur_after_seek}"

        # 7. Pause video
        driver.execute_script("togglePlayLpVideo();")
        time.sleep(0.5)
        is_paused_now = driver.execute_script("return arguments[0].paused;", vid)
        assert is_paused_now, "Video should be paused!"
        print("[OK] Video successfully paused")

        # 8. Sub-tab toggle: switch to notes and back
        print("Switching to text notes sub-tab...")
        driver.execute_script("switchLpTheoryView('text');")
        time.sleep(0.5)
        t_box_hidden = driver.execute_script("return document.getElementById('lp-theory-text-box').classList.contains('hidden');")
        v_box_hidden = driver.execute_script("return document.getElementById('lp-theory-video-box').classList.contains('hidden');")
        assert not t_box_hidden and v_box_hidden, "Notes should be visible and video hidden!"
        print("[OK] Notes tab active")

        driver.execute_script("switchLpTheoryView('video');")
        time.sleep(0.5)
        v_box_hidden_again = driver.execute_script("return document.getElementById('lp-theory-video-box').classList.contains('hidden');")
        assert not v_box_hidden_again, "Video tab should be visible again!"
        print("[OK] Video tab reactivated")

        # 9. Test Fallback Mode (e.g. GitHub Pages offline mode)
        print("\nTesting GitHub Pages offline/curriculum fallback mode...")
        driver.get("http://127.0.0.1:5000/lesson_player.html?lesson_id=999&specialty=it")
        time.sleep(2)
        fallback_title = driver.find_element(By.ID, "lp-lesson-title").text
        print(f"[OK] Fallback lesson title: '{fallback_title}'")
        assert len(fallback_title) > 0 and "не удалось" not in fallback_title.lower(), "Fallback lesson failed to load!"

        # Jump directly to theory block (block 2, zero-indexed)
        driver.execute_script("jumpToBlock(2);")
        time.sleep(1)
        fallback_vid = driver.find_element(By.ID, "lp-lecture-video")
        assert fallback_vid is not None, "Fallback lesson video element not found!"
        print("[OK] Fallback lesson video verified!")

        # 10. Verify severe JS console errors
        logs = driver.get_log("browser")
        severe_errors = [l for l in logs if l['level'] == 'SEVERE' and 'favicon' not in l['message'] and '999' not in l['message']]
        print(f"[OK] Browser severe errors count: {len(severe_errors)}")
        for err in severe_errors:
            print("  [ERROR]", err['message'])
        assert len(severe_errors) == 0, f"Found severe errors: {severe_errors}"

        print("\n=== [SUCCESS] LESSON_PLAYER VIDEO & FALLBACK TESTS PASSED 100%! ===")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
