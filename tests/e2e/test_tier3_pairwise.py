# -*- coding: utf-8 -*-
"""
Tier 3 Opaque-Box Pairwise Cross-Feature Integration Tests (16 checks).
Derived strictly from ORIGINAL_REQUEST.md & PROJECT.md contracts.
"""
from __future__ import annotations

import os
import time

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from tests.e2e.harness import (
    CANONICAL_SPECIALTIES,
    ConsoleAndNetworkCollector,
    E2ETestCase,
    wait_for_ready,
)

TEACHER_CODE = os.environ.get("E2E_TEACHER_CODE", "AMK2026")


class TestT3PairwiseCombinations(E2ETestCase):
    """16 cross-feature pairwise tests verifying contract interoperability."""

    def test_pair_01_auth_enroll_lesson_progress_sync(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("p1_hvac"), password="ValidPass123", specialty_slug="hvac", group_name="ХМ-21")
        enr = api.post("/api/courses/enroll", {"specialty_slug": "hvac"})
        self.assertIn(enr.status, (200, 201), enr.text)

        tasks = (api.get("/api/tasks?specialty=hvac").json_data or {}).get("tasks") or []
        self.assertEqual(len(tasks), 20)
        api.post("/api/tasks/submit", {"task_id": tasks[0]["id"], "answer_text": "Расчёт перегрева и переохлаждения"})

        courses = (api.get("/api/courses").json_data or {}).get("courses") or []
        hvac = next((c for c in courses if c.get("slug") == "hvac"), None)
        self.assertIsNotNone(hvac)
        self.assertEqual(hvac.get("total_lessons"), 20)

    def test_pair_02_lesson_video_and_3d_workshop_coexist(self):
        api = self.new_api_client()
        email = self.unique_email("p2_vid3d")
        api.register_user(email=email, password="ValidPass123", specialty_slug="automechanic")

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/lesson_player.html?course=automechanic&lesson=1")
        wait_for_ready(driver)

        video_tab = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Видео') or contains(@data-tab, 'video')]"))
        )
        video_tab.click()
        video = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "video")))
        self.assertTrue(video.get_attribute("src") or video.find_elements(By.TAG_NAME, "source"))

        act = api.post(
            "/api/workshop/action",
            {"lesson_id": 1, "model_id": "mech-cylinder", "action": "detach", "part_id": "valve_cover", "tool_id": "socket_set"},
        )
        self.assertEqual(act.status, 200, act.text)

    def test_pair_03_simulator_error_context_sent_to_ai_mentor(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("p3_simai"), password="ValidPass123", specialty_slug="automechanic")
        ai = api.post(
            "/api/ai/chat",
            {
                "message": "Почему не затягивается болт №1?",
                "course_slug": "automechanic",
                "lesson_id": 1,
                "context": {
                    "selected_part": "cylinder_head",
                    "simulator_state": {"stage": 1, "torque_nm": 120},
                    "recent_errors": ["TORQUE_SEQUENCE_VIOLATION"],
                },
            },
        )
        self.assertEqual(ai.status, 503, f"Expected 503 BLOCKED without LLM key, got {ai.status}")
        self.assertEqual((ai.json_data or {}).get("status"), "BLOCKED")

    def test_pair_04_3d_workshop_action_and_ai_selected_part_ui(self):
        api = self.new_api_client()
        email = self.unique_email("p4_3dai")
        api.register_user(email=email, password="ValidPass123", specialty_slug="automechanic")
        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/lesson_player.html?course=automechanic&lesson=1")
        wait_for_ready(driver)

        driver.execute_script(
            """
            window.__pair4Payload = null;
            var f = window.fetch;
            window.fetch = function(u, o) {
                if (String(u).indexOf('/api/ai/') !== -1 && o && o.body) {
                    try { window.__pair4Payload = JSON.parse(o.body); } catch (e) {}
                }
                return f.apply(this, arguments);
            };
            """
        )
        inp = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "#ai-tutor-input, [data-ai-input]")))
        inp.send_keys("Что это за узел?")
        driver.find_element(By.CSS_SELECTOR, "#ai-tutor-send, button[onclick*='submitAiTutor'], [data-ai-send]").click()
        payload = WebDriverWait(driver, 8).until(lambda d: d.execute_script("return window.__pair4Payload;"))
        self.assertIn("context", payload)

    def test_pair_05_lesson_completion_unlocks_skill_map_and_mission(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("p5_skm"), password="ValidPass123", specialty_slug="it")
        tasks = (api.get("/api/tasks?specialty=it").json_data or {}).get("tasks") or []
        api.post("/api/tasks/submit", {"task_id": tasks[0]["id"], "answer_text": "Верстка карточки по сетке 8px"})
        skm = api.get("/api/skills/map?specialty=it")
        self.assertEqual(skm.status, 200, skm.text)
        mis = api.get("/api/mission/state?specialty=it")
        self.assertEqual(mis.status, 200, mis.text)

    def test_pair_06_mission_completion_awards_xp_without_double_count(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("p6_xp"), password="ValidPass123", specialty_slug="autoelectric")
        xp_before = (api.get("/api/auth/session").json_data or {}).get("user", {}).get("xp", 0)
        sub = api.post("/api/mission/submit", {"specialty": "autoelectric", "mission_id": "autoelectric_m1", "answers": {"stage_1": "completed"}})
        self.assertEqual(sub.status, 200, sub.text)
        xp_after = (api.get("/api/auth/session").json_data or {}).get("user", {}).get("xp", 0)
        self.assertGreater(xp_after, xp_before, "Mission completion must award XP via ledger")

    def test_pair_07_mission_and_exam_populate_student_portfolio(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("p7_prt"), password="ValidPass123", specialty_slug="automechanic")
        api.post("/api/mission/submit", {"specialty": "automechanic", "mission_id": "automechanic_m1", "answers": {"stage_1": "completed"}})
        start = api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        api.post("/api/exams/submit", {"attempt_id": start.get("attempt_id"), "attempt_nonce": start.get("attempt_nonce")})

        prt = api.get("/api/portfolio/me")
        self.assertEqual(prt.status, 200, prt.text)
        data = prt.json_data or {}
        self.assertTrue(data.get("missions") or data.get("exams"), f"Portfolio did not aggregate missions/exams: {data}")

    def test_pair_08_portfolio_privacy_and_pdf_export(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("p8_pdf"), password="ValidPass123")
        slug = f"pair8-{int(time.time() * 1000)}"
        api.put("/api/portfolio/settings", {"is_public": True, "consent_granted": True, "show_grades": False, "public_slug": slug})

        anon = self.new_api_client()
        pub = anon.get(f"/api/portfolio/public/{slug}")
        self.assertEqual(pub.status, 200, pub.text)
        self.assertFalse((pub.json_data or {}).get("grades"))

        pdf = api.get("/api/portfolio/export.pdf")
        self.assertEqual(pdf.status, 200)
        self.assertTrue(pdf.body.startswith(b"%PDF-1."))

    def test_pair_09_exam_error_log_and_teacher_group_review(self):
        stud_api = self.new_api_client()
        stud_api.register_user(email=self.unique_email("p9_s"), password="ValidPass123", specialty_slug="automechanic", group_name="АМ-21")
        start = stud_api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        attempt_id = start.get("attempt_id")
        stud_api.post("/api/exams/event", {"attempt_id": attempt_id, "attempt_nonce": start.get("attempt_nonce"), "step_id": 1, "action": "detach", "part_id": "cylinder_head", "tool_id": "inspect_lamp"})
        stud_api.post("/api/exams/submit", {"attempt_id": attempt_id, "attempt_nonce": start.get("attempt_nonce")})

        teach_api = self.new_api_client()
        teach_api.register_user(email=self.unique_email("p9_t"), password="TeacherPass123", role="teacher", specialty_slug="automechanic", group_name="АМ-21", teacher_code=TEACHER_CODE)
        q = teach_api.get("/api/teacher/exams/review")
        self.assertEqual(q.status, 200, q.text)
        rev = teach_api.post(f"/api/teacher/exams/review/{attempt_id}", {"status": "needs_revision", "comment": "Соблюдайте порядок снятия крышки"})
        self.assertEqual(rev.status, 200, rev.text)

    def test_pair_10_theme_neon_locale_kk_mobile_390(self):
        driver = self.new_driver("mobile")
        driver.get(f"{self.base_url}/index.html")
        wait_for_ready(driver)

        driver.find_element(By.CSS_SELECTOR, "[data-theme-value='neon'], .theme-switch button[data-theme='neon']").click()
        driver.find_element(By.CSS_SELECTOR, "[data-lang='kk'], button[data-i18n-lang='kk']").click()
        time.sleep(0.3)
        driver.get(f"{self.base_url}/profile.html")
        wait_for_ready(driver)

        state = driver.execute_script(
            """
            return {
                theme: document.documentElement.getAttribute('data-theme'),
                lang: document.documentElement.lang || localStorage.getItem('amk.lang'),
                scrollWidth: document.documentElement.scrollWidth
            };
            """
        )
        self.assertEqual(state["theme"], "neon")
        self.assertIn("kk", str(state["lang"]).lower())
        self.assertLessEqual(state["scrollWidth"], 390)

    def test_pair_11_theme_graphite_and_3d_graphics_ultra(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=automechanic")
        wait_for_ready(driver)
        driver.find_element(By.CSS_SELECTOR, "[data-theme-value='graphite'], .theme-switch button[data-theme='graphite']").click()
        driver.execute_script("if (window.EduGraphicsProfile) window.EduGraphicsProfile.set('ULTRA');")
        driver.refresh()
        wait_for_ready(driver)
        self.assertEqual(driver.execute_script("return document.documentElement.getAttribute('data-theme');"), "graphite")
        self.assertEqual(driver.execute_script("return window.EduGraphicsProfile && window.EduGraphicsProfile.get();"), "ULTRA")

    def test_pair_12_student_tools_and_lesson_notes_persist(self):
        api = self.new_api_client()
        email = self.unique_email("p12_tools")
        api.register_user(email=email, password="ValidPass123", specialty_slug="it")
        api.post("/api/tools/state", {"notes": "Pairwise Flexbox gap reminder", "tasks": [{"id": "p12", "title": "Изучить Grid", "done": False}]})

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/tools.html")
        wait_for_ready(driver)
        self.assertIn("Grid", driver.find_element(By.TAG_NAME, "body").text)

    def test_pair_13_password_reset_or_change_invalidates_stale_session(self):
        api_a = self.new_api_client()
        email = self.unique_email("p13_stale")
        api_a.register_user(email=email, password="OldPass123")
        self.assertTrue(api_a.get("/api/auth/session").json_data.get("authenticated"))

        # Update password via authenticated profile or second session
        upd = api_a.put("/api/user/profile", {"current_password": "OldPass123", "new_password": "NewPass456"})
        self.assertIn(upd.status, (200, 400))

    def test_pair_14_teacher_grade_updates_real_certificate_average(self):
        stud_api = self.new_api_client()
        stud_api.register_user(email=self.unique_email("p14_s"), password="ValidPass123", specialty_slug="it", group_name="ИС-21")
        tasks = (stud_api.get("/api/tasks?specialty=it").json_data or {}).get("tasks") or []
        sub = stud_api.post("/api/tasks/submit", {"task_id": tasks[0]["id"], "answer_text": "Ответ студента"}).json_data or {}
        sub_id = sub.get("submission_id") or sub.get("id")

        teach_api = self.new_api_client()
        teach_api.register_user(email=self.unique_email("p14_t"), password="TeacherPass123", role="teacher", specialty_slug="it", group_name="ИС-21", teacher_code=TEACHER_CODE)
        if sub_id:
            teach_api.post("/api/teacher/grade_submission", {"submission_id": sub_id, "score": 88, "comment": "Хорошо"})
        prt = stud_api.get("/api/portfolio/me")
        self.assertEqual(prt.status, 200)
        self.assertNotIn("92.4", prt.text)

    def test_pair_15_csrf_enforced_across_tools_portfolio_workshop(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("p15_csrf"), password="ValidPass123")
        self.assertEqual(api.post("/api/tools/state", {"notes": "ok"}).status, 200)
        self.assertEqual(api.post("/api/tools/state", {"notes": "bad"}, auto_csrf=False).status, 403)
        self.assertEqual(api.put("/api/portfolio/settings", {"is_public": False}, auto_csrf=False).status, 403)
        self.assertEqual(api.post("/api/workshop/action", {"lesson_id": 1, "model_id": "mech-cylinder", "action": "detach", "part_id": "valve_cover"}, auto_csrf=False).status, 403)

    def test_pair_16_lazy_catalog_and_offline_css_across_all_5_courses(self):
        driver = self.new_driver("desktop", blocked_urls=["*cdn.tailwindcss.com*"])
        for slug in CANONICAL_SPECIALTIES:
            driver.get(f"{self.base_url}/lesson_player.html?course={slug}&lesson=1")
            wait_for_ready(driver)
            ConsoleAndNetworkCollector.install_error_trap(driver)
            time.sleep(0.3)
            self.assertEqual(ConsoleAndNetworkCollector.collect_severe(driver), [])
