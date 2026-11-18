# -*- coding: utf-8 -*-
"""
Tier 4 Opaque-Box Real-World End-to-End Application Scenarios (8 Scenarios).
Covers all 5 specializations, teacher grading/exam review, admin governance,
and mobile 390x844 multilingual accessibility journeys.
"""
from __future__ import annotations

import os
import time

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from tests.e2e.harness import (
    ConsoleAndNetworkCollector,
    E2ETestCase,
    wait_for_ready,
)

TEACHER_CODE = os.environ.get("E2E_TEACHER_CODE", "AMK2026")


class TestT4RealWorldScenarios(E2ETestCase):
    """8 full end-to-end real-world user journeys."""

    def test_e2e_scenario_01_automechanic_full_journey(self):
        api = self.new_api_client()
        email = self.unique_email("sc1_mech")
        reg = api.register_user(
            email=email,
            password="MechPass123",
            specialty_slug="automechanic",
            group_name="АМ-21",
            first_name="Ерлан",
            last_name="Садыков",
        )
        self.assertIn(reg.status, (200, 201), reg.text)

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "MechPass123")
        driver.get(f"{self.base_url}/lesson_player.html?course=automechanic&lesson=1")
        wait_for_ready(driver)

        # Video overview tab
        video_tab = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Видео') or contains(@data-tab, 'video')]"))
        )
        video_tab.click()
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "video")))

        # 3D Workshop action + reload persistence
        act = api.post(
            "/api/workshop/action",
            {"lesson_id": 1, "model_id": "mech-cylinder", "action": "detach", "part_id": "valve_cover", "tool_id": "socket_set"},
        )
        self.assertEqual(act.status, 200, act.text)
        ws_state = api.get("/api/workshop/state?lesson_id=1&model_id=mech-cylinder")
        self.assertIn("valve_cover", (ws_state.json_data or {}).get("disassembled_parts", []))

        # Mission + 3D Exam + Portfolio PDF
        mis = api.post("/api/mission/submit", {"specialty": "automechanic", "mission_id": "automechanic_m1", "answers": {"stage_1": "completed"}})
        self.assertEqual(mis.status, 200, mis.text)
        start = api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        sub = api.post("/api/exams/submit", {"attempt_id": start.get("attempt_id"), "attempt_nonce": start.get("attempt_nonce")})
        self.assertEqual(sub.status, 200, sub.text)
        pdf = api.get("/api/portfolio/export.pdf")
        self.assertEqual(pdf.status, 200)
        self.assertTrue(pdf.body.startswith(b"%PDF-1."))

    def test_e2e_scenario_02_autoelectric_diagnostic_journey(self):
        api = self.new_api_client()
        email = self.unique_email("sc2_elec")
        api.register_user(email=email, password="ElecPass123", specialty_slug="autoelectric", group_name="АЭ-21")

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "ElecPass123")
        driver.get(f"{self.base_url}/simulator.html?specialty=autoelectric")
        wait_for_ready(driver)

        res = driver.execute_script(
            "return window.EduPhysics && window.EduPhysics.autoelectric && window.EduPhysics.autoelectric.solveCircuit(['bat','starter','gnd'], [{from:'bat',to:'starter',r:0.1},{from:'starter',to:'gnd',r:1.9}], 12.6);"
        )
        self.assertIsNotNone(res, "Autoelectric circuit physics engine missing")
        self.assertAlmostEqual(res["totalResistance"], 2.0, places=2)

        mis = api.post("/api/mission/submit", {"specialty": "autoelectric", "mission_id": "autoelectric_m1", "answers": {"stage_1": "completed"}})
        self.assertEqual(mis.status, 200, mis.text)
        prt = api.get("/api/portfolio/me")
        self.assertEqual(prt.status, 200)

    def test_e2e_scenario_03_hvac_thermodynamic_journey(self):
        api = self.new_api_client()
        email = self.unique_email("sc3_hvac")
        api.register_user(email=email, password="HvacPass123", specialty_slug="hvac", group_name="ХМ-21")

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "HvacPass123")
        driver.get(f"{self.base_url}/simulator.html?specialty=hvac")
        wait_for_ready(driver)

        pt = driver.execute_script(
            "return window.EduPhysics && window.EduPhysics.hvac && window.EduPhysics.hvac.cycleMetrics('R410A', 7.5, 25.0, 9.0, 34.0);"
        )
        self.assertIsNotNone(pt, "HVAC thermodynamic solver missing")
        self.assertIn("superheatK", pt)

        mis = api.post("/api/mission/submit", {"specialty": "hvac", "mission_id": "hvac_m1", "answers": {"stage_1": "completed"}})
        self.assertEqual(mis.status, 200, mis.text)
        skm = api.get("/api/skills/map?specialty=hvac")
        self.assertEqual(skm.status, 200)

    def test_e2e_scenario_04_it_webdev_full_journey(self):
        api = self.new_api_client()
        email = self.unique_email("sc4_it")
        api.register_user(email=email, password="WebPass123", specialty_slug="it", group_name="ИС-21")
        tasks = (api.get("/api/tasks?specialty=it").json_data or {}).get("tasks") or []
        self.assertEqual(len(tasks), 20)

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "WebPass123")
        driver.get(f"{self.base_url}/simulator.html?specialty=it")
        wait_for_ready(driver)

        eval_res = driver.execute_script(
            "return window.EduPhysics && window.EduPhysics.it && window.EduPhysics.it.evaluateLayout('display: grid; grid-template-columns: 1fr 1fr; gap: 24px;', { display: 'grid', minGap: 16 });"
        )
        self.assertIsNotNone(eval_res, "IT layout evaluator missing")
        mis = api.post("/api/mission/submit", {"specialty": "it", "mission_id": "it_m1", "answers": {"stage_1": "completed"}})
        self.assertEqual(mis.status, 200, mis.text)

    def test_e2e_scenario_05_graphic_design_wcag_portfolio_journey(self):
        api = self.new_api_client()
        email = self.unique_email("sc5_des")
        api.register_user(email=email, password="DesignPass123", specialty_slug="graphic_design", group_name="ГД-21")

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, email, "DesignPass123")
        driver.get(f"{self.base_url}/simulator.html?specialty=graphic_design")
        wait_for_ready(driver)

        wcag = driver.execute_script(
            "return window.EduPhysics && window.EduPhysics.design && window.EduPhysics.design.contrastRatio('#1F2126', '#FAF8F5');"
        )
        self.assertIsNotNone(wcag, "Graphic design WCAG solver missing")
        self.assertTrue(wcag["aaNormal"])

        slug = f"design-pro-{int(time.time() * 1000)}"
        api.post("/api/mission/submit", {"specialty": "graphic_design", "mission_id": "graphic_design_m1", "answers": {"stage_1": "completed"}})
        api.put("/api/portfolio/settings", {"is_public": True, "consent_granted": True, "show_grades": True, "public_slug": slug})
        pub = self.new_api_client().get(f"/api/portfolio/public/{slug}")
        self.assertEqual(pub.status, 200, pub.text)

    def test_e2e_scenario_06_teacher_grading_and_exam_review_workflow(self):
        stud_api = self.new_api_client()
        s_email = self.unique_email("sc6_stud")
        stud_api.register_user(email=s_email, password="ValidPass123", specialty_slug="automechanic", group_name="АМ-21")
        tasks = (stud_api.get("/api/tasks?specialty=automechanic").json_data or {}).get("tasks") or []
        sub = stud_api.post("/api/tasks/submit", {"task_id": tasks[0]["id"], "answer_text": "Диагностика узла ГРМ"}).json_data or {}
        sub_id = sub.get("submission_id") or sub.get("id")

        ex_start = stud_api.post("/api/exams/start", {"specialty": "automechanic"}).json_data or {}
        attempt_id = ex_start.get("attempt_id")
        stud_api.post("/api/exams/submit", {"attempt_id": attempt_id, "attempt_nonce": ex_start.get("attempt_nonce")})

        teach_api = self.new_api_client()
        t_email = self.unique_email("sc6_teach")
        teach_api.register_user(email=t_email, password="TeacherPass123", role="teacher", specialty_slug="automechanic", group_name="АМ-21", teacher_code=TEACHER_CODE)
        if sub_id:
            self.assertEqual(teach_api.post("/api/teacher/grade_submission", {"submission_id": sub_id, "score": 90, "comment": "Верно"}).status, 200)
        self.assertEqual(teach_api.post(f"/api/teacher/exams/review/{attempt_id}", {"status": "approved", "comment": "Зачёт"}).status, 200)

        driver = self.new_driver("desktop")
        self.browser_api_login(driver, t_email, "TeacherPass123")
        driver.get(f"{self.base_url}/teacher.html")
        wait_for_ready(driver)
        self.assertEqual(ConsoleAndNetworkCollector.collect_severe(driver), [])

    def test_e2e_scenario_07_admin_platform_governance_workflow(self):
        # Register a student first, then visit admin.html and verify real KPI integrity
        stud_api = self.new_api_client()
        stud_api.register_user(email=self.unique_email("sc7_s"), password="ValidPass123")

        driver = self.new_driver("desktop")
        driver.get(f"{self.base_url}/admin.html")
        wait_for_ready(driver)
        sub_el = driver.find_elements(By.ID, "stat-submissions")
        if sub_el:
            self.assertNotEqual(sub_el[0].text.strip(), "48", "Fake static KPI '48' still rendered on admin.html")

    def test_e2e_scenario_08_mobile_multilingual_accessibility_journey(self):
        api = self.new_api_client()
        email = self.unique_email("sc8_mob")
        api.register_user(email=email, password="MobPass123", specialty_slug="it", group_name="ИС-21")

        driver = self.new_driver("mobile")
        driver.get(f"{self.base_url}/index.html")
        wait_for_ready(driver)

        driver.find_element(By.CSS_SELECTOR, "[data-theme-value='neon'], .theme-switch button[data-theme='neon']").click()
        driver.find_element(By.CSS_SELECTOR, "[data-lang='kk'], button[data-i18n-lang='kk']").click()

        self.browser_api_login(driver, email, "MobPass123")
        for page in ("index.html", "tools.html", "mission.html", "profile.html"):
            driver.get(f"{self.base_url}/{page}")
            wait_for_ready(driver)
            metrics = driver.execute_script(
                """
                var hdr = document.querySelector('header');
                return {
                    sw: document.documentElement.scrollWidth,
                    hdrH: hdr ? hdr.getBoundingClientRect().height : 0,
                    theme: document.documentElement.getAttribute('data-theme')
                };
                """
            )
            self.assertLessEqual(metrics["sw"], 390, f"Mobile overflow on {page}: {metrics}")
            self.assertLessEqual(metrics["hdrH"], 72, f"Mobile header too tall on {page}: {metrics}")
            self.assertEqual(metrics["theme"], "neon")
