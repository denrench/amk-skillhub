import time
import json
import sys
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By

def run_test():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--mute-audio")
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

        # 3. Check Topic Game Stage 1 instead of static video
        mount_shell = driver.find_element(By.CSS_SELECTOR, "#sim-topic-game-mount .tge-shell")
        assert mount_shell is not None, "Topic Game shell not mounted in #sim-topic-game-mount!"
        assert len(driver.find_elements(By.ID, "active-lecture-video")) == 0, "Stale #active-lecture-video should be removed!"
        print("[OK] Found Topic Game shell in #sim-topic-game-mount")

        round_lbl = driver.find_element(By.ID, "tge-round-label").text
        score_txt = driver.find_element(By.ID, "tge-score-pill").text
        print(f"[OK] Round HUD: '{round_lbl}', Score: '{score_txt}'")
        assert "раунд 1 из 3" in round_lbl.lower(), f"Expected 3-round game, got '{round_lbl}'"

        # 4. Toggle Hint via real UI button click & Check Unique Rounds State
        driver.find_element(By.CSS_SELECTOR, "#sim-topic-game-mount .tge-btn-hint").click()
        time.sleep(0.25)
        hints = driver.find_elements(By.CSS_SELECTOR, "#sim-topic-game-mount .tge-hint-box")
        assert len(hints) == 1 and len(hints[0].text.strip()) > 5, "Hint box failed to toggle!"
        st = driver.execute_script("return TopicGameEngine.getState('sim-topic-game-mount');")
        assert st and len(st.get("game", {}).get("rounds", [])) == 3, f"Invalid game state: {st}"

        # 5. Switch to Notes tab and back to Topic Game
        driver.execute_script("switchTheoryView('text');")
        time.sleep(0.3)
        assert not driver.execute_script("return document.getElementById('theory-text-container').classList.contains('hidden');")
        assert driver.execute_script("return document.getElementById('theory-game-container').classList.contains('hidden');")
        driver.execute_script("switchTheoryView('game');")
        time.sleep(0.3)
        assert not driver.execute_script("return document.getElementById('theory-game-container').classList.contains('hidden');")

        # 6. Verify tools badge & non-empty notes body
        tools_txt = driver.find_element(By.ID, "theory-tools-badge").text
        body_txt = driver.find_element(By.ID, "theory-content-body").get_attribute("textContent")
        assert len(tools_txt.strip()) > 0 and len(body_txt.strip()) > 10, "Tools badge or notes body empty!"

        # 7. Check browser console logs
        logs = driver.get_log("browser")
        severe_errors = [l for l in logs if l['level'] == 'SEVERE' and 'favicon' not in l['message']]
        print(f"[OK] Browser severe errors count: {len(severe_errors)}")
        for err in severe_errors:
            print("  [ERROR]", err['message'])
        assert len(severe_errors) == 0, f"Found severe errors: {severe_errors}"

        print("\n=== [SUCCESS] SIMULATOR TOPIC GAME TESTS PASSED WITH 100% REAL BROWSER ASSERTIONS! ===")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
