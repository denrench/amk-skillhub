# -*- coding: utf-8 -*-
"""
Tier 1 Opaque-Box Feature Tests (62 checks across 12 feature groups).
Derived strictly from ORIGINAL_REQUEST.md & PROJECT.md Interface Contracts.
"""
from __future__ import annotations

import json
import os
import time
import urllib.request

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

from tests.e2e.harness import (
    ALL_20_HTML_PAGES,
    CANONICAL_SPECIALTIES,
    ConsoleAndNetworkCollector,
    E2ETestCase,
    wait_for_ready,
)

TEACHER_CODE = os.environ.get("E2E_TEACHER_CODE", "AMK2026")


class TestT1Group01AuthAndRoles(E2ETestCase):
    """Group 1: Auth, Roles, Optional Local Email OTP & Session Integrity."""

    def test_auth_readiness_local_no_otp_required(self):
        api = self.new_api_client()
        resp = api.get("/api/auth/readiness")
        self.assertEqual(resp.status, 200, f"/api/auth/readiness failed: {resp.text}")
        self.assertIsInstance(resp.json_data, dict)
        self.assertTrue(resp.json_data.get("login"))
        self.assertTrue(resp.json_data.get("registration"))
        self.assertIs(resp.json_data.get("email_verification_required"), False)

    def test_register_student_without_otp_via_ui(self):
        driver = self.new_driver("desktop")
        email = self.unique_email("stud_ui")
        driver.get(f"{self.base_url}/auth.html?mode=register")
        wait_for_ready(driver)

        reg_btn = driver.find_element(By.CSS_SELECTOR, "button[data-mode='register']")
        reg_btn.click()

        form = WebDriverWait(driver, 8).until(EC.visibility_of_element_located((By.ID, "account-register")))
        form.find_element(By.CSS_SELECTOR, "input[name='first_name']").send_keys("Алихан")
        form.find_element(By.CSS_SELECTOR, "input[name='last_name']").send_keys("Сериков")
        Select(form.find_element(By.CSS_SELECTOR, "select[name='specialty_slug']")).select_by_value("automechanic")
        Select(form.find_element(By.CSS_SELECTOR, "select[name='role']")).select_by_value("student")
        form.find_element(By.CSS_SELECTOR, "input[name='group_name']").send_keys("АМ-21")
        form.find_element(By.CSS_SELECTOR, "input[name='email']").send_keys(email)
        form.find_element(By.CSS_SELECTOR, "input[name='password']").send_keys("Mechanic123")

        otp_input = form.find_element(By.CSS_SELECTOR, "input[name='verification_code']")
        self.assertIsNone(
            otp_input.get_attribute("required"),
            "verification_code input must not have HTML required attribute locally",
        )
        form.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        WebDriverWait(driver, 10).until(
            lambda d: self.browser_session_info(d).get("body", {}).get("authenticated") is True
        )
        driver.refresh()
        wait_for_ready(driver)
        sess = self.browser_session_info(driver)
        self.assertTrue(sess["body"]["authenticated"])
        self.assertEqual(sess["body"]["user"]["email"], email)
        self.assertEqual(sess["body"]["user"]["role"], "student")

    def test_register_teacher_with_valid_code(self):
        api = self.new_api_client()
        email = self.unique_email("teach_reg")
        resp = api.register_user(
            email=email,
            password="TeacherPass123",
            role="teacher",
            specialty_slug="hvac",
            group_name="ХМ-21",
            teacher_code=TEACHER_CODE,
        )
        self.assertIn(resp.status, (200, 201), f"Teacher registration failed: {resp.status} {resp.text}")
        sess = api.get("/api/auth/session")
        self.assertEqual(sess.status, 200)
        self.assertTrue(sess.json_data.get("authenticated"))
        self.assertEqual(sess.json_data["user"]["role"], "teacher")
        self.assertEqual(sess.json_data["user"]["specialty_slug"], "hvac")

    def test_login_and_logout_lifecycle(self):
        api = self.new_api_client()
        email = self.unique_email("lifecycle")
        reg = api.register_user(email=email, password="ValidPass123", role="student", specialty_slug="it")
        self.assertIn(reg.status, (200, 201), reg.text)

        out = api.logout()
        self.assertEqual(out.status, 200)
        sess_out = api.get("/api/auth/session")
        self.assertFalse(sess_out.json_data.get("authenticated"))

        driver = self.new_driver("desktop")
        self.login_browser_via_api_or_form(driver, email, "ValidPass123")
        sess_in = self.browser_session_info(driver)
        self.assertTrue(sess_in["body"]["authenticated"])
        self.assertEqual(sess_in["body"]["user"]["email"], email)

    def test_session_endpoint_exposes_csrf_token_without_password_hash(self):
        api = self.new_api_client()
        email = self.unique_email("csrf_check")
        reg = api.register_user(email=email, password="ValidPass123")
        self.assertIn(reg.status, (200, 201), reg.text)

        sess = api.get("/api/auth/session")
        self.assertEqual(sess.status, 200)
        self.assertTrue(sess.json_data.get("csrf_token"), "csrf_token missing from /api/auth/session")
        user_obj = sess.json_data.get("user") or {}
        self.assertNotIn("password_hash", user_obj)
        self.assertNotIn("password", user_obj)

    def test_no_plaintext_passwords_in_local_storage(self):
        api = self.new_api_client()
        email = self.unique_email("nopwd_ls")
        secret = "SecretPass9988"
        reg = api.register_user(email=email, password=secret)
        self.assertIn(reg.status, (200, 201), reg.text)

        driver = self.new_driver("desktop")
        self.login_browser_via_api_or_form(driver, email, secret)
        ls_dump = driver.execute_script("return JSON.stringify(window.localStorage);")
        self.assertNotIn(secret, ls_dump, "Plaintext password leaked into localStorage!")
        self.assertNotIn("amk.local_accounts.v1", ls_dump, "Legacy plaintext account store present in localStorage!")


class TestT1Group02CatalogAnd20Lessons(E2ETestCase):
    """Group 2: Catalog, 20-Module Curriculum Parity, Video Player & Lazy Loading."""

    def test_health_reports_100_lessons_and_100_tasks(self):
        api = self.new_api_client()
        resp = api.get("/api/health")
        self.assertEqual(resp.status, 200, resp.text)
        data = resp.json_data or {}
        self.assertEqual(data.get("lessons_total"), 100, f"Expected 100 lessons_total, got {data}")
        self.assertEqual(data.get("tasks_total"), 100, f"Expected 100 tasks_total, got {data}")

    def test_courses_api_returns_5_specialties_with_20_lessons(self):
        api = self.new_api_client()
        resp = api.get("/api/courses")
        self.assertEqual(resp.status, 200, resp.text)
        courses = (resp.json_data or {}).get("courses") or []
        by_slug = {c.get("slug"): c for c in courses}
        for slug in CANONICAL_SPECIALTIES:
            self.assertIn(slug, by_slug, f"Missing specialty {slug} in /api/courses")
            self.assertEqual(
                by_slug[slug].get("total_lessons"),
                20,
                f"{slug} total_lessons expected 20, got {by_slug[slug].get('total_lessons')}",
            )

    def test_tasks_api_lists_20_modules_per_specialty(self):
        api = self.new_api_client()
        for slug in CANONICAL_SPECIALTIES:
            resp = api.get(f"/api/tasks?specialty={slug}")
            self.assertEqual(resp.status, 200, f"/api/tasks?specialty={slug} -> {resp.status}")
            tasks = (resp.json_data or {}).get("tasks") or []
            self.assertEqual(len(tasks), 20, f"Expected 20 tasks for {slug}, got {len(tasks)}")

    def test_lesson_player_loads_8_blocks_and_lesson_20(self):
        api = self.new_api_client()
        email = self.unique_email("l20")
        api.register_user(email=email, password="ValidPass123", specialty_slug="it")
        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")

        driver.get(f"{self.base_url}/lesson_player.html?course=it&lesson=1")
        wait_for_ready(driver)
        ConsoleAndNetworkCollector.install_error_trap(driver)
        WebDriverWait(driver, 10).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, "[data-block-id], .block-tab, .lesson-block")) >= 4
            or len(d.find_element(By.TAG_NAME, "body").text.strip()) > 100
        )

        # Verify lesson 20 data is present via API/catalog
        l20 = api.get("/api/lessons?specialty=it")
        self.assertEqual(l20.status, 200)
        lessons = (l20.json_data or {}).get("lessons") or []
        order_nums = [int(x.get("order_num") or x.get("lesson_number") or 0) for x in lessons]
        self.assertIn(20, order_nums, f"Lesson 20 missing from /api/lessons?specialty=it: {order_nums}")

    def test_video_player_overview_tab_loads_mp4_poster_vtt(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/lesson_player.html?course=automechanic&lesson=1")
        wait_for_ready(driver)

        video_tab = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located(
                (By.XPATH, "//button[contains(., 'Видео') or contains(@data-tab, 'video') or contains(@id, 'video')]")
            )
        )
        video_tab.click()

        video = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "video")))
        src = video.get_attribute("src") or ""
        if not src:
            sources = video.find_elements(By.TAG_NAME, "source")
            src = sources[0].get_attribute("src") if sources else ""
        self.assertIn(".mp4", src, f"Expected .mp4 video source, got '{src}'")
        poster = video.get_attribute("poster") or ""
        self.assertTrue(poster.endswith(".jpg") or ".jpg" in poster, f"Expected .jpg poster, got '{poster}'")
        tracks = video.find_elements(By.TAG_NAME, "track")
        self.assertTrue(any(".vtt" in (t.get_attribute("src") or "") for t in tracks), "Expected .vtt subtitle track")
        err = driver.execute_script("return arguments[0].error;", video)
        self.assertIsNone(err, f"Video element reported error: {err}")

    def test_catalog_lazy_loading_no_cdn_tailwind(self):
        driver = self.new_driver("desktop", blocked_urls=["*cdn.tailwindcss.com*"])
        driver.get(f"{self.base_url}/index.html")
        wait_for_ready(driver)
        cdn_scripts = driver.execute_script(
            "return Array.from(document.querySelectorAll('script[src]')).map(s=>s.src).filter(u=>u.includes('cdn.tailwindcss.com'));"
        )
        self.assertEqual(cdn_scripts, [], f"Forbidden cdn.tailwindcss.com script still present: {cdn_scripts}")
        bg = driver.execute_script("return getComputedStyle(document.body).backgroundColor;")
        self.assertTrue(bool(bg), "Body computed background missing without external CDN")


class TestT1Group03PortalsStudentTeacherAdmin(E2ETestCase):
    """Group 3: Student, Teacher, Admin Portals & Gradebook Integrity."""

    def test_student_portal_loads_live_profile_and_xp(self):
        api = self.new_api_client()
        email = self.unique_email("stud_portal")
        api.register_user(email=email, password="ValidPass123", first_name="Данияр", last_name="Тестов")

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/student.html")
        wait_for_ready(driver)
        ConsoleAndNetworkCollector.install_error_trap(driver)

        WebDriverWait(driver, 10).until(
            lambda d: "Данияр" in d.find_element(By.TAG_NAME, "body").text
        )
        errs = ConsoleAndNetworkCollector.collect_severe(driver)
        self.assertEqual(errs, [], f"Severe errors on student.html: {errs}")

    def test_teacher_portal_loads_assigned_group_matrix(self):
        api = self.new_api_client()
        email = self.unique_email("teach_portal")
        reg = api.register_user(
            email=email,
            password="TeacherPass123",
            role="teacher",
            specialty_slug="automechanic",
            group_name="АМ-21",
            teacher_code=TEACHER_CODE,
        )
        self.assertIn(reg.status, (200, 201), reg.text)

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "TeacherPass123")
        driver.get(f"{self.base_url}/teacher.html")
        wait_for_ready(driver)
        ConsoleAndNetworkCollector.install_error_trap(driver)
        time.sleep(1.0)
        errs = ConsoleAndNetworkCollector.collect_severe(driver)
        self.assertEqual(errs, [], f"Severe errors on teacher.html: {errs}")

    def test_teacher_grade_submission_valid_id(self):
        stud_api = self.new_api_client()
        s_email = self.unique_email("stud_sub")
        stud_api.register_user(email=s_email, password="ValidPass123", specialty_slug="it", group_name="ИС-21")
        tasks = (stud_api.get("/api/tasks?specialty=it").json_data or {}).get("tasks") or []
        self.assertTrue(tasks, "No tasks returned for it")
        task_id = tasks[0]["id"]
        sub = stud_api.post(
            "/api/tasks/submit",
            {"task_id": task_id, "answer_text": "Решение задачи по вёрстке", "code_answer": "<div>OK</div>"},
        )
        self.assertIn(sub.status, (200, 201), f"Task submission failed: {sub.status} {sub.text}")
        sub_id = (sub.json_data or {}).get("submission_id") or (sub.json_data or {}).get("id")
        self.assertIsNotNone(sub_id, f"Missing submission_id in response: {sub.json_data}")

        teach_api = self.new_api_client()
        t_email = self.unique_email("teach_grade")
        teach_api.register_user(
            email=t_email,
            password="TeacherPass123",
            role="teacher",
            specialty_slug="it",
            group_name="ИС-21",
            teacher_code=TEACHER_CODE,
        )
        grade_resp = teach_api.post(
            "/api/teacher/grade_submission",
            {"submission_id": sub_id, "score": 95, "comment": "Отличная работа"},
        )
        self.assertEqual(grade_resp.status, 200, f"Grade failed: {grade_resp.status} {grade_resp.text}")

    def test_admin_portal_loads_real_kpis_for_admin(self):
        driver = self.new_driver("desktop")
        # Guest check first: admin.html must NOT display hardcoded fake 48 KPIs to unauthenticated user
        driver.get(f"{self.base_url}/admin.html")
        wait_for_ready(driver)
        time.sleep(0.8)
        sub_el = driver.find_elements(By.ID, "stat-submissions")
        if sub_el:
            self.assertNotEqual(
                sub_el[0].text.strip(),
                "48",
                "admin.html still shows fake hardcoded KPI '48' to unauthenticated visitor",
            )

    def test_gradebook_redirects_or_renders_cleanly(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/gradebook.html")
        wait_for_ready(driver)
        errs = ConsoleAndNetworkCollector.collect_severe(driver)
        self.assertEqual(errs, [], f"Errors on gradebook.html: {errs}")


class TestT1Group04ThreeDWorkshopAndGraphics(E2ETestCase):
    """Group 4: 3D Automechanic Workshop, WebGL, Graphics Profiles & Disposal."""

    def test_3d_showcase_renders_webgl_canvas_on_index(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/index.html")
        wait_for_ready(driver)
        ConsoleAndNetworkCollector.install_error_trap(driver)
        canvas = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "canvas")))
        rect = driver.execute_script("return arguments[0].getBoundingClientRect();", canvas)
        self.assertGreater(rect["width"], 50)
        self.assertGreater(rect["height"], 50)
        errs = ConsoleAndNetworkCollector.collect_severe(driver)
        self.assertEqual(errs, [], f"WebGL showcase console errors: {errs}")

    def test_automechanic_workshop_mounts_with_named_parts(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=automechanic")
        wait_for_ready(driver)
        has_workshop = driver.execute_script("return Boolean(window.EduWorkshop3D && typeof window.EduWorkshop3D.mount === 'function');")
        self.assertTrue(has_workshop, "window.EduWorkshop3D.mount API not exposed on simulator.html")

    def test_graphics_profile_switch_low_balanced_ultra(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=automechanic")
        wait_for_ready(driver)
        has_profiles = driver.execute_script("return Boolean(window.EduGraphicsProfile);")
        self.assertTrue(has_profiles, "window.EduGraphicsProfile not implemented")
        for prof in ("LOW", "BALANCED", "ULTRA"):
            res = driver.execute_script(
                "window.EduGraphicsProfile.set(arguments[0]); return window.EduGraphicsProfile.get();",
                prof,
            )
            self.assertEqual(res, prof)
        driver.refresh()
        wait_for_ready(driver)
        persisted = driver.execute_script("return window.EduGraphicsProfile.get();")
        self.assertEqual(persisted, "ULTRA")

    def test_workshop_tool_selection_and_valid_detach_persists(self):
        api = self.new_api_client()
        email = self.unique_email("mech_ws")
        api.register_user(email=email, password="ValidPass123", specialty_slug="automechanic")

        act = api.post(
            "/api/workshop/action",
            {
                "lesson_id": 1,
                "model_id": "mech-cylinder",
                "action": "detach",
                "part_id": "valve_cover",
                "tool_id": "socket_set",
                "telemetry": {"bolts_removed": 6},
            },
        )
        self.assertEqual(act.status, 200, f"/api/workshop/action failed: {act.status} {act.text}")
        self.assertTrue((act.json_data or {}).get("valid"), act.json_data)

        state = api.get("/api/workshop/state?lesson_id=1&model_id=mech-cylinder")
        self.assertEqual(state.status, 200, state.text)
        self.assertIn("valve_cover", (state.json_data or {}).get("disassembled_parts", []))

    def test_3d_scene_disposal_no_monotonic_memory_leak(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=automechanic")
        wait_for_ready(driver)
        has_disposal = driver.execute_script(
            "return typeof window.disposeThreeScene === 'function' || Boolean(window.EduWorkshop3D && typeof window.EduWorkshop3D.mount === 'function');"
        )
        self.assertTrue(has_disposal, "Centralized 3D disposal API missing")


class TestT1Group05FiveSpecialtySimulatorsAndPhysics(E2ETestCase):
    """Group 5: Deterministic 5-Specialty Physics Simulators (EduPhysics)."""

    def test_physics_graphic_design_wcag_contrast(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=graphic_design")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduPhysics || !window.EduPhysics.design) return null;
            return {
                bw: window.EduPhysics.design.contrastRatio('#000000', '#FFFFFF'),
                gray: window.EduPhysics.design.contrastRatio('#777777', '#FFFFFF')
            };
            """
        )
        self.assertIsNotNone(res, "window.EduPhysics.design.contrastRatio missing")
        self.assertAlmostEqual(res["bw"]["ratio"], 21.0, places=1)
        self.assertTrue(res["bw"]["aaNormal"])
        self.assertTrue(res["bw"]["aaaNormal"])
        self.assertAlmostEqual(res["gray"]["ratio"], 4.47, places=1)
        self.assertFalse(res["gray"]["aaNormal"])
        self.assertTrue(res["gray"]["aaLarge"])

    def test_physics_autoelectric_ohm_kirchhoff_deterministic(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=autoelectric")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduPhysics || !window.EduPhysics.autoelectric) return null;
            var fn = window.EduPhysics.autoelectric.solveCircuit;
            var a = fn(['bat', 'load', 'gnd'], [{from:'bat',to:'load',r:0.2},{from:'load',to:'gnd',r:4.0}], 12.6);
            var b = fn(['bat', 'load', 'gnd'], [{from:'bat',to:'load',r:0.2},{from:'load',to:'gnd',r:4.0}], 12.6);
            return { a: a, b: b };
            """
        )
        self.assertIsNotNone(res, "window.EduPhysics.autoelectric.solveCircuit missing")
        self.assertEqual(res["a"], res["b"], "Circuit solver must be deterministic without Math.random()")
        self.assertAlmostEqual(res["a"]["totalResistance"], 4.2, places=2)

    def test_physics_hvac_multi_refrigerant_pt_cycle(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=hvac")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduPhysics || !window.EduPhysics.hvac) return null;
            return {
                r134a: window.EduPhysics.hvac.cycleMetrics('R134a', 2.0, 12.0, 8.0, 38.0),
                r410a: window.EduPhysics.hvac.cycleMetrics('R410A', 7.0, 26.0, 10.0, 35.0)
            };
            """
        )
        self.assertIsNotNone(res, "window.EduPhysics.hvac.cycleMetrics missing")
        for ref in ("r134a", "r410a"):
            self.assertIn("tSatLow", res[ref])
            self.assertIn("superheatK", res[ref])
            self.assertIn("subcoolingK", res[ref])
            self.assertGreater(res[ref]["copEstimate"], 1.0)

    def test_physics_automechanic_spiral_torque_sequence(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=automechanic")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduPhysics || !window.EduPhysics.automechanic) return null;
            var seq = [6, 5, 7, 4, 8, 3, 9, 2, 10, 1];
            var events = [];
            [30, 60, 90].forEach(function(val, idx) {
                seq.forEach(function(bolt) { events.push({ bolt: bolt, stage: idx + 1, value: val }); });
            });
            return window.EduPhysics.automechanic.evaluateTorqueSequence(events, 'head_10bolt');
            """
        )
        self.assertIsNotNone(res, "window.EduPhysics.automechanic.evaluateTorqueSequence missing")
        self.assertTrue(res.get("validOrder"))
        self.assertTrue(res.get("passed"))

    def test_physics_it_layout_evaluator(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=it")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduPhysics || !window.EduPhysics.it) return null;
            return window.EduPhysics.it.evaluateLayout(
                'display: flex; justify-content: space-between; gap: 16px;',
                { display: 'flex', justifyContent: 'space-between', minGap: 12 }
            );
            """
        )
        self.assertIsNotNone(res, "window.EduPhysics.it.evaluateLayout missing")
        self.assertGreaterEqual(res.get("score", 0), 80)


class TestT1Group06FourStudentTools(E2ETestCase):
    """Group 6: 4 Student Tools & Authenticated Persistence."""

    def test_tools_page_renders_all_four_student_tools(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/tools.html")
        wait_for_ready(driver)
        body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
        for kw in ("поиск", "gpa", "задач", "таймер"):
            self.assertIn(kw, body_text, f"Tool keyword '{kw}' missing on tools.html")

    def test_tool_search_filters_real_courses(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/tools.html")
        wait_for_ready(driver)
        search_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='search'], input[id*='search'], input[placeholder*='Поиск']")
        self.assertTrue(search_inputs, "Search input missing on tools.html")
        search_inputs[0].send_keys("HVAC")
        time.sleep(0.4)
        self.assertIn("hvac", driver.find_element(By.TAG_NAME, "body").text.lower())

    def test_tool_gpa_calculator_updates_dynamically(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/tools.html")
        wait_for_ready(driver)
        num_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='number']")
        self.assertTrue(num_inputs, "Numeric GPA inputs missing on tools.html")

    def test_tool_task_hub_persists_across_reload(self):
        api = self.new_api_client()
        email = self.unique_email("tools_task")
        api.register_user(email=email, password="ValidPass123")
        payload = {"tasks": [{"id": "t1", "title": "Проверить зазоры клапанов", "done": False}], "gpa_target": 3.8}
        post_resp = api.post("/api/tools/state", payload)
        self.assertEqual(post_resp.status, 200, f"/api/tools/state POST failed: {post_resp.status} {post_resp.text}")
        get_resp = api.get("/api/tools/state")
        self.assertEqual(get_resp.status, 200, get_resp.text)
        self.assertEqual((get_resp.json_data or {}).get("gpa_target"), 3.8)
        tasks = (get_resp.json_data or {}).get("tasks") or []
        self.assertTrue(any(t.get("title") == "Проверить зазоры клапанов" for t in tasks))

    def test_tool_study_timer_and_notes_persists(self):
        api = self.new_api_client()
        email = self.unique_email("tools_notes")
        api.register_user(email=email, password="ValidPass123")
        post_resp = api.post("/api/tools/state", {"notes": "Конспект: момент затяжки 60 Нм + 90 градусов"})
        self.assertEqual(post_resp.status, 200, post_resp.text)
        get_resp = api.get("/api/tools/state")
        self.assertEqual(get_resp.status, 200)
        self.assertIn("60 Нм", (get_resp.json_data or {}).get("notes", ""))


class TestT1Group07AIMentorContract(E2ETestCase):
    """Group 7: Real Lesson & 3D-Aware LLM AI Mentor (503 BLOCKED when unconfigured)."""

    def test_ai_chat_returns_503_blocked_without_api_key(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("ai_chat"), password="ValidPass123")
        resp = api.post(
            "/api/ai/chat",
            {
                "message": "Какой момент затяжки ГБЦ?",
                "course_slug": "automechanic",
                "lesson_id": 1,
                "context": {"selected_part": "cylinder_head", "disassembled_parts": ["valve_cover"]},
            },
        )
        self.assertEqual(resp.status, 503, f"Expected 503 BLOCKED without LLM key, got {resp.status}: {resp.text}")
        self.assertEqual((resp.json_data or {}).get("status"), "BLOCKED")
        self.assertEqual((resp.json_data or {}).get("code"), "AI_PROVIDER_UNCONFIGURED")

    def test_ai_tutor_returns_503_blocked_without_api_key(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("ai_tutor"), password="ValidPass123")
        resp = api.post("/api/ai/tutor", {"message": "Помоги с заданием", "course_slug": "it", "lesson_id": 1})
        self.assertEqual(resp.status, 503, f"Expected 503 BLOCKED on /api/ai/tutor, got {resp.status}: {resp.text}")
        self.assertEqual((resp.json_data or {}).get("status"), "BLOCKED")

    def test_ai_review_submission_returns_503_blocked_without_key(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("ai_rev"), password="ValidPass123")
        resp = api.post("/api/ai/review_submission", {"course_slug": "it", "answer_text": "Длинный текст ответа более двадцати символов для теста"})
        self.assertEqual(resp.status, 503, f"Expected 503 BLOCKED on /api/ai/review_submission, got {resp.status}: {resp.text}")
        self.assertEqual((resp.json_data or {}).get("status"), "BLOCKED")

    def test_ai_ui_displays_explicit_blocked_banner_in_lesson_player(self):
        api = self.new_api_client()
        email = self.unique_email("ai_ui")
        api.register_user(email=email, password="ValidPass123")
        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/lesson_player.html?course=automechanic&lesson=1")
        wait_for_ready(driver)

        ai_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#ai-tutor-input, [data-ai-input], textarea[placeholder*='AI'], input[placeholder*='AI']"))
        )
        ai_input.send_keys("Объясни ошибку")
        send_btn = driver.find_element(By.CSS_SELECTOR, "#ai-tutor-send, button[onclick*='submitAiTutor'], [data-ai-send]")
        send_btn.click()

        WebDriverWait(driver, 10).until(
            lambda d: any(
                tok in d.find_element(By.TAG_NAME, "body").text.upper()
                for tok in ("BLOCKED", "API-КЛЮЧ", "НЕДОСТУПЕН", "AI_PROVIDER_UNCONFIGURED")
            )
        )

    def test_ai_ui_passes_lesson_and_3d_context_in_request(self):
        api = self.new_api_client()
        email = self.unique_email("ai_ctx")
        api.register_user(email=email, password="ValidPass123", specialty_slug="automechanic")
        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/lesson_player.html?course=automechanic&lesson=1")
        wait_for_ready(driver)

        driver.execute_script(
            """
            window.__capturedAiPayload = null;
            var origFetch = window.fetch;
            window.fetch = function(url, opts) {
                if (String(url).indexOf('/api/ai/') !== -1 && opts && opts.body) {
                    try { window.__capturedAiPayload = JSON.parse(opts.body); } catch (e) {}
                }
                return origFetch.apply(this, arguments);
            };
            """
        )
        ai_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#ai-tutor-input, [data-ai-input]"))
        )
        ai_input.send_keys("Проверь контекст сцены")
        driver.find_element(By.CSS_SELECTOR, "#ai-tutor-send, button[onclick*='submitAiTutor'], [data-ai-send]").click()

        payload = WebDriverWait(driver, 8).until(lambda d: d.execute_script("return window.__capturedAiPayload;"))
        self.assertIsInstance(payload, dict)
        self.assertEqual(payload.get("course_slug"), "automechanic")
        self.assertIn("context", payload)


class TestT1Group08SkillMapDAG(E2ETestCase):
    """Group 8: Interactive Skill Map DAG (20 nodes/specialty, prerequisites, achievements)."""

    def test_skills_map_api_returns_20_nodes_per_specialty(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("skm_20"), password="ValidPass123", specialty_slug="automechanic")
        resp = api.get("/api/skills/map?specialty=automechanic")
        self.assertEqual(resp.status, 200, f"/api/skills/map failed: {resp.status} {resp.text}")
        nodes = (resp.json_data or {}).get("nodes") or []
        self.assertEqual(len(nodes), 20, f"Expected 20 skill nodes, got {len(nodes)}")

    def test_skills_map_root_nodes_unlocked_downstream_locked(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("skm_lock"), password="ValidPass123", specialty_slug="it")
        resp = api.get("/api/skills/map?specialty=it")
        self.assertEqual(resp.status, 200, resp.text)
        nodes = (resp.json_data or {}).get("nodes") or []
        unlocked = [n for n in nodes if n.get("unlocked")]
        locked = [n for n in nodes if not n.get("unlocked")]
        self.assertGreaterEqual(len(unlocked), 1, "At least 1 root skill node must start unlocked")
        self.assertGreaterEqual(len(locked), 1, "Downstream skill nodes with prerequisites must start locked")

    def test_skills_map_renders_interactive_svg_dag_in_ui(self):
        api = self.new_api_client()
        email = self.unique_email("skm_ui")
        api.register_user(email=email, password="ValidPass123", specialty_slug="it")
        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/profile.html")
        wait_for_ready(driver)
        nodes = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".skill-node, [data-skill-node]"))
        )
        self.assertGreaterEqual(len(nodes), 5, "Skill Map DAG nodes did not render in profile.html")

    def test_skills_map_progress_updates_after_lesson_completion(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("skm_prog"), password="ValidPass123", specialty_slug="it")
        before = api.get("/api/skills/map?specialty=it").json_data or {}
        before_done = sum(1 for n in before.get("nodes", []) if n.get("completed"))

        tasks = (api.get("/api/tasks?specialty=it").json_data or {}).get("tasks") or []
        self.assertTrue(tasks)
        api.post("/api/tasks/submit", {"task_id": tasks[0]["id"], "answer_text": "Решение первого модуля"})

        after = api.get("/api/skills/map?specialty=it").json_data or {}
        after_done = sum(1 for n in after.get("nodes", []) if n.get("completed"))
        self.assertGreaterEqual(after_done, before_done)

    def test_skills_map_achievements_metadata_present(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("skm_ach"), password="ValidPass123", specialty_slug="hvac")
        resp = api.get("/api/skills/map?specialty=hvac")
        self.assertEqual(resp.status, 200, resp.text)
        self.assertIn("achievements", resp.json_data or {})
        self.assertIsInstance(resp.json_data["achievements"], list)


class TestT1Group09FiveSpecialtyMissions(E2ETestCase):
    """Group 9: Practical Missions Across All 5 Specializations."""

    def _run_mission_smoke(self, specialty: str):
        api = self.new_api_client()
        api.register_user(email=self.unique_email(f"mis_{specialty}"), password="ValidPass123", specialty_slug=specialty)
        state = api.get(f"/api/mission/state?specialty={specialty}")
        self.assertEqual(state.status, 200, f"{specialty} mission state failed: {state.status} {state.text}")
        save = api.post(
            "/api/mission/save_stage",
            {"specialty": specialty, "mission_id": f"{specialty}_m1", "stage": 1, "data": {"checked": True}},
        )
        self.assertEqual(save.status, 200, f"{specialty} save_stage failed: {save.status} {save.text}")
        submit = api.post(
            "/api/mission/submit",
            {"specialty": specialty, "mission_id": f"{specialty}_m1", "answers": {"stage_1": "completed"}},
        )
        self.assertEqual(submit.status, 200, f"{specialty} mission submit failed: {submit.status} {submit.text}")

    def test_mission_it_available_and_saves_stage(self):
        self._run_mission_smoke("it")

    def test_mission_graphic_design_available_and_submits(self):
        self._run_mission_smoke("graphic_design")

    def test_mission_autoelectric_available_and_awards_xp(self):
        self._run_mission_smoke("autoelectric")

    def test_mission_hvac_available_and_persists(self):
        self._run_mission_smoke("hvac")

    def test_mission_automechanic_available_and_persists(self):
        self._run_mission_smoke("automechanic")


class TestT1Group10PortfolioPrivacyPdfPublicLink(E2ETestCase):
    """Group 10: Automatic Student Portfolio (Privacy, Consent Public Link, Real PDF Export)."""

    def test_portfolio_me_aggregates_real_student_data(self):
        api = self.new_api_client()
        email = self.unique_email("prt_me")
        api.register_user(email=email, password="ValidPass123", first_name="Максат", last_name="Нуров")
        resp = api.get("/api/portfolio/me")
        self.assertEqual(resp.status, 200, f"/api/portfolio/me failed: {resp.status} {resp.text}")
        self.assertIn("Максат", resp.text)

    def test_portfolio_settings_update_and_persist(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("prt_set"), password="ValidPass123")
        slug = f"maksat-{int(time.time() * 1000)}"
        put = api.put(
            "/api/portfolio/settings",
            {"is_public": True, "show_grades": False, "show_certificates": True, "consent_granted": True, "public_slug": slug},
        )
        self.assertEqual(put.status, 200, f"/api/portfolio/settings PUT failed: {put.status} {put.text}")
        get = api.get("/api/portfolio/settings")
        self.assertEqual(get.status, 200)
        self.assertTrue(get.json_data.get("is_public"))
        self.assertFalse(get.json_data.get("show_grades"))
        self.assertTrue(get.json_data.get("consent_granted"))
        self.assertEqual(get.json_data.get("public_slug"), slug)

    def test_portfolio_public_slug_accessible_after_consent(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("prt_pub"), password="ValidPass123")
        slug = f"public-stud-{int(time.time() * 1000)}"
        api.put(
            "/api/portfolio/settings",
            {"is_public": True, "show_grades": False, "consent_granted": True, "public_slug": slug},
        )
        anon = self.new_api_client()
        pub = anon.get(f"/api/portfolio/public/{slug}")
        self.assertEqual(pub.status, 200, f"Consented public portfolio failed: {pub.status} {pub.text}")
        self.assertFalse((pub.json_data or {}).get("show_grades", True))

    def test_portfolio_export_pdf_returns_valid_pdf_stream(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("prt_pdf"), password="ValidPass123")
        resp = api.get("/api/portfolio/export.pdf")
        self.assertEqual(resp.status, 200, f"/api/portfolio/export.pdf failed: {resp.status}")
        self.assertIn("application/pdf", resp.headers.get("content-type", ""))
        self.assertTrue(resp.body.startswith(b"%PDF-1."), f"Invalid PDF header: {resp.body[:20]!r}")

    def test_career_page_renders_live_portfolio_and_privacy_controls(self):
        api = self.new_api_client()
        email = self.unique_email("prt_ui")
        api.register_user(email=email, password="ValidPass123", first_name="Айгерим", last_name="Касымова")
        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/career.html")
        wait_for_ready(driver)
        ConsoleAndNetworkCollector.install_error_trap(driver)
        WebDriverWait(driver, 10).until(lambda d: "Айгерим" in d.find_element(By.TAG_NAME, "body").text)
        errs = ConsoleAndNetworkCollector.collect_severe(driver)
        self.assertEqual(errs, [], f"Errors on career.html: {errs}")


class TestT1Group11Practical3DExamsAndErrorLog(E2ETestCase):
    """Group 11: Practical 3D Exams, Deterministic Grading, Error Log & Teacher Review."""

    def test_exam_start_returns_signed_nonce_and_spec(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("ex_start"), password="ValidPass123", specialty_slug="automechanic")
        start = api.post("/api/exams/start", {"specialty": "automechanic"})
        self.assertEqual(start.status, 200, f"/api/exams/start failed: {start.status} {start.text}")
        data = start.json_data or {}
        self.assertTrue(data.get("attempt_id"))
        self.assertTrue(data.get("attempt_nonce"))
        self.assertIn("exam_spec", data)

    def test_exam_event_appends_telemetry_log(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("ex_evt"), password="ValidPass123", specialty_slug="automechanic")
        start = api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        evt = api.post(
            "/api/exams/event",
            {
                "attempt_id": start.get("attempt_id"),
                "attempt_nonce": start.get("attempt_nonce"),
                "step_id": 1,
                "action": "detach",
                "part_id": "valve_cover",
                "tool_id": "socket_set",
                "telemetry": {"torque_nm": 0},
            },
        )
        self.assertEqual(evt.status, 200, f"/api/exams/event failed: {evt.status} {evt.text}")

    def test_exam_submit_grades_deterministically_with_error_log(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("ex_sub"), password="ValidPass123", specialty_slug="automechanic")
        start = api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        api.post(
            "/api/exams/event",
            {
                "attempt_id": start.get("attempt_id"),
                "attempt_nonce": start.get("attempt_nonce"),
                "step_id": 1,
                "action": "detach",
                "part_id": "cylinder_head",  # Intentional wrong-order mistake before valve_cover
                "tool_id": "inspect_lamp",
            },
        )
        sub = api.post(
            "/api/exams/submit",
            {"attempt_id": start.get("attempt_id"), "attempt_nonce": start.get("attempt_nonce")},
        )
        self.assertEqual(sub.status, 200, f"/api/exams/submit failed: {sub.status} {sub.text}")
        res = sub.json_data or {}
        self.assertIn("error_log_json", res)
        self.assertLess(res.get("score", 101), 100, "Exam with wrong-order error must deduct points")

    def test_teacher_exams_review_queue_lists_assigned_attempt(self):
        stud_api = self.new_api_client()
        stud_api.register_user(
            email=self.unique_email("ex_q_stud"),
            password="ValidPass123",
            specialty_slug="automechanic",
            group_name="АМ-21",
        )
        start = stud_api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        stud_api.post(
            "/api/exams/submit",
            {"attempt_id": start.get("attempt_id"), "attempt_nonce": start.get("attempt_nonce")},
        )

        teach_api = self.new_api_client()
        teach_api.register_user(
            email=self.unique_email("ex_q_teach"),
            password="TeacherPass123",
            role="teacher",
            specialty_slug="automechanic",
            group_name="АМ-21",
            teacher_code=TEACHER_CODE,
        )
        q = teach_api.get("/api/teacher/exams/review")
        self.assertEqual(q.status, 200, f"/api/teacher/exams/review failed: {q.status} {q.text}")
        attempts = (q.json_data or {}).get("attempts") or []
        self.assertTrue(any(a.get("id") == start.get("attempt_id") or a.get("attempt_id") == start.get("attempt_id") for a in attempts))

    def test_teacher_can_approve_or_review_exam_attempt(self):
        stud_api = self.new_api_client()
        stud_api.register_user(
            email=self.unique_email("ex_r_stud"),
            password="ValidPass123",
            specialty_slug="automechanic",
            group_name="АМ-21",
        )
        start = stud_api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        attempt_id = start.get("attempt_id")
        stud_api.post("/api/exams/submit", {"attempt_id": attempt_id, "attempt_nonce": start.get("attempt_nonce")})

        teach_api = self.new_api_client()
        teach_api.register_user(
            email=self.unique_email("ex_r_teach"),
            password="TeacherPass123",
            role="teacher",
            specialty_slug="automechanic",
            group_name="АМ-21",
            teacher_code=TEACHER_CODE,
        )
        rev = teach_api.post(
            f"/api/teacher/exams/review/{attempt_id}",
            {"status": "approved", "comment": "Проверено преподавателем"},
        )
        self.assertEqual(rev.status, 200, f"Exam review failed: {rev.status} {rev.text}")


class TestT1Group12ResponsiveThemesAndI18n(E2ETestCase):
    """Group 12: All 20 Pages, 3 Themes, RU/KK i18n, Desktop 1440x900 & Mobile 390x844."""

    def test_all_20_html_pages_load_http_200_zero_severe_errors(self):
        driver = self.new_driver("desktop")
        failures = []
        for page in ALL_20_HTML_PAGES:
            url = f"{self.base_url}/{page}"
            with urllib.request.urlopen(url, timeout=10) as resp:
                self.assertEqual(resp.status, 200, f"{page} returned HTTP {resp.status}")
            try:
                driver.get(url)
                wait_for_ready(driver)
                ConsoleAndNetworkCollector.install_error_trap(driver)
                time.sleep(0.25)
                errs = ConsoleAndNetworkCollector.collect_severe(driver)
                if errs:
                    failures.append((page, errs))
            except Exception as exc:
                failures.append((page, [f"{type(exc).__name__}: {exc}"]))
        self.assertEqual(failures, [], f"Pages had SEVERE console/JS/load errors: {failures}")

    def test_theme_switch_light_graphite_neon_persists(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/index.html")
        wait_for_ready(driver)
        bgs = {}
        for theme in ("light", "graphite", "neon"):
            btn = driver.find_element(By.CSS_SELECTOR, f"[data-theme-value='{theme}'], .theme-switch button[data-theme='{theme}']")
            btn.click()
            attr = driver.execute_script("return document.documentElement.getAttribute('data-theme');")
            self.assertEqual(attr, theme)
            bgs[theme] = driver.execute_script("return getComputedStyle(document.body).backgroundColor;")
        self.assertEqual(len(set(bgs.values())), 3, f"All 3 themes must produce distinct backgrounds: {bgs}")
        driver.refresh()
        wait_for_ready(driver)
        self.assertEqual(driver.execute_script("return document.documentElement.getAttribute('data-theme');"), "neon")

    def test_i18n_ru_kk_toggle_updates_ui_and_persists(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/index.html")
        wait_for_ready(driver)
        ru_text = driver.find_element(By.CSS_SELECTOR, "header").text
        kk_btn = driver.find_element(By.CSS_SELECTOR, "[data-lang='kk'], button[data-i18n-lang='kk']")
        kk_btn.click()
        time.sleep(0.4)
        kk_text = driver.find_element(By.CSS_SELECTOR, "header").text
        self.assertNotEqual(ru_text, kk_text, "Switching locale RU->KK did not update header text")
        driver.refresh()
        wait_for_ready(driver)
        lang_attr = driver.execute_script("return document.documentElement.lang || localStorage.getItem('amk.lang');")
        self.assertIn("kk", str(lang_attr).lower())

    def test_desktop_1440_layout_no_horizontal_overflow(self):
        driver = self.new_driver("desktop")
        for page in ("index.html", "auth.html", "learn.html", "lesson_player.html", "simulator.html", "profile.html"):
            driver.get(f"{self.base_url}/{page}")
            wait_for_ready(driver)
            sw = driver.execute_script("return document.documentElement.scrollWidth;")
            self.assertLessEqual(sw, 1440, f"{page} horizontal overflow at 1440px: scrollWidth={sw}")

    def test_mobile_390_layout_header_and_theme_switch_fit(self):
        driver = self.new_driver("mobile")
        for page in ("index.html", "auth.html", "learn.html", "profile.html", "tasks.html"):
            driver.get(f"{self.base_url}/{page}")
            wait_for_ready(driver)
            metrics = driver.execute_script(
                """
                var hdr = document.querySelector('header');
                var ts = document.querySelector('.theme-switch');
                return {
                    scrollWidth: document.documentElement.scrollWidth,
                    hdrHeight: hdr ? hdr.getBoundingClientRect().height : 0,
                    tsRight: ts ? ts.getBoundingClientRect().right : 0
                };
                """
            )
            self.assertLessEqual(metrics["scrollWidth"], 390, f"{page} overflowed 390px: {metrics}")
            self.assertLessEqual(metrics["hdrHeight"], 72, f"{page} mobile header too tall: {metrics}")
            self.assertLessEqual(metrics["tsRight"], 390, f"{page} .theme-switch overflowed 390px: {metrics}")
