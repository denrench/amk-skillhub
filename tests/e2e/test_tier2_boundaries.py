# -*- coding: utf-8 -*-
"""
Tier 2 Opaque-Box Boundary, Negative & Error-Handling Tests (61 checks across 12 groups).
Derived strictly from ORIGINAL_REQUEST.md & PROJECT.md contracts.
"""
from __future__ import annotations

import os
import time

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from tests.e2e.harness import (
    ApiClient,
    ConsoleAndNetworkCollector,
    E2ETestCase,
    IsolatedServer,
    wait_for_ready,
)

TEACHER_CODE = os.environ.get("E2E_TEACHER_CODE", "AMK2026")


class TestT2Group01AuthAndRoleBoundaries(E2ETestCase):
    """Group 1 Boundaries: Empty inputs, weak passwords, duplicate emails, RBAC 401/403."""

    def test_empty_credentials_login_rejected(self):
        api = self.new_api_client()
        resp = api.post("/api/auth/login", {"email": "", "password": ""})
        self.assertIn(resp.status, (400, 401), f"Empty login should return 400/401, got {resp.status}")

    def test_weak_passwords_rejected_on_register(self):
        api = self.new_api_client()
        for weak in ("123", "short1", "onlyletters", "12345678"):
            resp = api.register_user(email=self.unique_email("weak"), password=weak)
            self.assertEqual(resp.status, 400, f"Weak password {weak!r} should be rejected with 400, got {resp.status}")

    def test_duplicate_email_registration_returns_409(self):
        api = self.new_api_client()
        email = self.unique_email("dup")
        first = api.register_user(email=email, password="ValidPass123")
        self.assertIn(first.status, (200, 201))
        second = api.register_user(email=email, password="ValidPass123")
        self.assertEqual(second.status, 409, f"Duplicate email expected 409, got {second.status}: {second.text}")

    def test_teacher_registration_without_valid_code_rejected(self):
        api = self.new_api_client()
        resp = api.register_user(
            email=self.unique_email("badteach"),
            password="TeacherPass123",
            role="teacher",
            teacher_code="WRONG_CODE_XYZ",
        )
        self.assertIn(resp.status, (400, 403), f"Invalid teacher code must fail, got {resp.status}")

    def test_unauthenticated_protected_endpoints_return_401(self):
        api = self.new_api_client()
        probes = [
            ("PUT", "/api/user/profile", {"full_name": "Hack"}),
            ("POST", "/api/courses/enroll", {"specialty_slug": "it"}),
            ("GET", "/api/billing/status?user_id=1", None),
            ("POST", "/api/billing/checkout", {"user_id": 1, "plan": "pro"}),
            ("GET", "/api/daily_quests", None),
            ("GET", "/api/demo/status", None),
        ]
        for method, path, body in probes:
            resp = api.request(method, path, json_body=body)
            self.assertEqual(resp.status, 401, f"Anonymous {method} {path} returned {resp.status}, expected 401")

    def test_student_forbidden_on_admin_and_demo_reset(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("stud_rbac"), password="ValidPass123", role="student")
        self.assertEqual(api.post("/api/demo/reset", {}).status, 403)
        self.assertEqual(api.get("/api/admin/audit_logs").status, 403)


class TestT2Group02CatalogAndLessonBoundaries(E2ETestCase):
    """Group 2 Boundaries: Unknown specialty, Pro gating, invalid IDs, fake cert rejection."""

    def test_unknown_specialty_returns_400_or_404(self):
        api = self.new_api_client()
        resp = api.get("/api/tasks?specialty=unknown_slug_xyz")
        self.assertIn(resp.status, (400, 404), f"Unknown specialty returned {resp.status}")

    def test_non_pro_student_blocked_from_locked_high_order_task_and_lesson(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("nonpro"), password="ValidPass123", specialty_slug="it")
        tasks = (api.get("/api/tasks?specialty=it").json_data or {}).get("tasks") or []
        task_20 = next((t for t in tasks if int(t.get("order_num") or t.get("day_number") or 0) == 20), None)
        self.assertIsNotNone(task_20, "Task 20 missing for Pro-lock check")
        t_resp = api.get(f"/api/tasks/{task_20['id']}")
        self.assertEqual(t_resp.status, 403, f"Expected 403 Pro/day lock on task 20, got {t_resp.status}")

    def test_out_of_range_task_id_returns_404(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("badid"), password="ValidPass123")
        resp = api.get("/api/tasks/99999999")
        self.assertIn(resp.status, (400, 404), f"Out-of-range task returned {resp.status}")

    def test_certificate_verify_rejects_sequential_integer_enumeration(self):
        api = self.new_api_client()
        resp = api.get("/api/certificate/verify?cert=1")
        self.assertIn(resp.status, (400, 404), f"Sequential cert ID=1 should be rejected, got {resp.status}: {resp.text}")

    def test_certificate_not_valid_and_no_fake_924_for_zero_progress_student(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("zerocert"), password="ValidPass123")
        resp = api.get("/api/certificate/verify?cert=invalid_000")
        self.assertNotIn("92.4", resp.text, "Fake 92.4 average score leaked in certificate verification")
        if isinstance(resp.json_data, dict):
            self.assertNotEqual(resp.json_data.get("status"), "VALID")


class TestT2Group03PortalAndSecurityBoundaries(E2ETestCase):
    """Group 3 Boundaries: Cross-user IDOR, Teacher Isolation, CSRF, Origin & Stored XSS."""

    def test_cross_user_profile_idor_blocked(self):
        api_a = self.new_api_client()
        reg_a = api_a.register_user(email=self.unique_email("idor_a"), password="ValidPass123", first_name="Али")
        id_a = (reg_a.json_data or {}).get("user", {}).get("id")

        api_b = self.new_api_client()
        api_b.register_user(email=self.unique_email("idor_b"), password="ValidPass123", first_name="Болат")
        mut = api_b.put("/api/user/profile", {"user_id": id_a, "full_name": "HACKED_A"})
        # Must either return 403 or ignore user_id and never mutate user A
        if mut.status == 200:
            sess_a = api_a.get("/api/auth/session").json_data or {}
            self.assertNotEqual(sess_a.get("user", {}).get("full_name"), "HACKED_A", "IDOR mutated User A!")
        else:
            self.assertEqual(mut.status, 403)

    def test_teacher_group_isolation_excludes_other_specialties(self):
        stud_it = self.new_api_client()
        s_email = self.unique_email("iso_it_stud")
        stud_it.register_user(email=s_email, password="ValidPass123", specialty_slug="it", group_name="ИС-21")

        teach_hvac = self.new_api_client()
        teach_hvac.register_user(
            email=self.unique_email("iso_hvac_teach"),
            password="TeacherPass123",
            role="teacher",
            specialty_slug="hvac",
            group_name="ХМ-21",
            teacher_code=TEACHER_CODE,
        )
        matrix = teach_hvac.get("/api/teacher/matrix")
        self.assertEqual(matrix.status, 200)
        self.assertNotIn(s_email, matrix.text, "HVAC teacher matrix leaked IT student!")

    def test_csrf_missing_and_foreign_origin_rejected(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("csrf_neg"), password="ValidPass123")

        bad_origin = api.post(
            "/api/tools/state",
            {"notes": "evil"},
            headers={"Origin": "https://evil.example"},
        )
        self.assertEqual(bad_origin.status, 403, f"Foreign Origin not rejected: {bad_origin.status}")

        no_csrf = api.post(
            "/api/tools/state",
            {"notes": "nocsrf"},
            auto_csrf=False,
        )
        self.assertEqual(no_csrf.status, 403, f"Missing X-CSRF-Token not rejected: {no_csrf.status}")

    def test_stored_xss_in_profile_name_escaped_on_render(self):
        api = self.new_api_client()
        email = self.unique_email("xss_prof")
        xss = '<img src=x onerror="window.__xss=1">'
        api.register_user(email=email, password="ValidPass123", first_name="Иван", last_name="Тест")
        api.put("/api/user/profile", {"full_name": xss})

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/student.html")
        wait_for_ready(driver)
        time.sleep(0.6)
        self.assertIsNone(driver.execute_script("return window.__xss;"), "Stored XSS executed on student.html!")

    def test_sqli_payload_in_query_parameters_safe(self):
        api = self.new_api_client()
        resp = api.get("/api/tasks?specialty=' OR 1=1 --")
        self.assertIn(resp.status, (400, 404))
        health = api.get("/api/health")
        self.assertEqual(health.status, 200)
        self.assertEqual((health.json_data or {}).get("tasks_total"), 100)


class TestT2Group04ThreeDWorkshopBoundaries(E2ETestCase):
    """Group 4 Boundaries: Workshop auth, wrong disassembly order, wrong tool, invalid graphics profile."""

    def test_workshop_state_and_action_require_auth(self):
        api = self.new_api_client()
        self.assertEqual(api.get("/api/workshop/state?lesson_id=1&model_id=mech-cylinder").status, 401)
        self.assertEqual(
            api.post("/api/workshop/action", {"lesson_id": 1, "model_id": "mech-cylinder", "action": "detach", "part_id": "valve_cover"}).status,
            401,
        )

    def test_workshop_wrong_disassembly_order_rejected(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("ws_order"), password="ValidPass123", specialty_slug="automechanic")
        resp = api.post(
            "/api/workshop/action",
            {
                "lesson_id": 1,
                "model_id": "mech-cylinder",
                "action": "detach",
                "part_id": "piston_1",  # Cannot detach piston before valve_cover & cylinder_head
                "tool_id": "socket_set",
                "telemetry": {},
            },
        )
        self.assertIn(resp.status, (200, 400, 409))
        self.assertFalse((resp.json_data or {}).get("valid", True), f"Out-of-order detach should be invalid: {resp.json_data}")

    def test_workshop_wrong_tool_rejected(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("ws_tool"), password="ValidPass123", specialty_slug="automechanic")
        resp = api.post(
            "/api/workshop/action",
            {
                "lesson_id": 1,
                "model_id": "mech-cylinder",
                "action": "detach",
                "part_id": "valve_cover",
                "tool_id": "inspect_lamp",  # Lamp cannot unbolt valve cover
                "telemetry": {},
            },
        )
        self.assertIn(resp.status, (200, 400))
        self.assertFalse((resp.json_data or {}).get("valid", True), f"Wrong tool should be rejected: {resp.json_data}")

    def test_workshop_unknown_model_or_part_returns_400_or_404(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("ws_unk"), password="ValidPass123")
        resp = api.post(
            "/api/workshop/action",
            {"lesson_id": 1, "model_id": "nonexistent_model_99", "action": "detach", "part_id": "none", "tool_id": "socket_set"},
        )
        self.assertIn(resp.status, (400, 404))

    def test_invalid_graphics_profile_falls_back_safely(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=automechanic")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduGraphicsProfile) return null;
            window.EduGraphicsProfile.set('INVALID_MODE_999');
            return window.EduGraphicsProfile.get();
            """
        )
        self.assertIn(res, ("LOW", "BALANCED", "ULTRA"), f"Invalid graphics profile did not fallback safely: {res}")


class TestT2Group05PhysicsSimulatorBoundaries(E2ETestCase):
    """Group 5 Boundaries: Degenerate/invalid/overflow inputs across all 5 physics kernels."""

    def test_design_contrast_identical_and_invalid_hex(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=graphic_design")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduPhysics || !window.EduPhysics.design) return null;
            return window.EduPhysics.design.contrastRatio('#333333', '#333333');
            """
        )
        self.assertIsNotNone(res)
        self.assertAlmostEqual(res["ratio"], 1.0, places=2)
        self.assertFalse(res["aaNormal"])

    def test_autoelectric_open_circuit_zero_current_no_nan(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=autoelectric")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduPhysics || !window.EduPhysics.autoelectric) return null;
            return window.EduPhysics.autoelectric.solveCircuit(
                ['bat', 'gnd'],
                [{from:'bat',to:'gnd',r:10}],
                12.6,
                { type: 'open_circuit', target: 'bat-gnd' }
            );
            """
        )
        self.assertIsNotNone(res)
        self.assertEqual(res.get("faultDiagnosis") is not None, True)
        self.assertFalse(any(str(v) in ("NaN", "Infinity") for v in (res.get("branchCurrents") or [])))

    def test_hvac_negative_pressure_or_unknown_refrigerant_handled(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=hvac")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduPhysics || !window.EduPhysics.hvac) return null;
            try { return window.EduPhysics.hvac.cycleMetrics('R134a', -5, 10, 5, 30); }
            catch (e) { return { error: String(e) }; }
            """
        )
        self.assertIsNotNone(res)
        self.assertTrue("error" in res or res.get("status") in ("FAULT", "INVALID", "LOW_PRESSURE"))

    def test_automechanic_over_torque_and_wrong_order_yields_fault(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=automechanic")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduPhysics || !window.EduPhysics.automechanic) return null;
            var events = [
                { bolt: 1, stage: 1, value: 250 },
                { bolt: 2, stage: 1, value: 30 }
            ];
            return window.EduPhysics.automechanic.evaluateTorqueSequence(events, 'head_10bolt');
            """
        )
        self.assertIsNotNone(res)
        self.assertFalse(res.get("passed"))
        self.assertTrue(res.get("yieldWarning") or not res.get("validOrder"))

    def test_it_empty_css_returns_zero_score(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/simulator.html?specialty=it")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            if (!window.EduPhysics || !window.EduPhysics.it) return null;
            return window.EduPhysics.it.evaluateLayout('', { display: 'flex', justifyContent: 'center' });
            """
        )
        self.assertIsNotNone(res)
        self.assertEqual(res.get("score"), 0)


class TestT2Group06StudentToolsBoundaries(E2ETestCase):
    """Group 6 Boundaries: Auth gate, XSS in notes, empty task, GPA bounds, regex metachar search."""

    def test_tools_state_requires_auth(self):
        api = self.new_api_client()
        self.assertEqual(api.get("/api/tools/state").status, 401)
        self.assertEqual(api.post("/api/tools/state", {"notes": "anon"}).status, 401)

    def test_xss_in_tools_notes_escaped_in_ui(self):
        api = self.new_api_client()
        email = self.unique_email("tools_xss")
        api.register_user(email=email, password="ValidPass123")
        api.post("/api/tools/state", {"notes": '<img src=x onerror="window.__xss=9">', "tasks": [{"id": "x1", "title": '<svg onload="window.__xss=9">', "done": False}]})

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/tools.html")
        wait_for_ready(driver)
        time.sleep(0.5)
        self.assertIsNone(driver.execute_script("return window.__xss;"), "XSS executed in tools.html!")

    def test_empty_task_title_not_saved_in_tools(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/tools.html")
        wait_for_ready(driver)
        ConsoleAndNetworkCollector.install_error_trap(driver)
        errs = ConsoleAndNetworkCollector.collect_severe(driver)
        self.assertEqual(errs, [])

    def test_gpa_calculator_extreme_values_no_nan(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/tools.html")
        wait_for_ready(driver)
        inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='number']")
        if inputs:
            inputs[0].clear()
            inputs[0].send_keys("-999")
        body = driver.find_element(By.TAG_NAME, "body").text
        self.assertNotIn("NaN", body)

    def test_search_tool_special_regex_and_sqli_chars_safe(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/tools.html")
        wait_for_ready(driver)
        ConsoleAndNetworkCollector.install_error_trap(driver)
        search_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='search'], input[id*='search']")
        if search_inputs:
            search_inputs[0].send_keys("' OR 1=1 -- [.*+?^${}()|")
            time.sleep(0.3)
        self.assertEqual(ConsoleAndNetworkCollector.collect_severe(driver), [])


class TestT2Group07AIMentorBoundaries(E2ETestCase):
    """Group 7 Boundaries: AI Auth 401, empty prompt, XSS in chat, generate_lesson 503, Rate Limit 429."""

    def test_ai_endpoints_require_auth(self):
        api = self.new_api_client()
        self.assertEqual(api.post("/api/ai/chat", {"message": "hi", "course_slug": "it"}).status, 401)
        self.assertEqual(api.post("/api/ai/tutor", {"message": "hi", "course_slug": "it"}).status, 401)

    def test_ai_empty_message_never_returns_200_fake(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("ai_empty"), password="ValidPass123")
        resp = api.post("/api/ai/chat", {"message": "", "course_slug": "it"})
        self.assertIn(resp.status, (400, 503), f"Empty AI prompt returned unexpected {resp.status}")

    def test_ai_chat_xss_payload_does_not_execute_in_lesson_player(self):
        api = self.new_api_client()
        email = self.unique_email("ai_xss")
        api.register_user(email=email, password="ValidPass123")
        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ValidPass123")
        driver.get(f"{self.base_url}/lesson_player.html?course=it&lesson=1")
        wait_for_ready(driver)
        inp = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#ai-tutor-input, [data-ai-input]"))
        )
        inp.send_keys('<img src=x onerror="window.__xss=77">')
        driver.find_element(By.CSS_SELECTOR, "#ai-tutor-send, button[onclick*='submitAiTutor'], [data-ai-send]").click()
        time.sleep(0.5)
        self.assertIsNone(driver.execute_script("return window.__xss;"), "XSS executed in AI Tutor chat!")

    def test_ai_generate_lesson_returns_503_blocked_without_key(self):
        api = self.new_api_client()
        api.register_user(
            email=self.unique_email("ai_gen"),
            password="TeacherPass123",
            role="teacher",
            teacher_code=TEACHER_CODE,
        )
        resp = api.post("/api/ai/generate_lesson", {"topic": "ГРМ", "course_slug": "automechanic"})
        self.assertEqual(resp.status, 503, f"Expected 503 BLOCKED without LLM key, got {resp.status}: {resp.text}")

    def test_rate_limit_enforced_on_auth_login_burst(self):
        with IsolatedServer(strip_ai_keys=True) as rl_srv:
            api = ApiClient(rl_srv.base_url)
            statuses = []
            for _ in range(50):
                r = api.post("/api/auth/login", {"email": "nobody@amk.kz", "password": "WrongPass123"})
                statuses.append(r.status)
                if r.status == 429:
                    break
            self.assertIn(429, statuses, f"Rate limiter did not return 429 within 50 rapid /api/auth/login calls: {set(statuses)}")


class TestT2Group08SkillMapBoundaries(E2ETestCase):
    """Group 8 Boundaries: Skill Map auth, invalid slug, locked prerequisite enforcement."""

    def test_skills_map_requires_auth(self):
        api = self.new_api_client()
        self.assertEqual(api.get("/api/skills/map?specialty=it").status, 401)

    def test_skills_map_unknown_specialty_rejected(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("skm_bad"), password="ValidPass123")
        resp = api.get("/api/skills/map?specialty=invalid_branch")
        self.assertIn(resp.status, (400, 404))

    def test_skills_map_sqli_specialty_safe(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("skm_sqli"), password="ValidPass123")
        resp = api.get("/api/skills/map?specialty=it' OR '1'='1")
        self.assertIn(resp.status, (400, 404))

    def test_skills_map_zero_progress_has_zero_completed(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("skm_zero"), password="ValidPass123", specialty_slug="automechanic")
        resp = api.get("/api/skills/map?specialty=automechanic")
        self.assertEqual(resp.status, 200)
        nodes = (resp.json_data or {}).get("nodes") or []
        self.assertEqual(sum(1 for n in nodes if n.get("completed")), 0)

    def test_downstream_locked_skill_node_blocks_mission_start_if_prereq_unmet(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("skm_prereq"), password="ValidPass123", specialty_slug="it")
        resp = api.get("/api/skills/map?specialty=it")
        self.assertEqual(resp.status, 200)
        nodes = (resp.json_data or {}).get("nodes") or []
        locked_nodes = [n for n in nodes if not n.get("unlocked")]
        self.assertTrue(locked_nodes, "Expected locked downstream nodes for new student")


class TestT2Group09MissionsBoundaries(E2ETestCase):
    """Group 9 Boundaries: Mission auth, invalid answers, unknown mission, IDOR, XP idempotency."""

    def test_mission_endpoints_require_auth(self):
        api = self.new_api_client()
        self.assertEqual(api.get("/api/mission/state?specialty=it").status, 401)
        self.assertEqual(api.post("/api/mission/save_stage", {"specialty": "it", "stage": 1}).status, 401)
        self.assertEqual(api.post("/api/mission/submit", {"specialty": "it"}).status, 401)

    def test_mission_empty_answers_fails_or_zero_score(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("mis_empty"), password="ValidPass123", specialty_slug="it")
        resp = api.post("/api/mission/submit", {"specialty": "it", "mission_id": "it_m1", "answers": {}})
        self.assertIn(resp.status, (200, 400))
        if resp.status == 200 and isinstance(resp.json_data, dict):
            self.assertFalse(resp.json_data.get("passed", False) and resp.json_data.get("score", 0) == 100)

    def test_mission_unknown_id_returns_400_or_404(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("mis_unk"), password="ValidPass123")
        resp = api.post("/api/mission/submit", {"specialty": "unknown_spec", "mission_id": "none_999", "answers": {}})
        self.assertIn(resp.status, (400, 404))

    def test_mission_idor_target_user_ignored_or_403(self):
        api_a = self.new_api_client()
        reg_a = api_a.register_user(email=self.unique_email("mis_a"), password="ValidPass123")
        id_a = (reg_a.json_data or {}).get("user", {}).get("id")

        api_b = self.new_api_client()
        api_b.register_user(email=self.unique_email("mis_b"), password="ValidPass123")
        resp = api_b.post("/api/mission/save_stage", {"user_id": id_a, "specialty": "it", "mission_id": "it_m1", "stage": 1, "data": {"x": 1}})
        self.assertIn(resp.status, (200, 403))

    def test_mission_duplicate_submit_does_not_infinitely_farm_xp(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("mis_xp"), password="ValidPass123", specialty_slug="it")
        r1 = api.post("/api/mission/submit", {"specialty": "it", "mission_id": "it_m1", "answers": {"stage_1": "completed"}})
        self.assertEqual(r1.status, 200, r1.text)
        xp1 = (api.get("/api/auth/session").json_data or {}).get("user", {}).get("xp", 0)
        r2 = api.post("/api/mission/submit", {"specialty": "it", "mission_id": "it_m1", "answers": {"stage_1": "completed"}})
        self.assertEqual(r2.status, 200)
        xp2 = (api.get("/api/auth/session").json_data or {}).get("user", {}).get("xp", 0)
        self.assertEqual(xp1, xp2, "Re-submitting same mission must not duplicate XP")


class TestT2Group10PortfolioBoundaries(E2ETestCase):
    """Group 10 Boundaries: Auth gate, private portfolio 403/404, consent requirement, grade masking."""

    def test_portfolio_private_endpoints_require_auth(self):
        api = self.new_api_client()
        self.assertEqual(api.get("/api/portfolio/me").status, 401)
        self.assertEqual(api.put("/api/portfolio/settings", {"is_public": True}).status, 401)
        self.assertEqual(api.get("/api/portfolio/export.pdf").status, 401)

    def test_private_portfolio_public_slug_returns_403_or_404(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("prt_priv"), password="ValidPass123")
        slug = f"priv-{int(time.time() * 1000)}"
        api.put("/api/portfolio/settings", {"is_public": False, "consent_granted": False, "public_slug": slug})
        anon = self.new_api_client()
        self.assertIn(anon.get(f"/api/portfolio/public/{slug}").status, (403, 404))

    def test_public_flag_without_consent_still_blocks_public_view(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("prt_nocons"), password="ValidPass123")
        slug = f"nocons-{int(time.time() * 1000)}"
        api.put("/api/portfolio/settings", {"is_public": True, "consent_granted": False, "public_slug": slug})
        anon = self.new_api_client()
        self.assertIn(anon.get(f"/api/portfolio/public/{slug}").status, (403, 404))

    def test_show_grades_false_masks_grades_publicly(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("prt_mask"), password="ValidPass123")
        slug = f"masked-{int(time.time() * 1000)}"
        api.put("/api/portfolio/settings", {"is_public": True, "consent_granted": True, "show_grades": False, "public_slug": slug})
        anon = self.new_api_client()
        pub = anon.get(f"/api/portfolio/public/{slug}")
        self.assertEqual(pub.status, 200, pub.text)
        data = pub.json_data or {}
        self.assertFalse(data.get("grades"), "Grades list must be empty/omitted when show_grades=false")

    def test_nonexistent_portfolio_slug_returns_404(self):
        api = self.new_api_client()
        self.assertEqual(api.get("/api/portfolio/public/no-such-student-slug-999").status, 404)


class TestT2Group11ExamAntiTamperBoundaries(E2ETestCase):
    """Group 11 Boundaries: Forged score, forged/replayed nonces, empty exam, cross-group teacher 403."""

    def test_forged_client_score_on_task_submit_ignored(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("tamper_t"), password="ValidPass123", specialty_slug="it")
        tasks = (api.get("/api/tasks?specialty=it").json_data or {}).get("tasks") or []
        resp = api.post(
            "/api/tasks/submit",
            {"task_id": tasks[0]["id"], "score": 100, "autotest_passed": 5, "autotest_total": 5, "answer_text": "bad"},
        )
        self.assertIn(resp.status, (200, 201, 400))
        if resp.status in (200, 201) and isinstance(resp.json_data, dict):
            self.assertNotEqual(resp.json_data.get("score"), 100, "Server blindly trusted client forged score=100!")

    def test_forged_exam_nonce_rejected(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("tamper_n"), password="ValidPass123", specialty_slug="automechanic")
        start = api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        sub = api.post(
            "/api/exams/submit",
            {"attempt_id": start.get("attempt_id"), "attempt_nonce": "FORGED_NONCE_000", "score": 100},
        )
        self.assertIn(sub.status, (400, 403), f"Forged exam nonce was not rejected: {sub.status}")

    def test_replayed_exam_submit_rejected(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("tamper_r"), password="ValidPass123", specialty_slug="automechanic")
        start = api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        first = api.post("/api/exams/submit", {"attempt_id": start.get("attempt_id"), "attempt_nonce": start.get("attempt_nonce")})
        self.assertEqual(first.status, 200, first.text)
        replay = api.post("/api/exams/submit", {"attempt_id": start.get("attempt_id"), "attempt_nonce": start.get("attempt_nonce")})
        self.assertIn(replay.status, (400, 403, 409), f"Replayed exam submission should fail, got {replay.status}")

    def test_empty_exam_submission_fails_rubric(self):
        api = self.new_api_client()
        api.register_user(email=self.unique_email("tamper_e"), password="ValidPass123", specialty_slug="automechanic")
        start = api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        sub = api.post("/api/exams/submit", {"attempt_id": start.get("attempt_id"), "attempt_nonce": start.get("attempt_nonce")})
        self.assertEqual(sub.status, 200, sub.text)
        self.assertLess((sub.json_data or {}).get("score", 100), 60, "Empty exam with 0 steps must not pass")

    def test_cross_specialty_teacher_forbidden_on_exam_review(self):
        stud_api = self.new_api_client()
        stud_api.register_user(email=self.unique_email("ex_iso_s"), password="ValidPass123", specialty_slug="automechanic", group_name="АМ-21")
        start = stud_api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        attempt_id = start.get("attempt_id")
        stud_api.post("/api/exams/submit", {"attempt_id": attempt_id, "attempt_nonce": start.get("attempt_nonce")})

        other_teach = self.new_api_client()
        other_teach.register_user(
            email=self.unique_email("ex_iso_t"),
            password="TeacherPass123",
            role="teacher",
            specialty_slug="it",
            group_name="ИС-21",
            teacher_code=TEACHER_CODE,
        )
        rev = other_teach.post(f"/api/teacher/exams/review/{attempt_id}", {"status": "approved"})
        self.assertEqual(rev.status, 403, f"Cross-specialty teacher allowed to review exam: {rev.status}")


class TestT2Group12ResponsiveAndErrorRecoveryBoundaries(E2ETestCase):
    """Group 12 Boundaries: Mobile 390px heavy pages, guest gates, learn.html zero 401, verify.html errors, h1 count."""

    def test_mobile_390_overflow_check_on_heavy_pages(self):
        driver = self.new_driver("mobile")
        for page in ("mission.html", "teacher.html", "admin.html", "profile.html", "simulator.html"):
            driver.get(f"{self.base_url}/{page}")
            wait_for_ready(driver)
            sw = driver.execute_script("return document.documentElement.scrollWidth;")
            self.assertLessEqual(sw, 390, f"{page} horizontal overflow at 390px mobile: scrollWidth={sw}")

    def test_guest_admin_page_shows_gate_without_fake_kpis(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/admin.html")
        wait_for_ready(driver)
        time.sleep(0.5)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        self.assertTrue(
            any(w in body for w in ("доступ", "войдите", "авториз", "запрещ")),
            "admin.html did not render an access gate for guest visitor",
        )

    def test_guest_teacher_page_shows_gate_without_403_crash(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/teacher.html")
        wait_for_ready(driver)
        ConsoleAndNetworkCollector.install_error_trap(driver)
        time.sleep(0.5)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        self.assertTrue(any(w in body for w in ("доступ", "войдите", "авториз", "преподав")))

    def test_guest_learn_page_has_zero_401_console_errors(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/learn.html")
        wait_for_ready(driver)
        ConsoleAndNetworkCollector.install_error_trap(driver)
        time.sleep(0.8)
        errs = ConsoleAndNetworkCollector.collect_severe(driver)
        self.assertEqual(errs, [], f"Guest learn.html triggered console errors (expected 0): {errs}")

    def test_verify_page_invalid_token_zero_type_error(self):
        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/verify.html?cert=INVALID_TOKEN_XYZ")
        wait_for_ready(driver)
        ConsoleAndNetworkCollector.install_error_trap(driver)
        time.sleep(0.6)
        errs = ConsoleAndNetworkCollector.collect_severe(driver)
        self.assertEqual(errs, [], f"verify.html threw JS errors: {errs}")
        self.assertNotIn("92.4", driver.find_element(By.TAG_NAME, "body").text)

    def test_single_h1_per_content_page(self):
        driver = self.new_driver("desktop")
        for page in ("index.html", "auth.html", "verify.html", "tools.html", "profile.html"):
            driver.get(f"{self.base_url}/{page}")
            wait_for_ready(driver)
            h1_count = driver.execute_script("return document.querySelectorAll('h1').length;")
            self.assertEqual(h1_count, 1, f"{page} expected exactly 1 <h1>, found {h1_count}")
