import time
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def check_starter_lesson_game_and_practice(driver, wait):
    lesson_id = driver.execute_async_script("""
        const done = arguments[0];
        fetch('/api/lessons?specialty_slug=autoelectric')
            .then(response => response.json())
            .then(data => done(data.lessons.find(lesson =>
                lesson.order_num === 3 && lesson.title.includes('системы пуска')
            )?.id ?? null))
            .catch(() => done(null));
    """)
    assert isinstance(lesson_id, int), "Starter pilot is missing from the catalog"
    driver.get(f"http://127.0.0.1:5000/lesson_player.html?lesson_id={lesson_id}&specialty=autoelectric&task=3")
    wait.until(lambda browser: browser.find_element(By.CSS_SELECTOR, "body.starter-lesson"))
    driver.find_element(By.ID, "step-btn-2").click()
    wait.until(lambda browser: browser.find_element(By.CSS_SELECTOR, "#lp-topic-game-mount .tge-shell"))
    assert len(driver.find_elements(By.CSS_SELECTOR, ".starter-video")) == 0, "Stale starter video must be replaced by Topic Game!"
    driver.find_element(By.ID, "step-btn-3").click()
    wait.until(lambda browser: "стартер" in browser.find_element(By.ID, "lp-block-canvas").text.lower())

def run_test():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--mute-audio")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1440,900")
    options.add_argument("--guest")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Edge(options=options)
    try:
        wait = WebDriverWait(driver, 10)
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

        # 2. Jump directly to Topic Game Block (index 2)
        print("Jumping directly to Block 2 (Topic Game & Notes)...")
        driver.execute_script("jumpToBlock(2);")
        time.sleep(1)

        # 3. Check Topic Game shell & absence of video element
        shell = driver.find_element(By.CSS_SELECTOR, "#lp-topic-game-mount .tge-shell")
        assert shell is not None, "Topic Game not mounted in #lp-topic-game-mount!"
        assert len(driver.find_elements(By.ID, "lp-lecture-video")) == 0, "Stale #lp-lecture-video still present!"
        lbl = driver.find_element(By.ID, "tge-round-label").text
        assert "раунд 1 из 3" in lbl.lower(), f"Unexpected round label: {lbl}"
        print(f"[OK] LP Topic Game mounted: '{lbl}'")

        # 4. Hint toggle & Cheatsheet presence
        driver.execute_script("TopicGameEngine.toggleHint('lp-topic-game-mount');")
        time.sleep(0.3)
        hints = driver.find_elements(By.CSS_SELECTOR, "#lp-topic-game-mount .tge-hint-box")
        assert len(hints) == 1, "Hint failed to display"
        cheatsheet = driver.find_element(By.CSS_SELECTOR, "#lp-theory-game-box details")
        assert "Шпаргалка темы" in cheatsheet.text

        # 5. Sub-tab toggle: switch to notes and back
        print("Switching to text notes sub-tab...")
        driver.execute_script("switchLpTheoryView('text');")
        time.sleep(0.5)
        t_box_hidden = driver.execute_script("return document.getElementById('lp-theory-text-box').classList.contains('hidden');")
        g_box_hidden = driver.execute_script("return document.getElementById('lp-theory-game-box').classList.contains('hidden');")
        assert not t_box_hidden and g_box_hidden, "Notes should be visible and game hidden!"
        print("[OK] Notes tab active")

        driver.execute_script("switchLpTheoryView('game');")
        time.sleep(0.5)
        g_box_hidden_again = driver.execute_script("return document.getElementById('lp-theory-game-box').classList.contains('hidden');")
        assert not g_box_hidden_again, "Game tab should be visible again!"
        print("[OK] Topic Game tab reactivated")

        # 6. Test Fallback Mode (e.g. GitHub Pages offline mode)
        print("\nTesting GitHub Pages offline/curriculum fallback mode...")
        driver.get("http://127.0.0.1:5000/lesson_player.html?lesson_id=999&specialty=it")
        time.sleep(2)
        fallback_title = driver.find_element(By.ID, "lp-lesson-title").text
        print(f"[OK] Fallback lesson title: '{fallback_title}'")
        assert len(fallback_title) > 0 and "не удалось" not in fallback_title.lower(), "Fallback lesson failed to load!"

        driver.execute_script("jumpToBlock(2);")
        time.sleep(1)
        fb_shell = driver.find_element(By.CSS_SELECTOR, "#lp-topic-game-mount .tge-shell")
        assert fb_shell is not None, "Fallback lesson Topic Game not mounted!"
        fb_state = driver.execute_script("return TopicGameEngine.getState('lp-topic-game-mount');")
        assert fb_state and len(fb_state.get("game", {}).get("rounds", [])) == 3
        print("[OK] Local fallback lesson Topic Game verified!")

        # 7. Verify severe JS console errors
        logs = driver.get_log("browser")
        severe_errors = [l for l in logs if l['level'] == 'SEVERE' and 'favicon' not in l['message'] and '999' not in l['message']]
        print(f"[OK] Browser severe errors count: {len(severe_errors)}")
        for err in severe_errors:
            print("  [ERROR]", err['message'])
        assert len(severe_errors) == 0, f"Found severe errors: {severe_errors}"

        check_starter_lesson_game_and_practice(driver, wait)
        print("\n=== [SUCCESS] LESSON_PLAYER TOPIC GAME & FALLBACK TESTS PASSED 100%! ===")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
