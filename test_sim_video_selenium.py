import time
import json
import sys
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
    options.add_argument("--guest")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Edge(options=options)
    try:
        # 1. Establish origin and log in through official API
        driver.get("http://127.0.0.1:5000/auth.html")
        time.sleep(1)

        login_res = driver.execute_async_script("""
            const callback = arguments[arguments.length - 1];
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email: 'student@amk.kz', password: 'student123'})
            }).then(r => r.json()).then(data => {
                if (data.success && data.user) {
                    localStorage.setItem('eduspace_active_session_v3', JSON.stringify(data.user));
                    localStorage.setItem('edu_active_user', JSON.stringify(data.user));
                }
                callback(data);
            }).catch(err => callback({error: err.toString()}));
        """)
        print("[OK] Login result:", login_res.get('success'), login_res.get('user', {}).get('email'))
        assert login_res.get('success') is True, f"Login failed: {login_res}"

        # 2. Navigate to simulator
        url = "http://127.0.0.1:5000/simulator.html?specialty=it&task=1"
        print(f"Navigating to {url}...")
        driver.get(url)
        time.sleep(2)

        # Verify no auth guard
        guards = driver.find_elements(By.ID, "edu-auth-guard")
        assert len(guards) == 0 or not guards[0].is_displayed(), "Auth guard shouldn't be active for logged-in user!"

        # 3. Check video element existence
        vid = driver.find_element(By.ID, "active-lecture-video")
        assert vid is not None, "Video element #active-lecture-video not found!"
        print("[OK] Found #active-lecture-video in DOM")

        # Check currentSrc / src
        src = driver.execute_script("return arguments[0].currentSrc || arguments[0].src;", vid)
        print(f"[OK] Video source: {src}")
        assert "sample-lesson.mp4" in src or "flower.mp4" in src or ".mp4" in src, f"Unexpected source: {src}"

        # 4. Trigger play
        print("Triggering togglePlayLectureVideo()...")
        driver.execute_script("togglePlayLectureVideo();")
        time.sleep(2)

        is_paused = driver.execute_script("return arguments[0].paused;", vid)
        cur_time = driver.execute_script("return arguments[0].currentTime;", vid)
        print(f"[OK] Video state: paused={is_paused}, currentTime={cur_time:.2f}s")
        assert not is_paused, "Video failed to start playing!"
        assert cur_time >= 0.05, f"Video currentTime did not advance: {cur_time}"

        # 5. Test Speed Change
        print("Testing playback speed change to 1.5x...")
        driver.execute_script("setVideoSpeed(1.5);")
        time.sleep(0.5)
        rate = driver.execute_script("return arguments[0].playbackRate;", vid)
        print(f"[OK] Video playbackRate: {rate}")
        assert rate == 1.5, f"Expected playbackRate 1.5, got {rate}"

        # 6. Test Seek Timecode
        print("Testing seekLectureTime(15)...")
        driver.execute_script("seekLectureTime(15);")
        time.sleep(1)
        cur_time_after_seek = driver.execute_script("return arguments[0].currentTime;", vid)
        print(f"[OK] Video currentTime after seek(15): {cur_time_after_seek:.2f}s")
        assert cur_time_after_seek >= 14.0, f"Seek did not jump to ~15s: {cur_time_after_seek}"

        # 7. Test Pause
        print("Testing pause via togglePlayLectureVideo()...")
        driver.execute_script("togglePlayLectureVideo();")
        time.sleep(0.5)
        is_paused_now = driver.execute_script("return arguments[0].paused;", vid)
        print(f"[OK] Video paused state: {is_paused_now}")
        assert is_paused_now, "Video should be paused after toggling play/pause again!"

        # 8. Check Video Title and Description were populated
        v_title = driver.find_element(By.ID, "lecture-video-title").text
        v_desc = driver.find_element(By.ID, "lecture-video-desc").text
        print(f"[OK] Rendered Video Title: '{v_title}'")
        assert len(v_title) > 5, "Video title was not populated!"

        # 9. Check browser console logs
        logs = driver.get_log("browser")
        severe_errors = [l for l in logs if l['level'] == 'SEVERE' and 'favicon' not in l['message']]
        print(f"[OK] Browser severe errors count: {len(severe_errors)}")
        for err in severe_errors:
            print("  [ERROR]", err['message'])
        assert len(severe_errors) == 0, f"Found severe errors: {severe_errors}"

        print("\n=== [SUCCESS] SIMULATOR VIDEO TESTS PASSED WITH 100% REAL BROWSER ASSERTIONS! ===")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
